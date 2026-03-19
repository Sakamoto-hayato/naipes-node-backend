"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoungeController = void 0;
const lounge_service_1 = __importDefault(require("./lounge.service"));
const response_1 = require("../../shared/utils/response");
const error_middleware_1 = require("../../shared/middleware/error.middleware");
class LoungeController {
    create = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { bet, level, playKey } = req.body;
        if (!bet || !level) {
            throw new error_middleware_1.AppError('Bet and level are required', 400, 'MISSING_FIELDS');
        }
        const game = await lounge_service_1.default.createLoungeGame({
            hostUserId: userId,
            bet: Number(bet),
            level: Number(level),
            playKey,
        });
        return (0, response_1.createdResponse)(res, game, 'Game created in lounge');
    });
    getAvailable = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { minBet, maxBet, level } = req.query;
        const filters = {
            minBet: minBet ? Number(minBet) : undefined,
            maxBet: maxBet ? Number(maxBet) : undefined,
            level: level ? Number(level) : undefined,
        };
        const games = await lounge_service_1.default.getAvailableGames(filters);
        return (0, response_1.successResponse)(res, games, 'Available games retrieved');
    });
    join = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { id } = req.params;
        if (!id) {
            throw new error_middleware_1.AppError('Game ID is required', 400, 'MISSING_GAME_ID');
        }
        const { playKey } = req.body;
        const game = await lounge_service_1.default.joinLoungeGame({
            gameId: id,
            userId,
            playKey,
        });
        return (0, response_1.successResponse)(res, game, 'Joined game');
    });
    cancel = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { id } = req.params;
        if (!id) {
            throw new error_middleware_1.AppError('Game ID is required', 400, 'MISSING_GAME_ID');
        }
        const result = await lounge_service_1.default.cancelLoungeGame(id, userId);
        return (0, response_1.successResponse)(res, result, 'Game cancelled');
    });
    leave = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { id } = req.params;
        if (!id) {
            throw new error_middleware_1.AppError('Game ID is required', 400, 'MISSING_GAME_ID');
        }
        const game = await lounge_service_1.default.leaveLoungeGame(id, userId);
        return (0, response_1.successResponse)(res, game, 'Left game');
    });
    getByPlayKey = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { playKey } = req.params;
        if (!playKey) {
            throw new error_middleware_1.AppError('Play key is required', 400, 'MISSING_PLAY_KEY');
        }
        const game = await lounge_service_1.default.getGameByPlayKey(playKey);
        return (0, response_1.successResponse)(res, game, 'Game found');
    });
    quickMatch = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { bet, level } = req.body;
        if (!bet || !level) {
            throw new error_middleware_1.AppError('Bet and level are required', 400, 'MISSING_FIELDS');
        }
        const game = await lounge_service_1.default.quickMatch(userId, Number(bet), Number(level));
        return (0, response_1.successResponse)(res, game, 'Quick match complete');
    });
    getMyGames = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const games = await lounge_service_1.default.getUserLoungeGames(userId);
        return (0, response_1.successResponse)(res, games, 'Lounge games retrieved');
    });
}
exports.LoungeController = LoungeController;
exports.default = new LoungeController();
//# sourceMappingURL=lounge.controller.js.map