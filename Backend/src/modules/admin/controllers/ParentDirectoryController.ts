import { Request, Response, NextFunction } from 'express';
import { IParentDirectoryService } from '../services/ParentDirectoryService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { UnauthorizedError } from '../../../shared/domain/errors/AppError';
import { HttpStatusCode } from '../constants/httpStatusCode';

export class ParentDirectoryController {
  constructor(private readonly parentDirectoryService: IParentDirectoryService) {}

  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const summary = await this.parentDirectoryService.getSummaryStats();
      return res.status(HttpStatusCode.OK).json(
        ApiResponse.success(summary, 'Parent directory summary fetched successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  getParents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const { search, studentStatus, status, page, limit } = req.query;

      const result = await this.parentDirectoryService.getParents({
        search: typeof search === 'string' ? search : undefined,
        studentStatus:
          studentStatus === 'WITH_CHILDREN' || studentStatus === 'WITHOUT_CHILDREN'
            ? studentStatus
            : 'ALL',
        status: typeof status === 'string' ? status : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      return res.status(HttpStatusCode.OK).json(
        ApiResponse.success(result, 'Parents fetched successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  getParentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const parent = await this.parentDirectoryService.getParentById(req.params.id);
      return res.status(HttpStatusCode.OK).json(
        ApiResponse.success(parent, 'Parent details fetched successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const updated = await this.parentDirectoryService.updateParentStatus(req.params.id, req.body);
      return res.status(HttpStatusCode.OK).json(
        ApiResponse.success(updated, 'Parent status updated successfully.')
      );
    } catch (error) {
      next(error);
    }
  };
}
