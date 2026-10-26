import {
  ExamType,
  ExamStatus,
  VALID_EXAM_TYPES,
  VALID_EXAM_STATUSES,
} from '../models/Exam.model';
import { ExamMarksStatus } from '../models/ExamMarks.model';

export { ExamType, ExamStatus, VALID_EXAM_TYPES, VALID_EXAM_STATUSES, ExamMarksStatus };

export interface ApplicableClassDTO {
  classId: string;
  className: string;
}

export interface CreateExamDTO {
  name: string;
  examType: ExamType;
  academicYear: string;
  applicableClassIds: string[];
  startDate: string;
  endDate: string;
  description?: string;
  status?: ExamStatus;
}

export interface UpdateExamDTO {
  name?: string;
  examType?: ExamType;
  academicYear?: string;
  applicableClassIds?: string[];
  startDate?: string;
  endDate?: string;
  description?: string;
  status?: ExamStatus;
}

export interface ExamFilterDTO {
  academicYear?: string;
  examType?: ExamType;
  status?: ExamStatus;
  search?: string;
}

export interface ExamResponseDTO {
  id: string;
  name: string;
  examType: ExamType;
  academicYear: string;
  applicableClasses: ApplicableClassDTO[];
  startDate: string;
  endDate: string;
  description: string;
  status: ExamStatus;
  scheduledSubjectsCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamsSummaryDTO {
  totalExams: number;
  upcomingExams: number;
  completedExams: number;
  publishedResults: number;
}

export interface CreateScheduleDTO {
  classId: string;
  section: string;
  subject: string;
  examDate: string;
  startTime: string;
  endTime: string;
  maxMarks: number;
  passingMarks: number;
  roomNumber?: string;
  notes?: string;
}

export interface UpdateScheduleDTO {
  classId?: string;
  section?: string;
  subject?: string;
  examDate?: string;
  startTime?: string;
  endTime?: string;
  maxMarks?: number;
  passingMarks?: number;
  roomNumber?: string;
  notes?: string;
}

export interface ExamScheduleResponseDTO {
  id: string;
  examId: string;
  academicYear: string;
  classId: string;
  className: string;
  sectionId?: string;
  section: string;
  subject: string;
  examDate: string;
  startTime: string;
  endTime: string;
  formattedTime: string;
  maxMarks: number;
  passingMarks: number;
  roomNumber: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReturnMarksDTO {
  reason: string;
}

export interface ManagementResultsSummaryDTO {
  totalExams: number;
  scheduledSubjects: number;
  pendingReviews: number;
  returnedForCorrection: number;
  publishedResults: number;
}

export interface ManagementSubjectScheduleItemDTO {
  id: string;
  examId: string;
  examName: string;
  examType: ExamType;
  academicYear: string;
  className: string;
  classId: string;
  section: string;
  subject: string;
  examDate: string;
  maxMarks: number;
  passingMarks: number;
  roomNumber: string;
  assignedTeacherName: string;
  totalStudents: number;
  evaluatedStudentsCount: number;
  missingStudentsCount: number;
  marksStatus: ExamMarksStatus | 'PENDING';
  submittedAt?: string | null;
  submittedByName?: string;
  returnedAt?: string | null;
  returnedByName?: string;
  returnReason?: string;
  publishedAt?: string | null;
  publishedByName?: string;
}

export interface ManagementResultsDashboardResponseDTO {
  summary: ManagementResultsSummaryDTO;
  records: ManagementSubjectScheduleItemDTO[];
}

export interface ManagementResultsFilterDTO {
  academicYear?: string;
  examId?: string;
  className?: string;
  section?: string;
  subject?: string;
  status?: string;
  search?: string;
}

export interface StudentEvaluationItemDTO {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  rollNumber: string;
  marksObtained: number | null;
  isAbsent: boolean;
  remarks: string;
  isMissing: boolean;
  isPassed: boolean | null;
  percentage: number | null;
  grade: string | null;
}

export interface ManagementScheduleMarksReviewDetailsDTO {
  schedule: ExamScheduleResponseDTO;
  examName: string;
  examType: ExamType;
  marksDoc: {
    id?: string;
    status: ExamMarksStatus | 'PENDING';
    teacherName: string;
    submittedAt?: string | null;
    submittedByName?: string;
    returnedAt?: string | null;
    returnedByName?: string;
    returnReason?: string;
    publishedAt?: string | null;
    publishedByName?: string;
    reviewHistory?: Array<{
      status: string;
      changedAt: string;
      changedByName: string;
      reason?: string;
    }>;
  } | null;
  roster: StudentEvaluationItemDTO[];
  summary: {
    totalEnrolled: number;
    validMarksCount: number;
    absentCount: number;
    missingCount: number;
    isComplete: boolean;
    canPublish: boolean;
    canReturn: boolean;
    averageMarks: number | null;
    passingCount: number;
    failingCount: number;
  };
}

