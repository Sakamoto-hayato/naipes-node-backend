"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../shared/middleware/error.middleware");
class LoungeService {
    async createLoungeGame(data) {
        const { hostUserId, bet, level, playKey } = data;
        const user = await database_1.default.user.findUnique({
            where: { id: hostUserId },
        });
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        if (user.coins < bet) {
            throw new error_middleware_1.AppError('Insufficient coins', 400, 'INSUFFICIENT_COINS');
        }
        const generatedPlayKey = playKey || null;
        const game = await database_1.default.game.create({
            data: {
                hostUserId,
                stake: bet,
                level,
                status: 'waiting',
                playKey: generatedPlayKey,
                isBot: false,
            },
            include: {
                hostUser: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                        points: true,
                    },
                },
            },
        });
        return game;
    }
    async getAvailableGames(filters) {
        const where = {
            status: 'waiting',
            playKey: null,
            guestUserId: null,
        };
        if (filters?.minBet) {
            where.stake = { ...where.stake, gte: filters.minBet };
        }
        if (filters?.maxBet) {
            where.stake = { ...where.stake, lte: filters.maxBet };
        }
        if (filters?.level) {
            where.level = filters.level;
        }
        const games = await database_1.default.game.findMany({
            where,
            include: {
                hostUser: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                        points: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return games;
    }
    async joinLoungeGame(data) {
        const { gameId, userId, playKey } = data;
        const game = await database_1.default.game.findUnique({
            where: { id: gameId },
            include: {
                hostUser: true,
            },
        });
        if (!game) {
            throw new error_middleware_1.AppError('Game not found', 404, 'GAME_NOT_FOUND');
        }
        if (game.status !== 'waiting') {
            throw new error_middleware_1.AppError('Game is not available', 400, 'GAME_NOT_AVAILABLE');
        }
        if (game.guestUserId) {
            throw new error_middleware_1.AppError('Game already has a guest', 400, 'GAME_FULL');
        }
        if (game.hostUserId === userId) {
            throw new error_middleware_1.AppError('Cannot join your own game', 400, 'CANNOT_JOIN_OWN_GAME');
        }
        if (game.playKey && game.playKey !== playKey) {
            throw new error_middleware_1.AppError('Invalid play key', 403, 'INVALID_PLAY_KEY');
        }
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        if (user.coins < game.stake) {
            throw new error_middleware_1.AppError('Insufficient coins', 400, 'INSUFFICIENT_COINS');
        }
        const updatedGame = await database_1.default.game.update({
            where: { id: gameId },
            data: {
                guestUserId: userId,
                status: 'pending',
            },
            include: {
                hostUser: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                        points: true,
                    },
                },
                guestUser: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                        points: true,
                    },
                },
            },
        });
        return updatedGame;
    }
    async cancelLoungeGame(gameId, userId) {
        const game = await database_1.default.game.findUnique({
            where: { id: gameId },
        });
        if (!game) {
            throw new error_middleware_1.AppError('Game not found', 404, 'GAME_NOT_FOUND');
        }
        if (game.hostUserId !== userId) {
            throw new error_middleware_1.AppError('Only host can cancel the game', 403, 'FORBIDDEN');
        }
        if (game.status !== 'waiting') {
            throw new error_middleware_1.AppError('Cannot cancel game in this status', 400, 'INVALID_STATUS');
        }
        await database_1.default.game.delete({
            where: { id: gameId },
        });
        return { success: true, message: 'Game cancelled' };
    }
    async leaveLoungeGame(gameId, userId) {
        const game = await database_1.default.game.findUnique({
            where: { id: gameId },
        });
        if (!game) {
            throw new error_middleware_1.AppError('Game not found', 404, 'GAME_NOT_FOUND');
        }
        if (game.status !== 'pending') {
            throw new error_middleware_1.AppError('Cannot leave game in this status', 400, 'INVALID_STATUS');
        }
        if (game.guestUserId === userId) {
            const updatedGame = await database_1.default.game.update({
                where: { id: gameId },
                data: {
                    guestUserId: null,
                    status: 'waiting',
                },
                include: {
                    hostUser: {
                        select: {
                            id: true,
                            username: true,
                            profilePicture: true,
                            points: true,
                        },
                    },
                },
            });
            return updatedGame;
        }
        if (game.hostUserId === userId) {
            return this.cancelLoungeGame(gameId, userId);
        }
        throw new error_middleware_1.AppError('You are not in this game', 403, 'FORBIDDEN');
    }
    async getGameByPlayKey(playKey) {
        const game = await database_1.default.game.findFirst({
            where: {
                playKey,
                status: 'waiting',
            },
            include: {
                hostUser: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                        points: true,
                    },
                },
            },
        });
        if (!game) {
            throw new error_middleware_1.AppError('Game not found', 404, 'GAME_NOT_FOUND');
        }
        return game;
    }
    async quickMatch(userId, bet, level) {
        const minBet = Math.floor(bet * 0.8);
        const maxBet = Math.ceil(bet * 1.2);
        const availableGames = await this.getAvailableGames({
            minBet,
            maxBet,
            level,
        });
        const suitableGames = availableGames.filter(g => g.hostUserId !== userId);
        if (suitableGames.length > 0) {
            const game = suitableGames[0];
            if (game) {
                return this.joinLoungeGame({
                    gameId: game.id,
                    userId,
                });
            }
        }
        return this.createLoungeGame({
            hostUserId: userId,
            bet,
            level,
        });
    }
    async getUserLoungeGames(userId) {
        const games = await database_1.default.game.findMany({
            where: {
                OR: [
                    { hostUserId: userId },
                    { guestUserId: userId },
                ],
                status: {
                    in: ['waiting', 'pending'],
                },
            },
            include: {
                hostUser: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                        points: true,
                    },
                },
                guestUser: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                        points: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return games;
    }
}
exports.default = new LoungeService();
//# sourceMappingURL=lounge.service.js.map