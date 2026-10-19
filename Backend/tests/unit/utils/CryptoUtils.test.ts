import { describe, it, expect } from 'vitest';
import { CryptoUtils, generateSecureToken, generateSecureOtp, hashString } from '../../../src/shared/utils/cryptoUtils';

describe('CryptoUtils', () => {
  it('should generate secure random tokens with expected length and entropy', () => {
    const token1 = CryptoUtils.generateRandomToken(32);
    const token2 = CryptoUtils.generateRandomToken(32);

    expect(token1).toHaveLength(64); // 32 bytes hex = 64 characters
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it('should enforce a safe minimum byte length of 16 bytes', () => {
    const shortToken = CryptoUtils.generateRandomToken(4);
    expect(shortToken.length).toBeGreaterThanOrEqual(32); // minimum 16 bytes = 32 hex chars
  });

  it('should generate valid numeric OTP of specified length', () => {
    const otp6 = CryptoUtils.generateOtp(6);
    expect(otp6).toMatch(/^\d{6}$/);

    const otp4 = CryptoUtils.generateOtp(4);
    expect(otp4).toMatch(/^\d{4}$/);
  });

  it('should enforce safe OTP digit bounds (min 4, max 10)', () => {
    const clampedMinOtp = CryptoUtils.generateOtp(2);
    expect(clampedMinOtp).toHaveLength(4);

    const clampedMaxOtp = CryptoUtils.generateOtp(15);
    expect(clampedMaxOtp).toHaveLength(10);
  });

  it('should produce deterministic SHA-256 hashes', () => {
    const raw = 'secret-reset-token-2026';
    const hash1 = CryptoUtils.hashToken(raw);
    const hash2 = CryptoUtils.hashToken(raw);

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(raw);
  });

  it('should throw an error when hashing non-string values', () => {
    expect(() => CryptoUtils.hashToken(null as any)).toThrow('Input token must be a string to hash.');
    expect(() => CryptoUtils.hashToken(undefined as any)).toThrow('Input token must be a string to hash.');
  });

  it('should expose convenience helper functions accurately', () => {
    expect(generateSecureToken(20)).toHaveLength(40);
    expect(generateSecureOtp(6)).toMatch(/^\d{6}$/);
    expect(hashString('test')).toBe(CryptoUtils.hashToken('test'));
  });
});
