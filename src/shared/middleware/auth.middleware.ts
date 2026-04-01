import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { errorResponse } from '../utils/response';

// Express Request 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Authentication middleware
export function authenticate(req: Request, res: Response, next: NextFunction): void | Response {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'No token provided', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거

    // Verify token
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return errorResponse(res, 'Invalid or expired token', 401, 'UNAUTHORIZED');
    }

    // Add user info to request object
    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, 'Authentication failed', 401, 'UNAUTHORIZED');
  }
}

// Admin authentication middleware (must be used after authenticate)
// Admin emails configured via ADMIN_EMAILS env var (comma-separated)
export function requireAdmin(req: Request, res: Response, next: NextFunction): void | Response {
  if (!req.user) {
    return errorResponse(res, 'Authentication required', 401, 'UNAUTHORIZED');
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

  if (adminEmails.length === 0) {
    return errorResponse(res, 'No admin users configured', 403, 'FORBIDDEN');
  }

  if (!adminEmails.includes(req.user.email.toLowerCase())) {
    return errorResponse(res, 'Admin access required', 403, 'FORBIDDEN');
  }

  next();
}

// Optional authentication middleware (verify if token exists, pass through if not)
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);

      if (decoded) {
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    next();
  }
}
