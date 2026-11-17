export interface AdminAssignmentSummaryStats {
  totalAssignments: number;
  publishedAssignments: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  evaluatedSubmissions: number;
  resultsPublished: number;
  pendingEvaluations: number;
}

export interface AdminAssignmentListItem {
  id: string;
  title: string;
  description: string;
  teacherName: string;
  teacherId: string;
  teacherUserId: string;
  className: string;
  section: string;
  subject: string;
  academicYear: string;
  assignedDate: string;
  dueDate: string;
  maxMarks: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | string;
  attachmentUrl?: string;
  attachmentName?: string;
  totalStudents: number;
  submittedCount: number;
  pendingCount: number;
  evaluatedCount: number;
  resultsPublishedCount: number;
  resultPublicationStatus: 'PUBLISHED' | 'PARTIALLY_PUBLISHED' | 'UNPUBLISHED';
  createdAt: string;
  updatedAt: string;
}

export interface AdminAssignmentFilterMetadata {
  academicYears: string[];
  classes: { className: string; sections: string[] }[];
  subjects: string[];
  teachers: { id: string; name: string; employeeId?: string }[];
}

export interface AdminAssignmentListResponse {
  assignments: AdminAssignmentListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: AdminAssignmentSummaryStats;
  filterMetadata: AdminAssignmentFilterMetadata;
}

export interface AdminStudentSubmissionItem {
  studentId: string;
  studentName: string;
  admissionId: string;
  rollNumber?: string;
  avatarUrl?: string;
  submissionId?: string;
  submissionDate?: string;
  submissionStatus: 'SUBMITTED' | 'NOT_SUBMITTED';
  evaluationStatus: 'GRADED' | 'UNDER_REVIEW' | 'PENDING' | 'NOT_SUBMITTED';
  marksObtained?: number | null;
  maxMarks: number;
  resultPublicationStatus: 'PUBLISHED' | 'UNPUBLISHED' | 'NOT_SUBMITTED';
  answerText?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
  isLate?: boolean;
  version?: number;
  gradingHistory?: Array<{
    marksObtained: number;
    maxMarks: number;
    feedback?: string;
    gradedAt: string;
    isPublished: boolean;
    action: string;
  }>;
}

export interface AdminAssignmentDetails {
  assignment: AdminAssignmentListItem;
  overview: {
    totalEnrolled: number;
    submitted: number;
    pending: number;
    evaluated: number;
    resultsPublished: number;
    submissionRatePercentage: number;
    evaluationRatePercentage: number;
  };
  students: AdminStudentSubmissionItem[];
}

export interface AdminTeacherMonitoringItem {
  teacherId: string;
  teacherUserId?: string;
  teacherName: string;
  employeeId: string;
  email: string;
  department?: string;
  assignmentsCreated: number;
  publishedAssignments: number;
  totalSubmissionsReceived: number;
  pendingEvaluations: number;
  publishedResults: number;
  classesTaught: string[];
  subjectsTaught: string[];
}

export interface AdminAssignmentFilterParams {
  search?: string;
  teacherId?: string;
  academicYear?: string;
  className?: string;
  section?: string;
  subject?: string;
  status?: string;
  submissionStatus?: string;
  resultPublicationStatus?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
