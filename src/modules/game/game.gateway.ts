import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../../config/logger';
import gameService from './game.service';
import botService from './services/bot.service';
import { AppError } from '../../shared/middleware/error.middleware';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  gameId?: string;
}

interface JwtPayload {
  userId: string;
  email: string;
}

export class GameGateway {
  private io: Server;
  private disconnectedPlayers: Map<string, number> = new Map(); // "userId:gameId" -> disconnect timestamp

  constructor(io: Server) {
    this.io = io;
    this.initialize();
  }

  private initialize() {
    // Create game namespace
    const gameNamespace = this.io.of('/game');

    // Middleware for authentication
    gameNamespace.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        socket.userId = decoded.userId;
        next();
      } catch (error) {
        logger.error('Socket authentication failed', error);
        next(new Error('Invalid token'));
      }
    });

    // Connection handler
    gameNamespace.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`Game socket connected: ${socket.id}, userId: ${socket.userId}`);

      // Join game room
      socket.on('join-game', async (data: { gameId: string }) => {
        try {
          await this.handleJoinGame(socket, data.gameId);
        } catch (error) {
          this.handleError(socket, 'join-game-error', error);
        }
      });

      // Leave game room
      socket.on('leave-game', async (data: { gameId: string }) => {
        try {
          await this.handleLeaveGame(socket, data.gameId);
        } catch (error) {
          this.handleError(socket, 'leave-game-error', error);
        }
      });

      // Play card
      socket.on('play-card', async (data: { gameId: string; card: string }) => {
        try {
          await this.handlePlayCard(socket, data.gameId, data.card);
        } catch (error) {
          this.handleError(socket, 'play-card-error', error);
        }
      });

      // Start game
      socket.on('start-game', async (data: { gameId: string }) => {
        try {
          await this.handleStartGame(socket, data.gameId);
        } catch (error) {
          this.handleError(socket, 'start-game-error', error);
        }
      });

      // Request game state
      socket.on('get-game-state', async (data: { gameId: string }) => {
        try {
          await this.handleGetGameState(socket, data.gameId);
        } catch (error) {
          this.handleError(socket, 'get-game-state-error', error);
        }
      });

      // Challenge events (Truco, Envido, etc.)
      socket.on('send-challenge', async (data: { gameId: string; type: string }) => {
        try {
          await this.handleChallenge(socket, data.gameId, data.type);
        } catch (error) {
          this.handleError(socket, 'challenge-error', error);
        }
      });

      socket.on('respond-challenge', async (data: { gameId: string; challengeId: string; accepted: boolean; raiseType?: string }) => {
        try {
          await this.handleChallengeResponse(socket, data.gameId, data.challengeId, data.accepted, data.raiseType);
        } catch (error) {
          this.handleError(socket, 'challenge-response-error', error);
        }
      });

      // In-game chat message
      socket.on('chat-message', async (data: { gameId: string; text: string }) => {
        try {
          await this.handleChatMessage(socket, data.gameId, data.text);
        } catch (error) {
          this.handleError(socket, 'chat-error', error);
        }
      });

      // Request active game (for reconnection without knowing gameId)
      socket.on('get-active-game', async () => {
        try {
          await this.handleGetActiveGame(socket);
        } catch (error) {
          this.handleError(socket, 'get-active-game-error', error);
        }
      });

      // Disconnect — notify room, start reconnection grace period
      socket.on('disconnect', () => {
        logger.info(`Game socket disconnected: ${socket.id}, userId: ${socket.userId}`);
        if (socket.gameId) {
          this.notifyGameRoom(socket.gameId, 'player-disconnected', {
            userId: socket.userId,
            timestamp: new Date().toISOString(),
          });

          // Store disconnect time for grace period (tracked in-memory)
          this.disconnectedPlayers.set(`${socket.userId}:${socket.gameId}`, Date.now());

          // After grace period (60 seconds), auto-forfeit if still disconnected
          setTimeout(async () => {
            const key = `${socket.userId}:${socket.gameId}`;
            if (this.disconnectedPlayers.has(key)) {
              this.disconnectedPlayers.delete(key);
              logger.info(`Player ${socket.userId} did not reconnect to game ${socket.gameId} — marking abandoned`);
              // Notify remaining player
              this.notifyGameRoom(socket.gameId!, 'player-abandoned', {
                userId: socket.userId,
                timestamp: new Date().toISOString(),
              });
            }
          }, 60000);
        }
      });
    });
  }

  // Join game room
  private async handleJoinGame(socket: AuthenticatedSocket, gameId: string) {
    if (!socket.userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    // Verify user is part of the game
    const game = await gameService.getGameState(gameId);

    if (game.hostUserId !== socket.userId && game.guestUserId !== socket.userId) {
      throw new AppError('You are not a player in this game', 403, 'FORBIDDEN');
    }

    // Join room
    socket.join(`game:${gameId}`);
    socket.gameId = gameId;

    // Clear disconnect tracking (player reconnected)
    const disconnectKey = `${socket.userId}:${gameId}`;
    if (this.disconnectedPlayers.has(disconnectKey)) {
      this.disconnectedPlayers.delete(disconnectKey);
      logger.info(`Player ${socket.userId} reconnected to game ${gameId}`);

      // Notify opponent that player reconnected
      socket.to(`game:${gameId}`).emit('player-reconnected', {
        userId: socket.userId,
        timestamp: new Date().toISOString(),
      });
    }

    logger.info(`User ${socket.userId} joined game ${gameId}`);

    // Notify others in the room
    socket.to(`game:${gameId}`).emit('player-joined', {
      userId: socket.userId,
      timestamp: new Date().toISOString(),
    });

    // Send current game state to the joining player
    socket.emit('game-state', {
      game,
      timestamp: new Date().toISOString(),
    });
  }

  // Leave game room
  private async handleLeaveGame(socket: AuthenticatedSocket, gameId: string) {
    socket.leave(`game:${gameId}`);

    if (socket.gameId === gameId) {
      socket.gameId = undefined;
    }

    logger.info(`User ${socket.userId} left game ${gameId}`);

    // Notify others
    this.notifyGameRoom(gameId, 'player-left', {
      userId: socket.userId,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle card play
  private async handlePlayCard(socket: AuthenticatedSocket, gameId: string, card: string) {
    if (!socket.userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    // Play card through service
    const updatedGame = await gameService.playCard({
      gameId,
      userId: socket.userId,
      card,
    });

    // Notify all players in the game room
    this.notifyGameRoom(gameId, 'card-played', {
      userId: socket.userId,
      card,
      game: updatedGame,
      timestamp: new Date().toISOString(),
    });

    // Notify whose turn it is
    if (updatedGame.turnUserId) {
      this.notifyGameRoom(gameId, 'your-turn', {
        userId: updatedGame.turnUserId,
        timestamp: new Date().toISOString(),
      });
    }

    const currentRound = updatedGame.rounds[updatedGame.rounds.length - 1];

    // Check if trick completed
    const currentTrick = currentRound?.tricks.find(t => !t.finishedAt);
    if (currentTrick && currentTrick.handUserCard && currentTrick.otherUserCard) {
      this.notifyGameRoom(gameId, 'trick-completed', {
        trick: currentTrick,
        timestamp: new Date().toISOString(),
      });
    }

    // Check if round completed
    if (currentRound && currentRound.finishedAt) {
      this.notifyGameRoom(gameId, 'round-completed', {
        round: currentRound,
        timestamp: new Date().toISOString(),
      });
    }

    // Check if game finished
    if (updatedGame.status === 'finished') {
      this.notifyGameRoom(gameId, 'game-finished', {
        winnerId: updatedGame.userWonId,
        game: updatedGame,
        timestamp: new Date().toISOString(),
      });
    }

    // Trigger bot turn if applicable
    await this.triggerBotTurnIfNeeded(gameId);
  }

  // Handle start game
  private async handleStartGame(socket: AuthenticatedSocket, gameId: string) {
    if (!socket.userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const updatedGame = await gameService.startGame(gameId, socket.userId);

    // Notify all players
    this.notifyGameRoom(gameId, 'game-started', {
      game: updatedGame,
      timestamp: new Date().toISOString(),
    });

    // Notify whose turn it is
    if (updatedGame.turnUserId) {
      this.notifyGameRoom(gameId, 'your-turn', {
        userId: updatedGame.turnUserId,
        timestamp: new Date().toISOString(),
      });
    }

    // Trigger bot turn if applicable
    await this.triggerBotTurnIfNeeded(gameId);
  }

  // Handle get game state
  private async handleGetGameState(socket: AuthenticatedSocket, gameId: string) {
    const game = await gameService.getGameState(gameId);

    socket.emit('game-state', {
      game,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle challenge (Truco, Envido, etc.)
  private async handleChallenge(socket: AuthenticatedSocket, gameId: string, type: string) {
    if (!socket.userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    logger.info(`Challenge sent: ${type} in game ${gameId} by user ${socket.userId}`);

    // Create challenge via service
    const result = await gameService.makeChallenge({
      gameId,
      userId: socket.userId,
      type: type as any,
    });

    // Notify all players in the room
    this.notifyGameRoom(gameId, 'challenge-received', {
      challenge: result.challenge,
      game: result.game,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle challenge response
  private async handleChallengeResponse(
    socket: AuthenticatedSocket,
    gameId: string,
    challengeId: string,
    accepted: boolean,
    raiseType?: string
  ) {
    if (!socket.userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    logger.info(`Challenge response: ${accepted ? 'accepted' : 'rejected'} in game ${gameId} by user ${socket.userId}`);

    // Respond to challenge via service
    const result = await gameService.respondToChallenge({
      gameId,
      userId: socket.userId,
      challengeId,
      accepted,
      raiseType: raiseType as any,
    });

    // Notify all players
    this.notifyGameRoom(gameId, 'challenge-response', {
      challenge: result.challenge,
      game: result.game,
      timestamp: new Date().toISOString(),
    });

    // Challenge resolved — send updated game state to all players
    if (!accepted || (accepted && !raiseType)) {
      this.notifyGameRoom(gameId, 'game-state', {
        game: result.game,
        timestamp: new Date().toISOString(),
      });

      // If envido was accepted, notify with envido result
      if (accepted && result.envidoResult) {
        this.notifyGameRoom(gameId, 'envido-result', {
          ...result.envidoResult,
          timestamp: new Date().toISOString(),
        });
      }

      // Check if game ended after challenge resolution
      if (result.game.status === 'finished') {
        this.notifyGameRoom(gameId, 'game-finished', {
          winnerId: result.game.userWonId,
          game: result.game,
          timestamp: new Date().toISOString(),
        });
      }

      // Trigger bot turn if applicable
      await this.triggerBotTurnIfNeeded(gameId);
    }
  }

  // Handle chat message
  private async handleChatMessage(socket: AuthenticatedSocket, gameId: string, text: string) {
    if (!socket.userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    if (!text || text.trim().length === 0) return;

    // Verify user is in the game
    const game = await gameService.getGameState(gameId);
    if (game.hostUserId !== socket.userId && game.guestUserId !== socket.userId) {
      throw new AppError('You are not in this game', 403, 'FORBIDDEN');
    }

    // Check if user has chat enabled (fetch user settings)
    const user = game.hostUserId === socket.userId ? game.hostUser : game.guestUser;

    // Broadcast to all players in game room
    this.notifyGameRoom(gameId, 'chat-message', {
      userId: socket.userId,
      username: user?.username || 'Unknown',
      text: text.trim().substring(0, 200), // Limit message length
      timestamp: new Date().toISOString(),
    });
  }

  // Get user's active game (for reconnection)
  private async handleGetActiveGame(socket: AuthenticatedSocket) {
    if (!socket.userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    // Find active game for this user
    const games = await gameService.getUserGames(socket.userId, 'active');
    const activeGame = games[0]; // Most recent active game

    if (activeGame) {
      // Auto-join the game room
      await this.handleJoinGame(socket, activeGame.id);
    } else {
      socket.emit('no-active-game', { timestamp: new Date().toISOString() });
    }
  }

  // Trigger bot turn if the game is a bot game and it's the bot's turn
  private async triggerBotTurnIfNeeded(gameId: string) {
    try {
      const game = await gameService.getGameState(gameId);
      if (!game || !game.isBot || game.status !== 'active') return;

      // The bot is always the guest user
      const botUserId = game.guestUserId;
      if (!botUserId || game.turnUserId !== botUserId) return;

      // Execute bot turn (async — will trigger game state updates)
      const result = await botService.executeBotTurn(gameId, botUserId);

      // After bot acts, send updated state to human player
      const updatedGame = await gameService.getGameState(gameId);
      this.notifyGameRoom(gameId, 'game-state', {
        game: updatedGame,
        timestamp: new Date().toISOString(),
      });

      if (updatedGame.status === 'finished') {
        this.notifyGameRoom(gameId, 'game-finished', {
          winnerId: updatedGame.userWonId,
          game: updatedGame,
          timestamp: new Date().toISOString(),
        });
      } else if (updatedGame.turnUserId === botUserId) {
        // Bot might need another turn (e.g., after challenge accepted)
        await this.triggerBotTurnIfNeeded(gameId);
      }
    } catch (error) {
      logger.error(`Bot trigger error for game ${gameId}:`, error);
    }
  }

  // Helper: Notify all users in a game room
  private notifyGameRoom(gameId: string, event: string, data: any) {
    this.io.of('/game').to(`game:${gameId}`).emit(event, data);
  }

  // Helper: Handle errors
  private handleError(socket: Socket, event: string, error: any) {
    logger.error(`Socket error on ${event}:`, error);

    const message = error instanceof AppError
      ? error.message
      : error instanceof Error
      ? error.message
      : 'An error occurred';

    const code = error instanceof AppError ? error.statusCode : 500;

    socket.emit(event, {
      success: false,
      message,
      code,
      timestamp: new Date().toISOString(),
    });
  }
}

export default GameGateway;
