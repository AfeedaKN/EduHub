import { Request, Response, NextFunction } from 'express';
import { AdminAssignmentService } from '../services/AdminAssignmentService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { HttpStatusCode } from '../constants/httpStatusCode';
import { AdminMessages } from '../constants/adminMessages';

export class AdminAssignmentController {
  constructor(private readonly adminAssignmentService: AdminAssignmentService) {}

  /**
   * GET /api/v1/admin/assignments/summary
   */
  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { academicYear } = req.query;
      const summary = await this.adminAssignmentService.getSummary(
        typeof academicYear === 'string' ? academicYear : undefined
      );
      res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(summary, AdminMessages.ADMIN_ASSIGNMENT_SUMMARY_FETCHED));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/assignments/metadata
   */
  getMetadata = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const metadata = await this.adminAssignmentService.getFilterMetadata();
      res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(metadata, 'Filter metadata retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/assignments
   */
  getAssignments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        search,
        teacherId,
        academicYear,
        className,
        section,
        subject,
        status,
        submissionStatus,
        resultPublicationStatus,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await this.adminAssignmentService.getAssignments({
        search: typeof search === 'string' ? search : undefined,
        teacherId: typeof teacherId === 'string' ? teacherId : undefined,
        academicYear: typeof academicYear === 'string' ? academicYear : undefined,
        className: typeof className === 'string' ? className : undefined,
        section: typeof section === 'string' ? section : undefined,
        subject: typeof subject === 'string' ? subject : undefined,
        status: typeof status === 'string' ? status : undefined,
        submissionStatus: typeof submissionStatus === 'string' ? submissionStatus : undefined,
        resultPublicationStatus:
          typeof resultPublicationStatus === 'string' ? resultPublicationStatus : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sortBy: typeof sortBy === 'string' ? sortBy : undefined,
        sortOrder: sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : undefined,
      });

      res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, AdminMessages.ADMIN_ASSIGNMENTS_FETCHED));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/assignments/:id
   */
  getAssignmentDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const details = await this.adminAssignmentService.getAssignmentDetails(id);
      res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(details, AdminMessages.ADMIN_ASSIGNMENT_DETAILS_FETCHED));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/assignments/monitoring/teachers
   */
  getTeacherMonitoring = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { academicYear, search } = req.query;
      const monitoring = await this.adminAssignmentService.getTeacherMonitoring(
        typeof academicYear === 'string' ? academicYear : undefined,
        typeof search === 'string' ? search : undefined
      );
      res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(monitoring, AdminMessages.ADMIN_TEACHER_MONITORING_FETCHED));
    } catch (error) {
      next(error);
    }
  };
}
