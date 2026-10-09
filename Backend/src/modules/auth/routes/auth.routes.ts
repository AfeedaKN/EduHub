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

  // Public Parent Registration
  router.post(
    '/parents/register',
    authRateLimiter,
    validateRequest(registerParentSchema),
    authController.registerParent
  );

  // Email Verification & OTP
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

  // Common Login for All Roles
  router.post(
    '/login',
    authRateLimiter,
    validateRequest(loginSchema),
    authController.login
  );

  // Session Lifecycle
  router.post('/refresh', authController.refresh);
  router.post('/logout', authController.logout);

  // Current User Profile (Protected)
  router.get('/me', authenticateMiddleware, authController.me);

  // Password Recovery
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

  // Change Password (Protected)
  router.patch(
    '/change-password',
    authenticateMiddleware,
    validateRequest(changePasswordSchema),
    authController.changePassword
  );

  return router;
}
