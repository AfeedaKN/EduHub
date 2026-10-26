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

export type TeacherMarksStatus =
  | 'PENDING'
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PUBLISHED'
  | 'RETURNED';

export interface TeacherExamSummary {
  assignedExams: number;
  upcomingExams: number;
  marksPending: number;
  submittedForReview: number;
}

export interface TeacherExamScheduleItem {
  id: string;
  examId: string;
  examName: string;
  examType: ExamType;
  academicYear: string;
  examStartDate: string;
  examEndDate: string;
  examDate: string;
  startTime: string;
  endTime: string;
  formattedTime: string;
  classId: string;
  className: string;
  section: string;
  subject: string;
  maxMarks: number;
  passingMarks: number;
  roomNumber: string;
  notes?: string;
  marksStatus: TeacherMarksStatus;
  marksSubmittedAt?: string | null;
  marksSubmittedByName?: string;
  marksReturnedAt?: string | null;
  marksReturnedByName?: string;
  marksReturnReason?: string;
  totalStudents: number;
  enteredMarksCount: number;
}

export interface TeacherExamsListResponse {
  summary: TeacherExamSummary;
  schedules: TeacherExamScheduleItem[];
}

export interface StudentRosterMarkItem {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  rollNumber: string;
  marksObtained: number | null;
  isAbsent: boolean;
  remarks: string;
}

export interface TeacherExamScheduleDetails {
  schedule: TeacherExamScheduleItem;
  isReadOnly: boolean;
  students: StudentRosterMarkItem[];
  summary: {
    totalStudents: number;
    enteredCount: number;
    remainingCount: number;
  };
}

export interface SaveStudentMarkInput {
  studentId: string;
  marksObtained?: number | null;
  isAbsent?: boolean;
  remarks?: string;
}

export interface SaveMarksPayload {
  records: SaveStudentMarkInput[];
}

export interface TeacherExamFilterParams {
  academicYear?: string;
  examType?: string;
  className?: string;
  section?: string;
  status?: string;
  search?: string;
}

export const TEACHER_MARKS_STATUS_LABELS: Record<TeacherMarksStatus, string> = {
  PENDING: 'Marks Pending',
  DRAFT: 'Draft Saved',
  RETURNED: 'Returned for Correction',
  SUBMITTED: 'Submitted for Review',
  PUBLISHED: 'Published',
};

export interface ManagementResultsSummary {
  totalExams: number;
  scheduledSubjects: number;
  pendingReviews: number;
  returnedForCorrection: number;
  publishedResults: number;
}

export interface ManagementSubjectScheduleItem {
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
  marksStatus: TeacherMarksStatus;
  submittedAt?: string | null;
  submittedByName?: string;
  returnedAt?: string | null;
  returnedByName?: string;
  returnReason?: string;
  publishedAt?: string | null;
  publishedByName?: string;
}

export interface ManagementResultsDashboardResponse {
  summary: ManagementResultsSummary;
  records: ManagementSubjectScheduleItem[];
}

export interface ManagementResultsFilterParams {
  academicYear?: string;
  examId?: string;
  className?: string;
  section?: string;
  subject?: string;
  status?: string;
  search?: string;
}

export interface StudentEvaluationItem {
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

export interface ManagementScheduleMarksReviewDetails {
  schedule: ExamSchedule;
  examName: string;
  examType: ExamType;
  marksDoc: {
    id?: string;
    status: TeacherMarksStatus;
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
  roster: StudentEvaluationItem[];
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

