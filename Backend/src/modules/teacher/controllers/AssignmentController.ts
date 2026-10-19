import { Request, Response, NextFunction } from 'express';
import { AssignmentService } from '../services/AssignmentService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { HttpStatusCode } from '../constants/httpStatusCode';
import { TeacherMessages } from '../constants/teacherMessages';

export class AssignmentController {
  constructor(private readonly service: AssignmentService) {}

  getAssignments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const { academicYear, className, section, subject, status, search } = req.query;

      const result = await this.service.getAssignments(userId, {
        academicYear: academicYear ? String(academicYear) : undefined,
        className: className ? String(className) : undefined,
        section: section ? String(section) : undefined,
        subject: subject ? String(subject) : undefined,
        status: status ? String(status) : undefined,
        search: search ? String(search) : undefined,
      });

      res.status(HttpStatusCode.OK).json(ApiResponse.success(result, TeacherMessages.ASSIGNMENTS_RETRIEVED));
    } catch (error) {
      next(error);
    }
  };

  getAssignmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const { id } = req.params;

      const assignment = await this.service.getAssignmentById(userId, id);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(assignment, TeacherMessages.ASSIGNMENT_RETRIEVED));
    } catch (error) {
      next(error);
    }
  };

  createAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const assignment = await this.service.createAssignment(userId, req.body);

      res.status(HttpStatusCode.CREATED).json(ApiResponse.success(assignment, TeacherMessages.ASSIGNMENT_CREATED));
    } catch (error) {
      next(error);
    }
  };

  updateAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const { id } = req.params;

      const assignment = await this.service.updateAssignment(userId, id, req.body);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(assignment, TeacherMessages.ASSIGNMENT_UPDATED));
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const { id } = req.params;
      const { status } = req.body;

      const assignment = await this.service.updateStatus(userId, id, status);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(assignment, TeacherMessages.ASSIGNMENT_STATUS_UPDATED));
    } catch (error) {
      next(error);
    }
  };

  deleteAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const { id } = req.params;

      await this.service.deleteAssignment(userId, id);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(null, TeacherMessages.ASSIGNMENT_DELETED));
    } catch (error) {
      next(error);
    }
  };

  getAssignmentSubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const { id } = req.params;

      const submissions = await this.service.getSubmissionsForAssignment(userId, id);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(submissions, TeacherMessages.SUBMISSIONS_RETRIEVED));
    } catch (error) {
      next(error);
    }
  };

  gradeSubmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const { id, submissionId } = req.params;

      const result = await this.service.gradeSubmission(userId, id, submissionId, req.body);
      const actionMsg = req.body?.publishResult
        ? TeacherMessages.SUBMISSION_GRADED_PUBLISHED
        : TeacherMessages.SUBMISSION_REVIEW_SAVED;
      res.status(HttpStatusCode.OK).json(ApiResponse.success(result, actionMsg));
    } catch (error) {
      next(error);
    }
  };
}
