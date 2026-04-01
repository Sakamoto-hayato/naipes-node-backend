import { Router } from 'express';
import userController from './user.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { avatarUpload } from '../../shared/middleware/upload.middleware';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Profile routes - /api/users/me (React Native compatible)
router.get('/me', userController.getProfile);
router.put('/me', userController.updateProfile);
router.delete('/me', userController.deleteAccount);

// Profile routes - legacy support
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// User lookup by ID - must come before /:username to avoid conflict
router.get('/search', userController.searchUsers); // /api/users/search?q=query

// Statistics routes - /api/users/me/stats or /api/users/:id/stats
router.get('/me/stats', userController.getStats);
router.get('/:id/stats', userController.getUserStatsById);

// Game history routes - /api/users/me/history or /api/users/:id/history
router.get('/me/history', userController.getGameHistory);
router.get('/:id/history', userController.getUserHistoryById);

// Achievements routes - /api/users/me/achievements or /api/users/:id/achievements
router.get('/me/achievements', userController.getUserAchievements);
router.get('/:id/achievements', userController.getUserAchievementsById);

// Avatar routes
router.post('/me/avatar', avatarUpload, userController.uploadAvatar);
router.put('/me/avatar', userController.updateAvatar);

// Settings routes
router.put('/settings', userController.updateSettings);

// Password routes
router.post('/change-password', userController.changePassword);

// User lookup by username or ID - must be last to avoid route conflicts
router.get('/:id', userController.getUserById);

// Account deletion - legacy
router.delete('/account', userController.deleteAccount);

export default router;
