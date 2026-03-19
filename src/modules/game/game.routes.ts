import { Router } from 'express';
import gameController from './game.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

// All game routes require authentication
router.use(authenticate);

// Game management
router.post('/create', gameController.create);
router.post('/:id/start', gameController.start);
router.post('/:id/play', gameController.playCard);
router.get('/:id', gameController.getGame);
router.get('/my-games', gameController.getMyGames);

// Challenge management
router.post('/:id/challenge', gameController.makeChallenge);
router.post('/:id/challenge/:challengeId/respond', gameController.respondToChallenge);
router.post('/:id/calculate-envido', gameController.calculateEnvido);

export default router;
