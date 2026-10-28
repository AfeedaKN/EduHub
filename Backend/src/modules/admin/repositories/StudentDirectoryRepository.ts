import mongoose from 'mongoose';
import { StudentModel, IStudentDoc } from '../../parent/models/Student.model';
import {
  StudentRegistrationRequestModel,
  IStudentRegistrationRequestDoc,
} from '../../parent/models/StudentRegistrationRequest.model';
import { RegistrationStatus } from '../../parent/dtos/parent.dto';
import {
  StudentFilterDTO,
  StudentSummaryStatsDTO,
  StudentDirectoryItemDTO,
  StudentDirectoryResponseDTO,
  StudentDetailDTO,
} from '../dtos/studentDirectory.dto';

export interface IStudentDirectoryRepository {
  getSummaryStats(): Promise<StudentSummaryStatsDTO>;
  findStudents(filter: StudentFilterDTO): Promise<StudentDirectoryResponseDTO>;
  findStudentById(id: string): Promise<StudentDetailDTO | null>;
  updateStudent(id: string, data: Partial<IStudentDoc>): Promise<IStudentDoc | null>;
}

export class StudentDirectoryRepository implements IStudentDirectoryRepository {
  async getSummaryStats(): Promise<StudentSummaryStatsDTO> {
    const [totalStudents, activeStudents, pendingAdmissions, distinctGrades] = await Promise.all([
      StudentModel.countDocuments().exec(),
      StudentModel.countDocuments({ status: 'ACTIVE' }).exec(),
      StudentRegistrationRequestModel.countDocuments({
        status: { $in: [RegistrationStatus.PENDING, RegistrationStatus.UNDER_REVIEW] },
      }).exec(),
      StudentModel.distinct('grade').exec(),
    ]);

    return {
      totalStudents,
      activeStudents,
      pendingAdmissions,
      classesWithStudents: distinctGrades.length,
    };
  }

  async findStudents(filter: StudentFilterDTO): Promise<StudentDirectoryResponseDTO> {
    const andConditions: Record<string, any>[] = [];

    // Search query: fullName or studentId or rollNumber
    if (filter.search && filter.search.trim()) {
      const escaped = filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      andConditions.push({
        $or: [
          { fullName: { $regex: searchRegex } },
          { studentId: { $regex: searchRegex } },
          { rollNumber: { $regex: searchRegex } },
        ],
      });
    }

    // Academic Year filter
    if (filter.academicYear && filter.academicYear.trim() && filter.academicYear !== 'ALL') {
      andConditions.push({ academicYear: filter.academicYear.trim() });
    }

    // Grade / Class filter
    if (filter.grade && filter.grade.trim() && filter.grade !== 'ALL') {
      andConditions.push({ grade: filter.grade.trim() });
    }

    // Section filter
    if (filter.section && filter.section.trim() && filter.section !== 'ALL') {
      andConditions.push({ section: filter.section.trim() });
    }

    // Status filter
    if (filter.status && filter.status.trim() && filter.status !== 'ALL') {
      andConditions.push({ status: filter.status.trim() });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 10));
    const skip = (page - 1) * limit;

    const [total, studentsDocs] = await Promise.all([
      StudentModel.countDocuments(query).exec(),
      StudentModel.find(query)
        .populate('parentId', 'fullName email phone status')
        .sort({ grade: 1, section: 1, rollNumber: 1, fullName: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
    ]);

    // Gather registration requests to attach relationship and extra info
    const studentIds = studentsDocs.map((s) => s._id);
    const requests = await StudentRegistrationRequestModel.find({
      createdStudentId: { $in: studentIds },
    }).exec();

    const requestMapByStudentId = new Map<string, IStudentRegistrationRequestDoc>();
    requests.forEach((r) => {
      if (r.createdStudentId) {
        requestMapByStudentId.set(r.createdStudentId.toString(), r);
      }
    });

    const students: StudentDirectoryItemDTO[] = studentsDocs.map((doc) => {
      const parentObj = doc.parentId as any;
      const matchedReq = requestMapByStudentId.get(doc._id.toString());

      const parentInfo =
        parentObj && typeof parentObj === 'object' && 'fullName' in parentObj
          ? {
              id: parentObj._id ? parentObj._id.toString() : doc.parentId.toString(),
              fullName: parentObj.fullName,
              email: parentObj.email,
              phone: parentObj.phone,
              relationship: matchedReq ? matchedReq.parentRelationship : undefined,
              status: parentObj.status || 'ACTIVE',
            }
          : null;

      return {
        id: doc._id.toString(),
        fullName: doc.fullName,
        studentId: doc.studentId,
        grade: doc.grade,
        section: doc.section,
        academicYear: doc.academicYear || '2026-2027',
        rollNumber: doc.rollNumber || undefined,
        classTeacher: doc.classTeacher || undefined,
        status: doc.status as 'ACTIVE' | 'INACTIVE' | 'GRADUATED',
        avatarUrl: doc.avatarUrl || undefined,
        parent: parentInfo,
        dateOfBirth: matchedReq && matchedReq.dateOfBirth
          ? matchedReq.dateOfBirth.toISOString().split('T')[0]
          : undefined,
        gender: matchedReq ? matchedReq.gender : undefined,
        previousSchool: matchedReq ? matchedReq.previousSchool : undefined,
        enrolledAt: doc.createdAt
          ? doc.createdAt.toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
      };
    });

    return {
      students,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findStudentById(id: string): Promise<StudentDetailDTO | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const doc = await StudentModel.findById(id)
      .populate('parentId', 'fullName email phone status createdAt')
      .exec();

    if (!doc) return null;

    // Look for registration request linked to this student
    let matchedReq = await StudentRegistrationRequestModel.findOne({
      createdStudentId: doc._id,
    }).exec();

    // Fallback: match by parentId and student full name if createdStudentId wasn't populated
    if (!matchedReq) {
      matchedReq = await StudentRegistrationRequestModel.findOne({
        parentId: doc.parentId,
        studentFullName: { $regex: new RegExp(`^${doc.fullName.trim()}$`, 'i') },
      }).exec();
    }

    const parentObj = doc.parentId as any;
    const parentInfo =
      parentObj && typeof parentObj === 'object' && 'fullName' in parentObj
        ? {
            id: parentObj._id ? parentObj._id.toString() : doc.parentId.toString(),
            fullName: parentObj.fullName,
            email: parentObj.email,
            phone: parentObj.phone,
            relationship: matchedReq ? matchedReq.parentRelationship : undefined,
            status: parentObj.status || 'ACTIVE',
          }
        : null;

    return {
      id: doc._id.toString(),
      fullName: doc.fullName,
      studentId: doc.studentId,
      grade: doc.grade,
      section: doc.section,
      academicYear: doc.academicYear || '2026-2027',
      rollNumber: doc.rollNumber || undefined,
      classTeacher: doc.classTeacher || undefined,
      status: doc.status as 'ACTIVE' | 'INACTIVE' | 'GRADUATED',
      avatarUrl: doc.avatarUrl || undefined,
      parent: parentInfo,
      dateOfBirth: matchedReq && matchedReq.dateOfBirth
        ? matchedReq.dateOfBirth.toISOString().split('T')[0]
        : undefined,
      gender: matchedReq ? matchedReq.gender : undefined,
      previousSchool: matchedReq ? matchedReq.previousSchool : undefined,
      registrationRequestId: matchedReq ? matchedReq._id.toString() : undefined,
      admissionNotes: matchedReq ? matchedReq.notes : undefined,
      enrolledAt: doc.createdAt
        ? doc.createdAt.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
    };
  }

  async updateStudent(id: string, data: Partial<IStudentDoc>): Promise<IStudentDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    return await StudentModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  }
}
