import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../domain/errors/AppError';
import { ApiResponse } from '../responses/ApiResponse';
import { env } from '../../../config/env.config';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected server error occurred. Please try again later.';
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  } else if ('code' in err && (err as { code: number }).code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    errorCode = 'DUPLICATE_RESOURCE';
    message = 'A resource with this identifier already exists.';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'INVALID_OR_EXPIRED_TOKEN';
    message = 'Your session token is invalid or has expired.';
  }

  if (env.NODE_ENV === 'development') {
    console.error(`[Error] [${statusCode}] [${errorCode}]: ${err.message}`);
    if (err.stack) {
      console.error(err.stack);
    }
  }

  const errorDetails = env.NODE_ENV === 'development' ? (details || (err.stack ? { stack: err.stack } : undefined)) : details;

  res.status(statusCode).json(ApiResponse.error(message, errorCode, errorDetails));
};
