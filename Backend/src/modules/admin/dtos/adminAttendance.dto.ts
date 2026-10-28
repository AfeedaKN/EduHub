import { AttendanceStatus } from '../../teacher/models/Attendance.model';

export type ExtendedAttendanceStatus = AttendanceStatus | 'UNMARKED';

export interface AdminAttendanceSummaryDTO {
  totalEnrolled: number;
  totalMarked: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  unmarkedCount: number;
  attendancePercentage: number;
  totalSections: number;
  sectionsSubmitted: number;
  submissionStatus: 'SUBMITTED' | 'PARTIAL' | 'PENDING';
  date: string;
  academicYear: string;
}

export interface AdminDailyRegisterItemDTO {
  studentId: string;
  admissionNumber: string;
  rollNumber: string;
  fullName: string;
  className: string;
  section: string;
  academicYear: string;
  status: ExtendedAttendanceStatus;
  remarks?: string;
  attendanceId?: string;
  date: string;
  markedById?: string;
  markedByName?: string;
  markedByEmail?: string;
  lastUpdated?: string;
  avatarUrl?: string;
}

export interface AdminDailyRegisterResponseDTO {
  records: AdminDailyRegisterItemDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalEnrolled: number;
    totalMarked: number;
    present: number;
    absent: number;
    late: number;
    unmarked: number;
    percentage: number;
  };
}

export interface AdminClassOverviewItemDTO {
  classId?: string;
  className: string;
  section: string;
  academicYear: string;
  enrolledCount: number;
  markedCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  unmarkedCount: number;
  percentage: number;
  submissionStatus: 'SUBMITTED' | 'PARTIAL' | 'NOT_SUBMITTED';
  submissionTimestamp?: string;
  assignedTeacherName?: string;
  assignedTeacherEmail?: string;
}

export interface AdminSubmissionMonitoringItemDTO {
  className: string;
  section: string;
  academicYear: string;
  assignedTeacherName: string;
  assignedTeacherEmail: string;
  assignedTeacherPhone: string;
  submissionStatus: 'SUBMITTED' | 'PENDING';
  submissionTimestamp?: string;
  markedCount: number;
  totalEnrolled: number;
}

export interface AdminMonthlyReportDayDTO {
  date: string;
  dayOfWeek: string;
  totalEnrolled: number;
  totalMarked: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  unmarkedCount: number;
  percentage: number;
  sectionsSubmitted: number;
  totalSections: number;
  status: 'RECORDED' | 'PARTIAL' | 'NO_RECORDS' | 'WEEKEND';
}

export interface AdminMonthlyReportResponseDTO {
  month: string; // e.g. "2026-10"
  academicYear: string;
  className?: string;
  section?: string;
  totalSchoolDays: number;
  averageAttendancePercentage: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  days: AdminMonthlyReportDayDTO[];
}

export interface AdminLowAttendanceItemDTO {
  studentId: string;
  admissionNumber: string;
  rollNumber: string;
  fullName: string;
  className: string;
  section: string;
  academicYear: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  percentage: number;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
}

export interface AdminStudentAttendanceHistorySessionDTO {
  attendanceId: string;
  date: string;
  dayOfWeek: string;
  status: AttendanceStatus;
  remarks?: string;
  markedByName?: string;
  updatedAt: string;
}

export interface AdminStudentAttendanceHistoryDTO {
  student: {
    id: string;
    fullName: string;
    admissionNumber: string;
    rollNumber: string;
    className: string;
    section: string;
    academicYear: string;
    avatarUrl?: string;
    parentName?: string;
    parentPhone?: string;
    parentEmail?: string;
  };
  summary: {
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    percentage: number;
  };
  history: AdminStudentAttendanceHistorySessionDTO[];
}

export interface AdminAttendanceCorrectionDTO {
  status: AttendanceStatus;
  remarks?: string;
  reason?: string;
}

export interface AdminDailyRegisterFilterDTO {
  date?: string;
  academicYear?: string;
  className?: string;
  section?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminMonthlyReportFilterDTO {
  month?: string; // YYYY-MM
  academicYear?: string;
  className?: string;
  section?: string;
}

export interface AdminLowAttendanceFilterDTO {
  threshold?: number;
  academicYear?: string;
  className?: string;
  section?: string;
  startDate?: string;
  endDate?: string;
}

// ==========================================
// Subject-Wise Attendance Dashboard Matrix DTOs
// ==========================================

export interface AdminSubjectCellStatusDTO {
  status: ExtendedAttendanceStatus;
  remarks?: string;
  markedByName?: string;
  updatedAt?: string;
}

export interface AdminSubjectGridStudentRowDTO {
  studentId: string;
  admissionNumber: string;
  rollNumber: string;
  fullName: string;
  avatarUrl?: string;
  subjects: Record<string, AdminSubjectCellStatusDTO>;
  attendancePercentage: number;
  remarks: string;
  totalSubjects: number;
  presentSubjects: number;
  absentSubjects: number;
  lateSubjects: number;
  unmarkedSubjects: number;
}

export interface AdminSubjectSummaryItemDTO {
  subjectName: string;
  subjectCode?: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  unmarkedCount: number;
  totalStudents: number;
  assignedTeacherName?: string;
}

export interface AdminAttentionStudentIssueDTO {
  subjectName: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface AdminAttentionStudentDTO {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  avatarUrl?: string;
  className: string;
  section: string;
  issues: AdminAttentionStudentIssueDTO[];
  primaryIssueDescription: string;
}

export interface AdminSubjectGridSummaryDTO {
  totalStudents: number;
  presentAllSubjects: number;
  absentAnySubject: number;
  lateCount: number;
  notMarkedCount: number;
}

export interface AdminSubjectGridResponseDTO {
  academicYear: string;
  className: string;
  section: string;
  date: string;
  dayName: string;
  totalStudents: number;
  subjects: string[];
  summary: AdminSubjectGridSummaryDTO;
  subjectSummaries: AdminSubjectSummaryItemDTO[];
  students: AdminSubjectGridStudentRowDTO[];
  requiringAttention: AdminAttentionStudentDTO[];
}

export interface AdminSubjectGridFilterDTO {
  academicYear?: string;
  className: string;
  section: string;
  date: string;
  search?: string;
  onlyAbsent?: boolean;
  status?: string;
}

export interface AdminSaveSubjectAttendanceRecordDTO {
  studentId: string;
  subjectName: string;
  status: ExtendedAttendanceStatus;
  remarks?: string;
}

export interface AdminSaveSubjectAttendancePayloadDTO {
  date: string;
  className: string;
  section: string;
  academicYear?: string;
  records: AdminSaveSubjectAttendanceRecordDTO[];
}

