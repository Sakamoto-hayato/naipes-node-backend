/**
 * Push Notification Service (Firebase Cloud Messaging)
 *
 * Sends push notifications to Android/iOS devices via FCM.
 * Requires FIREBASE_SERVICE_ACCOUNT_PATH env variable pointing to
 * the Firebase service account JSON file.
 */

import admin from 'firebase-admin';
import prisma from '../../config/database';
import logger from '../../config/logger';

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return;

  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (serviceAccountPath) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // Use application default credentials (for Cloud Run, etc.)
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      logger.warn('Firebase not configured — push notifications disabled');
      return;
    }

    firebaseInitialized = true;
    logger.info('Firebase Admin SDK initialized');
  } catch (error) {
    logger.error('Failed to initialize Firebase:', error);
  }
}

// Notification types
export enum NotificationType {
  GAME_INVITE = 'game_invite',
  YOUR_TURN = 'your_turn',
  GAME_FINISHED = 'game_finished',
  FRIEND_REQUEST = 'friend_request',
  TOURNAMENT_MATCH = 'tournament_match',
  SYSTEM = 'system',
}

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

class NotificationService {
  constructor() {
    initializeFirebase();
  }

  /**
   * Send notification to a specific user (all their registered devices)
   */
  async sendToUser(userId: string, payload: NotificationPayload, type: NotificationType): Promise<void> {
    if (!firebaseInitialized) {
      logger.debug(`Push notification skipped (Firebase not configured): ${type} to ${userId}`);
      return;
    }

    try {
      // Get all active device tokens for this user
      const deviceTokens = await prisma.deviceToken.findMany({
        where: {
          userId,
          isActive: true,
        },
      });

      if (deviceTokens.length === 0) {
        logger.debug(`No device tokens for user ${userId}`);
        return;
      }

      const tokens = deviceTokens.map(dt => dt.token);

      // Build FCM message
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          type,
          ...(payload.data || {}),
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'naipes_game',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // Handle failed tokens (deactivate them)
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            // Deactivate invalid/unregistered tokens
            if (
              errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered'
            ) {
              failedTokens.push(tokens[idx]!);
            }
          }
        });

        if (failedTokens.length > 0) {
          await prisma.deviceToken.updateMany({
            where: { token: { in: failedTokens } },
            data: { isActive: false },
          });
          logger.info(`Deactivated ${failedTokens.length} invalid device tokens`);
        }
      }

      logger.debug(`Push sent to ${userId}: ${response.successCount}/${tokens.length} succeeded`);
    } catch (error) {
      logger.error(`Failed to send push to ${userId}:`, error);
    }
  }

  // ========================================
  // Convenience methods for common notifications
  // ========================================

  async notifyGameInvite(userId: string, fromUsername: string, gameId: string) {
    await this.sendToUser(userId, {
      title: 'Invitación a jugar',
      body: `${fromUsername} te invita a jugar Truco`,
      data: { gameId },
    }, NotificationType.GAME_INVITE);
  }

  async notifyYourTurn(userId: string, gameId: string, opponentName: string) {
    await this.sendToUser(userId, {
      title: 'Es tu turno',
      body: `Tu turno contra ${opponentName}`,
      data: { gameId },
    }, NotificationType.YOUR_TURN);
  }

  async notifyGameFinished(userId: string, won: boolean, opponentName: string, gameId: string) {
    await this.sendToUser(userId, {
      title: won ? '¡Ganaste!' : 'Partida terminada',
      body: won
        ? `Ganaste la partida contra ${opponentName}`
        : `${opponentName} ganó la partida`,
      data: { gameId, won: won.toString() },
    }, NotificationType.GAME_FINISHED);
  }

  async notifyFriendRequest(userId: string, fromUsername: string) {
    await this.sendToUser(userId, {
      title: 'Solicitud de amistad',
      body: `${fromUsername} quiere ser tu amigo`,
    }, NotificationType.FRIEND_REQUEST);
  }

  async notifyTournamentMatch(userId: string, opponentName: string, round: number) {
    await this.sendToUser(userId, {
      title: 'Partido de torneo',
      body: `Ronda ${round}: tu rival es ${opponentName}`,
      data: { round: round.toString() },
    }, NotificationType.TOURNAMENT_MATCH);
  }

  /**
   * Register a device token for push notifications
   */
  async registerDeviceToken(userId: string, token: string, platform: string, deviceModel?: string, appVersion?: string) {
    // Upsert: update if token exists, create if new
    await prisma.deviceToken.upsert({
      where: { token },
      update: {
        userId,
        platform,
        deviceModel,
        appVersion,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId,
        token,
        platform,
        deviceModel,
        appVersion,
      },
    });
  }

  /**
   * Unregister a device token
   */
  async unregisterDeviceToken(token: string) {
    await prisma.deviceToken.updateMany({
      where: { token },
      data: { isActive: false },
    });
  }
}

export default new NotificationService();
