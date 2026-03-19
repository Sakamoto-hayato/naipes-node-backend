import prisma from '../../config/database';
import { AppError } from '../../shared/middleware/error.middleware';

export interface CreateWithdrawRequestDto {
  userId: string;
  amount: number;
  method: string;
  accountInfo: string;
}

export interface UpdateWithdrawRequestDto {
  status: string;
  adminNotes?: string;
}

class WithdrawalService {
  // Create a withdrawal request
  async createWithdrawRequest(data: CreateWithdrawRequestDto) {
    const { userId, amount, method, accountInfo } = data;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Validate amount
    if (amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400, 'INVALID_AMOUNT');
    }

    if (amount > user.coins) {
      throw new AppError('Insufficient coins', 400, 'INSUFFICIENT_COINS');
    }

    // Check for pending requests
    const pendingRequest = await prisma.withdrawRequest.findFirst({
      where: {
        userId,
        status: 'pending',
      },
    });

    if (pendingRequest) {
      throw new AppError('You already have a pending withdrawal request', 400, 'PENDING_REQUEST_EXISTS');
    }

    // Create withdrawal request
    const request = await prisma.withdrawRequest.create({
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

  // Get user's withdrawal requests
  async getUserWithdrawRequests(userId: string, limit: number = 20, offset: number = 0) {
    const requests = await prisma.withdrawRequest.findMany({
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

  // Get withdrawal request by ID
  async getWithdrawRequestById(requestId: string, userId: string) {
    const request = await prisma.withdrawRequest.findUnique({
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
      throw new AppError('Withdrawal request not found', 404, 'REQUEST_NOT_FOUND');
    }

    // Verify request belongs to user
    if (request.userId !== userId) {
      throw new AppError('Unauthorized access to withdrawal request', 403, 'UNAUTHORIZED');
    }

    return request;
  }

  // Cancel withdrawal request (user can only cancel pending requests)
  async cancelWithdrawRequest(requestId: string, userId: string) {
    const request = await prisma.withdrawRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new AppError('Withdrawal request not found', 404, 'REQUEST_NOT_FOUND');
    }

    if (request.userId !== userId) {
      throw new AppError('Unauthorized', 403, 'UNAUTHORIZED');
    }

    if (request.status !== 'pending') {
      throw new AppError('Can only cancel pending requests', 400, 'INVALID_STATUS');
    }

    await prisma.withdrawRequest.update({
      where: { id: requestId },
      data: {
        status: 'cancelled',
        processedAt: new Date(),
      },
    });

    return { message: 'Withdrawal request cancelled successfully' };
  }

  // ========== Admin Functions ==========

  // Get all withdrawal requests (admin)
  async getAllWithdrawRequests(status?: string, limit: number = 50, offset: number = 0) {
    const where = status ? { status } : {};

    const requests = await prisma.withdrawRequest.findMany({
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

  // Update withdrawal request status (admin)
  async updateWithdrawRequest(requestId: string, data: UpdateWithdrawRequestDto) {
    const request = await prisma.withdrawRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new AppError('Withdrawal request not found', 404, 'REQUEST_NOT_FOUND');
    }

    if (request.status !== 'pending') {
      throw new AppError('Can only update pending requests', 400, 'INVALID_STATUS');
    }

    // If approving, deduct coins from user
    if (data.status === 'approved') {
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      if (user.coins < request.amount) {
        throw new AppError('User has insufficient coins', 400, 'INSUFFICIENT_COINS');
      }

      // Deduct coins and create transaction in atomic operation
      await prisma.$transaction(async (tx) => {
        // Update user coins
        await tx.user.update({
          where: { id: request.userId },
          data: {
            coins: user.coins - request.amount,
          },
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: request.userId,
            operation: 5, // 5=CHARGEBACK (withdrawal)
            amount: -request.amount,
            balanceBefore: user.coins,
            balanceAfter: user.coins - request.amount,
            description: `Withdrawal approved: ${request.paymentMethod}`,
            externalId: requestId,
          },
        });

        // Update withdrawal request
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

    // For rejection or other status updates
    const updated = await prisma.withdrawRequest.update({
      where: { id: requestId },
      data: {
        status: data.status,
        adminNotes: data.adminNotes,
        processedAt: new Date(),
      },
    });

    return updated;
  }

  // Get withdrawal statistics (admin)
  async getWithdrawStatistics() {
    const stats = await prisma.withdrawRequest.groupBy({
      by: ['status'],
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const totalRequests = await prisma.withdrawRequest.count();
    const pendingRequests = await prisma.withdrawRequest.count({
      where: { status: 'pending' },
    });

    return {
      totalRequests,
      pendingRequests,
      byStatus: stats,
    };
  }
}

export default new WithdrawalService();
