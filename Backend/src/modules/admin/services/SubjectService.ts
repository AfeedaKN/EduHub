import mongoose from 'mongoose';
import { ISubjectRepository } from '../repositories/SubjectRepository';
import { IClassRepository } from '../repositories/ClassRepository';
import {
  ISubjectDoc,
  SubjectCategory,
  SubjectStatus,
  VALID_SUBJECT_CATEGORIES,
} from '../models/Subject.model';
import {
  CreateSubjectDTO,
  UpdateSubjectDTO,
  SubjectFilterOptions,
  SubjectSummaryStatsDTO,
  SubjectResponseDTO,
  SubjectListResponseDTO,
  SubjectReferencesDTO,
  ApplicableClassDTO,
} from '../dtos/subject.dto';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../../shared/domain/errors/AppError';

export interface ISubjectService {
  getSummaryStats(academicYear?: string): Promise<SubjectSummaryStatsDTO>;
  getSubjects(filter: SubjectFilterOptions): Promise<SubjectListResponseDTO>;
  getSubjectById(id: string): Promise<SubjectResponseDTO>;
  createSubject(dto: CreateSubjectDTO): Promise<SubjectResponseDTO>;
  updateSubject(id: string, dto: UpdateSubjectDTO): Promise<SubjectResponseDTO>;
  changeSubjectStatus(id: string, status: SubjectStatus): Promise<SubjectResponseDTO>;
  deleteSubject(id: string): Promise<{ success: boolean; message: string }>;
  getSubjectReferences(id: string): Promise<SubjectReferencesDTO>;
}

export class SubjectService implements ISubjectService {
  constructor(
    private readonly subjectRepo: ISubjectRepository,
    private readonly classRepo?: IClassRepository
  ) {}

  private getCategoryLabel(category: SubjectCategory): string {
    const labels: Record<SubjectCategory, string> = {
      CORE: 'Core',
      ELECTIVE: 'Elective',
      LANGUAGE: 'Language',
      SCIENCE: 'Science',
      HUMANITIES: 'Humanities',
      COMMERCE: 'Commerce',
      ARTS: 'Arts',
      VOCATIONAL: 'Vocational',
      PHYSICAL_EDUCATION: 'Physical Education',
      OTHER: 'Other',
    };
    return labels[category] || category;
  }

  private async mapSubjectDocToResponse(doc: ISubjectDoc): Promise<SubjectResponseDTO> {
    const assignedTeachers = await this.subjectRepo.getAssignedTeachers(doc.name, doc.code);

    const applicableClasses: ApplicableClassDTO[] = (doc.applicableClasses || []).map((ac) => ({
      classId: ac.classId ? ac.classId.toString() : '',
      className: ac.className,
    }));

    return {
      id: doc._id.toString(),
      name: doc.name,
      code: doc.code,
      category: doc.category,
      categoryLabel: this.getCategoryLabel(doc.category),
      description: doc.description || '',
      applicableClasses,
      academicYear: doc.academicYear || '2026-2027',
      status: doc.status,
      assignedTeachers,
      assignedTeachersCount: assignedTeachers.length,
      associatedClassesCount: applicableClasses.length,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  async getSummaryStats(academicYear?: string): Promise<SubjectSummaryStatsDTO> {
    return await this.subjectRepo.getSummaryStats(academicYear);
  }

  async getSubjects(filter: SubjectFilterOptions): Promise<SubjectListResponseDTO> {
    const { subjects, total } = await this.subjectRepo.findAll(filter);

    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const limit = filter.limit && filter.limit > 0 ? filter.limit : 50;
    const totalPages = Math.ceil(total / limit) || 1;

    const mappedSubjects = await Promise.all(
      subjects.map((doc) => this.mapSubjectDocToResponse(doc))
    );

    return {
      subjects: mappedSubjects,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getSubjectById(id: string): Promise<SubjectResponseDTO> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid subject ID format.');
    }

    const doc = await this.subjectRepo.findById(id);
    if (!doc) {
      throw new NotFoundError(`Subject with ID "${id}" was not found.`);
    }

    return await this.mapSubjectDocToResponse(doc);
  }

  async createSubject(dto: CreateSubjectDTO): Promise<SubjectResponseDTO> {
    if (!dto.name || !dto.name.trim()) {
      throw new ValidationError('Subject name is required.');
    }
    if (!dto.code || !dto.code.trim()) {
      throw new ValidationError('Subject code is required.');
    }

    const cleanName = dto.name.trim();
    const cleanCode = dto.code.trim().toUpperCase();

    // Check duplicate code
    const existingWithCode = await this.subjectRepo.findByCode(cleanCode);
    if (existingWithCode) {
      throw new ConflictError(
        `A subject with code "${cleanCode}" already exists ("${existingWithCode.name}"). Subject codes must be unique.`,
        'DUPLICATE_SUBJECT_CODE'
      );
    }

    // Check duplicate name
    const existingWithName = await this.subjectRepo.findByName(cleanName);
    if (existingWithName) {
      throw new ConflictError(
        `A subject with name "${cleanName}" already exists (Code: ${existingWithName.code}).`,
        'DUPLICATE_SUBJECT_NAME'
      );
    }

    // Validate category
    let category: SubjectCategory = 'CORE';
    if (dto.category) {
      const upperCat = dto.category.trim().toUpperCase() as SubjectCategory;
      if (!VALID_SUBJECT_CATEGORIES.includes(upperCat)) {
        throw new ValidationError(`Invalid subject category "${dto.category}".`);
      }
      category = upperCat;
    }

    // Process applicable classes
    const applicableClassesItems: any[] = [];
    if (Array.isArray(dto.applicableClasses)) {
      for (const item of dto.applicableClasses) {
        if (item.className && item.className.trim()) {
          const cName = item.className.trim();
          let cId = item.classId;
          if (!cId || !mongoose.Types.ObjectId.isValid(cId)) {
            // Find class from repo if available
            if (this.classRepo) {
              const found = await this.classRepo.findClassByName(cName);
              if (found) {
                cId = found._id.toString();
              }
            }
          }
          applicableClassesItems.push({
            classId: mongoose.Types.ObjectId.isValid(cId) ? new mongoose.Types.ObjectId(cId) : new mongoose.Types.ObjectId(),
            className: cName,
          });
        }
      }
    }

    const created = await this.subjectRepo.create({
      name: cleanName,
      code: cleanCode,
      category,
      description: dto.description ? dto.description.trim() : '',
      applicableClasses: applicableClassesItems,
      academicYear: dto.academicYear ? dto.academicYear.trim() : '2026-2027',
      status: dto.status || 'ACTIVE',
    });

    return await this.mapSubjectDocToResponse(created);
  }

  async updateSubject(id: string, dto: UpdateSubjectDTO): Promise<SubjectResponseDTO> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid subject ID format.');
    }

    const existing = await this.subjectRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Subject with ID "${id}" was not found.`);
    }

    const updateData: Partial<ISubjectDoc> = {};

    if (dto.name !== undefined) {
      if (!dto.name.trim()) {
        throw new ValidationError('Subject name cannot be empty.');
      }
      const cleanName = dto.name.trim();
      if (cleanName.toLowerCase() !== existing.name.toLowerCase()) {
        const duplicate = await this.subjectRepo.findByName(cleanName);
        if (duplicate && duplicate._id.toString() !== id) {
          throw new ConflictError(
            `Another subject with name "${cleanName}" already exists.`,
            'DUPLICATE_SUBJECT_NAME'
          );
        }
      }
      updateData.name = cleanName;
    }

    if (dto.code !== undefined) {
      if (!dto.code.trim()) {
        throw new ValidationError('Subject code cannot be empty.');
      }
      const cleanCode = dto.code.trim().toUpperCase();
      if (cleanCode !== existing.code) {
        const duplicate = await this.subjectRepo.findByCode(cleanCode);
        if (duplicate && duplicate._id.toString() !== id) {
          throw new ConflictError(
            `Another subject with code "${cleanCode}" already exists ("${duplicate.name}").`,
            'DUPLICATE_SUBJECT_CODE'
          );
        }
      }
      updateData.code = cleanCode;
    }

    if (dto.category !== undefined) {
      const upperCat = dto.category.trim().toUpperCase() as SubjectCategory;
      if (!VALID_SUBJECT_CATEGORIES.includes(upperCat)) {
        throw new ValidationError(`Invalid subject category "${dto.category}".`);
      }
      updateData.category = upperCat;
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description.trim();
    }

    if (dto.academicYear !== undefined) {
      updateData.academicYear = dto.academicYear.trim();
    }

    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }

    if (Array.isArray(dto.applicableClasses)) {
      const applicableClassesItems: any[] = [];
      for (const item of dto.applicableClasses) {
        if (item.className && item.className.trim()) {
          const cName = item.className.trim();
          let cId = item.classId;
          if (!cId || !mongoose.Types.ObjectId.isValid(cId)) {
            if (this.classRepo) {
              const found = await this.classRepo.findClassByName(cName);
              if (found) {
                cId = found._id.toString();
              }
            }
          }
          applicableClassesItems.push({
            classId: mongoose.Types.ObjectId.isValid(cId) ? new mongoose.Types.ObjectId(cId) : new mongoose.Types.ObjectId(),
            className: cName,
          });
        }
      }
      updateData.applicableClasses = applicableClassesItems;
    }

    const updated = await this.subjectRepo.update(id, updateData);
    if (!updated) {
      throw new NotFoundError(`Subject with ID "${id}" was not found.`);
    }

    return await this.mapSubjectDocToResponse(updated);
  }

  async changeSubjectStatus(id: string, status: SubjectStatus): Promise<SubjectResponseDTO> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid subject ID format.');
    }

    const existing = await this.subjectRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Subject with ID "${id}" was not found.`);
    }

    if (status !== 'ACTIVE' && status !== 'INACTIVE') {
      throw new ValidationError('Status must be either "ACTIVE" or "INACTIVE".');
    }

    const updated = await this.subjectRepo.updateStatus(id, status);
    if (!updated) {
      throw new NotFoundError(`Subject with ID "${id}" was not found.`);
    }

    return await this.mapSubjectDocToResponse(updated);
  }

  async getSubjectReferences(id: string): Promise<SubjectReferencesDTO> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid subject ID format.');
    }

    const subject = await this.subjectRepo.findById(id);
    if (!subject) {
      throw new NotFoundError(`Subject with ID "${id}" was not found.`);
    }

    const counts = await this.subjectRepo.getReferencesCount(subject.name, subject.code);
    const hasActiveReferences = counts.totalReferences > 0;

    const parts: string[] = [];
    if (counts.timetableCount > 0) parts.push(`${counts.timetableCount} timetable periods`);
    if (counts.examScheduleCount > 0) parts.push(`${counts.examScheduleCount} exam schedules`);
    if (counts.assignmentCount > 0) parts.push(`${counts.assignmentCount} class assignments`);
    if (counts.teacherAssignmentCount > 0) parts.push(`${counts.teacherAssignmentCount} teacher faculty assignments`);

    const referenceSummary = parts.length > 0 ? parts.join(', ') : 'No historical academic records';

    return {
      subjectId: id,
      subjectName: subject.name,
      subjectCode: subject.code,
      timetableCount: counts.timetableCount,
      examScheduleCount: counts.examScheduleCount,
      assignmentCount: counts.assignmentCount,
      teacherAssignmentCount: counts.teacherAssignmentCount,
      totalReferences: counts.totalReferences,
      hasActiveReferences,
      referenceSummary,
    };
  }

  async deleteSubject(id: string): Promise<{ success: boolean; message: string }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid subject ID format.');
    }

    const subject = await this.subjectRepo.findById(id);
    if (!subject) {
      throw new NotFoundError(`Subject with ID "${id}" was not found.`);
    }

    const refs = await this.subjectRepo.getReferencesCount(subject.name, subject.code);

    if (refs.totalReferences > 0) {
      throw new ConflictError(
        `Cannot delete subject "${subject.name}" (${subject.code}) because it is referenced by existing academic records (${refs.totalReferences} total: ${refs.timetableCount} timetable periods, ${refs.examScheduleCount} exam schedules, ${refs.assignmentCount} assignments, ${refs.teacherAssignmentCount} teacher assignments). Please deactivate the subject instead to preserve historical records.`,
        'SUBJECT_REFERENCED_IN_ACADEMICS'
      );
    }

    await this.subjectRepo.delete(id);
    return {
      success: true,
      message: `Subject "${subject.name}" (${subject.code}) has been permanently deleted.`,
    };
  }
}
