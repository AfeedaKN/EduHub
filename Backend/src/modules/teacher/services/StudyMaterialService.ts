import mongoose from 'mongoose';
import { IStudyMaterialRepository } from '../repositories/StudyMaterialRepository';
import {
  StudyMaterialDTO,
  StudyMaterialsListResponseDTO,
  CreateStudyMaterialDTO,
  UpdateStudyMaterialDTO,
  StudyMaterialFilterParamsDTO,
} from '../dtos/studyMaterial.dto';
import { IStudyMaterialDoc, StudyMaterialStatus } from '../models/StudyMaterial.model';
import {
  ValidationError,
  ForbiddenError,
  UnauthorizedError,
  NotFoundError,
} from '../../../shared/domain/errors/AppError';

export class StudyMaterialService {
  constructor(private readonly studyMaterialRepo: IStudyMaterialRepository) {}

  /**
   * Helper: validates that the teacher exists, is active, and is authorized for the given class, section, and subject.
   */
  private async validateTeacherAssignment(
    userId: string,
    className: string,
    section: string,
    subject: string
  ) {
    if (!className || !className.trim()) {
      throw new ValidationError('Class is required.');
    }
    if (!section || !section.trim()) {
      throw new ValidationError('Section is required.');
    }
    if (!subject || !subject.trim()) {
      throw new ValidationError('Subject is required.');
    }

    const teacher = await this.studyMaterialRepo.findTeacherByUserId(userId);
    if (!teacher || teacher.status !== 'ACTIVE') {
      throw new UnauthorizedError(
        'Active teacher account not found or access revoked.',
        'TEACHER_NOT_FOUND'
      );
    }

    const cleanClass = className.trim().toLowerCase();
    const cleanSection = section.trim().toLowerCase();
    const cleanSubject = subject.trim().toLowerCase();

    const matchedAssignment = teacher.assignedClasses?.find(
      (c) =>
        c.className.trim().toLowerCase() === cleanClass &&
        c.section.trim().toLowerCase() === cleanSection &&
        (!c.subject || c.subject.trim().toLowerCase() === cleanSubject)
    );

    if (!matchedAssignment) {
      throw new ForbiddenError(
        `You are not authorized to upload or manage study materials for ${className} Section ${section} (${subject}).`,
        'FORBIDDEN_CLASS_ASSIGNMENT'
      );
    }

    return { teacher, matchedAssignment };
  }

  /**
   * Helper: formats IStudyMaterialDoc to StudyMaterialDTO
   */
  private toDTO(doc: IStudyMaterialDoc): StudyMaterialDTO {
    return {
      id: doc._id ? doc._id.toString() : (doc as any).id || '',
      title: doc.title,
      description: doc.description || '',
      teacherId: doc.teacherId ? doc.teacherId.toString() : '',
      teacherUserId: doc.teacherUserId ? doc.teacherUserId.toString() : '',
      teacherName: doc.teacherName,
      classId: doc.classId ? doc.classId.toString() : undefined,
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

  /**
   * List study materials for authenticated teacher with filters and summary stats
   */
  async getStudyMaterials(
    userId: string,
    filter?: StudyMaterialFilterParamsDTO
  ): Promise<StudyMaterialsListResponseDTO> {
    const teacher = await this.studyMaterialRepo.findTeacherByUserId(userId);
    if (!teacher) {
      throw new UnauthorizedError(
        'Active teacher account not found or access revoked.',
        'TEACHER_NOT_FOUND'
      );
    }

    const [materialsDocs, summary] = await Promise.all([
      this.studyMaterialRepo.findStudyMaterialsByTeacher(userId, filter),
      this.studyMaterialRepo.countTeacherStudyMaterials(userId, filter?.academicYear),
    ]);

    return {
      materials: materialsDocs.map((doc) => this.toDTO(doc)),
      summary,
    };
  }

  /**
   * Get single study material by ID with ownership verification
   */
  async getStudyMaterialById(userId: string, id: string): Promise<StudyMaterialDTO> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid study material identifier.');
    }

    const doc = await this.studyMaterialRepo.findById(id);
    if (!doc) {
      throw new NotFoundError('Study material not found.');
    }

    if (doc.teacherUserId.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to view this study material.');
    }

    return this.toDTO(doc);
  }

  /**
   * Create new study material
   */
  async createStudyMaterial(
    userId: string,
    dto: CreateStudyMaterialDTO
  ): Promise<StudyMaterialDTO> {
    if (!dto.title || !dto.title.trim()) {
      throw new ValidationError('Title is required.');
    }

    const { teacher, matchedAssignment } = await this.validateTeacherAssignment(
      userId,
      dto.className,
      dto.section,
      dto.subject
    );

    const materialType = dto.materialType || 'DOCUMENT';

    if ((materialType === 'LINK' || materialType === 'VIDEO') && (!dto.externalUrl || !dto.externalUrl.trim())) {
      throw new ValidationError('External URL is required for links and video resources.');
    }

    if (materialType === 'DOCUMENT' && (!dto.fileUrl || !dto.fileUrl.trim()) && (!dto.externalUrl || !dto.externalUrl.trim())) {
      throw new ValidationError('A file upload or resource link is required.');
    }

    const academicYear =
      dto.academicYear && dto.academicYear.trim()
        ? dto.academicYear.trim()
        : matchedAssignment.academicYear || '2026-2027';

    const status: StudyMaterialStatus =
      dto.status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(dto.status)
        ? dto.status
        : 'PUBLISHED';

    const createdDoc = await this.studyMaterialRepo.create({
      title: dto.title.trim(),
      description: dto.description ? dto.description.trim() : '',
      teacherId: teacher._id,
      teacherUserId: new mongoose.Types.ObjectId(userId),
      teacherName: teacher.fullName,
      className: dto.className.trim(),
      section: dto.section.trim().toUpperCase(),
      subject: dto.subject.trim(),
      academicYear,
      materialType,
      fileUrl: dto.fileUrl ? dto.fileUrl.trim() : '',
      fileName: dto.fileName ? dto.fileName.trim() : '',
      fileSize: dto.fileSize || 0,
      fileType: dto.fileType ? dto.fileType.trim() : '',
      externalUrl: dto.externalUrl ? dto.externalUrl.trim() : '',
      status,
    });

    return this.toDTO(createdDoc);
  }

  /**
   * Update existing study material
   */
  async updateStudyMaterial(
    userId: string,
    id: string,
    dto: UpdateStudyMaterialDTO
  ): Promise<StudyMaterialDTO> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid study material identifier.');
    }

    const existing = await this.studyMaterialRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('Study material not found.');
    }

    if (existing.teacherUserId.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to update this study material.');
    }

    const targetClass = dto.className ? dto.className.trim() : existing.className;
    const targetSection = dto.section ? dto.section.trim().toUpperCase() : existing.section;
    const targetSubject = dto.subject ? dto.subject.trim() : existing.subject;

    if (
      dto.className ||
      dto.section ||
      dto.subject
    ) {
      await this.validateTeacherAssignment(userId, targetClass, targetSection, targetSubject);
    }

    const materialType = dto.materialType || existing.materialType;
    const externalUrl = dto.externalUrl !== undefined ? dto.externalUrl.trim() : existing.externalUrl;
    const fileUrl = dto.fileUrl !== undefined ? dto.fileUrl.trim() : existing.fileUrl;

    if ((materialType === 'LINK' || materialType === 'VIDEO') && (!externalUrl || !externalUrl.trim())) {
      throw new ValidationError('External URL is required for links and video resources.');
    }

    const updatePayload: Partial<IStudyMaterialDoc> = {};
    if (dto.title !== undefined) {
      if (!dto.title.trim()) throw new ValidationError('Title cannot be empty.');
      updatePayload.title = dto.title.trim();
    }
    if (dto.description !== undefined) {
      updatePayload.description = dto.description.trim();
    }
    if (dto.className !== undefined) updatePayload.className = targetClass;
    if (dto.section !== undefined) updatePayload.section = targetSection;
    if (dto.subject !== undefined) updatePayload.subject = targetSubject;
    if (dto.academicYear !== undefined && dto.academicYear.trim()) {
      updatePayload.academicYear = dto.academicYear.trim();
    }
    if (dto.materialType !== undefined) updatePayload.materialType = dto.materialType;
    if (dto.fileUrl !== undefined) updatePayload.fileUrl = fileUrl;
    if (dto.fileName !== undefined) updatePayload.fileName = dto.fileName.trim();
    if (dto.fileSize !== undefined) updatePayload.fileSize = dto.fileSize;
    if (dto.fileType !== undefined) updatePayload.fileType = dto.fileType.trim();
    if (dto.externalUrl !== undefined) updatePayload.externalUrl = externalUrl;
    if (dto.status !== undefined && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(dto.status)) {
      updatePayload.status = dto.status;
    }

    const updatedDoc = await this.studyMaterialRepo.update(id, updatePayload);
    if (!updatedDoc) {
      throw new NotFoundError('Study material not found after update.');
    }

    return this.toDTO(updatedDoc);
  }

  /**
   * Delete study material with ownership verification
   */
  async deleteStudyMaterial(userId: string, id: string): Promise<{ success: boolean; message: string }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid study material identifier.');
    }

    const existing = await this.studyMaterialRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('Study material not found.');
    }

    if (existing.teacherUserId.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to delete this study material.');
    }

    await this.studyMaterialRepo.delete(id);
    return { success: true, message: 'Study material deleted successfully.' };
  }
}
