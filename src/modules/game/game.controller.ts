import { Request, Response } from 'express';
import gameService from './game.service';
import { successResponse, createdResponse } from '../../shared/utils/response';
import { asyncHandler } from '../../shared/middleware/error.middleware';

export class GameController {
  // POST /api/game/create
  create = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { guestUserId, bet, level, isBot } = req.body;

    const game = await gameService.createGame({
      hostUserId: userId!,
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
    const { id } = req.params;

    const game = await gameService.startGame(id, userId!);

    return successResponse(res, game, 'Game started');
  });

  // POST /api/game/:id/play
  playCard = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { card } = req.body;

    const game = await gameService.playCard({
      gameId: id,
      userId: userId!,
      card,
    });

    return successResponse(res, game, 'Card played');
  });

  // GET /api/game/:id
  getGame = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const game = await gameService.getGameState(id);

    return successResponse(res, game, 'Game retrieved');
  });

  // GET /api/game/my-games
  getMyGames = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { status } = req.query;

    const games = await gameService.getUserGames(userId!, status as string);

    return successResponse(res, games, 'Games retrieved');
  });
}

export default new GameController();
