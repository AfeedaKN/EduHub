import { Request, Response, NextFunction } from 'express';
import { TimetableService } from '../services/TimetableService';
import {
  CreatePeriodDTO,
  UpdatePeriodDTO,
  TimetableFilterDTO,
} from '../dtos/timetable.dto';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { HttpStatusCode } from '../constants/httpStatusCode';
import { AdminMessages } from '../constants/adminMessages';

export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  getPeriods = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      res.status(HttpStatusCode.OK).json(ApiResponse.success(periods, AdminMessages.TIMETABLE_PERIODS_FETCHED));
    } catch (err) {
      next(err);
    }
  };

  getPeriodById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const period = await this.timetableService.getPeriodById(req.params.id);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(period, AdminMessages.TIMETABLE_PERIOD_FETCHED));
    } catch (err) {
      next(err);
    }
  };

  createPeriod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: CreatePeriodDTO = req.body;
      const created = await this.timetableService.createPeriod(dto);
      res.status(HttpStatusCode.CREATED).json(ApiResponse.success(created, AdminMessages.TIMETABLE_PERIOD_CREATED));
    } catch (err) {
      next(err);
    }
  };

  updatePeriod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: UpdatePeriodDTO = req.body;
      const updated = await this.timetableService.updatePeriod(req.params.id, dto);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(updated, AdminMessages.TIMETABLE_PERIOD_UPDATED));
    } catch (err) {
      next(err);
    }
  };

  deletePeriod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.timetableService.deletePeriod(req.params.id);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(null, AdminMessages.TIMETABLE_PERIOD_DELETED));
    } catch (err) {
      next(err);
    }
  };
}
