"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingController = void 0;
const ranking_service_1 = __importDefault(require("./ranking.service"));
const response_1 = require("../../shared/utils/response");
const error_middleware_1 = require("../../shared/middleware/error.middleware");
class RankingController {
    getLeaderboard = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { limit, offset } = req.query;
        const leaderboard = await ranking_service_1.default.getGlobalLeaderboard(limit ? Number(limit) : 100, offset ? Number(offset) : 0);
        return (0, response_1.successResponse)(res, leaderboard, 'Leaderboard retrieved successfully');
    });
    getMyRank = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const rank = await ranking_service_1.default.getUserRank(userId);
        return (0, response_1.successResponse)(res, rank, 'Rank retrieved successfully');
    });
    getUserRank = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { userId } = req.params;
        if (!userId) {
            throw new error_middleware_1.AppError('User ID is required', 400, 'MISSING_FIELDS');
        }
        const rank = await ranking_service_1.default.getUserRank(userId);
        return (0, response_1.successResponse)(res, rank, 'User rank retrieved successfully');
    });
    getTopPlayers = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { limit } = req.query;
        const topPlayers = await ranking_service_1.default.getTopPlayers(limit ? Number(limit) : 10);
        return (0, response_1.successResponse)(res, topPlayers, 'Top players retrieved successfully');
    });
    getNearRank = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { rank } = req.params;
        const { range } = req.query;
        if (!rank) {
            throw new error_middleware_1.AppError('Rank is required', 400, 'MISSING_FIELDS');
        }
        const leaderboard = await ranking_service_1.default.getLeaderboardNearRank(Number(rank), range ? Number(range) : 5);
        return (0, response_1.successResponse)(res, leaderboard, 'Leaderboard retrieved successfully');
    });
    getWeeklyTopPlayers = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { limit } = req.query;
        const weeklyLeaderboard = await ranking_service_1.default.getWeeklyTopPlayers(limit ? Number(limit) : 10);
        return (0, response_1.successResponse)(res, weeklyLeaderboard, 'Weekly leaderboard retrieved successfully');
    });
    getTournamentWinners = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { limit } = req.query;
        const winners = await ranking_service_1.default.getTournamentWinners(limit ? Number(limit) : 20);
        return (0, response_1.successResponse)(res, winners, 'Tournament winners retrieved successfully');
    });
    updateRankings = (0, error_middleware_1.asyncHandler)(async (_req, res) => {
        const result = await ranking_service_1.default.updateUserRankings();
        return (0, response_1.successResponse)(res, result, 'Rankings updated successfully');
    });
}
exports.RankingController = RankingController;
exports.default = new RankingController();
//# sourceMappingURL=ranking.controller.js.map