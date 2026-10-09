import { Request, Response } from 'express';
import { ApiResponse } from '../responses/ApiResponse';

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json(
    ApiResponse.error(
      `Route not found: ${req.method} ${req.originalUrl}`,
      'NOT_FOUND'
    )
  );
};
