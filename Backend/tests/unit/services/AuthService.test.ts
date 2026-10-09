import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../../../src/modules/auth/services/AuthService';
import { IUserRepository } from '../../../src/modules/auth/interfaces/IUserRepository';
import { IRefreshSessionRepository } from '../../../src/modules/auth/interfaces/IRefreshSessionRepository';
import { IVerificationChallengeRepository } from '../../../src/modules/auth/interfaces/IVerificationChallengeRepository';
import { IPasswordResetTokenRepository } from '../../../src/modules/auth/interfaces/IPasswordResetTokenRepository';
import { IPasswordService } from '../../../src/modules/auth/services/PasswordService';
import { ITokenService } from '../../../src/modules/auth/services/TokenService';
import { IEmailService } from '../../../src/modules/auth/services/EmailService';
import { UserRole, AccountStatus, ChallengeType } from '../../../src/modules/auth/dtos/auth.dto';
import {
  ConflictError,
  ValidationError,
  UnauthorizedError,
  AccountDisabledError,
  UnverifiedAccountError,
} from '../../../src/shared/domain/errors/AppError';
import { hashString } from '../../../src/shared/utils/cryptoUtils';

describe('AuthService (Modular Monolith Repository Pattern)', () => {
  let authService: AuthService;
  let userRepo: IUserRepository;
  let sessionRepo: IRefreshSessionRepository;
  let challengeRepo: IVerificationChallengeRepository;
  let resetTokenRepo: IPasswordResetTokenRepository;
  let passwordService: IPasswordService;
  let tokenService: ITokenService;
  let emailService: IEmailService;

  const usersDb: Map<string, any> = new Map();
  const sessionsDb: Map<string, any> = new Map();
  const challengesDb: Map<string, any> = new Map();
  const resetTokensDb: Map<string, any> = new Map();

  beforeEach(() => {
    usersDb.clear();
    sessionsDb.clear();
    challengesDb.clear();
    resetTokensDb.clear();

    userRepo = {
      findById: vi.fn(async (id: string) => usersDb.get(id) || null),
      findByEmail: vi.fn(async (email: string) => {
        for (const u of usersDb.values()) {
          if (u.email === email.toLowerCase()) return u;
        }
        return null;
      }),
      existsByEmail: vi.fn(async (email: string) => {
        for (const u of usersDb.values()) {
          if (u.email === email.toLowerCase()) return true;
        }
        return false;
      }),
      create: vi.fn(async (data) => {
        const doc = {
          _id: 'user-' + (usersDb.size + 1),
          ...data,
          createdAt: new Date(),
        };
        usersDb.set(doc._id, doc);
        return doc as any;
      }),
      updateStatus: vi.fn(async (id, status, emailVerifiedAt) => {
        const u = usersDb.get(id);
        if (u) {
          u.status = status;
          if (emailVerifiedAt) u.emailVerifiedAt = emailVerifiedAt;
        }
        return u as any;
      }),
      updatePasswordHash: vi.fn(async (id, hash) => {
        const u = usersDb.get(id);
        if (u) u.passwordHash = hash;
        return u as any;
      }),
    };

    sessionRepo = {
      create: vi.fn(async (data) => {
        const doc = {
          _id: 'session-' + (sessionsDb.size + 1),
          ...data,
          isRevoked: false,
          createdAt: new Date(),
        };
        sessionsDb.set(data.tokenHash, doc);
        return doc as any;
      }),
      findByTokenHash: vi.fn(async (th: string) => sessionsDb.get(th) || null),
      revokeByTokenHash: vi.fn(async (th: string, rep?: string) => {
        const s = sessionsDb.get(th);
        if (s) {
          s.isRevoked = true;
          s.replacedByTokenHash = rep;
        }
      }),
      revokeAllForUser: vi.fn(async (uid: string) => {
        for (const s of sessionsDb.values()) {
          if (s.userId.toString() === uid.toString()) {
            s.isRevoked = true;
          }
        }
      }),
    };

    challengeRepo = {
      create: vi.fn(async (data) => {
        const doc = {
          _id: 'challenge-' + (challengesDb.size + 1),
          ...data,
          attemptCount: 0,
          maxAttempts: 5,
          consumedAt: null,
          createdAt: new Date(),
        };
        challengesDb.set(doc._id, doc);
        return doc as any;
      }),
      findLatestValid: vi.fn(async (uid: string, type: ChallengeType) => {
        for (const c of challengesDb.values()) {
          if (c.userId.toString() === uid.toString() && c.type === type && !c.consumedAt) {
            return c as any;
          }
        }
        return null;
      }),
      incrementAttempt: vi.fn(async (id: string) => {
        const c = challengesDb.get(id);
        if (c) c.attemptCount += 1;
        return c as any;
      }),
      consume: vi.fn(async (id: string) => {
        const c = challengesDb.get(id);
        if (c) c.consumedAt = new Date();
      }),
      invalidateAllForUser: vi.fn(async (uid: string, type: ChallengeType) => {
        for (const c of challengesDb.values()) {
          if (c.userId.toString() === uid.toString() && c.type === type) {
            c.consumedAt = new Date();
          }
        }
      }),
    };

    resetTokenRepo = {
      create: vi.fn(async (data) => {
        const doc = {
          _id: 'reset-' + (resetTokensDb.size + 1),
          ...data,
          consumedAt: null,
          createdAt: new Date(),
        };
        resetTokensDb.set(data.tokenHash, doc);
        return doc as any;
      }),
      findByTokenHash: vi.fn(async (th: string) => {
        const doc = resetTokensDb.get(th);
        if (doc && !doc.consumedAt && doc.expiresAt > new Date()) return doc as any;
        return null;
      }),
      consume: vi.fn(async (id: string) => {
        for (const t of resetTokensDb.values()) {
          if (t._id === id) t.consumedAt = new Date();
        }
      }),
      invalidateAllForUser: vi.fn(async (uid: string) => {
        for (const t of resetTokensDb.values()) {
          if (t.userId.toString() === uid.toString()) t.consumedAt = new Date();
        }
      }),
    };

    passwordService = {
      hash: vi.fn(async (p: string) => `hashed_${p}`),
      compare: vi.fn(async (p: string, h: string) => h === `hashed_${p}`),
    };

    tokenService = {
      generateAccessToken: vi.fn(() => 'mock-access-token-jwt'),
      verifyAccessToken: vi.fn(),
      generateRefreshToken: vi.fn(() => 'mock-opaque-refresh-token-' + Math.random()),
    };

    emailService = {
      sendEmail: vi.fn(async () => {}),
      sendVerificationEmail: vi.fn(async () => {}),
      sendPasswordResetEmail: vi.fn(async () => {}),
    };

    authService = new AuthService(
      userRepo,
      sessionRepo,
      challengeRepo,
      resetTokenRepo,
      passwordService,
      tokenService,
      emailService,
      7
    );
  });

  it('should register parent account with PENDING_VERIFICATION and dispatch OTP', async () => {
    const result = await authService.registerParent({
      fullName: 'John Parent',
      email: 'john@example.com',
      phone: '1234567890',
      password: 'Password123!',
      acceptedTerms: true,
    });

    expect(result.user.email).toBe('john@example.com');
    expect(result.user.role).toBe(UserRole.PARENT);
    expect(result.user.status).toBe(AccountStatus.PENDING_VERIFICATION);
    expect(challengeRepo.create).toHaveBeenCalled();
    expect(emailService.sendVerificationEmail).toHaveBeenCalled();
  });

  it('should throw ConflictError if email is already taken', async () => {
    await authService.registerParent({
      fullName: 'John Parent',
      email: 'john@example.com',
      phone: '1234567890',
      password: 'Password123!',
      acceptedTerms: true,
    });

    await expect(
      authService.registerParent({
        fullName: 'John Duplicate',
        email: 'john@example.com',
        phone: '9876543210',
        password: 'Password123!',
        acceptedTerms: true,
      })
    ).rejects.toThrow(ConflictError);
  });

  it('should verify email successfully when matching OTP is provided', async () => {
    await authService.registerParent({
      fullName: 'John Parent',
      email: 'john@example.com',
      phone: '1234567890',
      password: 'Password123!',
      acceptedTerms: true,
    });

    // Mock findLatestValid to return known challenge
    const rawOtp = '654321';
    const challenge = Array.from(challengesDb.values())[0];
    challenge.codeHash = hashString(rawOtp);

    const verifyResult = await authService.verifyEmail({
      email: 'john@example.com',
      code: rawOtp,
    });

    expect(verifyResult.user.status).toBe(AccountStatus.ACTIVE);
    expect(challengeRepo.consume).toHaveBeenCalled();
  });

  it('should authenticate user and return access & refresh tokens on valid login', async () => {
    usersDb.set('user-active-1', {
      _id: 'user-active-1',
      fullName: 'Teacher Jane',
      email: 'teacher@school.org',
      phone: '1234567890',
      passwordHash: 'hashed_Password123!',
      role: UserRole.TEACHER,
      status: AccountStatus.ACTIVE,
    });

    const result = await authService.login({
      email: 'teacher@school.org',
      password: 'Password123!',
      selectedRole: UserRole.TEACHER,
    });

    expect(result.user.email).toBe('teacher@school.org');
    expect(result.accessToken).toBe('mock-access-token-jwt');
    expect(result.refreshToken).toBeDefined();
    expect(sessionRepo.create).toHaveBeenCalled();
  });

  it('should reject login on role mismatch', async () => {
    usersDb.set('user-active-1', {
      _id: 'user-active-1',
      fullName: 'Teacher Jane',
      email: 'teacher@school.org',
      phone: '1234567890',
      passwordHash: 'hashed_Password123!',
      role: UserRole.TEACHER,
      status: AccountStatus.ACTIVE,
    });

    // Teacher tries logging into MANAGEMENT tab
    await expect(
      authService.login({
        email: 'teacher@school.org',
        password: 'Password123!',
        selectedRole: UserRole.MANAGEMENT,
      })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should reject login on unverified parent account', async () => {
    usersDb.set('user-pending-1', {
      _id: 'user-pending-1',
      fullName: 'Parent Unverified',
      email: 'parent@school.org',
      phone: '1234567890',
      passwordHash: 'hashed_Password123!',
      role: UserRole.PARENT,
      status: AccountStatus.PENDING_VERIFICATION,
    });

    await expect(
      authService.login({
        email: 'parent@school.org',
        password: 'Password123!',
        selectedRole: UserRole.PARENT,
      })
    ).rejects.toThrow(UnverifiedAccountError);
  });

  it('should rotate refresh token on valid refresh request', async () => {
    const rawToken = 'original_refresh_token_123';
    const tokenHash = hashString(rawToken);

    usersDb.set('user-active-1', {
      _id: 'user-active-1',
      fullName: 'Active User',
      email: 'active@school.org',
      role: UserRole.PARENT,
      status: AccountStatus.ACTIVE,
    });

    sessionsDb.set(tokenHash, {
      _id: 'session-1',
      userId: 'user-active-1',
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isRevoked: false,
    });

    const result = await authService.refreshSession({ refreshToken: rawToken });

    expect(result.accessToken).toBe('mock-access-token-jwt');
    expect(result.refreshToken).toBeDefined();
    expect(result.refreshToken).not.toBe(rawToken);
    expect(sessionRepo.revokeByTokenHash).toHaveBeenCalled();
  });
});
