import { describe, it, expect } from 'vitest';
import { PasswordService } from '../../../src/modules/auth/services/PasswordService';

describe('PasswordService', () => {
  const passwordService = new PasswordService(8);

  it('should hash password and verify matching password successfully', async () => {
    const raw = 'SecurePassword123!';
    const hash = await passwordService.hash(raw);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(raw);

    const isMatch = await passwordService.compare(raw, hash);
    expect(isMatch).toBe(true);
  });

  it('should return false for incorrect password', async () => {
    const raw = 'SecurePassword123!';
    const hash = await passwordService.hash(raw);

    const isMatch = await passwordService.compare('WrongPassword!', hash);
    expect(isMatch).toBe(false);
  });
});
