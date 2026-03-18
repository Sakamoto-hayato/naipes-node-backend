"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
exports.paginatedResponse = paginatedResponse;
exports.createdResponse = createdResponse;
exports.deletedResponse = deletedResponse;
exports.updatedResponse = updatedResponse;
function successResponse(res, data, message, statusCode = 200) {
    const response = {
        success: true,
        message: message || 'Success',
        data,
    };
    return res.status(statusCode).json(response);
}
function errorResponse(res, message, statusCode = 400, code, details) {
    const response = {
        success: false,
        error: {
            code: code || 'ERROR',
            message,
            details,
        },
    };
    return res.status(statusCode).json(response);
}
function paginatedResponse(res, data, page, limit, total, message) {
    const response = {
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
function createdResponse(res, data, message) {
    return successResponse(res, data, message || 'Created successfully', 201);
}
function deletedResponse(res, message) {
    return successResponse(res, null, message || 'Deleted successfully', 200);
}
function updatedResponse(res, data, message) {
    return successResponse(res, data, message || 'Updated successfully', 200);
}
//# sourceMappingURL=response.js.map