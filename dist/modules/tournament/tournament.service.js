"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../shared/middleware/error.middleware");
class TournamentService {
    async getAllTournaments(status, limit = 20, offset = 0) {
        const where = status ? { status } : {};
        const tournaments = await database_1.default.tournament.findMany({
            where,
            orderBy: {
                startDate: 'desc',
            },
            take: limit,
            skip: offset,
            include: {
                winner: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                    },
                },
                _count: {
                    select: {
                        participants: true,
                    },
                },
            },
        });
        return tournaments.map(tournament => ({
            ...tournament,
            participantCount: tournament._count.participants,
            _count: undefined,
        }));
    }
    async getTournamentById(tournamentId) {
        const tournament = await database_1.default.tournament.findUnique({
            where: { id: tournamentId },
            include: {
                winner: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                    },
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                profilePicture: true,
                                points: true,
                            },
                        },
                    },
                    orderBy: {
                        ranking: 'asc',
                    },
                },
            },
        });
        if (!tournament) {
            throw new error_middleware_1.AppError('Tournament not found', 404, 'TOURNAMENT_NOT_FOUND');
        }
        return tournament;
    }
    async createTournament(data) {
        const tournament = await database_1.default.tournament.create({
            data: {
                name: data.name,
                description: data.description,
                entryFee: data.entryFee,
                prizePool: data.prizePool,
                maxParticipants: data.maxParticipants,
                startDate: data.startDate,
                endDate: data.endDate,
                rules: data.rules,
                status: 'upcoming',
            },
        });
        return tournament;
    }
    async updateTournament(tournamentId, data) {
        const tournament = await database_1.default.tournament.findUnique({
            where: { id: tournamentId },
        });
        if (!tournament) {
            throw new error_middleware_1.AppError('Tournament not found', 404, 'TOURNAMENT_NOT_FOUND');
        }
        const updated = await database_1.default.tournament.update({
            where: { id: tournamentId },
            data: {
                name: data.name,
                description: data.description,
                entryFee: data.entryFee,
                prizePool: data.prizePool,
                maxParticipants: data.maxParticipants,
                startDate: data.startDate,
                endDate: data.endDate,
                status: data.status,
                rules: data.rules,
            },
        });
        return updated;
    }
    async deleteTournament(tournamentId) {
        const tournament = await database_1.default.tournament.findUnique({
            where: { id: tournamentId },
        });
        if (!tournament) {
            throw new error_middleware_1.AppError('Tournament not found', 404, 'TOURNAMENT_NOT_FOUND');
        }
        if (tournament.status === 'active') {
            throw new error_middleware_1.AppError('Cannot delete an active tournament', 400, 'TOURNAMENT_ACTIVE');
        }
        await database_1.default.tournament.delete({
            where: { id: tournamentId },
        });
        return { message: 'Tournament deleted successfully' };
    }
    async joinTournament(tournamentId, userId) {
        const tournament = await database_1.default.tournament.findUnique({
            where: { id: tournamentId },
            include: {
                _count: {
                    select: {
                        participants: true,
                    },
                },
            },
        });
        if (!tournament) {
            throw new error_middleware_1.AppError('Tournament not found', 404, 'TOURNAMENT_NOT_FOUND');
        }
        if (tournament.status !== 'upcoming') {
            throw new error_middleware_1.AppError('Tournament is not open for registration', 400, 'TOURNAMENT_NOT_OPEN');
        }
        if (tournament._count.participants >= tournament.maxParticipants) {
            throw new error_middleware_1.AppError('Tournament is full', 400, 'TOURNAMENT_FULL');
        }
        const existingParticipant = await database_1.default.tournamentParticipant.findUnique({
            where: {
                tournamentId_userId: {
                    tournamentId,
                    userId,
                },
            },
        });
        if (existingParticipant) {
            throw new error_middleware_1.AppError('You are already registered for this tournament', 400, 'ALREADY_REGISTERED');
        }
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        if (user.coins < tournament.entryFee) {
            throw new error_middleware_1.AppError('Insufficient coins', 400, 'INSUFFICIENT_COINS');
        }
        await database_1.default.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: {
                    coins: user.coins - tournament.entryFee,
                },
            });
            await tx.transaction.create({
                data: {
                    userId,
                    operation: 7,
                    amount: -tournament.entryFee,
                    balanceBefore: user.coins,
                    balanceAfter: user.coins - tournament.entryFee,
                    description: `Tournament entry fee: ${tournament.name}`,
                },
            });
            await tx.tournamentParticipant.create({
                data: {
                    tournamentId,
                    userId,
                    score: 0,
                },
            });
        });
        return { message: 'Successfully joined tournament' };
    }
    async leaveTournament(tournamentId, userId) {
        const tournament = await database_1.default.tournament.findUnique({
            where: { id: tournamentId },
        });
        if (!tournament) {
            throw new error_middleware_1.AppError('Tournament not found', 404, 'TOURNAMENT_NOT_FOUND');
        }
        if (tournament.status !== 'upcoming') {
            throw new error_middleware_1.AppError('Cannot leave tournament after it has started', 400, 'TOURNAMENT_STARTED');
        }
        const participant = await database_1.default.tournamentParticipant.findUnique({
            where: {
                tournamentId_userId: {
                    tournamentId,
                    userId,
                },
            },
        });
        if (!participant) {
            throw new error_middleware_1.AppError('You are not registered for this tournament', 400, 'NOT_REGISTERED');
        }
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        await database_1.default.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: {
                    coins: user.coins + tournament.entryFee,
                },
            });
            await tx.transaction.create({
                data: {
                    userId,
                    operation: 4,
                    amount: tournament.entryFee,
                    balanceBefore: user.coins,
                    balanceAfter: user.coins + tournament.entryFee,
                    description: `Tournament entry fee refund: ${tournament.name}`,
                },
            });
            await tx.tournamentParticipant.delete({
                where: {
                    tournamentId_userId: {
                        tournamentId,
                        userId,
                    },
                },
            });
        });
        return { message: 'Successfully left tournament' };
    }
    async getUserTournaments(userId) {
        const participants = await database_1.default.tournamentParticipant.findMany({
            where: {
                userId,
            },
            include: {
                tournament: true,
            },
            orderBy: {
                tournament: {
                    startDate: 'desc',
                },
            },
        });
        return participants.map(p => ({
            ...p.tournament,
            myScore: p.score,
            myRanking: p.ranking,
        }));
    }
    async getActiveTournaments() {
        return this.getAllTournaments('active', 20, 0);
    }
    async getUpcomingTournaments() {
        return this.getAllTournaments('upcoming', 20, 0);
    }
    async startTournament(tournamentId) {
        const tournament = await database_1.default.tournament.findUnique({
            where: { id: tournamentId },
        });
        if (!tournament) {
            throw new error_middleware_1.AppError('Tournament not found', 404, 'TOURNAMENT_NOT_FOUND');
        }
        if (tournament.status !== 'upcoming') {
            throw new error_middleware_1.AppError('Tournament cannot be started', 400, 'INVALID_STATUS');
        }
        await database_1.default.tournament.update({
            where: { id: tournamentId },
            data: {
                status: 'active',
            },
        });
        return { message: 'Tournament started successfully' };
    }
    async endTournament(tournamentId, winnerId) {
        const tournament = await database_1.default.tournament.findUnique({
            where: { id: tournamentId },
        });
        if (!tournament) {
            throw new error_middleware_1.AppError('Tournament not found', 404, 'TOURNAMENT_NOT_FOUND');
        }
        if (tournament.status !== 'active') {
            throw new error_middleware_1.AppError('Tournament is not active', 400, 'INVALID_STATUS');
        }
        await database_1.default.tournament.update({
            where: { id: tournamentId },
            data: {
                status: 'completed',
                winnerId,
            },
        });
        if (winnerId) {
            await database_1.default.user.update({
                where: { id: winnerId },
                data: {
                    tournamentsWon: {
                        increment: 1,
                    },
                },
            });
        }
        return { message: 'Tournament ended successfully' };
    }
}
exports.default = new TournamentService();
//# sourceMappingURL=tournament.service.js.map