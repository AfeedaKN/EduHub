import rateLimit, { Options } from 'express-rate-limit';
import { ApiResponse } from '../responses/ApiResponse';

export interface RateLimiterCustomOptions {
  windowMs: number;
  max: number;
  message?: string;
}

export function createRateLimiter(options: RateLimiterCustomOptions) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json(
        ApiResponse.error(
          options.message || 'Too many requests. Please try again later.',
          'TOO_MANY_REQUESTS'
        )
      );
    },
  });
}

/**
 * Strict rate limiter for sensitive authentication actions (login, OTP, register, password reset)
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

/**
 * Moderate rate limiter for OTP verification & resend endpoints
 */
export const otpLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: 'Too many verification attempts. Please wait 5 minutes before trying again.',
});
