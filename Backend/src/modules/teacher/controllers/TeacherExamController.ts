import { Request, Response, NextFunction } from 'express';
import { TeacherExamService } from '../services/TeacherExamService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { HttpStatusCode } from '../constants/httpStatusCode';
import { TeacherMessages } from '../constants/teacherMessages';

export class TeacherExamController {
  constructor(private readonly service: TeacherExamService) {}

  getTeacherExams = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const email = (req as any).user?.email;
      const { academicYear, examType, className, section, status, search } = req.query;

      const result = await this.service.getTeacherExams(userId, {
        academicYear: academicYear ? String(academicYear) : undefined,
        examType: examType ? String(examType) : undefined,
        className: className ? String(className) : undefined,
        section: section ? String(section) : undefined,
        status: status ? String(status) : undefined,
        search: search ? String(search) : undefined,
      }, email);

      res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, TeacherMessages.EXAMS_RETRIEVED));
    } catch (error) {
      next(error);
    }
  };

  getScheduleMarks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const email = (req as any).user?.email;
      const { scheduleId } = req.params;

      const result = await this.service.getScheduleMarks(userId, scheduleId, email);

      res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, TeacherMessages.EXAM_MARKS_RETRIEVED));
    } catch (error) {
      next(error);
    }
  };

  saveDraftMarks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const email = (req as any).user?.email;
      const { scheduleId } = req.params;

      const result = await this.service.saveDraftMarks(userId, scheduleId, req.body, email);

      res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, TeacherMessages.EXAM_MARKS_DRAFT_SAVED));
    } catch (error) {
      next(error);
    }
  };

  submitMarks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const email = (req as any).user?.email;
      const { scheduleId } = req.params;

      const result = await this.service.submitMarks(userId, scheduleId, req.body, email);

      res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, TeacherMessages.EXAM_MARKS_SUBMITTED));
    } catch (error) {
      next(error);
    }
  };
}
