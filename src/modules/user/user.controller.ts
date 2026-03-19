import { Request, Response } from 'express';
import userService from './user.service';
import { successResponse } from '../../shared/utils/response';
import { asyncHandler, AppError } from '../../shared/middleware/error.middleware';

export class UserController {
  // GET /api/users/profile - Get current user's profile
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const profile = await userService.getUserProfile(userId);
    return successResponse(res, profile, 'Profile retrieved successfully');
  });

  // GET /api/users/:username - Get user profile by username
  getByUsername = asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.params;

    if (!username) {
      throw new AppError('Username is required', 400, 'MISSING_FIELDS');
    }

    const profile = await userService.getUserByUsername(username);
    return successResponse(res, profile, 'User profile retrieved successfully');
  });

  // PUT /api/users/profile - Update current user's profile
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { firstName, lastName, gender, age, profilePicture } = req.body;

    const updatedProfile = await userService.updateProfile(userId, {
      firstName,
      lastName,
      gender,
      age: age ? Number(age) : undefined,
      profilePicture,
    });

    return successResponse(res, updatedProfile, 'Profile updated successfully');
  });

  // PUT /api/users/settings - Update user's game settings
  updateSettings = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { alternateCards, alternateMode, chatEnabled, soundEnabled } = req.body;

    const updatedSettings = await userService.updateSettings(userId, {
      alternateCards,
      alternateMode,
      chatEnabled,
      soundEnabled,
    });

    return successResponse(res, updatedSettings, 'Settings updated successfully');
  });

  // POST /api/users/change-password - Change user's password
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400, 'MISSING_FIELDS');
    }

    const result = await userService.changePassword(userId, {
      currentPassword,
      newPassword,
    });

    return successResponse(res, result, 'Password changed successfully');
  });

  // GET /api/users/stats - Get user's statistics
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const stats = await userService.getUserStats(userId);
    return successResponse(res, stats, 'Statistics retrieved successfully');
  });

  // GET /api/users/game-history - Get user's game history
  getGameHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { limit, offset } = req.query;

    const games = await userService.getUserGameHistory(
      userId,
      limit ? Number(limit) : 20,
      offset ? Number(offset) : 0
    );

    return successResponse(res, games, 'Game history retrieved successfully');
  });

  // DELETE /api/users/account - Delete user's account
  deleteAccount = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { password } = req.body;

    if (!password) {
      throw new AppError('Password is required to delete account', 400, 'MISSING_FIELDS');
    }

    const result = await userService.deleteAccount(userId, password);
    return successResponse(res, result, 'Account deleted successfully');
  });
}

export default new UserController();
