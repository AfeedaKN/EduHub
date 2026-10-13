import mongoose from 'mongoose';
import { IAttendanceRepository } from '../repositories/AttendanceRepository';
import {
  AttendanceRegisterDTO,
  SaveAttendanceDTO,
  AttendanceHistoryEntryDTO,
  StudentAttendanceItemDTO,
} from '../dtos/attendance.dto';
import { AttendanceStatus } from '../models/Attendance.model';
import {
  ValidationError,
  ForbiddenError,
  UnauthorizedError,
  ConflictError,
} from '../../../shared/domain/errors/AppError';

export class AttendanceService {
  constructor(private readonly attendanceRepo: IAttendanceRepository) {}

  /**
   * Helper: validates that the teacher is assigned to the specified class and section.
   */
  private async validateTeacherAssignment(
    userId: string,
    className: string,
    section: string
  ) {
    if (!className || !className.trim()) {
      throw new ValidationError('Class name is required.');
    }
    if (!section || !section.trim()) {
      throw new ValidationError('Section is required.');
    }

    const teacher = await this.attendanceRepo.findTeacherByUserId(userId);
    if (!teacher || teacher.status !== 'ACTIVE') {
      throw new UnauthorizedError(
        'Active teacher account not found or access revoked.',
        'TEACHER_NOT_FOUND'
      );
    }

    const cleanClass = className.trim().toLowerCase();
    const cleanSection = section.trim().toLowerCase();

    const matchedAssignment = teacher.assignedClasses?.find(
      (c) =>
        c.className.trim().toLowerCase() === cleanClass &&
        c.section.trim().toLowerCase() === cleanSection
    );

    if (!matchedAssignment) {
      throw new ForbiddenError(
        `You are not authorized to manage attendance for ${className} Section ${section}.`,
        'FORBIDDEN_SECTION'
      );
    }

    return { teacher, matchedAssignment };
  }

  /**
   * Helper: resolves the active academic year for a section from SectionModel or defaults safely
   */
  private async resolveAcademicYear(
    matchedAssignment: any,
    className: string,
    section: string,
    explicitYear?: string
  ): Promise<string> {
    if (explicitYear && explicitYear.trim()) {
      return explicitYear.trim();
    }

    if (this.attendanceRepo.findSectionAcademicYear) {
      const sectionYear = await this.attendanceRepo.findSectionAcademicYear(
        matchedAssignment?.classId?.toString(),
        className,
        section
      );
      if (sectionYear) {
        return sectionYear;
      }
    }

    return matchedAssignment?.academicYear || '2026-2027';
  }

  /**
   * Helper: validates attendance date format and ensures it is not in the future.
   */
  private validateDate(dateStr: string): string {
    if (!dateStr || !dateStr.trim()) {
      throw new ValidationError('Attendance date is required.');
    }

    const cleanDate = dateStr.trim();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(cleanDate)) {
      throw new ValidationError(
        'Invalid date format. Expected YYYY-MM-DD.',
        'INVALID_DATE_FORMAT'
      );
    }

    const parsedDate = new Date(`${cleanDate}T00:00:00.000Z`);
    if (isNaN(parsedDate.getTime())) {
      throw new ValidationError('Invalid calendar date specified.', 'INVALID_DATE');
    }

    // Ensure the date is not in the future compared to UTC today
    const nowUtc = new Date().toISOString().slice(0, 10);
    if (cleanDate > nowUtc) {
      throw new ValidationError(
        'Attendance cannot be recorded or modified for a future date.',
        'FUTURE_DATE_NOT_ALLOWED'
      );
    }

    return cleanDate;
  }

  /**
   * Fetch attendance register for an assigned class, section, and date.
   */
  async getSectionAttendance(
    userId: string,
    className: string,
    section: string,
    dateStr: string,
    requestedAcademicYear?: string
  ): Promise<AttendanceRegisterDTO> {
    const { matchedAssignment } = await this.validateTeacherAssignment(
      userId,
      className,
      section
    );
    const date = this.validateDate(dateStr);

    const resolvedAcademicYear = await this.resolveAcademicYear(
      matchedAssignment,
      className,
      section,
      requestedAcademicYear
    );

    const enrolledStudents = await this.attendanceRepo.findStudentsBySection(
      className,
      section,
      resolvedAcademicYear
    );

    const existingRecords = await this.attendanceRepo.findAttendanceBySectionAndDate(
      className,
      section,
      date
    );

    const isAlreadyMarked = existingRecords.length > 0;
    const recordsMap = new Map<string, (typeof existingRecords)[0]>();
    existingRecords.forEach((r) => {
      recordsMap.set(r.studentId.toString(), r);
    });

    const students: StudentAttendanceItemDTO[] = enrolledStudents.map((s) => {
      const studentIdStr = s._id.toString();
      const existing = recordsMap.get(studentIdStr);

      const status: AttendanceStatus = existing
        ? existing.status
        : 'PRESENT';

      return {
        studentId: studentIdStr,
        admissionNumber: s.studentId,
        rollNumber: s.rollNumber || '',
        fullName: s.fullName,
        status,
        remarks: existing?.remarks || '',
        avatarUrl: s.avatarUrl || '',
        attendanceId: existing?._id?.toString(),
      };
    });

    let present = 0;
    let absent = 0;
    let late = 0;

    students.forEach((s) => {
      if (s.status === 'PRESENT') present++;
      else if (s.status === 'ABSENT') absent++;
      else if (s.status === 'LATE') late++;
    });

    const total = students.length;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    const firstMarked = existingRecords[0];
    const markedByName = (firstMarked?.markedBy as any)?.fullName;

    return {
      className,
      section,
      date,
      academicYear: enrolledStudents[0]?.academicYear || resolvedAcademicYear,
      isAlreadyMarked,
      existingCount: existingRecords.length,
      summary: {
        total,
        present,
        absent,
        late,
        percentage,
      },
      students,
      lastUpdated: firstMarked?.updatedAt,
      markedByName,
    };
  }

  /**
   * Save a newly recorded attendance register.
   * Throws 409 Conflict if records already exist for this date.
   */
  async saveSectionAttendance(
    userId: string,
    dto: SaveAttendanceDTO
  ): Promise<AttendanceRegisterDTO> {
    const { teacher, matchedAssignment } = await this.validateTeacherAssignment(
      userId,
      dto.className,
      dto.section
    );
    const date = this.validateDate(dto.date);

    if (!dto.records || !Array.isArray(dto.records) || dto.records.length === 0) {
      throw new ValidationError(
        'Student attendance records array is required.',
        'MISSING_ATTENDANCE_RECORDS'
      );
    }

    // 1. Conflict check: prevent silent duplicate insertion
    const existing = await this.attendanceRepo.findAttendanceBySectionAndDate(
      dto.className,
      dto.section,
      date
    );
    if (existing.length > 0) {
      throw new ConflictError(
        'Attendance has already been recorded for this date and section. Please update the existing register.',
        'ATTENDANCE_ALREADY_EXISTS'
      );
    }

    const resolvedAcademicYear = await this.resolveAcademicYear(
      matchedAssignment,
      dto.className,
      dto.section,
      dto.academicYear
    );

    // 2. Validate students against officially enrolled section roster
    const enrolledStudents = await this.attendanceRepo.findStudentsBySection(
      dto.className,
      dto.section,
      resolvedAcademicYear
    );
    const validStudentMap = new Map<string, (typeof enrolledStudents)[0]>();
    enrolledStudents.forEach((s) => validStudentMap.set(s._id.toString(), s));

    const seenStudentIds = new Set<string>();
    const batchToInsert: Array<{
      studentId: mongoose.Types.ObjectId;
      classId?: mongoose.Types.ObjectId;
      className: string;
      section: string;
      academicYear: string;
      date: string;
      status: AttendanceStatus;
      remarks?: string;
      markedBy: mongoose.Types.ObjectId;
    }> = [];

    const allowedStatuses: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE'];

    for (const record of dto.records) {
      if (!record.studentId || !mongoose.Types.ObjectId.isValid(record.studentId)) {
        throw new ValidationError(`Invalid student ID: ${record.studentId}`);
      }

      if (seenStudentIds.has(record.studentId)) {
        throw new ValidationError(
          `Duplicate student ID ${record.studentId} in attendance submission.`,
          'DUPLICATE_STUDENT_IN_SUBMISSION'
        );
      }
      seenStudentIds.add(record.studentId);

      const enrolledStudentDoc = validStudentMap.get(record.studentId);
      if (!enrolledStudentDoc) {
        throw new ValidationError(
          `Student with ID ${record.studentId} is not officially enrolled in ${dto.className} Section ${dto.section}.`,
          'STUDENT_NOT_ENROLLED'
        );
      }

      if (!allowedStatuses.includes(record.status)) {
        throw new ValidationError(
          `Invalid attendance status: ${record.status}. Allowed values: PRESENT, ABSENT, LATE.`,
          'INVALID_STATUS'
        );
      }

      batchToInsert.push({
        studentId: new mongoose.Types.ObjectId(record.studentId),
        classId: matchedAssignment.classId
          ? new mongoose.Types.ObjectId(matchedAssignment.classId.toString())
          : undefined,
        className: dto.className.trim(),
        section: dto.section.trim().toUpperCase(),
        academicYear: enrolledStudentDoc.academicYear || resolvedAcademicYear,
        date,
        status: record.status,
        remarks: record.remarks?.trim() || '',
        markedBy: teacher.userId,
      });
    }

    await this.attendanceRepo.saveAttendanceBatch(batchToInsert);

    return await this.getSectionAttendance(userId, dto.className, dto.section, date, resolvedAcademicYear);
  }

  /**
   * Update an existing attendance register.
   */
  async updateSectionAttendance(
    userId: string,
    dto: SaveAttendanceDTO
  ): Promise<AttendanceRegisterDTO> {
    const { teacher, matchedAssignment } = await this.validateTeacherAssignment(
      userId,
      dto.className,
      dto.section
    );
    const date = this.validateDate(dto.date);

    if (!dto.records || !Array.isArray(dto.records) || dto.records.length === 0) {
      throw new ValidationError(
        'Student attendance records array is required.',
        'MISSING_ATTENDANCE_RECORDS'
      );
    }

    const resolvedAcademicYear = await this.resolveAcademicYear(
      matchedAssignment,
      dto.className,
      dto.section,
      dto.academicYear
    );

    const enrolledStudents = await this.attendanceRepo.findStudentsBySection(
      dto.className,
      dto.section,
      resolvedAcademicYear
    );
    const validStudentMap = new Map<string, (typeof enrolledStudents)[0]>();
    enrolledStudents.forEach((s) => validStudentMap.set(s._id.toString(), s));

    const seenStudentIds = new Set<string>();
    const batchToUpdate: Array<{
      studentId: mongoose.Types.ObjectId;
      classId?: mongoose.Types.ObjectId;
      className: string;
      section: string;
      academicYear: string;
      date: string;
      status: AttendanceStatus;
      remarks?: string;
      markedBy: mongoose.Types.ObjectId;
    }> = [];

    const allowedStatuses: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE'];

    for (const record of dto.records) {
      if (!record.studentId || !mongoose.Types.ObjectId.isValid(record.studentId)) {
        throw new ValidationError(`Invalid student ID: ${record.studentId}`);
      }

      if (seenStudentIds.has(record.studentId)) {
        throw new ValidationError(
          `Duplicate student ID ${record.studentId} in attendance update.`,
          'DUPLICATE_STUDENT_IN_SUBMISSION'
        );
      }
      seenStudentIds.add(record.studentId);

      const enrolledStudentDoc = validStudentMap.get(record.studentId);
      if (!enrolledStudentDoc) {
        throw new ValidationError(
          `Student with ID ${record.studentId} is not officially enrolled in ${dto.className} Section ${dto.section}.`,
          'STUDENT_NOT_ENROLLED'
        );
      }

      if (!allowedStatuses.includes(record.status)) {
        throw new ValidationError(
          `Invalid attendance status: ${record.status}. Allowed values: PRESENT, ABSENT, LATE.`,
          'INVALID_STATUS'
        );
      }

      batchToUpdate.push({
        studentId: new mongoose.Types.ObjectId(record.studentId),
        classId: matchedAssignment.classId
          ? new mongoose.Types.ObjectId(matchedAssignment.classId.toString())
          : undefined,
        className: dto.className.trim(),
        section: dto.section.trim().toUpperCase(),
        academicYear: enrolledStudentDoc.academicYear || resolvedAcademicYear,
        date,
        status: record.status,
        remarks: record.remarks?.trim() || '',
        markedBy: teacher.userId,
      });
    }

    await this.attendanceRepo.updateAttendanceBatch(batchToUpdate);

    return await this.getSectionAttendance(userId, dto.className, dto.section, date, resolvedAcademicYear);
  }

  /**
   * Fetch attendance history sessions for a classroom section.
   */
  async getSectionAttendanceHistory(
    userId: string,
    className: string,
    section: string,
    academicYear?: string
  ): Promise<AttendanceHistoryEntryDTO[]> {
    const { matchedAssignment } = await this.validateTeacherAssignment(userId, className, section);
    const resolvedAcademicYear = await this.resolveAcademicYear(
      matchedAssignment,
      className,
      section,
      academicYear
    );
    return await this.attendanceRepo.findHistoryBySection(className, section, resolvedAcademicYear);
  }
}
