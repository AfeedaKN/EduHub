import mongoose from 'mongoose';
import {
  StudyMaterialModel,
  IStudyMaterialDoc,
  StudyMaterialStatus,
} from '../../teacher/models/StudyMaterial.model';
import { TeacherModel } from '../models/Teacher.model';
import { ClassModel } from '../models/Class.model';
import { SubjectModel } from '../models/Subject.model';
import {
  AdminStudyMaterialSummaryDTO,
  AdminStudyMaterialListItemDTO,
  AdminStudyMaterialFilterQueryDTO,
  AdminStudyMaterialListResponseDTO,
  AdminStudyMaterialMetadataDTO,
} from '../dtos/adminStudyMaterial.dto';

export interface IAdminStudyMaterialRepository {
  getSummary(academicYear?: string): Promise<AdminStudyMaterialSummaryDTO>;
  getStudyMaterials(query: AdminStudyMaterialFilterQueryDTO): Promise<AdminStudyMaterialListResponseDTO>;
  getStudyMaterialById(id: string): Promise<IStudyMaterialDoc | null>;
  getMetadata(academicYear?: string): Promise<AdminStudyMaterialMetadataDTO>;
}

export class AdminStudyMaterialRepository implements IAdminStudyMaterialRepository {
  async getSummary(academicYear?: string): Promise<AdminStudyMaterialSummaryDTO> {
    const filter: Record<string, any> = {};
    if (academicYear && academicYear.trim() && academicYear !== 'ALL') {
      filter.academicYear = academicYear.trim();
    }

    const [totalMaterials, publishedMaterials, draftMaterials, distinctTeachers] =
      await Promise.all([
        StudyMaterialModel.countDocuments(filter).exec(),
        StudyMaterialModel.countDocuments({ ...filter, status: 'PUBLISHED' }).exec(),
        StudyMaterialModel.countDocuments({ ...filter, status: 'DRAFT' }).exec(),
        StudyMaterialModel.distinct('teacherUserId', filter).exec(),
      ]);

    return {
      totalMaterials,
      publishedMaterials,
      draftMaterials,
      totalTeachersUploading: distinctTeachers.length,
    };
  }

  async getStudyMaterials(
    query: AdminStudyMaterialFilterQueryDTO
  ): Promise<AdminStudyMaterialListResponseDTO> {
    const filter: Record<string, any> = {};

    if (query.academicYear && query.academicYear.trim() && query.academicYear !== 'ALL') {
      filter.academicYear = query.academicYear.trim();
    }

    if (query.teacherId && query.teacherId.trim() && query.teacherId !== 'ALL') {
      const tid = query.teacherId.trim();
      if (mongoose.Types.ObjectId.isValid(tid)) {
        filter.$or = [
          { teacherId: new mongoose.Types.ObjectId(tid) },
          { teacherUserId: new mongoose.Types.ObjectId(tid) },
        ];
      }
    }

    if (query.className && query.className.trim() && query.className !== 'ALL') {
      filter.className = { $regex: new RegExp(`^${query.className.trim()}$`, 'i') };
    }

    if (query.section && query.section.trim() && query.section !== 'ALL') {
      filter.section = { $regex: new RegExp(`^${query.section.trim()}$`, 'i') };
    }

    if (query.subject && query.subject.trim() && query.subject !== 'ALL') {
      filter.subject = { $regex: new RegExp(`^${query.subject.trim()}$`, 'i') };
    }

    if (query.status && query.status.trim() && query.status !== 'ALL') {
      filter.status = query.status.trim().toUpperCase() as StudyMaterialStatus;
    }

    if (query.materialType && query.materialType.trim() && query.materialType !== 'ALL') {
      filter.materialType = query.materialType.trim().toUpperCase();
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(
        query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
      const searchOr = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { teacherName: { $regex: searchRegex } },
        { subject: { $regex: searchRegex } },
        { fileName: { $regex: searchRegex } },
      ];

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
        delete filter.$or;
      } else {
        filter.$or = searchOr;
      }
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      StudyMaterialModel.countDocuments(filter).exec(),
      StudyMaterialModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
    ]);

    const materials: AdminStudyMaterialListItemDTO[] = docs.map((doc) => ({
      id: doc._id ? doc._id.toString() : (doc as any).id || '',
      title: doc.title,
      description: doc.description || '',
      teacherId: doc.teacherId ? doc.teacherId.toString() : '',
      teacherUserId: doc.teacherUserId ? doc.teacherUserId.toString() : '',
      teacherName: doc.teacherName,
      className: doc.className,
      section: doc.section,
      subject: doc.subject,
      academicYear: doc.academicYear,
      materialType: doc.materialType,
      fileUrl: doc.fileUrl || '',
      fileName: doc.fileName || '',
      fileSize: doc.fileSize || 0,
      fileType: doc.fileType || '',
      externalUrl: doc.externalUrl || '',
      status: doc.status,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
    }));

    return {
      materials,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getStudyMaterialById(id: string): Promise<IStudyMaterialDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await StudyMaterialModel.findById(id).exec();
  }

  async getMetadata(academicYear?: string): Promise<AdminStudyMaterialMetadataDTO> {
    const baseFilter: Record<string, any> = {};
    if (academicYear && academicYear.trim() && academicYear !== 'ALL') {
      baseFilter.academicYear = academicYear.trim();
    }

    const [
      materialYears,
      activeTeachers,
      activeClasses,
      distinctSubjects,
      distinctSections,
    ] = await Promise.all([
      StudyMaterialModel.distinct('academicYear').exec(),
      TeacherModel.find({ status: 'ACTIVE' }, { _id: 1, fullName: 1, userId: 1 }).sort({ fullName: 1 }).exec(),
      ClassModel.find({ status: 'ACTIVE' }, { name: 1 }).sort({ name: 1 }).exec(),
      StudyMaterialModel.distinct('subject', baseFilter).exec(),
      StudyMaterialModel.distinct('section', baseFilter).exec(),
    ]);

    const yearsSet = new Set<string>(materialYears);
    yearsSet.add('2026-2027');
    yearsSet.add('2025-2026');

    const teachersList = activeTeachers.map((t) => ({
      id: t._id.toString(),
      name: t.fullName,
    }));

    const classesList = activeClasses.map((c) => c.name);
    if (classesList.length === 0) {
      const distinctDocClasses = await StudyMaterialModel.distinct('className', baseFilter).exec();
      classesList.push(...distinctDocClasses);
    }

    return {
      academicYears: Array.from(yearsSet).sort().reverse(),
      teachers: teachersList,
      classes: Array.from(new Set(classesList)).sort(),
      sections: Array.from(new Set(distinctSections)).sort(),
      subjects: Array.from(new Set(distinctSubjects)).sort(),
    };
  }
}
