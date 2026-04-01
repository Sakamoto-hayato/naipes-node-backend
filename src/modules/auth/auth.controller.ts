import { Request, Response } from 'express';
import authService from './auth.service';
import { successResponse, createdResponse } from '../../shared/utils/response';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import notificationService from '../../shared/services/notification.service';

export class AuthController {
  // POST /api/auth/register
  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, username, password, firstName, lastName } = req.body;

    const result = await authService.register({
      email,
      username,
      password,
      firstName,
      lastName,
    });

    return createdResponse(res, result, 'User registered successfully');
  });

  // POST /api/auth/login
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    return successResponse(res, result, 'Login successful');
  });

  // POST /api/auth/refresh
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const result = await authService.refreshToken(refreshToken);

    return successResponse(res, result, 'Token refreshed successfully');
  });

  // GET /api/auth/me
  getMe = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const user = await authService.getMe(userId);

    return successResponse(res, user, 'User retrieved successfully');
  });

  // POST /api/auth/recover
  requestPasswordRecovery = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const result = await authService.requestPasswordRecovery(email);

    return successResponse(res, result, result.message);
  });

  // POST /api/auth/reset-password
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;

    const result = await authService.resetPassword(token, password);

    return successResponse(res, result, result.message);
  });

  // GET /api/auth/confirm-email
  confirmEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      throw new Error('Token is required');
    }

    const result = await authService.confirmEmail(token);

    return successResponse(res, result, result.message);
  });

  // POST /api/auth/resend-confirmation
  resendConfirmation = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const result = await authService.resendConfirmation(email);

    return successResponse(res, result, result.message);
  });

  // POST /api/auth/register-token
  registerDeviceToken = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { token, platform, deviceModel, appVersion } = req.body;

    if (!token || !platform) {
      throw new Error('Token and platform are required');
    }

    await notificationService.registerDeviceToken(userId, token, platform, deviceModel, appVersion);

    return successResponse(res, null, 'Device token registered');
  });

  // POST /api/auth/unregister-token
  unregisterDeviceToken = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      throw new Error('Token is required');
    }

    await notificationService.unregisterDeviceToken(token);

    return successResponse(res, null, 'Device token unregistered');
  });
}

export default new AuthController();
