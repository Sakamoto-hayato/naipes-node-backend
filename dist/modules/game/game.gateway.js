"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameGateway = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../../config/logger"));
const game_service_1 = __importDefault(require("./game.service"));
const error_middleware_1 = require("../../shared/middleware/error.middleware");
class GameGateway {
    io;
    constructor(io) {
        this.io = io;
        this.initialize();
    }
    initialize() {
        const gameNamespace = this.io.of('/game');
        gameNamespace.use((socket, next) => {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return next(new Error('Authentication token required'));
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.userId;
                next();
            }
            catch (error) {
                logger_1.default.error('Socket authentication failed', error);
                next(new Error('Invalid token'));
            }
        });
        gameNamespace.on('connection', (socket) => {
            logger_1.default.info(`Game socket connected: ${socket.id}, userId: ${socket.userId}`);
            socket.on('join-game', async (data) => {
                try {
                    await this.handleJoinGame(socket, data.gameId);
                }
                catch (error) {
                    this.handleError(socket, 'join-game-error', error);
                }
            });
            socket.on('leave-game', async (data) => {
                try {
                    await this.handleLeaveGame(socket, data.gameId);
                }
                catch (error) {
                    this.handleError(socket, 'leave-game-error', error);
                }
            });
            socket.on('play-card', async (data) => {
                try {
                    await this.handlePlayCard(socket, data.gameId, data.card);
                }
                catch (error) {
                    this.handleError(socket, 'play-card-error', error);
                }
            });
            socket.on('start-game', async (data) => {
                try {
                    await this.handleStartGame(socket, data.gameId);
                }
                catch (error) {
                    this.handleError(socket, 'start-game-error', error);
                }
            });
            socket.on('get-game-state', async (data) => {
                try {
                    await this.handleGetGameState(socket, data.gameId);
                }
                catch (error) {
                    this.handleError(socket, 'get-game-state-error', error);
                }
            });
            socket.on('send-challenge', async (data) => {
                try {
                    await this.handleChallenge(socket, data.gameId, data.type, data.value);
                }
                catch (error) {
                    this.handleError(socket, 'challenge-error', error);
                }
            });
            socket.on('respond-challenge', async (data) => {
                try {
                    await this.handleChallengeResponse(socket, data.gameId, data.accepted);
                }
                catch (error) {
                    this.handleError(socket, 'challenge-response-error', error);
                }
            });
            socket.on('disconnect', () => {
                logger_1.default.info(`Game socket disconnected: ${socket.id}, userId: ${socket.userId}`);
                if (socket.gameId) {
                    this.notifyGameRoom(socket.gameId, 'player-disconnected', {
                        userId: socket.userId,
                        timestamp: new Date().toISOString(),
                    });
                }
            });
        });
    }
    async handleJoinGame(socket, gameId) {
        if (!socket.userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const game = await game_service_1.default.getGameState(gameId);
        if (game.hostUserId !== socket.userId && game.guestUserId !== socket.userId) {
            throw new error_middleware_1.AppError('You are not a player in this game', 403, 'FORBIDDEN');
        }
        socket.join(`game:${gameId}`);
        socket.gameId = gameId;
        logger_1.default.info(`User ${socket.userId} joined game ${gameId}`);
        socket.to(`game:${gameId}`).emit('player-joined', {
            userId: socket.userId,
            timestamp: new Date().toISOString(),
        });
        socket.emit('game-state', {
            game,
            timestamp: new Date().toISOString(),
        });
    }
    async handleLeaveGame(socket, gameId) {
        socket.leave(`game:${gameId}`);
        if (socket.gameId === gameId) {
            socket.gameId = undefined;
        }
        logger_1.default.info(`User ${socket.userId} left game ${gameId}`);
        this.notifyGameRoom(gameId, 'player-left', {
            userId: socket.userId,
            timestamp: new Date().toISOString(),
        });
    }
    async handlePlayCard(socket, gameId, card) {
        if (!socket.userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const updatedGame = await game_service_1.default.playCard({
            gameId,
            userId: socket.userId,
            card,
        });
        this.notifyGameRoom(gameId, 'card-played', {
            userId: socket.userId,
            card,
            game: updatedGame,
            timestamp: new Date().toISOString(),
        });
        if (updatedGame.turnUserId) {
            this.notifyGameRoom(gameId, 'your-turn', {
                userId: updatedGame.turnUserId,
                timestamp: new Date().toISOString(),
            });
        }
        const currentRound = updatedGame.rounds[updatedGame.rounds.length - 1];
        const currentTrick = currentRound?.tricks.find(t => !t.finishedAt);
        if (currentTrick && currentTrick.handUserCard && currentTrick.otherUserCard) {
            this.notifyGameRoom(gameId, 'trick-completed', {
                trick: currentTrick,
                timestamp: new Date().toISOString(),
            });
        }
        if (currentRound && currentRound.finishedAt) {
            this.notifyGameRoom(gameId, 'round-completed', {
                round: currentRound,
                timestamp: new Date().toISOString(),
            });
        }
        if (updatedGame.status === 'finished') {
            this.notifyGameRoom(gameId, 'game-finished', {
                winnerId: updatedGame.userWonId,
                game: updatedGame,
                timestamp: new Date().toISOString(),
            });
        }
    }
    async handleStartGame(socket, gameId) {
        if (!socket.userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const updatedGame = await game_service_1.default.startGame(gameId, socket.userId);
        this.notifyGameRoom(gameId, 'game-started', {
            game: updatedGame,
            timestamp: new Date().toISOString(),
        });
        if (updatedGame.turnUserId) {
            this.notifyGameRoom(gameId, 'your-turn', {
                userId: updatedGame.turnUserId,
                timestamp: new Date().toISOString(),
            });
        }
    }
    async handleGetGameState(socket, gameId) {
        const game = await game_service_1.default.getGameState(gameId);
        socket.emit('game-state', {
            game,
            timestamp: new Date().toISOString(),
        });
    }
    async handleChallenge(socket, gameId, type, value) {
        if (!socket.userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        logger_1.default.info(`Challenge sent: ${type} in game ${gameId} by user ${socket.userId}`, { value });
        socket.to(`game:${gameId}`).emit('challenge-received', {
            userId: socket.userId,
            type,
            value,
            timestamp: new Date().toISOString(),
        });
    }
    async handleChallengeResponse(socket, gameId, accepted) {
        if (!socket.userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        logger_1.default.info(`Challenge response: ${accepted ? 'accepted' : 'rejected'} in game ${gameId} by user ${socket.userId}`);
        this.notifyGameRoom(gameId, 'challenge-response', {
            userId: socket.userId,
            accepted,
            timestamp: new Date().toISOString(),
        });
    }
    notifyGameRoom(gameId, event, data) {
        this.io.of('/game').to(`game:${gameId}`).emit(event, data);
    }
    handleError(socket, event, error) {
        logger_1.default.error(`Socket error on ${event}:`, error);
        const message = error instanceof error_middleware_1.AppError
            ? error.message
            : error instanceof Error
                ? error.message
                : 'An error occurred';
        const code = error instanceof error_middleware_1.AppError ? error.statusCode : 500;
        socket.emit(event, {
            success: false,
            message,
            code,
            timestamp: new Date().toISOString(),
        });
    }
}
exports.GameGateway = GameGateway;
exports.default = GameGateway;
//# sourceMappingURL=game.gateway.js.map