import mongoose from 'mongoose';
import { IAdminStudyMaterialRepository } from '../repositories/AdminStudyMaterialRepository';
import {
  AdminStudyMaterialSummaryDTO,
  AdminStudyMaterialListItemDTO,
  AdminStudyMaterialFilterQueryDTO,
  AdminStudyMaterialListResponseDTO,
  AdminStudyMaterialMetadataDTO,
} from '../dtos/adminStudyMaterial.dto';
import {
  ValidationError,
  NotFoundError,
} from '../../../shared/domain/errors/AppError';

export class AdminStudyMaterialService {
  constructor(private readonly repo: IAdminStudyMaterialRepository) {}

  async getSummary(academicYear?: string): Promise<AdminStudyMaterialSummaryDTO> {
    return await this.repo.getSummary(academicYear);
  }

  async getStudyMaterials(
    query: AdminStudyMaterialFilterQueryDTO
  ): Promise<AdminStudyMaterialListResponseDTO> {
    return await this.repo.getStudyMaterials(query);
  }

  async getStudyMaterialById(id: string): Promise<AdminStudyMaterialListItemDTO> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid study material identifier.');
    }

    const doc = await this.repo.getStudyMaterialById(id);
    if (!doc) {
      throw new NotFoundError('Study material not found.');
    }

    return {
      id: doc._id ? doc._id.toString() : (doc as any).id || '',
      title: doc.title,
      description: doc.description || '',
      teacherId: doc.teacherId ? doc.teacherId.toString() : '',
      teacherUserId: doc.teacherUserId ? doc.teacherUserId.toString() : '',
      teacherName: doc.teacherName,
      className: doc.className,
      section: doc.section,
      subject: doc.subject,
      academicYear: doc.academicYear,
      materialType: doc.materialType,
      fileUrl: doc.fileUrl || '',
      fileName: doc.fileName || '',
      fileSize: doc.fileSize || 0,
      fileType: doc.fileType || '',
      externalUrl: doc.externalUrl || '',
      status: doc.status,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  async getMetadata(academicYear?: string): Promise<AdminStudyMaterialMetadataDTO> {
    return await this.repo.getMetadata(academicYear);
  }
}
