"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = __importDefault(require("./auth.service"));
const response_1 = require("../../shared/utils/response");
const error_middleware_1 = require("../../shared/middleware/error.middleware");
class AuthController {
    register = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { email, username, password, firstName, lastName } = req.body;
        const result = await auth_service_1.default.register({
            email,
            username,
            password,
            firstName,
            lastName,
        });
        return (0, response_1.createdResponse)(res, result, 'User registered successfully');
    });
    login = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { email, password } = req.body;
        const result = await auth_service_1.default.login({ email, password });
        return (0, response_1.successResponse)(res, result, 'Login successful');
    });
    refreshToken = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { refreshToken } = req.body;
        const result = await auth_service_1.default.refreshToken(refreshToken);
        return (0, response_1.successResponse)(res, result, 'Token refreshed successfully');
    });
    getMe = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new Error('User not authenticated');
        }
        const user = await auth_service_1.default.getMe(userId);
        return (0, response_1.successResponse)(res, user, 'User retrieved successfully');
    });
    requestPasswordRecovery = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { email } = req.body;
        const result = await auth_service_1.default.requestPasswordRecovery(email);
        return (0, response_1.successResponse)(res, result, result.message);
    });
    resetPassword = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { token, password } = req.body;
        const result = await auth_service_1.default.resetPassword(token, password);
        return (0, response_1.successResponse)(res, result, result.message);
    });
    confirmEmail = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            throw new Error('Token is required');
        }
        const result = await auth_service_1.default.confirmEmail(token);
        return (0, response_1.successResponse)(res, result, result.message);
    });
    resendConfirmation = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { email } = req.body;
        const result = await auth_service_1.default.resendConfirmation(email);
        return (0, response_1.successResponse)(res, result, result.message);
    });
}
exports.AuthController = AuthController;
exports.default = new AuthController();
//# sourceMappingURL=auth.controller.js.map