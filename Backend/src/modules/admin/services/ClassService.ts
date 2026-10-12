import mongoose from 'mongoose';
import { IClassRepository } from '../repositories/ClassRepository';
import {
  CreateClassDTO,
  UpdateClassDTO,
  CreateSectionDTO,
  UpdateSectionDTO,
  ClassDetailDTO,
  SectionDetailDTO,
  ClassSummaryStatsDTO,
  ClassFilterOptions,
} from '../dtos/class.dto';
import { ClassStatus, IClassDoc } from '../models/Class.model';
import { SectionStatus, ISectionDoc } from '../models/Section.model';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../../shared/domain/errors/AppError';

export class ClassService {
  constructor(private readonly classRepo: IClassRepository) {}

  /**
   * Helper to format section document into SectionDetailDTO with live enrollment count
   */
  private async mapSectionToDTO(
    section: ISectionDoc,
    className: string,
    isClassActive = true
  ): Promise<SectionDetailDTO> {
    const enrolledCount = await this.classRepo.countEnrolledStudents(
      className,
      section.name,
      section.academicYear
    );
    // If section or parent class is INACTIVE, available seats for admission is 0
    const isSectionOpen = section.status === 'ACTIVE' && isClassActive;
    const availableSeats = isSectionOpen ? Math.max(0, section.capacity - enrolledCount) : 0;

    return {
      id: section._id ? section._id.toString() : (section as any).id,
      classId: (section.classId as mongoose.Types.ObjectId).toString(),
      className,
      name: section.name,
      academicYear: section.academicYear,
      capacity: section.capacity,
      enrolledCount,
      availableSeats,
      roomNumber: section.roomNumber || '',
      status: section.status,
      createdAt: section.createdAt ? section.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: section.updatedAt ? section.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Helper to format class document into ClassDetailDTO with sections and live aggregate stats
   */
  private async mapClassToDTO(
    classDoc: IClassDoc,
    sections?: ISectionDoc[]
  ): Promise<ClassDetailDTO> {
    const secDocs = sections ?? (await this.classRepo.findSectionsByClassId(classDoc._id.toString()));

    const sectionDTOs: SectionDetailDTO[] = [];
    let totalCapacity = 0;
    let totalEnrolled = 0;

    const isClassActive = classDoc.status === 'ACTIVE';

    for (const sec of secDocs) {
      const dto = await this.mapSectionToDTO(sec, classDoc.name, isClassActive);
      sectionDTOs.push(dto);
      if (sec.status === 'ACTIVE' && isClassActive) {
        totalCapacity += sec.capacity;
      }
      totalEnrolled += dto.enrolledCount;
    }

    // Inactive classes cannot offer available seats for admission
    const availableSeats = isClassActive ? Math.max(0, totalCapacity - totalEnrolled) : 0;

    return {
      id: classDoc._id ? classDoc._id.toString() : (classDoc as any).id,
      name: classDoc.name,
      academicYear: classDoc.academicYear,
      description: classDoc.description || '',
      status: classDoc.status,
      sectionsCount: sectionDTOs.length,
      totalEnrolled,
      totalCapacity,
      availableSeats,
      sections: sectionDTOs,
      createdAt: classDoc.createdAt ? classDoc.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: classDoc.updatedAt ? classDoc.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Get overall summary counts for classes and sections reflecting actual database records
   */
  async getSummaryStats(academicYear?: string): Promise<ClassSummaryStatsDTO> {
    const filter = academicYear && academicYear !== 'ALL' ? { academicYear } : undefined;
    const classes = await this.classRepo.findAllClasses(filter);
    const totalClasses = classes.length;

    let totalSections = 0;
    let totalEnrolledStudents = 0;
    let totalAvailableSeats = 0;

    for (const c of classes) {
      const sections = await this.classRepo.findSectionsByClassId(c._id.toString());
      totalSections += sections.length;

      const isClassActive = c.status === 'ACTIVE';

      for (const sec of sections) {
        const enrolled = await this.classRepo.countEnrolledStudents(
          c.name,
          sec.name,
          sec.academicYear
        );
        totalEnrolledStudents += enrolled;

        if (isClassActive && sec.status === 'ACTIVE') {
          totalAvailableSeats += Math.max(0, sec.capacity - enrolled);
        }
      }
    }

    return {
      totalClasses,
      totalSections,
      totalEnrolledStudents,
      totalAvailableSeats,
    };
  }

  /**
   * List all classes with their section and enrollment summaries
   */
  async getClasses(filters?: ClassFilterOptions): Promise<ClassDetailDTO[]> {
    const classes = await this.classRepo.findAllClasses(filters);
    const result: ClassDetailDTO[] = [];

    for (const c of classes) {
      const dto = await this.mapClassToDTO(c);
      result.push(dto);
    }

    return result;
  }

  /**
   * Get single class by ID with sections details
   */
  async getClassById(id: string): Promise<ClassDetailDTO> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid class ID format.');
    }

    const classDoc = await this.classRepo.findClassById(id);
    if (!classDoc) {
      throw new NotFoundError(`Class with ID ${id} was not found.`, 'NOT_FOUND');
    }

    return await this.mapClassToDTO(classDoc);
  }

  /**
   * Create a new class (grade/standard)
   */
  async createClass(dto: CreateClassDTO): Promise<ClassDetailDTO> {
    const name = dto.name?.trim();
    const academicYear = dto.academicYear?.trim() || '2026-2027';

    if (!name) {
      throw new ValidationError('Class name or grade is required.');
    }

    if (!academicYear) {
      throw new ValidationError('Academic year is required.');
    }

    // Check for duplicate class record in same academic year
    const existing = await this.classRepo.findClassByNameAndYear(name, academicYear);
    if (existing) {
      throw new ConflictError(
        `Class "${name}" already exists for academic year "${academicYear}".`,
        'DUPLICATE_CLASS'
      );
    }

    const created = await this.classRepo.createClass({
      name,
      academicYear,
      description: dto.description?.trim() || '',
      status: 'ACTIVE',
    });

    return await this.mapClassToDTO(created, []);
  }

  /**
   * Update an existing class
   */
  async updateClass(id: string, dto: UpdateClassDTO): Promise<ClassDetailDTO> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid class ID format.');
    }

    const existingClass = await this.classRepo.findClassById(id);
    if (!existingClass) {
      throw new NotFoundError(`Class with ID ${id} was not found.`, 'NOT_FOUND');
    }

    const newName = dto.name !== undefined ? dto.name.trim() : existingClass.name;
    const newYear = dto.academicYear !== undefined ? dto.academicYear.trim() : existingClass.academicYear;

    if (!newName) {
      throw new ValidationError('Class name cannot be empty.');
    }

    if (!newYear) {
      throw new ValidationError('Academic year cannot be empty.');
    }

    // If name or academic year changed, check for conflict with other records
    if (newName.toLowerCase() !== existingClass.name.toLowerCase() || newYear !== existingClass.academicYear) {
      const duplicate = await this.classRepo.findClassByNameAndYear(newName, newYear);
      if (duplicate && duplicate._id.toString() !== id) {
        throw new ConflictError(
          `Another class with name "${newName}" already exists for academic year "${newYear}".`,
          'DUPLICATE_CLASS'
        );
      }
    }

    const updateData: Partial<IClassDoc> = {
      name: newName,
      academicYear: newYear,
      description: dto.description !== undefined ? dto.description.trim() : existingClass.description,
    };

    if (dto.status && ['ACTIVE', 'INACTIVE'].includes(dto.status)) {
      updateData.status = dto.status;
      // Cascade status update to all sections belonging to this class
      await this.classRepo.updateSectionsByClassId(id, { status: dto.status });
    }

    const updated = await this.classRepo.updateClass(id, updateData);
    if (!updated) {
      throw new NotFoundError(`Class with ID ${id} was not found.`, 'NOT_FOUND');
    }

    return await this.mapClassToDTO(updated);
  }

  /**
   * Activate or deactivate a class
   */
  async changeClassStatus(id: string, status: ClassStatus): Promise<ClassDetailDTO> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid class ID format.');
    }

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      throw new ValidationError('Status must be either ACTIVE or INACTIVE.');
    }

    const existingClass = await this.classRepo.findClassById(id);
    if (!existingClass) {
      throw new NotFoundError(`Class with ID ${id} was not found.`, 'NOT_FOUND');
    }

    const updated = await this.classRepo.updateClass(id, { status });
    if (!updated) {
      throw new NotFoundError(`Class with ID ${id} was not found.`, 'NOT_FOUND');
    }

    // Cascade status update to child sections
    await this.classRepo.updateSectionsByClassId(id, { status });

    return await this.mapClassToDTO(updated);
  }

  /**
   * Delete class - only permitted if not referenced by student or admission records
   */
  async deleteClass(id: string): Promise<{ success: boolean; message: string }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid class ID format.');
    }

    const existingClass = await this.classRepo.findClassById(id);
    if (!existingClass) {
      throw new NotFoundError(`Class with ID ${id} was not found.`, 'NOT_FOUND');
    }

    // Check if official student records exist for this class grade
    const hasStudents = await this.classRepo.isClassReferencedByStudents(existingClass.name);
    if (hasStudents) {
      throw new ConflictError(
        `Cannot delete class "${existingClass.name}". Active student records are currently enrolled. Please deactivate the class instead.`,
        'RECORD_IN_USE'
      );
    }

    // Check if admission registration requests exist for this class grade
    const hasAdmissions = await this.classRepo.isClassReferencedByAdmissions(existingClass.name);
    if (hasAdmissions) {
      throw new ConflictError(
        `Cannot delete class "${existingClass.name}". Student admission requests reference this grade. Please deactivate the class instead.`,
        'RECORD_IN_USE'
      );
    }

    // Delete associated sections first
    const sections = await this.classRepo.findSectionsByClassId(id);
    for (const sec of sections) {
      await this.classRepo.deleteSection(sec._id.toString());
    }

    await this.classRepo.deleteClass(id);

    return {
      success: true,
      message: `Class "${existingClass.name}" and its sections were successfully removed.`,
    };
  }

  /**
   * List all sections for a class
   */
  async getSectionsForClass(classId: string): Promise<SectionDetailDTO[]> {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new ValidationError('Invalid class ID format.');
    }

    const parentClass = await this.classRepo.findClassById(classId);
    if (!parentClass) {
      throw new NotFoundError(`Class with ID ${classId} was not found.`, 'NOT_FOUND');
    }

    const sections = await this.classRepo.findSectionsByClassId(classId);
    const result: SectionDetailDTO[] = [];
    const isClassActive = parentClass.status === 'ACTIVE';

    for (const sec of sections) {
      result.push(await this.mapSectionToDTO(sec, parentClass.name, isClassActive));
    }

    return result;
  }

  /**
   * Create a new section within a class
   */
  async createSection(classId: string, dto: CreateSectionDTO): Promise<SectionDetailDTO> {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new ValidationError('Invalid class ID format.');
    }

    const parentClass = await this.classRepo.findClassById(classId);
    if (!parentClass) {
      throw new NotFoundError(`Parent class with ID ${classId} was not found.`, 'NOT_FOUND');
    }

    // Business rule: Cannot add active sections to an inactive class
    if (parentClass.status === 'INACTIVE') {
      throw new ConflictError(
        `Cannot add a section to inactive class "${parentClass.name}". Please activate the class first.`,
        'CLASS_INACTIVE'
      );
    }

    const name = dto.name?.trim().toUpperCase();
    if (!name) {
      throw new ValidationError('Section name (e.g., A, B) is required.');
    }

    const capacity = Number(dto.capacity);
    if (isNaN(capacity) || !Number.isInteger(capacity) || capacity < 1) {
      throw new ValidationError('Section capacity must be a positive integer greater than zero.');
    }

    // Check for duplicate section name in the same class
    const duplicate = await this.classRepo.findSectionByClassAndName(classId, name);
    if (duplicate) {
      throw new ConflictError(
        `Section "${name}" already exists in class "${parentClass.name}".`,
        'DUPLICATE_SECTION'
      );
    }

    const created = await this.classRepo.createSection({
      classId: parentClass._id as mongoose.Types.ObjectId,
      name,
      academicYear: parentClass.academicYear,
      capacity,
      roomNumber: dto.roomNumber?.trim() || '',
      status: 'ACTIVE',
    });

    return await this.mapSectionToDTO(created, parentClass.name, true);
  }

  /**
   * Update an existing section
   */
  async updateSection(
    classId: string,
    sectionId: string,
    dto: UpdateSectionDTO
  ): Promise<SectionDetailDTO> {
    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(sectionId)) {
      throw new ValidationError('Invalid class ID or section ID format.');
    }

    const parentClass = await this.classRepo.findClassById(classId);
    if (!parentClass) {
      throw new NotFoundError(`Parent class with ID ${classId} was not found.`, 'NOT_FOUND');
    }

    const existingSection = await this.classRepo.findSectionById(sectionId);
    if (!existingSection || existingSection.classId._id.toString() !== classId) {
      throw new NotFoundError(`Section with ID ${sectionId} was not found in this class.`, 'NOT_FOUND');
    }

    // Business rule: Cannot set section status to ACTIVE if parent class is INACTIVE
    if (dto.status === 'ACTIVE' && parentClass.status === 'INACTIVE') {
      throw new ConflictError(
        `Cannot set section status to ACTIVE while parent class "${parentClass.name}" is INACTIVE. Please activate the class first.`,
        'CLASS_INACTIVE'
      );
    }

    const newName = dto.name !== undefined ? dto.name.trim().toUpperCase() : existingSection.name;
    if (!newName) {
      throw new ValidationError('Section name cannot be empty.');
    }

    // Check duplicate if name changed
    if (newName !== existingSection.name) {
      const duplicate = await this.classRepo.findSectionByClassAndName(classId, newName);
      if (duplicate && duplicate._id.toString() !== sectionId) {
        throw new ConflictError(
          `Section "${newName}" already exists in class "${parentClass.name}".`,
          'DUPLICATE_SECTION'
        );
      }
    }

    const updateData: Partial<ISectionDoc> = {
      name: newName,
      roomNumber: dto.roomNumber !== undefined ? dto.roomNumber.trim() : existingSection.roomNumber,
    };

    if (dto.capacity !== undefined) {
      const newCapacity = Number(dto.capacity);
      if (isNaN(newCapacity) || !Number.isInteger(newCapacity) || newCapacity < 1) {
        throw new ValidationError('Section capacity must be a positive integer greater than zero.');
      }

      // Business Rule: Do not allow capacity to be reduced below the current enrollment count
      const currentEnrolled = await this.classRepo.countEnrolledStudents(
        parentClass.name,
        existingSection.name,
        existingSection.academicYear
      );

      if (newCapacity < currentEnrolled) {
        throw new ConflictError(
          `Cannot reduce section capacity to ${newCapacity}. There are currently ${currentEnrolled} students enrolled in this section.`,
          'CAPACITY_BELOW_ENROLLMENT'
        );
      }

      updateData.capacity = newCapacity;
    }

    if (dto.status && ['ACTIVE', 'INACTIVE'].includes(dto.status)) {
      updateData.status = dto.status;
    }

    const updated = await this.classRepo.updateSection(sectionId, updateData);
    if (!updated) {
      throw new NotFoundError(`Section with ID ${sectionId} was not found.`, 'NOT_FOUND');
    }

    const isClassActive = parentClass.status === 'ACTIVE';
    return await this.mapSectionToDTO(updated, parentClass.name, isClassActive);
  }

  /**
   * Activate or deactivate a section
   */
  async changeSectionStatus(
    classId: string,
    sectionId: string,
    status: SectionStatus
  ): Promise<SectionDetailDTO> {
    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(sectionId)) {
      throw new ValidationError('Invalid class ID or section ID format.');
    }

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      throw new ValidationError('Status must be either ACTIVE or INACTIVE.');
    }

    const parentClass = await this.classRepo.findClassById(classId);
    if (!parentClass) {
      throw new NotFoundError(`Parent class with ID ${classId} was not found.`, 'NOT_FOUND');
    }

    // Business rule: Cannot activate a section in an inactive class
    if (status === 'ACTIVE' && parentClass.status === 'INACTIVE') {
      throw new ConflictError(
        `Cannot activate section in inactive class "${parentClass.name}". Please activate the class first.`,
        'CLASS_INACTIVE'
      );
    }

    const existingSection = await this.classRepo.findSectionById(sectionId);
    if (!existingSection || existingSection.classId._id.toString() !== classId) {
      throw new NotFoundError(`Section with ID ${sectionId} was not found in this class.`, 'NOT_FOUND');
    }

    const updated = await this.classRepo.updateSection(sectionId, { status });
    if (!updated) {
      throw new NotFoundError(`Section with ID ${sectionId} was not found.`, 'NOT_FOUND');
    }

    const isClassActive = parentClass.status === 'ACTIVE';
    return await this.mapSectionToDTO(updated, parentClass.name, isClassActive);
  }

  /**
   * Delete a section (blocked if enrolled students exist)
   */
  async deleteSection(
    classId: string,
    sectionId: string
  ): Promise<{ success: boolean; message: string }> {
    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(sectionId)) {
      throw new ValidationError('Invalid class ID or section ID format.');
    }

    const parentClass = await this.classRepo.findClassById(classId);
    if (!parentClass) {
      throw new NotFoundError(`Parent class with ID ${classId} was not found.`, 'NOT_FOUND');
    }

    const existingSection = await this.classRepo.findSectionById(sectionId);
    if (!existingSection || existingSection.classId._id.toString() !== classId) {
      throw new NotFoundError(`Section with ID ${sectionId} was not found in this class.`, 'NOT_FOUND');
    }

    // Check if enrolled students exist in this section
    const hasStudents = await this.classRepo.isSectionReferencedByStudents(
      parentClass.name,
      existingSection.name
    );

    if (hasStudents) {
      throw new ConflictError(
        `Cannot delete Section "${existingSection.name}". Official student records are enrolled in this section. Please deactivate it instead.`,
        'RECORD_IN_USE'
      );
    }

    await this.classRepo.deleteSection(sectionId);

    return {
      success: true,
      message: `Section "${existingSection.name}" was successfully removed.`,
    };
  }
}
