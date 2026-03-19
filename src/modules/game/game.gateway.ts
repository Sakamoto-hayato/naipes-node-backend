import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../../config/logger';
import gameService from './game.service';
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

      // Disconnect
      socket.on('disconnect', () => {
        logger.info(`Game socket disconnected: ${socket.id}, userId: ${socket.userId}`);
        if (socket.gameId) {
          this.notifyGameRoom(socket.gameId, 'player-disconnected', {
            userId: socket.userId,
            timestamp: new Date().toISOString(),
          });
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

    // If challenge was rejected or accepted, may need to check game state
    if (!accepted || (accepted && !raiseType)) {
      // Challenge resolved, send updated game state
      this.notifyGameRoom(gameId, 'game-state', {
        game: result.game,
        timestamp: new Date().toISOString(),
      });
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
