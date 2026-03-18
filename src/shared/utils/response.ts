import { Response } from 'express';

// API 응답 인터페이스
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// 성공 응답
export function successResponse<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message: message || 'Success',
    data,
  };
  return res.status(statusCode).json(response);
}

// 에러 응답
export function errorResponse(
  res: Response,
  message: string,
  statusCode: number = 400,
  code?: string,
  details?: any
): Response {
  const response: ApiResponse = {
    success: false,
    error: {
      code: code || 'ERROR',
      message,
      details,
    },
  };
  return res.status(statusCode).json(response);
}

// 페이지네이션 응답
export function paginatedResponse<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): Response {
  const response: ApiResponse<T[]> = {
    success: true,
    message: message || 'Success',
    data,
    meta: {
      page,
      limit,
      total,
    },
  };
  return res.status(200).json(response);
}

// Created success response
export function createdResponse<T>(
  res: Response,
  data: T,
  message?: string
): Response {
  return successResponse(res, data, message || 'Created successfully', 201);
}

// 삭제 성공 응답
export function deletedResponse(
  res: Response,
  message?: string
): Response {
  return successResponse(res, null, message || 'Deleted successfully', 200);
}

// 업데이트 성공 응답
export function updatedResponse<T>(
  res: Response,
  data: T,
  message?: string
): Response {
  return successResponse(res, data, message || 'Updated successfully', 200);
}
