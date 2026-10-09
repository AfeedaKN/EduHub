import mongoose from 'mongoose';
import { IRegistrationRequestRepository } from '../repositories/RegistrationRequestRepository';
import { IStudentRepository } from '../repositories/StudentRepository';
import {
  CreateStudentRegistrationDTO,
  StudentRegistrationResponseDTO,
  ParentDashboardResponseDTO,
  ChildProfileDTO,
  RegistrationStatus,
  StudentGender,
  ParentRelationship,
} from '../dtos/parent.dto';
import { ConflictError, ValidationError } from '../../../shared/domain/errors/AppError';

export interface IParentService {
  createRegistrationRequest(
    parentId: string,
    dto: CreateStudentRegistrationDTO
  ): Promise<StudentRegistrationResponseDTO>;
  getParentDashboard(parentId: string): Promise<ParentDashboardResponseDTO>;
  getRegistrationRequests(parentId: string): Promise<StudentRegistrationResponseDTO[]>;
  getChildren(parentId: string): Promise<ChildProfileDTO[]>;
  getSchoolMetadata(): {
    classes: string[];
    academicYears: string[];
    genders: Array<{ label: string; value: string }>;
    relationships: Array<{ label: string; value: string }>;
  };
}

export class ParentService implements IParentService {
  constructor(
    private readonly registrationRequestRepo: IRegistrationRequestRepository,
    private readonly studentRepo: IStudentRepository
  ) {}

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
}
