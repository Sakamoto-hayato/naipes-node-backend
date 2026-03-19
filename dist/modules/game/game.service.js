"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../shared/middleware/error.middleware");
const card_values_1 = require("./constants/card-values");
const challenge_values_1 = require("./constants/challenge-values");
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
    async startGame(gameId, _userId) {
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
                hostCards: hostCards,
                guestCards: guestCards,
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
            ? currentRound.hostCards
            : currentRound.guestCards;
        if (!playerCards.includes(card)) {
            throw new error_middleware_1.AppError('Card not in hand', 400, 'CARD_NOT_IN_HAND');
        }
        const playedCards = currentRound.tricks
            .map(t => [t.handUserCard, t.otherUserCard])
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
                ? { handUserCard: card }
                : { otherUserCard: card },
        });
        if (updatedTrick.handUserCard && updatedTrick.otherUserCard) {
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
        if (!trick || !trick.handUserCard || !trick.otherUserCard) {
            return;
        }
        const { round } = trick;
        const { game } = round;
        const comparison = (0, card_values_1.compareCards)(trick.handUserCard, trick.otherUserCard);
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
                winnerId: winnerId,
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
            if (trick.winnerId === game.hostUserId) {
                hostTricks++;
            }
            else if (trick.winnerId === game.guestUserId) {
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
                        tricks: {
                            include: {
                                challenges: { orderBy: { createdAt: 'asc' } },
                            },
                            orderBy: { trickNumber: 'asc' },
                        },
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
    async makeChallenge(data) {
        const { gameId, userId, type } = data;
        const game = await this.getGameState(gameId);
        if (!game) {
            throw new error_middleware_1.AppError('Game not found', 404, 'GAME_NOT_FOUND');
        }
        if (game.status !== 'active') {
            throw new error_middleware_1.AppError('Game is not active', 400, 'GAME_NOT_ACTIVE');
        }
        if (game.turnUserId !== userId) {
            throw new error_middleware_1.AppError('Not your turn', 400, 'NOT_YOUR_TURN');
        }
        const currentRound = game.rounds[game.rounds.length - 1];
        if (!currentRound) {
            throw new error_middleware_1.AppError('No active round', 400, 'NO_ACTIVE_ROUND');
        }
        const currentTrick = currentRound.tricks.find(t => !t.finishedAt);
        if (!currentTrick) {
            throw new error_middleware_1.AppError('No active trick', 400, 'NO_ACTIVE_TRICK');
        }
        const existingChallenges = (currentTrick.challenges || []).map(c => ({
            type: c.type,
            accepted: c.accepted
        }));
        const validation = (0, challenge_values_1.canMakeChallenge)(type, existingChallenges, currentTrick.trickNumber);
        if (!validation.allowed) {
            throw new error_middleware_1.AppError(validation.reason || 'Challenge not allowed', 400, 'CHALLENGE_NOT_ALLOWED');
        }
        const challenge = await database_1.default.challenge.create({
            data: {
                trickId: currentTrick.id,
                type,
                userId,
                accepted: null,
            },
        });
        return {
            challenge,
            game: await this.getGameState(gameId),
        };
    }
    async respondToChallenge(data) {
        const { gameId, userId, challengeId, accepted, raiseType } = data;
        const challenge = await database_1.default.challenge.findUnique({
            where: { id: challengeId },
            include: {
                trick: {
                    include: {
                        round: {
                            include: {
                                game: true,
                            },
                        },
                        challenges: true,
                    },
                },
            },
        });
        if (!challenge) {
            throw new error_middleware_1.AppError('Challenge not found', 404, 'CHALLENGE_NOT_FOUND');
        }
        if (challenge.trick.round.game.id !== gameId) {
            throw new error_middleware_1.AppError('Challenge not in this game', 400, 'INVALID_CHALLENGE');
        }
        if (challenge.accepted !== null) {
            throw new error_middleware_1.AppError('Challenge already responded to', 400, 'CHALLENGE_ALREADY_RESPONDED');
        }
        if (challenge.userId === userId) {
            throw new error_middleware_1.AppError('Cannot respond to your own challenge', 400, 'CANNOT_RESPOND_OWN_CHALLENGE');
        }
        const game = challenge.trick.round.game;
        if (game.hostUserId !== userId && game.guestUserId !== userId) {
            throw new error_middleware_1.AppError('You are not in this game', 403, 'FORBIDDEN');
        }
        if (raiseType) {
            const mappedChallenges = challenge.trick.challenges.map(c => ({
                type: c.type,
                accepted: c.accepted
            }));
            const validation = (0, challenge_values_1.canMakeChallenge)(raiseType, mappedChallenges, challenge.trick.trickNumber);
            if (!validation.allowed) {
                throw new error_middleware_1.AppError(validation.reason || 'Invalid raise', 400, 'INVALID_RAISE');
            }
            await database_1.default.challenge.update({
                where: { id: challengeId },
                data: { accepted: true },
            });
            const raiseChallenge = await database_1.default.challenge.create({
                data: {
                    trickId: challenge.trickId,
                    type: raiseType,
                    userId,
                    accepted: null,
                },
            });
            return {
                challenge: raiseChallenge,
                game: await this.getGameState(gameId),
            };
        }
        await database_1.default.challenge.update({
            where: { id: challengeId },
            data: { accepted },
        });
        if (!accepted) {
            await this.processRejectedChallenge(challenge.trick.round.id, challenge.type, challenge.userId);
        }
        return {
            challenge: { ...challenge, accepted },
            game: await this.getGameState(gameId),
        };
    }
    async processRejectedChallenge(roundId, challengeType, challengerUserId) {
        const round = await database_1.default.round.findUnique({
            where: { id: roundId },
            include: { game: true },
        });
        if (!round) {
            return;
        }
        const game = round.game;
        const isHost = game.hostUserId === challengerUserId;
        const category = (0, challenge_values_1.getChallengeCategory)(challengeType);
        const challengePoints = (0, challenge_values_1.calculateChallengePoints)([{ type: challengeType, accepted: false }], game.hostScore, game.guestScore);
        let pointsToAward = 1;
        if (category === challenge_values_1.ChallengeCategory.TRUCO) {
            if (challengeType === challenge_values_1.ChallengeType.TRUCO)
                pointsToAward = 1;
            else if (challengeType === challenge_values_1.ChallengeType.RETRUCO)
                pointsToAward = 2;
            else if (challengeType === challenge_values_1.ChallengeType.VALE_CUATRO)
                pointsToAward = 3;
        }
        else if (category === challenge_values_1.ChallengeCategory.ENVIDO) {
            pointsToAward = challengePoints.envidoPoints;
        }
        const newHostScore = isHost ? game.hostScore + pointsToAward : game.hostScore;
        const newGuestScore = !isHost ? game.guestScore + pointsToAward : game.guestScore;
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
    }
    async calculateEnvidoWinner(gameId) {
        const game = await this.getGameState(gameId);
        if (!game) {
            throw new error_middleware_1.AppError('Game not found', 404, 'GAME_NOT_FOUND');
        }
        const currentRound = game.rounds[game.rounds.length - 1];
        if (!currentRound) {
            throw new error_middleware_1.AppError('No active round', 400, 'NO_ACTIVE_ROUND');
        }
        const currentTrick = currentRound.tricks[0];
        if (!currentTrick) {
            throw new error_middleware_1.AppError('No trick found', 400, 'NO_TRICK_FOUND');
        }
        const envidoChallenges = currentTrick.challenges?.filter(c => (0, challenge_values_1.getChallengeCategory)(c.type) === challenge_values_1.ChallengeCategory.ENVIDO && c.accepted === true) || [];
        if (envidoChallenges.length === 0) {
            throw new error_middleware_1.AppError('No accepted envido challenges', 400, 'NO_ENVIDO_CHALLENGES');
        }
        const hostCards = currentRound.hostCards;
        const guestCards = currentRound.guestCards;
        const hostEnvido = (0, card_values_1.calculateEnvidoScore)(hostCards);
        const guestEnvido = (0, card_values_1.calculateEnvidoScore)(guestCards);
        const envidoWinnerId = hostEnvido > guestEnvido
            ? game.hostUserId
            : guestEnvido > hostEnvido
                ? game.guestUserId
                : currentRound.handUserId;
        const isHost = envidoWinnerId === game.hostUserId;
        const challengePoints = (0, challenge_values_1.calculateChallengePoints)(envidoChallenges.map(c => ({ type: c.type, accepted: true })), game.hostScore, game.guestScore);
        const newHostScore = isHost ? game.hostScore + challengePoints.envidoPoints : game.hostScore;
        const newGuestScore = !isHost ? game.guestScore + challengePoints.envidoPoints : game.guestScore;
        await database_1.default.game.update({
            where: { id: gameId },
            data: {
                hostScore: newHostScore,
                guestScore: newGuestScore,
            },
        });
        if (newHostScore >= 30 || newGuestScore >= 30) {
            await this.completeGame(gameId);
        }
        return {
            hostEnvido,
            guestEnvido,
            winnerId: envidoWinnerId,
            pointsAwarded: challengePoints.envidoPoints,
            game: await this.getGameState(gameId),
        };
    }
}
exports.GameService = GameService;
exports.default = new GameService();
//# sourceMappingURL=game.service.js.map