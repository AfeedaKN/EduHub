import crypto from 'crypto';

export class CryptoUtils {
  /**
   * Generates a cryptographically secure random alphanumeric string (e.g. for refresh tokens & reset tokens)
   */
  static generateRandomToken(bytes: number = 32): string {
    const validBytes = Math.max(16, bytes);
    return crypto.randomBytes(validBytes).toString('hex');
  }

  /**
   * Generates a numeric OTP code with minimum 4 and maximum 10 digits
   */
  static generateOtp(digits: number = 6): string {
    const validDigits = Math.max(4, Math.min(10, digits));
    const min = Math.pow(10, validDigits - 1);
    const max = Math.pow(10, validDigits) - 1;
    return crypto.randomInt(min, max + 1).toString();
  }

  /**
   * Produces a SHA-256 hash of any input string
   */
  static hashToken(token: string): string {
    if (typeof token !== 'string') {
      throw new Error('Input token must be a string to hash.');
    }
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export const generateSecureToken = (bytes: number = 32): string => CryptoUtils.generateRandomToken(bytes);
export const generateSecureOtp = (digits: number = 6): string => CryptoUtils.generateOtp(digits);
export const hashString = (input: string): string => CryptoUtils.hashToken(input);
