import { Response } from 'express';

export interface ApiSuccessPayload<T = unknown> {
  success: true;
  message: string;
  data?: T;
  timestamp: string;
}

export interface ApiErrorPayload {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export class ApiResponse {
  /**
   * Generates a standardized success payload object
   */
  static success<T>(data?: T, message: string = 'Operation completed successfully'): ApiSuccessPayload<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generates a standardized error payload object
   */
  static error(
    message: string = 'An unexpected error occurred',
    code: string = 'INTERNAL_ERROR',
    details?: unknown
  ): ApiErrorPayload {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Sends a success response directly through Express Response
   */
  static sendSuccess<T>(
    res: Response,
    data?: T,
    message: string = 'Operation completed successfully',
    statusCode: number = 200
  ): Response {
    return res.status(statusCode).json(ApiResponse.success(data, message));
  }

  /**
   * Sends an error response directly through Express Response
   */
  static sendError(
    res: Response,
    message: string = 'An unexpected error occurred',
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: unknown
  ): Response {
    return res.status(statusCode).json(ApiResponse.error(message, code, details));
  }
}
