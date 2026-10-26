import mongoose from 'mongoose';
import { IRegistrationRequestRepository } from '../repositories/RegistrationRequestRepository';
import { IStudentRepository } from '../repositories/StudentRepository';
import {
  IAssignmentRepository,
  AssignmentRepository,
} from '../../teacher/repositories/AssignmentRepository';
import {
  ISubmissionRepository,
  SubmissionRepository,
} from '../../teacher/repositories/SubmissionRepository';
import {
  ISubmissionDoc,
  ISubmissionHistoryItem,
} from '../../teacher/models/Submission.model';
import {
  CreateStudentRegistrationDTO,
  StudentRegistrationResponseDTO,
  ParentDashboardResponseDTO,
  ChildProfileDTO,
  RegistrationStatus,
  StudentGender,
  ParentRelationship,
  ParentAssignmentDTO,
  ParentSubmissionStatus,
  ParentAssignmentsResponseDTO,
  ParentAssignmentsQueryDTO,
  SubmissionDetailsDTO,
  SubmitAssignmentDTO,
  ParentSubjectResultDTO,
  ParentExamCardDTO,
  ParentExamResultsQueryDTO,
  ParentExamResultsResponseDTO,
} from '../dtos/parent.dto';
import { ExamMarksModel } from '../../admin/models/ExamMarks.model';
import { ExamModel } from '../../admin/models/Exam.model';
import { ExamScheduleModel } from '../../admin/models/ExamSchedule.model';
import {
  ConflictError,
  ValidationError,
  ForbiddenError,
  NotFoundError,
} from '../../../shared/domain/errors/AppError';

export interface IParentService {
  createRegistrationRequest(
    parentId: string,
    dto: CreateStudentRegistrationDTO
  ): Promise<StudentRegistrationResponseDTO>;
  getParentDashboard(parentId: string): Promise<ParentDashboardResponseDTO>;
  getRegistrationRequests(parentId: string): Promise<StudentRegistrationResponseDTO[]>;
  getChildren(parentId: string): Promise<ChildProfileDTO[]>;
  getParentAssignments(
    parentId: string,
    query?: ParentAssignmentsQueryDTO
  ): Promise<ParentAssignmentsResponseDTO>;
  getParentAssignmentById(parentId: string, id: string): Promise<ParentAssignmentDTO>;
  submitAssignment(
    parentId: string,
    assignmentId: string,
    dto: SubmitAssignmentDTO
  ): Promise<SubmissionDetailsDTO>;
  getParentExamResults(
    parentId: string,
    query?: ParentExamResultsQueryDTO
  ): Promise<ParentExamResultsResponseDTO>;
  getSchoolMetadata(): {
    classes: string[];
    academicYears: string[];
    genders: Array<{ label: string; value: string }>;
    relationships: Array<{ label: string; value: string }>;
  };
}

export class ParentService implements IParentService {
  private readonly assignmentRepo: IAssignmentRepository;
  private readonly submissionRepo: ISubmissionRepository;

  constructor(
    private readonly registrationRequestRepo: IRegistrationRequestRepository,
    private readonly studentRepo: IStudentRepository,
    assignmentRepo?: IAssignmentRepository,
    submissionRepo?: ISubmissionRepository
  ) {
    this.assignmentRepo = assignmentRepo || new AssignmentRepository();
    this.submissionRepo = submissionRepo || new SubmissionRepository();
  }


  async createRegistrationRequest(
    parentId: string,
    dto: CreateStudentRegistrationDTO
  ): Promise<StudentRegistrationResponseDTO> {
    if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
      throw new ValidationError('Invalid parent account identification.');
    }

    // Check for duplicate pending requests
    const existingPending = await this.registrationRequestRepo.findPendingByParentAndStudent(
      parentId,
      dto.studentFullName,
      dto.requestedGrade
    );

    if (existingPending) {
      throw new ConflictError(
        `A registration request for ${dto.studentFullName} in ${dto.requestedGrade} is already pending review with the school.`
      );
    }

    const createdDoc = await this.registrationRequestRepo.create({
      parentId: new mongoose.Types.ObjectId(parentId),
      studentFullName: dto.studentFullName.trim(),
      dateOfBirth: new Date(dto.dateOfBirth),
      gender: dto.gender,
      requestedGrade: dto.requestedGrade.trim(),
      academicYear: dto.academicYear.trim(),
      previousSchool: dto.previousSchool?.trim() || '',
      previousClass: dto.previousClass?.trim() || '',
      parentRelationship: dto.parentRelationship,
      status: RegistrationStatus.PENDING,
      documents: dto.documents || [],
    });

    return {
      id: createdDoc._id.toString(),
      parentId: createdDoc.parentId.toString(),
      studentFullName: createdDoc.studentFullName,
      dateOfBirth: createdDoc.dateOfBirth.toISOString().split('T')[0],
      gender: createdDoc.gender,
      requestedGrade: createdDoc.requestedGrade,
      academicYear: createdDoc.academicYear,
      previousSchool: createdDoc.previousSchool,
      previousClass: createdDoc.previousClass,
      parentRelationship: createdDoc.parentRelationship,
      status: createdDoc.status,
      submissionDate: createdDoc.createdAt ? createdDoc.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      rejectionReason: createdDoc.rejectionReason,
      notes: createdDoc.notes,
    };
  }

  async getParentDashboard(parentId: string): Promise<ParentDashboardResponseDTO> {
    const [childrenDocs, requestDocs] = await Promise.all([
      this.studentRepo.findByParentId(parentId),
      this.registrationRequestRepo.findByParentId(parentId),
    ]);

    const children: ChildProfileDTO[] = childrenDocs.map((c) => ({
      id: c._id.toString(),
      fullName: c.fullName,
      studentId: c.studentId,
      grade: c.grade,
      section: c.section,
      classTeacher: c.classTeacher,
      status: c.status,
      avatarUrl: c.avatarUrl,
      rollNumber: c.rollNumber,
      academicYear: c.academicYear,
    }));

    const registrationRequests: StudentRegistrationResponseDTO[] = requestDocs.map((r) => ({
      id: r._id.toString(),
      parentId: r.parentId.toString(),
      studentFullName: r.studentFullName,
      dateOfBirth: r.dateOfBirth.toISOString().split('T')[0],
      gender: r.gender,
      requestedGrade: r.requestedGrade,
      academicYear: r.academicYear,
      previousSchool: r.previousSchool,
      previousClass: r.previousClass,
      parentRelationship: r.parentRelationship,
      status: r.status,
      submissionDate: r.createdAt ? r.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      rejectionReason: r.rejectionReason,
      notes: r.notes,
    }));

    return {
      children,
      registrationRequests,
      unreadNoticesCount: 0,
      upcomingActivitiesCount: 0,
    };
  }

  async getRegistrationRequests(parentId: string): Promise<StudentRegistrationResponseDTO[]> {
    const requestDocs = await this.registrationRequestRepo.findByParentId(parentId);
    return requestDocs.map((r) => ({
      id: r._id.toString(),
      parentId: r.parentId.toString(),
      studentFullName: r.studentFullName,
      dateOfBirth: r.dateOfBirth.toISOString().split('T')[0],
      gender: r.gender,
      requestedGrade: r.requestedGrade,
      academicYear: r.academicYear,
      previousSchool: r.previousSchool,
      previousClass: r.previousClass,
      parentRelationship: r.parentRelationship,
      status: r.status,
      submissionDate: r.createdAt ? r.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      rejectionReason: r.rejectionReason,
      notes: r.notes,
    }));
  }

  async getChildren(parentId: string): Promise<ChildProfileDTO[]> {
    const childrenDocs = await this.studentRepo.findByParentId(parentId);
    return childrenDocs.map((c) => ({
      id: c._id.toString(),
      fullName: c.fullName,
      studentId: c.studentId,
      grade: c.grade,
      section: c.section,
      classTeacher: c.classTeacher,
      status: c.status,
      avatarUrl: c.avatarUrl,
      rollNumber: c.rollNumber,
      academicYear: c.academicYear,
    }));
  }

  getSchoolMetadata() {
    return {
      classes: [
        'Pre-KG',
        'LKG',
        'UKG',
        'Grade 1',
        'Grade 2',
        'Grade 3',
        'Grade 4',
        'Grade 5',
        'Grade 6',
        'Grade 7',
        'Grade 8',
        'Grade 9',
        'Grade 10',
        'Grade 11',
        'Grade 12',
      ],
      academicYears: ['2026-2027', '2027-2028'],
      genders: [
        { label: 'Male', value: StudentGender.MALE },
        { label: 'Female', value: StudentGender.FEMALE },
        { label: 'Other', value: StudentGender.OTHER },
        { label: 'Prefer not to say', value: StudentGender.PREFER_NOT_TO_SAY },
      ],
      relationships: [
        { label: 'Father', value: ParentRelationship.FATHER },
        { label: 'Mother', value: ParentRelationship.MOTHER },
        { label: 'Guardian', value: ParentRelationship.GUARDIAN },
        { label: 'Other', value: ParentRelationship.OTHER },
      ],
    };
  }

  /**
   * Helper: compute due status comparing dueDate with today (YYYY-MM-DD)
   */
  private computeDueStatus(dueDate: string): 'UPCOMING' | 'DUE_TODAY' | 'OVERDUE' {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dueDate === todayStr) return 'DUE_TODAY';
    if (dueDate < todayStr) return 'OVERDUE';
    return 'UPCOMING';
  }

  /**
   * Get published assignments for a parent's enrolled child
   */
  async getParentAssignments(
    parentId: string,
    query?: ParentAssignmentsQueryDTO
  ): Promise<ParentAssignmentsResponseDTO> {
    if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
      throw new ValidationError('Invalid parent account identification.');
    }

    const childrenDocs = await this.studentRepo.findByParentId(parentId);
    const activeChildren = childrenDocs.filter((c) => c.status === 'ACTIVE');

    if (activeChildren.length === 0) {
      return {
        children: [],
        selectedChild: null,
        assignments: [],
        summary: { total: 0, upcoming: 0, dueToday: 0, overdue: 0 },
        subjects: [],
      };
    }

    let selectedChild = activeChildren[0];
    if (query?.studentId && query.studentId.trim() && query.studentId !== 'ALL') {
      const match = activeChildren.find(
        (c) => c._id.toString() === query.studentId || c.studentId === query.studentId
      );
      if (!match) {
        throw new ForbiddenError('You are not authorized to view assignments for this student.');
      }
      selectedChild = match;
    }

    const [assignmentDocs, summary, subjects] = await Promise.all([
      this.assignmentRepo.findPublishedAssignmentsByClass(
        selectedChild.grade,
        selectedChild.section,
        selectedChild.academicYear,
        {
          subject: query?.subject,
          search: query?.search,
          status: query?.status,
        }
      ),
      this.assignmentRepo.countPublishedAssignmentsByClass(
        selectedChild.grade,
        selectedChild.section,
        selectedChild.academicYear
      ),
      this.assignmentRepo.findDistinctPublishedSubjects(
        selectedChild.grade,
        selectedChild.section,
        selectedChild.academicYear
      ),
    ]);

    // Collect assignment IDs to query submissions efficiently in bulk
    const assignmentIds = assignmentDocs.map((d) => d._id.toString());
    const existingSubmissions = await this.submissionRepo.findByStudentAndAssignmentIds(
      selectedChild._id.toString(),
      assignmentIds
    );

    const submissionMap = new Map<string, ISubmissionDoc>();
    existingSubmissions.forEach((sub) => {
      submissionMap.set(sub.assignmentId.toString(), sub);
    });

    const todayStr = new Date().toISOString().split('T')[0];

    const assignments: ParentAssignmentDTO[] = assignmentDocs.map((doc) => {
      const docId = doc._id ? doc._id.toString() : (doc as any).id || '';
      const sub = submissionMap.get(docId);
      const isPastDue = doc.dueDate < todayStr;
      const allowLate = !!doc.allowLateSubmissions;
      const isGradedAndPublished = sub ? !!sub.isPublished && sub.gradingStatus === 'GRADED' : false;
      const canSubmit = !isGradedAndPublished && (!isPastDue || allowLate);
      const submissionStatus: ParentSubmissionStatus = sub
        ? isGradedAndPublished
          ? 'GRADED'
          : sub.status === 'GRADED'
          ? sub.isLate
            ? 'LATE'
            : sub.version > 1
            ? 'RESUBMITTED'
            : 'SUBMITTED'
          : sub.status
        : 'NOT_SUBMITTED';

      return {
        id: docId,
        title: doc.title,
        description: doc.description,
        subject: doc.subject,
        teacherName: doc.teacherName,
        className: doc.className,
        section: doc.section,
        academicYear: doc.academicYear,
        assignedDate: doc.assignedDate,
        dueDate: doc.dueDate,
        maxMarks: doc.maxMarks,
        status: 'PUBLISHED',
        dueStatus: this.computeDueStatus(doc.dueDate),
        submissionStatus,
        submissionTrackingAvailable: true,
        allowLateSubmissions: allowLate,
        canSubmit,
        submission: sub
          ? this.mapSubmissionDocToDTO(sub, selectedChild.fullName, isPastDue, allowLate)
          : null,
        attachmentUrl: doc.attachmentUrl || '',
        attachmentName: doc.attachmentName || '',
        createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
      };
    });

    return {
      children: activeChildren.map((c) => ({
        id: c._id.toString(),
        fullName: c.fullName,
        studentId: c.studentId,
        grade: c.grade,
        section: c.section,
        classTeacher: c.classTeacher,
        status: c.status,
        avatarUrl: c.avatarUrl,
        rollNumber: c.rollNumber,
        academicYear: c.academicYear,
      })),
      selectedChild: {
        id: selectedChild._id.toString(),
        fullName: selectedChild.fullName,
        studentId: selectedChild.studentId,
        grade: selectedChild.grade,
        section: selectedChild.section,
        classTeacher: selectedChild.classTeacher,
        status: selectedChild.status,
        avatarUrl: selectedChild.avatarUrl,
        rollNumber: selectedChild.rollNumber,
        academicYear: selectedChild.academicYear,
      },
      assignments,
      summary,
      subjects,
    };
  }

  /**
   * Get single published assignment details ensuring it matches parent's child's class
   */
  async getParentAssignmentById(parentId: string, id: string): Promise<ParentAssignmentDTO> {
    if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
      throw new ValidationError('Invalid parent account identification.');
    }
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid assignment ID format.');
    }

    const childrenDocs = await this.studentRepo.findByParentId(parentId);
    const activeChildren = childrenDocs.filter((c) => c.status === 'ACTIVE');

    if (activeChildren.length === 0) {
      throw new ForbiddenError('No enrolled students associated with this parent account.');
    }

    const assignmentDoc = await this.assignmentRepo.findPublishedById(id);
    if (!assignmentDoc) {
      throw new NotFoundError('Assignment not found.');
    }

    const matchingChild = activeChildren.find(
      (child) =>
        child.grade.trim().toLowerCase() === assignmentDoc.className.trim().toLowerCase() &&
        child.section.trim().toLowerCase() === assignmentDoc.section.trim().toLowerCase()
    );

    if (!matchingChild) {
      throw new ForbiddenError('You are not authorized to view this assignment.');
    }

    const sub = await this.submissionRepo.findByAssignmentAndStudent(
      id,
      matchingChild._id.toString()
    );

    const todayStr = new Date().toISOString().split('T')[0];
    const isPastDue = assignmentDoc.dueDate < todayStr;
    const allowLate = !!assignmentDoc.allowLateSubmissions;
    const isGradedAndPublished = sub ? !!sub.isPublished && sub.gradingStatus === 'GRADED' : false;
    const canSubmit = !isGradedAndPublished && (!isPastDue || allowLate);
    const submissionStatus: ParentSubmissionStatus = sub
      ? isGradedAndPublished
        ? 'GRADED'
        : sub.status === 'GRADED'
        ? sub.isLate
          ? 'LATE'
          : sub.version > 1
          ? 'RESUBMITTED'
          : 'SUBMITTED'
        : sub.status
      : 'NOT_SUBMITTED';

    return {
      id: assignmentDoc._id ? assignmentDoc._id.toString() : (assignmentDoc as any).id || '',
      title: assignmentDoc.title,
      description: assignmentDoc.description,
      subject: assignmentDoc.subject,
      teacherName: assignmentDoc.teacherName,
      className: assignmentDoc.className,
      section: assignmentDoc.section,
      academicYear: assignmentDoc.academicYear,
      assignedDate: assignmentDoc.assignedDate,
      dueDate: assignmentDoc.dueDate,
      maxMarks: assignmentDoc.maxMarks,
      status: 'PUBLISHED',
      dueStatus: this.computeDueStatus(assignmentDoc.dueDate),
      submissionStatus,
      submissionTrackingAvailable: true,
      allowLateSubmissions: allowLate,
      canSubmit,
      submission: sub
        ? this.mapSubmissionDocToDTO(sub, matchingChild.fullName, isPastDue, allowLate)
        : null,
      attachmentUrl: assignmentDoc.attachmentUrl || '',
      attachmentName: assignmentDoc.attachmentName || '',
      createdAt: assignmentDoc.createdAt ? assignmentDoc.createdAt.toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Submit or resubmit an assignment on behalf of an authorized enrolled child
   */
  async submitAssignment(
    parentId: string,
    assignmentId: string,
    dto: SubmitAssignmentDTO
  ): Promise<SubmissionDetailsDTO> {
    if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
      throw new ValidationError('Invalid parent account identification.');
    }
    if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw new ValidationError('Invalid assignment ID format.');
    }
    if (!dto.studentId || !mongoose.Types.ObjectId.isValid(dto.studentId)) {
      throw new ValidationError('Invalid student ID format.');
    }

    // 1. Verify parent-child relationship & active enrollment
    const student = await this.studentRepo.findById(dto.studentId);
    if (!student || student.parentId.toString() !== parentId || student.status !== 'ACTIVE') {
      throw new ForbiddenError('You are not authorized to submit assignments on behalf of this student.');
    }

    // 2. Verify assignment exists and is published
    const assignment = await this.assignmentRepo.findPublishedById(assignmentId);
    if (!assignment) {
      throw new NotFoundError('Assignment not found or is no longer published.');
    }

    // 3. Verify assignment matches student's enrolled class and section
    const isClassMatch =
      student.grade.trim().toLowerCase() === assignment.className.trim().toLowerCase() &&
      student.section.trim().toLowerCase() === assignment.section.trim().toLowerCase();

    if (!isClassMatch) {
      throw new ForbiddenError('This assignment is not assigned to your child’s class and section.');
    }

    // 4. Validate answerText and attachment
    const answerText = dto.answerText?.trim() || '';
    const attachmentUrl = dto.attachmentUrl?.trim() || '';
    const attachmentName = dto.attachmentName?.trim() || '';
    const attachmentSize = dto.attachmentSize || 0;
    const attachmentType = dto.attachmentType?.trim() || '';

    if (!answerText && !attachmentUrl) {
      throw new ValidationError('Please provide either an answer text or a file attachment.');
    }

    if (answerText.length > 5000) {
      throw new ValidationError('Answer text cannot exceed 5000 characters.');
    }

    if (attachmentUrl) {
      const allowedExts = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'];
      const fileIdentifier = (attachmentName || attachmentUrl).toLowerCase();
      const hasValidExt = allowedExts.some((ext) => fileIdentifier.includes(ext) || fileIdentifier.endsWith(ext));

      if (!hasValidExt && !attachmentUrl.startsWith('data:')) {
        throw new ValidationError('Invalid file type. Allowed formats: PDF, Word (DOC, DOCX), TXT, PNG, JPG, JPEG.');
      }

      if (attachmentSize > 10 * 1024 * 1024) {
        throw new ValidationError('Attachment file size exceeds the 10MB limit.');
      }
    }

    // 5. Check deadline and late submission rules
    const todayStr = new Date().toISOString().split('T')[0];
    const isPastDue = assignment.dueDate < todayStr;

    if (isPastDue && !assignment.allowLateSubmissions) {
      throw new ValidationError('The deadline for this assignment has passed and late submissions are not allowed.');
    }

    const isLate = isPastDue;

    // 6. Check existing submission & resubmission rules
    const existing = await this.submissionRepo.findByAssignmentAndStudent(assignmentId, dto.studentId);

    if (existing) {
      if (existing.gradingStatus === 'GRADED') {
        throw new ValidationError('This assignment has already been evaluated and graded and cannot be resubmitted.');
      }

      const historyItem: ISubmissionHistoryItem = {
        version: existing.version || 1,
        answerText: existing.answerText,
        attachmentUrl: existing.attachmentUrl,
        attachmentName: existing.attachmentName,
        attachmentSize: existing.attachmentSize,
        attachmentType: existing.attachmentType,
        submittedAt: existing.submittedAt,
        isLate: existing.isLate,
      };

      const updated = await this.submissionRepo.update(existing._id.toString(), {
        answerText,
        attachmentUrl,
        attachmentName,
        attachmentSize,
        attachmentType,
        submittedAt: new Date(),
        isLate,
        status: isLate ? 'LATE' : 'RESUBMITTED',
        version: (existing.version || 1) + 1,
        submissionHistory: [...(existing.submissionHistory || []), historyItem],
      });

      if (!updated) {
        throw new NotFoundError('Failed to update submission.');
      }

      return this.mapSubmissionDocToDTO(updated, student.fullName, isPastDue, !!assignment.allowLateSubmissions);
    }

    // 7. Create fresh submission
    const created = await this.submissionRepo.create({
      assignmentId: assignment._id,
      studentId: student._id,
      parentId: new mongoose.Types.ObjectId(parentId),
      teacherUserId: assignment.teacherUserId,
      className: student.grade,
      section: student.section,
      academicYear: assignment.academicYear,
      subject: assignment.subject,
      answerText,
      attachmentUrl,
      attachmentName,
      attachmentSize,
      attachmentType,
      submittedAt: new Date(),
      status: isLate ? 'LATE' : 'SUBMITTED',
      isLate,
      version: 1,
      submissionHistory: [],
      gradingStatus: 'PENDING',
      maxMarks: assignment.maxMarks,
    });

    return this.mapSubmissionDocToDTO(created, student.fullName, isPastDue, !!assignment.allowLateSubmissions);
  }

  private mapSubmissionDocToDTO(
    sub: ISubmissionDoc,
    studentName?: string,
    isPastDue = false,
    allowLateSubmissions = false
  ): SubmissionDetailsDTO {
    const isPublished = !!sub.isPublished;
    const marksObtained = isPublished ? (sub.marksObtained ?? undefined) : undefined;
    const feedback = isPublished ? (sub.feedback || '') : '';
    const gradingStatus = isPublished
      ? 'GRADED'
      : sub.gradingStatus === 'UNDER_REVIEW'
      ? 'UNDER_REVIEW'
      : 'PENDING';
    const status = isPublished
      ? 'GRADED'
      : sub.status === 'GRADED'
      ? (sub.isLate ? 'LATE' : (sub.version > 1 ? 'RESUBMITTED' : 'SUBMITTED'))
      : sub.status;

    return {
      id: sub._id ? sub._id.toString() : (sub as any).id || '',
      assignmentId: sub.assignmentId.toString(),
      studentId: sub.studentId.toString(),
      studentName,
      answerText: sub.answerText || '',
      attachmentUrl: sub.attachmentUrl || '',
      attachmentName: sub.attachmentName || '',
      attachmentSize: sub.attachmentSize || 0,
      attachmentType: sub.attachmentType || '',
      submittedAt: sub.submittedAt ? sub.submittedAt.toISOString() : new Date().toISOString(),
      status,
      isLate: sub.isLate,
      version: sub.version || 1,
      gradingStatus,
      marksObtained,
      maxMarks: sub.maxMarks,
      feedback,
      isPublished,
      publishedAt: isPublished && sub.publishedAt ? sub.publishedAt.toISOString() : undefined,
      canResubmit: !isPublished && (!isPastDue || allowLateSubmissions),
    };
  }

  private calculateExamGrade(percentage: number | null, isAbsent: boolean): string {
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

  async getParentExamResults(
    parentId: string,
    query?: ParentExamResultsQueryDTO
  ): Promise<ParentExamResultsResponseDTO> {
    if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
      throw new ValidationError('Invalid parent account identification.');
    }

    const childrenDocs = await this.studentRepo.findByParentId(parentId);
    const activeChildren = childrenDocs.filter((c) => c.status === 'ACTIVE');

    const childrenDTOs: ChildProfileDTO[] = activeChildren.map((c) => ({
      id: c._id.toString(),
      fullName: c.fullName,
      studentId: c.studentId,
      grade: c.grade,
      section: c.section,
      classTeacher: c.classTeacher,
      status: c.status,
      avatarUrl: c.avatarUrl,
      rollNumber: c.rollNumber,
      academicYear: c.academicYear,
    }));

    if (activeChildren.length === 0) {
      return {
        children: [],
        selectedChild: null,
        summary: {
          totalExams: 0,
          totalSubjectsPassed: 0,
          totalSubjectsFailed: 0,
          overallAveragePercentage: 0,
        },
        exams: [],
      };
    }

    let selectedChild = activeChildren[0];
    if (query?.studentId && query.studentId.trim() && query.studentId !== 'ALL') {
      const match = activeChildren.find(
        (c) => c._id.toString() === query.studentId || c.studentId === query.studentId
      );
      if (!match) {
        throw new ForbiddenError(
          'You are not authorized to view examination results for this student.'
        );
      }
      selectedChild = match;
    }

    const selectedChildDTO: ChildProfileDTO = {
      id: selectedChild._id.toString(),
      fullName: selectedChild.fullName,
      studentId: selectedChild.studentId,
      grade: selectedChild.grade,
      section: selectedChild.section,
      classTeacher: selectedChild.classTeacher,
      status: selectedChild.status,
      avatarUrl: selectedChild.avatarUrl,
      rollNumber: selectedChild.rollNumber,
      academicYear: selectedChild.academicYear,
    };

    // Query ONLY published results for this child
    const marksFilter: Record<string, any> = {
      status: 'PUBLISHED',
      $or: [
        { 'students.studentId': selectedChild._id },
        { 'students.admissionNumber': selectedChild.studentId },
      ],
    };

    if (query?.academicYear && query.academicYear !== 'ALL') {
      marksFilter.academicYear = query.academicYear.trim();
    }

    const publishedMarksDocs = await ExamMarksModel.find(marksFilter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (publishedMarksDocs.length === 0) {
      return {
        children: childrenDTOs,
        selectedChild: selectedChildDTO,
        summary: {
          totalExams: 0,
          totalSubjectsPassed: 0,
          totalSubjectsFailed: 0,
          overallAveragePercentage: 0,
        },
        exams: [],
      };
    }

    // Batch fetch associated Exams & Schedules
    const examIds = publishedMarksDocs.map((m) => m.examId);
    const scheduleIds = publishedMarksDocs.map((m) => m.examScheduleId);

    const [exams, schedules] = await Promise.all([
      ExamModel.find({ _id: { $in: examIds } }).lean().exec(),
      ExamScheduleModel.find({ _id: { $in: scheduleIds } }).lean().exec(),
    ]);

    const examMap = new Map<string, any>();
    exams.forEach((e) => examMap.set(e._id.toString(), e));

    const scheduleMap = new Map<string, any>();
    schedules.forEach((s) => scheduleMap.set(s._id.toString(), s));

    // Group subjects by Exam
    const examGroups = new Map<
      string,
      {
        examId: string;
        examName: string;
        examType: string;
        academicYear: string;
        subjects: ParentSubjectResultDTO[];
      }
    >();

    for (const mDoc of publishedMarksDocs) {
      const exam = examMap.get(mDoc.examId.toString());
      const schedule = scheduleMap.get(mDoc.examScheduleId.toString());
      const examIdStr = mDoc.examId.toString();

      // Find the student's entry in marksDoc.students
      const studentEntry = (mDoc.students || []).find(
        (s: any) =>
          (s.studentId && s.studentId.toString() === selectedChild._id.toString()) ||
          s.admissionNumber === selectedChild.studentId
      );

      if (!studentEntry) continue;

      const isAbsent = !!studentEntry.isAbsent;
      const marksObtained =
        studentEntry.marksObtained !== null && studentEntry.marksObtained !== undefined
          ? studentEntry.marksObtained
          : null;
      const maxMarks = schedule?.maxMarks || mDoc.maxMarks || 100;
      const passingMarks = schedule?.passingMarks || mDoc.passingMarks || 40;

      let percentage: number | null = null;
      let isPassed = false;
      let grade = 'AB';

      if (!isAbsent && marksObtained !== null) {
        percentage = Math.round((marksObtained / maxMarks) * 100 * 10) / 10;
        isPassed = marksObtained >= passingMarks;
        grade = this.calculateExamGrade(percentage, false);
      }

      const examDateStr = schedule?.examDate
        ? new Date(schedule.examDate).toISOString().split('T')[0]
        : '';

      const subjectResult: ParentSubjectResultDTO = {
        scheduleId: mDoc.examScheduleId.toString(),
        examId: examIdStr,
        examName: exam?.name || 'Examination',
        examType: exam?.examType || 'REGULAR',
        subject: mDoc.subject,
        examDate: examDateStr,
        maxMarks,
        passingMarks,
        marksObtained,
        isAbsent,
        percentage,
        grade,
        isPassed,
        remarks: studentEntry.remarks || '',
        publishedAt: mDoc.publishedAt ? new Date(mDoc.publishedAt).toISOString() : null,
      };

      if (!examGroups.has(examIdStr)) {
        let examDateDisplay = '';
        if (exam?.startDate) {
          const s = new Date(exam.startDate).toISOString().split('T')[0];
          const e = exam.endDate ? new Date(exam.endDate).toISOString().split('T')[0] : '';
          examDateDisplay = e && e !== s ? `${s} to ${e}` : s;
        } else if (schedule?.examDate) {
          examDateDisplay = new Date(schedule.examDate).toISOString().split('T')[0];
        }

        examGroups.set(examIdStr, {
          examId: examIdStr,
          examName: exam?.name || 'Examination',
          examType: exam?.examType || 'REGULAR',
          academicYear: mDoc.academicYear,
          examDate: examDateDisplay,
          publishedAt: mDoc.publishedAt ? new Date(mDoc.publishedAt).toISOString() : null,
          subjects: [],
        });
      }

      const grp = examGroups.get(examIdStr)!;
      if (mDoc.publishedAt) {
        const pDate = new Date(mDoc.publishedAt);
        if (!grp.publishedAt || new Date(grp.publishedAt) < pDate) {
          grp.publishedAt = pDate.toISOString();
        }
      }
      grp.subjects.push(subjectResult);
    }

    const examCards: ParentExamCardDTO[] = [];
    let totalSubjectsPassed = 0;
    let totalSubjectsFailed = 0;
    let sumPercentages = 0;
    let percentageCount = 0;

    for (const group of examGroups.values()) {
      let examMaxMarks = 0;
      let examObtainedMarks = 0;
      let examPassed = true;

      for (const subj of group.subjects) {
        examMaxMarks += subj.maxMarks;
        if (subj.marksObtained !== null && !subj.isAbsent) {
          examObtainedMarks += subj.marksObtained;
        }
        if (subj.isPassed) {
          totalSubjectsPassed++;
        } else {
          totalSubjectsFailed++;
          examPassed = false;
        }

        if (subj.percentage !== null) {
          sumPercentages += subj.percentage;
          percentageCount++;
        }
      }

      const overallPercentage =
        examMaxMarks > 0
          ? Math.round((examObtainedMarks / examMaxMarks) * 100 * 10) / 10
          : 0;
      const overallGrade = this.calculateExamGrade(overallPercentage, false);

      examCards.push({
        examId: group.examId,
        examName: group.examName,
        examType: group.examType,
        academicYear: group.academicYear,
        examDate: group.examDate,
        publishedAt: group.publishedAt,
        totalSubjects: group.subjects.length,
        totalMaxMarks: examMaxMarks,
        totalObtainedMarks: examObtainedMarks,
        overallPercentage,
        overallGrade,
        isPassed: examPassed,
        subjects: group.subjects,
      });
    }

    let filteredExamCards = examCards;
    if (query?.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      filteredExamCards = examCards.filter(
        (card) =>
          card.examName.toLowerCase().includes(q) ||
          card.examType.toLowerCase().includes(q) ||
          card.subjects.some((s) => s.subject.toLowerCase().includes(q))
      );
    }

    const overallAveragePercentage =
      percentageCount > 0
        ? Math.round((sumPercentages / percentageCount) * 10) / 10
        : 0;

    return {
      children: childrenDTOs,
      selectedChild: selectedChildDTO,
      summary: {
        totalExams: filteredExamCards.length,
        totalSubjectsPassed,
        totalSubjectsFailed,
        overallAveragePercentage,
      },
      exams: filteredExamCards,
    };
  }
}

