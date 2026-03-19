"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../shared/middleware/error.middleware");
class RankingService {
    async getGlobalLeaderboard(limit = 100, offset = 0) {
        const users = await database_1.default.user.findMany({
            where: {
                deletedAt: null,
                enabled: true,
            },
            orderBy: {
                points: 'desc',
            },
            take: limit,
            skip: offset,
            select: {
                id: true,
                username: true,
                profilePicture: true,
                points: true,
                position: true,
                gamesPlayed: true,
                gamesWon: true,
                tournamentsWon: true,
            },
        });
        const leaderboard = users.map((user, index) => {
            const winRate = user.gamesPlayed > 0
                ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(2)
                : '0.00';
            return {
                ...user,
                rank: offset + index + 1,
                winRate: parseFloat(winRate),
            };
        });
        return leaderboard;
    }
    async getUserRank(userId) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                profilePicture: true,
                points: true,
                position: true,
                gamesPlayed: true,
                gamesWon: true,
                tournamentsWon: true,
            },
        });
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        const rank = await database_1.default.user.count({
            where: {
                points: {
                    gt: user.points,
                },
                deletedAt: null,
                enabled: true,
            },
        }) + 1;
        const winRate = user.gamesPlayed > 0
            ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(2)
            : '0.00';
        return {
            ...user,
            rank,
            winRate: parseFloat(winRate),
        };
    }
    async getTopPlayers(limit = 10) {
        return this.getGlobalLeaderboard(limit, 0);
    }
    async getLeaderboardNearRank(rank, range = 5) {
        const offset = Math.max(0, rank - range - 1);
        const limit = range * 2 + 1;
        return this.getGlobalLeaderboard(limit, offset);
    }
    async updateUserRankings() {
        const users = await database_1.default.user.findMany({
            where: {
                deletedAt: null,
                enabled: true,
            },
            orderBy: {
                points: 'desc',
            },
            select: {
                id: true,
                points: true,
            },
        });
        const updates = users.map((user, index) => {
            return database_1.default.user.update({
                where: { id: user.id },
                data: { position: index + 1 },
            });
        });
        await Promise.all(updates);
        return { message: 'Rankings updated successfully', totalUsers: users.length };
    }
    async getWeeklyTopPlayers(limit = 10) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const games = await database_1.default.game.findMany({
            where: {
                createdAt: {
                    gte: oneWeekAgo,
                },
                status: 'finished',
            },
            select: {
                userWonId: true,
                hostUserId: true,
                guestUserId: true,
                stake: true,
            },
        });
        const weeklyPoints = {};
        games.forEach(game => {
            if (game.userWonId) {
                weeklyPoints[game.userWonId] = (weeklyPoints[game.userWonId] || 0) + game.stake;
            }
        });
        const topUserIds = Object.entries(weeklyPoints)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([userId]) => userId);
        const users = await database_1.default.user.findMany({
            where: {
                id: {
                    in: topUserIds,
                },
            },
            select: {
                id: true,
                username: true,
                profilePicture: true,
                points: true,
                position: true,
            },
        });
        const weeklyLeaderboard = users.map((user, index) => ({
            ...user,
            rank: index + 1,
            weeklyPoints: weeklyPoints[user.id] || 0,
        }));
        weeklyLeaderboard.sort((a, b) => b.weeklyPoints - a.weeklyPoints);
        return weeklyLeaderboard;
    }
    async getTournamentWinners(limit = 20) {
        const users = await database_1.default.user.findMany({
            where: {
                tournamentsWon: {
                    gt: 0,
                },
                deletedAt: null,
                enabled: true,
            },
            orderBy: {
                tournamentsWon: 'desc',
            },
            take: limit,
            select: {
                id: true,
                username: true,
                profilePicture: true,
                points: true,
                position: true,
                tournamentsWon: true,
                gamesPlayed: true,
                gamesWon: true,
            },
        });
        return users.map((user, index) => ({
            ...user,
            rank: index + 1,
        }));
    }
}
exports.default = new RankingService();
//# sourceMappingURL=ranking.service.js.map