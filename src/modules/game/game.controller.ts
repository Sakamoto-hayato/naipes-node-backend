import { Request, Response } from 'express';
import gameService from './game.service';
import { successResponse, createdResponse } from '../../shared/utils/response';
import { asyncHandler, AppError } from '../../shared/middleware/error.middleware';

export class GameController {
  // POST /api/game/create
  create = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { guestUserId, bet, level, isBot } = req.body;

    const game = await gameService.createGame({
      hostUserId: userId,
      guestUserId,
      bet: Number(bet),
      level: Number(level),
      isBot,
    });

    return createdResponse(res, game, 'Game created successfully');
  });

  // POST /api/game/:id/start
  start = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('Game ID is required', 400, 'MISSING_GAME_ID');
    }

    const game = await gameService.startGame(id, userId);

    return successResponse(res, game, 'Game started');
  });

  // POST /api/game/:id/play
  playCard = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('Game ID is required', 400, 'MISSING_GAME_ID');
    }

    const { card } = req.body;

    const game = await gameService.playCard({
      gameId: id,
      userId: userId,
      card,
    });

    return successResponse(res, game, 'Card played');
  });

  // GET /api/game/:id
  getGame = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new AppError('Game ID is required', 400, 'MISSING_GAME_ID');
    }

    const game = await gameService.getGameState(id);

    return successResponse(res, game, 'Game retrieved');
  });

  // GET /api/game/my-games
  getMyGames = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { status } = req.query;

    const games = await gameService.getUserGames(userId, status as string);

    return successResponse(res, games, 'Games retrieved');
  });

  // POST /api/game/:id/challenge - Make a challenge
  makeChallenge = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('Game ID is required', 400, 'MISSING_GAME_ID');
    }

    const { type } = req.body;
    if (!type) {
      throw new AppError('Challenge type is required', 400, 'MISSING_CHALLENGE_TYPE');
    }

    const result = await gameService.makeChallenge({
      gameId: id,
      userId,
      type,
    });

    return createdResponse(res, result, 'Challenge created');
  });

  // POST /api/game/:id/challenge/:challengeId/respond - Respond to challenge
  respondToChallenge = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { id, challengeId } = req.params;
    if (!id || !challengeId) {
      throw new AppError('Game ID and Challenge ID are required', 400, 'MISSING_IDS');
    }

    const { accepted, raiseType } = req.body;
    if (accepted === undefined) {
      throw new AppError('Accepted field is required', 400, 'MISSING_ACCEPTED');
    }

    const result = await gameService.respondToChallenge({
      gameId: id,
      userId,
      challengeId,
      accepted,
      raiseType,
    });

    return successResponse(res, result, 'Challenge response recorded');
  });

  // POST /api/game/:id/calculate-envido - Calculate Envido winner
  calculateEnvido = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('Game ID is required', 400, 'MISSING_GAME_ID');
    }

    const result = await gameService.calculateEnvidoWinner(id);

    return successResponse(res, result, 'Envido calculated');
  });
}

export default new GameController();
