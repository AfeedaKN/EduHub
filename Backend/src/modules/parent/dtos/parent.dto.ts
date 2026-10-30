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
  studentName?: string;
  studentId?: string;
  remainingDays?: number;
  remainingText?: string;
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
  studentId?: string;
  answerText?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
}

export interface ParentAssignmentsSummaryDTO {
  total: number;
  pending: number;
  submitted: number;
  overdue: number;
  upcoming?: number;
  dueToday?: number;
}

export interface ParentAssignmentsQueryDTO {
  studentId?: string;
  subject?: string;
  status?: string;
  dueDate?: string;
  search?: string;
}

export interface ParentAssignmentsResponseDTO {
  children: ChildProfileDTO[];
  selectedChild: ChildProfileDTO | null;
  assignments: ParentAssignmentDTO[];
  summary: ParentAssignmentsSummaryDTO;
  subjects: string[];
}

export interface ParentSubjectResultDTO {
  scheduleId: string;
  examId: string;
  examName: string;
  examType: string;
  subject: string;
  examDate: string;
  maxMarks: number;
  passingMarks: number;
  marksObtained: number | null;
  isAbsent: boolean;
  percentage: number | null;
  grade: string;
  isPassed: boolean;
  remarks: string;
  publishedAt: string | null;
}

export interface ParentExamCardDTO {
  examId: string;
  examName: string;
  examType: string;
  academicYear: string;
  examDate?: string;
  publishedAt?: string | null;
  totalSubjects: number;
  totalMaxMarks: number;
  totalObtainedMarks: number;
  overallPercentage: number;
  overallGrade: string;
  isPassed: boolean;
  subjects: ParentSubjectResultDTO[];
}

export interface ParentExamResultsQueryDTO {
  studentId?: string;
  academicYear?: string;
  search?: string;
}

export interface ParentExamResultsResponseDTO {
  children: ChildProfileDTO[];
  selectedChild: ChildProfileDTO | null;
  summary: {
    totalExams: number;
    totalSubjectsPassed: number;
    totalSubjectsFailed: number;
    overallAveragePercentage: number;
  };
  exams: ParentExamCardDTO[];
}

