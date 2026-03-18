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

// Error handling middleware
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  // Check if error is AppError type
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';

  // Log error
  if (statusCode >= 500) {
    logger.error(`${code}: ${err.message}`, { stack: err.stack });
  } else {
    logger.warn(`${code}: ${err.message}`);
  }

  // Hide stack trace in production environment
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

// 404 handler
export function notFoundHandler(_req: Request, res: Response): Response {
  return res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  });
}

// Async handler wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
