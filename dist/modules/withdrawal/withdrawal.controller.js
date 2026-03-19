"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalController = void 0;
const withdrawal_service_1 = __importDefault(require("./withdrawal.service"));
const response_1 = require("../../shared/utils/response");
const error_middleware_1 = require("../../shared/middleware/error.middleware");
class WithdrawalController {
    createRequest = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { amount, method, accountInfo } = req.body;
        if (!amount || !method || !accountInfo) {
            throw new error_middleware_1.AppError('Amount, method, and account info are required', 400, 'MISSING_FIELDS');
        }
        const request = await withdrawal_service_1.default.createWithdrawRequest({
            userId,
            amount: Number(amount),
            method,
            accountInfo,
        });
        return (0, response_1.createdResponse)(res, request, 'Withdrawal request created successfully');
    });
    getMyRequests = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { limit, offset } = req.query;
        const requests = await withdrawal_service_1.default.getUserWithdrawRequests(userId, limit ? Number(limit) : 20, offset ? Number(offset) : 0);
        return (0, response_1.successResponse)(res, requests, 'Withdrawal requests retrieved successfully');
    });
    getRequestById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { id } = req.params;
        if (!id) {
            throw new error_middleware_1.AppError('Request ID is required', 400, 'MISSING_FIELDS');
        }
        const request = await withdrawal_service_1.default.getWithdrawRequestById(id, userId);
        return (0, response_1.successResponse)(res, request, 'Withdrawal request retrieved successfully');
    });
    cancelRequest = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { id } = req.params;
        if (!id) {
            throw new error_middleware_1.AppError('Request ID is required', 400, 'MISSING_FIELDS');
        }
        const result = await withdrawal_service_1.default.cancelWithdrawRequest(id, userId);
        return (0, response_1.successResponse)(res, result, 'Withdrawal request cancelled successfully');
    });
    getAllRequests = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { status, limit, offset } = req.query;
        const requests = await withdrawal_service_1.default.getAllWithdrawRequests(status, limit ? Number(limit) : 50, offset ? Number(offset) : 0);
        return (0, response_1.successResponse)(res, requests, 'All withdrawal requests retrieved successfully');
    });
    updateRequest = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        if (!id) {
            throw new error_middleware_1.AppError('Request ID is required', 400, 'MISSING_FIELDS');
        }
        if (!status) {
            throw new error_middleware_1.AppError('Status is required', 400, 'MISSING_FIELDS');
        }
        const result = await withdrawal_service_1.default.updateWithdrawRequest(id, {
            status,
            adminNotes,
        });
        return (0, response_1.successResponse)(res, result, 'Withdrawal request updated successfully');
    });
    getStats = (0, error_middleware_1.asyncHandler)(async (_req, res) => {
        const stats = await withdrawal_service_1.default.getWithdrawStatistics();
        return (0, response_1.successResponse)(res, stats, 'Withdrawal statistics retrieved successfully');
    });
}
exports.WithdrawalController = WithdrawalController;
exports.default = new WithdrawalController();
//# sourceMappingURL=withdrawal.controller.js.map