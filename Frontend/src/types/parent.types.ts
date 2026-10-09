export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED';

export type RegistrationRequestStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export type StudentGender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export type ParentRelationship = 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';

export interface ChildProfile {
  id: string;
  fullName: string;
  studentId: string;
  grade: string;
  section: string;
  classTeacher: string;
  status: StudentStatus;
  avatarUrl?: string;
  rollNumber?: string;
  academicYear?: string;
}

export interface StudentRegistrationRequest {
  id: string;
  parentId?: string;
  studentFullName: string;
  dateOfBirth?: string;
  gender?: StudentGender;
  requestedGrade: string;
  academicYear?: string;
  previousSchool?: string;
  previousClass?: string;
  parentRelationship?: ParentRelationship;
  submissionDate: string;
  status: RegistrationRequestStatus;
  rejectionReason?: string;
  notes?: string;
}

export interface ParentDashboardData {
  children: ChildProfile[];
  registrationRequests: StudentRegistrationRequest[];
  unreadNoticesCount: number;
  upcomingActivitiesCount: number;
}

export interface AddStudentPayload {
  studentFullName: string;
  dateOfBirth: string;
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

export interface AdmissionMetadata {
  classes: string[];
  academicYears: string[];
  genders: Array<{ label: string; value: StudentGender }>;
  relationships: Array<{ label: string; value: ParentRelationship }>;
}
