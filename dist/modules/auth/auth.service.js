"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = __importDefault(require("../../config/database"));
const jwt_1 = require("../../shared/utils/jwt");
const error_middleware_1 = require("../../shared/middleware/error.middleware");
const SALT_ROUNDS = 12;
class AuthService {
    async register(data) {
        const existingEmail = await database_1.default.user.findUnique({
            where: { email: data.email },
        });
        if (existingEmail) {
            throw new error_middleware_1.AppError('Email already exists', 400, 'EMAIL_EXISTS');
        }
        const existingUsername = await database_1.default.user.findUnique({
            where: { username: data.username },
        });
        if (existingUsername) {
            throw new error_middleware_1.AppError('Username already exists', 400, 'USERNAME_EXISTS');
        }
        const hashedPassword = await bcrypt_1.default.hash(data.password, SALT_ROUNDS);
        const user = await database_1.default.user.create({
            data: {
                email: data.email,
                username: data.username,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                coins: Number(process.env.DEFAULT_COINS) || 1000,
            },
        });
        await database_1.default.transaction.create({
            data: {
                userId: user.id,
                operation: 8,
                amount: user.coins,
                balanceBefore: 0,
                balanceAfter: user.coins,
                description: 'Registration bonus',
            },
        });
        const payload = {
            userId: user.id,
            email: user.email,
            username: user.username,
        };
        const { accessToken, refreshToken } = (0, jwt_1.generateTokenPair)(payload);
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
    async login(data) {
        const user = await database_1.default.user.findUnique({
            where: { email: data.email },
        });
        if (!user) {
            throw new error_middleware_1.AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }
        const isPasswordValid = await bcrypt_1.default.compare(data.password, user.password);
        if (!isPasswordValid) {
            throw new error_middleware_1.AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }
        if (user.deletedAt) {
            throw new error_middleware_1.AppError('Account has been deleted', 403, 'ACCOUNT_DELETED');
        }
        const payload = {
            userId: user.id,
            email: user.email,
            username: user.username,
        };
        const { accessToken, refreshToken } = (0, jwt_1.generateTokenPair)(payload);
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
    async refreshToken(refreshToken) {
        const decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
        if (!decoded) {
            throw new error_middleware_1.AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
        }
        const user = await database_1.default.user.findUnique({
            where: { id: decoded.userId },
        });
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        if (user.deletedAt) {
            throw new error_middleware_1.AppError('Account has been deleted', 403, 'ACCOUNT_DELETED');
        }
        const payload = {
            userId: user.id,
            email: user.email,
            username: user.username,
        };
        return (0, jwt_1.generateTokenPair)(payload);
    }
    async getMe(userId) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
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
exports.AuthService = AuthService;
exports.default = new AuthService();
//# sourceMappingURL=auth.service.js.map