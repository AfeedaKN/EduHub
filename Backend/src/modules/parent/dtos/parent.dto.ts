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

export interface ParentAssignmentDTO {
  id: string;
  title: string;
  description: string;
  subject: string;
  teacherName: string;
  className: string;
  section: string;
  academicYear: string;
  assignedDate: string;
  dueDate: string;
  maxMarks: number;
  status: 'PUBLISHED';
  dueStatus: 'UPCOMING' | 'DUE_TODAY' | 'OVERDUE';
  submissionStatus: ParentSubmissionStatus;
  submissionTrackingAvailable: boolean;
  allowLateSubmissions?: boolean;
  canSubmit: boolean;
  submission?: SubmissionDetailsDTO | null;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
}

export type ParentSubmissionStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'LATE' | 'RESUBMITTED' | 'UNDER_REVIEW' | 'GRADED';

export interface SubmissionDetailsDTO {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  answerText?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
  submittedAt: string;
  status: 'SUBMITTED' | 'LATE' | 'RESUBMITTED' | 'UNDER_REVIEW' | 'GRADED';
  isLate: boolean;
  version: number;
  gradingStatus: 'PENDING' | 'UNDER_REVIEW' | 'GRADED';
  marksObtained?: number;
  maxMarks: number;
  feedback?: string;
  isPublished?: boolean;
  publishedAt?: string;
  canResubmit: boolean;
}

export interface SubmitAssignmentDTO {
  studentId: string;
  answerText?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
}

export interface ParentAssignmentsSummaryDTO {
  total: number;
  upcoming: number;
  dueToday: number;
  overdue: number;
}

export interface ParentAssignmentsQueryDTO {
  studentId?: string;
  subject?: string;
  status?: string;
  search?: string;
}

export interface ParentAssignmentsResponseDTO {
  children: ChildProfileDTO[];
  selectedChild: ChildProfileDTO | null;
  assignments: ParentAssignmentDTO[];
  summary: ParentAssignmentsSummaryDTO;
  subjects: string[];
}

