"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../shared/middleware/error.middleware");
const bcrypt_1 = __importDefault(require("bcrypt"));
class UserService {
    async getUserProfile(userId) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                gender: true,
                age: true,
                profilePicture: true,
                coins: true,
                gamesPlayed: true,
                gamesWon: true,
                gamesAbandoned: true,
                points: true,
                position: true,
                tournamentsWon: true,
                alternateCards: true,
                alternateMode: true,
                chatEnabled: true,
                soundEnabled: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        const winRate = user.gamesPlayed > 0
            ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(2)
            : '0.00';
        return {
            ...user,
            winRate: parseFloat(winRate),
        };
    }
    async getUserByUsername(username) {
        const user = await database_1.default.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                profilePicture: true,
                gamesPlayed: true,
                gamesWon: true,
                points: true,
                position: true,
                tournamentsWon: true,
                createdAt: true,
            },
        });
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        const winRate = user.gamesPlayed > 0
            ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(2)
            : '0.00';
        return {
            ...user,
            winRate: parseFloat(winRate),
        };
    }
    async updateProfile(userId, data) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        if (data.gender && !['male', 'female', 'other'].includes(data.gender)) {
            throw new error_middleware_1.AppError('Invalid gender value', 400, 'INVALID_GENDER');
        }
        if (data.age !== undefined && (data.age < 13 || data.age > 120)) {
            throw new error_middleware_1.AppError('Age must be between 13 and 120', 400, 'INVALID_AGE');
        }
        const updatedUser = await database_1.default.user.update({
            where: { id: userId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                gender: data.gender,
                age: data.age,
                profilePicture: data.profilePicture,
            },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                gender: true,
                age: true,
                profilePicture: true,
                coins: true,
                gamesPlayed: true,
                gamesWon: true,
                points: true,
                position: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return updatedUser;
    }
    async updateSettings(userId, data) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        const updatedUser = await database_1.default.user.update({
            where: { id: userId },
            data: {
                alternateCards: data.alternateCards,
                alternateMode: data.alternateMode,
                chatEnabled: data.chatEnabled,
                soundEnabled: data.soundEnabled,
            },
            select: {
                id: true,
                alternateCards: true,
                alternateMode: true,
                chatEnabled: true,
                soundEnabled: true,
            },
        });
        return updatedUser;
    }
    async changePassword(userId, data) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        const isPasswordValid = await bcrypt_1.default.compare(data.currentPassword, user.password);
        if (!isPasswordValid) {
            throw new error_middleware_1.AppError('Current password is incorrect', 401, 'INVALID_PASSWORD');
        }
        if (data.newPassword.length < 6) {
            throw new error_middleware_1.AppError('New password must be at least 6 characters', 400, 'INVALID_PASSWORD');
        }
        const hashedPassword = await bcrypt_1.default.hash(data.newPassword, 10);
        await database_1.default.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
            },
        });
        return { message: 'Password changed successfully' };
    }
    async getUserStats(userId) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                coins: true,
                gamesPlayed: true,
                gamesWon: true,
                gamesAbandoned: true,
                points: true,
                position: true,
                tournamentsWon: true,
            },
        });
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        const gamesLost = user.gamesPlayed - user.gamesWon - user.gamesAbandoned;
        const winRate = user.gamesPlayed > 0
            ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(2)
            : '0.00';
        return {
            ...user,
            gamesLost,
            winRate: parseFloat(winRate),
        };
    }
    async getUserGameHistory(userId, limit = 20, offset = 0) {
        const games = await database_1.default.game.findMany({
            where: {
                OR: [
                    { hostUserId: userId },
                    { guestUserId: userId },
                ],
                status: 'finished',
            },
            orderBy: {
                finishedAt: 'desc',
            },
            take: limit,
            skip: offset,
            include: {
                hostUser: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                    },
                },
                guestUser: {
                    select: {
                        id: true,
                        username: true,
                        profilePicture: true,
                    },
                },
            },
        });
        const formattedGames = games.map(game => {
            const isHost = game.hostUserId === userId;
            const won = game.userWonId === userId;
            const opponent = isHost ? game.guestUser : game.hostUser;
            const myScore = isHost ? game.hostScore : game.guestScore;
            const opponentScore = isHost ? game.guestScore : game.hostScore;
            return {
                id: game.id,
                opponent: opponent ? {
                    id: opponent.id,
                    username: opponent.username,
                    profilePicture: opponent.profilePicture,
                } : null,
                myScore,
                opponentScore,
                stake: game.stake,
                level: game.level,
                isBot: game.isBot,
                won,
                createdAt: game.createdAt,
                finishedAt: game.finishedAt,
            };
        });
        return formattedGames;
    }
    async deleteAccount(userId, password) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new error_middleware_1.AppError('Password is incorrect', 401, 'INVALID_PASSWORD');
        }
        await database_1.default.user.update({
            where: { id: userId },
            data: {
                deletedAt: new Date(),
                enabled: false,
            },
        });
        return { message: 'Account deleted successfully' };
    }
}
exports.default = new UserService();
//# sourceMappingURL=user.service.js.map