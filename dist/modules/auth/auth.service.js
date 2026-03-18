"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const database_1 = __importDefault(require("../../config/database"));
const jwt_1 = require("../../shared/utils/jwt");
const error_middleware_1 = require("../../shared/middleware/error.middleware");
const email_1 = require("../../config/email");
const SALT_ROUNDS = 12;
const APP_URL = process.env.APP_URL || 'http://localhost:3001';
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
    async requestPasswordRecovery(email) {
        const user = await database_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            return { message: 'If the email exists, a password reset link has been sent' };
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000);
        await database_1.default.user.update({
            where: { id: user.id },
            data: {
                confirmationToken: resetToken,
                tokenExpiry: resetTokenExpiry,
            },
        });
        const resetUrl = `${APP_URL}/api/auth/reset-password?token=${resetToken}`;
        try {
            await (0, email_1.sendEmail)({
                to: user.email,
                subject: 'Password Reset Request - Naipes Negros',
                html: email_1.emailTemplates.passwordReset(user.username, resetUrl),
            });
        }
        catch (error) {
            console.error('Failed to send recovery email:', error);
        }
        return { message: 'If the email exists, a password reset link has been sent' };
    }
    async resetPassword(token, newPassword) {
        const user = await database_1.default.user.findFirst({
            where: {
                confirmationToken: token,
                tokenExpiry: {
                    gte: new Date(),
                },
            },
        });
        if (!user) {
            throw new error_middleware_1.AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
        }
        const hashedPassword = await bcrypt_1.default.hash(newPassword, SALT_ROUNDS);
        await database_1.default.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                confirmationToken: null,
                tokenExpiry: null,
            },
        });
        return { message: 'Password has been reset successfully' };
    }
    async confirmEmail(token) {
        const user = await database_1.default.user.findFirst({
            where: {
                confirmationToken: token,
            },
        });
        if (!user) {
            throw new error_middleware_1.AppError('Invalid confirmation token', 400, 'INVALID_TOKEN');
        }
        if (user.enabled) {
            return { message: 'Email already confirmed' };
        }
        await database_1.default.user.update({
            where: { id: user.id },
            data: {
                enabled: true,
                confirmationToken: null,
            },
        });
        return { message: 'Email confirmed successfully' };
    }
    async resendConfirmation(email) {
        const user = await database_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            return { message: 'If the email exists, a confirmation link has been sent' };
        }
        if (user.enabled) {
            throw new error_middleware_1.AppError('Email already confirmed', 400, 'ALREADY_CONFIRMED');
        }
        const confirmToken = crypto_1.default.randomBytes(32).toString('hex');
        await database_1.default.user.update({
            where: { id: user.id },
            data: {
                confirmationToken: confirmToken,
            },
        });
        const confirmUrl = `${APP_URL}/api/auth/confirm-email?token=${confirmToken}`;
        try {
            await (0, email_1.sendEmail)({
                to: user.email,
                subject: 'Confirm Your Email - Naipes Negros',
                html: email_1.emailTemplates.confirmation(user.username, confirmUrl),
            });
        }
        catch (error) {
            console.error('Failed to send confirmation email:', error);
        }
        return { message: 'If the email exists, a confirmation link has been sent' };
    }
}
exports.AuthService = AuthService;
exports.default = new AuthService();
//# sourceMappingURL=auth.service.js.map