import {
  ExamType,
  ExamStatus,
  VALID_EXAM_TYPES,
  VALID_EXAM_STATUSES,
} from '../models/Exam.model';

export { ExamType, ExamStatus, VALID_EXAM_TYPES, VALID_EXAM_STATUSES };

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
