import mongoose from 'mongoose';
import { SubjectModel, ISubjectDoc, SubjectStatus } from '../models/Subject.model';
import { TeacherModel } from '../models/Teacher.model';
import { TimetablePeriodModel } from '../models/TimetablePeriod.model';
import { ExamScheduleModel } from '../models/ExamSchedule.model';
import { AssignmentModel } from '../../teacher/models/Assignment.model';
import {
  SubjectFilterOptions,
  SubjectSummaryStatsDTO,
  AssignedTeacherInfoDTO,
} from '../dtos/subject.dto';

export interface ISubjectRepository {
  findAll(filter: SubjectFilterOptions): Promise<{ subjects: ISubjectDoc[]; total: number }>;
  findById(id: string): Promise<ISubjectDoc | null>;
  findByCode(code: string): Promise<ISubjectDoc | null>;
  findByName(name: string): Promise<ISubjectDoc | null>;
  create(data: Partial<ISubjectDoc>): Promise<ISubjectDoc>;
  update(id: string, data: Partial<ISubjectDoc>): Promise<ISubjectDoc | null>;
  updateStatus(id: string, status: SubjectStatus): Promise<ISubjectDoc | null>;
  delete(id: string): Promise<boolean>;
  getSummaryStats(academicYear?: string): Promise<SubjectSummaryStatsDTO>;
  getAssignedTeachers(subjectName: string, subjectCode?: string): Promise<AssignedTeacherInfoDTO[]>;
  getReferencesCount(
    subjectName: string,
    subjectCode?: string
  ): Promise<{
    timetableCount: number;
    examScheduleCount: number;
    assignmentCount: number;
    teacherAssignmentCount: number;
    totalReferences: number;
  }>;
  ensureDefaultSubjects(): Promise<void>;
}

export class SubjectRepository implements ISubjectRepository {
  /**
   * Seed default foundational curriculum subjects if no subjects exist yet
   */
  async ensureDefaultSubjects(): Promise<void> {
    const count = await SubjectModel.countDocuments().exec();
    if (count > 0) return;

    const defaultCurriculum = [
      {
        name: 'Mathematics',
        code: 'MATH101',
        category: 'CORE',
        description: 'Foundational mathematics covering arithmetic, algebra, and geometry.',
        applicableClasses: [
          { className: 'Grade 1' },
          { className: 'Grade 2' },
          { className: 'Grade 3' },
          { className: 'Grade 4' },
          { className: 'Grade 5' },
          { className: 'Grade 6' },
          { className: 'Grade 7' },
          { className: 'Grade 8' },
        ],
        academicYear: '2026-2027',
        status: 'ACTIVE',
      },
      {
        name: 'English',
        code: 'ENG101',
        category: 'LANGUAGE',
        description: 'English language arts, grammar, comprehension, and literature.',
        applicableClasses: [
          { className: 'Grade 1' },
          { className: 'Grade 2' },
          { className: 'Grade 3' },
          { className: 'Grade 4' },
          { className: 'Grade 5' },
          { className: 'Grade 6' },
          { className: 'Grade 7' },
          { className: 'Grade 8' },
        ],
        academicYear: '2026-2027',
        status: 'ACTIVE',
      },
      {
        name: 'Physics',
        code: 'PHY201',
        category: 'SCIENCE',
        description: 'Physical sciences, mechanics, energy, and laboratory experimentation.',
        applicableClasses: [
          { className: 'Grade 6' },
          { className: 'Grade 7' },
          { className: 'Grade 8' },
        ],
        academicYear: '2026-2027',
        status: 'ACTIVE',
      },
      {
        name: 'Chemistry',
        code: 'CHEM201',
        category: 'SCIENCE',
        description: 'Chemical sciences, matter, reactions, and laboratory safety.',
        applicableClasses: [
          { className: 'Grade 6' },
          { className: 'Grade 7' },
          { className: 'Grade 8' },
        ],
        academicYear: '2026-2027',
        status: 'ACTIVE',
      },
      {
        name: 'Computer Science',
        code: 'CS101',
        category: 'VOCATIONAL',
        description: 'Computer fundamentals, digital literacy, and introductory programming.',
        applicableClasses: [
          { className: 'Grade 3' },
          { className: 'Grade 4' },
          { className: 'Grade 5' },
          { className: 'Grade 6' },
          { className: 'Grade 7' },
          { className: 'Grade 8' },
        ],
        academicYear: '2026-2027',
        status: 'ACTIVE',
      },
      {
        name: 'Social Studies',
        code: 'SOC101',
        category: 'HUMANITIES',
        description: 'History, civics, geography, and cultural awareness.',
        applicableClasses: [
          { className: 'Grade 4' },
          { className: 'Grade 5' },
          { className: 'Grade 6' },
          { className: 'Grade 7' },
          { className: 'Grade 8' },
        ],
        academicYear: '2026-2027',
        status: 'ACTIVE',
      },
      {
        name: 'Physical Education',
        code: 'PE101',
        category: 'PHYSICAL_EDUCATION',
        description: 'Physical fitness, team sports, wellness, and healthy habits.',
        applicableClasses: [
          { className: 'Grade 1' },
          { className: 'Grade 2' },
          { className: 'Grade 3' },
          { className: 'Grade 4' },
          { className: 'Grade 5' },
          { className: 'Grade 6' },
          { className: 'Grade 7' },
          { className: 'Grade 8' },
        ],
        academicYear: '2026-2027',
        status: 'ACTIVE',
      },
      {
        name: 'Art & Design',
        code: 'ART101',
        category: 'ARTS',
        description: 'Visual arts, drawing, painting, and creative design.',
        applicableClasses: [
          { className: 'Grade 1' },
          { className: 'Grade 2' },
          { className: 'Grade 3' },
          { className: 'Grade 4' },
          { className: 'Grade 5' },
        ],
        academicYear: '2026-2027',
        status: 'ACTIVE',
      },
    ];

    try {
      const formatted = defaultCurriculum.map((sub) => ({
        ...sub,
        applicableClasses: sub.applicableClasses.map((ac) => ({
          classId: new mongoose.Types.ObjectId(),
          className: ac.className,
        })),
      }));
      await SubjectModel.insertMany(formatted, { ordered: false });
    } catch {
      // Ignore duplicates if any
    }
  }

  async findAll(filter: SubjectFilterOptions): Promise<{ subjects: ISubjectDoc[]; total: number }> {
    await this.ensureDefaultSubjects();

    const query: Record<string, any> = {};

    // Search by name or code
    if (filter.search && filter.search.trim()) {
      const searchRegex = new RegExp(filter.search.trim(), 'i');
      query.$or = [{ name: { $regex: searchRegex } }, { code: { $regex: searchRegex } }];
    }

    // Category filter
    if (filter.category && filter.category !== 'ALL') {
      query.category = filter.category.trim().toUpperCase();
    }

    // Status filter
    if (filter.status && filter.status !== 'ALL') {
      query.status = filter.status.trim().toUpperCase();
    }

    // Academic Year filter
    if (filter.academicYear && filter.academicYear !== 'ALL') {
      query.academicYear = filter.academicYear.trim();
    }

    // Class filter (by classId or className)
    if (filter.classId && filter.classId !== 'ALL') {
      if (mongoose.Types.ObjectId.isValid(filter.classId)) {
        query['applicableClasses.classId'] = new mongoose.Types.ObjectId(filter.classId);
      }
    } else if (filter.className && filter.className !== 'ALL') {
      query['applicableClasses.className'] = { $regex: new RegExp(`^${filter.className.trim()}$`, 'i') };
    }

    // Sorting
    let sortQuery: Record<string, 1 | -1> = { name: 1 };
    switch (filter.sort) {
      case 'name_desc':
        sortQuery = { name: -1 };
        break;
      case 'code_asc':
        sortQuery = { code: 1 };
        break;
      case 'code_desc':
        sortQuery = { code: -1 };
        break;
      case 'newest':
        sortQuery = { createdAt: -1 };
        break;
      case 'oldest':
        sortQuery = { createdAt: 1 };
        break;
      case 'name_asc':
      default:
        sortQuery = { name: 1 };
        break;
    }

    const total = await SubjectModel.countDocuments(query).exec();

    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const limit = filter.limit && filter.limit > 0 ? filter.limit : 50;
    const skip = (page - 1) * limit;

    const subjects = await SubjectModel.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .exec();

    return { subjects, total };
  }

  async findById(id: string): Promise<ISubjectDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await SubjectModel.findById(id).exec();
  }

  async findByCode(code: string): Promise<ISubjectDoc | null> {
    if (!code || !code.trim()) return null;
    return await SubjectModel.findOne({
      code: { $regex: new RegExp(`^${code.trim()}$`, 'i') },
    }).exec();
  }

  async findByName(name: string): Promise<ISubjectDoc | null> {
    if (!name || !name.trim()) return null;
    return await SubjectModel.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    }).exec();
  }

  async create(data: Partial<ISubjectDoc>): Promise<ISubjectDoc> {
    const subject = new SubjectModel(data);
    return await subject.save();
  }

  async update(id: string, data: Partial<ISubjectDoc>): Promise<ISubjectDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await SubjectModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
  }

  async updateStatus(id: string, status: SubjectStatus): Promise<ISubjectDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await SubjectModel.findByIdAndUpdate(id, { $set: { status } }, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await SubjectModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async getSummaryStats(academicYear?: string): Promise<SubjectSummaryStatsDTO> {
    await this.ensureDefaultSubjects();

    const baseQuery: Record<string, any> = {};
    if (academicYear && academicYear !== 'ALL') {
      baseQuery.academicYear = academicYear.trim();
    }

    const [totalSubjects, activeSubjectsList] = await Promise.all([
      SubjectModel.countDocuments(baseQuery).exec(),
      SubjectModel.find({ ...baseQuery, status: 'ACTIVE' }).select('name code applicableClasses').lean().exec(),
    ]);

    const activeSubjects = activeSubjectsList.length;

    // Fetch all active teacher assignments to accurately determine subject assignment
    const teachers = await TeacherModel.find({ status: 'ACTIVE' })
      .select('assignedClasses')
      .lean()
      .exec();

    const assignedSubjectNamesSet = new Set<string>();
    teachers.forEach((t) => {
      (t.assignedClasses || []).forEach((ac) => {
        if (ac.subject && ac.subject.trim()) {
          assignedSubjectNamesSet.add(ac.subject.trim().toLowerCase());
        }
      });
    });

    let assignedSubjects = 0;
    for (const subj of activeSubjectsList) {
      const hasClasses = Array.isArray(subj.applicableClasses) && subj.applicableClasses.length > 0;
      const hasTeacher =
        assignedSubjectNamesSet.has(subj.name.trim().toLowerCase()) ||
        assignedSubjectNamesSet.has(subj.code.trim().toLowerCase());

      if (hasClasses || hasTeacher) {
        assignedSubjects++;
      }
    }

    const unassignedSubjects = Math.max(0, activeSubjects - assignedSubjects);

    return {
      totalSubjects,
      activeSubjects,
      assignedSubjects,
      unassignedSubjects,
    };
  }

  async getAssignedTeachers(subjectName: string, subjectCode?: string): Promise<AssignedTeacherInfoDTO[]> {
    const nameRegex = new RegExp(`^${subjectName.trim()}$`, 'i');
    const orConditions: any[] = [{ 'assignedClasses.subject': { $regex: nameRegex } }];
    if (subjectCode && subjectCode.trim()) {
      orConditions.push({ 'assignedClasses.subject': { $regex: new RegExp(`^${subjectCode.trim()}$`, 'i') } });
    }

    const teachers = await TeacherModel.find({
      status: 'ACTIVE',
      $or: orConditions,
    }).lean().exec();

    const result: AssignedTeacherInfoDTO[] = [];
    const seenAssignments = new Set<string>();

    for (const t of teachers) {
      for (const ac of t.assignedClasses || []) {
        const matchesName = ac.subject && ac.subject.trim().toLowerCase() === subjectName.trim().toLowerCase();
        const matchesCode =
          subjectCode && ac.subject && ac.subject.trim().toLowerCase() === subjectCode.trim().toLowerCase();

        if (matchesName || matchesCode) {
          const key = `${t._id.toString()}-${ac.className}-${ac.section}-${ac.academicYear || ''}`;
          if (!seenAssignments.has(key)) {
            seenAssignments.add(key);
            result.push({
              id: key,
              teacherId: t._id.toString(),
              fullName: t.fullName,
              employeeId: t.employeeId,
              email: t.email,
              phone: t.phone,
              department: t.department,
              className: ac.className,
              section: ac.section,
              academicYear: ac.academicYear || '2026-2027',
            });
          }
        }
      }
    }

    return result;
  }

  async getReferencesCount(
    subjectName: string,
    subjectCode?: string
  ): Promise<{
    timetableCount: number;
    examScheduleCount: number;
    assignmentCount: number;
    teacherAssignmentCount: number;
    totalReferences: number;
  }> {
    const nameRegex = new RegExp(`^${subjectName.trim()}$`, 'i');
    const codeRegex = subjectCode ? new RegExp(`^${subjectCode.trim()}$`, 'i') : null;

    const regexFilter = codeRegex ? { $in: [nameRegex, codeRegex] } : nameRegex;

    const [timetableCount, examScheduleCount, assignmentCount, teacherCount] = await Promise.all([
      TimetablePeriodModel.countDocuments({ subject: regexFilter }).exec(),
      ExamScheduleModel.countDocuments({ subject: regexFilter }).exec(),
      AssignmentModel.countDocuments({ subject: regexFilter }).exec(),
      TeacherModel.countDocuments({ 'assignedClasses.subject': regexFilter }).exec(),
    ]);

    const totalReferences = timetableCount + examScheduleCount + assignmentCount + teacherCount;

    return {
      timetableCount,
      examScheduleCount,
      assignmentCount,
      teacherAssignmentCount: teacherCount,
      totalReferences,
    };
  }
}
