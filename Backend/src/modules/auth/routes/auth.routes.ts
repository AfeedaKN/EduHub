import { Router, RequestHandler } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateRequest } from '../../../shared/presentation/middleware/validateRequest';
import {
  registerParentSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

export interface AuthRoutesDependencies {
  authController: AuthController;
  authenticateMiddleware: RequestHandler;
  authRateLimiter: RequestHandler;
}

export function createAuthRouter(deps: AuthRoutesDependencies): Router {
  const router = Router();
  const { authController, authenticateMiddleware, authRateLimiter } = deps;

  router.post(
    '/parents/register',
    authRateLimiter,
    validateRequest(registerParentSchema),
    authController.registerParent
  );

  router.post(
    '/verify-email',
    authRateLimiter,
    validateRequest(verifyEmailSchema),
    authController.verifyEmail
  );

  router.post(
    '/resend-verification',
    authRateLimiter,
    validateRequest(resendVerificationSchema),
    authController.resendVerification
  );

  router.post(
    '/login',
    authRateLimiter,
    validateRequest(loginSchema),
    authController.login
  );

  router.post('/refresh', authController.refresh);
  router.post('/logout', authController.logout);

  router.get('/me', authenticateMiddleware, authController.me);

  router.post(
    '/forgot-password',
    authRateLimiter,
    validateRequest(forgotPasswordSchema),
    authController.forgotPassword
  );

  router.post(
    '/reset-password',
    authRateLimiter,
    validateRequest(resetPasswordSchema),
    authController.resetPassword
  );

  router.patch(
    '/change-password',
    authenticateMiddleware,
    validateRequest(changePasswordSchema),
    authController.changePassword
  );

  return router;
}
