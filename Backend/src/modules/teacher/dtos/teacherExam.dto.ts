import { ExamType } from '../../admin/models/Exam.model';
import { ExamMarksStatus } from '../../admin/models/ExamMarks.model';

export type TeacherMarksEntryStatus = 'PENDING' | ExamMarksStatus;

export interface TeacherExamSummaryDTO {
  assignedExams: number;
  upcomingExams: number;
  marksPending: number;
  submittedForReview: number;
}

export interface TeacherExamScheduleItemDTO {
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
  marksStatus: TeacherMarksEntryStatus;
  marksSubmittedAt?: string | null;
  marksSubmittedByName?: string;
  marksReturnedAt?: string | null;
  marksReturnedByName?: string;
  marksReturnReason?: string;
  totalStudents: number;
  enteredMarksCount: number;
}

export interface TeacherExamsListResponseDTO {
  summary: TeacherExamSummaryDTO;
  schedules: TeacherExamScheduleItemDTO[];
}

export interface StudentRosterMarkItemDTO {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  rollNumber: string;
  marksObtained: number | null;
  isAbsent: boolean;
  remarks: string;
}

export interface TeacherExamScheduleDetailsDTO {
  schedule: TeacherExamScheduleItemDTO;
  isReadOnly: boolean;
  students: StudentRosterMarkItemDTO[];
  summary: {
    totalStudents: number;
    enteredCount: number;
    remainingCount: number;
  };
}

export interface SaveStudentMarkInputDTO {
  studentId: string;
  marksObtained?: number | null;
  isAbsent?: boolean;
  remarks?: string;
}

export interface SaveExamMarksDTO {
  records: SaveStudentMarkInputDTO[];
}

export interface TeacherExamFilterParamsDTO {
  academicYear?: string;
  examType?: string;
  className?: string;
  section?: string;
  status?: string;
  search?: string;
}
