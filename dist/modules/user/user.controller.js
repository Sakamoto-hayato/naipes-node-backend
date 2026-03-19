"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = __importDefault(require("./user.service"));
const response_1 = require("../../shared/utils/response");
const error_middleware_1 = require("../../shared/middleware/error.middleware");
class UserController {
    getProfile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const profile = await user_service_1.default.getUserProfile(userId);
        return (0, response_1.successResponse)(res, profile, 'Profile retrieved successfully');
    });
    getByUsername = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { username } = req.params;
        if (!username) {
            throw new error_middleware_1.AppError('Username is required', 400, 'MISSING_FIELDS');
        }
        const profile = await user_service_1.default.getUserByUsername(username);
        return (0, response_1.successResponse)(res, profile, 'User profile retrieved successfully');
    });
    updateProfile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { firstName, lastName, gender, age, profilePicture } = req.body;
        const updatedProfile = await user_service_1.default.updateProfile(userId, {
            firstName,
            lastName,
            gender,
            age: age ? Number(age) : undefined,
            profilePicture,
        });
        return (0, response_1.successResponse)(res, updatedProfile, 'Profile updated successfully');
    });
    updateSettings = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { alternateCards, alternateMode, chatEnabled, soundEnabled } = req.body;
        const updatedSettings = await user_service_1.default.updateSettings(userId, {
            alternateCards,
            alternateMode,
            chatEnabled,
            soundEnabled,
        });
        return (0, response_1.successResponse)(res, updatedSettings, 'Settings updated successfully');
    });
    changePassword = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            throw new error_middleware_1.AppError('Current password and new password are required', 400, 'MISSING_FIELDS');
        }
        const result = await user_service_1.default.changePassword(userId, {
            currentPassword,
            newPassword,
        });
        return (0, response_1.successResponse)(res, result, 'Password changed successfully');
    });
    getStats = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const stats = await user_service_1.default.getUserStats(userId);
        return (0, response_1.successResponse)(res, stats, 'Statistics retrieved successfully');
    });
    getGameHistory = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { limit, offset } = req.query;
        const games = await user_service_1.default.getUserGameHistory(userId, limit ? Number(limit) : 20, offset ? Number(offset) : 0);
        return (0, response_1.successResponse)(res, games, 'Game history retrieved successfully');
    });
    deleteAccount = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { password } = req.body;
        if (!password) {
            throw new error_middleware_1.AppError('Password is required to delete account', 400, 'MISSING_FIELDS');
        }
        const result = await user_service_1.default.deleteAccount(userId, password);
        return (0, response_1.successResponse)(res, result, 'Account deleted successfully');
    });
}
exports.UserController = UserController;
exports.default = new UserController();
//# sourceMappingURL=user.controller.js.map