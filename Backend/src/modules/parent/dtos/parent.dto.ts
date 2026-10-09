export enum StudentGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum ParentRelationship {
  FATHER = 'FATHER',
  MOTHER = 'MOTHER',
  GUARDIAN = 'GUARDIAN',
  OTHER = 'OTHER',
}

export enum RegistrationStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface CreateStudentRegistrationDTO {
  studentFullName: string;
  dateOfBirth: string; // ISO format YYYY-MM-DD
  gender: StudentGender;
  requestedGrade: string;
  academicYear: string;
  previousSchool?: string;
  previousClass?: string;
  parentRelationship: ParentRelationship;
  documents?: Array<{
    name: string;
    url: string;
    fileType?: string;
  }>;
}

export interface StudentRegistrationResponseDTO {
  id: string;
  parentId: string;
  studentFullName: string;
  dateOfBirth: string;
  gender: StudentGender;
  requestedGrade: string;
  academicYear: string;
  previousSchool?: string;
  previousClass?: string;
  parentRelationship: ParentRelationship;
  status: RegistrationStatus;
  submissionDate: string;
  rejectionReason?: string;
  notes?: string;
}

export interface ChildProfileDTO {
  id: string;
  fullName: string;
  studentId: string;
  grade: string;
  section: string;
  classTeacher: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED';
  avatarUrl?: string;
  rollNumber?: string;
  academicYear?: string;
}

export interface ParentDashboardResponseDTO {
  children: ChildProfileDTO[];
  registrationRequests: StudentRegistrationResponseDTO[];
  unreadNoticesCount: number;
  upcomingActivitiesCount: number;
}
