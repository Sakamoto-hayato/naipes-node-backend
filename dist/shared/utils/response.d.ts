import { Response } from 'express';
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
export declare function successResponse<T>(res: Response, data: T, message?: string, statusCode?: number): Response;
export declare function errorResponse(res: Response, message: string, statusCode?: number, code?: string, details?: any): Response;
export declare function paginatedResponse<T>(res: Response, data: T[], page: number, limit: number, total: number, message?: string): Response;
export declare function createdResponse<T>(res: Response, data: T, message?: string): Response;
export declare function deletedResponse(res: Response, message?: string): Response;
export declare function updatedResponse<T>(res: Response, data: T, message?: string): Response;
//# sourceMappingURL=response.d.ts.map