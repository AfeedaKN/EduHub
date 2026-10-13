import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../services/AttendanceService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';

export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  /**
   * GET /api/v1/teacher/attendance
   * Query params: className, section, date
   */
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
        .status(200)
        .json(ApiResponse.success(register, 'Attendance register retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/teacher/attendance
   * Body: { className, section, date, academicYear?, records: [...] }
   */
  saveAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const register = await this.service.saveSectionAttendance(userId, req.body);

      res
        .status(201)
        .json(ApiResponse.success(register, 'Attendance recorded successfully.'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/teacher/attendance
   * Body: { className, section, date, academicYear?, records: [...] }
   */
  updateAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const register = await this.service.updateSectionAttendance(userId, req.body);

      res
        .status(200)
        .json(ApiResponse.success(register, 'Attendance updated successfully.'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/teacher/attendance/history
   * Query params: className, section, academicYear?
   */
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
        .status(200)
        .json(ApiResponse.success(history, 'Attendance history retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };
}
