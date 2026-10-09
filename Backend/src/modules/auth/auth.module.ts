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

export interface AuthModuleComponents {
  router: Router;
  authenticateMiddleware: RequestHandler;
  authController: AuthController;
  authService: AuthService;
  userRepository: UserRepository;
}

export function initAuthModule(env: EnvConfig, authRateLimiter: RequestHandler): AuthModuleComponents {
  // 1. Repositories
  const userRepository = new UserRepository();
  const refreshSessionRepository = new RefreshSessionRepository();
  const verificationChallengeRepository = new VerificationChallengeRepository();
  const passwordResetTokenRepository = new PasswordResetTokenRepository();

  // 2. Services
  const passwordService = new PasswordService(10);
  const tokenService = new TokenService(env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRY);
  const emailService = new EmailService({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.EMAIL_FROM,
  });

  const authService = new AuthService(
    userRepository,
    refreshSessionRepository,
    verificationChallengeRepository,
    passwordResetTokenRepository,
    passwordService,
    tokenService,
    emailService,
    env.JWT_REFRESH_EXPIRY_DAYS
  );

  // 3. Middlewares
  const authenticateMiddleware = createAuthenticateMiddleware(tokenService);

  // 4. Controller
  const authController = new AuthController(
    authService,
    {
      cookieName: env.COOKIE_NAME,
      isProduction: env.NODE_ENV === 'production',
      sameSite: env.COOKIE_SAME_SITE,
      maxAgeDays: env.JWT_REFRESH_EXPIRY_DAYS,
    },
    env.PASSWORD_RESET_URL
  );

  // 5. Router
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
