import { Router } from 'express';
import authController from './auth.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/recover', authController.requestPasswordRecovery);
router.post('/reset-password', authController.resetPassword);
router.get('/confirm-email', authController.confirmEmail);
router.post('/resend-confirmation', authController.resendConfirmation);

// Protected routes (authentication required)
router.get('/me', authenticate, authController.getMe);

// Device token registration (for push notifications)
router.post('/register-token', authenticate, authController.registerDeviceToken);
router.post('/unregister-token', authenticate, authController.unregisterDeviceToken);

export default router;
