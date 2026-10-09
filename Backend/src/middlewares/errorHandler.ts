import { Request, Response, NextFunction } from 'express';
import { ApiResponse, AppError } from '../utils/apiResponse';
import { config } from '../config/env';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';
  const errors = err instanceof AppError ? err.errors : undefined;

  if (config.env === 'development') {
    console.error(`[Error] [${statusCode}] ${message}`);
    if (err.stack) {
      console.error(err.stack);
    }
  }

  ApiResponse.error(
    res,
    message,
    statusCode,
    config.env === 'development' ? { errors, stack: err.stack } : errors
  );
};
