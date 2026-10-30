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

export type ParentSubmissionStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'LATE' | 'RESUBMITTED' | 'UNDER_REVIEW' | 'GRADED';

export interface SubmissionDetails {
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
  canResubmit: boolean;
  isPublished?: boolean;
  publishedAt?: string;
}

export interface ParentAssignment {
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
  submission?: SubmissionDetails | null;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
  studentName?: string;
  studentId?: string;
  remainingDays?: number;
  remainingText?: string;
}

export interface SubmitAssignmentPayload {
  studentId?: string;
  answerText?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
}

export interface ParentAssignmentsSummary {
  total: number;
  pending: number;
  submitted: number;
  overdue: number;
  upcoming?: number;
  dueToday?: number;
}

export interface ParentAssignmentsQueryParams {
  studentId?: string;
  subject?: string;
  status?: string;
  dueDate?: string;
  search?: string;
}

export interface ParentAssignmentsResponse {
  children: ChildProfile[];
  selectedChild: ChildProfile | null;
  assignments: ParentAssignment[];
  summary: ParentAssignmentsSummary;
  subjects: string[];
}

export interface ParentSubjectResult {
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

export interface ParentExamCard {
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
  subjects: ParentSubjectResult[];
}

export interface ParentExamResultsQueryParams {
  studentId?: string;
  academicYear?: string;
  search?: string;
}

export interface ParentExamResultsResponse {
  children: ChildProfile[];
  selectedChild: ChildProfile | null;
  summary: {
    totalExams: number;
    totalSubjectsPassed: number;
    totalSubjectsFailed: number;
    overallAveragePercentage: number;
  };
  exams: ParentExamCard[];
}



