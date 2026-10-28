import mongoose from 'mongoose';
import { UserModel, IUserDocument } from '../../auth/models/User.model';
import { UserRole, AccountStatus } from '../../auth/dtos/auth.dto';
import { StudentModel, IStudentDoc } from '../../parent/models/Student.model';
import {
  StudentRegistrationRequestModel,
  IStudentRegistrationRequestDoc,
} from '../../parent/models/StudentRegistrationRequest.model';
import {
  ParentFilterDTO,
  ParentSummaryStatsDTO,
  ParentDirectoryItemDTO,
  ParentDirectoryResponseDTO,
  ParentDetailDTO,
} from '../dtos/parentDirectory.dto';

export interface IParentDirectoryRepository {
  getSummaryStats(): Promise<ParentSummaryStatsDTO>;
  findParents(filter: ParentFilterDTO): Promise<ParentDirectoryResponseDTO>;
  findParentById(id: string): Promise<ParentDetailDTO | null>;
  updateParentStatus(id: string, status: AccountStatus): Promise<IUserDocument | null>;
}

export class ParentDirectoryRepository implements IParentDirectoryRepository {
  async getSummaryStats(): Promise<ParentSummaryStatsDTO> {
    const [totalParents, studentParentAggregations] = await Promise.all([
      UserModel.countDocuments({ role: UserRole.PARENT }).exec(),
      StudentModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
        { $match: { parentId: { $ne: null } } },
        { $group: { _id: '$parentId', count: { $sum: 1 } } },
      ]).exec(),
    ]);

    // Map counts
    let parentsWithChildren = 0;
    let multipleChildrenFamilies = 0;

    studentParentAggregations.forEach((item) => {
      if (item.count >= 1) {
        parentsWithChildren++;
      }
      if (item.count >= 2) {
        multipleChildrenFamilies++;
      }
    });

    const parentsWithoutChildren = Math.max(0, totalParents - parentsWithChildren);

    return {
      totalParents,
      parentsWithChildren,
      parentsWithoutChildren,
      multipleChildrenFamilies,
    };
  }

  async findParents(filter: ParentFilterDTO): Promise<ParentDirectoryResponseDTO> {
    const andConditions: Record<string, any>[] = [{ role: UserRole.PARENT }];

    // Account Status filter
    if (filter.status && filter.status.trim() && filter.status !== 'ALL') {
      andConditions.push({ status: filter.status.trim() });
    }

    // Search query: fullName or email or phone
    if (filter.search && filter.search.trim()) {
      const escaped = filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      andConditions.push({
        $or: [
          { fullName: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
          { phone: { $regex: searchRegex } },
        ],
      });
    }

    // Filter by student link status (WITH_CHILDREN vs WITHOUT_CHILDREN)
    if (filter.studentStatus && filter.studentStatus !== 'ALL') {
      const parentIdsWithStudents = await StudentModel.distinct('parentId');
      if (filter.studentStatus === 'WITH_CHILDREN') {
        andConditions.push({ _id: { $in: parentIdsWithStudents } });
      } else if (filter.studentStatus === 'WITHOUT_CHILDREN') {
        andConditions.push({ _id: { $nin: parentIdsWithStudents } });
      }
    }

    const query = { $and: andConditions };

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));
    const skip = (page - 1) * limit;

    const [total, parentDocs] = await Promise.all([
      UserModel.countDocuments(query).exec(),
      UserModel.find(query)
        .select('fullName email phone role status createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
    ]);

    // Query enrolled students for these specific parents
    const parentIds = parentDocs.map((p) => p._id);
    const childrenDocs = await StudentModel.find({ parentId: { $in: parentIds } })
      .select('fullName studentId grade section status academicYear classTeacher rollNumber parentId')
      .sort({ fullName: 1 })
      .exec();

    // Group children by parentId
    const childrenByParentId = new Map<string, IStudentDoc[]>();
    childrenDocs.forEach((child) => {
      const pid = child.parentId.toString();
      const current = childrenByParentId.get(pid) || [];
      current.push(child);
      childrenByParentId.set(pid, current);
    });

    const parents: ParentDirectoryItemDTO[] = parentDocs.map((doc) => {
      const linked = childrenByParentId.get(doc._id.toString()) || [];

      return {
        id: doc._id.toString(),
        fullName: doc.fullName,
        email: doc.email,
        phone: doc.phone,
        role: doc.role,
        status: doc.status,
        linkedChildren: linked.map((c) => ({
          id: c._id.toString(),
          fullName: c.fullName,
          studentId: c.studentId,
          grade: c.grade,
          section: c.section,
          status: c.status,
          academicYear: c.academicYear,
          classTeacher: c.classTeacher,
          rollNumber: c.rollNumber,
        })),
        linkedChildrenCount: linked.length,
        createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
      };
    });

    return {
      parents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findParentById(id: string): Promise<ParentDetailDTO | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const userDoc = await UserModel.findOne({ _id: id, role: UserRole.PARENT })
      .select('fullName email phone role status createdAt')
      .exec();

    if (!userDoc) return null;

    // Concurrently fetch linked students and registration requests
    const [childrenDocs, requestDocs] = await Promise.all([
      StudentModel.find({ parentId: userDoc._id })
        .sort({ fullName: 1 })
        .exec(),
      StudentRegistrationRequestModel.find({ parentId: userDoc._id })
        .sort({ createdAt: -1 })
        .exec(),
    ]);

    return {
      parent: {
        id: userDoc._id.toString(),
        fullName: userDoc.fullName,
        email: userDoc.email,
        phone: userDoc.phone,
        role: userDoc.role,
        status: userDoc.status,
        createdAt: userDoc.createdAt ? userDoc.createdAt.toISOString() : new Date().toISOString(),
      },
      linkedChildren: childrenDocs.map((c) => ({
        id: c._id.toString(),
        fullName: c.fullName,
        studentId: c.studentId,
        grade: c.grade,
        section: c.section,
        status: c.status,
        academicYear: c.academicYear,
        classTeacher: c.classTeacher,
        rollNumber: c.rollNumber,
      })),
      admissionRequests: requestDocs.map((r) => ({
        id: r._id.toString(),
        studentFullName: r.studentFullName,
        requestedGrade: r.requestedGrade,
        academicYear: r.academicYear,
        status: r.status,
        submissionDate: r.createdAt ? r.createdAt.toISOString().split('T')[0] : '',
        rejectionReason: r.rejectionReason,
      })),
    };
  }

  async updateParentStatus(id: string, status: AccountStatus): Promise<IUserDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    return await UserModel.findOneAndUpdate(
      { _id: id, role: UserRole.PARENT },
      { $set: { status } },
      { new: true }
    ).exec();
  }
}
