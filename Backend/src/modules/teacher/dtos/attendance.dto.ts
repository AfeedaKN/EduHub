import type { AttendanceStatus } from '../models/Attendance.model';

export interface StudentAttendanceItemDTO {
  studentId: string;
  admissionNumber: string;
  rollNumber: string;
  fullName: string;
  status: AttendanceStatus;
  remarks?: string;
  avatarUrl?: string;
  attendanceId?: string;
}

export interface AttendanceSummaryMetricsDTO {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

export interface AttendanceRegisterDTO {
  className: string;
  section: string;
  date: string;
  academicYear: string;
  isAlreadyMarked: boolean;
  existingCount: number;
  summary: AttendanceSummaryMetricsDTO;
  students: StudentAttendanceItemDTO[];
  lastUpdated?: Date;
  markedByName?: string;
}

export interface SaveAttendanceRecordDTO {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface SaveAttendanceDTO {
  className: string;
  section: string;
  date: string;
  academicYear?: string;
  records: SaveAttendanceRecordDTO[];
}

export interface AttendanceHistoryEntryDTO {
  date: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
  updatedAt: Date;
  markedByName?: string;
}
