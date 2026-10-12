import mongoose, { ClientSession } from 'mongoose';
import { StudentModel, IStudentDoc } from '../../parent/models/Student.model';
import {
  StudentRegistrationRequestModel,
  IStudentRegistrationRequestDoc,
} from '../../parent/models/StudentRegistrationRequest.model';
import { RegistrationStatus } from '../../parent/dtos/parent.dto';
import { UserModel } from '../../auth/models/User.model';
import { UserRole, AccountStatus } from '../../auth/dtos/auth.dto';

export interface AdmissionFilterOptions {
  status?: string;
  search?: string;
  grade?: string;
  sort?: 'newest' | 'oldest';
}

export interface IAdminDashboardRepository {
  countActiveStudents(): Promise<number>;
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
}
