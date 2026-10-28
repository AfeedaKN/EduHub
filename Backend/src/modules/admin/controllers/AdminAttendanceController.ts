import { Request, Response, NextFunction } from 'express';
import { IAdminAttendanceService } from '../services/AdminAttendanceService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { HttpStatusCode } from '../constants/httpStatusCode';
import { UnauthorizedError } from '../../../shared/domain/errors/AppError';

export class AdminAttendanceController {
  constructor(private readonly attendanceService: IAdminAttendanceService) { }

  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const { date, academicYear } = req.query;
      const summary = await this.attendanceService.getSummary(
        typeof date === 'string' ? date : undefined,
        typeof academicYear === 'string' ? academicYear : undefined
      );

      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(summary, 'Attendance summary retrieved successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  getDailyRegister = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const { date, academicYear, className, section, status, search, page, limit } = req.query;

      const register = await this.attendanceService.getDailyRegister({
        date: typeof date === 'string' ? date : undefined,
        academicYear: typeof academicYear === 'string' ? academicYear : undefined,
        className: typeof className === 'string' ? className : undefined,
        section: typeof section === 'string' ? section : undefined,
        status: typeof status === 'string' ? status : undefined,
        search: typeof search === 'string' ? search : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(register, 'Daily attendance register retrieved successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  getClassesOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const { date, academicYear } = req.query;
      const overview = await this.attendanceService.getClassesOverview(
        typeof date === 'string' ? date : undefined,
        typeof academicYear === 'string' ? academicYear : undefined
      );

      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(overview, 'Classes attendance overview retrieved successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  getSubmissionsMonitoring = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const { date, academicYear } = req.query;
      const submissions = await this.attendanceService.getSubmissionsMonitoring(
        typeof date === 'string' ? date : undefined,
        typeof academicYear === 'string' ? academicYear : undefined
      );

      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(submissions, 'Attendance submission monitoring retrieved successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  getMonthlyReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const { month, academicYear, className, section } = req.query;
      const report = await this.attendanceService.getMonthlyReport({
        month: typeof month === 'string' ? month : undefined,
        academicYear: typeof academicYear === 'string' ? academicYear : undefined,
        className: typeof className === 'string' ? className : undefined,
        section: typeof section === 'string' ? section : undefined,
      });

      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(report, 'Monthly attendance report retrieved successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  getLowAttendanceReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const { threshold, academicYear, className, section, startDate, endDate } = req.query;
      const report = await this.attendanceService.getLowAttendanceReport({
        threshold: threshold ? Number(threshold) : undefined,
        academicYear: typeof academicYear === 'string' ? academicYear : undefined,
        className: typeof className === 'string' ? className : undefined,
        section: typeof section === 'string' ? section : undefined,
        startDate: typeof startDate === 'string' ? startDate : undefined,
        endDate: typeof endDate === 'string' ? endDate : undefined,
      });

      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(report, 'Low attendance report retrieved successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  getStudentHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const { studentId } = req.params;
      const { startDate, endDate } = req.query;

      const history = await this.attendanceService.getStudentHistory(
        studentId,
        typeof startDate === 'string' ? startDate : undefined,
        typeof endDate === 'string' ? endDate : undefined
      );

      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(history, 'Student attendance history retrieved successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  correctAttendanceRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const { id } = req.params;
      const { status, remarks, reason } = req.body;

      const result = await this.attendanceService.correctAttendanceRecord(
        id,
        { status, remarks, reason },
        req.user.sub
      );

      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(result, 'Attendance record updated successfully with audit trail.')
      );
    } catch (error) {
      next(error);
    }
  };

  recordSingleStudentAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const { studentId } = req.params;
      const { date, status, remarks, reason } = req.body;

      const result = await this.attendanceService.recordSingleStudentAttendance(
        studentId,
        date,
        { status, remarks, reason },
        req.user.sub
      );

      res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(result, 'Attendance recorded successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  getSubjectWiseAttendanceGrid = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const { academicYear, className, section, date, search, onlyAbsent, status } = req.query;

      const grid = await this.attendanceService.getSubjectWiseAttendanceGrid({
        academicYear: typeof academicYear === 'string' ? academicYear : undefined,
        className: typeof className === 'string' ? className : '',
        section: typeof section === 'string' ? section : 'A',
        date: typeof date === 'string' ? date : new Date().toISOString().split('T')[0],
        search: typeof search === 'string' ? search : undefined,
        onlyAbsent: onlyAbsent === 'true',
        status: typeof status === 'string' ? status : undefined,
      });

      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(grid, 'Subject-wise attendance matrix retrieved successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  saveSubjectWiseAttendanceBatch = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated management session required.', 'UNAUTHORIZED');
      }

      const { date, className, section, academicYear, records } = req.body;

      await this.attendanceService.saveSubjectWiseAttendanceBatch(
        {
          date,
          className,
          section,
          academicYear,
          records,
        },
        req.user.sub,
        req.user.fullName || 'School Administrator'
      );

      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(null, 'Subject-wise attendance saved successfully.')
      );
    } catch (error) {
      next(error);
    }
  };
}

