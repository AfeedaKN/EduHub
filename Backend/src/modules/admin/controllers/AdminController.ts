import { Request, Response, NextFunction } from 'express';
import { IAdminService } from '../services/AdminService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { UnauthorizedError } from '../../../shared/domain/errors/AppError';
import { HttpStatusCode } from '../constants/httpStatusCode';
import { AdminMessages } from '../constants/adminMessages';

export class AdminController {
  constructor(private readonly adminService: IAdminService) {}

  getDashboardSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const summary = await this.adminService.getDashboardSummary();
      return res.status(HttpStatusCode.OK).json(
        ApiResponse.success(summary, AdminMessages.DASHBOARD_SUMMARY_FETCHED)
      );
    } catch (error) {
      next(error);
    }
  };

  getAdmissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const { status, search, grade, sort } = req.query;
      const admissions = await this.adminService.getAdmissions({
        status: typeof status === 'string' ? status : undefined,
        search: typeof search === 'string' ? search : undefined,
        grade: typeof grade === 'string' ? grade : undefined,
        sort: sort === 'oldest' ? 'oldest' : 'newest',
      });

      return res.status(HttpStatusCode.OK).json(
        ApiResponse.success(admissions, AdminMessages.ADMISSIONS_FETCHED)
      );
    } catch (error) {
      next(error);
    }
  };

  getAdmissionCounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const counts = await this.adminService.getAdmissionCounts();
      return res.status(HttpStatusCode.OK).json(
        ApiResponse.success(counts, AdminMessages.ADMISSION_COUNTS_FETCHED)
      );
    } catch (error) {
      next(error);
    }
  };

  getAdmissionDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const admission = await this.adminService.getAdmissionDetail(req.params.id);
      return res.status(HttpStatusCode.OK).json(
        ApiResponse.success(admission, AdminMessages.ADMISSION_DETAIL_FETCHED)
      );
    } catch (error) {
      next(error);
    }
  };

  getClassCapacity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const grade = req.query.grade as string;
      const section = (req.query.section as string) || 'A';
      const capacity = await this.adminService.getClassCapacity(grade, section);

      return res.status(HttpStatusCode.OK).json(
        ApiResponse.success(capacity, AdminMessages.CLASS_CAPACITY_FETCHED)
      );
    } catch (error) {
      next(error);
    }
  };

  approveAdmission = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const result = await this.adminService.approveAdmission(
        req.params.id,
        req.user.sub,
        req.body
      );

      return res.status(HttpStatusCode.OK).json(
        ApiResponse.success(result, result.message)
      );
    } catch (error) {
      next(error);
    }
  };

  rejectAdmission = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const result = await this.adminService.rejectAdmission(
        req.params.id,
        req.user.sub,
        req.body
      );

      return res.status(HttpStatusCode.OK).json(
        ApiResponse.success(result, result.message)
      );
    } catch (error) {
      next(error);
    }
  };
}
