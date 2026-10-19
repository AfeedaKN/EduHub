import { Request, Response, NextFunction } from 'express';
import { ClassService } from '../services/ClassService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { HttpStatusCode } from '../constants/httpStatusCode';
import { AdminMessages } from '../constants/adminMessages';

export class ClassController {
  constructor(private readonly classService: ClassService) {}

  getSummaryStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { academicYear } = req.query;
      const stats = await this.classService.getSummaryStats(academicYear as string | undefined);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(stats, AdminMessages.CLASS_SUMMARY_FETCHED));
    } catch (error) {
      next(error);
    }
  };

  getClasses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { academicYear, status, search } = req.query;
      const classes = await this.classService.getClasses({
        academicYear: academicYear as string | undefined,
        status: status as any,
        search: search as string | undefined,
      });
      res.status(HttpStatusCode.OK).json(ApiResponse.success(classes, AdminMessages.CLASSES_FETCHED));
    } catch (error) {
      next(error);
    }
  };

  getClassById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const classDoc = await this.classService.getClassById(id);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(classDoc, AdminMessages.CLASS_FETCHED));
    } catch (error) {
      next(error);
    }
  };

  createClass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, academicYear, description } = req.body;
      const created = await this.classService.createClass({
        name,
        academicYear,
        description,
      });
      res.status(HttpStatusCode.CREATED).json(ApiResponse.success(created, `Class "${created.name}" created successfully.`));
    } catch (error) {
      next(error);
    }
  };

  updateClass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, academicYear, description, status } = req.body;
      const updated = await this.classService.updateClass(id, {
        name,
        academicYear,
        description,
        status,
      });
      res.status(HttpStatusCode.OK).json(ApiResponse.success(updated, `Class "${updated.name}" updated successfully.`));
    } catch (error) {
      next(error);
    }
  };

  changeClassStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await this.classService.changeClassStatus(id, status);
      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(
          updated,
          `Class "${updated.name}" status changed to ${updated.status}.`
        )
      );
    } catch (error) {
      next(error);
    }
  };

  deleteClass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.classService.deleteClass(id);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(result, result.message));
    } catch (error) {
      next(error);
    }
  };

  getSectionsForClass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { classId } = req.params;
      const sections = await this.classService.getSectionsForClass(classId);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(sections, AdminMessages.SECTIONS_FETCHED));
    } catch (error) {
      next(error);
    }
  };

  createSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { classId } = req.params;
      const { name, capacity, roomNumber } = req.body;
      const created = await this.classService.createSection(classId, {
        name,
        capacity,
        roomNumber,
      });
      res.status(HttpStatusCode.CREATED).json(ApiResponse.success(created, `Section "${created.name}" created successfully.`));
    } catch (error) {
      next(error);
    }
  };

  updateSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { classId, sectionId } = req.params;
      const { name, capacity, roomNumber, status } = req.body;
      const updated = await this.classService.updateSection(classId, sectionId, {
        name,
        capacity,
        roomNumber,
        status,
      });
      res.status(HttpStatusCode.OK).json(ApiResponse.success(updated, `Section "${updated.name}" updated successfully.`));
    } catch (error) {
      next(error);
    }
  };

  changeSectionStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { classId, sectionId } = req.params;
      const { status } = req.body;
      const updated = await this.classService.changeSectionStatus(classId, sectionId, status);
      res.status(HttpStatusCode.OK).json(
        ApiResponse.success(
          updated,
          `Section "${updated.name}" status changed to ${updated.status}.`
        )
      );
    } catch (error) {
      next(error);
    }
  };

  deleteSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { classId, sectionId } = req.params;
      const result = await this.classService.deleteSection(classId, sectionId);
      res.status(HttpStatusCode.OK).json(ApiResponse.success(result, result.message));
    } catch (error) {
      next(error);
    }
  };
}
