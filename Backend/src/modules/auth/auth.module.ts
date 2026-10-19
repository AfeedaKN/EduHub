import { Router, RequestHandler } from 'express';
import { EnvConfig } from '../../config/env.config';
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

export interface AuthModuleComponents {
  router: Router;
  authenticateMiddleware: RequestHandler;
  authController: AuthController;
  authService: AuthService;
  userRepository: UserRepository;
}

export function initAuthModule(
  envConfig: EnvConfig,
  customRateLimiter?: RequestHandler
): AuthModuleComponents {
  const userRepository = new UserRepository();
  const refreshSessionRepository = new RefreshSessionRepository();
  const verificationChallengeRepository = new VerificationChallengeRepository();
  const passwordResetTokenRepository = new PasswordResetTokenRepository();

  const passwordService = new PasswordService(10);
  const tokenService = new TokenService(envConfig.JWT_ACCESS_SECRET, envConfig.JWT_ACCESS_EXPIRY);
  const emailService = new EmailService({
    host: envConfig.SMTP_HOST,
    port: envConfig.SMTP_PORT,
    secure: envConfig.SMTP_SECURE,
    user: envConfig.SMTP_USER,
    pass: envConfig.SMTP_PASS,
    from: envConfig.EMAIL_FROM,
  });

  const authService = new AuthService(
    userRepository,
    refreshSessionRepository,
    verificationChallengeRepository,
    passwordResetTokenRepository,
    passwordService,
    tokenService,
    emailService,
    envConfig.JWT_REFRESH_EXPIRY_DAYS
  );

  const authenticateMiddleware = createAuthenticateMiddleware(tokenService);

  const authRateLimiter =
    customRateLimiter ||
    createRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    });

  const authController = new AuthController(
    authService,
    {
      cookieName: envConfig.COOKIE_NAME,
      isProduction: envConfig.NODE_ENV === 'production',
      sameSite: envConfig.COOKIE_SAME_SITE,
      maxAgeDays: envConfig.JWT_REFRESH_EXPIRY_DAYS,
    },
    envConfig.PASSWORD_RESET_URL
  );

  const router = createAuthRouter({
    authController,
    authenticateMiddleware,
    authRateLimiter,
  });

  return {
    router,
    authenticateMiddleware,
    authController,
    authService,
    userRepository,
  };
}
