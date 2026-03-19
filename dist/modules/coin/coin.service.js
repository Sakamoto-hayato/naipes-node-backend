"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../../config/database"));
const error_middleware_1 = require("../../shared/middleware/error.middleware");
class CoinService {
    async getActiveCoinPackages() {
        const packages = await database_1.default.coinPackage.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                sortOrder: 'asc',
            },
        });
        return packages;
    }
    async getAllCoinPackages() {
        const packages = await database_1.default.coinPackage.findMany({
            orderBy: {
                sortOrder: 'asc',
            },
        });
        return packages;
    }
    async getCoinPackageById(packageId) {
        const coinPackage = await database_1.default.coinPackage.findUnique({
            where: { id: packageId },
        });
        if (!coinPackage) {
            throw new error_middleware_1.AppError('Coin package not found', 404, 'PACKAGE_NOT_FOUND');
        }
        return coinPackage;
    }
    async createCoinPackage(data) {
        const coinPackage = await database_1.default.coinPackage.create({
            data: {
                name: data.name,
                coins: data.coins,
                price: data.price,
                currency: data.currency || 'USD',
                bonus: data.bonus || 0,
                sortOrder: data.sortOrder || 0,
            },
        });
        return coinPackage;
    }
    async updateCoinPackage(packageId, data) {
        const coinPackage = await database_1.default.coinPackage.findUnique({
            where: { id: packageId },
        });
        if (!coinPackage) {
            throw new error_middleware_1.AppError('Coin package not found', 404, 'PACKAGE_NOT_FOUND');
        }
        const updated = await database_1.default.coinPackage.update({
            where: { id: packageId },
            data: {
                name: data.name,
                coins: data.coins,
                price: data.price,
                currency: data.currency,
                bonus: data.bonus,
                isActive: data.isActive,
                sortOrder: data.sortOrder,
            },
        });
        return updated;
    }
    async deleteCoinPackage(packageId) {
        const coinPackage = await database_1.default.coinPackage.findUnique({
            where: { id: packageId },
        });
        if (!coinPackage) {
            throw new error_middleware_1.AppError('Coin package not found', 404, 'PACKAGE_NOT_FOUND');
        }
        await database_1.default.coinPackage.delete({
            where: { id: packageId },
        });
        return { message: 'Coin package deleted successfully' };
    }
    async purchaseCoinPackage(data) {
        const { packageId, userId, externalId } = data;
        const coinPackage = await database_1.default.coinPackage.findUnique({
            where: { id: packageId },
        });
        if (!coinPackage) {
            throw new error_middleware_1.AppError('Coin package not found', 404, 'PACKAGE_NOT_FOUND');
        }
        if (!coinPackage.isActive) {
            throw new error_middleware_1.AppError('This coin package is not available', 400, 'PACKAGE_INACTIVE');
        }
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        const totalCoins = coinPackage.coins + coinPackage.bonus;
        const balanceBefore = user.coins;
        const balanceAfter = balanceBefore + totalCoins;
        const result = await database_1.default.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
                data: {
                    userId,
                    operation: 1,
                    amount: totalCoins,
                    balanceBefore,
                    balanceAfter,
                    description: `Purchased ${coinPackage.name} package`,
                    externalId,
                },
            });
            await tx.user.update({
                where: { id: userId },
                data: {
                    coins: balanceAfter,
                },
            });
            return {
                transaction,
                newBalance: balanceAfter,
                coinsAdded: totalCoins,
            };
        });
        return result;
    }
    async getUserTransactions(userId, limit = 50, offset = 0) {
        const transactions = await database_1.default.transaction.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
            skip: offset,
        });
        return transactions;
    }
    async getTransactionById(transactionId, userId) {
        const transaction = await database_1.default.transaction.findUnique({
            where: { id: transactionId },
        });
        if (!transaction) {
            throw new error_middleware_1.AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
        }
        if (transaction.userId !== userId) {
            throw new error_middleware_1.AppError('Unauthorized access to transaction', 403, 'UNAUTHORIZED');
        }
        return transaction;
    }
    async getAllTransactions(limit = 100, offset = 0) {
        const transactions = await database_1.default.transaction.findMany({
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
                    },
                },
            },
        });
        return transactions;
    }
    async getTransactionStats() {
        const stats = await database_1.default.transaction.aggregate({
            where: {
                operation: 1,
            },
            _sum: {
                amount: true,
            },
            _count: true,
        });
        const recentTransactions = await database_1.default.transaction.findMany({
            where: {
                operation: 1,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 10,
            include: {
                user: {
                    select: {
                        username: true,
                    },
                },
            },
        });
        return {
            totalRevenue: stats._sum?.amount || 0,
            totalPurchases: stats._count || 0,
            recentPurchases: recentTransactions,
        };
    }
}
exports.default = new CoinService();
//# sourceMappingURL=coin.service.js.map