"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinController = void 0;
const coin_service_1 = __importDefault(require("./coin.service"));
const response_1 = require("../../shared/utils/response");
const error_middleware_1 = require("../../shared/middleware/error.middleware");
class CoinController {
    getPackages = (0, error_middleware_1.asyncHandler)(async (_req, res) => {
        const packages = await coin_service_1.default.getActiveCoinPackages();
        return (0, response_1.successResponse)(res, packages, 'Coin packages retrieved successfully');
    });
    getPackageById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        if (!id) {
            throw new error_middleware_1.AppError('Package ID is required', 400, 'MISSING_FIELDS');
        }
        const coinPackage = await coin_service_1.default.getCoinPackageById(id);
        return (0, response_1.successResponse)(res, coinPackage, 'Coin package retrieved successfully');
    });
    purchasePackage = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { packageId, paymentMethod, externalId } = req.body;
        if (!packageId || !paymentMethod) {
            throw new error_middleware_1.AppError('Package ID and payment method are required', 400, 'MISSING_FIELDS');
        }
        const result = await coin_service_1.default.purchaseCoinPackage({
            packageId,
            userId,
            paymentMethod,
            externalId,
        });
        return (0, response_1.createdResponse)(res, result, 'Coin package purchased successfully');
    });
    getTransactions = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { limit, offset } = req.query;
        const transactions = await coin_service_1.default.getUserTransactions(userId, limit ? Number(limit) : 50, offset ? Number(offset) : 0);
        return (0, response_1.successResponse)(res, transactions, 'Transactions retrieved successfully');
    });
    getTransactionById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { id } = req.params;
        if (!id) {
            throw new error_middleware_1.AppError('Transaction ID is required', 400, 'MISSING_FIELDS');
        }
        const transaction = await coin_service_1.default.getTransactionById(id, userId);
        return (0, response_1.successResponse)(res, transaction, 'Transaction retrieved successfully');
    });
    getAllPackages = (0, error_middleware_1.asyncHandler)(async (_req, res) => {
        const packages = await coin_service_1.default.getAllCoinPackages();
        return (0, response_1.successResponse)(res, packages, 'All coin packages retrieved successfully');
    });
    createPackage = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { name, coins, price, currency, bonus, sortOrder } = req.body;
        if (!name || !coins || !price) {
            throw new error_middleware_1.AppError('Name, coins, and price are required', 400, 'MISSING_FIELDS');
        }
        const coinPackage = await coin_service_1.default.createCoinPackage({
            name,
            coins: Number(coins),
            price: Number(price),
            currency,
            bonus: bonus ? Number(bonus) : 0,
            sortOrder: sortOrder ? Number(sortOrder) : 0,
        });
        return (0, response_1.createdResponse)(res, coinPackage, 'Coin package created successfully');
    });
    updatePackage = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const { name, coins, price, currency, bonus, isActive, sortOrder } = req.body;
        if (!id) {
            throw new error_middleware_1.AppError('Package ID is required', 400, 'MISSING_FIELDS');
        }
        const coinPackage = await coin_service_1.default.updateCoinPackage(id, {
            name,
            coins: coins !== undefined ? Number(coins) : undefined,
            price: price !== undefined ? Number(price) : undefined,
            currency,
            bonus: bonus !== undefined ? Number(bonus) : undefined,
            isActive,
            sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
        });
        return (0, response_1.successResponse)(res, coinPackage, 'Coin package updated successfully');
    });
    deletePackage = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        if (!id) {
            throw new error_middleware_1.AppError('Package ID is required', 400, 'MISSING_FIELDS');
        }
        const result = await coin_service_1.default.deleteCoinPackage(id);
        return (0, response_1.successResponse)(res, result, 'Coin package deleted successfully');
    });
    getAllTransactions = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { limit, offset } = req.query;
        const transactions = await coin_service_1.default.getAllTransactions(limit ? Number(limit) : 100, offset ? Number(offset) : 0);
        return (0, response_1.successResponse)(res, transactions, 'All transactions retrieved successfully');
    });
    getStats = (0, error_middleware_1.asyncHandler)(async (_req, res) => {
        const stats = await coin_service_1.default.getTransactionStats();
        return (0, response_1.successResponse)(res, stats, 'Transaction statistics retrieved successfully');
    });
}
exports.CoinController = CoinController;
exports.default = new CoinController();
//# sourceMappingURL=coin.controller.js.map