import { Request, Response, NextFunction } from 'express';
import { TimetableService } from '../services/TimetableService';
import {
  CreatePeriodDTO,
  UpdatePeriodDTO,
  TimetableFilterDTO,
} from '../dtos/timetable.dto';

export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  /**
   * GET /api/v1/admin/timetable
   * Filter timetable periods by academicYear, classId, className, section, dayOfWeek, teacherId
   */
  getPeriods = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filter: TimetableFilterDTO = {
        academicYear: req.query.academicYear as string | undefined,
        classId: req.query.classId as string | undefined,
        className: req.query.className as string | undefined,
        section: req.query.section as string | undefined,
        dayOfWeek: req.query.dayOfWeek as any,
        teacherId: req.query.teacherId as string | undefined,
        periodType: req.query.periodType as any,
      };

      const periods = await this.timetableService.getPeriods(filter);
      res.status(200).json({
        success: true,
        message: 'Timetable periods retrieved successfully',
        data: periods,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/admin/timetable/:id
   */
  getPeriodById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const period = await this.timetableService.getPeriodById(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Timetable period retrieved successfully',
        data: period,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/admin/timetable
   */
  createPeriod = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: CreatePeriodDTO = req.body;
      const created = await this.timetableService.createPeriod(dto);
      res.status(201).json({
        success: true,
        message: 'Timetable period scheduled successfully',
        data: created,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * PUT /api/v1/admin/timetable/:id
   */
  updatePeriod = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto: UpdatePeriodDTO = req.body;
      const updated = await this.timetableService.updatePeriod(req.params.id, dto);
      res.status(200).json({
        success: true,
        message: 'Timetable period updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/v1/admin/timetable/:id
   */
  deletePeriod = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.timetableService.deletePeriod(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Timetable period removed successfully',
        data: null,
      });
    } catch (err) {
      next(err);
    }
  };
}
