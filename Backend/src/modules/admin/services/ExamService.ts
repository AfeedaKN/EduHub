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
  ExamMarksStatus,
  ManagementResultsFilterDTO,
  ManagementResultsDashboardResponseDTO,
  ManagementScheduleMarksReviewDetailsDTO,
  ManagementSubjectScheduleItemDTO,
  StudentEvaluationItemDTO,
} from '../dtos/exam.dto';
import { ExamModel, IExamDoc } from '../models/Exam.model';
import { ExamScheduleModel, IExamScheduleDoc } from '../models/ExamSchedule.model';
import { ExamMarksModel } from '../models/ExamMarks.model';
import { StudentModel } from '../../parent/models/Student.model';
import { TeacherModel } from '../models/Teacher.model';
import {
  ValidationError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
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

  async getScheduleMarks(examId: string, scheduleId: string) {
    const exam = await this.examRepo.findExamById(examId);
    if (!exam) {
      throw new NotFoundError(`Examination with ID "${examId}" was not found.`);
    }
    const schedule = await this.examRepo.findScheduleById(scheduleId);
    if (!schedule || schedule.examId.toString() !== examId) {
      throw new NotFoundError(`Subject schedule with ID "${scheduleId}" was not found.`);
    }

    const marksDoc = await ExamMarksModel.findOne({
      examScheduleId: new mongoose.Types.ObjectId(scheduleId),
    }).exec();

    return {
      schedule: this.mapScheduleToResponseDTO(schedule),
      marks: marksDoc || null,
    };
  }

  private calculateLetterGrade(percentage: number | null, isAbsent: boolean): string {
    if (isAbsent) return 'AB';
    if (percentage === null || percentage === undefined) return '-';
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  }

  async getResultsDashboard(
    filter: ManagementResultsFilterDTO
  ): Promise<ManagementResultsDashboardResponseDTO> {
    const exams = await ExamModel.find().lean().exec();
    const examMap = new Map<string, any>();
    exams.forEach((e) => examMap.set(e._id.toString(), e));

    const allSchedules = await ExamScheduleModel.find()
      .sort({ examDate: -1, startTime: 1 })
      .lean()
      .exec();
    const allScheduleIds = allSchedules.map((s) => s._id);

    const allMarksDocs = await ExamMarksModel.find({
      examScheduleId: { $in: allScheduleIds },
    })
      .lean()
      .exec();
    const marksMap = new Map<string, any>();
    allMarksDocs.forEach((m) => marksMap.set(m.examScheduleId.toString(), m));

    let totalScheduledSubjects = 0;
    let pendingReviews = 0;
    let returnedForCorrection = 0;
    let publishedResults = 0;

    for (const sch of allSchedules) {
      if (
        filter.academicYear &&
        filter.academicYear !== 'ALL' &&
        sch.academicYear !== filter.academicYear
      ) {
        continue;
      }
      totalScheduledSubjects++;
      const mDoc = marksMap.get(sch._id.toString());
      const status = mDoc ? mDoc.status : 'PENDING';
      if (status === 'SUBMITTED') pendingReviews++;
      else if (status === 'RETURNED') returnedForCorrection++;
      else if (status === 'PUBLISHED') publishedResults++;
    }

    const summary = {
      totalExams: exams.length,
      scheduledSubjects: totalScheduledSubjects,
      pendingReviews,
      returnedForCorrection,
      publishedResults,
    };

    const studentCounts = await StudentModel.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $group: {
          _id: {
            grade: { $toLower: '$grade' },
            section: { $toLower: '$section' },
          },
          count: { $sum: 1 },
        },
      },
    ]);
    const studentCountMap = new Map<string, number>();
    studentCounts.forEach((sc) => {
      if (sc._id?.grade && sc._id?.section) {
        studentCountMap.set(`${sc._id.grade.trim()}_${sc._id.section.trim()}`, sc.count);
      }
    });

    const teachers = await TeacherModel.find({ status: 'ACTIVE' }).lean().exec();
    const teacherAssignmentMap = new Map<string, string>();
    for (const t of teachers) {
      if (Array.isArray(t.assignedClasses)) {
        for (const ac of t.assignedClasses) {
          const key = `${ac.className?.trim().toLowerCase()}_${ac.section?.trim().toLowerCase()}_${ac.subject?.trim().toLowerCase()}`;
          teacherAssignmentMap.set(key, t.fullName);
        }
      }
    }

    const records: ManagementSubjectScheduleItemDTO[] = [];

    for (const sch of allSchedules) {
      const exam = examMap.get(sch.examId.toString());
      if (!exam) continue;

      if (
        filter.academicYear &&
        filter.academicYear !== 'ALL' &&
        sch.academicYear !== filter.academicYear
      ) {
        continue;
      }
      if (
        filter.examId &&
        filter.examId !== 'ALL' &&
        sch.examId.toString() !== filter.examId
      ) {
        continue;
      }
      if (
        filter.className &&
        filter.className !== 'ALL' &&
        sch.className.toLowerCase() !== filter.className.trim().toLowerCase()
      ) {
        continue;
      }
      if (
        filter.section &&
        filter.section !== 'ALL' &&
        sch.section.toLowerCase() !== filter.section.trim().toLowerCase()
      ) {
        continue;
      }
      if (
        filter.subject &&
        filter.subject !== 'ALL' &&
        sch.subject.toLowerCase() !== filter.subject.trim().toLowerCase()
      ) {
        continue;
      }

      const mDoc = marksMap.get(sch._id.toString());
      const marksStatus: ExamMarksStatus | 'PENDING' = mDoc ? mDoc.status : 'PENDING';

      if (filter.status && filter.status !== 'ALL') {
        if (filter.status !== marksStatus) {
          continue;
        }
      }

      const rosterCountKey = `${sch.className.trim().toLowerCase()}_${sch.section.trim().toLowerCase()}`;
      const officialStudentCount =
        studentCountMap.get(rosterCountKey) || (mDoc ? mDoc.totalStudents : 0);

      let evaluatedCount = 0;
      if (mDoc && Array.isArray(mDoc.students)) {
        evaluatedCount = mDoc.students.filter(
          (s: any) =>
            s.isAbsent === true ||
            (s.marksObtained !== null && s.marksObtained !== undefined)
        ).length;
      }

      const missingCount = Math.max(0, officialStudentCount - evaluatedCount);

      const teacherKey = `${sch.className.trim().toLowerCase()}_${sch.section.trim().toLowerCase()}_${sch.subject.trim().toLowerCase()}`;
      const assignedTeacherName =
        mDoc?.teacherName ||
        teacherAssignmentMap.get(teacherKey) ||
        sch.invigilatorName ||
        'Assigned Teacher';

      if (filter.search && filter.search.trim()) {
        const q = filter.search.trim().toLowerCase();
        const matchesExam = exam.name.toLowerCase().includes(q);
        const matchesSubject = sch.subject.toLowerCase().includes(q);
        const matchesClass = `${sch.className} ${sch.section}`.toLowerCase().includes(q);
        const matchesTeacher = assignedTeacherName.toLowerCase().includes(q);
        if (!matchesExam && !matchesSubject && !matchesClass && !matchesTeacher) {
          continue;
        }
      }

      records.push({
        id: sch._id.toString(),
        examId: exam._id.toString(),
        examName: exam.name,
        examType: exam.examType,
        academicYear: sch.academicYear,
        className: sch.className,
        classId: sch.classId.toString(),
        section: sch.section,
        subject: sch.subject,
        examDate: this.formatDateString(sch.examDate),
        maxMarks: sch.maxMarks,
        passingMarks: sch.passingMarks,
        roomNumber: sch.roomNumber || '',
        assignedTeacherName,
        totalStudents: officialStudentCount,
        evaluatedStudentsCount: evaluatedCount,
        missingStudentsCount: missingCount,
        marksStatus,
        submittedAt: mDoc?.submittedAt ? mDoc.submittedAt.toISOString() : null,
        submittedByName: mDoc?.submittedByName || '',
        returnedAt: mDoc?.returnedAt ? mDoc.returnedAt.toISOString() : null,
        returnedByName: mDoc?.returnedByName || '',
        returnReason: mDoc?.returnReason || '',
        publishedAt: mDoc?.publishedAt ? mDoc.publishedAt.toISOString() : null,
        publishedByName: mDoc?.publishedByName || '',
      });
    }

    return {
      summary,
      records,
    };
  }

  async getScheduleMarksDetails(
    examId: string,
    scheduleId: string
  ): Promise<ManagementScheduleMarksReviewDetailsDTO> {
    const exam = await this.examRepo.findExamById(examId);
    if (!exam) {
      throw new NotFoundError(`Examination with ID "${examId}" was not found.`);
    }
    const schedule = await this.examRepo.findScheduleById(scheduleId);
    if (!schedule || schedule.examId.toString() !== examId) {
      throw new NotFoundError(`Subject schedule with ID "${scheduleId}" was not found.`);
    }

    const marksDoc = await ExamMarksModel.findOne({
      examScheduleId: new mongoose.Types.ObjectId(scheduleId),
    })
      .lean()
      .exec();

    const baseQuery: Record<string, any> = {
      grade: { $regex: new RegExp(`^${schedule.className.trim()}$`, 'i') },
      section: { $regex: new RegExp(`^${schedule.section.trim()}$`, 'i') },
      status: 'ACTIVE',
    };

    let enrolledStudents = await StudentModel.find(baseQuery)
      .sort({ rollNumber: 1, fullName: 1 })
      .lean()
      .exec();

    if (
      schedule.academicYear &&
      schedule.academicYear.trim() &&
      schedule.academicYear !== 'ALL'
    ) {
      const yearQuery = {
        ...baseQuery,
        $or: [
          { academicYear: schedule.academicYear.trim() },
          { academicYear: { $exists: false } },
          { academicYear: '' },
        ],
      };
      const yearStudents = await StudentModel.find(yearQuery)
        .sort({ rollNumber: 1, fullName: 1 })
        .lean()
        .exec();
      if (yearStudents.length > 0) {
        enrolledStudents = yearStudents;
      }
    }

    const marksStudentMap = new Map<string, any>();
    if (marksDoc && Array.isArray(marksDoc.students)) {
      for (const s of marksDoc.students) {
        marksStudentMap.set(s.studentId.toString(), s);
        if (s.admissionNumber) {
          marksStudentMap.set(s.admissionNumber.toLowerCase(), s);
        }
      }
    }

    const roster: StudentEvaluationItemDTO[] = enrolledStudents.map((stu) => {
      const stuIdStr = stu._id.toString();
      const markEntry =
        marksStudentMap.get(stuIdStr) ||
        marksStudentMap.get(stu.studentId?.toLowerCase());

      const isAbsent = markEntry ? !!markEntry.isAbsent : false;
      const marksObtained =
        markEntry &&
        markEntry.marksObtained !== null &&
        markEntry.marksObtained !== undefined
          ? markEntry.marksObtained
          : null;
      const remarks = markEntry?.remarks || '';
      const isMissing = !isAbsent && marksObtained === null;

      let percentage: number | null = null;
      let isPassed: boolean | null = null;
      let grade: string | null = null;

      if (isAbsent) {
        isPassed = false;
        grade = 'AB';
      } else if (marksObtained !== null) {
        percentage =
          Math.round((marksObtained / schedule.maxMarks) * 100 * 10) / 10;
        isPassed = marksObtained >= schedule.passingMarks;
        grade = this.calculateLetterGrade(percentage, false);
      }

      return {
        studentId: stuIdStr,
        studentName: stu.fullName,
        admissionNumber: stu.studentId,
        rollNumber: stu.rollNumber || '',
        marksObtained,
        isAbsent,
        remarks,
        isMissing,
        isPassed,
        percentage,
        grade,
      };
    });

    const totalEnrolled = roster.length;
    const validMarksCount = roster.filter(
      (r) => r.marksObtained !== null && !r.isAbsent
    ).length;
    const absentCount = roster.filter((r) => r.isAbsent).length;
    const missingCount = roster.filter((r) => r.isMissing).length;
    const isComplete = totalEnrolled > 0 && missingCount === 0;
    const canPublish = marksDoc?.status === 'SUBMITTED' && isComplete;
    const canReturn = marksDoc?.status === 'SUBMITTED';

    let sumMarks = 0;
    let passingCount = 0;
    let failingCount = 0;
    for (const r of roster) {
      if (r.marksObtained !== null && !r.isAbsent) {
        sumMarks += r.marksObtained;
      }
      if (r.isPassed === true) passingCount++;
      if (r.isPassed === false) failingCount++;
    }
    const averageMarks =
      validMarksCount > 0
        ? Math.round((sumMarks / validMarksCount) * 10) / 10
        : null;

    return {
      schedule: this.mapScheduleToResponseDTO(schedule),
      examName: exam.name,
      examType: exam.examType,
      marksDoc: marksDoc
        ? {
            id: marksDoc._id.toString(),
            status: marksDoc.status,
            teacherName: marksDoc.teacherName,
            submittedAt: marksDoc.submittedAt
              ? marksDoc.submittedAt.toISOString()
              : null,
            submittedByName: marksDoc.submittedByName,
            returnedAt: marksDoc.returnedAt
              ? marksDoc.returnedAt.toISOString()
              : null,
            returnedByName: marksDoc.returnedByName,
            returnReason: marksDoc.returnReason,
            publishedAt: marksDoc.publishedAt
              ? marksDoc.publishedAt.toISOString()
              : null,
            publishedByName: marksDoc.publishedByName,
            reviewHistory: (marksDoc.reviewHistory || []).map((h: any) => ({
              status: h.status,
              changedAt: h.changedAt
                ? new Date(h.changedAt).toISOString()
                : new Date().toISOString(),
              changedByName: h.changedByName || '',
              reason: h.reason || '',
            })),
          }
        : null,
      roster,
      summary: {
        totalEnrolled,
        validMarksCount,
        absentCount,
        missingCount,
        isComplete,
        canPublish,
        canReturn,
        averageMarks,
        passingCount,
        failingCount,
      },
    };
  }

  async returnScheduleMarks(
    examId: string,
    scheduleId: string,
    reason: string,
    managementUser: { id: string; name?: string }
  ) {
    if (!reason || !reason.trim()) {
      throw new ValidationError('A reason is required to return marks for correction.');
    }
    const exam = await this.examRepo.findExamById(examId);
    if (!exam) {
      throw new NotFoundError(`Examination with ID "${examId}" was not found.`);
    }
    const schedule = await this.examRepo.findScheduleById(scheduleId);
    if (!schedule || schedule.examId.toString() !== examId) {
      throw new NotFoundError(`Subject schedule with ID "${scheduleId}" was not found.`);
    }

    const marksDoc = await ExamMarksModel.findOne({
      examScheduleId: new mongoose.Types.ObjectId(scheduleId),
    }).exec();

    if (!marksDoc) {
      throw new NotFoundError('No marks entry found for this subject schedule.');
    }
    if (marksDoc.status === 'PUBLISHED') {
      throw new ForbiddenError(
        'Cannot return marks: Official results have already been published. Use Reopen for Correction if post-publication correction is required.'
      );
    }
    if (marksDoc.status !== 'SUBMITTED') {
      throw new ValidationError(
        `Cannot return marks with status "${marksDoc.status}". Only submitted marks can be returned for correction.`
      );
    }

    const now = new Date();
    marksDoc.status = 'RETURNED';
    marksDoc.returnedAt = now;
    marksDoc.returnedBy = managementUser.id
      ? new mongoose.Types.ObjectId(managementUser.id)
      : null;
    marksDoc.returnedByName = managementUser.name || 'Management';
    marksDoc.returnReason = reason.trim();

    if (!Array.isArray(marksDoc.reviewHistory)) {
      marksDoc.reviewHistory = [];
    }
    marksDoc.reviewHistory.push({
      status: 'RETURNED',
      changedAt: now,
      changedBy: managementUser.id
        ? new mongoose.Types.ObjectId(managementUser.id)
        : null,
      changedByName: managementUser.name || 'Management',
      reason: reason.trim(),
    });

    await marksDoc.save();

    return {
      schedule: this.mapScheduleToResponseDTO(schedule),
      marks: marksDoc,
    };
  }

  async publishScheduleMarks(
    examId: string,
    scheduleId: string,
    managementUser?: { id: string; name?: string }
  ) {
    const exam = await this.examRepo.findExamById(examId);
    if (!exam) {
      throw new NotFoundError(`Examination with ID "${examId}" was not found.`);
    }
    const schedule = await this.examRepo.findScheduleById(scheduleId);
    if (!schedule || schedule.examId.toString() !== examId) {
      throw new NotFoundError(`Subject schedule with ID "${scheduleId}" was not found.`);
    }

    const marksDoc = await ExamMarksModel.findOne({
      examScheduleId: new mongoose.Types.ObjectId(scheduleId),
    }).exec();

    if (!marksDoc) {
      throw new NotFoundError('No marks entry found for this subject schedule.');
    }
    if (marksDoc.status === 'PUBLISHED') {
      throw new ConflictError(
        'Results for this subject schedule have already been published.'
      );
    }
    if (marksDoc.status !== 'SUBMITTED') {
      throw new ValidationError(
        `Cannot publish marks with status "${marksDoc.status}". Only submitted marks can be approved and published.`
      );
    }

    const reviewDetails = await this.getScheduleMarksDetails(examId, scheduleId);
    if (!reviewDetails.summary.isComplete) {
      throw new ValidationError(
        `Cannot publish results: Submission is incomplete. ${reviewDetails.summary.missingCount} enrolled student(s) have missing marks. All students on the official roster must be evaluated or marked absent before publication.`
      );
    }

    const now = new Date();
    marksDoc.status = 'PUBLISHED';
    marksDoc.publishedAt = now;
    marksDoc.publishedBy = managementUser?.id
      ? new mongoose.Types.ObjectId(managementUser.id)
      : null;
    marksDoc.publishedByName = managementUser?.name || 'Management';

    if (!Array.isArray(marksDoc.reviewHistory)) {
      marksDoc.reviewHistory = [];
    }
    marksDoc.reviewHistory.push({
      status: 'PUBLISHED',
      changedAt: now,
      changedBy: managementUser?.id
        ? new mongoose.Types.ObjectId(managementUser.id)
        : null,
      changedByName: managementUser?.name || 'Management',
      reason: 'Approved and published official results',
    });

    await marksDoc.save();

    return {
      schedule: this.mapScheduleToResponseDTO(schedule),
      marks: marksDoc,
    };
  }

  async reopenScheduleMarks(
    examId: string,
    scheduleId: string,
    reason: string,
    managementUser: { id: string; name?: string }
  ) {
    if (!reason || !reason.trim()) {
      throw new ValidationError(
        'A reason is required to reopen published results for correction.'
      );
    }
    const exam = await this.examRepo.findExamById(examId);
    if (!exam) {
      throw new NotFoundError(`Examination with ID "${examId}" was not found.`);
    }
    const schedule = await this.examRepo.findScheduleById(scheduleId);
    if (!schedule || schedule.examId.toString() !== examId) {
      throw new NotFoundError(`Subject schedule with ID "${scheduleId}" was not found.`);
    }

    const marksDoc = await ExamMarksModel.findOne({
      examScheduleId: new mongoose.Types.ObjectId(scheduleId),
    }).exec();

    if (!marksDoc) {
      throw new NotFoundError('No marks entry found for this subject schedule.');
    }
    if (marksDoc.status !== 'PUBLISHED') {
      throw new ValidationError(
        `Cannot reopen marks with status "${marksDoc.status}". Only published results can be reopened for correction.`
      );
    }

    const now = new Date();
    marksDoc.status = 'RETURNED';
    marksDoc.returnedAt = now;
    marksDoc.returnedBy = managementUser.id
      ? new mongoose.Types.ObjectId(managementUser.id)
      : null;
    marksDoc.returnedByName = managementUser.name || 'Management';
    marksDoc.returnReason = `[Reopened Post-Publication]: ${reason.trim()}`;
    marksDoc.publishedAt = null;
    marksDoc.publishedBy = null;
    marksDoc.publishedByName = '';

    if (!Array.isArray(marksDoc.reviewHistory)) {
      marksDoc.reviewHistory = [];
    }
    marksDoc.reviewHistory.push({
      status: 'RETURNED',
      changedAt: now,
      changedBy: managementUser.id
        ? new mongoose.Types.ObjectId(managementUser.id)
        : null,
      changedByName: managementUser.name || 'Management',
      reason: `Reopened published results for correction: ${reason.trim()}`,
    });

    await marksDoc.save();

    return {
      schedule: this.mapScheduleToResponseDTO(schedule),
      marks: marksDoc,
    };
  }
}

