import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../services/AttendanceService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { HttpStatusCode } from '../constants/httpStatusCode';
import { TeacherMessages } from '../constants/teacherMessages';

export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  getAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const { className, section, date, academicYear } = req.query;

      const register = await this.service.getSectionAttendance(
        userId,
        String(className || ''),
        String(section || ''),
        String(date || ''),
        academicYear ? String(academicYear) : undefined
      );

      res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(register, TeacherMessages.ATTENDANCE_REGISTER_RETRIEVED));
    } catch (error) {
      next(error);
    }
  };

  saveAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const register = await this.service.saveSectionAttendance(userId, req.body);

      res
        .status(HttpStatusCode.CREATED)
        .json(ApiResponse.success(register, TeacherMessages.ATTENDANCE_RECORDED));
    } catch (error) {
      next(error);
    }
  };

  updateAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const register = await this.service.updateSectionAttendance(userId, req.body);

      res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(register, TeacherMessages.ATTENDANCE_UPDATED));
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const { className, section, academicYear } = req.query;

      const history = await this.service.getSectionAttendanceHistory(
        userId,
        String(className || ''),
        String(section || ''),
        academicYear ? String(academicYear) : undefined
      );

      res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(history, TeacherMessages.ATTENDANCE_HISTORY_RETRIEVED));
    } catch (error) {
      next(error);
    }
  };
}
