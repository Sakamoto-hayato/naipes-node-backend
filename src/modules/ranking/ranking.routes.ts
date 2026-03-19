import { Router } from 'express';
import rankingController from './ranking.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

// Public routes (require authentication)
router.get('/leaderboard', authenticate, rankingController.getLeaderboard);
router.get('/my-rank', authenticate, rankingController.getMyRank);
router.get('/user/:userId', authenticate, rankingController.getUserRank);
router.get('/top', authenticate, rankingController.getTopPlayers);
router.get('/near/:rank', authenticate, rankingController.getNearRank);
router.get('/weekly', authenticate, rankingController.getWeeklyTopPlayers);
router.get('/tournament-winners', authenticate, rankingController.getTournamentWinners);

// Admin routes
router.post('/update', authenticate, rankingController.updateRankings);

export default router;
