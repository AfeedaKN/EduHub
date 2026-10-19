import mongoose from 'mongoose';
import { IAssignmentRepository } from '../repositories/AssignmentRepository';
import {
  ISubmissionRepository,
  SubmissionRepository,
} from '../repositories/SubmissionRepository';
import {
  AssignmentDTO,
  AssignmentsListResponseDTO,
  CreateAssignmentDTO,
  UpdateAssignmentDTO,
  AssignmentFilterParamsDTO,
  AssignmentSummaryStatsDTO,
  TeacherSubmissionItemDTO,
  GradeSubmissionDTO,
} from '../dtos/assignment.dto';
import { IAssignmentDoc, AssignmentStatus } from '../models/Assignment.model';
import {
  ValidationError,
  ForbiddenError,
  UnauthorizedError,
  NotFoundError,
} from '../../../shared/domain/errors/AppError';

export class AssignmentService {
  private readonly submissionRepo: ISubmissionRepository;

  constructor(
    private readonly assignmentRepo: IAssignmentRepository,
    submissionRepo?: ISubmissionRepository
  ) {
    this.submissionRepo = submissionRepo || new SubmissionRepository();
  }

  /**
   * Helper: validates that the teacher exists, is active, and is assigned to the specified class, section, and subject.
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

    const teacher = await this.assignmentRepo.findTeacherByUserId(userId);
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
        `You are not authorized to create or manage assignments for ${className} Section ${section} (${subject}).`,
        'FORBIDDEN_CLASS_ASSIGNMENT'
      );
    }

    return { teacher, matchedAssignment };
  }

  /**
   * Helper: validates and formats dates (YYYY-MM-DD), ensuring dueDate >= assignedDate
   */
  private validateDates(assignedDateStr?: string, dueDateStr?: string): { assignedDate: string; dueDate: string } {
    const todayStr = new Date().toISOString().split('T')[0];
    const assignedDate = assignedDateStr && assignedDateStr.trim() ? assignedDateStr.trim() : todayStr;

    if (!dueDateStr || !dueDateStr.trim()) {
      throw new ValidationError('Due date is required.');
    }

    const dueDate = dueDateStr.trim();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(assignedDate)) {
      throw new ValidationError('Assigned date must be formatted as YYYY-MM-DD.');
    }
    if (!dateRegex.test(dueDate)) {
      throw new ValidationError('Due date must be formatted as YYYY-MM-DD.');
    }

    if (dueDate < assignedDate) {
      throw new ValidationError('Due date cannot be earlier than assigned date.');
    }

    return { assignedDate, dueDate };
  }

  /**
   * Helper: formats IAssignmentDoc to AssignmentDTO
   */
  private toDTO(
    doc: IAssignmentDoc,
    stats?: { total: number; pending: number; graded: number }
  ): AssignmentDTO {
    return {
      id: doc._id ? doc._id.toString() : (doc as any).id || '',
      title: doc.title,
      description: doc.description,
      teacherId: doc.teacherId ? doc.teacherId.toString() : '',
      teacherUserId: doc.teacherUserId ? doc.teacherUserId.toString() : '',
      teacherName: doc.teacherName,
      classId: doc.classId ? doc.classId.toString() : undefined,
      className: doc.className,
      section: doc.section,
      subject: doc.subject,
      academicYear: doc.academicYear,
      assignedDate: doc.assignedDate,
      dueDate: doc.dueDate,
      maxMarks: doc.maxMarks,
      status: doc.status,
      attachmentUrl: doc.attachmentUrl || '',
      attachmentName: doc.attachmentName || '',
      submissionStats: stats || { total: 0, pending: 0, graded: 0 },
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  /**
   * List assignments for the authenticated teacher with filters and summary counts
   */
  async getAssignments(
    userId: string,
    filter?: AssignmentFilterParamsDTO
  ): Promise<AssignmentsListResponseDTO> {
    const teacher = await this.assignmentRepo.findTeacherByUserId(userId);
    if (!teacher) {
      return {
        assignments: [],
        summary: { total: 0, published: 0, drafts: 0, pastDue: 0 },
      };
    }

    const [docs, summary] = await Promise.all([
      this.assignmentRepo.findAssignmentsByTeacher(userId, filter),
      this.assignmentRepo.countTeacherAssignments(userId, filter?.academicYear),
    ]);

    const assignmentIds = docs.map((d) => (d._id ? d._id.toString() : (d as any).id || ''));
    const statsMap = await this.submissionRepo.getSubmissionStatsByAssignmentIds(assignmentIds);

    return {
      assignments: docs.map((d) => {
        const id = d._id ? d._id.toString() : (d as any).id || '';
        return this.toDTO(d, statsMap[id]);
      }),
      summary,
    };
  }

  /**
   * Get single assignment by ID with authorization verification
   */
  async getAssignmentById(userId: string, id: string): Promise<AssignmentDTO> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid assignment ID format.');
    }

    const doc = await this.assignmentRepo.findById(id);
    if (!doc) {
      throw new NotFoundError('Assignment not found.');
    }

    // Security: verify assignment belongs to logged in teacher
    if (doc.teacherUserId.toString() !== userId) {
      throw new ForbiddenError('You do not have permission to view this assignment.');
    }

    const stats = await this.submissionRepo.countByAssignmentId(id);
    return this.toDTO(doc, stats);
  }

  /**
   * Create a new assignment
   */
  async createAssignment(userId: string, payload: CreateAssignmentDTO): Promise<AssignmentDTO> {
    if (!payload.title || !payload.title.trim()) {
      throw new ValidationError('Assignment title is required.');
    }
    if (!payload.description || !payload.description.trim()) {
      throw new ValidationError('Assignment instructions or description is required.');
    }
    if (payload.maxMarks === undefined || payload.maxMarks === null || Number(payload.maxMarks) <= 0) {
      throw new ValidationError('Maximum marks must be a positive number greater than 0.');
    }

    const { teacher, matchedAssignment } = await this.validateTeacherAssignment(
      userId,
      payload.className,
      payload.section,
      payload.subject
    );

    const { assignedDate, dueDate } = this.validateDates(payload.assignedDate, payload.dueDate);

    const academicYear =
      payload.academicYear && payload.academicYear.trim()
        ? payload.academicYear.trim()
        : matchedAssignment.academicYear || '2026-2027';

    const status: AssignmentStatus = payload.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED';

    const created = await this.assignmentRepo.create({
      title: payload.title.trim(),
      description: payload.description.trim(),
      teacherId: teacher._id,
      teacherUserId: new mongoose.Types.ObjectId(userId),
      teacherName: teacher.fullName,
      classId: matchedAssignment.classId || (payload.classId ? new mongoose.Types.ObjectId(payload.classId) : undefined),
      className: payload.className.trim(),
      section: payload.section.trim().toUpperCase(),
      subject: payload.subject.trim(),
      academicYear,
      assignedDate,
      dueDate,
      maxMarks: Number(payload.maxMarks),
      status,
      attachmentUrl: payload.attachmentUrl?.trim() || '',
      attachmentName: payload.attachmentName?.trim() || '',
    });

    return this.toDTO(created);
  }

  /**
   * Update an existing assignment
   */
  async updateAssignment(
    userId: string,
    id: string,
    payload: UpdateAssignmentDTO
  ): Promise<AssignmentDTO> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid assignment ID format.');
    }

    const doc = await this.assignmentRepo.findById(id);
    if (!doc) {
      throw new NotFoundError('Assignment not found.');
    }

    // Security: verify assignment belongs to logged in teacher
    if (doc.teacherUserId.toString() !== userId) {
      throw new ForbiddenError('You do not have permission to modify this assignment.');
    }

    const className = payload.className !== undefined ? payload.className : doc.className;
    const section = payload.section !== undefined ? payload.section : doc.section;
    const subject = payload.subject !== undefined ? payload.subject : doc.subject;

    // Validate class assignment authorization if class/section/subject is being updated
    await this.validateTeacherAssignment(userId, className, section, subject);

    if (payload.title !== undefined && (!payload.title || !payload.title.trim())) {
      throw new ValidationError('Assignment title cannot be empty.');
    }
    if (payload.description !== undefined && (!payload.description || !payload.description.trim())) {
      throw new ValidationError('Assignment instructions cannot be empty.');
    }
    if (payload.maxMarks !== undefined && Number(payload.maxMarks) <= 0) {
      throw new ValidationError('Maximum marks must be a positive number greater than 0.');
    }

    const assignedDate = payload.assignedDate !== undefined ? payload.assignedDate : doc.assignedDate;
    const dueDate = payload.dueDate !== undefined ? payload.dueDate : doc.dueDate;
    const { assignedDate: validAssigned, dueDate: validDue } = this.validateDates(assignedDate, dueDate);

    const updateData: Partial<IAssignmentDoc> = {};
    if (payload.title !== undefined) updateData.title = payload.title.trim();
    if (payload.description !== undefined) updateData.description = payload.description.trim();
    if (payload.className !== undefined) updateData.className = payload.className.trim();
    if (payload.section !== undefined) updateData.section = payload.section.trim().toUpperCase();
    if (payload.subject !== undefined) updateData.subject = payload.subject.trim();
    if (payload.academicYear !== undefined) updateData.academicYear = payload.academicYear.trim();
    if (payload.maxMarks !== undefined) updateData.maxMarks = Number(payload.maxMarks);
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.attachmentUrl !== undefined) updateData.attachmentUrl = payload.attachmentUrl.trim();
    if (payload.attachmentName !== undefined) updateData.attachmentName = payload.attachmentName.trim();
    updateData.assignedDate = validAssigned;
    updateData.dueDate = validDue;

    const updated = await this.assignmentRepo.update(id, updateData);
    if (!updated) {
      throw new NotFoundError('Assignment could not be updated.');
    }

    return this.toDTO(updated);
  }

  /**
   * Update assignment status (e.g. toggle between PUBLISHED and DRAFT)
   */
  async updateStatus(
    userId: string,
    id: string,
    status: AssignmentStatus
  ): Promise<AssignmentDTO> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid assignment ID format.');
    }
    if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
      throw new ValidationError('Invalid status value. Must be DRAFT, PUBLISHED, or ARCHIVED.');
    }

    const doc = await this.assignmentRepo.findById(id);
    if (!doc) {
      throw new NotFoundError('Assignment not found.');
    }

    if (doc.teacherUserId.toString() !== userId) {
      throw new ForbiddenError('You do not have permission to modify this assignment.');
    }

    const updated = await this.assignmentRepo.update(id, { status });
    if (!updated) {
      throw new NotFoundError('Assignment could not be updated.');
    }

    return this.toDTO(updated);
  }

  /**
   * Delete an assignment
   */
  async deleteAssignment(userId: string, id: string): Promise<boolean> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid assignment ID format.');
    }

    const doc = await this.assignmentRepo.findById(id);
    if (!doc) {
      throw new NotFoundError('Assignment not found.');
    }

    // Security: verify assignment belongs to logged in teacher
    if (doc.teacherUserId.toString() !== userId) {
      throw new ForbiddenError('You do not have permission to delete this assignment.');
    }

    return await this.assignmentRepo.delete(id);
  }

  /**
   * Get all student submissions for an assignment (Teacher view)
   */
  async getSubmissionsForAssignment(
    userId: string,
    assignmentId: string
  ): Promise<TeacherSubmissionItemDTO[]> {
    if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw new ValidationError('Invalid assignment ID format.');
    }

    const doc = await this.assignmentRepo.findById(assignmentId);
    if (!doc) {
      throw new NotFoundError('Assignment not found.');
    }

    if (doc.teacherUserId.toString() !== userId) {
      throw new ForbiddenError('You do not have permission to view submissions for this assignment.');
    }

    const submissions = await this.submissionRepo.findByAssignmentId(assignmentId);
    return submissions.map((s) => ({
      id: s._id ? s._id.toString() : (s as any).id || '',
      assignmentId: s.assignmentId.toString(),
      studentId: s.studentId ? (s.studentId as any)._id?.toString() || s.studentId.toString() : '',
      studentName: (s.studentId as any)?.fullName || '',
      studentRollNumber: (s.studentId as any)?.rollNumber || '',
      studentAdmissionNumber: (s.studentId as any)?.studentId || '',
      studentAvatarUrl: (s.studentId as any)?.avatarUrl || '',
      answerText: s.answerText || '',
      attachmentUrl: s.attachmentUrl || '',
      attachmentName: s.attachmentName || '',
      attachmentSize: s.attachmentSize || 0,
      attachmentType: s.attachmentType || '',
      submittedAt: s.submittedAt ? s.submittedAt.toISOString() : new Date().toISOString(),
      status: s.status,
      isLate: s.isLate,
      version: s.version || 1,
      gradingStatus: s.gradingStatus,
      marksObtained: s.marksObtained ?? null,
      maxMarks: s.maxMarks,
      feedback: s.feedback || '',
      isPublished: !!s.isPublished,
      publishedAt: s.publishedAt ? s.publishedAt.toISOString() : null,
      gradedAt: s.gradedAt ? s.gradedAt.toISOString() : null,
      gradedBy: s.gradedBy ? s.gradedBy.toString() : null,
      gradingHistory: (s.gradingHistory || []).map((h) => ({
        marksObtained: h.marksObtained,
        maxMarks: h.maxMarks,
        feedback: h.feedback || '',
        gradedBy: h.gradedBy ? h.gradedBy.toString() : '',
        gradedAt: h.gradedAt ? h.gradedAt.toISOString() : new Date().toISOString(),
        isPublished: !!h.isPublished,
        action: h.action,
      })),
    }));
  }

  /**
   * Grade or review a student's submission
   */
  async gradeSubmission(
    userId: string,
    assignmentId: string,
    submissionId: string,
    payload: GradeSubmissionDTO
  ): Promise<TeacherSubmissionItemDTO> {
    if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw new ValidationError('Invalid assignment ID format.');
    }
    if (!submissionId || !mongoose.Types.ObjectId.isValid(submissionId)) {
      throw new ValidationError('Invalid submission ID format.');
    }

    const assignmentDoc = await this.assignmentRepo.findById(assignmentId);
    if (!assignmentDoc) {
      throw new NotFoundError('Assignment not found.');
    }

    // Security check 1: verify assignment belongs to authenticated teacher
    if (assignmentDoc.teacherUserId.toString() !== userId) {
      throw new ForbiddenError('You do not have permission to grade submissions for this assignment.');
    }

    // Security check 2: verify teacher is actively assigned to the class, section, and subject
    await this.validateTeacherAssignment(
      userId,
      assignmentDoc.className,
      assignmentDoc.section,
      assignmentDoc.subject
    );

    const submissionDoc = await this.submissionRepo.findByAssignmentAndId(assignmentId, submissionId);
    if (!submissionDoc) {
      throw new NotFoundError('Submission not found for this assignment.');
    }

    // Marks validation
    if (
      payload.marksObtained === undefined ||
      payload.marksObtained === null ||
      typeof payload.marksObtained !== 'number' ||
      isNaN(payload.marksObtained)
    ) {
      throw new ValidationError('Marks awarded must be a valid number.');
    }

    if (payload.marksObtained < 0 || payload.marksObtained > assignmentDoc.maxMarks) {
      throw new ValidationError(
        `Marks must be between 0 and the assignment maximum marks (${assignmentDoc.maxMarks}).`
      );
    }

    // Feedback length limit validation
    const feedback = payload.feedback ? payload.feedback.trim() : '';
    if (feedback.length > 2000) {
      throw new ValidationError('Teacher feedback cannot exceed 2000 characters.');
    }

    const isPublish = !!payload.publishResult;
    const action = isPublish
      ? submissionDoc.isPublished
        ? 'UPDATED'
        : 'PUBLISHED'
      : 'DRAFT_SAVED';

    const historyItem = {
      marksObtained: payload.marksObtained,
      maxMarks: assignmentDoc.maxMarks,
      feedback,
      gradedBy: new mongoose.Types.ObjectId(userId),
      gradedAt: new Date(),
      isPublished: isPublish,
      action,
    };

    const updatedDoc = await this.submissionRepo.update(submissionId, {
      marksObtained: payload.marksObtained,
      feedback,
      gradedBy: new mongoose.Types.ObjectId(userId),
      gradedAt: new Date(),
      gradingStatus: isPublish ? 'GRADED' : 'UNDER_REVIEW',
      status: isPublish ? 'GRADED' : 'UNDER_REVIEW',
      isPublished: isPublish,
      publishedAt: isPublish ? submissionDoc.publishedAt || new Date() : null,
      gradingHistory: [...(submissionDoc.gradingHistory || []), historyItem as any],
    });

    if (!updatedDoc) {
      throw new NotFoundError('Submission could not be updated.');
    }

    // Refetch or use existing populated student information
    const populated = await this.submissionRepo.findByAssignmentAndId(assignmentId, submissionId);
    const studentInfo = (populated?.studentId as any) || (submissionDoc.studentId as any);

    return {
      id: updatedDoc._id ? updatedDoc._id.toString() : (updatedDoc as any).id || '',
      assignmentId: updatedDoc.assignmentId.toString(),
      studentId: studentInfo?._id ? studentInfo._id.toString() : updatedDoc.studentId.toString(),
      studentName: studentInfo?.fullName || '',
      studentRollNumber: studentInfo?.rollNumber || '',
      studentAdmissionNumber: studentInfo?.studentId || '',
      studentAvatarUrl: studentInfo?.avatarUrl || '',
      answerText: updatedDoc.answerText || '',
      attachmentUrl: updatedDoc.attachmentUrl || '',
      attachmentName: updatedDoc.attachmentName || '',
      attachmentSize: updatedDoc.attachmentSize || 0,
      attachmentType: updatedDoc.attachmentType || '',
      submittedAt: updatedDoc.submittedAt ? updatedDoc.submittedAt.toISOString() : new Date().toISOString(),
      status: updatedDoc.status,
      isLate: updatedDoc.isLate,
      version: updatedDoc.version || 1,
      gradingStatus: updatedDoc.gradingStatus,
      marksObtained: updatedDoc.marksObtained ?? null,
      maxMarks: updatedDoc.maxMarks,
      feedback: updatedDoc.feedback || '',
      isPublished: !!updatedDoc.isPublished,
      publishedAt: updatedDoc.publishedAt ? updatedDoc.publishedAt.toISOString() : null,
      gradedAt: updatedDoc.gradedAt ? updatedDoc.gradedAt.toISOString() : null,
      gradedBy: updatedDoc.gradedBy ? updatedDoc.gradedBy.toString() : null,
      gradingHistory: (updatedDoc.gradingHistory || []).map((h) => ({
        marksObtained: h.marksObtained,
        maxMarks: h.maxMarks,
        feedback: h.feedback || '',
        gradedBy: h.gradedBy ? h.gradedBy.toString() : '',
        gradedAt: h.gradedAt ? h.gradedAt.toISOString() : new Date().toISOString(),
        isPublished: !!h.isPublished,
        action: h.action,
      })),
    };
  }
}
