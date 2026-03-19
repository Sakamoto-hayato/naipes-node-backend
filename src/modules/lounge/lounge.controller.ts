import { Request, Response } from 'express';
import loungeService from './lounge.service';
import { successResponse, createdResponse } from '../../shared/utils/response';
import { asyncHandler, AppError } from '../../shared/middleware/error.middleware';

export class LoungeController {
  // POST /api/lounge/create - Create a game in lounge
  create = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { bet, level, playKey } = req.body;

    if (!bet || !level) {
      throw new AppError('Bet and level are required', 400, 'MISSING_FIELDS');
    }

    const game = await loungeService.createLoungeGame({
      hostUserId: userId,
      bet: Number(bet),
      level: Number(level),
      playKey,
    });

    return createdResponse(res, game, 'Game created in lounge');
  });

  // GET /api/lounge/available - Get available games
  getAvailable = asyncHandler(async (req: Request, res: Response) => {
    const { minBet, maxBet, level } = req.query;

    const filters = {
      minBet: minBet ? Number(minBet) : undefined,
      maxBet: maxBet ? Number(maxBet) : undefined,
      level: level ? Number(level) : undefined,
    };

    const games = await loungeService.getAvailableGames(filters);

    return successResponse(res, games, 'Available games retrieved');
  });

  // POST /api/lounge/:id/join - Join a game
  join = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('Game ID is required', 400, 'MISSING_GAME_ID');
    }

    const { playKey } = req.body;

    const game = await loungeService.joinLoungeGame({
      gameId: id,
      userId,
      playKey,
    });

    return successResponse(res, game, 'Joined game');
  });

  // DELETE /api/lounge/:id/cancel - Cancel a waiting game
  cancel = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('Game ID is required', 400, 'MISSING_GAME_ID');
    }

    const result = await loungeService.cancelLoungeGame(id, userId);

    return successResponse(res, result, 'Game cancelled');
  });

  // POST /api/lounge/:id/leave - Leave a pending game
  leave = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('Game ID is required', 400, 'MISSING_GAME_ID');
    }

    const game = await loungeService.leaveLoungeGame(id, userId);

    return successResponse(res, game, 'Left game');
  });

  // GET /api/lounge/play-key/:playKey - Get game by play key
  getByPlayKey = asyncHandler(async (req: Request, res: Response) => {
    const { playKey } = req.params;
    if (!playKey) {
      throw new AppError('Play key is required', 400, 'MISSING_PLAY_KEY');
    }

    const game = await loungeService.getGameByPlayKey(playKey);

    return successResponse(res, game, 'Game found');
  });

  // POST /api/lounge/quick-match - Quick match
  quickMatch = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { bet, level } = req.body;

    if (!bet || !level) {
      throw new AppError('Bet and level are required', 400, 'MISSING_FIELDS');
    }

    const game = await loungeService.quickMatch(
      userId,
      Number(bet),
      Number(level)
    );

    return successResponse(res, game, 'Quick match complete');
  });

  // GET /api/lounge/my-games - Get user's lounge games
  getMyGames = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const games = await loungeService.getUserLoungeGames(userId);

    return successResponse(res, games, 'Lounge games retrieved');
  });
}

export default new LoungeController();
