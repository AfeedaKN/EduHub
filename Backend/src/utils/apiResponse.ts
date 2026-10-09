import { Response } from 'express';

export interface ApiResponsePayload<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
  timestamp: string;
}

export class ApiResponse {
  static success<T>(res: Response, message: string = 'Operation successful', data?: T, statusCode: number = 200): Response {
    const responseBody: ApiResponsePayload<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(responseBody);
  }

  static error(res: Response, message: string = 'An error occurred', statusCode: number = 500, errors?: unknown): Response {
    const responseBody: ApiResponsePayload = {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(responseBody);
  }
}

export class AppError extends Error {
  public statusCode: number;
  public errors?: unknown;

  constructor(message: string, statusCode: number = 500, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
