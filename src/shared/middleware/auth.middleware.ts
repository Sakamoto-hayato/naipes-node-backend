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

// 인증 미들웨어
export function authenticate(req: Request, res: Response, next: NextFunction): void | Response {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'No token provided', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거

    // 토큰 검증
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return errorResponse(res, 'Invalid or expired token', 401, 'UNAUTHORIZED');
    }

    // 요청 객체에 사용자 정보 추가
    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, 'Authentication failed', 401, 'UNAUTHORIZED');
  }
}

// 선택적 인증 미들웨어 (토큰이 있으면 검증, 없으면 통과)
export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
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
