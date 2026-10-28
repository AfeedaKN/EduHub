import mongoose, { ClientSession } from 'mongoose';
import { StudentModel, IStudentDoc } from '../../parent/models/Student.model';
import {
  StudentRegistrationRequestModel,
  IStudentRegistrationRequestDoc,
} from '../../parent/models/StudentRegistrationRequest.model';
import { RegistrationStatus } from '../../parent/dtos/parent.dto';
import { UserModel } from '../../auth/models/User.model';
import { UserRole, AccountStatus } from '../../auth/dtos/auth.dto';
import { TeacherModel } from '../models/Teacher.model';
import { SectionModel } from '../models/Section.model';
import { AttendanceModel } from '../../teacher/models/Attendance.model';
import { ExamModel } from '../models/Exam.model';
import { ExamMarksModel } from '../models/ExamMarks.model';
import {
  ClassEnrollmentBarDTO,
  ExamOverviewDTO,
  RecentSchoolActivityDTO,
  AdminDashboardSummaryDTO,
} from '../dtos/admin.dto';

export interface AdmissionFilterOptions {
  status?: string;
  search?: string;
  grade?: string;
  sort?: 'newest' | 'oldest';
}

export interface IAdminDashboardRepository {
  countActiveStudents(): Promise<number>;
  countStudentStatusCounts(): Promise<{ total: number; active: number; inactive: number }>;
  countActiveTeachers(): Promise<number>;
  countPendingAdmissions(): Promise<number>;
  getRecentPendingAdmissions(limit?: number): Promise<IStudentRegistrationRequestDoc[]>;
  getAllAdmissions(): Promise<IStudentRegistrationRequestDoc[]>;
  getAdmissions(filter: AdmissionFilterOptions): Promise<IStudentRegistrationRequestDoc[]>;
  getAdmissionCounts(): Promise<{
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    totalCount: number;
  }>;
  getAdmissionById(id: string): Promise<IStudentRegistrationRequestDoc | null>;
  countClassEnrollment(grade: string, section: string): Promise<number>;
  countGradeEnrollment(grade: string): Promise<number>;
  getEnrollmentByClass(): Promise<ClassEnrollmentBarDTO[]>;
  getAttendanceSummary(dateStr: string): Promise<AdminDashboardSummaryDTO['attendanceSummary']>;
  getExamOverview(): Promise<ExamOverviewDTO>;
  getRecentActivities(): Promise<RecentSchoolActivityDTO[]>;
  getUpcomingActivities(): Promise<AdminDashboardSummaryDTO['upcomingActivities']>;
  saveRegistrationRequest(
    doc: IStudentRegistrationRequestDoc,
    session?: ClientSession
  ): Promise<IStudentRegistrationRequestDoc>;
  createStudent(data: Partial<IStudentDoc>, session?: ClientSession): Promise<IStudentDoc>;
  getNextStudentSequence(): Promise<number>;
  startSession(): Promise<ClientSession | null>;
}

export class AdminDashboardRepository implements IAdminDashboardRepository {
  /**
   * Start a Mongoose ClientSession for transactions if supported by MongoDB deployment
   */
  async startSession(): Promise<ClientSession | null> {
    try {
      const client = mongoose.connection.getClient() as any;
      const type = client?.topology?.description?.type;
      const isReplicaSet = type === 'ReplicaSetWithPrimary' || type === 'Sharded';
      if (!isReplicaSet) {
        return null;
      }
      return await mongoose.startSession();
    } catch {
      return null;
    }
  }

  /**
   * Count officially enrolled, active students
   */
  async countActiveStudents(): Promise<number> {
    return await StudentModel.countDocuments({ status: 'ACTIVE' }).exec();
  }

  /**
   * Count active teacher accounts
   */
  async countActiveTeachers(): Promise<number> {
    return await UserModel.countDocuments({
      role: UserRole.TEACHER,
      status: AccountStatus.ACTIVE,
    }).exec();
  }

  /**
   * Count student registration requests genuinely awaiting review
   */
  async countPendingAdmissions(): Promise<number> {
    return await StudentRegistrationRequestModel.countDocuments({
      status: { $in: [RegistrationStatus.PENDING, RegistrationStatus.UNDER_REVIEW] },
    }).exec();
  }

  /**
   * Fetch recent pending registration requests with populated parent info
   */
  async getRecentPendingAdmissions(limit = 3): Promise<IStudentRegistrationRequestDoc[]> {
    return await StudentRegistrationRequestModel.find({
      status: { $in: [RegistrationStatus.PENDING, RegistrationStatus.UNDER_REVIEW] },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('parentId', 'fullName email phone')
      .exec();
  }

  /**
   * Fetch all registration requests for Admissions overview
   */
  async getAllAdmissions(): Promise<IStudentRegistrationRequestDoc[]> {
    return await StudentRegistrationRequestModel.find()
      .sort({ createdAt: -1 })
      .populate('parentId', 'fullName email phone')
      .exec();
  }

  /**
   * Fetch filtered admissions with search, status, grade, and sorting
   */
  async getAdmissions(filter: AdmissionFilterOptions): Promise<IStudentRegistrationRequestDoc[]> {
    const query: Record<string, any> = {};

    // Status filter
    if (filter.status && filter.status !== 'ALL') {
      if (filter.status === 'PENDING') {
        query.status = { $in: [RegistrationStatus.PENDING, RegistrationStatus.UNDER_REVIEW] };
      } else {
        query.status = filter.status;
      }
    }

    // Grade filter
    if (filter.grade && filter.grade !== 'ALL') {
      query.requestedGrade = filter.grade;
    }

    // Search by student name
    if (filter.search && filter.search.trim()) {
      const searchRegex = new RegExp(filter.search.trim(), 'i');
      query.$or = [
        { studentFullName: { $regex: searchRegex } },
        { previousSchool: { $regex: searchRegex } },
      ];
    }

    const sortOrder = filter.sort === 'oldest' ? 1 : -1;

    let results = await StudentRegistrationRequestModel.find(query)
      .sort({ createdAt: sortOrder })
      .populate('parentId', 'fullName email phone')
      .exec();

    // If search term didn't match student name, check parent's name in memory from populated parentId
    if (filter.search && filter.search.trim()) {
      const searchTerm = filter.search.trim().toLowerCase();
      // If studentFullName already matched in query, it's included. Also include if parent fullName or email matches:
      const allMatching = await StudentRegistrationRequestModel.find(
        filter.status && filter.status !== 'ALL'
          ? filter.status === 'PENDING'
            ? { status: { $in: [RegistrationStatus.PENDING, RegistrationStatus.UNDER_REVIEW] } }
            : { status: filter.status }
          : {}
      )
        .sort({ createdAt: sortOrder })
        .populate('parentId', 'fullName email phone')
        .exec();

      results = allMatching.filter((doc) => {
        const studentMatch = doc.studentFullName.toLowerCase().includes(searchTerm);
        const parentObj = doc.parentId as any;
        const parentNameMatch =
          parentObj && typeof parentObj === 'object' && parentObj.fullName
            ? parentObj.fullName.toLowerCase().includes(searchTerm)
            : false;
        const parentEmailMatch =
          parentObj && typeof parentObj === 'object' && parentObj.email
            ? parentObj.email.toLowerCase().includes(searchTerm)
            : false;

        const gradeMatch = !filter.grade || filter.grade === 'ALL' || doc.requestedGrade === filter.grade;

        return (studentMatch || parentNameMatch || parentEmailMatch) && gradeMatch;
      });
    }

    return results;
  }

  /**
   * Get breakdown counts for admission tabs
   */
  async getAdmissionCounts(): Promise<{
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    totalCount: number;
  }> {
    const [pendingCount, approvedCount, rejectedCount, totalCount] = await Promise.all([
      StudentRegistrationRequestModel.countDocuments({
        status: { $in: [RegistrationStatus.PENDING, RegistrationStatus.UNDER_REVIEW] },
      }).exec(),
      StudentRegistrationRequestModel.countDocuments({
        status: RegistrationStatus.APPROVED,
      }).exec(),
      StudentRegistrationRequestModel.countDocuments({
        status: RegistrationStatus.REJECTED,
      }).exec(),
      StudentRegistrationRequestModel.countDocuments().exec(),
    ]);

    return {
      pendingCount,
      approvedCount,
      rejectedCount,
      totalCount,
    };
  }

  /**
   * Fetch single registration request by ID with parent details
   */
  async getAdmissionById(id: string): Promise<IStudentRegistrationRequestDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await StudentRegistrationRequestModel.findById(id)
      .populate('parentId', 'fullName email phone')
      .exec();
  }

  /**
   * Count active students in a specific grade and section
   */
  async countClassEnrollment(grade: string, section: string): Promise<number> {
    return await StudentModel.countDocuments({
      grade,
      section,
      status: 'ACTIVE',
    }).exec();
  }

  /**
   * Count active students in a specific grade across all sections
   */
  async countGradeEnrollment(grade: string): Promise<number> {
    return await StudentModel.countDocuments({
      grade,
      status: 'ACTIVE',
    }).exec();
  }

  /**
   * Save an updated registration request document
   */
  async saveRegistrationRequest(
    doc: IStudentRegistrationRequestDoc,
    session?: ClientSession
  ): Promise<IStudentRegistrationRequestDoc> {
    if (session) {
      return await doc.save({ session });
    }
    return await doc.save();
  }

  /**
   * Create official enrolled student record
   */
  async createStudent(
    data: Partial<IStudentDoc>,
    session?: ClientSession
  ): Promise<IStudentDoc> {
    if (session) {
      const [created] = await StudentModel.create([data], { session });
      return created;
    }
    const student = new StudentModel(data);
    return await student.save();
  }

  /**
   * Get next student sequence number for unique admission number generation
   */
  async getNextStudentSequence(): Promise<number> {
    const totalStudents = await StudentModel.countDocuments().exec();
    return totalStudents + 1;
  }

  /**
   * Count officially enrolled students by active and inactive status
   */
  async countStudentStatusCounts(): Promise<{ total: number; active: number; inactive: number }> {
    const [active, inactive, total] = await Promise.all([
      StudentModel.countDocuments({ status: 'ACTIVE' }).exec(),
      StudentModel.countDocuments({ status: 'INACTIVE' }).exec(),
      StudentModel.countDocuments().exec(),
    ]);
    return { total, active, inactive };
  }

  /**
   * Get enrolled students aggregated by class/grade
   */
  async getEnrollmentByClass(): Promise<ClassEnrollmentBarDTO[]> {
    const results = await StudentModel.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]).exec();

    return results.map((item) => ({
      className: item._id || 'Unassigned',
      count: item.count,
    }));
  }

  /**
   * Calculate school-wide attendance metrics for a specific date
   */
  async getAttendanceSummary(dateStr: string): Promise<AdminDashboardSummaryDTO['attendanceSummary']> {
    const records = await AttendanceModel.find({ date: dateStr }).exec();
    const totalActiveSections = await SectionModel.countDocuments({ status: 'ACTIVE' }).exec();

    if (records.length === 0) {
      return {
        overallPercentage: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        totalMarked: 0,
        sectionsSubmitted: 0,
        totalSections: totalActiveSections,
        date: dateStr,
        status: 'PENDING',
      };
    }

    const presentCount = records.filter((r) => r.status === 'PRESENT').length;
    const absentCount = records.filter((r) => r.status === 'ABSENT').length;
    const lateCount = records.filter((r) => r.status === 'LATE').length;
    const totalMarked = records.length;
    const overallPercentage = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

    const submittedSectionKeys = new Set(records.map((r) => `${r.className}-${r.section}`));
    const sectionsSubmitted = submittedSectionKeys.size;
    const totalSections = Math.max(sectionsSubmitted, totalActiveSections);

    const status = sectionsSubmitted >= totalSections && totalSections > 0 ? 'RECORDED' : 'PARTIAL';

    return {
      overallPercentage,
      presentCount,
      absentCount,
      lateCount,
      totalMarked,
      sectionsSubmitted,
      totalSections,
      date: dateStr,
      status,
    };
  }

  /**
   * Get exam metrics: marks awaiting review, published, scheduled exams
   */
  async getExamOverview(): Promise<ExamOverviewDTO> {
    const [pendingReviewCount, publishedCount, scheduledExamsCount, recentExamsDocs] =
      await Promise.all([
        ExamMarksModel.countDocuments({ status: 'SUBMITTED' }).exec(),
        ExamMarksModel.countDocuments({ status: 'PUBLISHED' }).exec(),
        ExamModel.countDocuments({ status: { $in: ['SCHEDULED', 'ONGOING'] } }).exec(),
        ExamModel.find().sort({ startDate: -1 }).limit(5).exec(),
      ]);

    const recentExams = recentExamsDocs.map((exam) => ({
      id: exam._id.toString(),
      name: exam.name,
      academicYear: exam.academicYear,
      status: exam.status,
      startDate: exam.startDate ? exam.startDate.toISOString().split('T')[0] : '',
      endDate: exam.endDate ? exam.endDate.toISOString().split('T')[0] : '',
    }));

    return {
      pendingReviewCount,
      publishedCount,
      scheduledExamsCount,
      recentExams,
    };
  }

  /**
   * Aggregate recent school events across admissions, exams, and marks
   */
  async getRecentActivities(): Promise<RecentSchoolActivityDTO[]> {
    const [approvedReqs, rejectedReqs, marksSubmitted, marksPublished, examsScheduled] =
      await Promise.all([
        StudentRegistrationRequestModel.find({ status: RegistrationStatus.APPROVED })
          .sort({ reviewedAt: -1, updatedAt: -1 })
          .limit(4)
          .exec(),
        StudentRegistrationRequestModel.find({ status: RegistrationStatus.REJECTED })
          .sort({ reviewedAt: -1, updatedAt: -1 })
          .limit(3)
          .exec(),
        ExamMarksModel.find({ status: 'SUBMITTED' })
          .sort({ submittedAt: -1, updatedAt: -1 })
          .limit(4)
          .exec(),
        ExamMarksModel.find({ status: 'PUBLISHED' })
          .sort({ publishedAt: -1, updatedAt: -1 })
          .limit(3)
          .exec(),
        ExamModel.find({ status: { $in: ['SCHEDULED', 'ONGOING'] } })
          .sort({ createdAt: -1 })
          .limit(3)
          .exec(),
      ]);

    const activities: RecentSchoolActivityDTO[] = [];

    for (const req of approvedReqs) {
      const d = req.reviewedAt || req.updatedAt || req.createdAt || new Date();
      activities.push({
        id: `adm-app-${req._id.toString()}`,
        type: 'ADMISSION_APPROVED',
        title: `Admission Approved - ${req.studentFullName}`,
        description: `Officially enrolled in ${req.requestedGrade}. Student record generated.`,
        timestamp: d.toISOString(),
        date: d.toISOString().split('T')[0],
        badgeText: 'Approved',
        badgeVariant: 'success',
      });
    }

    for (const req of rejectedReqs) {
      const d = req.reviewedAt || req.updatedAt || req.createdAt || new Date();
      activities.push({
        id: `adm-rej-${req._id.toString()}`,
        type: 'ADMISSION_REJECTED',
        title: `Admission Rejected - ${req.studentFullName}`,
        description: req.rejectionReason
          ? `Reason: ${req.rejectionReason}`
          : `Application for ${req.requestedGrade} rejected by management.`,
        timestamp: d.toISOString(),
        date: d.toISOString().split('T')[0],
        badgeText: 'Rejected',
        badgeVariant: 'danger',
      });
    }

    for (const mark of marksSubmitted) {
      const d = mark.submittedAt || mark.updatedAt || mark.createdAt || new Date();
      activities.push({
        id: `marks-sub-${mark._id.toString()}`,
        type: 'MARKS_SUBMITTED',
        title: `Marks Submitted - ${mark.className} ${mark.section} (${mark.subject})`,
        description: `Teacher ${mark.teacherName} submitted marks for management review (${mark.enteredCount}/${mark.totalStudents} entered).`,
        timestamp: d.toISOString(),
        date: d.toISOString().split('T')[0],
        badgeText: 'Review Pending',
        badgeVariant: 'warning',
      });
    }

    for (const mark of marksPublished) {
      const d = mark.publishedAt || mark.updatedAt || mark.createdAt || new Date();
      activities.push({
        id: `marks-pub-${mark._id.toString()}`,
        type: 'MARKS_PUBLISHED',
        title: `Results Published - ${mark.className} ${mark.section} (${mark.subject})`,
        description: `Official results published and made visible to parents and students.`,
        timestamp: d.toISOString(),
        date: d.toISOString().split('T')[0],
        badgeText: 'Published',
        badgeVariant: 'info',
      });
    }

    for (const exam of examsScheduled) {
      const d = exam.createdAt || new Date();
      activities.push({
        id: `exam-sched-${exam._id.toString()}`,
        type: 'EXAM_SCHEDULED',
        title: `Exam Scheduled - ${exam.name}`,
        description: `Scheduled for ${exam.applicableClasses?.map((c) => c.className).join(', ') || 'All Classes'}.`,
        timestamp: d.toISOString(),
        date: d.toISOString().split('T')[0],
        badgeText: 'Scheduled',
        badgeVariant: 'info',
      });
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return activities.slice(0, 6);
  }

  /**
   * Get scheduled or ongoing upcoming activities / exams
   */
  async getUpcomingActivities(): Promise<AdminDashboardSummaryDTO['upcomingActivities']> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingExams = await ExamModel.find({
      status: { $in: ['SCHEDULED', 'ONGOING'] },
      endDate: { $gte: today },
    })
      .sort({ startDate: 1 })
      .limit(5)
      .exec();

    if (upcomingExams.length === 0) {
      return [];
    }

    return upcomingExams.map((exam) => ({
      id: exam._id.toString(),
      title: exam.name,
      date: exam.startDate ? exam.startDate.toISOString().split('T')[0] : '',
      time: `${exam.startDate ? exam.startDate.toISOString().split('T')[0] : ''} to ${
        exam.endDate ? exam.endDate.toISOString().split('T')[0] : ''
      }`,
      category: exam.examType.replace('_', ' '),
      audience: exam.applicableClasses?.map((c) => c.className).join(', ') || 'School-wide',
      linkUrl: '/admin/exams',
    }));
  }
}
