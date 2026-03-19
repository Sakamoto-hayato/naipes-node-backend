import prisma from '../../config/database';
import { AppError } from '../../shared/middleware/error.middleware';

class RankingService {
  // Get global leaderboard
  async getGlobalLeaderboard(limit: number = 100, offset: number = 0) {
    const users = await prisma.user.findMany({
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

    // Calculate win rate for each user
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

  // Get user rank
  async getUserRank(userId: string) {
    const user = await prisma.user.findUnique({
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
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Count users with more points
    const rank = await prisma.user.count({
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

  // Get top players
  async getTopPlayers(limit: number = 10) {
    return this.getGlobalLeaderboard(limit, 0);
  }

  // Get users near a specific rank
  async getLeaderboardNearRank(rank: number, range: number = 5) {
    const offset = Math.max(0, rank - range - 1);
    const limit = range * 2 + 1;

    return this.getGlobalLeaderboard(limit, offset);
  }

  // Update user rankings (admin/cron job)
  async updateUserRankings() {
    // Get all users ordered by points
    const users = await prisma.user.findMany({
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

    // Update positions in batches
    const updates = users.map((user, index) => {
      return prisma.user.update({
        where: { id: user.id },
        data: { position: index + 1 },
      });
    });

    await Promise.all(updates);

    return { message: 'Rankings updated successfully', totalUsers: users.length };
  }

  // Get weekly top players
  async getWeeklyTopPlayers(limit: number = 10) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get users who played games in the last week
    const games = await prisma.game.findMany({
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

    // Calculate weekly points
    const weeklyPoints: { [userId: string]: number } = {};

    games.forEach(game => {
      if (game.userWonId) {
        weeklyPoints[game.userWonId] = (weeklyPoints[game.userWonId] || 0) + game.stake;
      }
    });

    // Get top users
    const topUserIds = Object.entries(weeklyPoints)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([userId]) => userId);

    // Fetch user details
    const users = await prisma.user.findMany({
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

    // Combine with weekly points
    const weeklyLeaderboard = users.map((user, index) => ({
      ...user,
      rank: index + 1,
      weeklyPoints: weeklyPoints[user.id] || 0,
    }));

    // Sort by weekly points
    weeklyLeaderboard.sort((a, b) => b.weeklyPoints - a.weeklyPoints);

    return weeklyLeaderboard;
  }

  // Get tournament winners
  async getTournamentWinners(limit: number = 20) {
    const users = await prisma.user.findMany({
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

export default new RankingService();
