import type { AssignmentStatus } from '../models/Assignment.model';

export interface AssignmentDTO {
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
  assignedDate: string;
  dueDate: string;
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

export interface AssignmentSummaryStatsDTO {
  total: number;
  published: number;
  drafts: number;
  pastDue: number;
}

export interface CreateAssignmentDTO {
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

export interface UpdateAssignmentDTO {
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

export interface AssignmentFilterParamsDTO {
  academicYear?: string;
  className?: string;
  section?: string;
  subject?: string;
  status?: string;
  search?: string;
}

export interface AssignmentsListResponseDTO {
  assignments: AssignmentDTO[];
  summary: AssignmentSummaryStatsDTO;
}

export interface TeacherGradingHistoryEntryDTO {
  marksObtained: number;
  maxMarks: number;
  feedback?: string;
  gradedBy: string;
  gradedAt: string;
  isPublished: boolean;
  action: 'DRAFT_SAVED' | 'PUBLISHED' | 'UPDATED';
}

export interface TeacherSubmissionItemDTO {
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
  gradingHistory: TeacherGradingHistoryEntryDTO[];
}

export interface GradeSubmissionDTO {
  marksObtained: number;
  feedback?: string;
  publishResult?: boolean;
}

