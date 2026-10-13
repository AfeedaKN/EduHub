export interface TeacherClassSummaryDTO {
  id?: string;
  classId?: string;
  className: string;
  section: string;
  subject?: string;
  academicYear?: string;
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
  academicYear?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
}

export interface TeacherStudentsQueryDTO {
  search?: string;
  className?: string;
  grade?: string;
  section?: string;
  status?: string;
  academicYear?: string;
  page?: string | number;
  limit?: string | number;
}

