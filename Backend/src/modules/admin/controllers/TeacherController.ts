import { Request, Response, NextFunction } from 'express';
import { TeacherService } from '../services/TeacherService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { HttpStatusCode } from '../constants/httpStatusCode';
import { AdminMessages } from '../constants/adminMessages';

export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  getSummaryStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.teacherService.getSummaryStats();
      res.status(HttpStatusCode.OK).json(ApiResponse.success(stats, AdminMessages.TEACHER_SUMMARY_FETCHED));
    } catch (error) {
      next(error);
    }
  };

  getTeachers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, status, department } = req.query;
      const teachers = await this.teacherService.getTeachers({
        search: search as string | undefined,
        status: status as string | undefined,
        department: department as string | undefined,
      });
      res.status(HttpStatusCode.OK).json(ApiResponse.success(teachers, AdminMessages.TEACHERS_FETCHED));
    } catch (error) {
      next(error);
    }
  };

  getTeacherById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const teacher = await this.teacherService.getTeacherById(id);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(teacher, AdminMessages.TEACHER_FETCHED));
    } catch (error) {
      next(error);
    }
  };

  createTeacher = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await this.teacherService.createTeacher(req.body);
      res.status(HttpStatusCode.CREATED).json(ApiResponse.success(created, AdminMessages.TEACHER_CREATED));
    } catch (error) {
      next(error);
    }
  };

  updateTeacher = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updated = await this.teacherService.updateTeacher(id, req.body);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(updated, 'Teacher updated successfully.'));
    } catch (error) {
      next(error);
    }
  };

  changeTeacherStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await this.teacherService.changeTeacherStatus(id, status);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(updated, `Teacher status updated to ${status}.`));
    } catch (error) {
      next(error);
    }
  };

  deleteTeacher = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.teacherService.deleteTeacher(id);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(null, AdminMessages.TEACHER_DELETED));
    } catch (error) {
      next(error);
    }
  };

  getAllAssignments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { academicYear, className, section, subject, teacherId, search } = req.query;
      const assignments = await this.teacherService.getAllAssignments({
        academicYear: academicYear as string | undefined,
        className: className as string | undefined,
        section: section as string | undefined,
        subject: subject as string | undefined,
        teacherId: teacherId as string | undefined,
        search: search as string | undefined,
      });
      res.status(HttpStatusCode.OK).json(ApiResponse.success(assignments, AdminMessages.ASSIGNMENTS_FETCHED));
    } catch (error) {
      next(error);
    }
  };

  getTeacherAssignments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const assignments = await this.teacherService.getTeacherAssignments(id);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(assignments, AdminMessages.TEACHER_ASSIGNMENTS_FETCHED));
    } catch (error) {
      next(error);
    }
  };

  assignTeacherToClass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const assignment = await this.teacherService.assignTeacherToClass(id, req.body);
      res.status(HttpStatusCode.CREATED).json(ApiResponse.success(assignment, AdminMessages.ASSIGNMENT_CREATED));
    } catch (error) {
      next(error);
    }
  };

  updateTeacherAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, assignmentId } = req.params;
      const updated = await this.teacherService.updateTeacherAssignment(id, assignmentId, req.body);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(updated, AdminMessages.ASSIGNMENT_UPDATED));
    } catch (error) {
      next(error);
    }
  };

  removeTeacherAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, assignmentId } = req.params;
      await this.teacherService.removeTeacherAssignment(id, assignmentId);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(null, AdminMessages.ASSIGNMENT_DELETED));
    } catch (error) {
      next(error);
    }
  };
}
