"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../shared/middleware/error.middleware");
const card_values_1 = require("./constants/card-values");
class GameService {
    async createGame(data) {
        const { hostUserId, guestUserId, bet, level, isBot } = data;
        const host = await database_1.default.user.findUnique({ where: { id: hostUserId } });
        if (!host) {
            throw new error_middleware_1.AppError('Host user not found', 404, 'USER_NOT_FOUND');
        }
        if (host.coins < bet) {
            throw new error_middleware_1.AppError('Insufficient coins', 400, 'INSUFFICIENT_COINS');
        }
        if (guestUserId && !isBot) {
            const guest = await database_1.default.user.findUnique({ where: { id: guestUserId } });
            if (!guest) {
                throw new error_middleware_1.AppError('Guest user not found', 404, 'USER_NOT_FOUND');
            }
            if (guest.coins < bet) {
                throw new error_middleware_1.AppError('Guest has insufficient coins', 400, 'GUEST_INSUFFICIENT_COINS');
            }
        }
        const game = await database_1.default.game.create({
            data: {
                hostUserId,
                guestUserId: guestUserId || null,
                stake: bet,
                level,
                status: guestUserId ? 'pending' : 'waiting',
                isBot: isBot || false,
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
                guestUser: guestUserId
                    ? {
                        select: {
                            id: true,
                            username: true,
                            profilePicture: true,
                            points: true,
                        },
                    }
                    : undefined,
            },
        });
        return game;
    }
    async startGame(gameId, userId) {
        const game = await database_1.default.game.findUnique({
            where: { id: gameId },
            include: { rounds: true },
        });
        if (!game) {
            throw new error_middleware_1.AppError('Game not found', 404, 'GAME_NOT_FOUND');
        }
        if (game.status !== 'pending' && game.status !== 'ready') {
            throw new error_middleware_1.AppError('Game already started or finished', 400, 'INVALID_GAME_STATE');
        }
        if (!game.guestUserId) {
            throw new error_middleware_1.AppError('Waiting for opponent', 400, 'NO_OPPONENT');
        }
        await database_1.default.$transaction([
            database_1.default.user.update({
                where: { id: game.hostUserId },
                data: { coins: { decrement: game.stake } },
            }),
            database_1.default.user.update({
                where: { id: game.guestUserId },
                data: { coins: { decrement: game.stake } },
            }),
            database_1.default.transaction.create({
                data: {
                    userId: game.hostUserId,
                    operation: 2,
                    amount: -game.stake,
                    gameId: game.id,
                    description: `Game bet - ${game.stake} coins`,
                },
            }),
            database_1.default.transaction.create({
                data: {
                    userId: game.guestUserId,
                    operation: 2,
                    amount: -game.stake,
                    gameId: game.id,
                    description: `Game bet - ${game.stake} coins`,
                },
            }),
        ]);
        await this.createRound(gameId, game.hostUserId);
        const updatedGame = await database_1.default.game.update({
            where: { id: gameId },
            data: {
                status: 'active',
                startedAt: new Date(),
            },
            include: {
                rounds: {
                    include: {
                        tricks: true,
                    },
                },
                hostUser: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                    },
                },
                guestUser: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                    },
                },
            },
        });
        return updatedGame;
    }
    async createRound(gameId, handUserId) {
        const game = await database_1.default.game.findUnique({
            where: { id: gameId },
            include: { rounds: { orderBy: { roundNumber: 'desc' }, take: 1 } },
        });
        if (!game) {
            throw new error_middleware_1.AppError('Game not found', 404, 'GAME_NOT_FOUND');
        }
        if (game.hostScore >= 30 || game.guestScore >= 30) {
            return null;
        }
        const lastRound = game.rounds[0];
        const roundNumber = lastRound ? lastRound.roundNumber + 1 : 1;
        const { hostCards, guestCards } = (0, card_values_1.dealCards)();
        const round = await database_1.default.round.create({
            data: {
                gameId,
                roundNumber,
                handUserId,
                hostFirstCard: hostCards[0],
                hostSecondCard: hostCards[1],
                hostThirdCard: hostCards[2],
                guestFirstCard: guestCards[0],
                guestSecondCard: guestCards[1],
                guestThirdCard: guestCards[2],
            },
        });
        await database_1.default.trick.createMany({
            data: [
                { roundId: round.id, trickNumber: 1 },
                { roundId: round.id, trickNumber: 2 },
                { roundId: round.id, trickNumber: 3 },
            ],
        });
        await database_1.default.game.update({
            where: { id: gameId },
            data: { turnUserId: handUserId },
        });
        return round;
    }
    async playCard(data) {
        const { gameId, userId, card } = data;
        if (!(0, card_values_1.isValidCard)(card)) {
            throw new error_middleware_1.AppError('Invalid card', 400, 'INVALID_CARD');
        }
        const game = await database_1.default.game.findUnique({
            where: { id: gameId },
            include: {
                rounds: {
                    where: { finishedAt: null },
                    include: {
                        tricks: {
                            where: { finishedAt: null },
                            orderBy: { trickNumber: 'asc' },
                        },
                    },
                },
            },
        });
        if (!game) {
            throw new error_middleware_1.AppError('Game not found', 404, 'GAME_NOT_FOUND');
        }
        if (game.status !== 'active') {
            throw new error_middleware_1.AppError('Game is not active', 400, 'GAME_NOT_ACTIVE');
        }
        if (game.turnUserId !== userId) {
            throw new error_middleware_1.AppError('Not your turn', 400, 'NOT_YOUR_TURN');
        }
        const currentRound = game.rounds[0];
        if (!currentRound) {
            throw new error_middleware_1.AppError('No active round', 400, 'NO_ACTIVE_ROUND');
        }
        const isHost = game.hostUserId === userId;
        const playerCards = isHost
            ? [currentRound.hostFirstCard, currentRound.hostSecondCard, currentRound.hostThirdCard]
            : [currentRound.guestFirstCard, currentRound.guestSecondCard, currentRound.guestThirdCard];
        if (!playerCards.includes(card)) {
            throw new error_middleware_1.AppError('Card not in hand', 400, 'CARD_NOT_IN_HAND');
        }
        const playedCards = currentRound.tricks
            .map(t => [t.handUserCardPlayed, t.otherUserCardPlayed])
            .flat()
            .filter(Boolean);
        if (playedCards.includes(card)) {
            throw new error_middleware_1.AppError('Card already played', 400, 'CARD_ALREADY_PLAYED');
        }
        const currentTrick = currentRound.tricks[0];
        if (!currentTrick) {
            throw new error_middleware_1.AppError('No active trick', 400, 'NO_ACTIVE_TRICK');
        }
        const isHandUser = currentRound.handUserId === userId;
        const updatedTrick = await database_1.default.trick.update({
            where: { id: currentTrick.id },
            data: isHandUser
                ? { handUserCardPlayed: card }
                : { otherUserCardPlayed: card },
        });
        if (updatedTrick.handUserCardPlayed && updatedTrick.otherUserCardPlayed) {
            await this.completeTrick(currentTrick.id);
        }
        else {
            const nextUserId = game.hostUserId === userId ? game.guestUserId : game.hostUserId;
            await database_1.default.game.update({
                where: { id: gameId },
                data: { turnUserId: nextUserId },
            });
        }
        return this.getGameState(gameId);
    }
    async completeTrick(trickId) {
        const trick = await database_1.default.trick.findUnique({
            where: { id: trickId },
            include: {
                round: {
                    include: {
                        game: true,
                        tricks: { orderBy: { trickNumber: 'asc' } },
                    },
                },
            },
        });
        if (!trick || !trick.handUserCardPlayed || !trick.otherUserCardPlayed) {
            return;
        }
        const { round } = trick;
        const { game } = round;
        const comparison = (0, card_values_1.compareCards)(trick.handUserCardPlayed, trick.otherUserCardPlayed);
        let winnerId = null;
        if (comparison > 0) {
            winnerId = round.handUserId;
        }
        else if (comparison < 0) {
            winnerId = round.handUserId === game.hostUserId ? game.guestUserId : game.hostUserId;
        }
        await database_1.default.trick.update({
            where: { id: trickId },
            data: {
                trickWinnerId: winnerId,
                finishedAt: new Date(),
            },
        });
        const allTricks = round.tricks;
        const allComplete = allTricks.every(t => t.finishedAt || t.id === trickId);
        if (allComplete) {
            await this.completeRound(round.id);
        }
        else {
            const nextTurn = winnerId || round.handUserId;
            await database_1.default.game.update({
                where: { id: game.id },
                data: { turnUserId: nextTurn },
            });
        }
    }
    async completeRound(roundId) {
        const round = await database_1.default.round.findUnique({
            where: { id: roundId },
            include: {
                game: true,
                tricks: { orderBy: { trickNumber: 'asc' } },
            },
        });
        if (!round) {
            return;
        }
        const { game, tricks } = round;
        let hostTricks = 0;
        let guestTricks = 0;
        tricks.forEach(trick => {
            if (trick.trickWinnerId === game.hostUserId) {
                hostTricks++;
            }
            else if (trick.trickWinnerId === game.guestUserId) {
                guestTricks++;
            }
        });
        let roundWinnerId = null;
        if (hostTricks > guestTricks) {
            roundWinnerId = game.hostUserId;
        }
        else if (guestTricks > hostTricks) {
            roundWinnerId = game.guestUserId;
        }
        else {
            roundWinnerId = round.handUserId;
        }
        const pointsToAdd = 1;
        const newHostScore = roundWinnerId === game.hostUserId ? game.hostScore + pointsToAdd : game.hostScore;
        const newGuestScore = roundWinnerId === game.guestUserId ? game.guestScore + pointsToAdd : game.guestScore;
        await database_1.default.round.update({
            where: { id: roundId },
            data: { finishedAt: new Date() },
        });
        await database_1.default.game.update({
            where: { id: game.id },
            data: {
                hostScore: newHostScore,
                guestScore: newGuestScore,
            },
        });
        if (newHostScore >= 30 || newGuestScore >= 30) {
            await this.completeGame(game.id);
        }
        else {
            const nextHandUserId = round.handUserId === game.hostUserId ? game.guestUserId : game.hostUserId;
            await this.createRound(game.id, nextHandUserId);
        }
    }
    async completeGame(gameId) {
        const game = await database_1.default.game.findUnique({
            where: { id: gameId },
        });
        if (!game) {
            return;
        }
        const winnerId = game.hostScore >= 30 ? game.hostUserId : game.guestUserId;
        const loserId = winnerId === game.hostUserId ? game.guestUserId : game.hostUserId;
        const winnings = game.stake * 2;
        await database_1.default.$transaction([
            database_1.default.user.update({
                where: { id: winnerId },
                data: {
                    coins: { increment: winnings },
                    gamesWon: { increment: 1 },
                    gamesPlayed: { increment: 1 },
                    points: { increment: 10 },
                },
            }),
            database_1.default.user.update({
                where: { id: loserId },
                data: {
                    gamesPlayed: { increment: 1 },
                },
            }),
            database_1.default.transaction.create({
                data: {
                    userId: winnerId,
                    operation: 3,
                    amount: winnings,
                    gameId: game.id,
                    description: `Game win - ${winnings} coins`,
                },
            }),
            database_1.default.game.update({
                where: { id: gameId },
                data: {
                    status: 'finished',
                    finishedAt: new Date(),
                    userWonId: winnerId,
                },
            }),
        ]);
        return this.getGameState(gameId);
    }
    async getGameState(gameId) {
        const game = await database_1.default.game.findUnique({
            where: { id: gameId },
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
                rounds: {
                    include: {
                        tricks: { orderBy: { trickNumber: 'asc' } },
                    },
                    orderBy: { roundNumber: 'desc' },
                },
            },
        });
        if (!game) {
            throw new error_middleware_1.AppError('Game not found', 404, 'GAME_NOT_FOUND');
        }
        return game;
    }
    async getUserGames(userId, status) {
        const where = {
            OR: [{ hostUserId: userId }, { guestUserId: userId }],
        };
        if (status) {
            where.status = status;
        }
        const games = await database_1.default.game.findMany({
            where,
            include: {
                hostUser: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                    },
                },
                guestUser: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return games;
    }
}
exports.GameService = GameService;
exports.default = new GameService();
//# sourceMappingURL=game.service.js.map