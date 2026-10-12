import mongoose from 'mongoose';
import { ClassModel, IClassDoc, ClassStatus } from '../models/Class.model';
import { SectionModel, ISectionDoc, SectionStatus } from '../models/Section.model';
import { StudentModel } from '../../parent/models/Student.model';
import { StudentRegistrationRequestModel } from '../../parent/models/StudentRegistrationRequest.model';
import { ClassFilterOptions } from '../dtos/class.dto';

export interface IClassRepository {
  createClass(data: Partial<IClassDoc>): Promise<IClassDoc>;
  findClassById(id: string): Promise<IClassDoc | null>;
  findClassByName(name: string, academicYear?: string): Promise<IClassDoc | null>;
  findClassByNameAndYear(name: string, academicYear: string): Promise<IClassDoc | null>;
  findAllClasses(filters?: ClassFilterOptions): Promise<IClassDoc[]>;
  updateClass(id: string, data: Partial<IClassDoc>): Promise<IClassDoc | null>;
  deleteClass(id: string): Promise<boolean>;
  countClasses(status?: ClassStatus): Promise<number>;

  createSection(data: Partial<ISectionDoc>): Promise<ISectionDoc>;
  findSectionById(id: string): Promise<ISectionDoc | null>;
  findSectionByClassAndName(classId: string, name: string): Promise<ISectionDoc | null>;
  findSectionsByClassId(classId: string): Promise<ISectionDoc[]>;
  findAllActiveSections(): Promise<ISectionDoc[]>;
  updateSection(id: string, data: Partial<ISectionDoc>): Promise<ISectionDoc | null>;
  updateSectionsByClassId(classId: string, data: Partial<ISectionDoc>): Promise<number>;
  deleteSection(id: string): Promise<boolean>;
  countSections(status?: SectionStatus): Promise<number>;

  countEnrolledStudents(grade: string, section?: string, academicYear?: string): Promise<number>;
  countAllEnrolledStudents(academicYear?: string): Promise<number>;
  isClassReferencedByStudents(grade: string): Promise<boolean>;
  isClassReferencedByAdmissions(grade: string): Promise<boolean>;
  isSectionReferencedByStudents(grade: string, section: string): Promise<boolean>;
  findSectionByGradeAndName(
    grade: string,
    section: string,
    academicYear?: string
  ): Promise<ISectionDoc | null>;
}

export class ClassRepository implements IClassRepository {
  async createClass(data: Partial<IClassDoc>): Promise<IClassDoc> {
    const newClass = new ClassModel(data);
    return await newClass.save();
  }

  async findClassById(id: string): Promise<IClassDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await ClassModel.findById(id).exec();
  }

  async findClassByName(name: string, academicYear?: string): Promise<IClassDoc | null> {
    const query: Record<string, any> = {
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    };
    if (academicYear && academicYear !== 'ALL') {
      query.academicYear = academicYear.trim();
    }
    return await ClassModel.findOne(query).exec();
  }

  async findClassByNameAndYear(name: string, academicYear: string): Promise<IClassDoc | null> {
    return await ClassModel.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      academicYear: academicYear.trim(),
    }).exec();
  }

  async findAllClasses(filters?: ClassFilterOptions): Promise<IClassDoc[]> {
    const query: Record<string, any> = {};

    if (filters?.academicYear && filters.academicYear !== 'ALL') {
      query.academicYear = filters.academicYear;
    }

    if (filters?.status && filters.status !== 'ALL') {
      query.status = filters.status;
    }

    if (filters?.search && filters.search.trim()) {
      query.name = { $regex: filters.search.trim(), $options: 'i' };
    }

    return await ClassModel.find(query).sort({ name: 1, academicYear: -1 }).exec();
  }

  async updateClass(id: string, data: Partial<IClassDoc>): Promise<IClassDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await ClassModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
  }

  async deleteClass(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const res = await ClassModel.findByIdAndDelete(id).exec();
    return !!res;
  }

  async countClasses(status?: ClassStatus): Promise<number> {
    const query = status ? { status } : {};
    return await ClassModel.countDocuments(query).exec();
  }

  async createSection(data: Partial<ISectionDoc>): Promise<ISectionDoc> {
    const section = new SectionModel(data);
    return await section.save();
  }

  async findSectionById(id: string): Promise<ISectionDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await SectionModel.findById(id).populate('classId').exec();
  }

  async findSectionByClassAndName(classId: string, name: string): Promise<ISectionDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(classId)) return null;
    return await SectionModel.findOne({
      classId: new mongoose.Types.ObjectId(classId),
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    }).exec();
  }

  async findSectionsByClassId(classId: string): Promise<ISectionDoc[]> {
    if (!mongoose.Types.ObjectId.isValid(classId)) return [];
    return await SectionModel.find({ classId: new mongoose.Types.ObjectId(classId) })
      .sort({ name: 1 })
      .exec();
  }

  async findAllActiveSections(): Promise<ISectionDoc[]> {
    return await SectionModel.find({ status: 'ACTIVE' }).populate('classId').exec();
  }

  async updateSection(id: string, data: Partial<ISectionDoc>): Promise<ISectionDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await SectionModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
  }

  async updateSectionsByClassId(classId: string, data: Partial<ISectionDoc>): Promise<number> {
    if (!mongoose.Types.ObjectId.isValid(classId)) return 0;
    const res = await SectionModel.updateMany(
      { classId: new mongoose.Types.ObjectId(classId) },
      { $set: data }
    ).exec();
    return res.modifiedCount;
  }

  async deleteSection(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const res = await SectionModel.findByIdAndDelete(id).exec();
    return !!res;
  }

  async countSections(status?: SectionStatus): Promise<number> {
    const query = status ? { status } : {};
    return await SectionModel.countDocuments(query).exec();
  }

  async countEnrolledStudents(grade: string, section?: string, academicYear?: string): Promise<number> {
    const query: Record<string, any> = {
      grade: { $regex: new RegExp(`^${grade.trim()}$`, 'i') },
      status: 'ACTIVE',
    };
    if (section && section.trim()) {
      query.section = { $regex: new RegExp(`^${section.trim()}$`, 'i') };
    }
    if (academicYear && academicYear.trim() && academicYear !== 'ALL') {
      query.$or = [
        { academicYear: academicYear.trim() },
        { academicYear: { $exists: false } },
        { academicYear: '' },
      ];
    }
    return await StudentModel.countDocuments(query).exec();
  }

  async countAllEnrolledStudents(academicYear?: string): Promise<number> {
    const query: Record<string, any> = { status: 'ACTIVE' };
    if (academicYear && academicYear.trim() && academicYear !== 'ALL') {
      query.$or = [
        { academicYear: academicYear.trim() },
        { academicYear: { $exists: false } },
        { academicYear: '' },
      ];
    }
    return await StudentModel.countDocuments(query).exec();
  }

  async isClassReferencedByStudents(grade: string): Promise<boolean> {
    const count = await StudentModel.countDocuments({
      grade: { $regex: new RegExp(`^${grade.trim()}$`, 'i') },
    }).exec();
    return count > 0;
  }

  async isClassReferencedByAdmissions(grade: string): Promise<boolean> {
    const count = await StudentRegistrationRequestModel.countDocuments({
      requestedGrade: { $regex: new RegExp(`^${grade.trim()}$`, 'i') },
    }).exec();
    return count > 0;
  }

  async isSectionReferencedByStudents(grade: string, section: string): Promise<boolean> {
    const count = await StudentModel.countDocuments({
      grade: { $regex: new RegExp(`^${grade.trim()}$`, 'i') },
      section: { $regex: new RegExp(`^${section.trim()}$`, 'i') },
    }).exec();
    return count > 0;
  }

  async findSectionByGradeAndName(
    grade: string,
    section: string,
    academicYear?: string
  ): Promise<ISectionDoc | null> {
    const classQuery: Record<string, any> = {
      name: { $regex: new RegExp(`^${grade.trim()}$`, 'i') },
    };
    if (academicYear && academicYear !== 'ALL') {
      classQuery.academicYear = academicYear.trim();
    }

    const matchingClass = await ClassModel.findOne(classQuery).exec();
    if (!matchingClass) return null;

    return await SectionModel.findOne({
      classId: matchingClass._id,
      name: { $regex: new RegExp(`^${section.trim()}$`, 'i') },
    }).exec();
  }
}
