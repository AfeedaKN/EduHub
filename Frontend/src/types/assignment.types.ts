export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  teacherUserId: string;
  teacherName: string;
  classId?: string;
  className: string;
  section: string;
  subject: string;
  academicYear: string;
  assignedDate: string; // "YYYY-MM-DD"
  dueDate: string; // "YYYY-MM-DD"
  maxMarks: number;
  status: AssignmentStatus;
  attachmentUrl?: string;
  attachmentName?: string;
  submissionStats?: {
    total: number;
    pending: number;
    graded: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TeacherGradingHistoryEntry {
  marksObtained: number;
  maxMarks: number;
  feedback?: string;
  gradedBy: string;
  gradedAt: string;
  isPublished: boolean;
  action: 'DRAFT_SAVED' | 'PUBLISHED' | 'UPDATED';
}

export interface TeacherSubmissionItem {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentRollNumber: string;
  studentAdmissionNumber: string;
  studentAvatarUrl?: string;
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
  marksObtained: number | null;
  maxMarks: number;
  feedback: string;
  isPublished: boolean;
  publishedAt: string | null;
  gradedAt: string | null;
  gradedBy: string | null;
  gradingHistory: TeacherGradingHistoryEntry[];
}

export interface GradeSubmissionPayload {
  marksObtained: number;
  feedback?: string;
  publishResult?: boolean;
}

export interface AssignmentSummaryStats {
  total: number;
  published: number;
  drafts: number;
  pastDue: number;
}

export interface AssignmentsListResponse {
  assignments: Assignment[];
  summary: AssignmentSummaryStats;
}

export interface CreateAssignmentPayload {
  title: string;
  description: string;
  classId?: string;
  className: string;
  section: string;
  subject: string;
  academicYear?: string;
  assignedDate?: string;
  dueDate: string;
  maxMarks: number;
  status?: AssignmentStatus;
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface UpdateAssignmentPayload {
  title?: string;
  description?: string;
  classId?: string;
  className?: string;
  section?: string;
  subject?: string;
  academicYear?: string;
  assignedDate?: string;
  dueDate?: string;
  maxMarks?: number;
  status?: AssignmentStatus;
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface AssignmentFilterParams {
  academicYear?: string;
  className?: string;
  section?: string;
  subject?: string;
  status?: string;
  search?: string;
}
