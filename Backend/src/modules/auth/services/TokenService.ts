import jwt from 'jsonwebtoken';
import { UserRole } from '../dtos/auth.dto';
import { UnauthorizedError } from '../../../shared/domain/errors/AppError';
import { generateSecureToken } from '../../../shared/utils/cryptoUtils';

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export interface ITokenService {
  generateAccessToken(payload: TokenPayload): string;
  verifyAccessToken(token: string): TokenPayload;
  generateRefreshToken(): string;
}

export class TokenService implements ITokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string = '15m'
  ) {}

  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn as any,
      issuer: 'EduHub',
      audience: 'EduHubUsers',
    });
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.secret, {
        issuer: 'EduHub',
        audience: 'EduHubUsers',
      }) as TokenPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Access token has expired', 'TOKEN_EXPIRED');
      }
      throw new UnauthorizedError('Invalid access token', 'INVALID_TOKEN');
    }
  }

  generateRefreshToken(): string {
    return generateSecureToken(40);
  }
}
