import { Request, Response, NextFunction } from 'express';
import { AdminStudyMaterialService } from '../services/AdminStudyMaterialService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { HttpStatusCode } from '../constants/httpStatusCode';

export class AdminStudyMaterialController {
  constructor(private readonly service: AdminStudyMaterialService) {}

  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { academicYear } = req.query;
      const result = await this.service.getSummary(
        academicYear ? String(academicYear) : undefined
      );

      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Study materials summary retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  getStudyMaterials = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        academicYear,
        teacherId,
        className,
        section,
        subject,
        status,
        materialType,
        search,
        page,
        limit,
      } = req.query;

      const result = await this.service.getStudyMaterials({
        academicYear: academicYear ? String(academicYear) : undefined,
        teacherId: teacherId ? String(teacherId) : undefined,
        className: className ? String(className) : undefined,
        section: section ? String(section) : undefined,
        subject: subject ? String(subject) : undefined,
        status: status ? String(status) : undefined,
        materialType: materialType ? String(materialType) : undefined,
        search: search ? String(search) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Study materials retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  getStudyMaterialById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.getStudyMaterialById(id);

      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Study material details retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  getMetadata = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { academicYear } = req.query;
      const result = await this.service.getMetadata(
        academicYear ? String(academicYear) : undefined
      );

      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Study material metadata filters retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };
}
