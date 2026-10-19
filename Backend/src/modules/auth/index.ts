import { env } from '../../config/env.config';
import { UserRepository } from './repositories/UserRepository';
import { RefreshSessionRepository } from './repositories/RefreshSessionRepository';
import { VerificationChallengeRepository } from './repositories/VerificationChallengeRepository';
import { PasswordResetTokenRepository } from './repositories/PasswordResetTokenRepository';
import { PasswordService } from './services/PasswordService';
import { TokenService } from './services/TokenService';
import { EmailService } from './services/EmailService';
import { AuthService } from './services/AuthService';
import { AuthController } from './controllers/AuthController';
import { createAuthRouter } from './routes/auth.routes';
import { createAuthenticateMiddleware } from './middlewares/auth.middleware';
import { createRateLimiter } from '../../shared/presentation/middleware/rateLimiter';
import { AuthModuleComponents } from './auth.module';

export const userRepository = new UserRepository();
export const refreshSessionRepository = new RefreshSessionRepository();
export const verificationChallengeRepository = new VerificationChallengeRepository();
export const passwordResetTokenRepository = new PasswordResetTokenRepository();

export const passwordService = new PasswordService(10);
export const tokenService = new TokenService(env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRY);
export const emailService = new EmailService({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  user: env.SMTP_USER,
  pass: env.SMTP_PASS,
  from: env.EMAIL_FROM,
});

export const authService = new AuthService(
  userRepository,
  refreshSessionRepository,
  verificationChallengeRepository,
  passwordResetTokenRepository,
  passwordService,
  tokenService,
  emailService,
  env.JWT_REFRESH_EXPIRY_DAYS
);

export const authenticateMiddleware = createAuthenticateMiddleware(tokenService);

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

export const authController = new AuthController(
  authService,
  {
    cookieName: env.COOKIE_NAME,
    isProduction: env.NODE_ENV === 'production',
    sameSite: env.COOKIE_SAME_SITE,
    maxAgeDays: env.JWT_REFRESH_EXPIRY_DAYS,
  },
  env.PASSWORD_RESET_URL
);

export const authRouter = createAuthRouter({
  authController,
  authenticateMiddleware,
  authRateLimiter,
});

export const authModule: AuthModuleComponents = {
  router: authRouter,
  authenticateMiddleware,
  authController,
  authService,
  userRepository,
};
