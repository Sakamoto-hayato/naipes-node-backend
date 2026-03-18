import { Request, Response } from 'express';
import authService from './auth.service';
import { successResponse, createdResponse } from '../../shared/utils/response';
import { asyncHandler } from '../../shared/middleware/error.middleware';

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
}

export default new AuthController();
