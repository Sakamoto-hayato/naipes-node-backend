import prisma from '../../config/database';
import { AppError } from '../../shared/middleware/error.middleware';
import presenceService from '../../shared/services/presence.service';

export interface SendFriendRequestDto {
  friendUserId: string;
  message?: string;
}

class FriendService {
  /**
   * Get all friends of a user (accepted friendships only)
   */
  async getFriends(userId: string) {
    const friendships = await prisma.friend.findMany({
      where: {
        OR: [
          { userId: userId, status: 'accepted' },
          { friendUserId: userId, status: 'accepted' },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            gamesPlayed: true,
            gamesWon: true,
            points: true,
          },
        },
        friendUser: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            gamesPlayed: true,
            gamesWon: true,
            points: true,
          },
        },
      },
      orderBy: {
        acceptedAt: 'desc',
      },
    });

    // Map to friend details
    const friends = friendships.map(friendship => {
      const friend = friendship.userId === userId ? friendship.friendUser : friendship.user;
      return {
        id: friendship.id,
        userId: friend.id,
        username: friend.username,
        profilePicture: friend.profilePicture,
        gamesPlayed: friend.gamesPlayed,
        gamesWon: friend.gamesWon,
        points: friend.points,
        status: 'accepted',
        isOnline: presenceService.isOnline(friend.id),
        createdAt: friendship.createdAt,
        acceptedAt: friendship.acceptedAt,
      };
    });

    return { friends, total: friends.length };
  }

  /**
   * Get pending friend requests (received)
   */
  async getFriendRequests(userId: string) {
    const requests = await prisma.friend.findMany({
      where: {
        friendUserId: userId,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            gamesPlayed: true,
            gamesWon: true,
            points: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedRequests = requests.map(request => ({
      id: request.id,
      userId: request.user.id,
      username: request.user.username,
      profilePicture: request.user.profilePicture,
      gamesPlayed: request.user.gamesPlayed,
      gamesWon: request.user.gamesWon,
      points: request.user.points,
      status: request.status,
      createdAt: request.createdAt,
    }));

    return { requests: formattedRequests, total: formattedRequests.length };
  }

  /**
   * Send a friend request
   */
  async sendFriendRequest(userId: string, data: SendFriendRequestDto) {
    const { friendUserId } = data;

    // Cannot send request to self
    if (userId === friendUserId) {
      throw new AppError('Cannot send friend request to yourself', 400, 'INVALID_REQUEST');
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: friendUserId },
    });

    if (!targetUser) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check if friendship already exists (in either direction)
    const existingFriendship = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: userId, friendUserId: friendUserId },
          { userId: friendUserId, friendUserId: userId },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        throw new AppError('Already friends', 400, 'ALREADY_FRIENDS');
      }
      if (existingFriendship.status === 'pending') {
        throw new AppError('Friend request already sent', 400, 'REQUEST_ALREADY_SENT');
      }
      if (existingFriendship.status === 'blocked') {
        throw new AppError('Cannot send friend request', 403, 'BLOCKED');
      }
    }

    // Create friend request
    const friendRequest = await prisma.friend.create({
      data: {
        userId: userId,
        friendUserId: friendUserId,
        requestedBy: userId,
        status: 'pending',
      },
      include: {
        friendUser: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Friend request sent',
      request: {
        id: friendRequest.id,
        userId: friendRequest.friendUser.id,
        username: friendRequest.friendUser.username,
        profilePicture: friendRequest.friendUser.profilePicture,
        status: friendRequest.status,
        createdAt: friendRequest.createdAt,
      },
    };
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(userId: string, requestId: string) {
    const friendRequest = await prisma.friend.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    if (!friendRequest) {
      throw new AppError('Friend request not found', 404, 'REQUEST_NOT_FOUND');
    }

    // Only the receiver can accept
    if (friendRequest.friendUserId !== userId) {
      throw new AppError('Not authorized to accept this request', 403, 'FORBIDDEN');
    }

    if (friendRequest.status !== 'pending') {
      throw new AppError('Friend request already processed', 400, 'REQUEST_ALREADY_PROCESSED');
    }

    // Accept the request
    const updatedFriendship = await prisma.friend.update({
      where: { id: requestId },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Friend request accepted',
      friendship: {
        id: updatedFriendship.id,
        userId: friendRequest.user.id,
        username: friendRequest.user.username,
        profilePicture: friendRequest.user.profilePicture,
        status: updatedFriendship.status,
        acceptedAt: updatedFriendship.acceptedAt,
      },
    };
  }

  /**
   * Reject a friend request
   */
  async rejectFriendRequest(userId: string, requestId: string) {
    const friendRequest = await prisma.friend.findUnique({
      where: { id: requestId },
    });

    if (!friendRequest) {
      throw new AppError('Friend request not found', 404, 'REQUEST_NOT_FOUND');
    }

    // Only the receiver can reject
    if (friendRequest.friendUserId !== userId) {
      throw new AppError('Not authorized to reject this request', 403, 'FORBIDDEN');
    }

    if (friendRequest.status !== 'pending') {
      throw new AppError('Friend request already processed', 400, 'REQUEST_ALREADY_PROCESSED');
    }

    // Delete the request
    await prisma.friend.delete({
      where: { id: requestId },
    });

    return {
      success: true,
      message: 'Friend request rejected',
    };
  }

  /**
   * Remove a friend (unfriend)
   */
  async removeFriend(userId: string, friendshipId: string) {
    const friendship = await prisma.friend.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new AppError('Friendship not found', 404, 'FRIENDSHIP_NOT_FOUND');
    }

    // User must be part of the friendship
    if (friendship.userId !== userId && friendship.friendUserId !== userId) {
      throw new AppError('Not authorized to remove this friendship', 403, 'FORBIDDEN');
    }

    // Delete the friendship
    await prisma.friend.delete({
      where: { id: friendshipId },
    });

    return {
      success: true,
      message: 'Friend removed',
    };
  }

  /**
   * Block a user
   */
  async blockUser(userId: string, targetUserId: string) {
    // Cannot block self
    if (userId === targetUserId) {
      throw new AppError('Cannot block yourself', 400, 'INVALID_REQUEST');
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check if friendship exists
    const existingFriendship = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: userId, friendUserId: targetUserId },
          { userId: targetUserId, friendUserId: userId },
        ],
      },
    });

    if (existingFriendship) {
      // Update to blocked
      await prisma.friend.update({
        where: { id: existingFriendship.id },
        data: {
          status: 'blocked',
          blockedAt: new Date(),
        },
      });
    } else {
      // Create new blocked entry
      await prisma.friend.create({
        data: {
          userId: userId,
          friendUserId: targetUserId,
          requestedBy: userId,
          status: 'blocked',
          blockedAt: new Date(),
        },
      });
    }

    return {
      success: true,
      message: 'User blocked',
    };
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string, targetUserId: string) {
    const friendship = await prisma.friend.findFirst({
      where: {
        userId: userId,
        friendUserId: targetUserId,
        status: 'blocked',
      },
    });

    if (!friendship) {
      throw new AppError('Block not found', 404, 'BLOCK_NOT_FOUND');
    }

    // Remove the block
    await prisma.friend.delete({
      where: { id: friendship.id },
    });

    return {
      success: true,
      message: 'User unblocked',
    };
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(userId: string) {
    const blockedFriendships = await prisma.friend.findMany({
      where: {
        userId: userId,
        status: 'blocked',
      },
      include: {
        friendUser: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
      orderBy: {
        blockedAt: 'desc',
      },
    });

    const blockedUsers = blockedFriendships.map(f => ({
      id: f.id,
      userId: f.friendUser.id,
      username: f.friendUser.username,
      profilePicture: f.friendUser.profilePicture,
      blockedAt: f.blockedAt,
    }));

    return { blockedUsers, total: blockedUsers.length };
  }
}

export default new FriendService();
