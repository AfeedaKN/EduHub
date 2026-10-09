import { Application } from 'express';
import { env } from '../config/env.config';
import { initAuthModule, AuthModuleComponents } from '../modules/auth/auth.module';
import { initParentModule, ParentModuleComponents } from '../modules/parent/parent.module';
import { createRateLimiter } from '../shared/presentation/middleware/rateLimiter';

export interface AppDependencies {
  authModule: AuthModuleComponents;
  parentModule: ParentModuleComponents;
}

export function configureDependencies(): AppDependencies {
  // Create shared rate limiters
  const authRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // max 10 requests per 15 minutes for sensitive endpoints
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  });

  // Initialize Auth Module
  const authModule = initAuthModule(env, authRateLimiter);

  // Initialize Parent Module reusing the authentication middleware from Auth Module
  const parentModule = initParentModule(authModule.authenticateMiddleware);

  return {
    authModule,
    parentModule,
  };
}

