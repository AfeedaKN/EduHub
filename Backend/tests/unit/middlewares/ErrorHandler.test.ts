import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../../src/shared/presentation/middleware/errorHandler';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
} from '../../../src/shared/domain/errors/AppError';

describe('errorHandler Middleware Unit Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    req = {};
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
      json: jsonMock,
    };
    next = vi.fn();
  });

  it('should format custom AppError subclasses appropriately', () => {
    const err = new NotFoundError('Class not found', 'CLASS_NOT_FOUND');
    errorHandler(err, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'CLASS_NOT_FOUND',
          message: 'Class not found',
        }),
      })
    );
  });

  it('should handle MongoDB duplicate key errors (code 11000)', () => {
    const mongoErr = new Error('E11000 duplicate key error collection') as any;
    mongoErr.code = 11000;

    errorHandler(mongoErr, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'DUPLICATE_RESOURCE',
          message: 'A resource with this identifier already exists.',
        }),
      })
    );
  });

  it('should handle Mongoose CastError for invalid ObjectIDs', () => {
    const castErr = new Error('Cast to ObjectId failed');
    castErr.name = 'CastError';

    errorHandler(castErr, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_IDENTIFIER',
          message: 'Invalid resource identifier format.',
        }),
      })
    );
  });

  it('should handle JWT token errors with 401 status', () => {
    const jwtErr = new Error('jwt expired');
    jwtErr.name = 'TokenExpiredError';

    errorHandler(jwtErr, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_OR_EXPIRED_TOKEN',
        }),
      })
    );
  });

  it('should default unexpected errors to 500 status code', () => {
    const unexpectedErr = new Error('Database connection crashed');

    errorHandler(unexpectedErr, req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected server error occurred. Please try again later.',
        }),
      })
    );
  });
});
