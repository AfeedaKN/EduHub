import { Request, Response, NextFunction } from 'express';
import { ISubjectService } from '../services/SubjectService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { HttpStatusCode } from '../constants/httpStatusCode';
import { UnauthorizedError } from '../../../shared/domain/errors/AppError';

export class SubjectController {
  constructor(private readonly subjectService: ISubjectService) {}

  getSummaryStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const { academicYear } = req.query;
      const stats = await this.subjectService.getSummaryStats(
        typeof academicYear === 'string' ? academicYear : undefined
      );

      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(stats, 'Subject summary statistics retrieved successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  getSubjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const { search, category, classId, className, academicYear, status, page, limit, sort } =
        req.query;

      const result = await this.subjectService.getSubjects({
        search: typeof search === 'string' ? search : undefined,
        category: typeof category === 'string' ? category : undefined,
        classId: typeof classId === 'string' ? classId : undefined,
        className: typeof className === 'string' ? className : undefined,
        academicYear: typeof academicYear === 'string' ? academicYear : undefined,
        status: typeof status === 'string' ? status : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sort: typeof sort === 'string' ? (sort as any) : undefined,
      });

      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(result, 'Subjects retrieved successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  getSubjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const subject = await this.subjectService.getSubjectById(req.params.id);
      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(subject, 'Subject details retrieved successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  getSubjectReferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const references = await this.subjectService.getSubjectReferences(req.params.id);
      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(references, 'Subject academic references checked successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  createSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const created = await this.subjectService.createSubject(req.body);
      res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(created, `Subject "${created.name}" (${created.code}) created successfully.`)
      );
    } catch (error) {
      next(error);
    }
  };

  updateSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const updated = await this.subjectService.updateSubject(req.params.id, req.body);
      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(updated, `Subject "${updated.name}" (${updated.code}) updated successfully.`)
      );
    } catch (error) {
      next(error);
    }
  };

  changeSubjectStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const { status } = req.body;
      const updated = await this.subjectService.changeSubjectStatus(req.params.id, status);
      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(
          updated,
          `Subject "${updated.name}" status changed to ${updated.status}.`
        )
      );
    } catch (error) {
      next(error);
    }
  };

  deleteSubject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const result = await this.subjectService.deleteSubject(req.params.id);
      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(result, result.message)
      );
    } catch (error) {
      next(error);
    }
  };
}
