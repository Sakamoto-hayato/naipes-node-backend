import prisma from '../../config/database';
import { AppError } from '../../shared/middleware/error.middleware';
import bcrypt from 'bcrypt';

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  gender?: string;
  age?: number;
  profilePicture?: string;
}

export interface UpdateSettingsDto {
  alternateCards?: boolean;
  alternateMode?: boolean;
  chatEnabled?: boolean;
  soundEnabled?: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

class UserService {
  // Get user profile by ID
  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        gender: true,
        age: true,
        profilePicture: true,
        coins: true,
        gamesPlayed: true,
        gamesWon: true,
        gamesAbandoned: true,
        points: true,
        position: true,
        tournamentsWon: true,
        alternateCards: true,
        alternateMode: true,
        chatEnabled: true,
        soundEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Calculate win rate
    const winRate = user.gamesPlayed > 0
      ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(2)
      : '0.00';

    return {
      ...user,
      winRate: parseFloat(winRate),
    };
  }

  // Get user profile by username
  async getUserByUsername(username: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        gamesPlayed: true,
        gamesWon: true,
        points: true,
        position: true,
        tournamentsWon: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const winRate = user.gamesPlayed > 0
      ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(2)
      : '0.00';

    return {
      ...user,
      winRate: parseFloat(winRate),
    };
  }

  // Update user profile
  async updateProfile(userId: string, data: UpdateProfileDto) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Validate gender if provided
    if (data.gender && !['male', 'female', 'other'].includes(data.gender)) {
      throw new AppError('Invalid gender value', 400, 'INVALID_GENDER');
    }

    // Validate age if provided
    if (data.age !== undefined && (data.age < 13 || data.age > 120)) {
      throw new AppError('Age must be between 13 and 120', 400, 'INVALID_AGE');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        age: data.age,
        profilePicture: data.profilePicture,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        gender: true,
        age: true,
        profilePicture: true,
        coins: true,
        gamesPlayed: true,
        gamesWon: true,
        points: true,
        position: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  // Update game settings
  async updateSettings(userId: string, data: UpdateSettingsDto) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        alternateCards: data.alternateCards,
        alternateMode: data.alternateMode,
        chatEnabled: data.chatEnabled,
        soundEnabled: data.soundEnabled,
      },
      select: {
        id: true,
        alternateCards: true,
        alternateMode: true,
        chatEnabled: true,
        soundEnabled: true,
      },
    });

    return updatedUser;
  }

  // Change password
  async changePassword(userId: string, data: ChangePasswordDto) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401, 'INVALID_PASSWORD');
    }

    // Validate new password
    if (data.newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters', 400, 'INVALID_PASSWORD');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return { message: 'Password changed successfully' };
  }

  // Get user statistics
  async getUserStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        coins: true,
        gamesPlayed: true,
        gamesWon: true,
        gamesAbandoned: true,
        points: true,
        position: true,
        tournamentsWon: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const gamesLost = user.gamesPlayed - user.gamesWon - user.gamesAbandoned;
    const winRate = user.gamesPlayed > 0
      ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(2)
      : '0.00';

    return {
      ...user,
      gamesLost,
      winRate: parseFloat(winRate),
    };
  }

  // Get user's game history
  async getUserGameHistory(userId: string, limit: number = 20, offset: number = 0) {
    const games = await prisma.game.findMany({
      where: {
        OR: [
          { hostUserId: userId },
          { guestUserId: userId },
        ],
        status: 'finished',
      },
      orderBy: {
        finishedAt: 'desc',
      },
      take: limit,
      skip: offset,
      include: {
        hostUser: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        guestUser: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    // Format games with result info
    const formattedGames = games.map(game => {
      const isHost = game.hostUserId === userId;
      const won = game.userWonId === userId;
      const opponent = isHost ? game.guestUser : game.hostUser;
      const myScore = isHost ? game.hostScore : game.guestScore;
      const opponentScore = isHost ? game.guestScore : game.hostScore;

      return {
        id: game.id,
        opponent: opponent ? {
          id: opponent.id,
          username: opponent.username,
          profilePicture: opponent.profilePicture,
        } : null,
        myScore,
        opponentScore,
        stake: game.stake,
        level: game.level,
        isBot: game.isBot,
        won,
        createdAt: game.createdAt,
        finishedAt: game.finishedAt,
      };
    });

    return formattedGames;
  }

  // Delete user account
  async deleteAccount(userId: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Password is incorrect', 401, 'INVALID_PASSWORD');
    }

    // Soft delete by setting deletedAt
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        enabled: false,
      },
    });

    return { message: 'Account deleted successfully' };
  }
}

export default new UserService();
  // Search users by username
  async searchUsers(query: string) {
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: query,
          mode: 'insensitive',
        },
        deletedAt: null,
        enabled: true,
      },
      select: {
        id: true,
        username: true,
        profilePicture: true,
        gamesPlayed: true,
        gamesWon: true,
        points: true,
        position: true,
      },
      take: 20,
      orderBy: {
        points: 'desc',
      },
    });

    return users;
  }

  // Get user achievements
  async getUserAchievements(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Mock achievements data (TODO: Implement achievements system in database)
    const achievements = [
      {
        id: 'first_win',
        title: 'Primera Victoria',
        description: 'Gana tu primer juego',
        icon: 'trophy',
        unlockedAt: user.gamesWon > 0 ? user.createdAt.toISOString() : undefined,
        progress: Math.min(user.gamesWon, 1),
        maxProgress: 1,
      },
      {
        id: 'win_10',
        title: 'Veterano',
        description: 'Gana 10 juegos',
        icon: 'medal',
        unlockedAt: user.gamesWon >= 10 ? user.createdAt.toISOString() : undefined,
        progress: Math.min(user.gamesWon, 10),
        maxProgress: 10,
      },
      {
        id: 'win_50',
        title: 'Maestro',
        description: 'Gana 50 juegos',
        icon: 'star',
        unlockedAt: user.gamesWon >= 50 ? user.createdAt.toISOString() : undefined,
        progress: Math.min(user.gamesWon, 50),
        maxProgress: 50,
      },
      {
        id: 'win_100',
        title: 'Leyenda',
        description: 'Gana 100 juegos',
        icon: 'crown',
        unlockedAt: user.gamesWon >= 100 ? user.createdAt.toISOString() : undefined,
        progress: Math.min(user.gamesWon, 100),
        maxProgress: 100,
      },
      {
        id: 'play_100',
        title: 'Dedicado',
        description: 'Juega 100 partidas',
        icon: 'heart',
        unlockedAt: user.gamesPlayed >= 100 ? user.createdAt.toISOString() : undefined,
        progress: Math.min(user.gamesPlayed, 100),
        maxProgress: 100,
      },
      {
        id: 'tournament_win',
        title: 'Campeón de Torneo',
        description: 'Gana tu primer torneo',
        icon: 'trophy-variant',
        unlockedAt: user.tournamentsWon > 0 ? user.createdAt.toISOString() : undefined,
        progress: Math.min(user.tournamentsWon, 1),
        maxProgress: 1,
      },
    ];

    return achievements;
  }
}

export default new UserService();
