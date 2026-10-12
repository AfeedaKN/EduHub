import { Request, Response, NextFunction } from 'express';
import { ClassService } from '../services/ClassService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';

export class ClassController {
  constructor(private readonly classService: ClassService) {}

  /**
   * GET /api/v1/admin/classes/summary
   */
  getSummaryStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { academicYear } = req.query;
      const stats = await this.classService.getSummaryStats(academicYear as string | undefined);
      res.status(200).json(ApiResponse.success(stats, 'Class and section summary statistics retrieved.'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/classes
   */
  getClasses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { academicYear, status, search } = req.query;
      const classes = await this.classService.getClasses({
        academicYear: academicYear as string | undefined,
        status: status as any,
        search: search as string | undefined,
      });
      res.status(200).json(ApiResponse.success(classes, 'Classes retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/classes/:id
   */
  getClassById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const classDoc = await this.classService.getClassById(id);
      res.status(200).json(ApiResponse.success(classDoc, 'Class retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/classes
   */
  createClass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, academicYear, description } = req.body;
      const created = await this.classService.createClass({
        name,
        academicYear,
        description,
      });
      res.status(201).json(ApiResponse.success(created, `Class "${created.name}" created successfully.`));
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/admin/classes/:id
   */
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
      res.status(200).json(ApiResponse.success(updated, `Class "${updated.name}" updated successfully.`));
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/admin/classes/:id/status
   */
  changeClassStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await this.classService.changeClassStatus(id, status);
      res.status(200).json(
        ApiResponse.success(
          updated,
          `Class "${updated.name}" status changed to ${updated.status}.`
        )
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/classes/:id
   */
  deleteClass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.classService.deleteClass(id);
      res.status(200).json(ApiResponse.success(result, result.message));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/classes/:classId/sections
   */
  getSectionsForClass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { classId } = req.params;
      const sections = await this.classService.getSectionsForClass(classId);
      res.status(200).json(ApiResponse.success(sections, 'Sections retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/classes/:classId/sections
   */
  createSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { classId } = req.params;
      const { name, capacity, roomNumber } = req.body;
      const created = await this.classService.createSection(classId, {
        name,
        capacity,
        roomNumber,
      });
      res.status(201).json(ApiResponse.success(created, `Section "${created.name}" created successfully.`));
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/admin/classes/:classId/sections/:sectionId
   */
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
      res.status(200).json(ApiResponse.success(updated, `Section "${updated.name}" updated successfully.`));
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/admin/classes/:classId/sections/:sectionId/status
   */
  changeSectionStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { classId, sectionId } = req.params;
      const { status } = req.body;
      const updated = await this.classService.changeSectionStatus(classId, sectionId, status);
      res.status(200).json(
        ApiResponse.success(
          updated,
          `Section "${updated.name}" status changed to ${updated.status}.`
        )
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/classes/:classId/sections/:sectionId
   */
  deleteSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { classId, sectionId } = req.params;
      const result = await this.classService.deleteSection(classId, sectionId);
      res.status(200).json(ApiResponse.success(result, result.message));
    } catch (error) {
      next(error);
    }
  };
}
