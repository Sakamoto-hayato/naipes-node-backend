import { Request, Response } from 'express';
import coinService from './coin.service';
import iapService, { Platform } from '../../shared/services/iap.service';
import { successResponse, createdResponse } from '../../shared/utils/response';
import { asyncHandler, AppError } from '../../shared/middleware/error.middleware';

export class CoinController {
  // GET /api/coins/packages - Get active coin packages
  getPackages = asyncHandler(async (_req: Request, res: Response) => {
    const packages = await coinService.getActiveCoinPackages();
    return successResponse(res, packages, 'Coin packages retrieved successfully');
  });

  // GET /api/coins/packages/:id - Get package by ID
  getPackageById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError('Package ID is required', 400, 'MISSING_FIELDS');
    }

    const coinPackage = await coinService.getCoinPackageById(id);
    return successResponse(res, coinPackage, 'Coin package retrieved successfully');
  });

  // POST /api/coins/purchase - Purchase coin package
  purchasePackage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { packageId, paymentMethod, externalId } = req.body;

    if (!packageId || !paymentMethod) {
      throw new AppError('Package ID and payment method are required', 400, 'MISSING_FIELDS');
    }

    const result = await coinService.purchaseCoinPackage({
      packageId,
      userId,
      paymentMethod,
      externalId,
    });

    return createdResponse(res, result, 'Coin package purchased successfully');
  });

  // GET /api/coins/transactions - Get user's transaction history
  getTransactions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { limit, offset } = req.query;

    const transactions = await coinService.getUserTransactions(
      userId,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0
    );

    return successResponse(res, transactions, 'Transactions retrieved successfully');
  });

  // GET /api/coins/transactions/:id - Get transaction by ID
  getTransactionById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;

    if (!id) {
      throw new AppError('Transaction ID is required', 400, 'MISSING_FIELDS');
    }

    const transaction = await coinService.getTransactionById(id, userId);
    return successResponse(res, transaction, 'Transaction retrieved successfully');
  });

  // POST /api/coins/verify-purchase - Verify IAP receipt and grant coins
  verifyAndPurchase = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { platform, productId, purchaseToken, transactionId, packageId } = req.body;

    if (!platform || !productId || !purchaseToken || !packageId) {
      throw new AppError('platform, productId, purchaseToken, and packageId are required', 400, 'MISSING_FIELDS');
    }

    // Verify the purchase with Google/Apple
    const verification = await iapService.verifyPurchase({
      platform: platform as Platform,
      productId,
      purchaseToken,
      transactionId,
    });

    if (!verification.valid) {
      throw new AppError(verification.error || 'Purchase verification failed', 400, 'INVALID_PURCHASE');
    }

    // Grant coins via existing purchase flow
    const result = await coinService.purchaseCoinPackage({
      packageId,
      userId,
      paymentMethod: platform,
      externalId: verification.transactionId,
    });

    return createdResponse(res, result, 'Purchase verified and coins granted');
  });

  // ========== Admin Routes ==========

  // GET /api/coins/admin/packages - Get all packages (admin)
  getAllPackages = asyncHandler(async (_req: Request, res: Response) => {
    const packages = await coinService.getAllCoinPackages();
    return successResponse(res, packages, 'All coin packages retrieved successfully');
  });

  // POST /api/coins/admin/packages - Create coin package (admin)
  createPackage = asyncHandler(async (req: Request, res: Response) => {
    const { name, coins, price, currency, bonus, sortOrder } = req.body;

    if (!name || !coins || !price) {
      throw new AppError('Name, coins, and price are required', 400, 'MISSING_FIELDS');
    }

    const coinPackage = await coinService.createCoinPackage({
      name,
      coins: Number(coins),
      price: Number(price),
      currency,
      bonus: bonus ? Number(bonus) : 0,
      sortOrder: sortOrder ? Number(sortOrder) : 0,
    });

    return createdResponse(res, coinPackage, 'Coin package created successfully');
  });

  // PUT /api/coins/admin/packages/:id - Update coin package (admin)
  updatePackage = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, coins, price, currency, bonus, isActive, sortOrder } = req.body;

    if (!id) {
      throw new AppError('Package ID is required', 400, 'MISSING_FIELDS');
    }

    const coinPackage = await coinService.updateCoinPackage(id, {
      name,
      coins: coins !== undefined ? Number(coins) : undefined,
      price: price !== undefined ? Number(price) : undefined,
      currency,
      bonus: bonus !== undefined ? Number(bonus) : undefined,
      isActive,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
    });

    return successResponse(res, coinPackage, 'Coin package updated successfully');
  });

  // DELETE /api/coins/admin/packages/:id - Delete coin package (admin)
  deletePackage = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError('Package ID is required', 400, 'MISSING_FIELDS');
    }

    const result = await coinService.deleteCoinPackage(id);
    return successResponse(res, result, 'Coin package deleted successfully');
  });

  // GET /api/coins/admin/transactions - Get all transactions (admin)
  getAllTransactions = asyncHandler(async (req: Request, res: Response) => {
    const { limit, offset } = req.query;

    const transactions = await coinService.getAllTransactions(
      limit ? Number(limit) : 100,
      offset ? Number(offset) : 0
    );

    return successResponse(res, transactions, 'All transactions retrieved successfully');
  });

  // GET /api/coins/admin/stats - Get transaction stats (admin)
  getStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await coinService.getTransactionStats();
    return successResponse(res, stats, 'Transaction statistics retrieved successfully');
  });
}

export default new CoinController();
