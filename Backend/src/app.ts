import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.config';
import { configureDependencies } from './composition/configureDependencies';
import { notFoundHandler } from './shared/presentation/middleware/notFoundHandler';
import { errorHandler } from './shared/presentation/middleware/errorHandler';
import { ApiResponse } from './shared/presentation/responses/ApiResponse';

export const createApp = (): Application => {
  const app = express();

  // Wire dependencies
  const dependencies = configureDependencies();

  // Security headers
  app.use(helmet());

  // CORS Configuration
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body and Cookie Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(env.COOKIE_NAME));

  // Health and System Diagnostics
  app.get('/api/v1/health', (_req: Request, res: Response) => {
    res.status(200).json(
      ApiResponse.success(
        {
          appName: 'EduHub School ERP API',
          version: '1.0.0',
          environment: env.NODE_ENV,
          status: 'healthy',
          timestamp: new Date().toISOString(),
        },
        'System is healthy.'
      )
    );
  });

  // Base API index
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json(
      ApiResponse.success(
        {
          name: 'EduHub School ERP Backend',
          version: '1.0.0',
          status: 'online',
          healthCheck: '/api/v1/health',
          authEndpoints: '/api/v1/auth',
        },
        'Welcome to EduHub API.'
      )
    );
  });

  // Business Modules Routing
  app.use('/api/v1/auth', dependencies.authModule.router);
  app.use('/api/v1/parent', dependencies.parentModule.router);

  // 404 Route Handler
  app.use(notFoundHandler);

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
};
