import mongoose from 'mongoose';
import { IExamRepository } from '../repositories/ExamRepository';
import { IClassRepository } from '../repositories/ClassRepository';
import { ITeacherRepository } from '../repositories/TeacherRepository';
import {
  CreateExamDTO,
  UpdateExamDTO,
  ExamFilterDTO,
  ExamResponseDTO,
  ExamsSummaryDTO,
  CreateScheduleDTO,
  UpdateScheduleDTO,
  ExamScheduleResponseDTO,
  ExamType,
  ExamStatus,
} from '../dtos/exam.dto';
import { IExamDoc } from '../models/Exam.model';
import { IExamScheduleDoc } from '../models/ExamSchedule.model';
import {
  ValidationError,
  ConflictError,
  NotFoundError,
} from '../../../shared/domain/errors/AppError';

export class ExamService {
  constructor(
    private readonly examRepo: IExamRepository,
    private readonly classRepo: IClassRepository,
    private readonly teacherRepo: ITeacherRepository
  ) {}

  public timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  public normalizeTime(timeStr: string): string {
    const parts = timeStr.trim().split(':');
    const h = (parts[0] || '0').padStart(2, '0');
    const m = (parts[1] || '0').padStart(2, '0');
    return `${h}:${m}`;
  }

  public formatTime12Hour(timeStr: string): string {
    const parts = timeStr.trim().split(':');
    let h = parseInt(parts[0], 10);
    const m = (parts[1] || '00').padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${m} ${ampm}`;
  }

  private validateTimes(
    startTime: string,
    endTime: string
  ): { normStart: string; normEnd: string } {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!startTime || !timeRegex.test(startTime.trim())) {
      throw new ValidationError(`Invalid start time format "${startTime}". Expected HH:mm.`);
    }
    if (!endTime || !timeRegex.test(endTime.trim())) {
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

  private validateMarks(maxMarks: number, passingMarks: number): void {
    if (typeof maxMarks !== 'number' || isNaN(maxMarks) || maxMarks <= 0) {
      throw new ValidationError('Maximum marks must be a positive number greater than 0.');
    }
    if (typeof passingMarks !== 'number' || isNaN(passingMarks) || passingMarks < 0) {
      throw new ValidationError('Passing marks must be a non-negative number (0 or greater).');
    }
    if (passingMarks > maxMarks) {
      throw new ValidationError(
        `Passing marks (${passingMarks}) cannot exceed maximum marks (${maxMarks}).`
      );
    }
  }

  private formatDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private validateExamDates(
    startDateStr: string,
    endDateStr: string
  ): { start: Date; end: Date } {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (isNaN(start.getTime())) {
      throw new ValidationError(`Invalid start date format: "${startDateStr}".`, 'INVALID_DATE_FORMAT');
    }
    if (isNaN(end.getTime())) {
      throw new ValidationError(`Invalid end date format: "${endDateStr}".`, 'INVALID_DATE_FORMAT');
    }

    // Zero-out hours for pure date comparison
    const startZero = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    const endZero = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

    if (endZero < startZero) {
      throw new ValidationError('Exam end date cannot be earlier than start date.', 'INVALID_DATE_RANGE');
    }

    return { start, end };
  }

  private mapExamToResponseDTO(doc: IExamDoc, scheduledCount: number = 0): ExamResponseDTO {
    return {
      id: doc._id ? doc._id.toString() : (doc as any).id || '',
      name: doc.name,
      examType: doc.examType,
      academicYear: doc.academicYear,
      applicableClasses: (doc.applicableClasses || []).map((ac) => ({
        classId: ac.classId.toString(),
        className: ac.className,
      })),
      startDate: this.formatDateString(doc.startDate),
      endDate: this.formatDateString(doc.endDate),
      description: doc.description || '',
      status: doc.status,
      scheduledSubjectsCount: scheduledCount,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : undefined,
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : undefined,
    };
  }

  private mapScheduleToResponseDTO(doc: IExamScheduleDoc): ExamScheduleResponseDTO {
    const formattedTime = `${this.formatTime12Hour(doc.startTime)} - ${this.formatTime12Hour(
      doc.endTime
    )}`;
    return {
      id: doc._id ? doc._id.toString() : (doc as any).id || '',
      examId: doc.examId.toString(),
      academicYear: doc.academicYear,
      classId: doc.classId.toString(),
      className: doc.className,
      sectionId: doc.sectionId ? doc.sectionId.toString() : undefined,
      section: doc.section,
      subject: doc.subject,
      examDate: this.formatDateString(doc.examDate),
      startTime: doc.startTime,
      endTime: doc.endTime,
      formattedTime,
      maxMarks: doc.maxMarks,
      passingMarks: doc.passingMarks,
      roomNumber: doc.roomNumber || '',
      notes: doc.notes || '',
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : undefined,
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : undefined,
    };
  }



  async getExamsSummary(academicYear?: string): Promise<ExamsSummaryDTO> {
    return this.examRepo.getExamsSummary(academicYear);
  }

  async getExams(filter: ExamFilterDTO): Promise<ExamResponseDTO[]> {
    const exams = await this.examRepo.findExams(filter);
    const examIds = exams.map((e) => e._id.toString());
    const countsMap = await this.examRepo.countSchedulesForExams(examIds);

    return exams.map((exam) => {
      const count = countsMap.get(exam._id.toString()) || 0;
      return this.mapExamToResponseDTO(exam, count);
    });
  }

  async getExamById(id: string): Promise<ExamResponseDTO> {
    const exam = await this.examRepo.findExamById(id);
    if (!exam) {
      throw new NotFoundError(`Examination with ID "${id}" was not found.`);
    }
    const count = await this.examRepo.countSchedulesForExam(id);
    return this.mapExamToResponseDTO(exam, count);
  }

  async createExam(dto: CreateExamDTO): Promise<ExamResponseDTO> {
    if (!dto.name || !dto.name.trim()) {
      throw new ValidationError('Exam name is required.');
    }
    if (!dto.academicYear || !dto.academicYear.trim()) {
      throw new ValidationError('Academic year is required.');
    }
    if (!dto.examType) {
      throw new ValidationError('Exam type is required.');
    }
    if (!dto.applicableClassIds || !Array.isArray(dto.applicableClassIds) || dto.applicableClassIds.length === 0) {
      throw new ValidationError('At least one applicable class must be selected.');
    }
    if (!dto.startDate || !dto.endDate) {
      throw new ValidationError('Both start date and end date are required.');
    }

    const validExamTypes: ExamType[] = [
      'UNIT_TEST',
      'FIRST_TERM',
      'MID_TERM',
      'SECOND_TERM',
      'ANNUAL_EXAM',
      'OTHER',
    ];
    if (!validExamTypes.includes(dto.examType)) {
      throw new ValidationError(
        `Invalid exam type "${dto.examType}". Must be one of: ${validExamTypes.join(', ')}.`
      );
    }

    const { start, end } = this.validateExamDates(dto.startDate, dto.endDate);

    // Check duplicate exam name within academic year
    const existing = await this.examRepo.findExamByNameAndYear(dto.name, dto.academicYear);
    if (existing) {
      throw new ConflictError(
        `An examination named "${dto.name.trim()}" already exists for academic year ${dto.academicYear}.`
      );
    }

    // Validate and resolve each applicable class
    const applicableClasses: { classId: mongoose.Types.ObjectId; className: string }[] = [];
    const uniqueClassIds = Array.from(new Set(dto.applicableClassIds));

    for (const classId of uniqueClassIds) {
      const cls = await this.classRepo.findClassById(classId);
      if (!cls) {
        throw new NotFoundError(`Class with ID "${classId}" was not found.`);
      }
      applicableClasses.push({
        classId: cls._id as mongoose.Types.ObjectId,
        className: cls.name,
      });
    }

    const created = await this.examRepo.createExam({
      name: dto.name.trim(),
      examType: dto.examType,
      academicYear: dto.academicYear.trim(),
      applicableClasses,
      startDate: start,
      endDate: end,
      description: dto.description?.trim() || '',
      status: dto.status || 'DRAFT',
    });

    return this.mapExamToResponseDTO(created, 0);
  }

  async updateExam(id: string, dto: UpdateExamDTO): Promise<ExamResponseDTO> {
    const existingExam = await this.examRepo.findExamById(id);
    if (!existingExam) {
      throw new NotFoundError(`Examination with ID "${id}" was not found.`);
    }

    const name = dto.name !== undefined ? dto.name.trim() : existingExam.name;
    const academicYear =
      dto.academicYear !== undefined ? dto.academicYear.trim() : existingExam.academicYear;

    if (!name) {
      throw new ValidationError('Exam name cannot be empty.');
    }

    // Check duplicate name if name or year changed
    if (name !== existingExam.name || academicYear !== existingExam.academicYear) {
      const dup = await this.examRepo.findExamByNameAndYear(name, academicYear, id);
      if (dup) {
        throw new ConflictError(
          `An examination named "${name}" already exists for academic year ${academicYear}.`
        );
      }
    }

    const startDateStr = dto.startDate !== undefined ? dto.startDate : this.formatDateString(existingExam.startDate);
    const endDateStr = dto.endDate !== undefined ? dto.endDate : this.formatDateString(existingExam.endDate);
    const { start, end } = this.validateExamDates(startDateStr, endDateStr);

    let applicableClasses = existingExam.applicableClasses;
    if (dto.applicableClassIds !== undefined) {
      if (!Array.isArray(dto.applicableClassIds) || dto.applicableClassIds.length === 0) {
        throw new ValidationError('At least one applicable class must be selected.');
      }
      const uniqueClassIds = Array.from(new Set(dto.applicableClassIds));
      const resolvedClasses: { classId: mongoose.Types.ObjectId; className: string }[] = [];
      for (const classId of uniqueClassIds) {
        const cls = await this.classRepo.findClassById(classId);
        if (!cls) {
          throw new NotFoundError(`Class with ID "${classId}" was not found.`);
        }
        resolvedClasses.push({
          classId: cls._id as mongoose.Types.ObjectId,
          className: cls.name,
        });
      }
      applicableClasses = resolvedClasses;
    }

    const updatePayload: Partial<IExamDoc> = {
      name,
      academicYear,
      startDate: start,
      endDate: end,
      applicableClasses,
    };

    if (dto.examType !== undefined) {
      updatePayload.examType = dto.examType;
    }
    if (dto.description !== undefined) {
      updatePayload.description = dto.description.trim();
    }
    if (dto.status !== undefined) {
      updatePayload.status = dto.status;
    }

    const updated = await this.examRepo.updateExam(id, updatePayload);
    if (!updated) {
      throw new NotFoundError(`Examination with ID "${id}" was not found.`);
    }

    const count = await this.examRepo.countSchedulesForExam(id);
    return this.mapExamToResponseDTO(updated, count);
  }

  async deleteExam(id: string): Promise<void> {
    const existing = await this.examRepo.findExamById(id);
    if (!existing) {
      throw new NotFoundError(`Examination with ID "${id}" was not found.`);
    }

    // Delete schedules associated with this exam
    await this.examRepo.deleteSchedulesByExamId(id);
    await this.examRepo.deleteExam(id);
  }



  async getValidSubjects(
    classId: string,
    section: string,
    academicYear?: string
  ): Promise<string[]> {
    if (!classId || !classId.trim()) {
      throw new ValidationError('Class ID is required to fetch subjects.');
    }
    if (!section || !section.trim()) {
      throw new ValidationError('Section name is required to fetch subjects.');
    }

    const cls = await this.classRepo.findClassById(classId);
    if (!cls) {
      throw new NotFoundError(`Class with ID "${classId}" was not found.`);
    }

    return this.examRepo.findDistinctSubjectsForClassSection(
      classId,
      cls.name,
      section,
      academicYear
    );
  }

  async getSchedulesByExamId(examId: string): Promise<ExamScheduleResponseDTO[]> {
    const exam = await this.examRepo.findExamById(examId);
    if (!exam) {
      throw new NotFoundError(`Examination with ID "${examId}" was not found.`);
    }
    const schedules = await this.examRepo.findSchedulesByExamId(examId);
    return schedules.map((s) => this.mapScheduleToResponseDTO(s));
  }

  async createSchedule(
    examId: string,
    dto: CreateScheduleDTO
  ): Promise<ExamScheduleResponseDTO> {
    const exam = await this.examRepo.findExamById(examId);
    if (!exam) {
      throw new NotFoundError(`Examination with ID "${examId}" was not found.`);
    }

    // 1. Basic Field Validation
    if (!dto.classId?.trim()) {
      throw new ValidationError('Class ID is required.');
    }
    if (!dto.section?.trim()) {
      throw new ValidationError('Section is required.');
    }
    if (!dto.subject?.trim()) {
      throw new ValidationError('Subject name is required.');
    }
    if (!dto.examDate) {
      throw new ValidationError('Exam date is required.');
    }
    if (!dto.startTime || !dto.endTime) {
      throw new ValidationError('Both start time and end time are required.');
    }

    this.validateMarks(dto.maxMarks, dto.passingMarks);
    const { normStart, normEnd } = this.validateTimes(dto.startTime, dto.endTime);

    // 2. Validate Class is Applicable to Exam
    const classIdStr = dto.classId.trim();
    const matchedApplicableClass = exam.applicableClasses.find(
      (ac) => ac.classId.toString() === classIdStr
    );
    if (!matchedApplicableClass) {
      throw new ValidationError(
        `Class is not marked as applicable for this examination (${exam.name}).`
      );
    }

    const className = matchedApplicableClass.className;
    const sectionName = dto.section.trim().toUpperCase();

    // 3. Validate Section belongs to Class
    const sections = await this.classRepo.findSectionsByClassId(classIdStr);
    const matchedSection = sections.find(
      (s) => s.name.toUpperCase() === sectionName
    );
    if (!matchedSection) {
      throw new ValidationError(
        `Section "${sectionName}" does not exist under class "${className}".`
      );
    }
    const sectionId = matchedSection._id as mongoose.Types.ObjectId;

    // 4. Validate Subject is Valid for Class & Section
    const validSubjects = await this.examRepo.findDistinctSubjectsForClassSection(
      classIdStr,
      className,
      sectionName,
      exam.academicYear
    );

    const cleanSubject = dto.subject.trim();
    if (validSubjects.length > 0) {
      const isMatch = validSubjects.some(
        (vs) => vs.toLowerCase() === cleanSubject.toLowerCase()
      );
      if (!isMatch) {
        throw new ValidationError(
          `"${cleanSubject}" is not a recognized subject for ${className} Section ${sectionName}. Valid subjects: ${validSubjects.join(', ')}.`
        );
      }
    }

    // 5. Validate Exam Date within Exam's Date Range
    const parsedExamDate = new Date(dto.examDate);
    if (isNaN(parsedExamDate.getTime())) {
      throw new ValidationError(`Invalid exam date: "${dto.examDate}".`);
    }

    const examDateZero = new Date(
      Date.UTC(parsedExamDate.getUTCFullYear(), parsedExamDate.getUTCMonth(), parsedExamDate.getUTCDate())
    );
    const examStartZero = new Date(
      Date.UTC(exam.startDate.getUTCFullYear(), exam.startDate.getUTCMonth(), exam.startDate.getUTCDate())
    );
    const examEndZero = new Date(
      Date.UTC(exam.endDate.getUTCFullYear(), exam.endDate.getUTCMonth(), exam.endDate.getUTCDate())
    );

    if (examDateZero < examStartZero || examDateZero > examEndZero) {
      throw new ValidationError(
        `Exam date (${this.formatDateString(parsedExamDate)}) must fall within the examination window (${this.formatDateString(exam.startDate)} to ${this.formatDateString(exam.endDate)}).`
      );
    }

    const roomNumber = dto.roomNumber?.trim() || matchedSection.roomNumber || '';

    // 6. Conflict Check 1: Class and Section Overlap
    const sectionConflicts = await this.examRepo.findSectionOverlaps(
      exam.academicYear,
      parsedExamDate,
      className,
      sectionName,
      normStart,
      normEnd
    );
    if (sectionConflicts.length > 0) {
      const existing = sectionConflicts[0];
      throw new ConflictError(
        `Schedule conflict: ${className} Section ${sectionName} already has "${existing.subject}" scheduled on ${this.formatDateString(parsedExamDate)} from ${existing.startTime} to ${existing.endTime}.`
      );
    }

    // 7. Conflict Check 2: Room Overlap (if room is specified)
    if (roomNumber) {
      const roomConflicts = await this.examRepo.findRoomOverlaps(
        exam.academicYear,
        parsedExamDate,
        roomNumber,
        normStart,
        normEnd
      );
      if (roomConflicts.length > 0) {
        const existing = roomConflicts[0];
        throw new ConflictError(
          `Room conflict: Room "${roomNumber}" is already booked for ${existing.className} Section ${existing.section} ("${existing.subject}") on ${this.formatDateString(parsedExamDate)} from ${existing.startTime} to ${existing.endTime}.`
        );
      }
    }

    // 8. Persist Schedule
    const created = await this.examRepo.createSchedule({
      examId: exam._id as mongoose.Types.ObjectId,
      academicYear: exam.academicYear,
      classId: matchedApplicableClass.classId,
      className,
      sectionId,
      section: sectionName,
      subject: cleanSubject,
      examDate: parsedExamDate,
      startTime: normStart,
      endTime: normEnd,
      maxMarks: dto.maxMarks,
      passingMarks: dto.passingMarks,
      roomNumber,
      notes: dto.notes?.trim() || '',
    });

    return this.mapScheduleToResponseDTO(created);
  }

  async updateSchedule(
    examId: string,
    scheduleId: string,
    dto: UpdateScheduleDTO
  ): Promise<ExamScheduleResponseDTO> {
    const exam = await this.examRepo.findExamById(examId);
    if (!exam) {
      throw new NotFoundError(`Examination with ID "${examId}" was not found.`);
    }

    const existingSchedule = await this.examRepo.findScheduleById(scheduleId);
    if (!existingSchedule || existingSchedule.examId.toString() !== examId) {
      throw new NotFoundError(
        `Subject schedule with ID "${scheduleId}" was not found under this examination.`
      );
    }

    // Validate Marks if provided
    const maxMarks = dto.maxMarks !== undefined ? dto.maxMarks : existingSchedule.maxMarks;
    const passingMarks =
      dto.passingMarks !== undefined ? dto.passingMarks : existingSchedule.passingMarks;
    this.validateMarks(maxMarks, passingMarks);

    // Validate Times if provided
    const startTimeStr = dto.startTime !== undefined ? dto.startTime : existingSchedule.startTime;
    const endTimeStr = dto.endTime !== undefined ? dto.endTime : existingSchedule.endTime;
    const { normStart, normEnd } = this.validateTimes(startTimeStr, endTimeStr);

    // Validate Class & Section
    let classIdStr = existingSchedule.classId.toString();
    let className = existingSchedule.className;
    let sectionName = existingSchedule.section;
    let sectionId = existingSchedule.sectionId;

    if (dto.classId !== undefined) {
      classIdStr = dto.classId.trim();
      const matchedApplicableClass = exam.applicableClasses.find(
        (ac) => ac.classId.toString() === classIdStr
      );
      if (!matchedApplicableClass) {
        throw new ValidationError(
          `Class is not marked as applicable for this examination (${exam.name}).`
        );
      }
      className = matchedApplicableClass.className;
    }

    if (dto.section !== undefined) {
      sectionName = dto.section.trim().toUpperCase();
      const sections = await this.classRepo.findSectionsByClassId(classIdStr);
      const matchedSection = sections.find(
        (s) => s.name.toUpperCase() === sectionName
      );
      if (!matchedSection) {
        throw new ValidationError(
          `Section "${sectionName}" does not exist under class "${className}".`
        );
      }
      sectionId = matchedSection._id as mongoose.Types.ObjectId;
    }

    // Validate Subject
    const subject = dto.subject !== undefined ? dto.subject.trim() : existingSchedule.subject;
    if (!subject) {
      throw new ValidationError('Subject name cannot be empty.');
    }

    const validSubjects = await this.examRepo.findDistinctSubjectsForClassSection(
      classIdStr,
      className,
      sectionName,
      exam.academicYear
    );
    if (validSubjects.length > 0) {
      const isMatch = validSubjects.some(
        (vs) => vs.toLowerCase() === subject.toLowerCase()
      );
      if (!isMatch) {
        throw new ValidationError(
          `"${subject}" is not a recognized subject for ${className} Section ${sectionName}. Valid subjects: ${validSubjects.join(', ')}.`
        );
      }
    }

    // Validate Exam Date
    const examDate = dto.examDate ? new Date(dto.examDate) : existingSchedule.examDate;
    if (isNaN(examDate.getTime())) {
      throw new ValidationError(`Invalid exam date: "${dto.examDate}".`);
    }

    const examDateZero = new Date(
      Date.UTC(examDate.getUTCFullYear(), examDate.getUTCMonth(), examDate.getUTCDate())
    );
    const examStartZero = new Date(
      Date.UTC(exam.startDate.getUTCFullYear(), exam.startDate.getUTCMonth(), exam.startDate.getUTCDate())
    );
    const examEndZero = new Date(
      Date.UTC(exam.endDate.getUTCFullYear(), exam.endDate.getUTCMonth(), exam.endDate.getUTCDate())
    );

    if (examDateZero < examStartZero || examDateZero > examEndZero) {
      throw new ValidationError(
        `Exam date (${this.formatDateString(examDate)}) must fall within the examination window (${this.formatDateString(exam.startDate)} to ${this.formatDateString(exam.endDate)}).`
      );
    }

    const roomNumber =
      dto.roomNumber !== undefined ? dto.roomNumber.trim() : existingSchedule.roomNumber || '';

    // Conflict Check 1: Class/Section Overlap
    const sectionConflicts = await this.examRepo.findSectionOverlaps(
      exam.academicYear,
      examDate,
      className,
      sectionName,
      normStart,
      normEnd,
      scheduleId
    );
    if (sectionConflicts.length > 0) {
      const existing = sectionConflicts[0];
      throw new ConflictError(
        `Schedule conflict: ${className} Section ${sectionName} already has "${existing.subject}" scheduled on ${this.formatDateString(examDate)} from ${existing.startTime} to ${existing.endTime}.`
      );
    }

    // Conflict Check 2: Room Overlap
    if (roomNumber) {
      const roomConflicts = await this.examRepo.findRoomOverlaps(
        exam.academicYear,
        examDate,
        roomNumber,
        normStart,
        normEnd,
        scheduleId
      );
      if (roomConflicts.length > 0) {
        const existing = roomConflicts[0];
        throw new ConflictError(
          `Room conflict: Room "${roomNumber}" is already booked for ${existing.className} Section ${existing.section} ("${existing.subject}") on ${this.formatDateString(examDate)} from ${existing.startTime} to ${existing.endTime}.`
        );
      }
    }

    const updated = await this.examRepo.updateSchedule(scheduleId, {
      classId: new mongoose.Types.ObjectId(classIdStr),
      className,
      sectionId,
      section: sectionName,
      subject,
      examDate,
      startTime: normStart,
      endTime: normEnd,
      maxMarks,
      passingMarks,
      roomNumber,
      notes: dto.notes !== undefined ? dto.notes.trim() : existingSchedule.notes,
    });

    if (!updated) {
      throw new NotFoundError(`Subject schedule with ID "${scheduleId}" was not found.`);
    }

    return this.mapScheduleToResponseDTO(updated);
  }

  async deleteSchedule(examId: string, scheduleId: string): Promise<void> {
    const existing = await this.examRepo.findScheduleById(scheduleId);
    if (!existing || existing.examId.toString() !== examId) {
      throw new NotFoundError(
        `Subject schedule with ID "${scheduleId}" was not found under this examination.`
      );
    }
    await this.examRepo.deleteSchedule(scheduleId);
  }
}
