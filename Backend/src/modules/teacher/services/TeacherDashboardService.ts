import { ITeacherDashboardRepository } from '../repositories/TeacherDashboardRepository';
import {
  TeacherDashboardResponseDTO,
  TeacherClassSummaryDTO,
  TodayTimetableSlotDTO,
  TeacherStudentItemDTO,
  TeacherStudentsQueryDTO,
} from '../dtos/teacherDashboard.dto';
import { NotFoundError } from '../../../shared/domain/errors/AppError';

export class TeacherDashboardService {
  constructor(private readonly repo: ITeacherDashboardRepository) {}

  /**
   * Aggregate real dashboard data for the authenticated teacher
   */
  async getTeacherDashboard(userId: string): Promise<TeacherDashboardResponseDTO> {
    const teacher = await this.repo.findTeacherByUserId(userId);
    const user = await this.repo.findUserById(userId);

    if (!teacher && !user) {
      throw new NotFoundError('Teacher profile not found.');
    }

    const fullName = teacher?.fullName || user?.fullName || 'Teacher';
    const email = teacher?.email || user?.email || '';
    const phone = teacher?.phone || user?.phone || '';
    const employeeId = teacher?.employeeId || 'STAFF';
    const department = teacher?.department || 'General';
    const designation = teacher?.designation || 'Teacher';
    const qualification = teacher?.qualification || '';

    // Calculate real student counts for assigned classes
    const assignedClassesRaw = teacher?.assignedClasses || [];
    const assignedClassesWithCounts: TeacherClassSummaryDTO[] = await Promise.all(
      assignedClassesRaw.map(async (ac) => {
        const studentCount = await this.repo.countStudentsInClass(
          ac.className,
          ac.section,
          ac.academicYear
        );
        return {
          id: (ac as any)._id ? (ac as any)._id.toString() : undefined,
          classId: ac.classId ? ac.classId.toString() : undefined,
          className: ac.className,
          section: ac.section,
          subject: ac.subject || '',
          academicYear: ac.academicYear || '2026-2027',
          studentCount,
        };
      })
    );

    const totalStudentsCount = assignedClassesWithCounts.reduce(
      (sum, c) => sum + c.studentCount,
      0
    );

    // Fetch real today timetable periods for authenticated teacher
    const dayNames = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    const todayDay = dayNames[new Date().getDay()];

    let todayTimetable: TodayTimetableSlotDTO[] = [];
    if (teacher && typeof this.repo.findTimetablePeriodsByTeacher === 'function') {
      const realPeriods = await this.repo.findTimetablePeriodsByTeacher(
        teacher._id.toString(),
        undefined,
        todayDay
      );
      todayTimetable = realPeriods.map((p) => ({
        id: p._id ? p._id.toString() : (p as any).id || '',
        className: p.className,
        section: p.section,
        subject: p.subject,
        time: `${this.formatTime12Hour(p.startTime)} - ${this.formatTime12Hour(p.endTime)}`,
        roomNumber: p.roomNumber || 'Assigned Classroom',
      }));
    }

    return {
      teacher: {
        id: teacher?._id ? teacher._id.toString() : user?._id.toString() || '',
        employeeId,
        fullName,
        email,
        phone,
        department,
        designation,
        qualification,
      },
      summaryStats: {
        assignedClassesCount: assignedClassesWithCounts.length,
        totalStudentsCount,
        todayClassesCount: todayTimetable.length,
        pendingAssignmentsCount: null, // Coming soon: assignments grading module
      },
      assignedClasses: assignedClassesWithCounts,
      todayTimetable,
      upcomingActivities: [],
      recentNotices: [
        {
          id: 'notice-1',
          title: 'Upcoming Mid-Term Examination Schedule Announcement',
          date: new Date().toISOString(),
          category: 'Academic',
        },
        {
          id: 'notice-2',
          title: 'Parent-Teacher Meeting (PTM) slot booking opens next Monday',
          date: new Date(Date.now() - 86400000).toISOString(),
          category: 'Administrative',
        },
      ],
    };
  }

  /**
   * Get list of classes assigned to this teacher
   */
  async getTeacherClasses(userId: string): Promise<TeacherClassSummaryDTO[]> {
    const teacher = await this.repo.findTeacherByUserId(userId);
    if (!teacher) {
      return [];
    }

    return await Promise.all(
      (teacher.assignedClasses || []).map(async (ac) => {
        const studentCount = await this.repo.countStudentsInClass(
          ac.className,
          ac.section,
          ac.academicYear
        );
        return {
          id: (ac as any)._id ? (ac as any)._id.toString() : undefined,
          classId: ac.classId ? ac.classId.toString() : undefined,
          className: ac.className,
          section: ac.section,
          subject: ac.subject || '',
          academicYear: ac.academicYear || '2026-2027',
          studentCount,
        };
      })
    );
  }

  /**
   * Get official enrolled students belonging to this teacher's classes with optional filtering
   */
  async getTeacherStudents(
    userId: string,
    query?: TeacherStudentsQueryDTO
  ): Promise<TeacherStudentItemDTO[]> {
    const teacher = await this.repo.findTeacherByUserId(userId);
    if (!teacher || !teacher.assignedClasses || teacher.assignedClasses.length === 0) {
      return [];
    }

    const filters = teacher.assignedClasses.map((ac) => ({
      grade: ac.className,
      section: ac.section,
    }));

    const options = query
      ? {
          grade: query.grade || query.className,
          section: query.section,
          status: query.status,
          academicYear: query.academicYear,
          search: query.search,
        }
      : undefined;

    const students = await this.repo.findStudentsByClasses(filters, options);

    return students.map((s) => {
      const parent = s.parentId as any;
      const isParentObj = parent && typeof parent === 'object';
      return {
        id: s._id.toString(),
        fullName: s.fullName,
        studentId: s.studentId,
        grade: s.grade,
        section: s.section,
        rollNumber: s.rollNumber || '',
        avatarUrl: s.avatarUrl || '',
        status: s.status,
        academicYear: s.academicYear || '',
        parentName: isParentObj ? parent.fullName : undefined,
        parentPhone: isParentObj ? parent.phone : undefined,
        parentEmail: isParentObj ? parent.email : undefined,
      };
    });
  }

  /**
   * Helper to format "HH:mm" to 12-hour "9:00 AM"
   */
  private formatTime12Hour(timeStr: string): string {
    const parts = timeStr.trim().split(':');
    let h = parseInt(parts[0], 10);
    const m = (parts[1] || '00').padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${m} ${ampm}`;
  }

  /**
   * Get complete weekly schedule for authenticated teacher
   */
  async getTeacherWeeklyTimetable(userId: string, academicYear?: string) {
    const teacher = await this.repo.findTeacherByUserId(userId);
    if (!teacher) {
      throw new NotFoundError('Teacher profile not found.');
    }

    const periods = await this.repo.findTimetablePeriodsByTeacher(
      teacher._id.toString(),
      academicYear
    );

    return {
      academicYear: academicYear || '2026-2027',
      teacher: {
        id: teacher._id.toString(),
        fullName: teacher.fullName,
        employeeId: teacher.employeeId,
        department: teacher.department,
      },
      periods: periods.map((p) => ({
        id: p._id ? p._id.toString() : (p as any).id || '',
        academicYear: p.academicYear,
        classId: p.classId ? p.classId.toString() : '',
        className: p.className,
        section: p.section,
        dayOfWeek: p.dayOfWeek,
        startTime: p.startTime,
        endTime: p.endTime,
        formattedTime: `${this.formatTime12Hour(p.startTime)} - ${this.formatTime12Hour(
          p.endTime
        )}`,
        subject: p.subject,
        teacherId: p.teacherId ? p.teacherId.toString() : undefined,
        teacherName: p.teacherName || teacher.fullName,
        roomNumber: p.roomNumber || '',
        periodType: p.periodType || 'TEACHING',
        notes: p.notes || '',
      })),
    };
  }
}

