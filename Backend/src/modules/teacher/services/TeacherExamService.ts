import mongoose from 'mongoose';
import { ITeacherExamRepository } from '../repositories/TeacherExamRepository';
import {
  TeacherExamFilterParamsDTO,
  TeacherExamsListResponseDTO,
  TeacherExamScheduleItemDTO,
  TeacherExamScheduleDetailsDTO,
  StudentRosterMarkItemDTO,
  SaveExamMarksDTO,
  TeacherMarksEntryStatus,
} from '../dtos/teacherExam.dto';
import { IExamScheduleDoc } from '../../admin/models/ExamSchedule.model';
import { IExamDoc } from '../../admin/models/Exam.model';
import { ITeacherDoc } from '../../admin/models/Teacher.model';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
} from '../../../shared/domain/errors/AppError';

export class TeacherExamService {
  constructor(private readonly repo: ITeacherExamRepository) { }

  private formatDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatTime12Hour(timeStr: string): string {
    const parts = timeStr.trim().split(':');
    let h = parseInt(parts[0], 10);
    const m = (parts[1] || '00').padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${m} ${ampm}`;
  }

  /**
   * Helper: Validates that the authenticated teacher is active and assigned to
   * the specified exam schedule's class, section, and subject.
   */
  public async validateTeacherScheduleAccess(
    userId: string,
    scheduleId: string,
    email?: string
  ): Promise<{
    teacher: ITeacherDoc;
    schedule: IExamScheduleDoc;
    exam: IExamDoc;
  }> {
    if (!scheduleId || !mongoose.Types.ObjectId.isValid(scheduleId)) {
      throw new ValidationError('Invalid examination schedule ID.');
    }

    const teacher = await this.repo.findTeacherByUserId(userId, email);
    if (!teacher || teacher.status !== 'ACTIVE') {
      throw new UnauthorizedError(
        'Active faculty account not found or access revoked.',
        'TEACHER_NOT_FOUND'
      );
    }

    const schedule = await this.repo.findScheduleById(scheduleId);
    if (!schedule) {
      throw new NotFoundError(
        `Exam schedule with ID "${scheduleId}" was not found.`,
        'SCHEDULE_NOT_FOUND'
      );
    }

    const exam = await this.repo.findExamById(schedule.examId.toString());
    if (!exam) {
      throw new NotFoundError(
        `Examination associated with this schedule was not found.`,
        'EXAM_NOT_FOUND'
      );
    }

    // Authorization check: Teacher must have this class and section assigned
    const assignedClasses = teacher.assignedClasses || [];
    const isAssigned = assignedClasses.some((ac) => {
      const classMatch =
        (ac.classId && schedule.classId && ac.classId.toString() === schedule.classId.toString()) ||
        ac.className.trim().toLowerCase() === schedule.className.trim().toLowerCase();
      const secMatch =
        !ac.section ||
        ac.section.trim() === '' ||
        ac.section.trim().toLowerCase() === 'all' ||
        ac.section.trim().toLowerCase() === schedule.section.trim().toLowerCase();
      const subMatch =
        !ac.subject ||
        ac.subject.trim() === '' ||
        ac.subject.trim().toLowerCase() === 'all' ||
        ac.subject.trim().toLowerCase() === schedule.subject.trim().toLowerCase();
      return classMatch && secMatch && subMatch;
    });

    const isInvigilator =
      schedule.invigilatorId &&
      (schedule.invigilatorId.toString() === teacher._id.toString() ||
        (teacher.userId && schedule.invigilatorId.toString() === teacher.userId.toString()));

    if (!isAssigned && !isInvigilator) {
      throw new ForbiddenError(
        `You are not authorized to access exam marks for ${schedule.className} Section ${schedule.section} (${schedule.subject}).`,
        'FORBIDDEN_SCHEDULE_ACCESS'
      );
    }

    return { teacher, schedule, exam };
  }

  /**
   * Retrieve list of authorized exam schedules and overall summary for authenticated teacher
   */
  async getTeacherExams(
    userId: string,
    filter: TeacherExamFilterParamsDTO,
    email?: string
  ): Promise<TeacherExamsListResponseDTO> {
    const teacher = await this.repo.findTeacherByUserId(userId, email);
    if (!teacher || teacher.status !== 'ACTIVE') {
      return {
        summary: {
          assignedExams: 0,
          upcomingExams: 0,
          marksPending: 0,
          submittedForReview: 0,
        },
        schedules: [],
      };
    }

    const rawSchedules = await this.repo.findSchedulesForTeacher(teacher, filter);
    if (rawSchedules.length === 0) {
      return {
        summary: {
          assignedExams: 0,
          upcomingExams: 0,
          marksPending: 0,
          submittedForReview: 0,
        },
        schedules: [],
      };
    }

    // Resolve parent exams for these schedules
    const examIds = Array.from(new Set(rawSchedules.map((s) => s.examId.toString())));
    const exams = await this.repo.findExamsByIds(examIds);
    const examMap = new Map<string, IExamDoc>();
    exams.forEach((e) => examMap.set(e._id.toString(), e));

    // Resolve marks documents for these schedules
    const scheduleIds = rawSchedules.map((s) => s._id.toString());
    const marksMap = await this.repo.findMarksByScheduleIds(scheduleIds);

    const now = new Date();
    const todayZero = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Construct schedule item DTOs and distinct exam counts
    const items: TeacherExamScheduleItemDTO[] = [];
    const assignedExamIdsSet = new Set<string>();
    const upcomingExamIdsSet = new Set<string>();
    const pendingExamIdsSet = new Set<string>();
    const submittedExamIdsSet = new Set<string>();

    for (const sch of rawSchedules) {
      const exam = examMap.get(sch.examId.toString());
      if (!exam) continue;

      // Filter by examType if requested
      if (filter.examType && filter.examType !== 'ALL' && exam.examType !== filter.examType) {
        continue;
      }

      // Filter by search query if requested
      if (filter.search && filter.search.trim()) {
        const query = filter.search.trim().toLowerCase();
        const matchesExamName = exam.name.toLowerCase().includes(query);
        const matchesSubject = sch.subject.toLowerCase().includes(query);
        const matchesClass = `${sch.className} ${sch.section}`.toLowerCase().includes(query);
        if (!matchesExamName && !matchesSubject && !matchesClass) {
          continue;
        }
      }

      const examIdStr = exam._id.toString();
      assignedExamIdsSet.add(examIdStr);

      const marksDoc = marksMap.get(sch._id.toString());
      const marksStatus: TeacherMarksEntryStatus = marksDoc ? marksDoc.status : 'PENDING';

      // Status metrics: track distinct exams with pending vs submitted marks
      if (marksStatus === 'SUBMITTED' || marksStatus === 'PUBLISHED') {
        submittedExamIdsSet.add(examIdStr);
      } else {
        pendingExamIdsSet.add(examIdStr);
      }

      // Upcoming check: examDate is today or future
      const schDateZero = new Date(
        Date.UTC(sch.examDate.getUTCFullYear(), sch.examDate.getUTCMonth(), sch.examDate.getUTCDate())
      );
      if (schDateZero >= todayZero) {
        upcomingExamIdsSet.add(examIdStr);
      }

      // Filter by marksStatus if requested
      if (filter.status && filter.status !== 'ALL') {
        if (filter.status === 'PENDING' && marksStatus !== 'PENDING') continue;
        if (filter.status === 'DRAFT' && marksStatus !== 'DRAFT') continue;
        if (filter.status === 'RETURNED' && marksStatus !== 'RETURNED') continue;
        if (filter.status === 'SUBMITTED' && marksStatus !== 'SUBMITTED') continue;
        if (filter.status === 'PUBLISHED' && marksStatus !== 'PUBLISHED') continue;
      }

      const totalStudents = marksDoc ? marksDoc.totalStudents : 0;
      const enteredMarksCount = marksDoc ? marksDoc.enteredCount : 0;

      items.push({
        id: sch._id.toString(),
        examId: exam._id.toString(),
        examName: exam.name,
        examType: exam.examType,
        academicYear: sch.academicYear,
        examStartDate: this.formatDateString(exam.startDate),
        examEndDate: this.formatDateString(exam.endDate),
        examDate: this.formatDateString(sch.examDate),
        startTime: sch.startTime,
        endTime: sch.endTime,
        formattedTime: `${this.formatTime12Hour(sch.startTime)} - ${this.formatTime12Hour(sch.endTime)}`,
        classId: sch.classId.toString(),
        className: sch.className,
        section: sch.section,
        subject: sch.subject,
        maxMarks: sch.maxMarks,
        passingMarks: sch.passingMarks,
        roomNumber: sch.roomNumber || '',
        notes: sch.notes || '',
        marksStatus,
        marksSubmittedAt: marksDoc?.submittedAt ? marksDoc.submittedAt.toISOString() : null,
        marksSubmittedByName: marksDoc?.submittedByName || '',
        marksReturnedAt: marksDoc?.returnedAt ? marksDoc.returnedAt.toISOString() : null,
        marksReturnedByName: marksDoc?.returnedByName || '',
        marksReturnReason: marksDoc?.returnReason || '',
        totalStudents,
        enteredMarksCount,
      });
    }

    return {
      summary: {
        assignedExams: assignedExamIdsSet.size,
        upcomingExams: upcomingExamIdsSet.size,
        marksPending: pendingExamIdsSet.size,
        submittedForReview: submittedExamIdsSet.size,
      },
      schedules: items,
    };
  }

  /**
   * Get detailed marks entry page data for an authorized schedule
   */
  async getScheduleMarks(
    userId: string,
    scheduleId: string,
    email?: string
  ): Promise<TeacherExamScheduleDetailsDTO> {
    const { schedule, exam } = await this.validateTeacherScheduleAccess(userId, scheduleId, email);

    // Fetch official student roster for class, section, and academic year
    const enrolledStudents = await this.repo.findStudentsBySection(
      schedule.className,
      schedule.section,
      schedule.academicYear
    );

    // Fetch existing marks doc
    const marksDoc = await this.repo.findMarksByScheduleId(scheduleId);

    const isReadOnly =
      marksDoc !== null &&
      (marksDoc.status === 'SUBMITTED' || marksDoc.status === 'PUBLISHED');

    const marksMap = new Map<string, { marksObtained: number | null; isAbsent: boolean; remarks?: string }>();
    if (marksDoc && Array.isArray(marksDoc.students)) {
      marksDoc.students.forEach((s) => {
        marksMap.set(s.studentId.toString(), {
          marksObtained: s.marksObtained,
          isAbsent: s.isAbsent,
          remarks: s.remarks,
        });
      });
    }

    const studentRows: StudentRosterMarkItemDTO[] = enrolledStudents.map((stu) => {
      const studentIdStr = stu._id.toString();
      const existing = marksMap.get(studentIdStr);

      return {
        studentId: studentIdStr,
        studentName: stu.fullName,
        admissionNumber: stu.studentId,
        rollNumber: stu.rollNumber || '',
        marksObtained: existing ? existing.marksObtained : null,
        isAbsent: existing ? existing.isAbsent : false,
        remarks: existing?.remarks || '',
      };
    });

    let enteredCount = 0;
    studentRows.forEach((s) => {
      if (s.isAbsent || s.marksObtained !== null) {
        enteredCount++;
      }
    });

    const totalStudents = studentRows.length;
    const remainingCount = Math.max(0, totalStudents - enteredCount);

    const scheduleDTO: TeacherExamScheduleItemDTO = {
      id: schedule._id.toString(),
      examId: exam._id.toString(),
      examName: exam.name,
      examType: exam.examType,
      academicYear: schedule.academicYear,
      examStartDate: this.formatDateString(exam.startDate),
      examEndDate: this.formatDateString(exam.endDate),
      examDate: this.formatDateString(schedule.examDate),
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      formattedTime: `${this.formatTime12Hour(schedule.startTime)} - ${this.formatTime12Hour(schedule.endTime)}`,
      classId: schedule.classId.toString(),
      className: schedule.className,
      section: schedule.section,
      subject: schedule.subject,
      maxMarks: schedule.maxMarks,
      passingMarks: schedule.passingMarks,
      roomNumber: schedule.roomNumber || '',
      notes: schedule.notes || '',
      marksStatus: marksDoc ? marksDoc.status : 'PENDING',
      marksSubmittedAt: marksDoc?.submittedAt ? marksDoc.submittedAt.toISOString() : null,
      marksSubmittedByName: marksDoc?.submittedByName || '',
      marksReturnedAt: marksDoc?.returnedAt ? marksDoc.returnedAt.toISOString() : null,
      marksReturnedByName: marksDoc?.returnedByName || '',
      marksReturnReason: marksDoc?.returnReason || '',
      totalStudents,
      enteredMarksCount: enteredCount,
    };

    return {
      schedule: scheduleDTO,
      isReadOnly,
      students: studentRows,
      summary: {
        totalStudents,
        enteredCount,
        remainingCount,
      },
    };
  }

  /**
   * Save draft marks for an exam schedule
   */
  async saveDraftMarks(
    userId: string,
    scheduleId: string,
    dto: SaveExamMarksDTO,
    email?: string
  ): Promise<TeacherExamScheduleDetailsDTO> {
    const { teacher, schedule, exam } = await this.validateTeacherScheduleAccess(userId, scheduleId, email);

    const existingMarksDoc = await this.repo.findMarksByScheduleId(scheduleId);
    if (
      existingMarksDoc &&
      (existingMarksDoc.status === 'SUBMITTED' || existingMarksDoc.status === 'PUBLISHED')
    ) {
      throw new ForbiddenError(
        'Marks have already been submitted for Management review and are read-only.',
        'MARKS_ALREADY_SUBMITTED'
      );
    }

    const rawRecords = dto.records || (dto as any).marks;
    if (!rawRecords || !Array.isArray(rawRecords)) {
      throw new ValidationError('Marks records array is required.', 'INVALID_PAYLOAD');
    }

    const enrolledStudents = await this.repo.findStudentsBySection(
      schedule.className,
      schedule.section,
      schedule.academicYear
    );
    const validStudentMap = new Map<string, (typeof enrolledStudents)[0]>();
    enrolledStudents.forEach((s) => validStudentMap.set(s._id.toString(), s));

    const seenStudentIds = new Set<string>();
    const inputStudentMap = new Map<string, { marksObtained: number | null; isAbsent: boolean; remarks?: string }>();

    for (const record of rawRecords) {
      if (!record.studentId || !mongoose.Types.ObjectId.isValid(record.studentId)) {
        throw new ValidationError(`Invalid student ID: "${record.studentId}".`, 'INVALID_STUDENT_ID');
      }

      if (seenStudentIds.has(record.studentId)) {
        throw new ValidationError(
          `Duplicate student record found for student ID "${record.studentId}".`,
          'DUPLICATE_STUDENT_IN_SUBMISSION'
        );
      }
      seenStudentIds.add(record.studentId);

      const enrolled = validStudentMap.get(record.studentId);
      if (!enrolled) {
        throw new ValidationError(
          `Student with ID "${record.studentId}" is not officially enrolled in ${schedule.className} Section ${schedule.section}.`,
          'STUDENT_NOT_ENROLLED'
        );
      }

      const isAbsent = Boolean(record.isAbsent);
      let marksObtained: number | null = null;

      if (isAbsent) {
        marksObtained = null;
      } else if (record.marksObtained !== undefined && record.marksObtained !== null) {
        const num = Number(record.marksObtained);
        if (isNaN(num) || num < 0 || num > schedule.maxMarks) {
          throw new ValidationError(
            `Marks for student "${enrolled.fullName}" must be a number between 0 and maximum marks (${schedule.maxMarks}).`,
            'INVALID_MARKS'
          );
        }
        marksObtained = num;
      }

      inputStudentMap.set(record.studentId, {
        marksObtained,
        isAbsent,
        remarks: record.remarks?.trim() || '',
      });
    }

    // Index existing marks to preserve unedited students during partial updates
    const existingMap = new Map<string, { marksObtained: number | null; isAbsent: boolean; remarks: string }>();
    if (existingMarksDoc && Array.isArray(existingMarksDoc.students)) {
      for (const st of existingMarksDoc.students) {
        existingMap.set(st.studentId.toString(), {
          marksObtained: st.marksObtained ?? null,
          isAbsent: Boolean(st.isAbsent),
          remarks: st.remarks || '',
        });
      }
    }

    // Build complete official roster array preserving any unedited students
    let enteredCount = 0;
    const finalStudentRecords = enrolledStudents.map((s) => {
      const studentIdStr = s._id.toString();
      const input = inputStudentMap.get(studentIdStr);
      const existing = existingMap.get(studentIdStr);

      let marksObtained: number | null = null;
      let isAbsent = false;
      let remarks = '';

      if (input !== undefined) {
        marksObtained = input.marksObtained;
        isAbsent = input.isAbsent;
        remarks = input.remarks || '';
      } else if (existing !== undefined) {
        marksObtained = existing.marksObtained;
        isAbsent = existing.isAbsent;
        remarks = existing.remarks || '';
      }

      if (marksObtained !== null || isAbsent) {
        enteredCount++;
      }

      return {
        studentId: s._id as mongoose.Types.ObjectId,
        studentName: s.fullName,
        admissionNumber: s.studentId,
        rollNumber: s.rollNumber || '',
        marksObtained,
        isAbsent,
        remarks,
      };
    });

    const targetStatus = existingMarksDoc?.status === 'RETURNED' ? 'RETURNED' : 'DRAFT';

    await this.repo.upsertMarks(scheduleId, {
      examScheduleId: schedule._id as mongoose.Types.ObjectId,
      examId: exam._id as mongoose.Types.ObjectId,
      academicYear: schedule.academicYear,
      classId: schedule.classId,
      className: schedule.className,
      sectionId: schedule.sectionId,
      section: schedule.section,
      subject: schedule.subject,
      maxMarks: schedule.maxMarks,
      passingMarks: schedule.passingMarks,
      status: targetStatus,
      teacherUserId: teacher.userId,
      teacherId: teacher._id as mongoose.Types.ObjectId,
      teacherName: teacher.fullName,
      students: finalStudentRecords,
      totalStudents: enrolledStudents.length,
      enteredCount,
    });

    return await this.getScheduleMarks(userId, scheduleId, email);
  }

  /**
   * Submit marks for Management review
   */
  async submitMarks(
    userId: string,
    scheduleId: string,
    dto: SaveExamMarksDTO,
    email?: string
  ): Promise<TeacherExamScheduleDetailsDTO> {
    const { teacher, schedule, exam } = await this.validateTeacherScheduleAccess(userId, scheduleId, email);

    const existingMarksDoc = await this.repo.findMarksByScheduleId(scheduleId);
    if (
      existingMarksDoc &&
      (existingMarksDoc.status === 'SUBMITTED' || existingMarksDoc.status === 'PUBLISHED')
    ) {
      throw new ForbiddenError(
        'Marks have already been submitted for Management review and cannot be modified.',
        'MARKS_ALREADY_SUBMITTED'
      );
    }

    const rawRecords = dto.records || (dto as any).marks;
    if (!rawRecords || !Array.isArray(rawRecords)) {
      throw new ValidationError('Marks records array is required.', 'INVALID_PAYLOAD');
    }

    const enrolledStudents = await this.repo.findStudentsBySection(
      schedule.className,
      schedule.section,
      schedule.academicYear
    );

    if (enrolledStudents.length === 0) {
      throw new ValidationError(
        `Cannot submit marks: No enrolled students found for ${schedule.className} Section ${schedule.section}.`,
        'EMPTY_ROSTER'
      );
    }

    const validStudentMap = new Map<string, (typeof enrolledStudents)[0]>();
    enrolledStudents.forEach((s) => validStudentMap.set(s._id.toString(), s));

    const seenStudentIds = new Set<string>();
    const inputStudentMap = new Map<string, { marksObtained: number | null; isAbsent: boolean; remarks?: string }>();

    for (const record of rawRecords) {
      if (!record.studentId || !mongoose.Types.ObjectId.isValid(record.studentId)) {
        throw new ValidationError(`Invalid student ID: "${record.studentId}".`, 'INVALID_STUDENT_ID');
      }

      if (seenStudentIds.has(record.studentId)) {
        throw new ValidationError(
          `Duplicate student record found for student ID "${record.studentId}".`,
          'DUPLICATE_STUDENT_IN_SUBMISSION'
        );
      }
      seenStudentIds.add(record.studentId);

      const enrolled = validStudentMap.get(record.studentId);
      if (!enrolled) {
        throw new ValidationError(
          `Student with ID "${record.studentId}" is not officially enrolled in ${schedule.className} Section ${schedule.section}.`,
          'STUDENT_NOT_ENROLLED'
        );
      }

      const isAbsent = Boolean(record.isAbsent);
      let marksObtained: number | null = null;

      if (isAbsent) {
        marksObtained = null;
      } else if (record.marksObtained !== undefined && record.marksObtained !== null) {
        const num = Number(record.marksObtained);
        if (isNaN(num) || num < 0 || num > schedule.maxMarks) {
          throw new ValidationError(
            `Marks for student "${enrolled.fullName}" must be between 0 and maximum marks (${schedule.maxMarks}).`,
            'INVALID_MARKS'
          );
        }
        marksObtained = num;
      } else {
        throw new ValidationError(
          `Marks entry is missing for enrolled student "${enrolled.fullName}". Every student on the roster must have marks or be marked absent before submission.`,
          'MISSING_STUDENT_MARKS'
        );
      }

      inputStudentMap.set(record.studentId, {
        marksObtained,
        isAbsent,
        remarks: record.remarks?.trim() || '',
      });
    }

    // Verify all enrolled students on the roster have a complete entry
    for (const stu of enrolledStudents) {
      const studentIdStr = stu._id.toString();
      const input = inputStudentMap.get(studentIdStr);
      if (!input) {
        throw new ValidationError(
          `Missing marks entry for enrolled student "${stu.fullName}" (${stu.studentId}). Every student on the roster must have marks or be marked absent before submission.`,
          'MISSING_STUDENT_MARKS'
        );
      }
      if (!input.isAbsent && (input.marksObtained === null || input.marksObtained === undefined)) {
        throw new ValidationError(
          `Missing marks for student "${stu.fullName}". Please enter marks or mark as absent.`,
          'MISSING_STUDENT_MARKS'
        );
      }
    }

    const finalStudentRecords = enrolledStudents.map((s) => {
      const studentIdStr = s._id.toString();
      const input = inputStudentMap.get(studentIdStr)!;

      return {
        studentId: s._id as mongoose.Types.ObjectId,
        studentName: s.fullName,
        admissionNumber: s.studentId,
        rollNumber: s.rollNumber || '',
        marksObtained: input.marksObtained,
        isAbsent: input.isAbsent,
        remarks: input.remarks || '',
      };
    });

    const now = new Date();

    const history = existingMarksDoc?.reviewHistory ? [...existingMarksDoc.reviewHistory] : [];
    history.push({
      status: 'SUBMITTED',
      changedAt: now,
      changedBy: teacher.userId,
      changedByName: teacher.fullName,
      reason:
        existingMarksDoc?.status === 'RETURNED'
          ? 'Teacher resubmitted corrected marks for Management review'
          : 'Teacher submitted marks for Management review',
    });

    await this.repo.upsertMarks(scheduleId, {
      examScheduleId: schedule._id as mongoose.Types.ObjectId,
      examId: exam._id as mongoose.Types.ObjectId,
      academicYear: schedule.academicYear,
      classId: schedule.classId,
      className: schedule.className,
      sectionId: schedule.sectionId,
      section: schedule.section,
      subject: schedule.subject,
      maxMarks: schedule.maxMarks,
      passingMarks: schedule.passingMarks,
      status: 'SUBMITTED',
      teacherUserId: teacher.userId,
      teacherId: teacher._id as mongoose.Types.ObjectId,
      teacherName: teacher.fullName,
      submittedAt: now,
      submittedBy: teacher.userId,
      submittedByName: teacher.fullName,
      reviewHistory: history,
      students: finalStudentRecords,
      totalStudents: enrolledStudents.length,
      enteredCount: enrolledStudents.length,
    });

    return await this.getScheduleMarks(userId, scheduleId, email);
  }

  /**
   * Management / Admin integration: Fetch marks for review
   */
  async getManagementScheduleMarks(
    scheduleId: string
  ): Promise<TeacherExamScheduleDetailsDTO> {
    if (!scheduleId || !mongoose.Types.ObjectId.isValid(scheduleId)) {
      throw new ValidationError('Invalid examination schedule ID.');
    }

    const schedule = await this.repo.findScheduleById(scheduleId);
    if (!schedule) {
      throw new NotFoundError(`Exam schedule with ID "${scheduleId}" was not found.`);
    }

    const exam = await this.repo.findExamById(schedule.examId.toString());
    if (!exam) {
      throw new NotFoundError(`Examination associated with this schedule was not found.`);
    }

    const marksDoc = await this.repo.findMarksByScheduleId(scheduleId);
    const enrolledStudents = await this.repo.findStudentsBySection(
      schedule.className,
      schedule.section,
      schedule.academicYear
    );

    const marksMap = new Map<string, { marksObtained: number | null; isAbsent: boolean; remarks?: string }>();
    if (marksDoc && Array.isArray(marksDoc.students)) {
      marksDoc.students.forEach((s) => {
        marksMap.set(s.studentId.toString(), {
          marksObtained: s.marksObtained,
          isAbsent: s.isAbsent,
          remarks: s.remarks,
        });
      });
    }

    const studentRows: StudentRosterMarkItemDTO[] = enrolledStudents.map((stu) => {
      const studentIdStr = stu._id.toString();
      const existing = marksMap.get(studentIdStr);

      return {
        studentId: studentIdStr,
        studentName: stu.fullName,
        admissionNumber: stu.studentId,
        rollNumber: stu.rollNumber || '',
        marksObtained: existing ? existing.marksObtained : null,
        isAbsent: existing ? existing.isAbsent : false,
        remarks: existing?.remarks || '',
      };
    });

    let enteredCount = 0;
    studentRows.forEach((s) => {
      if (s.isAbsent || s.marksObtained !== null) {
        enteredCount++;
      }
    });

    const totalStudents = studentRows.length;
    const remainingCount = Math.max(0, totalStudents - enteredCount);

    const scheduleDTO: TeacherExamScheduleItemDTO = {
      id: schedule._id.toString(),
      examId: exam._id.toString(),
      examName: exam.name,
      examType: exam.examType,
      academicYear: schedule.academicYear,
      examStartDate: this.formatDateString(exam.startDate),
      examEndDate: this.formatDateString(exam.endDate),
      examDate: this.formatDateString(schedule.examDate),
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      formattedTime: `${this.formatTime12Hour(schedule.startTime)} - ${this.formatTime12Hour(schedule.endTime)}`,
      classId: schedule.classId.toString(),
      className: schedule.className,
      section: schedule.section,
      subject: schedule.subject,
      maxMarks: schedule.maxMarks,
      passingMarks: schedule.passingMarks,
      roomNumber: schedule.roomNumber || '',
      notes: schedule.notes || '',
      marksStatus: marksDoc ? marksDoc.status : 'PENDING',
      marksSubmittedAt: marksDoc?.submittedAt ? marksDoc.submittedAt.toISOString() : null,
      marksSubmittedByName: marksDoc?.submittedByName || '',
      totalStudents,
      enteredMarksCount: enteredCount,
    };

    return {
      schedule: scheduleDTO,
      isReadOnly: true,
      students: studentRows,
      summary: {
        totalStudents,
        enteredCount,
        remainingCount,
      },
    };
  }
}
