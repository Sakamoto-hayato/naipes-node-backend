/**
 * Tournament Controller
 */

import { Request, Response } from 'express';
import tournamentService from './tournament.service';
import { successResponse, errorResponse } from '../../shared/utils/response';

class TournamentController {
  // Join a tournament
  async join(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { stake } = req.body;

      if (!stake || stake <= 0) {
        return errorResponse(res, 'Valid stake amount required', 400, 'INVALID_STAKE');
      }

      const tournament = await tournamentService.joinTournament(userId, stake);
      return successResponse(res, tournament, 'Joined tournament', 201);
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500, error.code);
    }
  }

  // Find match for current round
  async findMatch(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const result = await tournamentService.findMatch(userId);
      return successResponse(res, result);
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500, error.code);
    }
  }

  // Get my tournament status
  async getStatus(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const status = await tournamentService.getTournamentStatus(userId);

      if (!status) {
        return successResponse(res, null, 'Not in a tournament');
      }

      return successResponse(res, status);
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500, error.code);
    }
  }

  // Get tournament ranking
  async getRanking(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const ranking = await tournamentService.getTournamentRanking(limit);
      return successResponse(res, ranking);
    } catch (error: any) {
      return errorResponse(res, error.message, error.statusCode || 500, error.code);
    }
  }
}

export default new TournamentController();
