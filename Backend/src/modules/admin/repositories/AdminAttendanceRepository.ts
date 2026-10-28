import mongoose from 'mongoose';
import { AttendanceModel, IAttendanceDoc, AttendanceStatus } from '../../teacher/models/Attendance.model';
import { StudentModel, IStudentDoc } from '../../parent/models/Student.model';
import { ClassModel } from '../models/Class.model';
import { SectionModel } from '../models/Section.model';
import { TeacherModel } from '../models/Teacher.model';
import { SubjectModel } from '../models/Subject.model';
import { SubjectAttendanceModel } from '../models/SubjectAttendance.model';
import { UserModel } from '../../auth/models/User.model';
import {
  AdminAttendanceSummaryDTO,
  AdminDailyRegisterItemDTO,
  AdminDailyRegisterResponseDTO,
  AdminClassOverviewItemDTO,
  AdminSubmissionMonitoringItemDTO,
  AdminMonthlyReportDayDTO,
  AdminMonthlyReportResponseDTO,
  AdminLowAttendanceItemDTO,
  AdminStudentAttendanceHistoryDTO,
  AdminDailyRegisterFilterDTO,
  AdminMonthlyReportFilterDTO,
  AdminLowAttendanceFilterDTO,
  AdminSubjectGridFilterDTO,
  AdminSubjectGridResponseDTO,
  AdminSaveSubjectAttendancePayloadDTO,
  AdminSubjectGridStudentRowDTO,
  AdminSubjectCellStatusDTO,
  AdminSubjectSummaryItemDTO,
  AdminAttentionStudentDTO,
  AdminAttentionStudentIssueDTO,
  ExtendedAttendanceStatus,
  AdminAttendanceFiltersMetadataDTO,
  AdminAttendanceClassMetadataItemDTO,
} from '../dtos/adminAttendance.dto';

export interface IAdminAttendanceRepository {
  getSummary(dateStr: string, academicYear?: string): Promise<AdminAttendanceSummaryDTO>;
  getDailyRegister(filter: AdminDailyRegisterFilterDTO): Promise<AdminDailyRegisterResponseDTO>;
  getClassesOverview(dateStr: string, academicYear?: string): Promise<AdminClassOverviewItemDTO[]>;
  getSubmissionsMonitoring(dateStr: string, academicYear?: string): Promise<AdminSubmissionMonitoringItemDTO[]>;
  getMonthlyReport(filter: AdminMonthlyReportFilterDTO): Promise<AdminMonthlyReportResponseDTO>;
  getLowAttendanceReport(filter: AdminLowAttendanceFilterDTO): Promise<AdminLowAttendanceItemDTO[]>;
  getStudentHistory(studentId: string, startDate?: string, endDate?: string): Promise<AdminStudentAttendanceHistoryDTO | null>;
  correctAttendanceRecord(
    recordId: string,
    status: AttendanceStatus,
    remarks: string,
    adminUserId: string
  ): Promise<IAttendanceDoc | null>;
  createAttendanceRecord(
    studentId: string,
    date: string,
    status: AttendanceStatus,
    remarks: string,
    adminUserId: string
  ): Promise<IAttendanceDoc>;
  getSubjectWiseAttendanceGrid(filter: AdminSubjectGridFilterDTO): Promise<AdminSubjectGridResponseDTO>;
  saveSubjectWiseAttendanceBatch(
    payload: AdminSaveSubjectAttendancePayloadDTO,
    adminUserId: string,
    adminUserName: string
  ): Promise<void>;
  getAttendanceFiltersMetadata(): Promise<AdminAttendanceFiltersMetadataDTO>;
}

export class AdminAttendanceRepository implements IAdminAttendanceRepository {
  async getSummary(dateStr: string, academicYear?: string): Promise<AdminAttendanceSummaryDTO> {
    const studentQuery: Record<string, any> = { status: 'ACTIVE' };
    if (academicYear && academicYear !== 'ALL') {
      studentQuery.academicYear = academicYear.trim();
    }

    const attendanceQuery: Record<string, any> = { date: dateStr.trim() };
    if (academicYear && academicYear !== 'ALL') {
      attendanceQuery.academicYear = academicYear.trim();
    }

    const [totalEnrolled, attendanceRecords, totalActiveSections] = await Promise.all([
      StudentModel.countDocuments(studentQuery).exec(),
      AttendanceModel.find(attendanceQuery).exec(),
      SectionModel.countDocuments({ status: 'ACTIVE' }).exec(),
    ]);

    const presentCount = attendanceRecords.filter((r) => r.status === 'PRESENT').length;
    const absentCount = attendanceRecords.filter((r) => r.status === 'ABSENT').length;
    const lateCount = attendanceRecords.filter((r) => r.status === 'LATE').length;
    const totalMarked = attendanceRecords.length;
    const unmarkedCount = Math.max(0, totalEnrolled - totalMarked);

    const attendancePercentage =
      totalEnrolled > 0
        ? Math.round(((presentCount + lateCount) / totalEnrolled) * 100)
        : totalMarked > 0
          ? Math.round(((presentCount + lateCount) / totalMarked) * 100)
          : 0;

    const submittedSectionKeys = new Set(attendanceRecords.map((r) => `${r.className}-${r.section}`));
    const sectionsSubmitted = submittedSectionKeys.size;
    const totalSections = Math.max(sectionsSubmitted, totalActiveSections);

    const submissionStatus: 'SUBMITTED' | 'PARTIAL' | 'PENDING' =
      sectionsSubmitted >= totalSections && totalSections > 0
        ? 'SUBMITTED'
        : sectionsSubmitted > 0
          ? 'PARTIAL'
          : 'PENDING';

    return {
      totalEnrolled,
      totalMarked,
      presentCount,
      absentCount,
      lateCount,
      unmarkedCount,
      attendancePercentage,
      totalSections,
      sectionsSubmitted,
      submissionStatus,
      date: dateStr,
      academicYear: academicYear && academicYear !== 'ALL' ? academicYear : '2026-2027',
    };
  }

  async getDailyRegister(filter: AdminDailyRegisterFilterDTO): Promise<AdminDailyRegisterResponseDTO> {
    const dateStr = filter.date ? filter.date.trim() : new Date().toISOString().split('T')[0];

    // Build Student Query to ensure all officially enrolled students are accounted for
    const studentQuery: Record<string, any> = { status: 'ACTIVE' };

    if (filter.className && filter.className !== 'ALL') {
      studentQuery.grade = { $regex: new RegExp(`^${filter.className.trim()}$`, 'i') };
    }

    if (filter.section && filter.section !== 'ALL') {
      studentQuery.section = { $regex: new RegExp(`^${filter.section.trim()}$`, 'i') };
    }

    if (filter.academicYear && filter.academicYear !== 'ALL') {
      studentQuery.academicYear = filter.academicYear.trim();
    }

    if (filter.search && filter.search.trim()) {
      const escaped = filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      studentQuery.$or = [
        { fullName: { $regex: searchRegex } },
        { studentId: { $regex: searchRegex } },
        { rollNumber: { $regex: searchRegex } },
      ];
    }

    const students = await StudentModel.find(studentQuery)
      .sort({ grade: 1, section: 1, rollNumber: 1, fullName: 1 })
      .lean()
      .exec();

    // Fetch attendance records for this date
    const attendanceFilter: Record<string, any> = { date: dateStr };
    if (filter.className && filter.className !== 'ALL') {
      attendanceFilter.className = { $regex: new RegExp(`^${filter.className.trim()}$`, 'i') };
    }
    if (filter.section && filter.section !== 'ALL') {
      attendanceFilter.section = { $regex: new RegExp(`^${filter.section.trim()}$`, 'i') };
    }

    const attendanceDocs = await AttendanceModel.find(attendanceFilter)
      .populate('markedBy', 'fullName email')
      .lean()
      .exec();

    const attendanceMap = new Map<string, any>();
    attendanceDocs.forEach((doc) => {
      attendanceMap.set(doc.studentId.toString(), doc);
    });

    // Merge students with their attendance status
    const allItems: AdminDailyRegisterItemDTO[] = students.map((s) => {
      const sId = s._id.toString();
      const att = attendanceMap.get(sId);

      const status = att ? att.status : 'UNMARKED';
      const markedByUser = att?.markedBy as any;

      return {
        studentId: sId,
        admissionNumber: s.studentId,
        rollNumber: s.rollNumber || '',
        fullName: s.fullName,
        className: s.grade,
        section: s.section,
        academicYear: s.academicYear || '2026-2027',
        status,
        remarks: att?.remarks || '',
        attendanceId: att?._id ? att._id.toString() : undefined,
        date: dateStr,
        markedById: markedByUser?._id ? markedByUser._id.toString() : undefined,
        markedByName: markedByUser?.fullName || undefined,
        markedByEmail: markedByUser?.email || undefined,
        lastUpdated: att?.updatedAt ? new Date(att.updatedAt).toISOString() : undefined,
        avatarUrl: s.avatarUrl || '',
      };
    });

    // Compute Summary for this query scope
    let present = 0;
    let absent = 0;
    let late = 0;
    let unmarked = 0;

    allItems.forEach((item) => {
      if (item.status === 'PRESENT') present++;
      else if (item.status === 'ABSENT') absent++;
      else if (item.status === 'LATE') late++;
      else unmarked++;
    });

    const totalEnrolled = allItems.length;
    const totalMarked = present + absent + late;
    const percentage =
      totalEnrolled > 0
        ? Math.round(((present + late) / totalEnrolled) * 100)
        : totalMarked > 0
          ? Math.round(((present + late) / totalMarked) * 100)
          : 0;

    // Filter by status if requested
    let filteredItems = allItems;
    if (filter.status && filter.status !== 'ALL') {
      const targetStatus = filter.status.trim().toUpperCase();
      filteredItems = allItems.filter((i) => i.status === targetStatus);
    }

    // Pagination
    const total = filteredItems.length;
    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const limit = filter.limit && filter.limit > 0 ? filter.limit : 50;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedRecords = filteredItems.slice(startIndex, startIndex + limit);

    return {
      records: paginatedRecords,
      total,
      page,
      limit,
      totalPages,
      summary: {
        totalEnrolled,
        totalMarked,
        present,
        absent,
        late,
        unmarked,
        percentage,
      },
    };
  }

  async getClassesOverview(dateStr: string, academicYear?: string): Promise<AdminClassOverviewItemDTO[]> {
    // 1. Fetch all classes and their sections
    const classes = await ClassModel.find({ status: 'ACTIVE' }).lean().exec();
    const classIds = classes.map((c) => c._id);
    const sections = await SectionModel.find({
      classId: { $in: classIds },
      status: 'ACTIVE',
    })
      .lean()
      .exec();

    // 2. Fetch all teachers to resolve assigned faculty
    const teachers = await TeacherModel.find({ status: 'ACTIVE' })
      .select('fullName email assignedClasses')
      .lean()
      .exec();

    const teacherMap = new Map<string, { fullName: string; email: string }>();
    teachers.forEach((t) => {
      (t.assignedClasses || []).forEach((ac) => {
        const cls = (ac.className || '').trim().toLowerCase();
        const sec = (ac.section || '').trim().toLowerCase();
        if (!cls || !sec) return;
        const key = `${cls}-${sec}`;
        if (!teacherMap.has(key)) {
          teacherMap.set(key, { fullName: t.fullName, email: t.email });
        }
      });
    });

    // 3. Fetch attendance records for date
    const attendanceFilter: Record<string, any> = { date: dateStr.trim() };
    if (academicYear && academicYear !== 'ALL') {
      attendanceFilter.academicYear = academicYear.trim();
    }

    const attendanceRecords = await AttendanceModel.find(attendanceFilter)
      .populate('markedBy', 'fullName email')
      .lean()
      .exec();

    const attendanceBySection = new Map<string, any[]>();
    attendanceRecords.forEach((att) => {
      const cls = (att.className || '').trim().toLowerCase();
      const sec = (att.section || '').trim().toLowerCase();
      if (!cls || !sec) return;
      const key = `${cls}-${sec}`;
      if (!attendanceBySection.has(key)) {
        attendanceBySection.set(key, []);
      }
      attendanceBySection.get(key)!.push(att);
    });

    // 4. Fetch student enrollment counts per grade and section
    const studentQuery: Record<string, any> = { status: 'ACTIVE' };
    if (academicYear && academicYear !== 'ALL') {
      studentQuery.academicYear = academicYear.trim();
    }

    const studentCounts = await StudentModel.aggregate([
      { $match: studentQuery },
      {
        $group: {
          _id: { grade: '$grade', section: '$section' },
          count: { $sum: 1 },
        },
      },
    ]);

    const enrollmentMap = new Map<string, number>();
    studentCounts.forEach((sc) => {
      const grade = (sc._id?.grade || '').trim().toLowerCase();
      const sec = (sc._id?.section || '').trim().toLowerCase();
      if (!grade || !sec) return;
      const key = `${grade}-${sec}`;
      enrollmentMap.set(key, sc.count);
    });

    // 5. Construct Class Overview items
    const overviewList: AdminClassOverviewItemDTO[] = [];

    // Map through classes and their sections
    for (const cls of classes) {
      const classSections = sections.filter((s) => s.classId.toString() === cls._id.toString());

      if (classSections.length === 0) {
        // Class has no sections yet; check section 'A'
        const key = `${cls.name.trim().toLowerCase()}-a`;
        const enrolledCount = enrollmentMap.get(key) || 0;
        const attList = attendanceBySection.get(key) || [];
        const presentCount = attList.filter((r) => r.status === 'PRESENT').length;
        const absentCount = attList.filter((r) => r.status === 'ABSENT').length;
        const lateCount = attList.filter((r) => r.status === 'LATE').length;
        const markedCount = attList.length;
        const unmarkedCount = Math.max(0, enrolledCount - markedCount);
        const percentage =
          enrolledCount > 0
            ? Math.round(((presentCount + lateCount) / enrolledCount) * 100)
            : markedCount > 0
              ? Math.round(((presentCount + lateCount) / markedCount) * 100)
              : 0;

        const submissionStatus: 'SUBMITTED' | 'PARTIAL' | 'NOT_SUBMITTED' =
          markedCount >= enrolledCount && enrolledCount > 0
            ? 'SUBMITTED'
            : markedCount > 0
              ? 'PARTIAL'
              : 'NOT_SUBMITTED';

        const teacher = teacherMap.get(key);
        const lastAtt = attList[0];

        overviewList.push({
          classId: cls._id.toString(),
          className: cls.name,
          section: 'A',
          academicYear: cls.academicYear || '2026-2027',
          enrolledCount,
          markedCount,
          presentCount,
          absentCount,
          lateCount,
          unmarkedCount,
          percentage,
          submissionStatus,
          submissionTimestamp: lastAtt?.updatedAt ? new Date(lastAtt.updatedAt).toISOString() : undefined,
          assignedTeacherName: teacher?.fullName,
          assignedTeacherEmail: teacher?.email,
        });
      } else {
        for (const sec of classSections) {
          const key = `${cls.name.trim().toLowerCase()}-${sec.name.trim().toLowerCase()}`;
          const enrolledCount = enrollmentMap.get(key) || 0;
          const attList = attendanceBySection.get(key) || [];
          const presentCount = attList.filter((r) => r.status === 'PRESENT').length;
          const absentCount = attList.filter((r) => r.status === 'ABSENT').length;
          const lateCount = attList.filter((r) => r.status === 'LATE').length;
          const markedCount = attList.length;
          const unmarkedCount = Math.max(0, enrolledCount - markedCount);
          const percentage =
            enrolledCount > 0
              ? Math.round(((presentCount + lateCount) / enrolledCount) * 100)
              : markedCount > 0
                ? Math.round(((presentCount + lateCount) / markedCount) * 100)
                : 0;

          const submissionStatus: 'SUBMITTED' | 'PARTIAL' | 'NOT_SUBMITTED' =
            markedCount >= enrolledCount && enrolledCount > 0
              ? 'SUBMITTED'
              : markedCount > 0
                ? 'PARTIAL'
                : 'NOT_SUBMITTED';

          const teacher = teacherMap.get(key);
          const lastAtt = attList[0];

          overviewList.push({
            classId: cls._id.toString(),
            className: cls.name,
            section: sec.name,
            academicYear: sec.academicYear || cls.academicYear || '2026-2027',
            enrolledCount,
            markedCount,
            presentCount,
            absentCount,
            lateCount,
            unmarkedCount,
            percentage,
            submissionStatus,
            submissionTimestamp: lastAtt?.updatedAt ? new Date(lastAtt.updatedAt).toISOString() : undefined,
            assignedTeacherName: teacher?.fullName,
            assignedTeacherEmail: teacher?.email,
          });
        }
      }
    }

    return overviewList;
  }

  async getSubmissionsMonitoring(dateStr: string, academicYear?: string): Promise<AdminSubmissionMonitoringItemDTO[]> {
    const classOverview = await this.getClassesOverview(dateStr, academicYear);

    // Fetch teachers with phone numbers
    const teachers = await TeacherModel.find({ status: 'ACTIVE' })
      .select('fullName email phone assignedClasses')
      .lean()
      .exec();

    const teacherContactMap = new Map<string, { fullName: string; email: string; phone: string }>();
    teachers.forEach((t) => {
      (t.assignedClasses || []).forEach((ac) => {
        const cls = (ac.className || '').trim().toLowerCase();
        const sec = (ac.section || '').trim().toLowerCase();
        if (!cls || !sec) return;
        const key = `${cls}-${sec}`;
        if (!teacherContactMap.has(key)) {
          teacherContactMap.set(key, { fullName: t.fullName, email: t.email, phone: t.phone });
        }
      });
    });

    return classOverview.map((item) => {
      const cls = (item.className || '').trim().toLowerCase();
      const sec = (item.section || '').trim().toLowerCase();
      const key = `${cls}-${sec}`;
      const contact = teacherContactMap.get(key);

      return {
        className: item.className,
        section: item.section,
        academicYear: item.academicYear,
        assignedTeacherName: contact?.fullName || item.assignedTeacherName || 'Not Assigned',
        assignedTeacherEmail: contact?.email || item.assignedTeacherEmail || '',
        assignedTeacherPhone: contact?.phone || '',
        submissionStatus: item.submissionStatus === 'SUBMITTED' ? 'SUBMITTED' : 'PENDING',
        submissionTimestamp: item.submissionTimestamp,
        markedCount: item.markedCount,
        totalEnrolled: item.enrolledCount,
      };
    });
  }

  async getMonthlyReport(filter: AdminMonthlyReportFilterDTO): Promise<AdminMonthlyReportResponseDTO> {
    const yearMonth = filter.month ? filter.month.trim() : new Date().toISOString().slice(0, 7); // e.g. "2026-10"
    const [yearStr, monthStr] = yearMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10); // 1-12

    // Calculate total days in this month
    const daysInMonth = new Date(year, month, 0).getDate();

    // Query all records for this month
    const dateRegex = new RegExp(`^${yearMonth}-\\d{2}$`);
    const query: Record<string, any> = { date: { $regex: dateRegex } };

    if (filter.className && filter.className !== 'ALL') {
      query.className = { $regex: new RegExp(`^${filter.className.trim()}$`, 'i') };
    }
    if (filter.section && filter.section !== 'ALL') {
      query.section = { $regex: new RegExp(`^${filter.section.trim()}$`, 'i') };
    }
    if (filter.academicYear && filter.academicYear !== 'ALL') {
      query.academicYear = filter.academicYear.trim();
    }

    const records = await AttendanceModel.find(query).lean().exec();

    // Group records by date
    const recordsByDate = new Map<string, any[]>();
    records.forEach((r) => {
      if (!recordsByDate.has(r.date)) {
        recordsByDate.set(r.date, []);
      }
      recordsByDate.get(r.date)!.push(r);
    });

    // Enrolled students count for denominator
    const studentQuery: Record<string, any> = { status: 'ACTIVE' };
    if (filter.className && filter.className !== 'ALL') {
      studentQuery.grade = { $regex: new RegExp(`^${filter.className.trim()}$`, 'i') };
    }
    if (filter.section && filter.section !== 'ALL') {
      studentQuery.section = { $regex: new RegExp(`^${filter.section.trim()}$`, 'i') };
    }
    if (filter.academicYear && filter.academicYear !== 'ALL') {
      studentQuery.academicYear = filter.academicYear.trim();
    }

    const [totalEnrolled, totalActiveSections] = await Promise.all([
      StudentModel.countDocuments(studentQuery).exec(),
      SectionModel.countDocuments({ status: 'ACTIVE' }).exec(),
    ]);

    const days: AdminMonthlyReportDayDTO[] = [];
    let totalPresentSum = 0;
    let totalAbsentSum = 0;
    let totalLateSum = 0;
    let schoolDaysCount = 0;
    let percentageSum = 0;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = d < 10 ? `0${d}` : `${d}`;
      const fullDate = `${yearMonth}-${dStr}`;
      const dayDate = new Date(year, month - 1, d);
      const dayOfWeekNum = dayDate.getDay();
      const dayOfWeek = dayNames[dayOfWeekNum];
      const isWeekend = dayOfWeekNum === 0 || dayOfWeekNum === 6;

      const dayRecords = recordsByDate.get(fullDate) || [];
      const presentCount = dayRecords.filter((r) => r.status === 'PRESENT').length;
      const absentCount = dayRecords.filter((r) => r.status === 'ABSENT').length;
      const lateCount = dayRecords.filter((r) => r.status === 'LATE').length;
      const totalMarked = dayRecords.length;
      const unmarkedCount = Math.max(0, totalEnrolled - totalMarked);

      const percentage =
        totalEnrolled > 0
          ? Math.round(((presentCount + lateCount) / totalEnrolled) * 100)
          : totalMarked > 0
            ? Math.round(((presentCount + lateCount) / totalMarked) * 100)
            : 0;

      const sectionsSubmitted = new Set(dayRecords.map((r) => `${r.className}-${r.section}`)).size;

      let status: 'RECORDED' | 'PARTIAL' | 'NO_RECORDS' | 'WEEKEND' = 'NO_RECORDS';
      if (isWeekend && dayRecords.length === 0) {
        status = 'WEEKEND';
      } else if (sectionsSubmitted >= totalActiveSections && totalActiveSections > 0) {
        status = 'RECORDED';
      } else if (dayRecords.length > 0) {
        status = 'PARTIAL';
      }

      if (dayRecords.length > 0 || !isWeekend) {
        if (dayRecords.length > 0) {
          schoolDaysCount++;
          percentageSum += percentage;
          totalPresentSum += presentCount;
          totalAbsentSum += absentCount;
          totalLateSum += lateCount;
        }
      }

      days.push({
        date: fullDate,
        dayOfWeek,
        totalEnrolled,
        totalMarked,
        presentCount,
        absentCount,
        lateCount,
        unmarkedCount,
        percentage,
        sectionsSubmitted,
        totalSections: totalActiveSections,
        status,
      });
    }

    const averageAttendancePercentage = schoolDaysCount > 0 ? Math.round(percentageSum / schoolDaysCount) : 0;

    return {
      month: yearMonth,
      academicYear: filter.academicYear && filter.academicYear !== 'ALL' ? filter.academicYear : '2026-2027',
      className: filter.className !== 'ALL' ? filter.className : undefined,
      section: filter.section !== 'ALL' ? filter.section : undefined,
      totalSchoolDays: schoolDaysCount,
      averageAttendancePercentage,
      totalPresent: totalPresentSum,
      totalAbsent: totalAbsentSum,
      totalLate: totalLateSum,
      days,
    };
  }

  async getLowAttendanceReport(filter: AdminLowAttendanceFilterDTO): Promise<AdminLowAttendanceItemDTO[]> {
    const threshold = typeof filter.threshold === 'number' && filter.threshold > 0 ? filter.threshold : 75;

    // Build matching criteria for attendance sessions
    const matchQuery: Record<string, any> = {};
    if (filter.academicYear && filter.academicYear !== 'ALL') {
      matchQuery.academicYear = filter.academicYear.trim();
    }
    if (filter.className && filter.className !== 'ALL') {
      matchQuery.className = { $regex: new RegExp(`^${filter.className.trim()}$`, 'i') };
    }
    if (filter.section && filter.section !== 'ALL') {
      matchQuery.section = { $regex: new RegExp(`^${filter.section.trim()}$`, 'i') };
    }
    if (filter.startDate || filter.endDate) {
      matchQuery.date = {};
      if (filter.startDate) matchQuery.date.$gte = filter.startDate;
      if (filter.endDate) matchQuery.date.$lte = filter.endDate;
    }

    // Aggregate attendance sessions per student
    const stats = await AttendanceModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$studentId',
          totalSessions: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] },
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] },
          },
          lateCount: {
            $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] },
          },
        },
      },
    ]);

    if (stats.length === 0) {
      return [];
    }

    // Filter students where percentage is below threshold
    const lowStats = stats
      .map((s) => {
        const percentage =
          s.totalSessions > 0
            ? Math.round(((s.presentCount + s.lateCount) / s.totalSessions) * 100)
            : 0;
        return { ...s, percentage };
      })
      .filter((s) => s.totalSessions >= 1 && s.percentage < threshold);

    if (lowStats.length === 0) {
      return [];
    }

    const studentIds = lowStats.map((s) => s._id);

    // Fetch student records and parent details
    const studentQuery: Record<string, any> = { _id: { $in: studentIds } };
    if (filter.className && filter.className !== 'ALL') {
      studentQuery.grade = { $regex: new RegExp(`^${filter.className.trim()}$`, 'i') };
    }
    if (filter.section && filter.section !== 'ALL') {
      studentQuery.section = { $regex: new RegExp(`^${filter.section.trim()}$`, 'i') };
    }

    const students = await StudentModel.find(studentQuery)
      .populate('parentId', 'fullName phone email')
      .lean()
      .exec();

    const studentMap = new Map<string, any>();
    students.forEach((s) => {
      studentMap.set(s._id.toString(), s);
    });

    const result: AdminLowAttendanceItemDTO[] = [];

    for (const stat of lowStats) {
      const student = studentMap.get(stat._id.toString());
      if (student) {
        const parent = student.parentId as any;

        result.push({
          studentId: student._id.toString(),
          admissionNumber: student.studentId,
          rollNumber: student.rollNumber || '',
          fullName: student.fullName,
          className: student.grade,
          section: student.section,
          academicYear: student.academicYear || '2026-2027',
          totalSessions: stat.totalSessions,
          presentCount: stat.presentCount,
          absentCount: stat.absentCount,
          lateCount: stat.lateCount,
          percentage: stat.percentage,
          parentName: parent?.fullName,
          parentPhone: parent?.phone,
          parentEmail: parent?.email,
        });
      }
    }

    // Sort ascending by percentage (lowest attendance first)
    return result.sort((a, b) => a.percentage - b.percentage);
  }

  async getStudentHistory(
    studentId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AdminStudentAttendanceHistoryDTO | null> {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return null;
    }

    const student = await StudentModel.findById(studentId)
      .populate('parentId', 'fullName phone email')
      .lean()
      .exec();

    if (!student) {
      return null;
    }

    const query: Record<string, any> = {
      studentId: new mongoose.Types.ObjectId(studentId),
    };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const records = await AttendanceModel.find(query)
      .populate('markedBy', 'fullName email')
      .sort({ date: -1 })
      .lean()
      .exec();

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const history = records.map((r) => {
      if (r.status === 'PRESENT') presentCount++;
      else if (r.status === 'ABSENT') absentCount++;
      else if (r.status === 'LATE') lateCount++;

      const dateObj = new Date(`${r.date}T00:00:00Z`);
      const dayOfWeek = dayNames[dateObj.getUTCDay()] || '';

      const markedUser = r.markedBy as any;

      return {
        attendanceId: r._id.toString(),
        date: r.date,
        dayOfWeek,
        status: r.status,
        remarks: r.remarks || '',
        markedByName: markedUser?.fullName || undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
      };
    });

    const totalSessions = records.length;
    const percentage = totalSessions > 0 ? Math.round(((presentCount + lateCount) / totalSessions) * 100) : 0;

    const parent = student.parentId as any;

    return {
      student: {
        id: student._id.toString(),
        fullName: student.fullName,
        admissionNumber: student.studentId,
        rollNumber: student.rollNumber || '',
        className: student.grade,
        section: student.section,
        academicYear: student.academicYear || '2026-2027',
        avatarUrl: student.avatarUrl || '',
        parentName: parent?.fullName,
        parentPhone: parent?.phone,
        parentEmail: parent?.email,
      },
      summary: {
        totalSessions,
        presentCount,
        absentCount,
        lateCount,
        percentage,
      },
      history,
    };
  }

  async correctAttendanceRecord(
    recordId: string,
    status: AttendanceStatus,
    remarks: string,
    adminUserId: string
  ): Promise<IAttendanceDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      return null;
    }

    const record = await AttendanceModel.findById(recordId).exec();
    if (!record) {
      return null;
    }

    record.status = status;
    record.markedBy = new mongoose.Types.ObjectId(adminUserId);

    if (remarks && remarks.trim()) {
      const cleanRemarks = remarks.trim();
      record.remarks = record.remarks
        ? `${record.remarks} | [Admin correction]: ${cleanRemarks}`
        : `[Admin correction]: ${cleanRemarks}`;
    }

    return await record.save();
  }

  async createAttendanceRecord(
    studentId: string,
    date: string,
    status: AttendanceStatus,
    remarks: string,
    adminUserId: string
  ): Promise<IAttendanceDoc> {
    const student = await StudentModel.findById(studentId).exec();
    if (!student) {
      throw new Error(`Student with ID ${studentId} not found.`);
    }

    const newRecord = new AttendanceModel({
      studentId: student._id,
      className: student.grade,
      section: student.section,
      academicYear: student.academicYear || '2026-2027',
      date: date.trim(),
      status,
      remarks: remarks ? `[Admin]: ${remarks.trim()}` : '[Admin Entry]',
      markedBy: new mongoose.Types.ObjectId(adminUserId),
    });

    return await newRecord.save();
  }

  async getAttendanceFiltersMetadata(): Promise<AdminAttendanceFiltersMetadataDTO> {
    // 1. Fetch active classes and sections
    const classes = await ClassModel.find({ status: 'ACTIVE' }).sort({ name: 1 }).lean().exec();
    const sections = await SectionModel.find({ status: 'ACTIVE' }).sort({ name: 1 }).lean().exec();

    // Group sections by classId
    const sectionsByClassId = new Map<string, string[]>();
    sections.forEach((sec) => {
      const cId = sec.classId.toString();
      if (!sectionsByClassId.has(cId)) {
        sectionsByClassId.set(cId, []);
      }
      sectionsByClassId.get(cId)!.push(sec.name);
    });

    // 2. Count active students per grade and section
    const students = await StudentModel.find({ status: 'ACTIVE' })
      .select('grade section academicYear')
      .lean()
      .exec();

    const studentCountByGrade = new Map<string, number>();
    const distinctAcademicYears = new Set<string>();

    students.forEach((s) => {
      const g = (s.grade || '').trim().toLowerCase();
      studentCountByGrade.set(g, (studentCountByGrade.get(g) || 0) + 1);
      if (s.academicYear && s.academicYear.trim()) {
        distinctAcademicYears.add(s.academicYear.trim());
      }
    });

    classes.forEach((c) => {
      if (c.academicYear && c.academicYear.trim()) {
        distinctAcademicYears.add(c.academicYear.trim());
      }
    });

    // Ensure common years are available
    ['2026-2027', '2025-2026'].forEach((y) => distinctAcademicYears.add(y));
    const sortedYears = Array.from(distinctAcademicYears).sort().reverse();

    const classMetadataList: AdminAttendanceClassMetadataItemDTO[] = classes.map((c) => {
      const cId = c._id.toString();
      const secList = sectionsByClassId.get(cId) || [];
      const cleanGrade = (c.name || '').trim().toLowerCase();
      const numOnly = cleanGrade.replace(/^(class|grade)\s*/i, '');
      const studentCount =
        studentCountByGrade.get(cleanGrade) ||
        (numOnly
          ? studentCountByGrade.get(numOnly) ||
            studentCountByGrade.get(`grade ${numOnly}`) ||
            studentCountByGrade.get(`class ${numOnly}`)
          : 0) ||
        0;

      return {
        id: cId,
        name: c.name,
        academicYear: c.academicYear || '2026-2027',
        sections: secList.length > 0 ? secList : ['A'],
        studentCount,
      };
    });

    // Find default class: preference to one with students (e.g. Grade 4)
    const classWithStudents = classMetadataList.find((c) => c.studentCount > 0);
    const defaultClass = classWithStudents ? classWithStudents.name : (classMetadataList[0]?.name || 'Grade 4');
    const defaultAcademicYear = classWithStudents ? classWithStudents.academicYear : (sortedYears[0] || '2026-2027');
    const matchedClass = classMetadataList.find((c) => c.name === defaultClass);
    const defaultSection = matchedClass?.sections[0] || 'A';

    return {
      academicYears: sortedYears,
      classes: classMetadataList,
      defaultAcademicYear,
      defaultClass,
      defaultSection,
    };
  }

  async getSubjectWiseAttendanceGrid(
    filter: AdminSubjectGridFilterDTO
  ): Promise<AdminSubjectGridResponseDTO> {
    const className = (filter.className || '').trim();
    const section = (filter.section || '').trim().toUpperCase();
    const dateStr = (filter.date || new Date().toISOString().split('T')[0]).trim();
    const academicYear =
      filter.academicYear && filter.academicYear !== 'ALL'
        ? filter.academicYear.trim()
        : undefined;

    // 1. Resolve Applicable Subjects for this class
    const allActiveSubjects = await SubjectModel.find({ status: 'ACTIVE' }).lean().exec();

    const classLower = className.toLowerCase();
    const classNum = classLower.replace(/^(class|grade)\s*/i, '');

    let applicableSubjects = allActiveSubjects.filter((s) => {
      if (!s.applicableClasses || s.applicableClasses.length === 0) return true;
      return s.applicableClasses.some((ac) => {
        const acLower = (ac.className || '').toLowerCase();
        const acNum = acLower.replace(/^(class|grade)\s*/i, '');
        return acLower === classLower || (acNum.length > 0 && acNum === classNum);
      });
    });

    if (applicableSubjects.length === 0) {
      applicableSubjects = allActiveSubjects;
    }

    // Also check teacher assignedClasses to catch any additional subjects and map teachers
    const teachers = await TeacherModel.find({ status: 'ACTIVE' })
      .select('fullName assignedClasses email phone userId')
      .lean()
      .exec();

    const teacherMap = new Map<string, string>(); // subLower -> teacherFullName
    const teacherIdToSubjectMap = new Map<string, string>(); // teacherUserId_or_docId_class_sec -> subject

    teachers.forEach((t) => {
      (t.assignedClasses || []).forEach((ac) => {
        const acClass = (ac.className || '').toLowerCase().trim();
        const acClassNum = acClass.replace(/^(class|grade)\s*/i, '');
        const acSec = (ac.section || '').toUpperCase().trim();
        if (
          (acClass === classLower || (acClassNum.length > 0 && acClassNum === classNum)) &&
          acSec === section &&
          ac.subject
        ) {
          const subName = ac.subject.trim();
          teacherMap.set(subName.toLowerCase(), t.fullName);
          const classSecKey = `${classLower}_${section}`;
          teacherIdToSubjectMap.set(`${t._id.toString()}_${classSecKey}`, subName);
          if (t.userId) {
            teacherIdToSubjectMap.set(`${t.userId.toString()}_${classSecKey}`, subName);
          }
        }
      });
    });

    // Form unique list of subject names
    const subjectNameSet = new Set<string>();
    applicableSubjects.forEach((s) => subjectNameSet.add(s.name.trim()));
    teacherMap.forEach((_teacher, sub) => {
      const match = applicableSubjects.find((s) => s.name.toLowerCase() === sub);
      if (match) {
        subjectNameSet.add(match.name);
      } else {
        subjectNameSet.add(sub.charAt(0).toUpperCase() + sub.slice(1));
      }
    });

    if (subjectNameSet.size === 0) {
      ['Mathematics', 'English', 'Science', 'Social Studies', 'Computer Science'].forEach((s) =>
        subjectNameSet.add(s)
      );
    }

    const subjectList = Array.from(subjectNameSet);

    // 2. Fetch officially enrolled students in this section
    const studentQuery: Record<string, any> = {
      grade: {
        $regex: new RegExp(
          `^(class|grade)?\\s*${className.replace(/^(class|grade)\s*/i, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
          'i'
        ),
      },
      section: {
        $regex: new RegExp(`^${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      },
      status: 'ACTIVE',
    };

    if (academicYear) {
      const normYear = academicYear.replace(/\s+/g, '');
      const escapedYear = normYear
        .replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
        .replace(/-/g, '\\s*-\\s*');

      studentQuery.$or = [
        { academicYear: { $regex: new RegExp(`^${escapedYear}$`, 'i') } },
        { academicYear: { $exists: false } },
        { academicYear: '' },
      ];
    }

    let studentDocs = await StudentModel.find(studentQuery)
      .sort({ rollNumber: 1, studentId: 1, fullName: 1 })
      .lean()
      .exec();

    // Fallback: If no students matched the specific academic year filter, fallback to all enrolled in this grade/sec
    if (studentDocs.length === 0 && studentQuery.$or) {
      const fallbackQuery = {
        grade: studentQuery.grade,
        section: studentQuery.section,
        status: 'ACTIVE',
      };
      studentDocs = await StudentModel.find(fallbackQuery)
        .sort({ rollNumber: 1, studentId: 1, fullName: 1 })
        .lean()
        .exec();
    }

    // 3. Fetch recorded subject attendances
    const subAttQuery: Record<string, any> = {
      className: {
        $regex: new RegExp(
          `^(class|grade)?\\s*${className.replace(/^(class|grade)\s*/i, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
          'i'
        ),
      },
      section: {
        $regex: new RegExp(`^${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      },
      date: dateStr,
    };

    const recordedSubAttendances = await SubjectAttendanceModel.find(subAttQuery).lean().exec();

    const subjectAttendanceMap = new Map<string, any>();
    recordedSubAttendances.forEach((sa) => {
      const key = `${sa.studentId.toString()}_${sa.subjectName.trim().toLowerCase()}`;
      subjectAttendanceMap.set(key, sa);
    });

    // Also check daily homeroom attendance
    const dailyRecordsQuery: Record<string, any> = {
      className: subAttQuery.className,
      $or: [
        { section: { $regex: new RegExp(`^${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { section: { $exists: false } },
        { section: '' },
      ],
      date: dateStr,
    };

    const dailyRecords = await AttendanceModel.find(dailyRecordsQuery)
      .populate('markedBy', 'fullName email')
      .lean()
      .exec();

    const dailyAttendanceByStudentAndSub = new Map<string, any>();
    dailyRecords.forEach((dr) => {
      const stId = dr.studentId.toString();
      const markedById = (dr.markedBy?._id || dr.markedBy)?.toString();
      let resolvedSubject = (dr as any).subjectName;
      if (!resolvedSubject && markedById) {
        resolvedSubject = teacherIdToSubjectMap.get(`${markedById}_${classLower}_${section}`);
      }
      if (resolvedSubject) {
        const key = `${stId}_${resolvedSubject.toLowerCase()}`;
        dailyAttendanceByStudentAndSub.set(key, dr);
      } else {
        dailyAttendanceByStudentAndSub.set(`${stId}_general`, dr);
      }
    });

    // 4. Build Student Rows
    const studentRows: AdminSubjectGridStudentRowDTO[] = [];
    const subjectCounters: Record<string, { present: number; absent: number; late: number; unmarked: number }> = {};
    subjectList.forEach((sub) => {
      subjectCounters[sub] = { present: 0, absent: 0, late: 0, unmarked: 0 };
    });

    const attentionList: AdminAttentionStudentDTO[] = [];

    studentDocs.forEach((st) => {
      const stId = st._id.toString();
      const studentSubjects: Record<string, AdminSubjectCellStatusDTO> = {};
      const studentRemarksList: string[] = [];
      const studentIssues: AdminAttentionStudentIssueDTO[] = [];

      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let unmarkedCount = 0;

      subjectList.forEach((subName) => {
        const key = `${stId}_${subName.toLowerCase()}`;
        const subRec = subjectAttendanceMap.get(key);
        const dailyRec = dailyAttendanceByStudentAndSub.get(key) || dailyAttendanceByStudentAndSub.get(`${stId}_general`);

        let status: ExtendedAttendanceStatus = 'UNMARKED';
        let remarks: string | undefined = undefined;
        let markedByName: string | undefined = undefined;
        let updatedAt: string | undefined = undefined;

        if (subRec) {
          status = subRec.status as ExtendedAttendanceStatus;
          remarks = subRec.remarks;
          markedByName = subRec.markedByName;
          updatedAt = subRec.updatedAt ? new Date(subRec.updatedAt).toISOString() : undefined;
        } else if (dailyRec) {
          status = dailyRec.status as ExtendedAttendanceStatus;
          remarks = dailyRec.remarks;
          markedByName = (dailyRec.markedBy as any)?.fullName;
          updatedAt = dailyRec.updatedAt ? new Date(dailyRec.updatedAt).toISOString() : undefined;
        }

        if (status === 'PRESENT') {
          presentCount++;
          subjectCounters[subName].present++;
        } else if (status === 'ABSENT') {
          absentCount++;
          subjectCounters[subName].absent++;
          studentIssues.push({ subjectName: subName, status: 'ABSENT', remarks });
          studentRemarksList.push(`Absent in ${subName}${remarks ? ` (${remarks})` : ''}`);
        } else if (status === 'LATE') {
          lateCount++;
          subjectCounters[subName].late++;
          studentIssues.push({ subjectName: subName, status: 'LATE', remarks });
          studentRemarksList.push(`Late in ${subName}${remarks ? ` (${remarks})` : ''}`);
        } else {
          unmarkedCount++;
          subjectCounters[subName].unmarked++;
        }

        studentSubjects[subName] = {
          status,
          remarks,
          markedByName,
          updatedAt,
        };
      });

      const totalMarked = presentCount + absentCount + lateCount;
      const pct = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

      let finalRemarks = '-';
      if (studentRemarksList.length > 0) {
        finalRemarks = studentRemarksList.join('; ');
      } else if (unmarkedCount > 0 && totalMarked > 0) {
        finalRemarks = `${unmarkedCount} subject(s) not marked`;
      }

      const row: AdminSubjectGridStudentRowDTO = {
        studentId: stId,
        admissionNumber: st.studentId || (st as any).admissionNumber || '',
        rollNumber: st.rollNumber || '',
        fullName: st.fullName,
        avatarUrl: st.avatarUrl,
        subjects: studentSubjects,
        attendancePercentage: pct,
        remarks: finalRemarks,
        totalSubjects: subjectList.length,
        presentSubjects: presentCount,
        absentSubjects: absentCount,
        lateSubjects: lateCount,
        unmarkedSubjects: unmarkedCount,
      };

      studentRows.push(row);

      if (studentIssues.length > 0) {
        const primary = studentIssues[0];
        const primaryText =
          primary.status === 'ABSENT'
            ? `Absent in ${primary.subjectName}`
            : `Late in ${primary.subjectName}`;
        attentionList.push({
          studentId: stId,
          admissionNumber: st.studentId || (st as any).admissionNumber || '',
          fullName: st.fullName,
          avatarUrl: st.avatarUrl,
          className,
          section,
          issues: studentIssues,
          primaryIssueDescription: primaryText,
        });
      }
    });

    // 5. Subject Summaries
    const subjectSummaries: AdminSubjectSummaryItemDTO[] = subjectList.map((subName) => {
      const counts = subjectCounters[subName];
      const matchSub = applicableSubjects.find(
        (s) => s.name.toLowerCase() === subName.toLowerCase()
      );
      const assignedTeacher = teacherMap.get(subName.toLowerCase());
      return {
        subjectName: subName,
        subjectCode: matchSub?.code,
        presentCount: counts.present,
        absentCount: counts.absent,
        lateCount: counts.late,
        unmarkedCount: counts.unmarked,
        totalStudents: studentDocs.length,
        assignedTeacherName: assignedTeacher,
      };
    });

    // 6. Overall 5 Cards Summary
    let presentAllSubjectsCount = 0;
    let absentAnySubjectCount = 0;
    let lateCountTotal = 0;
    let notMarkedCountTotal = 0;

    studentRows.forEach((row) => {
      const marked = row.presentSubjects + row.absentSubjects + row.lateSubjects;
      if (row.absentSubjects > 0) {
        absentAnySubjectCount++;
      } else if (row.lateSubjects > 0) {
        lateCountTotal++;
      } else if (marked > 0 && row.absentSubjects === 0 && row.lateSubjects === 0) {
        presentAllSubjectsCount++;
      } else if (marked === 0) {
        notMarkedCountTotal++;
      }
    });

    const parsedDate = new Date(dateStr + 'T12:00:00Z');
    const dayName = parsedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return {
      academicYear: academicYear || '2026-2027',
      className,
      section,
      date: dateStr,
      dayName,
      totalStudents: studentDocs.length,
      subjects: subjectList,
      summary: {
        totalStudents: studentDocs.length,
        presentAllSubjects: presentAllSubjectsCount,
        absentAnySubject: absentAnySubjectCount,
        lateCount: lateCountTotal,
        notMarkedCount: notMarkedCountTotal,
      },
      subjectSummaries,
      students: studentRows,
      requiringAttention: attentionList,
    };
  }

  async saveSubjectWiseAttendanceBatch(
    payload: AdminSaveSubjectAttendancePayloadDTO,
    adminUserId: string,
    adminUserName: string
  ): Promise<void> {
    const operations: any[] = [];
    const deleteQueries: any[] = [];

    for (const rec of payload.records) {
      if (rec.status === 'UNMARKED') {
        deleteQueries.push({
          studentId: new mongoose.Types.ObjectId(rec.studentId),
          date: payload.date,
          subjectName: rec.subjectName,
        });
      } else {
        operations.push({
          updateOne: {
            filter: {
              studentId: new mongoose.Types.ObjectId(rec.studentId),
              date: payload.date,
              subjectName: rec.subjectName,
              periodNumber: 1,
            },
            update: {
              $set: {
                studentId: new mongoose.Types.ObjectId(rec.studentId),
                className: payload.className,
                section: payload.section.toUpperCase(),
                subjectName: rec.subjectName,
                periodNumber: 1,
                date: payload.date,
                status: rec.status,
                remarks: rec.remarks || '',
                markedBy: new mongoose.Types.ObjectId(adminUserId),
                markedByName: adminUserName || 'School Administrator',
                academicYear: payload.academicYear || '2026-2027',
              },
            },
            upsert: true,
          },
        });
      }
    }

    if (deleteQueries.length > 0) {
      await SubjectAttendanceModel.deleteMany({ $or: deleteQueries });
    }

    if (operations.length > 0) {
      await SubjectAttendanceModel.bulkWrite(operations);
    }
  }
}

