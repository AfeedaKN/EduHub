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
  id?: string;
  classId?: string;
  className: string;
  section: string;
  subject?: string;
  academicYear?: string;
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

export interface TeacherStudentItem {
  id: string;
  fullName: string;
  studentId: string;
  grade: string;
  section: string;
  rollNumber?: string;
  avatarUrl?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | string;
  academicYear?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
}

export interface TeacherStudentFilterParams {
  search?: string;
  className?: string;
  grade?: string;
  section?: string;
  status?: string;
  academicYear?: string;
}

