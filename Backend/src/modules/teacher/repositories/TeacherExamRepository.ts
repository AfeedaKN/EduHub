import mongoose, { FilterQuery } from 'mongoose';
import { ExamModel, IExamDoc } from '../../admin/models/Exam.model';
import { ExamScheduleModel, IExamScheduleDoc } from '../../admin/models/ExamSchedule.model';
import { ExamMarksModel, IExamMarksDoc } from '../../admin/models/ExamMarks.model';
import { TeacherModel, ITeacherDoc } from '../../admin/models/Teacher.model';
import { StudentModel, IStudentDoc } from '../../parent/models/Student.model';
import { TeacherExamFilterParamsDTO } from '../dtos/teacherExam.dto';

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export interface ITeacherExamRepository {
  findTeacherByUserId(userId: string, email?: string): Promise<ITeacherDoc | null>;
  findExamById(examId: string): Promise<IExamDoc | null>;
  findExamsByIds(examIds: string[]): Promise<IExamDoc[]>;
  findScheduleById(scheduleId: string): Promise<IExamScheduleDoc | null>;
  findSchedulesForTeacher(
    teacher: ITeacherDoc,
    filter?: TeacherExamFilterParamsDTO
  ): Promise<IExamScheduleDoc[]>;
  findStudentsBySection(
    grade: string,
    section: string,
    academicYear?: string
  ): Promise<IStudentDoc[]>;
  countStudentsBySection(
    grade: string,
    section: string,
    academicYear?: string
  ): Promise<number>;
  findMarksByScheduleId(scheduleId: string): Promise<IExamMarksDoc | null>;
  findMarksByScheduleIds(scheduleIds: string[]): Promise<Map<string, IExamMarksDoc>>;
  upsertMarks(scheduleId: string, data: Partial<IExamMarksDoc>): Promise<IExamMarksDoc>;
}

export class TeacherExamRepository implements ITeacherExamRepository {
  async findTeacherByUserId(userId: string, email?: string): Promise<ITeacherDoc | null> {
    if (mongoose.Types.ObjectId.isValid(userId)) {
      const byUserId = await TeacherModel.findOne({ userId: new mongoose.Types.ObjectId(userId) }).exec();
      if (byUserId) return byUserId;
      const byId = await TeacherModel.findById(userId).exec();
      if (byId) return byId;
    }
    if (email && email.trim()) {
      const byEmail = await TeacherModel.findOne({ email: email.toLowerCase().trim() }).exec();
      if (byEmail) return byEmail;
    }
    return null;
  }

  async findExamById(examId: string): Promise<IExamDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(examId)) return null;
    return await ExamModel.findById(examId).exec();
  }

  async findExamsByIds(examIds: string[]): Promise<IExamDoc[]> {
    const validIds = examIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    if (validIds.length === 0) return [];
    return await ExamModel.find({ _id: { $in: validIds } }).exec();
  }

  async findScheduleById(scheduleId: string): Promise<IExamScheduleDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(scheduleId)) return null;
    return await ExamScheduleModel.findById(scheduleId).exec();
  }

  async findSchedulesForTeacher(
    teacher: ITeacherDoc,
    filter?: TeacherExamFilterParamsDTO
  ): Promise<IExamScheduleDoc[]> {
    const assignedClasses = teacher.assignedClasses || [];
    if (assignedClasses.length === 0 && !teacher._id && !teacher.userId) {
      return [];
    }

    const orConditions: any[] = [];

    // Condition A: Matches any of teacher's assigned classes/sections/subjects
    for (const ac of assignedClasses) {
      if (!ac.className && !ac.classId) continue;

      const classOr: any[] = [];
      if (ac.className && ac.className.trim()) {
        classOr.push({
          className: { $regex: new RegExp(`^\\s*${escapeRegex(ac.className.trim())}\\s*$`, 'i') },
        });
      }
      if (ac.classId && mongoose.Types.ObjectId.isValid(ac.classId.toString())) {
        classOr.push({ classId: new mongoose.Types.ObjectId(ac.classId.toString()) });
      }

      const cond: any = {
        $or: classOr,
      };

      if (ac.section && ac.section.trim()) {
        cond.section = { $regex: new RegExp(`^\\s*${escapeRegex(ac.section.trim())}\\s*$`, 'i') };
      }

      if (ac.subject && ac.subject.trim() && ac.subject.toLowerCase() !== 'all') {
        cond.subject = { $regex: new RegExp(`^\\s*${escapeRegex(ac.subject.trim())}\\s*$`, 'i') };
      }

      orConditions.push(cond);
    }

    // Condition B: Or teacher is explicitly assigned as invigilator
    if (teacher._id) {
      orConditions.push({ invigilatorId: teacher._id });
    }
    if (teacher.userId) {
      orConditions.push({ invigilatorId: teacher.userId });
    }

    if (orConditions.length === 0) {
      return [];
    }

    const andConditions: FilterQuery<IExamScheduleDoc>[] = [{ $or: orConditions }];

    if (filter?.className && filter.className !== 'ALL') {
      andConditions.push({
        className: { $regex: new RegExp(`^\\s*${escapeRegex(filter.className.trim())}\\s*$`, 'i') },
      });
    }

    if (filter?.section && filter.section !== 'ALL') {
      andConditions.push({
        section: { $regex: new RegExp(`^\\s*${escapeRegex(filter.section.trim())}\\s*$`, 'i') },
      });
    }

    if (filter?.academicYear && filter.academicYear !== 'ALL') {
      andConditions.push({
        academicYear: { $regex: new RegExp(`^\\s*${escapeRegex(filter.academicYear.trim())}\\s*$`, 'i') },
      });
    }

    const query: FilterQuery<IExamScheduleDoc> =
      andConditions.length === 1 ? andConditions[0] : { $and: andConditions };

    return await ExamScheduleModel.find(query)
      .sort({ examDate: 1, startTime: 1, className: 1, section: 1 })
      .exec();
  }

  async findStudentsBySection(
    grade: string,
    section: string,
    academicYear?: string
  ): Promise<IStudentDoc[]> {
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

      const matchingYearStudents = await StudentModel.find(yearQuery)
        .sort({ rollNumber: 1, fullName: 1 })
        .exec();

      if (matchingYearStudents.length > 0) {
        return matchingYearStudents;
      }
    }

    return await StudentModel.find(baseQuery).sort({ rollNumber: 1, fullName: 1 }).exec();
  }

  async countStudentsBySection(
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
      const count = await StudentModel.countDocuments({
        ...baseQuery,
        $or: [
          { academicYear: academicYear.trim() },
          { academicYear: { $exists: false } },
          { academicYear: '' },
        ],
      }).exec();
      if (count > 0) return count;
    }

    return await StudentModel.countDocuments(baseQuery).exec();
  }

  async findMarksByScheduleId(scheduleId: string): Promise<IExamMarksDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(scheduleId)) return null;
    return await ExamMarksModel.findOne({
      examScheduleId: new mongoose.Types.ObjectId(scheduleId),
    }).exec();
  }

  async findMarksByScheduleIds(scheduleIds: string[]): Promise<Map<string, IExamMarksDoc>> {
    const validIds = scheduleIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const map = new Map<string, IExamMarksDoc>();
    if (validIds.length === 0) return map;

    const docs = await ExamMarksModel.find({
      examScheduleId: { $in: validIds },
    }).exec();

    for (const d of docs) {
      map.set(d.examScheduleId.toString(), d);
    }

    return map;
  }

  async upsertMarks(
    scheduleId: string,
    data: Partial<IExamMarksDoc>
  ): Promise<IExamMarksDoc> {
    const updated = await ExamMarksModel.findOneAndUpdate(
      { examScheduleId: new mongoose.Types.ObjectId(scheduleId) },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    ).exec();

    return updated!;
  }
}
