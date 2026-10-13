import { PeriodType, DayOfWeek } from '../models/TimetablePeriod.model';

export { PeriodType, DayOfWeek };

export interface CreatePeriodDTO {
  academicYear: string;
  classId: string;
  className?: string;
  sectionId?: string;
  section: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  subject: string;
  teacherId?: string;
  teacherName?: string;
  roomNumber?: string;
  periodType?: PeriodType;
  notes?: string;
}

export interface UpdatePeriodDTO {
  academicYear?: string;
  classId?: string;
  className?: string;
  sectionId?: string;
  section?: string;
  dayOfWeek?: DayOfWeek;
  startTime?: string;
  endTime?: string;
  subject?: string;
  teacherId?: string | null;
  teacherName?: string;
  roomNumber?: string;
  periodType?: PeriodType;
  notes?: string;
}

export interface TimetableFilterDTO {
  academicYear?: string;
  classId?: string;
  className?: string;
  section?: string;
  dayOfWeek?: DayOfWeek;
  teacherId?: string;
  periodType?: PeriodType;
}

export interface TimetablePeriodResponseDTO {
  id: string;
  academicYear: string;
  classId: string;
  className: string;
  sectionId?: string;
  section: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  formattedTime?: string;
  subject: string;
  teacherId?: string;
  teacherName?: string;
  roomNumber?: string;
  periodType: PeriodType;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherTimetableResponseDTO {
  academicYear: string;
  teacher: {
    id: string;
    fullName: string;
    employeeId?: string;
    department?: string;
  };
  periods: TimetablePeriodResponseDTO[];
}
