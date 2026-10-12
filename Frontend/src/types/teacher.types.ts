export interface TeacherProfile {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  qualification?: string;
}

export interface TeacherSummaryStats {
  assignedClassesCount: number;
  totalStudentsCount: number;
  todayClassesCount: number;
  pendingAssignmentsCount: number | null;
}

export interface TeacherClassItem {
  classId?: string;
  className: string;
  section: string;
  subject?: string;
  studentCount: number;
}

export interface TodayTimetableSlot {
  id: string;
  className: string;
  section: string;
  subject: string;
  time: string;
  roomNumber?: string;
}

export interface UpcomingActivity {
  id: string;
  title: string;
  type: string;
  date: string;
  className?: string;
}

export interface TeacherNotice {
  id: string;
  title: string;
  date: string;
  category?: string;
}

export interface TeacherDashboardData {
  teacher: TeacherProfile;
  summaryStats: TeacherSummaryStats;
  assignedClasses: TeacherClassItem[];
  todayTimetable: TodayTimetableSlot[];
  upcomingActivities: UpcomingActivity[];
  recentNotices: TeacherNotice[];
}
