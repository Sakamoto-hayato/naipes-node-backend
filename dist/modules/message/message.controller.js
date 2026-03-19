"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageController = void 0;
const message_service_1 = __importDefault(require("./message.service"));
const response_1 = require("../../shared/utils/response");
const error_middleware_1 = require("../../shared/middleware/error.middleware");
class MessageController {
    sendMessage = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { gameId, message } = req.body;
        if (!gameId || !message) {
            throw new error_middleware_1.AppError('Game ID and message are required', 400, 'MISSING_FIELDS');
        }
        const newMessage = await message_service_1.default.sendMessage({
            userId,
            gameId,
            message,
        });
        return (0, response_1.createdResponse)(res, newMessage, 'Message sent successfully');
    });
    getGameMessages = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { gameId } = req.params;
        const { limit, offset } = req.query;
        if (!gameId) {
            throw new error_middleware_1.AppError('Game ID is required', 400, 'MISSING_FIELDS');
        }
        const messages = await message_service_1.default.getGameMessages(gameId, userId, limit ? Number(limit) : 50, offset ? Number(offset) : 0);
        return (0, response_1.successResponse)(res, messages, 'Messages retrieved successfully');
    });
    deleteMessage = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { id } = req.params;
        if (!id) {
            throw new error_middleware_1.AppError('Message ID is required', 400, 'MISSING_FIELDS');
        }
        const result = await message_service_1.default.deleteMessage(id, userId);
        return (0, response_1.successResponse)(res, result, 'Message deleted successfully');
    });
    getRecentMessages = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { limit } = req.query;
        const messages = await message_service_1.default.getUserRecentMessages(userId, limit ? Number(limit) : 20);
        return (0, response_1.successResponse)(res, messages, 'Recent messages retrieved successfully');
    });
    clearGameMessages = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { gameId } = req.params;
        if (!gameId) {
            throw new error_middleware_1.AppError('Game ID is required', 400, 'MISSING_FIELDS');
        }
        const result = await message_service_1.default.clearGameMessages(gameId);
        return (0, response_1.successResponse)(res, result, 'Game messages cleared successfully');
    });
}
exports.MessageController = MessageController;
exports.default = new MessageController();
//# sourceMappingURL=message.controller.js.map