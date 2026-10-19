export const AuthErrorMessages = {
  INVALID_CREDENTIALS: 'Invalid email, password, or selected role.',
  UNAUTHORIZED: 'Authentication required. Missing or invalid Bearer token.',
  FORBIDDEN: 'Access denied. You do not have permission to perform this action.',
  INSUFFICIENT_PERMISSIONS: (required: string[], actual?: string) =>
    `Access denied. Required role: [${required.join(', ')}]. Your role: ${actual || 'unknown'}`,
  USER_NOT_FOUND: 'Account with this email does not exist.',
  USER_ALREADY_EXISTS: 'An account with this email address already exists.',
  ACCOUNT_DISABLED: 'Your account has been disabled. Please contact school administration.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before logging in.',
  EMAIL_ALREADY_VERIFIED: 'Account email is already verified.',
  INVALID_OR_EXPIRED_CODE: 'Verification code has expired or is invalid. Please request a new code.',
  MAX_ATTEMPTS_EXCEEDED: 'Maximum verification attempts exceeded. Please request a new code.',
  INVALID_CODE_ATTEMPTS_REMAINING: (remaining: number) =>
    `Invalid verification code. ${remaining} attempt(s) remaining.`,
  REFRESH_TOKEN_REQUIRED: 'Refresh token is required.',
  INVALID_SESSION: 'Invalid or expired refresh session.',
  SESSION_REUSED: 'Session reuse detected. All sessions revoked for security.',
  SESSION_EXPIRED: 'Session has expired. Please log in again.',
  INVALID_RESET_TOKEN: 'Invalid or expired password reset link. Please request a new one.',
  CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect.',
  SAME_PASSWORD_ERROR: 'New password cannot be the same as the current password.',
  PASSWORD_LENGTH_ERROR: 'Password must be at least 8 characters long.',
  TERMS_REQUIRED: 'You must accept the terms and conditions to register.',
  INTERNAL_SERVER_ERROR: 'An unexpected server error occurred. Please try again later.',
};

export const AuthSuccessMessages = {
  REGISTRATION_SUCCESS: 'Registration successful. A verification code has been sent to your email.',
  EMAIL_VERIFIED: 'Email successfully verified. You can now log in to your account.',
  EMAIL_ALREADY_VERIFIED: 'Account email is already verified.',
  VERIFICATION_CODE_SENT: 'A new verification code has been sent to your email.',
  VERIFICATION_CODE_RESENT_GENERIC:
    'If an unverified account exists with this email, a new verification code has been sent.',
  LOGIN_SUCCESS: 'Login successful.',
  SESSION_REFRESHED: 'Session refreshed successfully.',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  PROFILE_RETRIEVED: 'User profile retrieved successfully.',
  PASSWORD_RESET_REQUESTED:
    'If an account exists with this email, a password reset link has been sent.',
  PASSWORD_RESET_SUCCESS:
    'Password has been successfully reset. You can now log in with your new password.',
  PASSWORD_CHANGED_SUCCESS: 'Password changed successfully.',
};
