import crypto from 'crypto';

export class CryptoUtils {
  /**
   * Generates a cryptographically secure random alphanumeric string (e.g. for refresh tokens & reset tokens)
   */
  static generateRandomToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Generates a 6-digit numeric OTP code
   */
  static generateOtp(digits: number = 6): string {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    return crypto.randomInt(min, max + 1).toString();
  }

  /**
   * Produces a SHA-256 hash of any input string (e.g. for hashing opaque refresh tokens and reset tokens before DB persistence)
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export const generateSecureToken = (bytes: number = 32): string => CryptoUtils.generateRandomToken(bytes);
export const generateSecureOtp = (digits: number = 6): string => CryptoUtils.generateOtp(digits);
export const hashString = (input: string): string => CryptoUtils.hashToken(input);
