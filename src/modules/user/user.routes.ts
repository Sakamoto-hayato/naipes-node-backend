import { Router } from 'express';
import userController from './user.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.get('/:username', userController.getByUsername);

// Settings routes
router.put('/settings', userController.updateSettings);

// Password routes
router.post('/change-password', userController.changePassword);

// Statistics routes
router.get('/stats', userController.getStats);

// Game history routes
router.get('/game-history', userController.getGameHistory);

// Account deletion
router.delete('/account', userController.deleteAccount);

export default router;
