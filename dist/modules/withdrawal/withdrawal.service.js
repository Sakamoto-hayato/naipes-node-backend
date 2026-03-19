"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../shared/middleware/error.middleware");
class WithdrawalService {
    async createWithdrawRequest(data) {
        const { userId, amount, method, accountInfo } = data;
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        if (amount <= 0) {
            throw new error_middleware_1.AppError('Amount must be greater than 0', 400, 'INVALID_AMOUNT');
        }
        if (amount > user.coins) {
            throw new error_middleware_1.AppError('Insufficient coins', 400, 'INSUFFICIENT_COINS');
        }
        const pendingRequest = await database_1.default.withdrawRequest.findFirst({
            where: {
                userId,
                status: 'pending',
            },
        });
        if (pendingRequest) {
            throw new error_middleware_1.AppError('You already have a pending withdrawal request', 400, 'PENDING_REQUEST_EXISTS');
        }
        const request = await database_1.default.withdrawRequest.create({
            data: {
                userId,
                amount,
                paymentMethod: method,
                paymentDetails: { accountInfo },
                status: 'pending',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });
        return request;
    }
    async getUserWithdrawRequests(userId, limit = 20, offset = 0) {
        const requests = await database_1.default.withdrawRequest.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
            skip: offset,
        });
        return requests;
    }
    async getWithdrawRequestById(requestId, userId) {
        const request = await database_1.default.withdrawRequest.findUnique({
            where: { id: requestId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });
        if (!request) {
            throw new error_middleware_1.AppError('Withdrawal request not found', 404, 'REQUEST_NOT_FOUND');
        }
        if (request.userId !== userId) {
            throw new error_middleware_1.AppError('Unauthorized access to withdrawal request', 403, 'UNAUTHORIZED');
        }
        return request;
    }
    async cancelWithdrawRequest(requestId, userId) {
        const request = await database_1.default.withdrawRequest.findUnique({
            where: { id: requestId },
        });
        if (!request) {
            throw new error_middleware_1.AppError('Withdrawal request not found', 404, 'REQUEST_NOT_FOUND');
        }
        if (request.userId !== userId) {
            throw new error_middleware_1.AppError('Unauthorized', 403, 'UNAUTHORIZED');
        }
        if (request.status !== 'pending') {
            throw new error_middleware_1.AppError('Can only cancel pending requests', 400, 'INVALID_STATUS');
        }
        await database_1.default.withdrawRequest.update({
            where: { id: requestId },
            data: {
                status: 'cancelled',
                processedAt: new Date(),
            },
        });
        return { message: 'Withdrawal request cancelled successfully' };
    }
    async getAllWithdrawRequests(status, limit = 50, offset = 0) {
        const where = status ? { status } : {};
        const requests = await database_1.default.withdrawRequest.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
            skip: offset,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        coins: true,
                    },
                },
            },
        });
        return requests;
    }
    async updateWithdrawRequest(requestId, data) {
        const request = await database_1.default.withdrawRequest.findUnique({
            where: { id: requestId },
        });
        if (!request) {
            throw new error_middleware_1.AppError('Withdrawal request not found', 404, 'REQUEST_NOT_FOUND');
        }
        if (request.status !== 'pending') {
            throw new error_middleware_1.AppError('Can only update pending requests', 400, 'INVALID_STATUS');
        }
        if (data.status === 'approved') {
            const user = await database_1.default.user.findUnique({
                where: { id: request.userId },
            });
            if (!user) {
                throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
            }
            if (user.coins < request.amount) {
                throw new error_middleware_1.AppError('User has insufficient coins', 400, 'INSUFFICIENT_COINS');
            }
            await database_1.default.$transaction(async (tx) => {
                await tx.user.update({
                    where: { id: request.userId },
                    data: {
                        coins: user.coins - request.amount,
                    },
                });
                await tx.transaction.create({
                    data: {
                        userId: request.userId,
                        operation: 5,
                        amount: -request.amount,
                        balanceBefore: user.coins,
                        balanceAfter: user.coins - request.amount,
                        description: `Withdrawal approved: ${request.paymentMethod}`,
                        externalId: requestId,
                    },
                });
                await tx.withdrawRequest.update({
                    where: { id: requestId },
                    data: {
                        status: data.status,
                        adminNotes: data.adminNotes,
                        processedAt: new Date(),
                    },
                });
            });
            return { message: 'Withdrawal request approved and processed' };
        }
        const updated = await database_1.default.withdrawRequest.update({
            where: { id: requestId },
            data: {
                status: data.status,
                adminNotes: data.adminNotes,
                processedAt: new Date(),
            },
        });
        return updated;
    }
    async getWithdrawStatistics() {
        const stats = await database_1.default.withdrawRequest.groupBy({
            by: ['status'],
            _sum: {
                amount: true,
            },
            _count: {
                id: true,
            },
        });
        const totalRequests = await database_1.default.withdrawRequest.count();
        const pendingRequests = await database_1.default.withdrawRequest.count({
            where: { status: 'pending' },
        });
        return {
            totalRequests,
            pendingRequests,
            byStatus: stats,
        };
    }
}
exports.default = new WithdrawalService();
//# sourceMappingURL=withdrawal.service.js.map