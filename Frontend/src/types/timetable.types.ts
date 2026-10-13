export type PeriodType = 'TEACHING' | 'BREAK' | 'ASSEMBLY' | 'ACTIVITY';

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

export const PERIOD_TYPES: { value: PeriodType; label: string; badgeClass: string }[] = [
  { value: 'TEACHING', label: 'Academic Lecture', badgeClass: 'period-type-teaching' },
  { value: 'BREAK', label: 'Recess / Break', badgeClass: 'period-type-break' },
  { value: 'ASSEMBLY', label: 'Morning Assembly', badgeClass: 'period-type-assembly' },
  { value: 'ACTIVITY', label: 'Activity / Lab', badgeClass: 'period-type-activity' },
];

export interface TimetablePeriod {
  id: string;
  academicYear: string;
  classId: string;
  className: string;
  sectionId?: string;
  section: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  formattedTime?: string; // "9:00 AM - 9:45 AM"
  subject: string;
  teacherId?: string;
  teacherName?: string;
  roomNumber?: string;
  periodType: PeriodType;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePeriodPayload {
  academicYear: string;
  classId: string;
  section: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  subject: string;
  teacherId?: string;
  teacherName?: string;
  roomNumber?: string;
  periodType?: PeriodType;
  notes?: string;
}

export interface UpdatePeriodPayload {
  academicYear?: string;
  classId?: string;
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

export interface TimetableFilterParams {
  academicYear?: string;
  classId?: string;
  className?: string;
  section?: string;
  dayOfWeek?: DayOfWeek;
  teacherId?: string;
  periodType?: PeriodType;
}

export interface TeacherWeeklyTimetableResponse {
  academicYear: string;
  teacher: {
    id: string;
    fullName: string;
    employeeId?: string;
    department?: string;
  };
  periods: TimetablePeriod[];
}
