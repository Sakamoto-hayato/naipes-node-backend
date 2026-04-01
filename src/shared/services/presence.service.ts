/**
 * Presence Service
 * Tracks which users are currently online (connected via Socket.IO)
 */

import logger from '../../config/logger';

class PresenceService {
  // userId -> Set of socketIds (user can have multiple connections)
  private onlineUsers: Map<string, Set<string>> = new Map();

  /**
   * Mark user as online (socket connected)
   */
  userConnected(userId: string, socketId: string): void {
    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }
    this.onlineUsers.get(userId)!.add(socketId);
    logger.debug(`User ${userId} online (${this.onlineUsers.get(userId)!.size} connections)`);
  }

  /**
   * Mark user socket as disconnected
   */
  userDisconnected(userId: string, socketId: string): void {
    const sockets = this.onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.onlineUsers.delete(userId);
        logger.debug(`User ${userId} offline`);
      }
    }
  }

  /**
   * Check if user is online
   */
  isOnline(userId: string): boolean {
    return this.onlineUsers.has(userId) && this.onlineUsers.get(userId)!.size > 0;
  }

  /**
   * Get online status for multiple users
   */
  getOnlineStatuses(userIds: string[]): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const id of userIds) {
      result[id] = this.isOnline(id);
    }
    return result;
  }

  /**
   * Get count of online users
   */
  getOnlineCount(): number {
    return this.onlineUsers.size;
  }

  /**
   * Get all online user IDs
   */
  getOnlineUserIds(): string[] {
    return Array.from(this.onlineUsers.keys());
  }
}

export default new PresenceService();
