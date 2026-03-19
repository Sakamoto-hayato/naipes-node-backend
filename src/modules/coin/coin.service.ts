import prisma from '../../config/database';
import { AppError } from '../../shared/middleware/error.middleware';

export interface CreateCoinPackageDto {
  name: string;
  coins: number;
  price: number;
  currency?: string;
  bonus?: number;
  sortOrder?: number;
}

export interface UpdateCoinPackageDto {
  name?: string;
  coins?: number;
  price?: number;
  currency?: string;
  bonus?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface PurchaseCoinPackageDto {
  packageId: string;
  userId: string;
  paymentMethod: string;
  externalId?: string;
}

class CoinService {
  // Get all active coin packages
  async getActiveCoinPackages() {
    const packages = await prisma.coinPackage.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return packages;
  }

  // Get all coin packages (admin)
  async getAllCoinPackages() {
    const packages = await prisma.coinPackage.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return packages;
  }

  // Get coin package by ID
  async getCoinPackageById(packageId: string) {
    const coinPackage = await prisma.coinPackage.findUnique({
      where: { id: packageId },
    });

    if (!coinPackage) {
      throw new AppError('Coin package not found', 404, 'PACKAGE_NOT_FOUND');
    }

    return coinPackage;
  }

  // Create coin package (admin)
  async createCoinPackage(data: CreateCoinPackageDto) {
    const coinPackage = await prisma.coinPackage.create({
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

  // Update coin package (admin)
  async updateCoinPackage(packageId: string, data: UpdateCoinPackageDto) {
    const coinPackage = await prisma.coinPackage.findUnique({
      where: { id: packageId },
    });

    if (!coinPackage) {
      throw new AppError('Coin package not found', 404, 'PACKAGE_NOT_FOUND');
    }

    const updated = await prisma.coinPackage.update({
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

  // Delete coin package (admin)
  async deleteCoinPackage(packageId: string) {
    const coinPackage = await prisma.coinPackage.findUnique({
      where: { id: packageId },
    });

    if (!coinPackage) {
      throw new AppError('Coin package not found', 404, 'PACKAGE_NOT_FOUND');
    }

    await prisma.coinPackage.delete({
      where: { id: packageId },
    });

    return { message: 'Coin package deleted successfully' };
  }

  // Purchase coin package
  async purchaseCoinPackage(data: PurchaseCoinPackageDto) {
    const { packageId, userId, externalId } = data;

    // Get package details
    const coinPackage = await prisma.coinPackage.findUnique({
      where: { id: packageId },
    });

    if (!coinPackage) {
      throw new AppError('Coin package not found', 404, 'PACKAGE_NOT_FOUND');
    }

    if (!coinPackage.isActive) {
      throw new AppError('This coin package is not available', 400, 'PACKAGE_INACTIVE');
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Calculate total coins (base + bonus)
    const totalCoins = coinPackage.coins + coinPackage.bonus;
    const balanceBefore = user.coins;
    const balanceAfter = balanceBefore + totalCoins;

    // Create transaction and update user coins in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          operation: 1, // 1=PURCHASE
          amount: totalCoins,
          balanceBefore,
          balanceAfter,
          description: `Purchased ${coinPackage.name} package`,
          externalId,
        },
      });

      // Update user coins
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

  // Get user transaction history
  async getUserTransactions(userId: string, limit: number = 50, offset: number = 0) {
    const transactions = await prisma.transaction.findMany({
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

  // Get transaction by ID
  async getTransactionById(transactionId: string, userId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
    }

    // Verify transaction belongs to user
    if (transaction.userId !== userId) {
      throw new AppError('Unauthorized access to transaction', 403, 'UNAUTHORIZED');
    }

    return transaction;
  }

  // Admin: Get all transactions
  async getAllTransactions(limit: number = 100, offset: number = 0) {
    const transactions = await prisma.transaction.findMany({
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

  // Admin: Get transaction statistics
  async getTransactionStats() {
    const stats = await prisma.transaction.aggregate({
      where: {
        operation: 1, // 1=PURCHASE
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    const recentTransactions = await prisma.transaction.findMany({
      where: {
        operation: 1, // 1=PURCHASE
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

export default new CoinService();
