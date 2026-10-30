import mongoose from 'mongoose';
import { AssignmentModel, IAssignmentDoc, AssignmentStatus } from '../models/Assignment.model';
import { TeacherModel, ITeacherDoc } from '../../admin/models/Teacher.model';
import { UserModel, IUserDocument } from '../../auth/models/User.model';
import { AssignmentFilterParamsDTO, AssignmentSummaryStatsDTO } from '../dtos/assignment.dto';

export interface IAssignmentRepository {
  findTeacherByUserId(userId: string): Promise<ITeacherDoc | null>;
  findUserById(userId: string): Promise<IUserDocument | null>;
  findAssignmentsByTeacher(
    teacherUserId: string,
    filter?: AssignmentFilterParamsDTO
  ): Promise<IAssignmentDoc[]>;
  countTeacherAssignments(
    teacherUserId: string,
    academicYear?: string
  ): Promise<AssignmentSummaryStatsDTO>;
  findPublishedAssignmentsByClass(
    className: string,
    section: string,
    academicYear?: string,
    filter?: { subject?: string; search?: string; status?: string }
  ): Promise<IAssignmentDoc[]>;
  findPublishedAssignmentsForClasses?(
    classFilters: Array<{ className: string; section: string; academicYear?: string }>,
    filter?: { subject?: string; search?: string; status?: string }
  ): Promise<IAssignmentDoc[]>;
  countPublishedAssignmentsByClass(
    className: string,
    section: string,
    academicYear?: string
  ): Promise<{ total: number; upcoming: number; dueToday: number; overdue: number }>;
  findPublishedById(id: string): Promise<IAssignmentDoc | null>;
  findDistinctPublishedSubjects(
    className: string,
    section: string,
    academicYear?: string
  ): Promise<string[]>;
  findDistinctPublishedSubjectsForClasses?(
    classFilters: Array<{ className: string; section: string; academicYear?: string }>
  ): Promise<string[]>;
  findById(id: string): Promise<IAssignmentDoc | null>;
  create(data: Partial<IAssignmentDoc>): Promise<IAssignmentDoc>;
  update(id: string, data: Partial<IAssignmentDoc>): Promise<IAssignmentDoc | null>;
  delete(id: string): Promise<boolean>;
}


export class AssignmentRepository implements IAssignmentRepository {
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

  async findAssignmentsByTeacher(
    teacherUserId: string,
    filter?: AssignmentFilterParamsDTO
  ): Promise<IAssignmentDoc[]> {
    if (!mongoose.Types.ObjectId.isValid(teacherUserId)) return [];

    const query: Record<string, any> = {
      teacherUserId: new mongoose.Types.ObjectId(teacherUserId),
    };

    if (filter?.academicYear && filter.academicYear.trim() && filter.academicYear !== 'ALL') {
      query.academicYear = filter.academicYear.trim();
    }

    if (filter?.className && filter.className.trim() && filter.className !== 'ALL') {
      query.className = { $regex: new RegExp(`^${filter.className.trim()}$`, 'i') };
    }

    if (filter?.section && filter.section.trim() && filter.section !== 'ALL') {
      query.section = { $regex: new RegExp(`^${filter.section.trim()}$`, 'i') };
    }

    if (filter?.subject && filter.subject.trim() && filter.subject !== 'ALL') {
      query.subject = { $regex: new RegExp(`^${filter.subject.trim()}$`, 'i') };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (filter?.status && filter.status.trim() && filter.status !== 'ALL') {
      const s = filter.status.trim().toUpperCase();
      if (s === 'PAST_DUE') {
        query.status = 'PUBLISHED';
        query.dueDate = { $lt: todayStr };
      } else {
        query.status = s;
      }
    }

    if (filter?.search && filter.search.trim()) {
      const searchRegex = new RegExp(filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { subject: { $regex: searchRegex } },
      ];
    }

    return await AssignmentModel.find(query).sort({ dueDate: 1, createdAt: -1 }).exec();
  }

  async countTeacherAssignments(
    teacherUserId: string,
    academicYear?: string
  ): Promise<AssignmentSummaryStatsDTO> {
    if (!mongoose.Types.ObjectId.isValid(teacherUserId)) {
      return { total: 0, published: 0, drafts: 0, pastDue: 0 };
    }

    const baseQuery: Record<string, any> = {
      teacherUserId: new mongoose.Types.ObjectId(teacherUserId),
    };

    if (academicYear && academicYear.trim() && academicYear !== 'ALL') {
      baseQuery.academicYear = academicYear.trim();
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const [total, published, drafts, pastDue] = await Promise.all([
      AssignmentModel.countDocuments(baseQuery).exec(),
      AssignmentModel.countDocuments({ ...baseQuery, status: 'PUBLISHED' }).exec(),
      AssignmentModel.countDocuments({ ...baseQuery, status: 'DRAFT' }).exec(),
      AssignmentModel.countDocuments({
        ...baseQuery,
        status: 'PUBLISHED',
        dueDate: { $lt: todayStr },
      }).exec(),
    ]);

    return { total, published, drafts, pastDue };
  }

  async findPublishedAssignmentsByClass(
    className: string,
    section: string,
    academicYear?: string,
    filter?: { subject?: string; search?: string; status?: string }
  ): Promise<IAssignmentDoc[]> {
    const query: Record<string, any> = {
      status: 'PUBLISHED',
      className: { $regex: new RegExp(`^${className.trim()}$`, 'i') },
      section: { $regex: new RegExp(`^${section.trim()}$`, 'i') },
    };

    if (academicYear && academicYear.trim() && academicYear !== 'ALL') {
      const normalizedYear = academicYear.trim().replace(/[-–—]/g, '[-–—]');
      query.academicYear = { $regex: new RegExp(`^${normalizedYear}$`, 'i') };
    }

    if (filter?.subject && filter.subject.trim() && filter.subject !== 'ALL') {
      query.subject = { $regex: new RegExp(`^${filter.subject.trim()}$`, 'i') };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (filter?.status && filter.status.trim() && filter.status !== 'ALL') {
      const s = filter.status.trim().toUpperCase();
      if (s === 'OVERDUE') {
        query.dueDate = { $lt: todayStr };
      } else if (s === 'DUE_TODAY') {
        query.dueDate = todayStr;
      } else if (s === 'UPCOMING') {
        query.dueDate = { $gt: todayStr };
      }
    }

    if (filter?.search && filter.search.trim()) {
      const searchRegex = new RegExp(filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { subject: { $regex: searchRegex } },
      ];
    }

    return await AssignmentModel.find(query).sort({ dueDate: 1, createdAt: -1 }).exec();
  }

  async findPublishedAssignmentsForClasses(
    classFilters: Array<{ className: string; section: string; academicYear?: string }>,
    filter?: { subject?: string; search?: string; status?: string }
  ): Promise<IAssignmentDoc[]> {
    if (!classFilters || classFilters.length === 0) return [];

    const orConditions = classFilters.map((cf) => {
      const condition: Record<string, any> = {
        className: { $regex: new RegExp(`^${cf.className.trim()}$`, 'i') },
        section: { $regex: new RegExp(`^${cf.section.trim()}$`, 'i') },
      };
      if (cf.academicYear && cf.academicYear.trim() && cf.academicYear !== 'ALL') {
        const normalizedYear = cf.academicYear.trim().replace(/[-–—]/g, '[-–—]');
        condition.academicYear = { $regex: new RegExp(`^${normalizedYear}$`, 'i') };
      }
      return condition;
    });

    const query: Record<string, any> = {
      status: 'PUBLISHED',
      $or: orConditions,
    };

    if (filter?.subject && filter.subject.trim() && filter.subject !== 'ALL') {
      query.subject = { $regex: new RegExp(`^${filter.subject.trim()}$`, 'i') };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (filter?.status && filter.status.trim() && filter.status !== 'ALL') {
      const s = filter.status.trim().toUpperCase();
      if (s === 'OVERDUE') {
        query.dueDate = { $lt: todayStr };
      } else if (s === 'DUE_TODAY') {
        query.dueDate = todayStr;
      } else if (s === 'UPCOMING') {
        query.dueDate = { $gt: todayStr };
      }
    }

    if (filter?.search && filter.search.trim()) {
      const searchRegex = new RegExp(filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { title: { $regex: searchRegex } },
            { description: { $regex: searchRegex } },
            { subject: { $regex: searchRegex } },
          ],
        },
      ];
    }

    return await AssignmentModel.find(query).sort({ dueDate: 1, createdAt: -1 }).exec();
  }

  async countPublishedAssignmentsByClass(
    className: string,
    section: string,
    academicYear?: string
  ): Promise<{ total: number; upcoming: number; dueToday: number; overdue: number }> {
    const baseQuery: Record<string, any> = {
      status: 'PUBLISHED',
      className: { $regex: new RegExp(`^${className.trim()}$`, 'i') },
      section: { $regex: new RegExp(`^${section.trim()}$`, 'i') },
    };

    if (academicYear && academicYear.trim() && academicYear !== 'ALL') {
      const normalizedYear = academicYear.trim().replace(/[-–—]/g, '[-–—]');
      baseQuery.academicYear = { $regex: new RegExp(`^${normalizedYear}$`, 'i') };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const [total, upcoming, dueToday, overdue] = await Promise.all([
      AssignmentModel.countDocuments(baseQuery).exec(),
      AssignmentModel.countDocuments({ ...baseQuery, dueDate: { $gt: todayStr } }).exec(),
      AssignmentModel.countDocuments({ ...baseQuery, dueDate: todayStr }).exec(),
      AssignmentModel.countDocuments({ ...baseQuery, dueDate: { $lt: todayStr } }).exec(),
    ]);

    return { total, upcoming, dueToday, overdue };
  }

  async findPublishedById(id: string): Promise<IAssignmentDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await AssignmentModel.findOne({ _id: id, status: 'PUBLISHED' }).exec();
  }

  async findDistinctPublishedSubjects(
    className: string,
    section: string,
    academicYear?: string
  ): Promise<string[]> {
    const query: Record<string, any> = {
      status: 'PUBLISHED',
      className: { $regex: new RegExp(`^${className.trim()}$`, 'i') },
      section: { $regex: new RegExp(`^${section.trim()}$`, 'i') },
    };

    if (academicYear && academicYear.trim() && academicYear !== 'ALL') {
      const normalizedYear = academicYear.trim().replace(/[-–—]/g, '[-–—]');
      query.academicYear = { $regex: new RegExp(`^${normalizedYear}$`, 'i') };
    }

    const subjects = await AssignmentModel.distinct('subject', query).exec();
    return subjects.filter(Boolean).map(String);
  }

  async findDistinctPublishedSubjectsForClasses(
    classFilters: Array<{ className: string; section: string; academicYear?: string }>
  ): Promise<string[]> {
    if (!classFilters || classFilters.length === 0) return [];

    const orConditions = classFilters.map((cf) => {
      const condition: Record<string, any> = {
        className: { $regex: new RegExp(`^${cf.className.trim()}$`, 'i') },
        section: { $regex: new RegExp(`^${cf.section.trim()}$`, 'i') },
      };
      if (cf.academicYear && cf.academicYear.trim() && cf.academicYear !== 'ALL') {
        const normalizedYear = cf.academicYear.trim().replace(/[-–—]/g, '[-–—]');
        condition.academicYear = { $regex: new RegExp(`^${normalizedYear}$`, 'i') };
      }
      return condition;
    });

    const query: Record<string, any> = {
      status: 'PUBLISHED',
      $or: orConditions,
    };

    const subjects = await AssignmentModel.distinct('subject', query).exec();
    return subjects.filter(Boolean).map(String);
  }

  async findById(id: string): Promise<IAssignmentDoc | null> {

    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await AssignmentModel.findById(id).exec();
  }

  async create(data: Partial<IAssignmentDoc>): Promise<IAssignmentDoc> {
    const doc = new AssignmentModel(data);
    return await doc.save();
  }

  async update(id: string, data: Partial<IAssignmentDoc>): Promise<IAssignmentDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await AssignmentModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const res = await AssignmentModel.findByIdAndDelete(id).exec();
    return !!res;
  }
}
