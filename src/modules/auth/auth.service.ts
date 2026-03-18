import bcrypt from 'bcrypt';
import prisma from '../../config/database';
import { generateTokenPair, JwtPayload, verifyRefreshToken } from '../../shared/utils/jwt';
import { AppError } from '../../shared/middleware/error.middleware';

const SALT_ROUNDS = 12;

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
}

export default new AuthService();
