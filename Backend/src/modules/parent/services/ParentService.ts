import mongoose from 'mongoose';
import { IRegistrationRequestRepository } from '../repositories/RegistrationRequestRepository';
import { IStudentRepository } from '../repositories/StudentRepository';
import { IStudentDoc } from '../models/Student.model';
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
  IStudyMaterialRepository,
  StudyMaterialRepository,
} from '../../teacher/repositories/StudyMaterialRepository';
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
  ParentStudyMaterialItemDTO,
  ParentStudyMaterialsQueryDTO,
  ParentStudyMaterialsResponseDTO,
  ParentInvoiceDTO,
  ParentFeeAssignmentDTO,
  ParentFeeInvoicesQueryDTO,
  ParentFeeInvoicesResponseDTO,
  CreateOnlinePaymentOrderDTO,
  OnlinePaymentOrderResponseDTO,
  VerifyOnlinePaymentDTO,
  ParentPaymentItemDTO,
  ParentPaymentHistoryResponseDTO,
} from '../dtos/parent.dto';
import { ExamMarksModel } from '../../admin/models/ExamMarks.model';
import { ExamModel } from '../../admin/models/Exam.model';
import { ExamScheduleModel } from '../../admin/models/ExamSchedule.model';
import { FeeInvoiceModel } from '../../admin/models/FeeInvoice.model';
import { FeePaymentModel } from '../../admin/models/FeePayment.model';
import { StudentFeeAssignmentModel } from '../../admin/models/StudentFeeAssignment.model';
import { FeeStructureModel } from '../../admin/models/FeeStructure.model';
import { FeeCategoryModel } from '../../admin/models/FeeCategory.model';
import { FeeOnlineOrderModel } from '../models/FeeOnlineOrder.model';
import { UserModel } from '../../auth/models/User.model';
import { RazorpayService, IRazorpayService } from './RazorpayService';
import { AdminFeeRepository, IAdminFeeRepository } from '../../admin/repositories/AdminFeeRepository';
import { AdminFeeService } from '../../admin/services/AdminFeeService';
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
  getParentStudyMaterials(
    parentId: string,
    query?: ParentStudyMaterialsQueryDTO
  ): Promise<ParentStudyMaterialsResponseDTO>;
  getParentFeeInvoices(
    parentId: string,
    query?: ParentFeeInvoicesQueryDTO
  ): Promise<ParentFeeInvoicesResponseDTO>;
  getParentFeeInvoiceDetails(
    parentId: string,
    invoiceId: string
  ): Promise<ParentInvoiceDTO>;
  getPaymentConfig(): { keyId: string; currency: string; isTestMode: boolean };
  createOnlinePaymentOrder(
    parentId: string,
    dto: CreateOnlinePaymentOrderDTO
  ): Promise<OnlinePaymentOrderResponseDTO>;
  verifyOnlinePayment(
    parentId: string,
    dto: VerifyOnlinePaymentDTO
  ): Promise<{ payment: ParentPaymentItemDTO; receiptNumber: string; invoice: ParentInvoiceDTO }>;
  handlePaymentWebhook(
    rawBody: string,
    signature: string,
    payload: any
  ): Promise<{ handled: boolean; event: string; orderId?: string }>;
  getParentPayments(
    parentId: string,
    query?: { studentId?: string; academicYear?: string }
  ): Promise<ParentPaymentHistoryResponseDTO>;
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
  private readonly studyMaterialRepo: IStudyMaterialRepository;
  private readonly razorpayService: IRazorpayService;
  private readonly adminFeeRepo: IAdminFeeRepository;
  private readonly adminFeeService: AdminFeeService;

  constructor(
    private readonly registrationRequestRepo: IRegistrationRequestRepository,
    private readonly studentRepo: IStudentRepository,
    assignmentRepo?: IAssignmentRepository,
    submissionRepo?: ISubmissionRepository,
    studyMaterialRepo?: IStudyMaterialRepository,
    razorpayService?: IRazorpayService,
    adminFeeRepo?: IAdminFeeRepository,
    adminFeeService?: AdminFeeService
  ) {
    this.assignmentRepo = assignmentRepo || new AssignmentRepository();
    this.submissionRepo = submissionRepo || new SubmissionRepository();
    this.studyMaterialRepo = studyMaterialRepo || new StudyMaterialRepository();
    this.razorpayService = razorpayService || new RazorpayService();
    this.adminFeeRepo = adminFeeRepo || new AdminFeeRepository();
    this.adminFeeService = adminFeeService || new AdminFeeService(this.adminFeeRepo);
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
   * Helper: compute remaining time days & human label
   */
  private computeRemainingInfo(dueDate: string): { remainingDays: number; remainingText: string } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { remainingDays: 0, remainingText: 'Due today' };
    } else if (diffDays === 1) {
      return { remainingDays: 1, remainingText: 'Due tomorrow (1 day left)' };
    } else if (diffDays > 1) {
      return { remainingDays: diffDays, remainingText: `${diffDays} days remaining` };
    } else if (diffDays === -1) {
      return { remainingDays: -1, remainingText: 'Overdue by 1 day' };
    } else {
      return { remainingDays: diffDays, remainingText: `Overdue by ${Math.abs(diffDays)} days` };
    }
  }

  /**
   * Get published assignments for a parent's enrolled child or all children
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
        summary: { total: 0, pending: 0, submitted: 0, overdue: 0, upcoming: 0, dueToday: 0 },
        subjects: [],
      };
    }

    const isAll = query?.studentId === 'ALL';
    let selectedChild: any = null;

    if (!isAll && query?.studentId && query.studentId.trim()) {
      const match = activeChildren.find(
        (c) => c._id.toString() === query.studentId || c.studentId === query.studentId
      );
      if (!match) {
        throw new ForbiddenError('You are not authorized to view assignments for this student.');
      }
      selectedChild = match;
    } else if (!isAll) {
      selectedChild = activeChildren[0];
    }

    let assignmentDocs: any[] = [];
    let subjects: string[] = [];
    let existingSubmissions: any[] = [];

    // Filter params for backend repo query (filter by deadline status if UPCOMING/DUE_TODAY/OVERDUE)
    const effectiveStatus = query?.dueDate || (query?.status && ['UPCOMING', 'DUE_TODAY', 'OVERDUE'].includes(query.status.toUpperCase()) ? query.status : undefined);

    if (selectedChild) {
      const [docs, distinctSubjects] = await Promise.all([
        this.assignmentRepo.findPublishedAssignmentsByClass(
          selectedChild.grade,
          selectedChild.section,
          selectedChild.academicYear,
          {
            subject: query?.subject,
            search: query?.search,
            status: effectiveStatus,
          }
        ),
        this.assignmentRepo.findDistinctPublishedSubjects(
          selectedChild.grade,
          selectedChild.section,
          selectedChild.academicYear
        ),
      ]);
      assignmentDocs = docs;
      subjects = distinctSubjects;

      const assignmentIds = assignmentDocs.map((d) => d._id ? d._id.toString() : (d as any).id || '');
      existingSubmissions = await this.submissionRepo.findByStudentAndAssignmentIds(
        selectedChild._id.toString(),
        assignmentIds
      );
    } else {
      // isAll === true: Query published assignments across all active children of the parent
      const classFilters = activeChildren.map((c) => ({
        className: c.grade,
        section: c.section,
        academicYear: c.academicYear,
      }));

      if (this.assignmentRepo.findPublishedAssignmentsForClasses) {
        assignmentDocs = await this.assignmentRepo.findPublishedAssignmentsForClasses(classFilters, {
          subject: query?.subject,
          search: query?.search,
          status: effectiveStatus,
        });
      } else {
        const allDocsArrays = await Promise.all(
          activeChildren.map((c) =>
            this.assignmentRepo.findPublishedAssignmentsByClass(c.grade, c.section, c.academicYear, {
              subject: query?.subject,
              search: query?.search,
              status: effectiveStatus,
            })
          )
        );
        const map = new Map<string, any>();
        allDocsArrays.flat().forEach((d) => map.set(d._id.toString(), d));
        assignmentDocs = Array.from(map.values());
      }

      if (this.assignmentRepo.findDistinctPublishedSubjectsForClasses) {
        subjects = await this.assignmentRepo.findDistinctPublishedSubjectsForClasses(classFilters);
      } else {
        const allSubs = await Promise.all(
          activeChildren.map((c) =>
            this.assignmentRepo.findDistinctPublishedSubjects(c.grade, c.section, c.academicYear)
          )
        );
        subjects = Array.from(new Set(allSubs.flat())).filter(Boolean);
      }

      const assignmentIds = assignmentDocs.map((d) => d._id ? d._id.toString() : (d as any).id || '');
      const studentIds = activeChildren.map((c) => c._id.toString());
      if (this.submissionRepo.findByStudentIdsAndAssignmentIds) {
        existingSubmissions = await this.submissionRepo.findByStudentIdsAndAssignmentIds(
          studentIds,
          assignmentIds
        );
      } else {
        const subsArrays = await Promise.all(
          studentIds.map((sid) => this.submissionRepo.findByStudentAndAssignmentIds(sid, assignmentIds))
        );
        existingSubmissions = subsArrays.flat();
      }
    }

    const submissionMap = new Map<string, ISubmissionDoc>();
    existingSubmissions.forEach((sub) => {
      submissionMap.set(sub.assignmentId.toString(), sub);
    });

    const todayStr = new Date().toISOString().split('T')[0];

    // Helper map from class+section to child for labeling
    const childByClassSection = new Map<string, any>();
    activeChildren.forEach((c) => {
      const key = `${c.grade.trim().toLowerCase()}_${c.section.trim().toLowerCase()}`;
      childByClassSection.set(key, c);
    });

    let total = 0;
    let submitted = 0;
    let pending = 0;
    let overdue = 0;
    let upcoming = 0;
    let dueToday = 0;

    const allMappedAssignments: ParentAssignmentDTO[] = assignmentDocs.map((doc) => {
      const docId = doc._id ? doc._id.toString() : (doc as any).id || '';
      const sub = submissionMap.get(docId);
      const isPastDue = doc.dueDate < todayStr;
      const isToday = doc.dueDate === todayStr;
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

      const hasSubmitted = sub && submissionStatus !== 'NOT_SUBMITTED';

      total++;
      if (hasSubmitted) {
        submitted++;
      } else if (isPastDue) {
        overdue++;
      } else {
        pending++;
      }

      if (isToday) {
        dueToday++;
      } else if (!isPastDue) {
        upcoming++;
      }

      const assignedChild =
        selectedChild ||
        childByClassSection.get(
          `${doc.className.trim().toLowerCase()}_${doc.section.trim().toLowerCase()}`
        ) ||
        activeChildren[0];

      const remainingInfo = this.computeRemainingInfo(doc.dueDate);

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
        studentName: assignedChild?.fullName,
        studentId: assignedChild ? (assignedChild._id ? assignedChild._id.toString() : (assignedChild as any).id) : undefined,
        remainingDays: remainingInfo.remainingDays,
        remainingText: remainingInfo.remainingText,
        submission: sub
          ? this.mapSubmissionDocToDTO(sub, assignedChild?.fullName || '', isPastDue, allowLate)
          : null,
        attachmentUrl: doc.attachmentUrl || '',
        attachmentName: doc.attachmentName || '',
        createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
      };
    });

    // Filtering by submission / deadline status if requested
    let filteredAssignments = allMappedAssignments;
    if (query?.status && query.status.trim() && query.status !== 'ALL') {
      const s = query.status.trim().toUpperCase();
      if (s === 'SUBMITTED') {
        filteredAssignments = allMappedAssignments.filter((a) => a.submissionStatus !== 'NOT_SUBMITTED');
      } else if (s === 'PENDING') {
        filteredAssignments = allMappedAssignments.filter(
          (a) => a.submissionStatus === 'NOT_SUBMITTED' && a.dueStatus !== 'OVERDUE'
        );
      } else if (s === 'OVERDUE') {
        filteredAssignments = allMappedAssignments.filter((a) => a.dueStatus === 'OVERDUE');
      } else if (s === 'UPCOMING') {
        filteredAssignments = allMappedAssignments.filter((a) => a.dueStatus === 'UPCOMING');
      } else if (s === 'DUE_TODAY') {
        filteredAssignments = allMappedAssignments.filter((a) => a.dueStatus === 'DUE_TODAY');
      }
    }

    if (query?.dueDate && query.dueDate.trim() && query.dueDate !== 'ALL') {
      const d = query.dueDate.trim().toUpperCase();
      if (d === 'UPCOMING') {
        filteredAssignments = filteredAssignments.filter((a) => a.dueStatus === 'UPCOMING');
      } else if (d === 'DUE_TODAY') {
        filteredAssignments = filteredAssignments.filter((a) => a.dueStatus === 'DUE_TODAY');
      } else if (d === 'OVERDUE') {
        filteredAssignments = filteredAssignments.filter((a) => a.dueStatus === 'OVERDUE');
      }
    }

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
      selectedChild: selectedChild
        ? {
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
          }
        : null,
      assignments: filteredAssignments,
      summary: {
        total,
        pending,
        submitted,
        overdue,
        upcoming,
        dueToday,
      },
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
        child.section.trim().toLowerCase() === assignmentDoc.section.trim().toLowerCase() &&
        (!child.academicYear ||
          !assignmentDoc.academicYear ||
          child.academicYear.trim().replace(/[-–—]/g, '-') ===
            assignmentDoc.academicYear.trim().replace(/[-–—]/g, '-'))
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

    const remainingInfo = this.computeRemainingInfo(assignmentDoc.dueDate);

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
      studentName: matchingChild.fullName,
      studentId: matchingChild._id ? matchingChild._id.toString() : (matchingChild as any).id,
      remainingDays: remainingInfo.remainingDays,
      remainingText: remainingInfo.remainingText,
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

    // 1. Verify assignment exists and is published
    const assignment = await this.assignmentRepo.findPublishedById(assignmentId);
    if (!assignment) {
      throw new NotFoundError('Assignment not found or is no longer published.');
    }

    // 2. Resolve and verify the target student
    let student: IStudentDoc | null = null;

    if (dto.studentId && dto.studentId.trim() && dto.studentId.trim() !== 'ALL') {
      const cleanStudentId = dto.studentId.trim();

      if (mongoose.Types.ObjectId.isValid(cleanStudentId)) {
        student = await this.studentRepo.findById(cleanStudentId);
      } else {
        const parentChildren = await this.studentRepo.findByParentId(parentId);
        student = parentChildren?.find((c) => c.studentId === cleanStudentId) || null;
        if (!student) {
          throw new ValidationError('Invalid student ID format.');
        }
      }

      if (!student || student.parentId.toString() !== parentId || student.status !== 'ACTIVE') {
        throw new ForbiddenError('You are not authorized to submit assignments on behalf of this student.');
      }
    } else {
      // If studentId was omitted or is 'ALL', automatically resolve via enrolled child matching class & section
      const parentChildren = await this.studentRepo.findByParentId(parentId);
      const activeChildren = (parentChildren || []).filter((c) => c.status === 'ACTIVE');
      const matchingChildren = activeChildren.filter(
        (c) =>
          c.grade.trim().toLowerCase() === assignment.className.trim().toLowerCase() &&
          c.section.trim().toLowerCase() === assignment.section.trim().toLowerCase()
      );

      if (matchingChildren.length === 0) {
        throw new ForbiddenError('This assignment is not assigned to your child’s class and section.');
      }
      if (matchingChildren.length > 1) {
        throw new ValidationError('Multiple enrolled children found in this class. Please specify student ID.');
      }

      student = matchingChildren[0];
    }

    if (!student || student.parentId.toString() !== parentId || student.status !== 'ACTIVE') {
      throw new ForbiddenError('You are not authorized to submit assignments on behalf of this student.');
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
    const existing = await this.submissionRepo.findByAssignmentAndStudent(assignmentId, student._id.toString());

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
        examDate?: string;
        publishedAt?: string | null;
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

  async getParentStudyMaterials(
    parentId: string,
    query?: ParentStudyMaterialsQueryDTO
  ): Promise<ParentStudyMaterialsResponseDTO> {
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
        materials: [],
        subjects: [],
        academicYears: [],
      };
    }

    const isAll = query?.studentId === 'ALL';
    let selectedChild: IStudentDoc | null = null;

    if (!isAll && query?.studentId && query.studentId.trim()) {
      const match = activeChildren.find(
        (c) => c._id.toString() === query.studentId || c.studentId === query.studentId
      );
      if (!match) {
        throw new ForbiddenError(
          'You are not authorized to view study materials for this student.'
        );
      }
      selectedChild = match;
    } else if (!isAll) {
      selectedChild = activeChildren[0];
    }

    let materialsDocs: any[] = [];
    let subjects: string[] = [];

    if (selectedChild) {
      const [docs, distinctSubjects] = await Promise.all([
        this.studyMaterialRepo.findPublishedMaterialsByClass(
          selectedChild.grade,
          selectedChild.section,
          query?.academicYear || selectedChild.academicYear,
          {
            subject: query?.subject,
            search: query?.search,
          }
        ),
        this.studyMaterialRepo.findDistinctPublishedSubjects(
          selectedChild.grade,
          selectedChild.section,
          query?.academicYear || selectedChild.academicYear
        ),
      ]);
      materialsDocs = docs;
      subjects = distinctSubjects;
    } else {
      const classFilters = activeChildren.map((c) => ({
        className: c.grade,
        section: c.section,
        academicYear: query?.academicYear || c.academicYear,
      }));

      materialsDocs = await this.studyMaterialRepo.findPublishedMaterialsForClasses(
        classFilters,
        {
          subject: query?.subject,
          search: query?.search,
        }
      );

      const subjectsSet = new Set<string>();
      materialsDocs.forEach((m) => {
        if (m.subject) subjectsSet.add(m.subject);
      });
      subjects = Array.from(subjectsSet);
    }

    if (query?.materialType && query.materialType.trim() && query.materialType !== 'ALL') {
      const mt = query.materialType.trim().toUpperCase();
      materialsDocs = materialsDocs.filter((m) => m.materialType === mt);
    }

    const academicYearsSet = new Set<string>();
    activeChildren.forEach((c) => {
      if (c.academicYear) academicYearsSet.add(c.academicYear);
    });
    materialsDocs.forEach((m) => {
      if (m.academicYear) academicYearsSet.add(m.academicYear);
    });

    const selectedChildDTO = selectedChild
      ? childrenDTOs.find((c) => c.id === selectedChild!._id.toString()) || null
      : null;

    const materials: ParentStudyMaterialItemDTO[] = materialsDocs.map((doc) => ({
      id: doc._id ? doc._id.toString() : (doc as any).id || '',
      title: doc.title,
      description: doc.description || '',
      teacherName: doc.teacherName,
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
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
    }));

    return {
      children: childrenDTOs,
      selectedChild: selectedChildDTO,
      materials,
      subjects: subjects.sort(),
      academicYears: Array.from(academicYearsSet).sort(),
    };
  }

  async getParentFeeInvoices(
    parentId: string,
    query?: ParentFeeInvoicesQueryDTO
  ): Promise<ParentFeeInvoicesResponseDTO> {
    if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
      throw new ValidationError('Invalid parent account identification.');
    }

    const [childrenDocs, regRequests] = await Promise.all([
      this.studentRepo.findByParentId(parentId),
      this.registrationRequestRepo.findByParentId(parentId),
    ]);

    const activeChildren: IStudentDoc[] = childrenDocs.filter((c: IStudentDoc) => c.status === 'ACTIVE');
    const childrenDTOs: ChildProfileDTO[] = activeChildren.map((c: IStudentDoc) => ({
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

    const isAll = !query?.studentId || query.studentId === 'ALL';
    let selectedChild: IStudentDoc | null = null;
    let targetStudentIds: mongoose.Types.ObjectId[] = [];

    if (!isAll && query?.studentId && query.studentId.trim()) {
      const match = activeChildren.find(
        (c: IStudentDoc) => c._id.toString() === query.studentId || c.studentId === query.studentId
      );
      if (!match) {
        throw new ForbiddenError(
          'You are not authorized to view fee invoices for this student.'
        );
      }
      selectedChild = match;
      targetStudentIds = [match._id];
    } else if (activeChildren.length === 0) {
      return {
        children: [],
        selectedChild: null,
        hasEnrolledChildren: false,
        registrationRequestsCount: regRequests.length,
        assignment: null,
        assignments: [],
        summary: {
          totalFees: 0,
          amountPaid: 0,
          outstandingBalance: 0,
          overdueAmount: 0,
          totalInvoiced: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          overdueInvoicesCount: 0,
        },
        invoices: [],
        academicYears: [],
      };
    } else {
      // All active children of this parent
      targetStudentIds = activeChildren.map((c: IStudentDoc) => c._id);
    }

    // Fetch category descriptions and structure names
    const [feeCategories, feeStructures] = await Promise.all([
      FeeCategoryModel.find().lean().exec(),
      FeeStructureModel.find().lean().exec(),
    ]);
    const categoryDescMap = new Map<string, string>();
    feeCategories.forEach((c) => {
      categoryDescMap.set(c.name.trim().toLowerCase(), c.description);
    });
    const structureMap = new Map<string, string>();
    feeStructures.forEach((s) => {
      structureMap.set(s._id.toString(), s.name);
    });

    // Query active assignments
    const assignmentFilter: any = {
      studentId: { $in: targetStudentIds },
      status: 'ACTIVE',
    };
    if (query?.academicYear && query.academicYear.trim() && query.academicYear !== 'ALL') {
      assignmentFilter.academicYear = query.academicYear.trim();
    }
    const assignmentDocs = await StudentFeeAssignmentModel.find(assignmentFilter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Ensure all active assignments have invoices generated for their installments
    for (const assignment of assignmentDocs) {
      try {
        await this.adminFeeService.generateInvoicesForAssignment(assignment as any);
      } catch (err) {
        console.warn('Auto-generate missing invoices warning:', assignment._id, err);
      }
    }

    const assignmentDTOs: ParentFeeAssignmentDTO[] = assignmentDocs.map((doc) => ({
      id: doc._id.toString(),
      studentId: doc.studentId.toString(),
      studentName: doc.studentName,
      admissionNumber: doc.admissionNumber,
      className: doc.className,
      section: doc.section,
      academicYear: doc.academicYear,
      feeStructureId: doc.feeStructureId.toString(),
      feeStructureName: doc.feeStructureName,
      baseAmount: doc.baseAmount,
      concessionName: doc.concessionName,
      concessionAmount: doc.concessionAmount,
      concessionReason: doc.concessionReason,
      netPayable: doc.netPayable,
      status: doc.status,
      installments: (doc.installments || []).map((inst) => ({
        installmentNumber: inst.installmentNumber,
        name: inst.name,
        baseAmount: inst.baseAmount,
        concessionAmount: inst.concessionAmount,
        netAmount: inst.netAmount,
        dueDate: inst.dueDate,
        paidAmount: inst.paidAmount,
        status: inst.status,
      })),
    }));

    const selectedAssignment = selectedChild
      ? assignmentDTOs.find((a) => a.studentId === selectedChild!._id.toString()) || null
      : assignmentDTOs[0] || null;

    // Query Invoices
    const invoiceFilter: any = {
      studentId: { $in: targetStudentIds },
    };

    if (query?.academicYear && query.academicYear.trim() && query.academicYear !== 'ALL') {
      invoiceFilter.academicYear = query.academicYear.trim();
    }

    if (query?.status && query.status.trim() && query.status !== 'ALL') {
      invoiceFilter.status = query.status.trim().toUpperCase();
    }

    const invoiceDocs = await FeeInvoiceModel.find(invoiceFilter)
      .sort({ dueDate: -1, createdAt: -1 })
      .lean()
      .exec();

    const invoiceIds = invoiceDocs.map((inv) => inv._id);
    const paymentDocs = invoiceIds.length > 0
      ? await FeePaymentModel.find({
          invoiceId: { $in: invoiceIds },
          status: 'SUCCESS',
        })
          .sort({ paymentDate: -1, createdAt: -1 })
          .lean()
          .exec()
      : [];

    let totalFees = 0;
    let amountPaid = 0;
    let outstandingBalance = 0;
    let overdueAmount = 0;
    let overdueInvoicesCount = 0;
    const todayStr = new Date().toISOString().slice(0, 10);

    const invoices: ParentInvoiceDTO[] = invoiceDocs.map((inv) => {
      let status = inv.status;
      if ((status === 'UNPAID' || status === 'PARTIAL') && inv.dueDate < todayStr) {
        status = 'OVERDUE';
      }

      if (status !== 'CANCELLED') {
        totalFees += inv.totalPayable || 0;
        amountPaid += inv.paidAmount || 0;
        outstandingBalance += inv.outstandingAmount || 0;
        if (status === 'OVERDUE') {
          overdueAmount += inv.outstandingAmount || 0;
          overdueInvoicesCount += 1;
        }
      }

      const invPayments = paymentDocs
        .filter((p) => p.invoiceId.toString() === inv._id.toString())
        .map((p) => ({
          id: p._id.toString(),
          receiptNumber: p.receiptNumber,
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
          amount: p.amount,
          transactionReference: p.transactionReference,
          status: p.status,
          recordedByName: p.recordedByName,
          remarks: p.remarks,
          balanceAfter: inv.outstandingAmount,
          invoiceNumber: p.invoiceNumber || inv.invoiceNumber,
          installmentName: inv.installmentName,
          studentName: p.studentName || inv.studentName,
          studentAdmissionNumber: p.studentAdmissionNumber || inv.studentAdmissionNumber,
          className: p.className || inv.className,
          section: p.section || inv.section,
          academicYear: p.academicYear || inv.academicYear,
        }));

      const matchingAssignment = assignmentDocs.find(
        (a) => a._id.toString() === inv.feeAssignmentId?.toString()
      );

      return {
        id: inv._id.toString(),
        invoiceNumber: inv.invoiceNumber,
        studentId: inv.studentId.toString(),
        studentName: inv.studentName,
        studentAdmissionNumber: inv.studentAdmissionNumber,
        className: inv.className,
        section: inv.section,
        academicYear: inv.academicYear,
        feeStructureId: inv.feeStructureId?.toString() || matchingAssignment?.feeStructureId?.toString(),
        feeStructureName: matchingAssignment?.feeStructureName || (inv.feeStructureId ? structureMap.get(inv.feeStructureId.toString()) : '') || 'Standard Tuition Fee Plan',
        installmentNumber: inv.installmentNumber,
        installmentName: inv.installmentName,
        items: (inv.items && inv.items.length > 0)
          ? inv.items.map((it) => ({
              categoryName: it.categoryName,
              description: categoryDescMap.get(it.categoryName.trim().toLowerCase()) || 'School curriculum and instructional fee',
              amount: it.amount,
            }))
          : [
              {
                categoryName: inv.installmentName || 'Tuition Fee',
                description: 'School curriculum and instructional fee',
                amount: inv.totalPayable,
              },
            ],
        subtotal: inv.subtotal,
        concessionAmount: inv.concessionAmount,
        lateFeeAmount: inv.lateFeeAmount,
        totalPayable: inv.totalPayable,
        paidAmount: inv.paidAmount,
        outstandingAmount: inv.outstandingAmount,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        status,
        notes: inv.notes,
        payments: invPayments,
      };
    });

    // If invoices do not exist yet but fee structure is assigned, reflect in summary
    if (invoiceDocs.length === 0 && assignmentDTOs.length > 0) {
      if (selectedChild && selectedAssignment) {
        totalFees = selectedAssignment.netPayable;
        outstandingBalance = selectedAssignment.netPayable;
      } else {
        totalFees = assignmentDTOs.reduce((acc, a) => acc + (a.netPayable || 0), 0);
        outstandingBalance = totalFees;
      }
    }

    const academicYearsSet = new Set<string>();
    activeChildren.forEach((c: IStudentDoc) => {
      if (c.academicYear) academicYearsSet.add(c.academicYear);
    });
    assignmentDocs.forEach((a) => {
      if (a.academicYear) academicYearsSet.add(a.academicYear);
    });
    invoiceDocs.forEach((inv) => {
      if (inv.academicYear) academicYearsSet.add(inv.academicYear);
    });

    const selectedChildDTO = selectedChild
      ? childrenDTOs.find((c) => c.id === selectedChild!._id.toString()) || null
      : null;

    return {
      children: childrenDTOs,
      selectedChild: selectedChildDTO,
      hasEnrolledChildren: true,
      registrationRequestsCount: regRequests.length,
      assignment: selectedAssignment,
      assignments: assignmentDTOs,
      summary: {
        totalFees: Math.round(totalFees * 100) / 100,
        amountPaid: Math.round(amountPaid * 100) / 100,
        outstandingBalance: Math.round(outstandingBalance * 100) / 100,
        overdueAmount: Math.round(overdueAmount * 100) / 100,
        totalInvoiced: Math.round(totalFees * 100) / 100,
        totalPaid: Math.round(amountPaid * 100) / 100,
        totalOutstanding: Math.round(outstandingBalance * 100) / 100,
        overdueInvoicesCount,
      },
      invoices,
      academicYears: Array.from(academicYearsSet).sort(),
    };
  }

  async getParentFeeInvoiceDetails(
    parentId: string,
    invoiceId: string
  ): Promise<ParentInvoiceDTO> {
    if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
      throw new ValidationError('Invalid parent account identification.');
    }
    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      throw new ValidationError('Invalid invoice identification.');
    }

    const invoice = await FeeInvoiceModel.findById(invoiceId).lean().exec();
    if (!invoice) {
      throw new NotFoundError('Fee invoice not found.');
    }

    const childrenDocs = await this.studentRepo.findByParentId(parentId);
    const activeChildren: IStudentDoc[] = childrenDocs.filter((c: IStudentDoc) => c.status === 'ACTIVE');
    const isParentStudent = activeChildren.some(
      (c: IStudentDoc) => c._id.toString() === invoice.studentId.toString()
    );
    const isDirectParent = invoice.parentId && invoice.parentId.toString() === parentId;

    if (!isParentStudent && !isDirectParent) {
      throw new ForbiddenError('You are not authorized to view this fee invoice.');
    }

    const [payments, feeCategories, linkedAssignment] = await Promise.all([
      FeePaymentModel.find({
        invoiceId: invoice._id,
        status: 'SUCCESS',
      })
        .sort({ paymentDate: -1, createdAt: -1 })
        .lean()
        .exec(),
      FeeCategoryModel.find().lean().exec(),
      invoice.feeAssignmentId
        ? StudentFeeAssignmentModel.findById(invoice.feeAssignmentId).lean().exec()
        : null,
    ]);

    const categoryDescMap = new Map<string, string>();
    feeCategories.forEach((c) => {
      categoryDescMap.set(c.name.trim().toLowerCase(), c.description);
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    let status = invoice.status;
    if ((status === 'UNPAID' || status === 'PARTIAL') && invoice.dueDate < todayStr) {
      status = 'OVERDUE';
    }

    return {
      id: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      studentId: invoice.studentId.toString(),
      studentName: invoice.studentName,
      studentAdmissionNumber: invoice.studentAdmissionNumber,
      className: invoice.className,
      section: invoice.section,
      academicYear: invoice.academicYear,
      feeStructureId: invoice.feeStructureId?.toString() || linkedAssignment?.feeStructureId?.toString(),
      feeStructureName: linkedAssignment?.feeStructureName || '',
      installmentNumber: invoice.installmentNumber,
      installmentName: invoice.installmentName,
      items: (invoice.items || []).map((it) => ({
        categoryName: it.categoryName,
        description: categoryDescMap.get(it.categoryName.trim().toLowerCase()) || 'School curriculum and instructional fee',
        amount: it.amount,
      })),
      subtotal: invoice.subtotal,
      concessionAmount: invoice.concessionAmount,
      lateFeeAmount: invoice.lateFeeAmount,
      totalPayable: invoice.totalPayable,
      paidAmount: invoice.paidAmount,
      outstandingAmount: invoice.outstandingAmount,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status,
      notes: invoice.notes,
      payments: payments.map((p) => ({
        receiptNumber: p.receiptNumber,
        paymentDate: p.paymentDate,
        paymentMethod: p.paymentMethod,
        amount: p.amount,
        transactionReference: p.transactionReference,
        status: p.status,
      })),
    };
  }

  // =========================================================================
  // ONLINE FEE PAYMENT (RAZORPAY GATEWAY INTEGRATION)
  // =========================================================================

  getPaymentConfig(): { keyId: string; currency: string; isTestMode: boolean } {
    const keyId = this.razorpayService.getKeyId();
    return {
      keyId,
      currency: 'INR',
      isTestMode: keyId.startsWith('rzp_test_'),
    };
  }

  async createOnlinePaymentOrder(
    parentId: string,
    dto: CreateOnlinePaymentOrderDTO
  ): Promise<OnlinePaymentOrderResponseDTO> {
    if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
      throw new ValidationError('Invalid parent account identification.');
    }
    if (!dto.invoiceId || !mongoose.Types.ObjectId.isValid(dto.invoiceId)) {
      throw new ValidationError('Valid fee invoice ID is required.');
    }

    const requestedAmount = Number(dto.amount);
    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      throw new ValidationError('Payment amount must be greater than zero.');
    }

    // 1. Fetch invoice from database
    const invoice = await FeeInvoiceModel.findById(dto.invoiceId);
    if (!invoice) {
      throw new NotFoundError('Fee invoice not found.');
    }

    if (invoice.status === 'CANCELLED') {
      throw new ValidationError('Cannot pay a cancelled invoice.');
    }
    if (invoice.status === 'PAID' || invoice.outstandingAmount <= 0) {
      throw new ValidationError('This invoice is already fully paid.');
    }

    // 2. Security Check: Parent-Child authorization verification
    const parentChildren = await this.studentRepo.findByParentId(parentId);
    const isAuthorized =
      parentChildren.some((c) => c._id.toString() === invoice.studentId.toString()) ||
      (invoice.parentId && invoice.parentId.toString() === parentId);

    if (!isAuthorized) {
      throw new ForbiddenError(
        'Access denied: You are not authorized to make fee payments for this student.'
      );
    }

    // 3. Security Check: Amount cannot exceed current outstanding balance in MongoDB
    if (requestedAmount > invoice.outstandingAmount) {
      throw new ValidationError(
        `Payment amount (₹${requestedAmount.toLocaleString('en-IN')}) cannot exceed the outstanding balance (₹${invoice.outstandingAmount.toLocaleString('en-IN')}).`
      );
    }

    // 4. Fetch Parent Details for prefill and audit
    const parentUser = await UserModel.findById(parentId).lean();
    const parentName = parentUser?.fullName || invoice.parentName || 'Parent';

    // 5. Create Razorpay Payment Order
    const razorpayOrder = await this.razorpayService.createOrder({
      amount: requestedAmount,
      currency: 'INR',
      receipt: invoice.invoiceNumber,
      notes: {
        invoiceId: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        studentId: invoice.studentId.toString(),
        studentName: invoice.studentName,
        parentId,
      },
    });

    // 6. Record the order in MongoDB
    await FeeOnlineOrderModel.create({
      orderId: razorpayOrder.id,
      gatewayOrderId: razorpayOrder.id,
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      studentId: invoice.studentId,
      studentName: invoice.studentName,
      studentAdmissionNumber: invoice.studentAdmissionNumber,
      className: invoice.className,
      section: invoice.section,
      academicYear: invoice.academicYear,
      parentId: new mongoose.Types.ObjectId(parentId),
      parentName,
      parentEmail: parentUser?.email || '',
      amount: requestedAmount,
      amountInPaise: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      status: 'CREATED',
    });

    return {
      orderId: razorpayOrder.id,
      gatewayOrderId: razorpayOrder.id,
      amount: requestedAmount,
      amountInPaise: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: this.razorpayService.getKeyId(),
      invoiceId: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      studentName: invoice.studentName,
      studentAdmissionNumber: invoice.studentAdmissionNumber,
      className: invoice.className,
      section: invoice.section,
      installmentName: invoice.installmentName,
    };
  }

  async verifyOnlinePayment(
    parentId: string,
    dto: VerifyOnlinePaymentDTO
  ): Promise<{ payment: ParentPaymentItemDTO; receiptNumber: string; invoice: ParentInvoiceDTO }> {
    if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
      throw new ValidationError('Invalid parent account identification.');
    }
    if (!dto.invoiceId || !mongoose.Types.ObjectId.isValid(dto.invoiceId)) {
      throw new ValidationError('Valid fee invoice ID is required.');
    }
    if (!dto.razorpayOrderId || !dto.razorpayOrderId.trim()) {
      throw new ValidationError('Razorpay Order ID is required.');
    }
    if (!dto.razorpayPaymentId || !dto.razorpayPaymentId.trim()) {
      throw new ValidationError('Razorpay Payment ID is required.');
    }
    if (!dto.razorpaySignature || !dto.razorpaySignature.trim()) {
      throw new ValidationError('Razorpay Payment Signature is required.');
    }

    // 1. Locate the initiated payment order
    const order = await FeeOnlineOrderModel.findOne({
      gatewayOrderId: dto.razorpayOrderId.trim(),
    });
    if (!order) {
      throw new NotFoundError(
        'Payment order not found. Please initiate payment from the fee dashboard.'
      );
    }

    // 2. Verify parent authorization for this order
    if (order.parentId.toString() !== parentId) {
      throw new ForbiddenError('Access denied: Payment order does not belong to your account.');
    }

    // 3. Idempotency Check: Check if this payment was already recorded
    const existingPayment = await FeePaymentModel.findOne({
      transactionReference: dto.razorpayPaymentId.trim(),
    });

    if (existingPayment) {
      const currentInvoice = await this.getParentFeeInvoiceDetails(parentId, dto.invoiceId);
      return {
        payment: this.toParentPaymentItemDTO(existingPayment),
        receiptNumber: existingPayment.receiptNumber,
        invoice: currentInvoice,
      };
    }

    if (order.status === 'PAID' && order.paymentId) {
      const existingPaymentById = await FeePaymentModel.findById(order.paymentId);
      if (existingPaymentById) {
        const currentInvoice = await this.getParentFeeInvoiceDetails(parentId, dto.invoiceId);
        return {
          payment: this.toParentPaymentItemDTO(existingPaymentById),
          receiptNumber: existingPaymentById.receiptNumber,
          invoice: currentInvoice,
        };
      }
    }

    // 4. Cryptographic Signature Verification (HMAC SHA-256)
    const isValidSignature = this.razorpayService.verifyPaymentSignature(
      dto.razorpayOrderId.trim(),
      dto.razorpayPaymentId.trim(),
      dto.razorpaySignature.trim()
    );

    if (!isValidSignature) {
      await FeeOnlineOrderModel.findByIdAndUpdate(order._id, {
        status: 'FAILED',
        gatewayPaymentId: dto.razorpayPaymentId.trim(),
        gatewaySignature: dto.razorpaySignature.trim(),
        failureReason: 'Cryptographic HMAC-SHA256 signature mismatch.',
      });
      throw new ValidationError('Invalid payment signature. Payment verification failed.');
    }

    // 5. Fetch fresh invoice data from database
    const invoice = await FeeInvoiceModel.findById(dto.invoiceId);
    if (!invoice) {
      throw new NotFoundError('Fee invoice not found.');
    }
    if (invoice.status === 'CANCELLED') {
      throw new ValidationError('Cannot apply payment to a cancelled invoice.');
    }

    // 6. Record payment via shared AdminFeeService (ensures atomic invoice updates, assignment sync, and double-entry ledger posting)
    const parentUser = await UserModel.findById(parentId).lean();
    const recordedByName = `${parentUser?.fullName || 'Parent'} (Online Gateway)`;
    const paymentMethod = dto.paymentMethod || 'ONLINE';

    const paymentDTO = await this.adminFeeService.collectFee(parentId, recordedByName, {
      invoiceId: invoice._id.toString(),
      amount: order.amount,
      paymentMethod: 'ONLINE',
      paymentDate: new Date().toISOString().split('T')[0],
      transactionReference: dto.razorpayPaymentId.trim(),
      remarks: `Online Payment via Razorpay (${paymentMethod}, Order: ${order.gatewayOrderId})`,
    });

    // 7. Update FeePayment with online gateway fields
    await FeePaymentModel.findByIdAndUpdate(paymentDTO.id, {
      gatewayOrderId: dto.razorpayOrderId.trim(),
      gatewayPaymentId: dto.razorpayPaymentId.trim(),
      gatewaySignature: dto.razorpaySignature.trim(),
      isOnline: true,
    });

    // 8. Update Order status in database
    await FeeOnlineOrderModel.findByIdAndUpdate(order._id, {
      status: 'PAID',
      paymentId: new mongoose.Types.ObjectId(paymentDTO.id),
      receiptNumber: paymentDTO.receiptNumber,
      gatewayPaymentId: dto.razorpayPaymentId.trim(),
      gatewaySignature: dto.razorpaySignature.trim(),
      paymentMethod,
    });

    // 9. Fetch updated invoice details
    const updatedInvoice = await this.getParentFeeInvoiceDetails(parentId, dto.invoiceId);
    const updatedPaymentDoc = await FeePaymentModel.findById(paymentDTO.id);

    return {
      payment: this.toParentPaymentItemDTO(updatedPaymentDoc!),
      receiptNumber: paymentDTO.receiptNumber,
      invoice: updatedInvoice,
    };
  }

  async handlePaymentWebhook(
    rawBody: string,
    signature: string,
    payload: any
  ): Promise<{ handled: boolean; event: string; orderId?: string }> {
    // 1. Verify Webhook Signature
    const isValidSignature = this.razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      throw new ValidationError('Invalid webhook cryptographic signature.');
    }

    const event = payload?.event || '';
    let orderId: string | undefined;

    // 2. Handle Asynchronous / Delayed Payment Confirmations
    if (event === 'order.paid' || event === 'payment.captured') {
      const entity = payload?.payload?.payment?.entity || payload?.payload?.order?.entity;
      const gatewayOrderId = entity?.order_id || entity?.id;
      const gatewayPaymentId = entity?.id;
      const method = entity?.method || 'ONLINE';

      if (gatewayOrderId) {
        orderId = gatewayOrderId;
        const order = await FeeOnlineOrderModel.findOne({ gatewayOrderId });
        if (order && order.status !== 'PAID') {
          // Check if payment already recorded
          const existing = await FeePaymentModel.findOne({
            transactionReference: gatewayPaymentId,
          });

          if (!existing) {
            const invoice = await FeeInvoiceModel.findById(order.invoiceId);
            if (invoice && invoice.status !== 'CANCELLED' && invoice.outstandingAmount > 0) {
              const recordedByName = `${order.parentName} (Razorpay Webhook)`;
              const paymentDTO = await this.adminFeeService.collectFee(
                order.parentId.toString(),
                recordedByName,
                {
                  invoiceId: invoice._id.toString(),
                  amount: order.amount,
                  paymentMethod: 'ONLINE',
                  paymentDate: new Date().toISOString().split('T')[0],
                  transactionReference: gatewayPaymentId,
                  remarks: `Online Payment via Razorpay Webhook (${method}, Order: ${gatewayOrderId})`,
                }
              );

              await FeePaymentModel.findByIdAndUpdate(paymentDTO.id, {
                gatewayOrderId,
                gatewayPaymentId,
                isOnline: true,
              });

              await FeeOnlineOrderModel.findByIdAndUpdate(order._id, {
                status: 'PAID',
                paymentId: new mongoose.Types.ObjectId(paymentDTO.id),
                receiptNumber: paymentDTO.receiptNumber,
                gatewayPaymentId,
                paymentMethod: method,
              });
            }
          }
        }
      }
    } else if (event === 'payment.failed') {
      const entity = payload?.payload?.payment?.entity;
      const gatewayOrderId = entity?.order_id;
      if (gatewayOrderId) {
        orderId = gatewayOrderId;
        await FeeOnlineOrderModel.findOneAndUpdate(
          { gatewayOrderId, status: 'CREATED' },
          {
            status: 'FAILED',
            failureReason: entity?.error_description || 'Payment failed on gateway',
          }
        );
      }
    }

    return {
      handled: true,
      event,
      orderId,
    };
  }

  async getParentPayments(
    parentId: string,
    query?: { studentId?: string; academicYear?: string }
  ): Promise<ParentPaymentHistoryResponseDTO> {
    if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
      throw new ValidationError('Invalid parent account identification.');
    }

    // Fetch enrolled children for parent
    const childrenDocs = await this.studentRepo.findByParentId(parentId);
    const activeChildren = childrenDocs.filter((c) => c.status === 'ACTIVE');
    const childIds = activeChildren.map((c) => c._id);

    let targetStudentIds = childIds;
    if (query?.studentId && query.studentId !== 'ALL') {
      if (!mongoose.Types.ObjectId.isValid(query.studentId)) {
        throw new ValidationError('Invalid student ID filter.');
      }
      const match = childIds.find((id) => id.toString() === query.studentId);
      if (!match) {
        throw new ForbiddenError('Access denied: Selected child does not belong to your account.');
      }
      targetStudentIds = [match];
    }

    const filter: any = {
      studentId: { $in: targetStudentIds },
    };

    if (query?.academicYear && query.academicYear !== 'ALL') {
      filter.academicYear = query.academicYear.trim();
    }

    const paymentDocs = await FeePaymentModel.find(filter)
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean()
      .exec();

    let totalCollected = 0;
    const payments: ParentPaymentItemDTO[] = paymentDocs.map((p) => {
      if (p.status === 'SUCCESS') {
        totalCollected += p.amount || 0;
      }
      return {
        id: p._id.toString(),
        receiptNumber: p.receiptNumber,
        invoiceId: p.invoiceId.toString(),
        invoiceNumber: p.invoiceNumber,
        studentId: p.studentId.toString(),
        studentName: p.studentName,
        studentAdmissionNumber: p.studentAdmissionNumber,
        className: p.className,
        section: p.section,
        academicYear: p.academicYear,
        amount: p.amount,
        paymentDate: p.paymentDate,
        paymentMethod: p.paymentMethod,
        transactionReference: p.transactionReference || '',
        status: p.status,
        isOnline: Boolean((p as any).isOnline || p.paymentMethod === 'ONLINE'),
        recordedByName: p.recordedByName,
        remarks: p.remarks,
        balanceAfter: (p as any).balanceAfter,
      };
    });

    return {
      payments,
      totalCollected,
      totalTransactions: payments.length,
    };
  }

  private toParentPaymentItemDTO(doc: any): ParentPaymentItemDTO {
    return {
      id: doc._id.toString(),
      receiptNumber: doc.receiptNumber,
      invoiceId: doc.invoiceId.toString(),
      invoiceNumber: doc.invoiceNumber,
      studentId: doc.studentId.toString(),
      studentName: doc.studentName,
      studentAdmissionNumber: doc.studentAdmissionNumber,
      className: doc.className,
      section: doc.section,
      academicYear: doc.academicYear,
      amount: doc.amount,
      paymentDate: doc.paymentDate,
      paymentMethod: doc.paymentMethod,
      transactionReference: doc.transactionReference || '',
      status: doc.status,
      isOnline: Boolean(doc.isOnline || doc.paymentMethod === 'ONLINE'),
      recordedByName: doc.recordedByName,
      remarks: doc.remarks,
      balanceAfter: doc.balanceAfter,
    };
  }
}

