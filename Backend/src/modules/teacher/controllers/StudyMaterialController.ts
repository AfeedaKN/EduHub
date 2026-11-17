import { Request, Response, NextFunction } from 'express';
import { StudyMaterialService } from '../services/StudyMaterialService';
import { ApiResponse } from '../../../shared/presentation/responses/ApiResponse';
import { UnauthorizedError } from '../../../shared/domain/errors/AppError';
import { HttpStatusCode } from '../constants/httpStatusCode';

export class StudyMaterialController {
  constructor(private readonly studyMaterialService: StudyMaterialService) {}

  getStudyMaterials = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated teacher session required.', 'UNAUTHORIZED');
      }

      const { className, section, subject, academicYear, status, materialType, search } = req.query;

      const result = await this.studyMaterialService.getStudyMaterials(req.user.sub, {
        className: className ? String(className) : undefined,
        section: section ? String(section) : undefined,
        subject: subject ? String(subject) : undefined,
        academicYear: academicYear ? String(academicYear) : undefined,
        status: status ? (String(status) as any) : undefined,
        materialType: materialType ? (String(materialType) as any) : undefined,
        search: search ? String(search) : undefined,
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
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated teacher session required.', 'UNAUTHORIZED');
      }

      const { id } = req.params;
      const result = await this.studyMaterialService.getStudyMaterialById(req.user.sub, id);

      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Study material details retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  };

  createStudyMaterial = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated teacher session required.', 'UNAUTHORIZED');
      }

      const result = await this.studyMaterialService.createStudyMaterial(req.user.sub, req.body);

      return res
        .status(HttpStatusCode.CREATED)
        .json(ApiResponse.success(result, 'Study material created successfully.'));
    } catch (error) {
      next(error);
    }
  };

  updateStudyMaterial = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated teacher session required.', 'UNAUTHORIZED');
      }

      const { id } = req.params;
      const result = await this.studyMaterialService.updateStudyMaterial(req.user.sub, id, req.body);

      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, 'Study material updated successfully.'));
    } catch (error) {
      next(error);
    }
  };

  deleteStudyMaterial = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.sub) {
        throw new UnauthorizedError('Authenticated teacher session required.', 'UNAUTHORIZED');
      }

      const { id } = req.params;
      const result = await this.studyMaterialService.deleteStudyMaterial(req.user.sub, id);

      return res
        .status(HttpStatusCode.OK)
        .json(ApiResponse.success(result, result.message));
    } catch (error) {
      next(error);
    }
  };
}
