import { describe, it, expect } from 'vitest';
import {
  registerParentSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../../../src/modules/auth/validators/auth.validator';
import { UserRole } from '../../../src/modules/auth/dtos/auth.dto';

describe('AuthValidator Unit Tests', () => {
  describe('registerParentSchema', () => {
    const validParentInput = {
      fullName: 'John Parent',
      email: 'John.Parent@EduHub.School  ',
      phone: '+1234567890',
      password: 'StrongPassword123!',
      acceptedTerms: true,
    };

    it('should validate and normalize valid parent registration input', () => {
      const result = registerParentSchema.safeParse({ body: validParentInput });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body.email).toBe('john.parent@eduhub.school');
        expect(result.data.body.fullName).toBe('John Parent');
      }
    });

    it('should reject when acceptedTerms is false', () => {
      const result = registerParentSchema.safeParse({
        body: { ...validParentInput, acceptedTerms: false },
      });
      expect(result.success).toBe(false);
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = registerParentSchema.safeParse({
        body: { ...validParentInput, password: 'short' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email formats', () => {
      const result = registerParentSchema.safeParse({
        body: { ...validParentInput, email: 'not-an-email' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('verifyEmailSchema', () => {
    it('should accept valid 6-digit verification code and normalize email', () => {
      const result = verifyEmailSchema.safeParse({
        body: {
          email: '  STUDENT@School.org  ',
          code: '123456',
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body.email).toBe('student@school.org');
        expect(result.data.body.code).toBe('123456');
      }
    });

    it('should reject codes that are not exactly 6 characters', () => {
      expect(
        verifyEmailSchema.safeParse({
          body: { email: 'test@school.org', code: '12345' },
        }).success
      ).toBe(false);

      expect(
        verifyEmailSchema.safeParse({
          body: { email: 'test@school.org', code: '1234567' },
        }).success
      ).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login input and normalize email', () => {
      const result = loginSchema.safeParse({
        body: {
          email: '  Admin.Portal@eduhub.school  ',
          password: 'SecretPassword!',
          selectedRole: UserRole.MANAGEMENT,
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body.email).toBe('admin.portal@eduhub.school');
        expect(result.data.body.selectedRole).toBe(UserRole.MANAGEMENT);
      }
    });

    it('should reject invalid role enum values', () => {
      const result = loginSchema.safeParse({
        body: {
          email: 'admin@school.org',
          password: 'SecretPassword!',
          selectedRole: 'SUPER_HERO',
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('should trim reset token and validate new password', () => {
      const result = resetPasswordSchema.safeParse({
        body: {
          token: '  token-hash-12345  ',
          newPassword: 'BrandNewSecurePassword123!',
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body.token).toBe('token-hash-12345');
      }
    });

    it('should reject new passwords shorter than 8 characters', () => {
      const result = resetPasswordSchema.safeParse({
        body: {
          token: 'token-123',
          newPassword: 'short',
        },
      });
      expect(result.success).toBe(false);
    });
  });
});
