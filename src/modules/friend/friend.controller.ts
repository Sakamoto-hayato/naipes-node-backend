import { Request, Response } from 'express';
import friendService from './friend.service';
import { successResponse } from '../../shared/utils/response';
import { asyncHandler, AppError } from '../../shared/middleware/error.middleware';

export class FriendController {
  // GET /api/friends - Get all friends
  getFriends = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const result = await friendService.getFriends(userId);
    return successResponse(res, result, 'Friends retrieved successfully');
  });

  // GET /api/friends/requests - Get pending friend requests
  getFriendRequests = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const result = await friendService.getFriendRequests(userId);
    return successResponse(res, result, 'Friend requests retrieved successfully');
  });

  // POST /api/friends/request - Send a friend request
  sendFriendRequest = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { friendUserId, message } = req.body;

    if (!friendUserId) {
      throw new AppError('Friend user ID is required', 400, 'MISSING_FIELDS');
    }

    const result = await friendService.sendFriendRequest(userId, {
      friendUserId,
      message,
    });

    return successResponse(res, result, result.message);
  });

  // PUT /api/friends/accept/:id - Accept a friend request
  acceptFriendRequest = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;

    if (!id) {
      throw new AppError('Request ID is required', 400, 'MISSING_FIELDS');
    }

    const result = await friendService.acceptFriendRequest(userId, id);
    return successResponse(res, result, result.message);
  });

  // DELETE /api/friends/reject/:id - Reject a friend request
  rejectFriendRequest = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;

    if (!id) {
      throw new AppError('Request ID is required', 400, 'MISSING_FIELDS');
    }

    const result = await friendService.rejectFriendRequest(userId, id);
    return successResponse(res, result, result.message);
  });

  // DELETE /api/friends/:id - Remove a friend
  removeFriend = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;

    if (!id) {
      throw new AppError('Friendship ID is required', 400, 'MISSING_FIELDS');
    }

    const result = await friendService.removeFriend(userId, id);
    return successResponse(res, result, result.message);
  });

  // POST /api/friends/block/:id - Block a user
  blockUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;

    if (!id) {
      throw new AppError('User ID is required', 400, 'MISSING_FIELDS');
    }

    const result = await friendService.blockUser(userId, id);
    return successResponse(res, result, result.message);
  });

  // POST /api/friends/unblock/:id - Unblock a user
  unblockUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;

    if (!id) {
      throw new AppError('User ID is required', 400, 'MISSING_FIELDS');
    }

    const result = await friendService.unblockUser(userId, id);
    return successResponse(res, result, result.message);
  });

  // GET /api/friends/blocked - Get blocked users
  getBlockedUsers = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const result = await friendService.getBlockedUsers(userId);
    return successResponse(res, result, 'Blocked users retrieved successfully');
  });
}

export default new FriendController();
