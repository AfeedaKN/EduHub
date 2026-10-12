import { Request, Response, NextFunction } from 'express';
import { TeacherDashboardService } from '../services/TeacherDashboardService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';

export class TeacherDashboardController {
  constructor(private readonly service: TeacherDashboardService) {}

  /**
   * GET /api/v1/teacher/dashboard
   */
  getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const data = await this.service.getTeacherDashboard(userId);
      res.status(200).json(ApiResponse.success(data, 'Teacher dashboard retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/teacher/classes
   */
  getClasses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const data = await this.service.getTeacherClasses(userId);
      res.status(200).json(ApiResponse.success(data, 'Assigned classes retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/teacher/students
   */
  getStudents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const data = await this.service.getTeacherStudents(userId);
      res.status(200).json(ApiResponse.success(data, 'Students retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };
}
