"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuthenticate = optionalAuthenticate;
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return (0, response_1.errorResponse)(res, 'No token provided', 401, 'UNAUTHORIZED');
        }
        const token = authHeader.substring(7);
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        if (!decoded) {
            return (0, response_1.errorResponse)(res, 'Invalid or expired token', 401, 'UNAUTHORIZED');
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, 'Authentication failed', 401, 'UNAUTHORIZED');
    }
}
function optionalAuthenticate(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = (0, jwt_1.verifyAccessToken)(token);
            if (decoded) {
                req.user = decoded;
            }
        }
        next();
    }
    catch (error) {
        next();
    }
}
//# sourceMappingURL=auth.middleware.js.map