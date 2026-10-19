import { Request, Response, NextFunction } from 'express';
import { TeacherDashboardService } from '../services/TeacherDashboardService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { HttpStatusCode } from '../constants/httpStatusCode';
import { TeacherMessages } from '../constants/teacherMessages';

export class TeacherDashboardController {
  constructor(private readonly service: TeacherDashboardService) {}

  getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const data = await this.service.getTeacherDashboard(userId);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(data, TeacherMessages.DASHBOARD_RETRIEVED));
    } catch (error) {
      next(error);
    }
  };

  getClasses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const data = await this.service.getTeacherClasses(userId);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(data, TeacherMessages.ASSIGNED_CLASSES_RETRIEVED));
    } catch (error) {
      next(error);
    }
  };

  getStudents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const data = await this.service.getTeacherStudents(userId, req.query as any);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(data, TeacherMessages.STUDENTS_RETRIEVED));
    } catch (error) {
      next(error);
    }
  };

  getTimetable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const academicYear = req.query.academicYear as string | undefined;
      const data = await this.service.getTeacherWeeklyTimetable(userId, academicYear);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(data, TeacherMessages.TIMETABLE_RETRIEVED));
    } catch (error) {
      next(error);
    }
  };
}
