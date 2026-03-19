import { Router } from 'express';
import messageController from './message.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', messageController.sendMessage);
router.get('/game/:gameId', messageController.getGameMessages);
router.delete('/:id', messageController.deleteMessage);
router.get('/recent', messageController.getRecentMessages);
router.delete('/game/:gameId/clear', messageController.clearGameMessages);

export default router;
