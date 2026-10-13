export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export interface StudentAttendanceItem {
  studentId: string;
  admissionNumber: string;
  rollNumber: string;
  fullName: string;
  status: AttendanceStatus;
  remarks?: string;
  avatarUrl?: string;
  attendanceId?: string;
}

export interface AttendanceSummaryMetrics {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

export interface AttendanceRegister {
  className: string;
  section: string;
  date: string;
  academicYear: string;
  isAlreadyMarked: boolean;
  existingCount: number;
  summary: AttendanceSummaryMetrics;
  students: StudentAttendanceItem[];
  lastUpdated?: string;
  markedByName?: string;
}

export interface SaveAttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface SaveAttendancePayload {
  className: string;
  section: string;
  date: string;
  academicYear?: string;
  records: SaveAttendanceRecord[];
}

export interface AttendanceHistoryEntry {
  date: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
  updatedAt: string;
  markedByName?: string;
}
