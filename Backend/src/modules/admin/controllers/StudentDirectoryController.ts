import { Request, Response, NextFunction } from 'express';
import { IStudentDirectoryService } from '../services/StudentDirectoryService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { UnauthorizedError } from '../../../shared/domain/errors/AppError';
import { HttpStatusCode } from '../constants/httpStatusCode';

export class StudentDirectoryController {
  constructor(private readonly studentDirectoryService: IStudentDirectoryService) {}

  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const summary = await this.studentDirectoryService.getSummaryStats();
      return res.status(HttpStatusCode.OK).json(
        ApiResponse.success(summary, 'Student directory summary fetched successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  getStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const { search, academicYear, grade, section, status, page, limit } = req.query;

      const result = await this.studentDirectoryService.getStudents({
        search: typeof search === 'string' ? search : undefined,
        academicYear: typeof academicYear === 'string' ? academicYear : undefined,
        grade: typeof grade === 'string' ? grade : undefined,
        section: typeof section === 'string' ? section : undefined,
        status: typeof status === 'string' ? status : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      return res.status(HttpStatusCode.OK).json(
        ApiResponse.success(result, 'Students fetched successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  getStudentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const student = await this.studentDirectoryService.getStudentById(req.params.id);
      return res.status(HttpStatusCode.OK).json(
        ApiResponse.success(student, 'Student details fetched successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  updateStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const updated = await this.studentDirectoryService.updateStudent(req.params.id, req.body);
      return res.status(HttpStatusCode.OK).json(
        ApiResponse.success(updated, 'Student updated successfully.')
      );
    } catch (error) {
      next(error);
    }
  };
}
