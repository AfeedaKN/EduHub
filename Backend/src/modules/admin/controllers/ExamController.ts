import { Request, Response, NextFunction } from 'express';
import { ExamService } from '../services/ExamService';
import {
  CreateExamDTO,
  UpdateExamDTO,
  ExamFilterDTO,
  CreateScheduleDTO,
  UpdateScheduleDTO,
} from '../dtos/exam.dto';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { HttpStatusCode } from '../constants/httpStatusCode';
import { AdminMessages } from '../constants/adminMessages';

export class ExamController {
  constructor(private readonly examService: ExamService) {}

  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const academicYear = req.query.academicYear as string | undefined;
      const summary = await this.examService.getExamsSummary(academicYear);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(summary, AdminMessages.EXAM_SUMMARY_FETCHED));
    } catch (err) {
      next(err);
    }
  };

  getExams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter: ExamFilterDTO = {
        academicYear: req.query.academicYear as string | undefined,
        examType: req.query.examType as any,
        status: req.query.status as any,
        search: req.query.search as string | undefined,
      };

      const exams = await this.examService.getExams(filter);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(exams, AdminMessages.EXAMS_FETCHED));
    } catch (err) {
      next(err);
    }
  };

  getExamById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const exam = await this.examService.getExamById(req.params.id);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(exam, AdminMessages.EXAM_FETCHED));
    } catch (err) {
      next(err);
    }
  };

  createExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: CreateExamDTO = req.body;
      const created = await this.examService.createExam(dto);
      res.status(HttpStatusCode.CREATED).json(ApiResponse.success(created, AdminMessages.EXAM_CREATED));
    } catch (err) {
      next(err);
    }
  };

  updateExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: UpdateExamDTO = req.body;
      const updated = await this.examService.updateExam(req.params.id, dto);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(updated, AdminMessages.EXAM_UPDATED));
    } catch (err) {
      next(err);
    }
  };

  deleteExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.examService.deleteExam(req.params.id);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(null, AdminMessages.EXAM_DELETED));
    } catch (err) {
      next(err);
    }
  };

  getSchedules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const schedules = await this.examService.getSchedulesByExamId(req.params.id);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(schedules, AdminMessages.EXAM_SCHEDULES_FETCHED));
    } catch (err) {
      next(err);
    }
  };

  createSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: CreateScheduleDTO = req.body;
      const schedule = await this.examService.createSchedule(req.params.id, dto);
      res.status(HttpStatusCode.CREATED).json(ApiResponse.success(schedule, AdminMessages.EXAM_SCHEDULE_CREATED));
    } catch (err) {
      next(err);
    }
  };

  updateSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: UpdateScheduleDTO = req.body;
      const updated = await this.examService.updateSchedule(
        req.params.id,
        req.params.scheduleId,
        dto
      );
      res.status(HttpStatusCode.OK).json(ApiResponse.success(updated, AdminMessages.EXAM_SCHEDULE_UPDATED));
    } catch (err) {
      next(err);
    }
  };

  deleteSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.examService.deleteSchedule(req.params.id, req.params.scheduleId);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(null, AdminMessages.EXAM_SCHEDULE_DELETED));
    } catch (err) {
      next(err);
    }
  };

  getValidSubjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { classId, section } = req.params;
      const academicYear = req.query.academicYear as string | undefined;
      const subjects = await this.examService.getValidSubjects(
        classId,
        section,
        academicYear
      );
      res.status(HttpStatusCode.OK).json(ApiResponse.success(subjects, AdminMessages.VALID_SUBJECTS_FETCHED));
    } catch (err) {
      next(err);
    }
  };
}
