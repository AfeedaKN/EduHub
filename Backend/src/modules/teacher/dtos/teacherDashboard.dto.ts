export interface TeacherClassSummaryDTO {
  classId?: string;
  className: string;
  section: string;
  subject?: string;
  studentCount: number;
}

export interface TodayTimetableSlotDTO {
  id: string;
  className: string;
  section: string;
  subject: string;
  time: string;
  roomNumber?: string;
}

export interface UpcomingActivityDTO {
  id: string;
  title: string;
  type: string;
  date: string;
  className?: string;
}

export interface TeacherNoticeDTO {
  id: string;
  title: string;
  date: string;
  category?: string;
}

export interface TeacherDashboardResponseDTO {
  teacher: {
    id: string;
    employeeId: string;
    fullName: string;
    email: string;
    phone: string;
    department: string;
    designation: string;
    qualification?: string;
  };
  summaryStats: {
    assignedClassesCount: number;
    totalStudentsCount: number;
    todayClassesCount: number;
    pendingAssignmentsCount: number | null;
  };
  assignedClasses: TeacherClassSummaryDTO[];
  todayTimetable: TodayTimetableSlotDTO[];
  upcomingActivities: UpcomingActivityDTO[];
  recentNotices: TeacherNoticeDTO[];
}

export interface TeacherStudentItemDTO {
  id: string;
  fullName: string;
  studentId: string;
  grade: string;
  section: string;
  rollNumber?: string;
  avatarUrl?: string;
  status: string;
}
