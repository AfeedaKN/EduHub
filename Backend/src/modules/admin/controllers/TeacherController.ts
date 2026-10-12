import { Request, Response, NextFunction } from 'express';
import { TeacherService } from '../services/TeacherService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';

export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  /**
   * GET /api/v1/admin/teachers/summary
   */
  getSummaryStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.teacherService.getSummaryStats();
      res.status(200).json(ApiResponse.success(stats, 'Teacher summary statistics retrieved.'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/teachers
   */
  getTeachers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, status, department } = req.query;
      const teachers = await this.teacherService.getTeachers({
        search: search as string | undefined,
        status: status as string | undefined,
        department: department as string | undefined,
      });
      res.status(200).json(ApiResponse.success(teachers, 'Teachers retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/teachers/:id
   */
  getTeacherById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const teacher = await this.teacherService.getTeacherById(id);
      res.status(200).json(ApiResponse.success(teacher, 'Teacher retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/teachers
   */
  createTeacher = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await this.teacherService.createTeacher(req.body);
      res.status(201).json(ApiResponse.success(created, 'Teacher account created successfully.'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/admin/teachers/:id
   */
  updateTeacher = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updated = await this.teacherService.updateTeacher(id, req.body);
      res.status(200).json(ApiResponse.success(updated, 'Teacher updated successfully.'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/admin/teachers/:id/status
   */
  changeTeacherStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await this.teacherService.changeTeacherStatus(id, status);
      res.status(200).json(ApiResponse.success(updated, `Teacher status updated to ${status}.`));
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/teachers/:id
   */
  deleteTeacher = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.teacherService.deleteTeacher(id);
      res.status(200).json(ApiResponse.success(null, 'Teacher deleted successfully.'));
    } catch (error) {
      next(error);
    }
  };
}
