"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
exports.asyncHandler = asyncHandler;
const logger_1 = __importDefault(require("../../config/logger"));
class AppError extends Error {
    statusCode;
    code;
    isOperational;
    constructor(message, statusCode = 500, code = 'ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
function errorHandler(err, _req, res, _next) {
    const isAppError = err instanceof AppError;
    const statusCode = isAppError ? err.statusCode : 500;
    const code = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';
    if (statusCode >= 500) {
        logger_1.default.error(`${code}: ${err.message}`, { stack: err.stack });
    }
    else {
        logger_1.default.warn(`${code}: ${err.message}`);
    }
    const response = {
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
function notFoundHandler(_req, res) {
    return res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'The requested resource was not found',
        },
    });
}
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=error.middleware.js.map