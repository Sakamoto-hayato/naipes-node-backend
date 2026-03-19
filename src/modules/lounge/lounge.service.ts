import prisma from '../../config/database';
import { AppError } from '../../shared/middleware/error.middleware';

export interface CreateLoungeGameDto {
  hostUserId: string;
  bet: number;
  level: number;
  playKey?: string;
}

export interface JoinLoungeGameDto {
  gameId: string;
  userId: string;
  playKey?: string;
}

class LoungeService {
  // Create a game in the lounge (waiting for opponent)
  async createLoungeGame(data: CreateLoungeGameDto) {
    const { hostUserId, bet, level, playKey } = data;

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: hostUserId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check if user has enough coins
    if (user.coins < bet) {
      throw new AppError('Insufficient coins', 400, 'INSUFFICIENT_COINS');
    }

    // Generate play key if provided (for private games)
    const generatedPlayKey = playKey || null;

    // Create game in waiting status
    const game = await prisma.game.create({
      data: {
        hostUserId,
        stake: bet,
        level,
        status: 'waiting',
        playKey: generatedPlayKey,
        isBot: false,
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
      },
    });

    return game;
  }

  // Get available games in lounge (public games only)
  async getAvailableGames(filters?: {
    minBet?: number;
    maxBet?: number;
    level?: number;
  }) {
    const where: any = {
      status: 'waiting',
      playKey: null, // Public games have no playKey
      guestUserId: null,
    };

    if (filters?.minBet) {
      where.stake = { ...where.stake, gte: filters.minBet };
    }

    if (filters?.maxBet) {
      where.stake = { ...where.stake, lte: filters.maxBet };
    }

    if (filters?.level) {
      where.level = filters.level;
    }

    const games = await prisma.game.findMany({
      where,
      include: {
        hostUser: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            points: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return games;
  }

  // Join a game in the lounge
  async joinLoungeGame(data: JoinLoungeGameDto) {
    const { gameId, userId, playKey } = data;

    // Get game
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        hostUser: true,
      },
    });

    if (!game) {
      throw new AppError('Game not found', 404, 'GAME_NOT_FOUND');
    }

    // Validate game status
    if (game.status !== 'waiting') {
      throw new AppError('Game is not available', 400, 'GAME_NOT_AVAILABLE');
    }

    // Check if already has guest
    if (game.guestUserId) {
      throw new AppError('Game already has a guest', 400, 'GAME_FULL');
    }

    // Check if trying to join own game
    if (game.hostUserId === userId) {
      throw new AppError('Cannot join your own game', 400, 'CANNOT_JOIN_OWN_GAME');
    }

    // Check play key for private games (games with playKey)
    if (game.playKey && game.playKey !== playKey) {
      throw new AppError('Invalid play key', 403, 'INVALID_PLAY_KEY');
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check if user has enough coins
    if (user.coins < game.stake) {
      throw new AppError('Insufficient coins', 400, 'INSUFFICIENT_COINS');
    }

    // Update game with guest
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        guestUserId: userId,
        status: 'pending', // Both players present, ready to start
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
        guestUser: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            points: true,
          },
        },
      },
    });

    return updatedGame;
  }

  // Cancel a waiting game
  async cancelLoungeGame(gameId: string, userId: string) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new AppError('Game not found', 404, 'GAME_NOT_FOUND');
    }

    // Only host can cancel
    if (game.hostUserId !== userId) {
      throw new AppError('Only host can cancel the game', 403, 'FORBIDDEN');
    }

    // Can only cancel waiting games
    if (game.status !== 'waiting') {
      throw new AppError('Cannot cancel game in this status', 400, 'INVALID_STATUS');
    }

    // Delete the game
    await prisma.game.delete({
      where: { id: gameId },
    });

    return { success: true, message: 'Game cancelled' };
  }

  // Leave a pending game (before it starts)
  async leaveLoungeGame(gameId: string, userId: string) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new AppError('Game not found', 404, 'GAME_NOT_FOUND');
    }

    // Can only leave pending games
    if (game.status !== 'pending') {
      throw new AppError('Cannot leave game in this status', 400, 'INVALID_STATUS');
    }

    // Guest can leave
    if (game.guestUserId === userId) {
      const updatedGame = await prisma.game.update({
        where: { id: gameId },
        data: {
          guestUserId: null,
          status: 'waiting',
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
        },
      });

      return updatedGame;
    }

    // Host can cancel
    if (game.hostUserId === userId) {
      return this.cancelLoungeGame(gameId, userId);
    }

    throw new AppError('You are not in this game', 403, 'FORBIDDEN');
  }

  // Get game by play key (for private games)
  async getGameByPlayKey(playKey: string) {
    const game = await prisma.game.findFirst({
      where: {
        playKey,
        status: 'waiting',
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
      },
    });

    if (!game) {
      throw new AppError('Game not found', 404, 'GAME_NOT_FOUND');
    }

    return game;
  }

  // Quick match - find or create a game with similar bet
  async quickMatch(userId: string, bet: number, level: number) {
    // Try to find an available game with similar bet (±20%)
    const minBet = Math.floor(bet * 0.8);
    const maxBet = Math.ceil(bet * 1.2);

    const availableGames = await this.getAvailableGames({
      minBet,
      maxBet,
      level,
    });

    // Filter out own games
    const suitableGames = availableGames.filter(g => g.hostUserId !== userId);

    if (suitableGames.length > 0) {
      // Join the first suitable game
      const game = suitableGames[0];
      if (game) {
        return this.joinLoungeGame({
          gameId: game.id,
          userId,
        });
      }
    }

    // No suitable game found, create new one
    return this.createLoungeGame({
      hostUserId: userId,
      bet,
      level,
    });
  }

  // Get user's waiting/pending games
  async getUserLoungeGames(userId: string) {
    const games = await prisma.game.findMany({
      where: {
        OR: [
          { hostUserId: userId },
          { guestUserId: userId },
        ],
        status: {
          in: ['waiting', 'pending'],
        },
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
        guestUser: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            points: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return games;
  }
}

export default new LoungeService();
