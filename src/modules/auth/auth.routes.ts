import { Router } from 'express';
import authController from './auth.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

// 공개 라우트
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);

// 보호된 라우트 (인증 필요)
router.get('/me', authenticate, authController.getMe);

export default router;
