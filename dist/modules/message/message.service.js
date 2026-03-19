"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../shared/middleware/error.middleware");
class MessageService {
    async sendMessage(data) {
        const { userId, gameId, message } = data;
        const game = await database_1.default.game.findUnique({
            where: { id: gameId },
        });
        if (!game) {
            throw new error_middleware_1.AppError('Game not found', 404, 'GAME_NOT_FOUND');
        }
        if (game.hostUserId !== userId && game.guestUserId !== userId) {
            throw new error_middleware_1.AppError('You are not part of this game', 403, 'FORBIDDEN');
        }
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.chatEnabled) {
            throw new error_middleware_1.AppError('Chat is disabled for this user', 403, 'CHAT_DISABLED');
        }
        const newMessage = await database_1.default.message.create({
            data: {
                userId,
                gameId,
                text: message,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                    },
                },
            },
        });
        return newMessage;
    }
    async getGameMessages(gameId, userId, limit = 50, offset = 0) {
        const game = await database_1.default.game.findUnique({
            where: { id: gameId },
        });
        if (!game) {
            throw new error_middleware_1.AppError('Game not found', 404, 'GAME_NOT_FOUND');
        }
        if (game.hostUserId !== userId && game.guestUserId !== userId) {
            throw new error_middleware_1.AppError('You are not part of this game', 403, 'FORBIDDEN');
        }
        const messages = await database_1.default.message.findMany({
            where: {
                gameId,
            },
            orderBy: {
                createdAt: 'asc',
            },
            take: limit,
            skip: offset,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                    },
                },
            },
        });
        return messages;
    }
    async deleteMessage(messageId, userId) {
        const message = await database_1.default.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            throw new error_middleware_1.AppError('Message not found', 404, 'MESSAGE_NOT_FOUND');
        }
        if (message.userId !== userId) {
            throw new error_middleware_1.AppError('You can only delete your own messages', 403, 'FORBIDDEN');
        }
        await database_1.default.message.delete({
            where: { id: messageId },
        });
        return { message: 'Message deleted successfully' };
    }
    async clearGameMessages(gameId) {
        await database_1.default.message.deleteMany({
            where: { gameId },
        });
        return { message: 'All messages cleared successfully' };
    }
    async getUserRecentMessages(userId, limit = 20) {
        const messages = await database_1.default.message.findMany({
            where: {
                OR: [
                    { userId },
                    {
                        game: {
                            OR: [
                                { hostUserId: userId },
                                { guestUserId: userId },
                            ],
                        },
                    },
                ],
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                    },
                },
                game: {
                    select: {
                        id: true,
                        status: true,
                    },
                },
            },
        });
        return messages;
    }
}
exports.default = new MessageService();
//# sourceMappingURL=message.service.js.map