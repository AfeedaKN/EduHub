import mongoose from 'mongoose';
import {
  StudyMaterialModel,
  IStudyMaterialDoc,
  StudyMaterialStatus,
} from '../models/StudyMaterial.model';
import { TeacherModel, ITeacherDoc } from '../../admin/models/Teacher.model';
import { UserModel, IUserDocument } from '../../auth/models/User.model';
import { StudyMaterialFilterParamsDTO } from '../dtos/studyMaterial.dto';

export interface IStudyMaterialRepository {
  findTeacherByUserId(userId: string): Promise<ITeacherDoc | null>;
  findUserById(userId: string): Promise<IUserDocument | null>;
  findStudyMaterialsByTeacher(
    teacherUserId: string,
    filter?: StudyMaterialFilterParamsDTO
  ): Promise<IStudyMaterialDoc[]>;
  countTeacherStudyMaterials(
    teacherUserId: string,
    academicYear?: string
  ): Promise<{ total: number; published: number; draft: number }>;
  findById(id: string): Promise<IStudyMaterialDoc | null>;
  create(data: Partial<IStudyMaterialDoc>): Promise<IStudyMaterialDoc>;
  update(id: string, data: Partial<IStudyMaterialDoc>): Promise<IStudyMaterialDoc | null>;
  delete(id: string): Promise<boolean>;
  findPublishedMaterialsByClass(
    className: string,
    section: string,
    academicYear?: string,
    filter?: { subject?: string; search?: string }
  ): Promise<IStudyMaterialDoc[]>;
  findPublishedMaterialsForClasses(
    classFilters: Array<{ className: string; section: string; academicYear?: string }>,
    filter?: { subject?: string; search?: string }
  ): Promise<IStudyMaterialDoc[]>;
  findDistinctPublishedSubjects(
    className: string,
    section: string,
    academicYear?: string
  ): Promise<string[]>;
}

export class StudyMaterialRepository implements IStudyMaterialRepository {
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

  async findStudyMaterialsByTeacher(
    teacherUserId: string,
    filter?: StudyMaterialFilterParamsDTO
  ): Promise<IStudyMaterialDoc[]> {
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

    if (filter?.status && filter.status.trim() && filter.status !== 'ALL') {
      query.status = filter.status.trim().toUpperCase() as StudyMaterialStatus;
    }

    if (filter?.materialType && filter.materialType.trim() && filter.materialType !== 'ALL') {
      query.materialType = filter.materialType.trim().toUpperCase();
    }

    if (filter?.search && filter.search.trim()) {
      const searchRegex = new RegExp(
        filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
      query.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { subject: { $regex: searchRegex } },
        { fileName: { $regex: searchRegex } },
      ];
    }

    return await StudyMaterialModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async countTeacherStudyMaterials(
    teacherUserId: string,
    academicYear?: string
  ): Promise<{ total: number; published: number; draft: number }> {
    if (!mongoose.Types.ObjectId.isValid(teacherUserId)) {
      return { total: 0, published: 0, draft: 0 };
    }

    const baseQuery: Record<string, any> = {
      teacherUserId: new mongoose.Types.ObjectId(teacherUserId),
    };

    if (academicYear && academicYear.trim() && academicYear !== 'ALL') {
      baseQuery.academicYear = academicYear.trim();
    }

    const [total, published, draft] = await Promise.all([
      StudyMaterialModel.countDocuments(baseQuery).exec(),
      StudyMaterialModel.countDocuments({ ...baseQuery, status: 'PUBLISHED' }).exec(),
      StudyMaterialModel.countDocuments({ ...baseQuery, status: 'DRAFT' }).exec(),
    ]);

    return { total, published, draft };
  }

  async findById(id: string): Promise<IStudyMaterialDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await StudyMaterialModel.findById(id).exec();
  }

  async create(data: Partial<IStudyMaterialDoc>): Promise<IStudyMaterialDoc> {
    return await StudyMaterialModel.create(data);
  }

  async update(id: string, data: Partial<IStudyMaterialDoc>): Promise<IStudyMaterialDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await StudyMaterialModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const res = await StudyMaterialModel.findByIdAndDelete(id).exec();
    return !!res;
  }

  async findPublishedMaterialsByClass(
    className: string,
    section: string,
    academicYear?: string,
    filter?: { subject?: string; search?: string }
  ): Promise<IStudyMaterialDoc[]> {
    const query: Record<string, any> = {
      className: { $regex: new RegExp(`^${className.trim()}$`, 'i') },
      section: { $regex: new RegExp(`^${section.trim()}$`, 'i') },
      status: 'PUBLISHED',
    };

    if (academicYear && academicYear.trim() && academicYear !== 'ALL') {
      query.academicYear = academicYear.trim();
    }

    if (filter?.subject && filter.subject.trim() && filter.subject !== 'ALL') {
      query.subject = { $regex: new RegExp(`^${filter.subject.trim()}$`, 'i') };
    }

    if (filter?.search && filter.search.trim()) {
      const searchRegex = new RegExp(
        filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
      query.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { subject: { $regex: searchRegex } },
        { teacherName: { $regex: searchRegex } },
        { fileName: { $regex: searchRegex } },
      ];
    }

    return await StudyMaterialModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findPublishedMaterialsForClasses(
    classFilters: Array<{ className: string; section: string; academicYear?: string }>,
    filter?: { subject?: string; search?: string }
  ): Promise<IStudyMaterialDoc[]> {
    if (!classFilters || classFilters.length === 0) return [];

    const orClauses = classFilters.map((cf) => {
      const clause: Record<string, any> = {
        className: { $regex: new RegExp(`^${cf.className.trim()}$`, 'i') },
        section: { $regex: new RegExp(`^${cf.section.trim()}$`, 'i') },
        status: 'PUBLISHED',
      };
      if (cf.academicYear && cf.academicYear.trim() && cf.academicYear !== 'ALL') {
        clause.academicYear = cf.academicYear.trim();
      }
      return clause;
    });

    const query: Record<string, any> = { $or: orClauses };

    if (filter?.subject && filter.subject.trim() && filter.subject !== 'ALL') {
      query.subject = { $regex: new RegExp(`^${filter.subject.trim()}$`, 'i') };
    }

    if (filter?.search && filter.search.trim()) {
      const searchRegex = new RegExp(
        filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
      query.$and = [
        {
          $or: [
            { title: { $regex: searchRegex } },
            { description: { $regex: searchRegex } },
            { subject: { $regex: searchRegex } },
            { teacherName: { $regex: searchRegex } },
            { fileName: { $regex: searchRegex } },
          ],
        },
      ];
    }

    return await StudyMaterialModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findDistinctPublishedSubjects(
    className: string,
    section: string,
    academicYear?: string
  ): Promise<string[]> {
    const query: Record<string, any> = {
      className: { $regex: new RegExp(`^${className.trim()}$`, 'i') },
      section: { $regex: new RegExp(`^${section.trim()}$`, 'i') },
      status: 'PUBLISHED',
    };

    if (academicYear && academicYear.trim() && academicYear !== 'ALL') {
      query.academicYear = academicYear.trim();
    }

    return await StudyMaterialModel.distinct('subject', query).exec();
  }
}
