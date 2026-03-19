import { Request, Response } from 'express';
import withdrawalService from './withdrawal.service';
import { successResponse, createdResponse } from '../../shared/utils/response';
import { asyncHandler, AppError } from '../../shared/middleware/error.middleware';

export class WithdrawalController {
  // POST /api/withdrawals - Create withdrawal request
  createRequest = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { amount, method, accountInfo } = req.body;

    if (!amount || !method || !accountInfo) {
      throw new AppError('Amount, method, and account info are required', 400, 'MISSING_FIELDS');
    }

    const request = await withdrawalService.createWithdrawRequest({
      userId,
      amount: Number(amount),
      method,
      accountInfo,
    });

    return createdResponse(res, request, 'Withdrawal request created successfully');
  });

  // GET /api/withdrawals/my-requests - Get user's withdrawal requests
  getMyRequests = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { limit, offset } = req.query;

    const requests = await withdrawalService.getUserWithdrawRequests(
      userId,
      limit ? Number(limit) : 20,
      offset ? Number(offset) : 0
    );

    return successResponse(res, requests, 'Withdrawal requests retrieved successfully');
  });

  // GET /api/withdrawals/:id - Get withdrawal request by ID
  getRequestById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;

    if (!id) {
      throw new AppError('Request ID is required', 400, 'MISSING_FIELDS');
    }

    const request = await withdrawalService.getWithdrawRequestById(id, userId);
    return successResponse(res, request, 'Withdrawal request retrieved successfully');
  });

  // POST /api/withdrawals/:id/cancel - Cancel withdrawal request
  cancelRequest = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;

    if (!id) {
      throw new AppError('Request ID is required', 400, 'MISSING_FIELDS');
    }

    const result = await withdrawalService.cancelWithdrawRequest(id, userId);
    return successResponse(res, result, 'Withdrawal request cancelled successfully');
  });

  // ========== Admin Routes ==========

  // GET /api/withdrawals/admin/all - Get all withdrawal requests (admin)
  getAllRequests = asyncHandler(async (req: Request, res: Response) => {
    const { status, limit, offset } = req.query;

    const requests = await withdrawalService.getAllWithdrawRequests(
      status as string | undefined,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0
    );

    return successResponse(res, requests, 'All withdrawal requests retrieved successfully');
  });

  // PUT /api/withdrawals/admin/:id - Update withdrawal request (admin)
  updateRequest = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!id) {
      throw new AppError('Request ID is required', 400, 'MISSING_FIELDS');
    }

    if (!status) {
      throw new AppError('Status is required', 400, 'MISSING_FIELDS');
    }

    const result = await withdrawalService.updateWithdrawRequest(id, {
      status,
      adminNotes,
    });

    return successResponse(res, result, 'Withdrawal request updated successfully');
  });

  // GET /api/withdrawals/admin/stats - Get withdrawal statistics (admin)
  getStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await withdrawalService.getWithdrawStatistics();
    return successResponse(res, stats, 'Withdrawal statistics retrieved successfully');
  });
}

export default new WithdrawalController();
