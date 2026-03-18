import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../../config/database';
import { generateTokenPair, JwtPayload, verifyRefreshToken } from '../../shared/utils/jwt';
import { AppError } from '../../shared/middleware/error.middleware';
import { sendEmail, emailTemplates } from '../../config/email';

const SALT_ROUNDS = 12;
const APP_URL = process.env.APP_URL || 'http://localhost:3001';

export interface RegisterDto {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    profilePicture: string | null;
    coins: number;
    gamesPlayed: number;
    gamesWon: number;
    points: number;
    position: number | null;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  // 회원가입
  async register(data: RegisterDto): Promise<AuthResponse> {
    // Check for duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new AppError('Email already exists', 400, 'EMAIL_EXISTS');
    }

    // Check for duplicate username
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      throw new AppError('Username already exists', 400, 'USERNAME_EXISTS');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        coins: Number(process.env.DEFAULT_COINS) || 1000,
      },
    });

    // 가입 보너스 트랜잭션 기록
    await prisma.transaction.create({
      data: {
        userId: user.id,
        operation: 8, // REGISTRATION_GIFT
        amount: user.coins,
        balanceBefore: 0,
        balanceAfter: user.coins,
        description: 'Registration bonus',
      },
    });

    // Generate JWT tokens
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const { accessToken, refreshToken } = generateTokenPair(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        coins: user.coins,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        points: user.points,
        position: user.position,
      },
      accessToken,
      refreshToken,
    };
  }

  // 로그인
  async login(data: LoginDto): Promise<AuthResponse> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // 계정 삭제 여부 확인
    if (user.deletedAt) {
      throw new AppError('Account has been deleted', 403, 'ACCOUNT_DELETED');
    }

    // Generate JWT tokens
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const { accessToken, refreshToken } = generateTokenPair(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        coins: user.coins,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        points: user.points,
        position: user.position,
      },
      accessToken,
      refreshToken,
    };
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.deletedAt) {
      throw new AppError('Account has been deleted', 403, 'ACCOUNT_DELETED');
    }

    // Generate new token pair
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    return generateTokenPair(payload);
  }

  // Get user information
  async getMe(userId: string): Promise<AuthResponse['user']> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      coins: user.coins,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      points: user.points,
      position: user.position,
    };
  }

  // Request password recovery
  async requestPasswordRecovery(email: string): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not for security
    if (!user) {
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    // Generate reset token (random 32 bytes)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        confirmationToken: resetToken,
        tokenExpiry: resetTokenExpiry,
      },
    });

    // Send recovery email
    const resetUrl = `${APP_URL}/api/auth/reset-password?token=${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request - Naipes Negros',
        html: emailTemplates.passwordReset(user.username, resetUrl),
      });
    } catch (error) {
      console.error('Failed to send recovery email:', error);
      // Don't throw error to prevent email enumeration
    }

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await prisma.user.findFirst({
      where: {
        confirmationToken: token,
        tokenExpiry: {
          gte: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        confirmationToken: null,
        tokenExpiry: null,
      },
    });

    return { message: 'Password has been reset successfully' };
  }

  // Confirm email with token
  async confirmEmail(token: string): Promise<{ message: string }> {
    const user = await prisma.user.findFirst({
      where: {
        confirmationToken: token,
      },
    });

    if (!user) {
      throw new AppError('Invalid confirmation token', 400, 'INVALID_TOKEN');
    }

    if (user.enabled) {
      return { message: 'Email already confirmed' };
    }

    // Enable account
    await prisma.user.update({
      where: { id: user.id },
      data: {
        enabled: true,
        confirmationToken: null,
      },
    });

    return { message: 'Email confirmed successfully' };
  }

  // Resend confirmation email
  async resendConfirmation(email: string): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { message: 'If the email exists, a confirmation link has been sent' };
    }

    if (user.enabled) {
      throw new AppError('Email already confirmed', 400, 'ALREADY_CONFIRMED');
    }

    // Generate new token
    const confirmToken = crypto.randomBytes(32).toString('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        confirmationToken: confirmToken,
      },
    });

    // Send confirmation email
    const confirmUrl = `${APP_URL}/api/auth/confirm-email?token=${confirmToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Confirm Your Email - Naipes Negros',
        html: emailTemplates.confirmation(user.username, confirmUrl),
      });
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
    }

    return { message: 'If the email exists, a confirmation link has been sent' };
  }
}

export default new AuthService();
