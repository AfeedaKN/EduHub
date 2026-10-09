import { Request, Response, NextFunction } from 'express';
import { IParentService } from '../services/ParentService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { UnauthorizedError } from '../../../shared/domain/errors/AppError';

export class ParentController {
  constructor(private readonly parentService: IParentService) {}

  createRegistrationRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated parent session required.', 'UNAUTHORIZED');
      }

      const result = await this.parentService.createRegistrationRequest(req.user.sub, req.body);

      return res
        .status(201)
        .json(
          ApiResponse.success(
            result,
            "Your child's registration request has been submitted successfully and is pending review by school management."
          )
        );
    } catch (error) {
      next(error);
    }
  };

  getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated parent session required.', 'UNAUTHORIZED');
      }

      const result = await this.parentService.getParentDashboard(req.user.sub);
      return res.status(200).json(ApiResponse.success(result, 'Parent dashboard data retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  getRegistrationRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated parent session required.', 'UNAUTHORIZED');
      }

      const result = await this.parentService.getRegistrationRequests(req.user.sub);
      return res.status(200).json(ApiResponse.success(result, 'Registration requests retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  getChildren = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated parent session required.', 'UNAUTHORIZED');
      }

      const result = await this.parentService.getChildren(req.user.sub);
      return res.status(200).json(ApiResponse.success(result, 'Children list retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  getMetadata = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const meta = this.parentService.getSchoolMetadata();
      return res.status(200).json(ApiResponse.success(meta, 'School admission metadata retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };
}
