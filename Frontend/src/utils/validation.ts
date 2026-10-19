/**
 * Client-side input validation utilities for EduHub Frontend
 */

export interface PasswordStrengthResult {
  isValid: boolean;
  score: number; // 0 to 4
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecialChar: boolean;
  feedback: string[];
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;

/**
 * Validates whether string is a valid email format
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

/**
 * Validates international phone format with 7 to 20 characters
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone || typeof phone !== 'string') return false;
  return PHONE_REGEX.test(phone.trim());
}

/**
 * Validates non-empty string with optional minimum and maximum length
 */
export function isNonEmptyString(
  value: string | null | undefined,
  minLength: number = 1,
  maxLength: number = Infinity
): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
}

/**
 * Analyzes password strength and checks adherence to EduHub security requirements
 */
export function validatePasswordStrength(password: string | null | undefined): PasswordStrengthResult {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      score: 0,
      hasMinLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasDigit: false,
      hasSpecialChar: false,
      feedback: ['Password is required.'],
    };
  }

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+~`=[\]\\;/]/.test(password);

  const feedback: string[] = [];
  if (!hasMinLength) feedback.push('Must be at least 8 characters long');
  if (!hasUppercase) feedback.push('Must contain at least one uppercase letter');
  if (!hasLowercase) feedback.push('Must contain at least one lowercase letter');
  if (!hasDigit) feedback.push('Must contain at least one number');
  if (!hasSpecialChar) feedback.push('Must contain at least one special character');

  let score = 0;
  if (hasMinLength) score++;
  if (hasUppercase && hasLowercase) score++;
  if (hasDigit) score++;
  if (hasSpecialChar) score++;

  const isValid = hasMinLength && hasUppercase && hasLowercase && hasDigit && hasSpecialChar;

  return {
    isValid,
    score,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasDigit,
    hasSpecialChar,
    feedback,
  };
}
