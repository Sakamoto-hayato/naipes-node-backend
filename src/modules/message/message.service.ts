import prisma from '../../config/database';
import { AppError } from '../../shared/middleware/error.middleware';

export interface SendMessageDto {
  userId: string;
  gameId: string;
  message: string;
}

class MessageService {
  // Send a message in a game
  async sendMessage(data: SendMessageDto) {
    const { userId, gameId, message } = data;

    // Validate game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new AppError('Game not found', 404, 'GAME_NOT_FOUND');
    }

    // Check if user is part of the game
    if (game.hostUserId !== userId && game.guestUserId !== userId) {
      throw new AppError('You are not part of this game', 403, 'FORBIDDEN');
    }

    // Get user to check if chat is enabled
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.chatEnabled) {
      throw new AppError('Chat is disabled for this user', 403, 'CHAT_DISABLED');
    }

    // Create message
    const newMessage = await prisma.message.create({
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

  // Get messages for a game
  async getGameMessages(gameId: string, userId: string, limit: number = 50, offset: number = 0) {
    // Validate game exists and user is part of it
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new AppError('Game not found', 404, 'GAME_NOT_FOUND');
    }

    if (game.hostUserId !== userId && game.guestUserId !== userId) {
      throw new AppError('You are not part of this game', 403, 'FORBIDDEN');
    }

    // Get messages
    const messages = await prisma.message.findMany({
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

  // Delete a message (user can delete their own messages)
  async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new AppError('Message not found', 404, 'MESSAGE_NOT_FOUND');
    }

    // Only the sender can delete their message
    if (message.userId !== userId) {
      throw new AppError('You can only delete your own messages', 403, 'FORBIDDEN');
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return { message: 'Message deleted successfully' };
  }

  // Clear all messages in a game (admin or after game ends)
  async clearGameMessages(gameId: string) {
    await prisma.message.deleteMany({
      where: { gameId },
    });

    return { message: 'All messages cleared successfully' };
  }

  // Get recent messages for a user across all games
  async getUserRecentMessages(userId: string, limit: number = 20) {
    const messages = await prisma.message.findMany({
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

export default new MessageService();
