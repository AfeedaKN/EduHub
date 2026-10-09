import { Request, Response, NextFunction } from 'express';
import { ITokenService, TokenPayload } from '../services/TokenService';
import { UserRole } from '../dtos/auth.dto';
import { UnauthorizedError, ForbiddenError } from '../../../shared/domain/errors/AppError';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function createAuthenticateMiddleware(tokenService: ITokenService) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Authentication required. Missing Bearer token.', 'UNAUTHORIZED'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new UnauthorizedError('Authentication token is missing.', 'UNAUTHORIZED'));
    }

    try {
      const payload = tokenService.verifyAccessToken(token);
      req.user = payload;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required.', 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Required role: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`,
          'INSUFFICIENT_PERMISSIONS'
        )
      );
    }

    next();
  };
}
