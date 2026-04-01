import { Request, Response } from 'express';
import path from 'path';
import sharp from 'sharp';
import userService from './user.service';
import { successResponse } from '../../shared/utils/response';
import { asyncHandler, AppError } from '../../shared/middleware/error.middleware';
import { UPLOAD_DIR } from '../../shared/middleware/upload.middleware';

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

  // GET /api/users/:id - Get user profile by ID
  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError('User ID is required', 400, 'MISSING_FIELDS');
    }

    const profile = await userService.getUserProfile(id);
    return successResponse(res, profile, 'User profile retrieved successfully');
  });

  // GET /api/users/:id/stats - Get user stats by ID
  getUserStatsById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError('User ID is required', 400, 'MISSING_FIELDS');
    }

    const stats = await userService.getUserStats(id);
    return successResponse(res, stats, 'User statistics retrieved successfully');
  });

  // GET /api/users/:id/history - Get user game history by ID
  getUserHistoryById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { limit, offset, page } = req.query;

    if (!id) {
      throw new AppError('User ID is required', 400, 'MISSING_FIELDS');
    }

    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 10;
    const offsetNum = offset ? Number(offset) : (pageNum - 1) * limitNum;

    const games = await userService.getUserGameHistory(
      id,
      limitNum,
      offsetNum
    );

    const total = games.length; // TODO: Get actual total count from DB
    const hasMore = games.length === limitNum;

    return successResponse(res, { games, total, hasMore }, 'Game history retrieved successfully');
  });

  // GET /api/users/search?q=query - Search users by username
  searchUsers = asyncHandler(async (req: Request, res: Response) => {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      throw new AppError('Search query is required', 400, 'MISSING_FIELDS');
    }

    const users = await userService.searchUsers(q);
    return successResponse(res, users, 'Users found successfully');
  });

  // GET /api/users/me/achievements - Get current user's achievements
  getUserAchievements = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const achievements = await userService.getUserAchievements(userId);
    return successResponse(res, achievements, 'Achievements retrieved successfully');
  });

  // GET /api/users/:id/achievements - Get user achievements by ID
  getUserAchievementsById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError('User ID is required', 400, 'MISSING_FIELDS');
    }

    const achievements = await userService.getUserAchievements(id);
    return successResponse(res, achievements, 'Achievements retrieved successfully');
  });

  // POST /api/users/me/avatar - Upload avatar image
  uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    if (!req.file) {
      throw new AppError('No image file provided', 400, 'NO_FILE');
    }

    // Process image with sharp: resize to 256x256, convert to webp
    const filename = `${userId}_${Date.now()}.webp`;
    const outputPath = path.join(UPLOAD_DIR, filename);

    await sharp(req.file.buffer)
      .resize(256, 256, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(outputPath);

    // Build URL path
    const avatarUrl = `/uploads/avatars/${filename}`;

    // Update user profile
    const updatedProfile = await userService.updateProfile(userId, {
      profilePicture: avatarUrl,
    });

    return successResponse(res, {
      profilePicture: avatarUrl,
      user: updatedProfile,
    }, 'Avatar uploaded successfully');
  });

  // PUT /api/users/me/avatar - Update avatar (predefined avatar ID)
  updateAvatar = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { avatarId, avatar } = req.body;

    if (!avatarId && !avatar) {
      throw new AppError('Avatar ID or avatar URL is required', 400, 'MISSING_FIELDS');
    }

    const updatedProfile = await userService.updateProfile(userId, {
      profilePicture: avatar || avatarId,
    });

    return successResponse(res, updatedProfile, 'Avatar updated successfully');
  });
}

export default new UserController();
