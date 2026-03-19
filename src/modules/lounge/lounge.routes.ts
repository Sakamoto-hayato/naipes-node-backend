import { Router } from 'express';
import loungeController from './lounge.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

// All lounge routes require authentication
router.use(authenticate);

// Lounge management
router.post('/create', loungeController.create);
router.get('/available', loungeController.getAvailable);
router.post('/:id/join', loungeController.join);
router.delete('/:id/cancel', loungeController.cancel);
router.post('/:id/leave', loungeController.leave);
router.get('/play-key/:playKey', loungeController.getByPlayKey);
router.post('/quick-match', loungeController.quickMatch);
router.get('/my-games', loungeController.getMyGames);

export default router;
