import { Request, Response, NextFunction } from 'express';
import { IParentService } from '../services/ParentService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { UnauthorizedError } from '../../../shared/domain/errors/AppError';
import { HttpStatusCode } from '../constants/httpStatusCode';
import { ParentMessages } from '../constants/parentMessages';

export class ParentController {
  constructor(private readonly parentService: IParentService) {}

  createRegistrationRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated parent session required.', 'UNAUTHORIZED');
      }

      const result = await this.parentService.createRegistrationRequest(req.user.sub, req.body);

      return res
        .status(HttpStatusCode.CREATED)
        .json(
          ApiResponse.success(
            result,
            ParentMessages.REGISTRATION_REQUEST_CREATED
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
      return res.status(HttpStatusCode.OK).json(ApiResponse.success(result, ParentMessages.DASHBOARD_DATA_FETCHED));
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
      return res.status(HttpStatusCode.OK).json(ApiResponse.success(result, ParentMessages.REGISTRATION_REQUESTS_FETCHED));
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
      return res.status(HttpStatusCode.OK).json(ApiResponse.success(result, ParentMessages.CHILDREN_FETCHED));
    } catch (error) {
      next(error);
    }
  };

  getMetadata = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const meta = this.parentService.getSchoolMetadata();
      return res.status(HttpStatusCode.OK).json(ApiResponse.success(meta, ParentMessages.METADATA_FETCHED));
    } catch (error) {
      next(error);
    }
  };

  getAssignments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated parent session required.', 'UNAUTHORIZED');
      }

      const { studentId, subject, status, search } = req.query;

      const result = await this.parentService.getParentAssignments(req.user.sub, {
        studentId: studentId ? String(studentId) : undefined,
        subject: subject ? String(subject) : undefined,
        status: status ? String(status) : undefined,
        search: search ? String(search) : undefined,
      });

      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, ParentMessages.ASSIGNMENTS_FETCHED));
    } catch (error) {
      next(error);
    }
  };

  getAssignmentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated parent session required.', 'UNAUTHORIZED');
      }

      const { id } = req.params;
      const result = await this.parentService.getParentAssignmentById(req.user.sub, id);

      return res.status(HttpStatusCode.OK).json(ApiResponse.success(result, ParentMessages.ASSIGNMENT_DETAIL_FETCHED));
    } catch (error) {
      next(error);
    }
  };

  submitAssignment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated parent session required.', 'UNAUTHORIZED');
      }

      const { id } = req.params;
      const { studentId, answerText, attachmentUrl, attachmentName, attachmentSize, attachmentType } = req.body;

      const result = await this.parentService.submitAssignment(req.user.sub, id, {
        studentId,
        answerText,
        attachmentUrl,
        attachmentName,
        attachmentSize,
        attachmentType,
      });

      return res.status(HttpStatusCode.CREATED).json(ApiResponse.success(result, ParentMessages.ASSIGNMENT_SUBMITTED));
    } catch (error) {
      next(error);
    }
  };

  getExamResults = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated parent session required.', 'UNAUTHORIZED');
      }

      const { studentId, academicYear, search } = req.query;
      const result = await this.parentService.getParentExamResults(req.user.sub, {
        studentId: studentId ? String(studentId) : undefined,
        academicYear: academicYear ? String(academicYear) : undefined,
        search: search ? String(search) : undefined,
      });

      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, ParentMessages.EXAM_RESULTS_FETCHED));
    } catch (error) {
      next(error);
    }
  };
}
