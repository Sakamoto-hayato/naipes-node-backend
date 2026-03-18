"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameController = void 0;
const game_service_1 = __importDefault(require("./game.service"));
const response_1 = require("../../shared/utils/response");
const error_middleware_1 = require("../../shared/middleware/error.middleware");
class GameController {
    create = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { guestUserId, bet, level, isBot } = req.body;
        const game = await game_service_1.default.createGame({
            hostUserId: userId,
            guestUserId,
            bet: Number(bet),
            level: Number(level),
            isBot,
        });
        return (0, response_1.createdResponse)(res, game, 'Game created successfully');
    });
    start = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { id } = req.params;
        if (!id) {
            throw new error_middleware_1.AppError('Game ID is required', 400, 'MISSING_GAME_ID');
        }
        const game = await game_service_1.default.startGame(id, userId);
        return (0, response_1.successResponse)(res, game, 'Game started');
    });
    playCard = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { id } = req.params;
        if (!id) {
            throw new error_middleware_1.AppError('Game ID is required', 400, 'MISSING_GAME_ID');
        }
        const { card } = req.body;
        const game = await game_service_1.default.playCard({
            gameId: id,
            userId: userId,
            card,
        });
        return (0, response_1.successResponse)(res, game, 'Card played');
    });
    getGame = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        if (!id) {
            throw new error_middleware_1.AppError('Game ID is required', 400, 'MISSING_GAME_ID');
        }
        const game = await game_service_1.default.getGameState(id);
        return (0, response_1.successResponse)(res, game, 'Game retrieved');
    });
    getMyGames = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { status } = req.query;
        const games = await game_service_1.default.getUserGames(userId, status);
        return (0, response_1.successResponse)(res, games, 'Games retrieved');
    });
}
exports.GameController = GameController;
exports.default = new GameController();
//# sourceMappingURL=game.controller.js.map