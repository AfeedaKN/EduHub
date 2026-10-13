import mongoose from 'mongoose';
import { ITimetableRepository } from '../repositories/TimetableRepository';
import { IClassRepository } from '../repositories/ClassRepository';
import { ITeacherRepository } from '../repositories/TeacherRepository';
import {
  CreatePeriodDTO,
  UpdatePeriodDTO,
  TimetableFilterDTO,
  TimetablePeriodResponseDTO,
  DayOfWeek,
  PeriodType,
} from '../dtos/timetable.dto';
import { ITimetablePeriodDoc } from '../models/TimetablePeriod.model';
import {
  ValidationError,
  ConflictError,
  NotFoundError,
} from '../../../shared/domain/errors/AppError';

export class TimetableService {
  constructor(
    private readonly timetableRepo: ITimetableRepository,
    private readonly classRepo: IClassRepository,
    private readonly teacherRepo: ITeacherRepository
  ) {}

  /**
   * Convert "HH:mm" to minutes from midnight
   */
  public timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Normalize "H:mm" to "HH:mm"
   */
  public normalizeTime(timeStr: string): string {
    const parts = timeStr.trim().split(':');
    const h = (parts[0] || '0').padStart(2, '0');
    const m = (parts[1] || '0').padStart(2, '0');
    return `${h}:${m}`;
  }

  /**
   * Convert 24h "HH:mm" to readable 12h format "9:00 AM"
   */
  public formatTime12Hour(timeStr: string): string {
    const parts = timeStr.trim().split(':');
    let h = parseInt(parts[0], 10);
    const m = (parts[1] || '00').padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${m} ${ampm}`;
  }

  /**
   * Validate time format and order
   */
  private validateTimes(startTime: string, endTime: string): { normStart: string; normEnd: string } {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime.trim())) {
      throw new ValidationError(`Invalid start time format "${startTime}". Expected HH:mm.`);
    }
    if (!timeRegex.test(endTime.trim())) {
      throw new ValidationError(`Invalid end time format "${endTime}". Expected HH:mm.`);
    }

    const normStart = this.normalizeTime(startTime);
    const normEnd = this.normalizeTime(endTime);

    const startMin = this.timeToMinutes(normStart);
    const endMin = this.timeToMinutes(normEnd);

    if (endMin <= startMin) {
      throw new ValidationError(
        `End time (${endTime}) must be strictly after start time (${startTime}).`
      );
    }

    return { normStart, normEnd };
  }

  /**
   * Map document to response DTO
   */
  private mapToResponseDTO(doc: ITimetablePeriodDoc): TimetablePeriodResponseDTO {
    const formattedTime = `${this.formatTime12Hour(doc.startTime)} - ${this.formatTime12Hour(
      doc.endTime
    )}`;
    return {
      id: doc._id ? doc._id.toString() : (doc as any).id || '',
      academicYear: doc.academicYear,
      classId: doc.classId ? doc.classId.toString() : '',
      className: doc.className,
      sectionId: doc.sectionId ? doc.sectionId.toString() : undefined,
      section: doc.section,
      dayOfWeek: doc.dayOfWeek,
      startTime: doc.startTime,
      endTime: doc.endTime,
      formattedTime,
      subject: doc.subject,
      teacherId: doc.teacherId ? doc.teacherId.toString() : undefined,
      teacherName: doc.teacherName || '',
      roomNumber: doc.roomNumber || '',
      periodType: doc.periodType,
      notes: doc.notes || '',
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : undefined,
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : undefined,
    };
  }

  /**
   * List timetable periods matching filter
   */
  async getPeriods(filter: TimetableFilterDTO): Promise<TimetablePeriodResponseDTO[]> {
    const docs = await this.timetableRepo.findByFilter(filter);
    return docs.map((d) => this.mapToResponseDTO(d));
  }

  /**
   * Get single period by ID
   */
  async getPeriodById(id: string): Promise<TimetablePeriodResponseDTO> {
    const doc = await this.timetableRepo.findById(id);
    if (!doc) {
      throw new NotFoundError(`Timetable period with ID "${id}" was not found.`);
    }
    return this.mapToResponseDTO(doc);
  }

  /**
   * Create a new timetable period with conflict prevention
   */
  async createPeriod(dto: CreatePeriodDTO): Promise<TimetablePeriodResponseDTO> {
    if (!dto.academicYear?.trim()) {
      throw new ValidationError('Academic year is required.');
    }
    if (!dto.classId?.trim()) {
      throw new ValidationError('Parent class ID is required.');
    }
    if (!dto.section?.trim()) {
      throw new ValidationError('Section is required.');
    }
    if (!dto.dayOfWeek?.trim()) {
      throw new ValidationError('Day of the week is required.');
    }
    if (!dto.subject?.trim()) {
      throw new ValidationError('Subject name is required.');
    }

    const validDays: DayOfWeek[] = [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
      'SUNDAY',
    ];
    const upperDay = dto.dayOfWeek.toUpperCase() as DayOfWeek;
    if (!validDays.includes(upperDay)) {
      throw new ValidationError(
        `Invalid day of week "${dto.dayOfWeek}". Must be one of: ${validDays.join(', ')}.`
      );
    }

    const { normStart, normEnd } = this.validateTimes(dto.startTime, dto.endTime);

    // 1. Verify Parent Class
    const parentClass = await this.classRepo.findClassById(dto.classId);
    if (!parentClass) {
      throw new NotFoundError(`Class with ID "${dto.classId}" does not exist.`);
    }

    const className = parentClass.name;
    const academicYear = dto.academicYear.trim();
    const sectionName = dto.section.trim().toUpperCase();

    // 2. Verify Section belongs to Class
    const classSections = await this.classRepo.findSectionsByClassId(dto.classId);
    const matchedSection = classSections.find(
      (s) => s.name.toUpperCase() === sectionName
    );
    if (!matchedSection) {
      throw new ValidationError(
        `Section "${sectionName}" does not exist under class "${className}".`
      );
    }

    const sectionId = matchedSection._id;
    // Default room number from section if not provided in period DTO
    const roomNumber = dto.roomNumber?.trim() || matchedSection.roomNumber || '';

    // 3. Verify Teacher (if teaching period or teacherId provided)
    let teacherName = '';
    let teacherObjectId: mongoose.Types.ObjectId | undefined = undefined;

    if (dto.teacherId && dto.teacherId.trim()) {
      const teacher = await this.teacherRepo.findTeacherById(dto.teacherId.trim());
      if (!teacher) {
        throw new NotFoundError(`Teacher with ID "${dto.teacherId}" was not found.`);
      }
      if (teacher.status === 'INACTIVE') {
        throw new ValidationError(
          `Cannot schedule period for inactive teacher "${teacher.fullName}".`
        );
      }
      teacherName = teacher.fullName;
      teacherObjectId = teacher._id as mongoose.Types.ObjectId;
    } else if (dto.teacherName) {
      teacherName = dto.teacherName.trim();
    }

    const periodType: PeriodType = dto.periodType || 'TEACHING';

    // 4. Conflict Check 1: Section overlap
    const sectionConflicts = await this.timetableRepo.findSectionOverlaps(
      academicYear,
      className,
      sectionName,
      upperDay,
      normStart,
      normEnd
    );
    if (sectionConflicts.length > 0) {
      const existing = sectionConflicts[0];
      throw new ConflictError(
        `Section conflict: ${className}-${sectionName} already has "${existing.subject}" scheduled on ${upperDay} from ${existing.startTime} to ${existing.endTime}.`
      );
    }

    // 5. Conflict Check 2: Teacher overlap (if teacher is assigned)
    if (teacherObjectId) {
      const teacherConflicts = await this.timetableRepo.findTeacherOverlaps(
        academicYear,
        teacherObjectId.toString(),
        upperDay,
        normStart,
        normEnd
      );
      if (teacherConflicts.length > 0) {
        const existing = teacherConflicts[0];
        throw new ConflictError(
          `Teacher conflict: ${teacherName} is already assigned to ${existing.className}-${existing.section} ("${existing.subject}") on ${upperDay} from ${existing.startTime} to ${existing.endTime}.`
        );
      }
    }

    // 6. Conflict Check 3: Room overlap (if room is assigned)
    if (roomNumber) {
      const roomConflicts = await this.timetableRepo.findRoomOverlaps(
        academicYear,
        roomNumber,
        upperDay,
        normStart,
        normEnd
      );
      if (roomConflicts.length > 0) {
        const existing = roomConflicts[0];
        throw new ConflictError(
          `Classroom conflict: Room "${roomNumber}" is already booked by ${existing.className}-${existing.section} ("${existing.subject}") on ${upperDay} from ${existing.startTime} to ${existing.endTime}.`
        );
      }
    }

    // 7. Create and persist period
    const createdDoc = await this.timetableRepo.create({
      academicYear,
      classId: parentClass._id as mongoose.Types.ObjectId,
      className,
      sectionId: sectionId as mongoose.Types.ObjectId,
      section: sectionName,
      dayOfWeek: upperDay,
      startTime: normStart,
      endTime: normEnd,
      subject: dto.subject.trim(),
      teacherId: teacherObjectId,
      teacherName,
      roomNumber,
      periodType,
      notes: dto.notes?.trim() || '',
    });

    return this.mapToResponseDTO(createdDoc);
  }

  /**
   * Update an existing period with conflict prevention
   */
  async updatePeriod(
    id: string,
    dto: UpdatePeriodDTO
  ): Promise<TimetablePeriodResponseDTO> {
    const existingPeriod = await this.timetableRepo.findById(id);
    if (!existingPeriod) {
      throw new NotFoundError(`Timetable period with ID "${id}" was not found.`);
    }

    const academicYear = dto.academicYear?.trim() || existingPeriod.academicYear;
    let className = existingPeriod.className;
    let classId = existingPeriod.classId;
    let sectionName = (dto.section || existingPeriod.section).toUpperCase().trim();
    let sectionId = existingPeriod.sectionId;

    if (dto.classId && dto.classId !== existingPeriod.classId.toString()) {
      const parentClass = await this.classRepo.findClassById(dto.classId);
      if (!parentClass) {
        throw new NotFoundError(`Class with ID "${dto.classId}" does not exist.`);
      }
      className = parentClass.name;
      classId = parentClass._id as mongoose.Types.ObjectId;

      const sections = await this.classRepo.findSectionsByClassId(dto.classId);
      const matched = sections.find((s) => s.name.toUpperCase() === sectionName);
      if (!matched) {
        throw new ValidationError(
          `Section "${sectionName}" does not exist under class "${className}".`
        );
      }
      sectionId = matched._id as mongoose.Types.ObjectId;
    } else if (dto.section && dto.section.toUpperCase().trim() !== existingPeriod.section) {
      const sections = await this.classRepo.findSectionsByClassId(classId.toString());
      const matched = sections.find((s) => s.name.toUpperCase() === sectionName);
      if (!matched) {
        throw new ValidationError(
          `Section "${sectionName}" does not exist under class "${className}".`
        );
      }
      sectionId = matched._id as mongoose.Types.ObjectId;
    }

    const dayOfWeek = (dto.dayOfWeek || existingPeriod.dayOfWeek).toUpperCase() as DayOfWeek;
    const startTimeRaw = dto.startTime || existingPeriod.startTime;
    const endTimeRaw = dto.endTime || existingPeriod.endTime;
    const { normStart, normEnd } = this.validateTimes(startTimeRaw, endTimeRaw);

    // Teacher resolution
    let teacherObjectId = existingPeriod.teacherId;
    let teacherName = existingPeriod.teacherName || '';

    if (dto.teacherId !== undefined) {
      if (dto.teacherId && dto.teacherId.trim()) {
        const teacher = await this.teacherRepo.findTeacherById(dto.teacherId.trim());
        if (!teacher) {
          throw new NotFoundError(`Teacher with ID "${dto.teacherId}" was not found.`);
        }
        if (teacher.status === 'INACTIVE') {
          throw new ValidationError(
            `Cannot schedule period for inactive teacher "${teacher.fullName}".`
          );
        }
        teacherName = teacher.fullName;
        teacherObjectId = teacher._id as mongoose.Types.ObjectId;
      } else {
        teacherObjectId = undefined;
        teacherName = '';
      }
    } else if (dto.teacherName !== undefined) {
      teacherName = dto.teacherName.trim();
    }

    const roomNumber =
      dto.roomNumber !== undefined ? dto.roomNumber.trim() : existingPeriod.roomNumber || '';
    const subject = dto.subject?.trim() || existingPeriod.subject;
    const periodType = dto.periodType || existingPeriod.periodType;
    const notes = dto.notes !== undefined ? dto.notes.trim() : existingPeriod.notes || '';

    // Conflict Check 1: Section overlap (exclude current period)
    const sectionConflicts = await this.timetableRepo.findSectionOverlaps(
      academicYear,
      className,
      sectionName,
      dayOfWeek,
      normStart,
      normEnd,
      id
    );
    if (sectionConflicts.length > 0) {
      const existing = sectionConflicts[0];
      throw new ConflictError(
        `Section conflict: ${className}-${sectionName} already has "${existing.subject}" scheduled on ${dayOfWeek} from ${existing.startTime} to ${existing.endTime}.`
      );
    }

    // Conflict Check 2: Teacher overlap (exclude current period)
    if (teacherObjectId) {
      const teacherConflicts = await this.timetableRepo.findTeacherOverlaps(
        academicYear,
        teacherObjectId.toString(),
        dayOfWeek,
        normStart,
        normEnd,
        id
      );
      if (teacherConflicts.length > 0) {
        const existing = teacherConflicts[0];
        throw new ConflictError(
          `Teacher conflict: ${teacherName} is already assigned to ${existing.className}-${existing.section} ("${existing.subject}") on ${dayOfWeek} from ${existing.startTime} to ${existing.endTime}.`
        );
      }
    }

    // Conflict Check 3: Room overlap (exclude current period)
    if (roomNumber) {
      const roomConflicts = await this.timetableRepo.findRoomOverlaps(
        academicYear,
        roomNumber,
        dayOfWeek,
        normStart,
        normEnd,
        id
      );
      if (roomConflicts.length > 0) {
        const existing = roomConflicts[0];
        throw new ConflictError(
          `Classroom conflict: Room "${roomNumber}" is already booked by ${existing.className}-${existing.section} ("${existing.subject}") on ${dayOfWeek} from ${existing.startTime} to ${existing.endTime}.`
        );
      }
    }

    const updated = await this.timetableRepo.update(id, {
      academicYear,
      classId,
      className,
      sectionId,
      section: sectionName,
      dayOfWeek,
      startTime: normStart,
      endTime: normEnd,
      subject,
      teacherId: teacherObjectId,
      teacherName,
      roomNumber,
      periodType,
      notes,
    });

    if (!updated) {
      throw new NotFoundError(`Failed to update timetable period "${id}".`);
    }

    return this.mapToResponseDTO(updated);
  }

  /**
   * Delete period by ID
   */
  async deletePeriod(id: string): Promise<void> {
    const existing = await this.timetableRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Timetable period with ID "${id}" was not found.`);
    }
    await this.timetableRepo.delete(id);
  }

  /**
   * Get weekly schedule for teacher
   */
  async getTeacherSchedule(
    teacherId: string,
    academicYear?: string
  ): Promise<TimetablePeriodResponseDTO[]> {
    const docs = await this.timetableRepo.findByTeacherId(teacherId, academicYear);
    return docs.map((d) => this.mapToResponseDTO(d));
  }
}
