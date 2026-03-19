import { Request, Response } from 'express';
import rankingService from './ranking.service';
import { successResponse } from '../../shared/utils/response';
import { asyncHandler, AppError } from '../../shared/middleware/error.middleware';

export class RankingController {
  // GET /api/ranking/leaderboard - Get global leaderboard
  getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
    const { limit, offset } = req.query;

    const leaderboard = await rankingService.getGlobalLeaderboard(
      limit ? Number(limit) : 100,
      offset ? Number(offset) : 0
    );

    return successResponse(res, leaderboard, 'Leaderboard retrieved successfully');
  });

  // GET /api/ranking/my-rank - Get current user's rank
  getMyRank = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const rank = await rankingService.getUserRank(userId);
    return successResponse(res, rank, 'Rank retrieved successfully');
  });

  // GET /api/ranking/user/:userId - Get specific user's rank
  getUserRank = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError('User ID is required', 400, 'MISSING_FIELDS');
    }

    const rank = await rankingService.getUserRank(userId);
    return successResponse(res, rank, 'User rank retrieved successfully');
  });

  // GET /api/ranking/top - Get top players
  getTopPlayers = asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query;

    const topPlayers = await rankingService.getTopPlayers(
      limit ? Number(limit) : 10
    );

    return successResponse(res, topPlayers, 'Top players retrieved successfully');
  });

  // GET /api/ranking/near/:rank - Get leaderboard near a specific rank
  getNearRank = asyncHandler(async (req: Request, res: Response) => {
    const { rank } = req.params;
    const { range } = req.query;

    if (!rank) {
      throw new AppError('Rank is required', 400, 'MISSING_FIELDS');
    }

    const leaderboard = await rankingService.getLeaderboardNearRank(
      Number(rank),
      range ? Number(range) : 5
    );

    return successResponse(res, leaderboard, 'Leaderboard retrieved successfully');
  });

  // GET /api/ranking/weekly - Get weekly top players
  getWeeklyTopPlayers = asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query;

    const weeklyLeaderboard = await rankingService.getWeeklyTopPlayers(
      limit ? Number(limit) : 10
    );

    return successResponse(res, weeklyLeaderboard, 'Weekly leaderboard retrieved successfully');
  });

  // GET /api/ranking/tournament-winners - Get tournament winners
  getTournamentWinners = asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query;

    const winners = await rankingService.getTournamentWinners(
      limit ? Number(limit) : 20
    );

    return successResponse(res, winners, 'Tournament winners retrieved successfully');
  });

  // POST /api/ranking/update - Update rankings (admin)
  updateRankings = asyncHandler(async (_req: Request, res: Response) => {
    const result = await rankingService.updateUserRankings();
    return successResponse(res, result, 'Rankings updated successfully');
  });
}

export default new RankingController();
