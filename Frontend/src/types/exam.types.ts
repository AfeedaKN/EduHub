export type ExamType =
  | 'UNIT_TEST'
  | 'FIRST_TERM'
  | 'MID_TERM'
  | 'SECOND_TERM'
  | 'ANNUAL_EXAM'
  | 'OTHER';

export type ExamStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ApplicableClass {
  classId: string;
  className: string;
}

export interface Exam {
  id: string;
  name: string;
  examType: ExamType;
  academicYear: string;
  applicableClasses: ApplicableClass[];
  startDate: string;
  endDate: string;
  description: string;
  status: ExamStatus;
  scheduledSubjectsCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamsSummaryCounts {
  totalExams: number;
  upcomingExams: number;
  completedExams: number;
  publishedResults: number;
}

export interface ExamSchedule {
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

export interface CreateExamPayload {
  name: string;
  examType: ExamType;
  academicYear: string;
  applicableClassIds: string[];
  startDate: string;
  endDate: string;
  description?: string;
  status?: ExamStatus;
}

export interface UpdateExamPayload {
  name?: string;
  examType?: ExamType;
  academicYear?: string;
  applicableClassIds?: string[];
  startDate?: string;
  endDate?: string;
  description?: string;
  status?: ExamStatus;
}

export interface ExamFilterParams {
  academicYear?: string;
  examType?: string;
  status?: string;
  search?: string;
}

export interface CreateSchedulePayload {
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

export interface UpdateSchedulePayload {
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

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  UNIT_TEST: 'Unit Test',
  FIRST_TERM: 'First Term',
  MID_TERM: 'Mid-Term',
  SECOND_TERM: 'Second Term',
  ANNUAL_EXAM: 'Annual Exam',
  OTHER: 'Other',
};

export const EXAM_STATUS_LABELS: Record<ExamStatus, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};
