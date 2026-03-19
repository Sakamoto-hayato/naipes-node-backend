import { Request, Response } from 'express';
import messageService from './message.service';
import { successResponse, createdResponse } from '../../shared/utils/response';
import { asyncHandler, AppError } from '../../shared/middleware/error.middleware';

export class MessageController {
  // POST /api/messages - Send a message
  sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { gameId, message } = req.body;

    if (!gameId || !message) {
      throw new AppError('Game ID and message are required', 400, 'MISSING_FIELDS');
    }

    const newMessage = await messageService.sendMessage({
      userId,
      gameId,
      message,
    });

    return createdResponse(res, newMessage, 'Message sent successfully');
  });

  // GET /api/messages/game/:gameId - Get messages for a game
  getGameMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { gameId } = req.params;
    const { limit, offset } = req.query;

    if (!gameId) {
      throw new AppError('Game ID is required', 400, 'MISSING_FIELDS');
    }

    const messages = await messageService.getGameMessages(
      gameId,
      userId,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0
    );

    return successResponse(res, messages, 'Messages retrieved successfully');
  });

  // DELETE /api/messages/:id - Delete a message
  deleteMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;

    if (!id) {
      throw new AppError('Message ID is required', 400, 'MISSING_FIELDS');
    }

    const result = await messageService.deleteMessage(id, userId);
    return successResponse(res, result, 'Message deleted successfully');
  });

  // GET /api/messages/recent - Get recent messages for current user
  getRecentMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { limit } = req.query;

    const messages = await messageService.getUserRecentMessages(
      userId,
      limit ? Number(limit) : 20
    );

    return successResponse(res, messages, 'Recent messages retrieved successfully');
  });

  // DELETE /api/messages/game/:gameId/clear - Clear all messages in a game (admin)
  clearGameMessages = asyncHandler(async (req: Request, res: Response) => {
    const { gameId } = req.params;

    if (!gameId) {
      throw new AppError('Game ID is required', 400, 'MISSING_FIELDS');
    }

    const result = await messageService.clearGameMessages(gameId);
    return successResponse(res, result, 'Game messages cleared successfully');
  });
}

export default new MessageController();
