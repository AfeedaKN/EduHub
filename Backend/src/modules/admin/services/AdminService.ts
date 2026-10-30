import mongoose from 'mongoose';
import {
  IAdminDashboardRepository,
  AdmissionFilterOptions,
} from '../repositories/AdminDashboardRepository';
import {
  AdminDashboardSummaryDTO,
  AdminPendingAdmissionSummaryDTO,
  AdminAdmissionDetailDTO,
  AdmissionsSummaryCountDTO,
  ClassCapacityDTO,
  ApproveAdmissionDTO,
  RejectAdmissionDTO,
  ApprovalResultDTO,
  RejectionResultDTO,
} from '../dtos/admin.dto';
import {
  IStudentRegistrationRequestDoc,
} from '../../parent/models/StudentRegistrationRequest.model';
import { IStudentDoc } from '../../parent/models/Student.model';
import { RegistrationStatus } from '../../parent/dtos/parent.dto';
import {
  AppError,
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../../shared/domain/errors/AppError';

export const MAX_SECTION_CAPACITY = 40;

import { IClassRepository } from '../repositories/ClassRepository';

export interface IAdminService {
  getDashboardSummary(): Promise<AdminDashboardSummaryDTO>;
  getAdmissions(filter: AdmissionFilterOptions): Promise<AdminPendingAdmissionSummaryDTO[]>;
  getAllAdmissions(): Promise<AdminPendingAdmissionSummaryDTO[]>;
  getAdmissionCounts(): Promise<AdmissionsSummaryCountDTO>;
  getAdmissionDetail(id: string): Promise<AdminAdmissionDetailDTO>;
  getClassCapacity(grade: string, section?: string): Promise<ClassCapacityDTO>;
  approveAdmission(
    requestId: string,
    adminUserId: string,
    dto?: ApproveAdmissionDTO
  ): Promise<ApprovalResultDTO>;
  rejectAdmission(
    requestId: string,
    adminUserId: string,
    dto: RejectAdmissionDTO
  ): Promise<RejectionResultDTO>;
}

export class AdminService implements IAdminService {
  constructor(
    private readonly adminDashboardRepo: IAdminDashboardRepository,
    private readonly classRepo?: IClassRepository
  ) {}

  private mapAdmissionDoc(doc: IStudentRegistrationRequestDoc): AdminPendingAdmissionSummaryDTO {
    const parentObj = doc.parentId as any;
    const parentName =
      parentObj && typeof parentObj === 'object' && 'fullName' in parentObj
        ? parentObj.fullName
        : undefined;
    const parentEmail =
      parentObj && typeof parentObj === 'object' && 'email' in parentObj
        ? parentObj.email
        : undefined;
    const parentPhone =
      parentObj && typeof parentObj === 'object' && 'phone' in parentObj
        ? parentObj.phone
        : undefined;

    return {
      id: doc._id.toString(),
      studentFullName: doc.studentFullName,
      requestedGrade: doc.requestedGrade,
      academicYear: doc.academicYear,
      parentName,
      parentEmail,
      parentPhone,
      submissionDate: doc.createdAt
        ? doc.createdAt.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      status: doc.status,
      dateOfBirth: doc.dateOfBirth
        ? doc.dateOfBirth.toISOString().split('T')[0]
        : undefined,
      gender: doc.gender,
      previousSchool: doc.previousSchool,
      previousClass: doc.previousClass,
      parentRelationship: doc.parentRelationship,
      rejectionReason: doc.rejectionReason,
      notes: doc.notes,
      documents: doc.documents,
      reviewedBy: doc.reviewedBy ? doc.reviewedBy.toString() : undefined,
      reviewedAt: doc.reviewedAt ? doc.reviewedAt.toISOString().split('T')[0] : undefined,
      createdStudentId: doc.createdStudentId ? doc.createdStudentId.toString() : undefined,
    };
  }

  async getDashboardSummary(): Promise<AdminDashboardSummaryDTO> {
    const todayStr = new Date().toISOString().split('T')[0];
    const [
      studentCounts,
      totalTeachers,
      pendingCount,
      recentDocs,
      enrollmentByClass,
      attendanceSummary,
      examOverview,
      recentActivities,
      upcomingActivities,
    ] = await Promise.all([
      this.adminDashboardRepo.countStudentStatusCounts(),
      this.adminDashboardRepo.countActiveTeachers(),
      this.adminDashboardRepo.countPendingAdmissions(),
      this.adminDashboardRepo.getRecentPendingAdmissions(5),
      this.adminDashboardRepo.getEnrollmentByClass(),
      this.adminDashboardRepo.getAttendanceSummary(todayStr),
      this.adminDashboardRepo.getExamOverview(),
      this.adminDashboardRepo.getRecentActivities(),
      this.adminDashboardRepo.getUpcomingActivities(),
    ]);

    const recentPendingAdmissions: AdminPendingAdmissionSummaryDTO[] = recentDocs.map((doc) =>
      this.mapAdmissionDoc(doc)
    );

    return {
      totalStudents: studentCounts.total,
      activeStudents: studentCounts.active,
      inactiveStudents: studentCounts.inactive,
      totalTeachers,
      pendingAdmissionsCount: pendingCount,
      recentPendingAdmissions,
      attendanceSummary,
      feesSummary: null,
      enrollmentByClass,
      examOverview,
      recentActivities,
      upcomingActivities,
    };
  }

  async getAdmissions(filter: AdmissionFilterOptions): Promise<AdminPendingAdmissionSummaryDTO[]> {
    const docs = await this.adminDashboardRepo.getAdmissions(filter);
    return docs.map((doc) => this.mapAdmissionDoc(doc));
  }

  async getAllAdmissions(): Promise<AdminPendingAdmissionSummaryDTO[]> {
    const docs = await this.adminDashboardRepo.getAllAdmissions();
    return docs.map((doc) => this.mapAdmissionDoc(doc));
  }

  async getAdmissionCounts(): Promise<AdmissionsSummaryCountDTO> {
    return await this.adminDashboardRepo.getAdmissionCounts();
  }

  async getClassCapacity(grade: string, section = 'A'): Promise<ClassCapacityDTO> {
    let maxCapacity = MAX_SECTION_CAPACITY;
    let isClassInactive = false;
    let isSectionInactive = false;

    if (this.classRepo) {
      const classDoc = await this.classRepo.findClassByName(grade);
      if (classDoc && classDoc.status === 'INACTIVE') {
        isClassInactive = true;
      }

      const configuredSection = await this.classRepo.findSectionByGradeAndName(grade, section);
      if (configuredSection) {
        if (configuredSection.status === 'INACTIVE') {
          isSectionInactive = true;
        }
        if (configuredSection.capacity) {
          maxCapacity = configuredSection.capacity;
        }
      }
    }

    const currentlyEnrolled = await this.adminDashboardRepo.countClassEnrollment(grade, section);
    const isClosed = isClassInactive || isSectionInactive;
    const availableSeats = isClosed ? 0 : Math.max(0, maxCapacity - currentlyEnrolled);
    const isAtCapacity = isClosed || currentlyEnrolled >= maxCapacity;

    return {
      grade,
      section,
      maxCapacity,
      currentlyEnrolled,
      availableSeats,
      isAtCapacity,
    };
  }

  async getAdmissionDetail(id: string): Promise<AdminAdmissionDetailDTO> {
    const doc = await this.adminDashboardRepo.getAdmissionById(id);
    if (!doc) {
      throw new NotFoundError(`Admission request with ID ${id} was not found.`, 'NOT_FOUND');
    }

    const capacity = await this.getClassCapacity(doc.requestedGrade, 'A');
    const baseSummary = this.mapAdmissionDoc(doc);

    return {
      ...baseSummary,
      capacity,
    };
  }

  async approveAdmission(
    requestId: string,
    adminUserId: string,
    dto?: ApproveAdmissionDTO
  ): Promise<ApprovalResultDTO> {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      throw new ValidationError('Invalid admission request ID format.');
    }

    const doc = await this.adminDashboardRepo.getAdmissionById(requestId);
    if (!doc) {
      throw new NotFoundError(`Admission request with ID ${requestId} was not found.`, 'NOT_FOUND');
    }

    // Enforce request must be Pending Review
    if (doc.status !== RegistrationStatus.PENDING && doc.status !== RegistrationStatus.UNDER_REVIEW) {
      throw new ConflictError(
        `This admission request has already been finalized with status "${doc.status}". Repeat approval is not permitted.`,
        'REQUEST_ALREADY_REVIEWED'
      );
    }

    if (doc.createdStudentId) {
      throw new ConflictError(
        `This admission request has already created an enrolled student record. Repeat approval is not permitted.`,
        'REQUEST_ALREADY_REVIEWED'
      );
    }

    const targetSection = dto?.section?.trim().toUpperCase() || 'A';

    let maxCapacity = MAX_SECTION_CAPACITY;
    if (this.classRepo) {
      const classDoc = await this.classRepo.findClassByName(doc.requestedGrade, doc.academicYear);
      if (classDoc && classDoc.status === 'INACTIVE') {
        throw new ConflictError(
          `Cannot approve admission for class "${doc.requestedGrade}". This class is currently INACTIVE and not accepting student admissions.`,
          'CLASS_INACTIVE'
        );
      }

      if (classDoc) {
        const availableSections = await this.classRepo.findSectionsByClassId(classDoc._id.toString());
        if (availableSections && availableSections.length > 0) {
          const match = availableSections.find(
            (s) => s.name.trim().toUpperCase() === targetSection
          );
          if (!match) {
            throw new ValidationError(
              `Section "${targetSection}" does not exist for class "${doc.requestedGrade}". Available sections: ${availableSections.map((s) => s.name).join(', ')}.`
            );
          }
          if (match.status === 'INACTIVE') {
            throw new ConflictError(
              `Cannot enroll student in Section "${targetSection}" of class "${doc.requestedGrade}". This section is currently INACTIVE.`,
              'SECTION_INACTIVE'
            );
          }
          if (match.capacity) {
            maxCapacity = match.capacity;
          }
        }
      }

      const configuredSection = await this.classRepo.findSectionByGradeAndName(
        doc.requestedGrade,
        targetSection,
        doc.academicYear
      );
      if (configuredSection) {
        if (configuredSection.status === 'INACTIVE') {
          throw new ConflictError(
            `Cannot enroll student in Section "${targetSection}" of class "${doc.requestedGrade}". This section is currently INACTIVE.`,
            'SECTION_INACTIVE'
          );
        }
        if (configuredSection.capacity) {
          maxCapacity = configuredSection.capacity;
        }
      }
    }

    // Authoritative backend class capacity check
    const currentEnrollment = await this.adminDashboardRepo.countClassEnrollment(
      doc.requestedGrade,
      targetSection
    );

    if (currentEnrollment >= maxCapacity) {
      throw new ConflictError(
        `This class (${doc.requestedGrade} - Section ${targetSection}) has reached its maximum capacity (${maxCapacity} students). The request cannot be approved until a seat is available.`,
        'CLASS_CAPACITY_EXCEEDED'
      );
    }

    // Generate unique Admission Number / Student ID
    const yearPrefix = (doc.academicYear || '2026').split('-')[0].replace(/[^0-9]/g, '') || '2026';
    const sequenceNumber = await this.adminDashboardRepo.getNextStudentSequence(yearPrefix);
    let studentId = `STU-${yearPrefix}-${String(sequenceNumber).padStart(4, '0')}`;

    // Execute atomic creation and update (MongoDB transactions on replica set, safe compensation on standalone)
    let session: mongoose.ClientSession | null = null;
    let createdStudentDoc: IStudentDoc | null = null;

    try {
      session = await this.adminDashboardRepo.startSession();
      if (session) {
        session.startTransaction();
      }
    } catch {
      session = null;
    }

    try {
      const parentObjId = (doc.parentId as any)?._id || doc.parentId;

      // 1. Create official student record with duplicate key retry protection
      let createdStudent: IStudentDoc | null = null;
      let attempts = 0;
      while (!createdStudent && attempts < 3) {
        attempts++;
        try {
          createdStudent = await this.adminDashboardRepo.createStudent(
            {
              parentId: parentObjId,
              fullName: doc.studentFullName,
              studentId,
              grade: doc.requestedGrade,
              section: targetSection,
              classTeacher: '',
              status: 'ACTIVE',
              academicYear: doc.academicYear,
              avatarUrl: '',
            },
            session || undefined
          );
        } catch (err: any) {
          if (err.code === 11000 && attempts < 3) {
            const nextSeq = await this.adminDashboardRepo.getNextStudentSequence(yearPrefix);
            studentId = `STU-${yearPrefix}-${String(nextSeq).padStart(4, '0')}`;
            continue;
          }
          throw err;
        }
      }

      if (!createdStudent) {
        throw new AppError('Failed to create student record.', 500, 'STUDENT_CREATION_FAILED');
      }

      createdStudentDoc = createdStudent;

      // 2. Update registration request
      doc.status = RegistrationStatus.APPROVED;
      doc.reviewedBy = new mongoose.Types.ObjectId(adminUserId);
      doc.reviewedAt = new Date();
      doc.createdStudentId = createdStudent._id as mongoose.Types.ObjectId;
      if (dto?.notes) {
        doc.notes = dto.notes.trim();
      }

      await this.adminDashboardRepo.saveRegistrationRequest(
        doc,
        session || undefined
      );

      if (session) {
        await session.commitTransaction();
      }

      const updatedSummary = this.mapAdmissionDoc(doc);

      return {
        request: updatedSummary,
        student: {
          id: (createdStudent._id as mongoose.Types.ObjectId).toString(),
          fullName: createdStudent.fullName,
          studentId: createdStudent.studentId,
          grade: createdStudent.grade,
          section: createdStudent.section,
          status: createdStudent.status,
        },
        message: `Admission request for ${doc.studentFullName} successfully approved. Student record created with ID ${studentId} and enrolled in ${doc.requestedGrade} - Section ${targetSection}.`,
      };
    } catch (error) {
      if (session) {
        try {
          await session.abortTransaction();
        } catch {
          // ignore abort error
        }
      } else if (createdStudentDoc?._id) {
        // Safe rollback compensation on standalone MongoDB: delete the partially created student
        try {
          if (typeof this.adminDashboardRepo.deleteStudentById === 'function') {
            await this.adminDashboardRepo.deleteStudentById(createdStudentDoc._id.toString());
          }
        } catch {
          // ignore cleanup error
        }
      }
      throw error;
    } finally {
      if (session) {
        try {
          await session.endSession();
        } catch {
          // ignore end session error
        }
      }
    }
  }

  async rejectAdmission(
    requestId: string,
    adminUserId: string,
    dto: RejectAdmissionDTO
  ): Promise<RejectionResultDTO> {
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      throw new ValidationError('Invalid admission request ID format.');
    }

    if (!dto.rejectionReason || !dto.rejectionReason.trim()) {
      throw new ValidationError(
        'A clear rejection reason is required to reject an admission request.'
      );
    }

    const doc = await this.adminDashboardRepo.getAdmissionById(requestId);
    if (!doc) {
      throw new NotFoundError(`Admission request with ID ${requestId} was not found.`, 'NOT_FOUND');
    }

    // Enforce request must be Pending Review
    if (doc.status !== RegistrationStatus.PENDING && doc.status !== RegistrationStatus.UNDER_REVIEW) {
      throw new ConflictError(
        `This admission request has already been finalized with status "${doc.status}". Repeat decision is not permitted.`,
        'REQUEST_ALREADY_REVIEWED'
      );
    }

    // Update request to REJECTED with reason and reviewer audit
    doc.status = RegistrationStatus.REJECTED;
    doc.rejectionReason = dto.rejectionReason.trim();
    doc.reviewedBy = new mongoose.Types.ObjectId(adminUserId);
    doc.reviewedAt = new Date();

    await this.adminDashboardRepo.saveRegistrationRequest(doc);

    const updatedSummary = this.mapAdmissionDoc(doc);

    return {
      request: updatedSummary,
      message: `Admission request for ${doc.studentFullName} has been rejected. The rejection feedback has been recorded and will be visible on the parent's dashboard.`,
    };
  }
}
