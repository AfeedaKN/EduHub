import mongoose from 'mongoose';
import { TeacherModel, ITeacherDoc } from '../../admin/models/Teacher.model';
import { UserModel, IUserDocument } from '../../auth/models/User.model';
import { StudentModel, IStudentDoc } from '../../parent/models/Student.model';
import {
  TimetablePeriodModel,
  ITimetablePeriodDoc,
} from '../../admin/models/TimetablePeriod.model';

export interface ITeacherDashboardRepository {
  findTeacherByUserId(userId: string): Promise<ITeacherDoc | null>;
  findUserById(userId: string): Promise<IUserDocument | null>;
  countStudentsInClass(grade: string, section: string, academicYear?: string): Promise<number>;
  findStudentsByClasses(
    filters: Array<{ grade: string; section: string }>,
    options?: {
      grade?: string;
      section?: string;
      status?: string;
      academicYear?: string;
      search?: string;
    }
  ): Promise<IStudentDoc[]>;
  findTimetablePeriodsByTeacher(
    teacherId: string,
    academicYear?: string,
    dayOfWeek?: string
  ): Promise<ITimetablePeriodDoc[]>;
}

export class TeacherDashboardRepository implements ITeacherDashboardRepository {
  async findTeacherByUserId(userId: string): Promise<ITeacherDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    const byUserId = await TeacherModel.findOne({ userId }).exec();
    if (byUserId) return byUserId;
    return await TeacherModel.findById(userId).exec();
  }

  async findUserById(userId: string): Promise<IUserDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    return await UserModel.findById(userId).exec();
  }

  async countStudentsInClass(
    grade: string,
    section: string,
    academicYear?: string
  ): Promise<number> {
    const baseQuery: Record<string, any> = {
      grade: { $regex: new RegExp(`^${grade.trim()}$`, 'i') },
      section: { $regex: new RegExp(`^${section.trim()}$`, 'i') },
      status: 'ACTIVE',
    };
    if (academicYear && academicYear.trim() && academicYear !== 'ALL') {
      const yearQuery = {
        ...baseQuery,
        $or: [
          { academicYear: academicYear.trim() },
          { academicYear: { $exists: false } },
          { academicYear: '' },
        ],
      };
      const count = await StudentModel.countDocuments(yearQuery).exec();
      if (count > 0) return count;
    }
    return await StudentModel.countDocuments(baseQuery).exec();
  }

  async findStudentsByClasses(
    filters: Array<{ grade: string; section: string }>,
    options?: {
      grade?: string;
      section?: string;
      status?: string;
      academicYear?: string;
      search?: string;
    }
  ): Promise<IStudentDoc[]> {
    if (!filters || filters.length === 0) return [];

    // Filter allowed classes by requested options if present (strict backend authorization enforcement)
    let activeFilters = filters;
    if (options?.grade && options.grade.trim() && options.grade !== 'ALL') {
      const g = options.grade.trim().toLowerCase();
      activeFilters = activeFilters.filter((f) => f.grade.toLowerCase() === g);
      if (activeFilters.length === 0) return [];
    }

    if (options?.section && options.section.trim() && options.section !== 'ALL') {
      const s = options.section.trim().toLowerCase();
      activeFilters = activeFilters.filter((f) => f.section.toLowerCase() === s);
      if (activeFilters.length === 0) return [];
    }

    // Build conditions for allowed class-sections
    const classConditions = activeFilters.map((f) => ({
      grade: { $regex: new RegExp(`^${f.grade.trim()}$`, 'i') },
      section: { $regex: new RegExp(`^${f.section.trim()}$`, 'i') },
    }));

    const andConditions: any[] = [{ $or: classConditions }];

    // Status filter
    if (options?.status && options.status.trim() && options.status !== 'ALL') {
      andConditions.push({ status: options.status.trim() });
    } else if (!options?.status) {
      andConditions.push({ status: 'ACTIVE' });
    }

    // Academic Year filter
    if (options?.academicYear && options.academicYear.trim() && options.academicYear !== 'ALL') {
      andConditions.push({
        $or: [
          { academicYear: options.academicYear.trim() },
          { academicYear: { $exists: false } },
          { academicYear: '' },
        ],
      });
    }

    // Search query (student name, admission number/studentId, or rollNumber)
    if (options?.search && options.search.trim()) {
      const escaped = options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      andConditions.push({
        $or: [
          { fullName: { $regex: searchRegex } },
          { studentId: { $regex: searchRegex } },
          { rollNumber: { $regex: searchRegex } },
        ],
      });
    }

    return await StudentModel.find({ $and: andConditions })
      .populate('parentId', 'fullName email phone')
      .sort({ grade: 1, section: 1, rollNumber: 1, fullName: 1 })
      .exec();
  }

  async findTimetablePeriodsByTeacher(
    teacherId: string,
    academicYear?: string,
    dayOfWeek?: string
  ): Promise<ITimetablePeriodDoc[]> {
    if (!mongoose.Types.ObjectId.isValid(teacherId)) return [];

    const query: Record<string, any> = {
      teacherId: new mongoose.Types.ObjectId(teacherId),
    };

    if (academicYear && academicYear.trim() && academicYear !== 'ALL') {
      query.academicYear = academicYear.trim();
    }

    if (dayOfWeek && dayOfWeek.trim() && dayOfWeek !== 'ALL') {
      query.dayOfWeek = dayOfWeek.trim().toUpperCase();
    }

    return await TimetablePeriodModel.find(query)
      .sort({ dayOfWeek: 1, startTime: 1 })
      .exec();
  }
}

