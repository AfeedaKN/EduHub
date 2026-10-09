import { describe, it, expect } from 'vitest';
import { TokenService } from '../../../src/modules/auth/services/TokenService';
import { UserRole } from '../../../src/modules/auth/dtos/auth.dto';
import { UnauthorizedError } from '../../../src/shared/domain/errors/AppError';

describe('TokenService', () => {
  const secret = 'test-secret-key-12345678901234567890';
  const tokenService = new TokenService(secret, '15m');

  it('should generate and verify valid JWT access token', () => {
    const payload = {
      sub: 'user-id-123',
      email: 'parent@school.org',
      role: UserRole.PARENT,
      fullName: 'Sarah Parent',
    };

    const token = tokenService.generateAccessToken(payload);
    expect(token).toBeDefined();

    const verified = tokenService.verifyAccessToken(token);
    expect(verified.sub).toBe(payload.sub);
    expect(verified.email).toBe(payload.email);
    expect(verified.role).toBe(payload.role);
    expect(verified.fullName).toBe(payload.fullName);
  });

  it('should throw UnauthorizedError on invalid token signature', () => {
    expect(() => tokenService.verifyAccessToken('invalid.jwt.token')).toThrow(UnauthorizedError);
  });

  it('should generate random opaque refresh token string', () => {
    const token1 = tokenService.generateRefreshToken();
    const token2 = tokenService.generateRefreshToken();

    expect(token1).toHaveLength(80); // 40 bytes hex = 80 chars
    expect(token1).not.toBe(token2);
  });
});
