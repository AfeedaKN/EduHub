import mongoose, { FilterQuery } from 'mongoose';
import { ExamModel, IExamDoc } from '../models/Exam.model';
import { ExamScheduleModel, IExamScheduleDoc } from '../models/ExamSchedule.model';
import { TeacherModel } from '../models/Teacher.model';
import { TimetablePeriodModel } from '../models/TimetablePeriod.model';
import { ExamFilterDTO, ExamsSummaryDTO } from '../dtos/exam.dto';

export interface IExamRepository {
  findExams(filter: ExamFilterDTO): Promise<IExamDoc[]>;
  findExamById(id: string): Promise<IExamDoc | null>;
  findExamByNameAndYear(
    name: string,
    academicYear: string,
    excludeId?: string
  ): Promise<IExamDoc | null>;
  createExam(data: Partial<IExamDoc>): Promise<IExamDoc>;
  updateExam(id: string, data: Partial<IExamDoc>): Promise<IExamDoc | null>;
  deleteExam(id: string): Promise<boolean>;
  getExamsSummary(academicYear?: string): Promise<ExamsSummaryDTO>;
  countSchedulesForExam(examId: string): Promise<number>;
  countSchedulesForExams(examIds: string[]): Promise<Map<string, number>>;
  findSchedulesByExamId(examId: string): Promise<IExamScheduleDoc[]>;
  findScheduleById(id: string): Promise<IExamScheduleDoc | null>;
  createSchedule(data: Partial<IExamScheduleDoc>): Promise<IExamScheduleDoc>;
  updateSchedule(id: string, data: Partial<IExamScheduleDoc>): Promise<IExamScheduleDoc | null>;
  deleteSchedule(id: string): Promise<boolean>;
  deleteSchedulesByExamId(examId: string): Promise<number>;
  findSectionOverlaps(
    academicYear: string,
    examDate: Date,
    className: string,
    section: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<IExamScheduleDoc[]>;
  findRoomOverlaps(
    academicYear: string,
    examDate: Date,
    roomNumber: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<IExamScheduleDoc[]>;
  findDistinctSubjectsForClassSection(
    classId: string,
    className: string,
    section: string,
    academicYear?: string
  ): Promise<string[]>;
}

export class ExamRepository implements IExamRepository {
  private normalizeTime(timeStr: string): string {
    const parts = timeStr.trim().split(':');
    const h = (parts[0] || '0').padStart(2, '0');
    const m = (parts[1] || '0').padStart(2, '0');
    return `${h}:${m}`;
  }

  private getDateRange(date: Date): { startOfDay: Date; endOfDay: Date } {
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const day = d.getUTCDate();
    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    return { startOfDay, endOfDay };
  }

  async findExams(filter: ExamFilterDTO): Promise<IExamDoc[]> {
    const query: FilterQuery<IExamDoc> = {};

    if (filter.academicYear && filter.academicYear !== 'ALL') {
      query.academicYear = filter.academicYear.trim();
    }

    if (filter.examType && (filter.examType as string) !== 'ALL') {
      query.examType = filter.examType;
    }

    if (filter.status && (filter.status as string) !== 'ALL') {
      query.status = filter.status;
    }

    if (filter.search && filter.search.trim()) {
      query.name = { $regex: filter.search.trim(), $options: 'i' };
    }

    return ExamModel.find(query).sort({ startDate: -1, createdAt: -1 }).exec();
  }

  async findExamById(id: string): Promise<IExamDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return ExamModel.findById(id).exec();
  }

  async findExamByNameAndYear(
    name: string,
    academicYear: string,
    excludeId?: string
  ): Promise<IExamDoc | null> {
    const query: FilterQuery<IExamDoc> = {
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      academicYear: academicYear.trim(),
    };
    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }
    return ExamModel.findOne(query).exec();
  }

  async createExam(data: Partial<IExamDoc>): Promise<IExamDoc> {
    const exam = new ExamModel(data);
    return exam.save();
  }

  async updateExam(id: string, data: Partial<IExamDoc>): Promise<IExamDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return ExamModel.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
  }

  async deleteExam(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const res = await ExamModel.findByIdAndDelete(id).exec();
    return !!res;
  }

  async getExamsSummary(academicYear?: string): Promise<ExamsSummaryDTO> {
    const query: FilterQuery<IExamDoc> = {};
    if (academicYear && academicYear !== 'ALL') {
      query.academicYear = academicYear.trim();
    }

    const totalExams = await ExamModel.countDocuments(query).exec();

    // Upcoming exams: status SCHEDULED, or DRAFT/SCHEDULED with startDate >= today
    const now = new Date();
    const upcomingQuery = {
      ...query,
      status: 'SCHEDULED',
    };
    const upcomingExams = await ExamModel.countDocuments(upcomingQuery).exec();

    // Completed exams: status COMPLETED
    const completedQuery = {
      ...query,
      status: 'COMPLETED',
    };
    const completedExams = await ExamModel.countDocuments(completedQuery).exec();

    // Published results: in Phase 1, marks publishing is not implemented yet, default 0
    return {
      totalExams,
      upcomingExams,
      completedExams,
      publishedResults: 0,
    };
  }

  async countSchedulesForExam(examId: string): Promise<number> {
    if (!mongoose.Types.ObjectId.isValid(examId)) return 0;
    return ExamScheduleModel.countDocuments({
      examId: new mongoose.Types.ObjectId(examId),
    }).exec();
  }

  async countSchedulesForExams(examIds: string[]): Promise<Map<string, number>> {
    const validObjectIds = examIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const map = new Map<string, number>();
    if (validObjectIds.length === 0) return map;

    const aggregate = await ExamScheduleModel.aggregate([
      { $match: { examId: { $in: validObjectIds } } },
      { $group: { _id: '$examId', count: { $sum: 1 } } },
    ]);

    for (const item of aggregate) {
      map.set(item._id.toString(), item.count);
    }

    return map;
  }

  async findSchedulesByExamId(examId: string): Promise<IExamScheduleDoc[]> {
    if (!mongoose.Types.ObjectId.isValid(examId)) return [];
    return ExamScheduleModel.find({ examId: new mongoose.Types.ObjectId(examId) })
      .sort({ examDate: 1, startTime: 1, className: 1, section: 1 })
      .exec();
  }

  async findScheduleById(id: string): Promise<IExamScheduleDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return ExamScheduleModel.findById(id).exec();
  }

  async createSchedule(data: Partial<IExamScheduleDoc>): Promise<IExamScheduleDoc> {
    const schedule = new ExamScheduleModel(data);
    return schedule.save();
  }

  async updateSchedule(
    id: string,
    data: Partial<IExamScheduleDoc>
  ): Promise<IExamScheduleDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return ExamScheduleModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).exec();
  }

  async deleteSchedule(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const res = await ExamScheduleModel.findByIdAndDelete(id).exec();
    return !!res;
  }

  async deleteSchedulesByExamId(examId: string): Promise<number> {
    if (!mongoose.Types.ObjectId.isValid(examId)) return 0;
    const res = await ExamScheduleModel.deleteMany({
      examId: new mongoose.Types.ObjectId(examId),
    }).exec();
    return res.deletedCount || 0;
  }

  async findSectionOverlaps(
    academicYear: string,
    examDate: Date,
    className: string,
    section: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<IExamScheduleDoc[]> {
    const normStart = this.normalizeTime(startTime);
    const normEnd = this.normalizeTime(endTime);
    const { startOfDay, endOfDay } = this.getDateRange(examDate);

    const query: FilterQuery<IExamScheduleDoc> = {
      academicYear: academicYear.trim(),
      className: className.trim(),
      section: section.trim().toUpperCase(),
      examDate: { $gte: startOfDay, $lte: endOfDay },
      startTime: { $lt: normEnd },
      endTime: { $gt: normStart },
    };

    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }

    return ExamScheduleModel.find(query).exec();
  }

  async findRoomOverlaps(
    academicYear: string,
    examDate: Date,
    roomNumber: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<IExamScheduleDoc[]> {
    if (!roomNumber || !roomNumber.trim()) return [];

    const normStart = this.normalizeTime(startTime);
    const normEnd = this.normalizeTime(endTime);
    const { startOfDay, endOfDay } = this.getDateRange(examDate);

    const query: FilterQuery<IExamScheduleDoc> = {
      academicYear: academicYear.trim(),
      roomNumber: { $regex: new RegExp(`^${roomNumber.trim()}$`, 'i') },
      examDate: { $gte: startOfDay, $lte: endOfDay },
      startTime: { $lt: normEnd },
      endTime: { $gt: normStart },
    };

    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }

    return ExamScheduleModel.find(query).exec();
  }

  async findDistinctSubjectsForClassSection(
    classId: string,
    className: string,
    section: string,
    academicYear?: string
  ): Promise<string[]> {
    const subjectsSet = new Set<string>();

    // 1. From Teacher assignedClasses
    const teachers = await TeacherModel.find({
      'assignedClasses.className': { $regex: new RegExp(`^${className.trim()}$`, 'i') },
      'assignedClasses.section': { $regex: new RegExp(`^${section.trim()}$`, 'i') },
    }).exec();

    for (const t of teachers) {
      for (const ac of t.assignedClasses || []) {
        if (
          ac.className.toLowerCase() === className.trim().toLowerCase() &&
          ac.section.toLowerCase() === section.trim().toLowerCase() &&
          ac.subject &&
          ac.subject.trim()
        ) {
          subjectsSet.add(ac.subject.trim());
        }
      }
    }

    // 2. From Timetable Periods
    const timetableQuery: any = {
      className: { $regex: new RegExp(`^${className.trim()}$`, 'i') },
      section: { $regex: new RegExp(`^${section.trim()}$`, 'i') },
      periodType: 'TEACHING',
    };
    if (academicYear) {
      timetableQuery.academicYear = academicYear.trim();
    }

    const periods = await TimetablePeriodModel.find(timetableQuery).exec();
    for (const p of periods) {
      if (p.subject && p.subject.trim()) {
        subjectsSet.add(p.subject.trim());
      }
    }

    return Array.from(subjectsSet).sort();
  }
}
