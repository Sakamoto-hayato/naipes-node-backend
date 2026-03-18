import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';

export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 에러 핸들링 미들웨어
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  // AppError 타입 체크
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';

  // 에러 로깅
  if (statusCode >= 500) {
    logger.error(`${code}: ${err.message}`, { stack: err.stack });
  } else {
    logger.warn(`${code}: ${err.message}`);
  }

  // 프로덕션 환경에서는 스택 트레이스 숨기기
  const response: any = {
    success: false,
    error: {
      code,
      message: err.message,
    },
  };

  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  return res.status(statusCode).json(response);
}

// 404 핸들러
export function notFoundHandler(_req: Request, res: Response): Response {
  return res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  });
}

// Async 핸들러 래퍼
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
