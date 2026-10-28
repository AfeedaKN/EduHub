import mongoose from 'mongoose';
import { AttendanceModel, IAttendanceDoc, AttendanceStatus } from '../models/Attendance.model';
import { TeacherModel, ITeacherDoc } from '../../admin/models/Teacher.model';
import { UserModel, IUserDocument } from '../../auth/models/User.model';
import { StudentModel, IStudentDoc } from '../../parent/models/Student.model';
import { SectionModel } from '../../admin/models/Section.model';
import { ClassModel } from '../../admin/models/Class.model';
import { AttendanceHistoryEntryDTO } from '../dtos/attendance.dto';

export interface IAttendanceRepository {
  findTeacherByUserId(userId: string): Promise<ITeacherDoc | null>;
  findUserById(userId: string): Promise<IUserDocument | null>;
  findSectionAcademicYear(
    classId?: string,
    className?: string,
    section?: string
  ): Promise<string | null>;
  findStudentsBySection(
    grade: string,
    section: string,
    academicYear?: string
  ): Promise<IStudentDoc[]>;
  findAttendanceBySectionAndDate(
    className: string,
    section: string,
    date: string
  ): Promise<IAttendanceDoc[]>;
  saveAttendanceBatch(
    records: Array<{
      studentId: mongoose.Types.ObjectId;
      classId?: mongoose.Types.ObjectId;
      className: string;
      section: string;
      academicYear: string;
      date: string;
      status: AttendanceStatus;
      remarks?: string;
      markedBy: mongoose.Types.ObjectId;
    }>
  ): Promise<IAttendanceDoc[]>;
  updateAttendanceBatch(
    records: Array<{
      studentId: mongoose.Types.ObjectId;
      classId?: mongoose.Types.ObjectId;
      className: string;
      section: string;
      academicYear: string;
      date: string;
      status: AttendanceStatus;
      remarks?: string;
      markedBy: mongoose.Types.ObjectId;
    }>
  ): Promise<void>;
  findHistoryBySection(
    className: string,
    section: string,
    academicYear?: string,
    limit?: number
  ): Promise<AttendanceHistoryEntryDTO[]>;
}

export class AttendanceRepository implements IAttendanceRepository {
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

  /**
   * Resolve official section's active academic year from SectionModel / ClassModel
   */
  async findSectionAcademicYear(
    classId?: string,
    className?: string,
    section?: string
  ): Promise<string | null> {
    try {
      if (classId && mongoose.Types.ObjectId.isValid(classId) && section) {
        const sec = await SectionModel.findOne({
          classId: new mongoose.Types.ObjectId(classId),
          name: { $regex: new RegExp(`^${section.trim()}$`, 'i') },
          status: 'ACTIVE',
        }).exec();
        if (sec && sec.academicYear) return sec.academicYear;
      }

      if (className && section) {
        const classDoc = await ClassModel.findOne({
          name: { $regex: new RegExp(`^${className.trim()}$`, 'i') },
        })
          .sort({ academicYear: -1, createdAt: -1 })
          .exec();
        if (classDoc) {
          const sec = await SectionModel.findOne({
            classId: classDoc._id,
            name: { $regex: new RegExp(`^${section.trim()}$`, 'i') },
            status: 'ACTIVE',
          }).exec();
          if (sec && sec.academicYear) return sec.academicYear;
        }
      }
    } catch {
      // Graceful fallback if models or query fail
    }

    return null;
  }

  /**
   * Find officially enrolled active students in a classroom section.
   * Supports resolving Class ObjectId, grade aliases (e.g. "Grade 7", "Class 7", or "7"),
   * and matching or falling back gracefully for academic years.
   */
  async findStudentsBySection(
    grade: string,
    section: string,
    academicYear?: string
  ): Promise<IStudentDoc[]> {
    const trimmedGrade = grade.trim();
    let resolvedGrade = trimmedGrade;

    // 1. Resolve Class ObjectId to class name if an ID was passed
    if (mongoose.Types.ObjectId.isValid(trimmedGrade) && trimmedGrade.length === 24) {
      try {
        const classDoc = await ClassModel.findById(trimmedGrade).exec();
        if (classDoc && classDoc.name) {
          resolvedGrade = classDoc.name.trim();
        }
      } catch {
        // Fallback to literal string
      }
    }

    // 2. Build flexible grade regex (handles "Grade 7", "Class 7", or "7")
    const matchNumber = resolvedGrade.match(/^(?:grade|class)?\s*(\d+)$/i);
    const gradeCondition = matchNumber
      ? { $regex: new RegExp(`^(?:grade|class)?\\s*${matchNumber[1]}$`, 'i') }
      : { $regex: new RegExp(`^${resolvedGrade}$`, 'i') };

    const baseQuery: Record<string, any> = {
      grade: gradeCondition,
      section: { $regex: new RegExp(`^${section.trim()}$`, 'i') },
      status: 'ACTIVE',
    };

    if (academicYear && academicYear.trim() && academicYear !== 'ALL') {
      const normalizedYear = academicYear.trim();
      const escapedYear = normalizedYear
        .replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
        .replace(/\s+/g, '\\s*');

      const yearQuery = {
        ...baseQuery,
        $or: [
          { academicYear: { $regex: new RegExp(`^${escapedYear}$`, 'i') } },
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

    // Include all officially enrolled active students in this section
    return await StudentModel.find(baseQuery).sort({ rollNumber: 1, fullName: 1 }).exec();
  }

  async findAttendanceBySectionAndDate(
    className: string,
    section: string,
    date: string
  ): Promise<IAttendanceDoc[]> {
    return await AttendanceModel.find({
      className: { $regex: new RegExp(`^${className.trim()}$`, 'i') },
      section: { $regex: new RegExp(`^${section.trim()}$`, 'i') },
      date: date.trim(),
    })
      .populate('markedBy', 'fullName email')
      .exec();
  }

  async saveAttendanceBatch(
    records: Array<{
      studentId: mongoose.Types.ObjectId;
      classId?: mongoose.Types.ObjectId;
      className: string;
      section: string;
      academicYear: string;
      date: string;
      status: AttendanceStatus;
      remarks?: string;
      markedBy: mongoose.Types.ObjectId;
    }>
  ): Promise<IAttendanceDoc[]> {
    return await AttendanceModel.insertMany(records, { ordered: true });
  }

  async updateAttendanceBatch(
    records: Array<{
      studentId: mongoose.Types.ObjectId;
      classId?: mongoose.Types.ObjectId;
      className: string;
      section: string;
      academicYear: string;
      date: string;
      status: AttendanceStatus;
      remarks?: string;
      markedBy: mongoose.Types.ObjectId;
    }>
  ): Promise<void> {
    const operations = records.map((record) => ({
      updateOne: {
        filter: {
          studentId: record.studentId,
          section: { $regex: new RegExp(`^${record.section.trim()}$`, 'i') },
          date: record.date.trim(),
        },
        update: {
          $set: {
            className: record.className,
            academicYear: record.academicYear,
            status: record.status,
            remarks: record.remarks || '',
            markedBy: record.markedBy,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
            classId: record.classId,
          },
        },
        upsert: true,
      },
    }));

    await AttendanceModel.bulkWrite(operations);
  }

  async findHistoryBySection(
    className: string,
    section: string,
    academicYear?: string,
    limit: number = 30
  ): Promise<AttendanceHistoryEntryDTO[]> {
    const matchFilter: Record<string, any> = {
      className: { $regex: new RegExp(`^${className.trim()}$`, 'i') },
      section: { $regex: new RegExp(`^${section.trim()}$`, 'i') },
    };

    if (academicYear && academicYear.trim() && academicYear !== 'ALL') {
      matchFilter.academicYear = academicYear.trim();
    }

    const aggregated = await AttendanceModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$date',
          totalStudents: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] },
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] },
          },
          late: {
            $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] },
          },
          lastUpdated: { $max: '$updatedAt' },
          markedById: { $first: '$markedBy' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'markedById',
          foreignField: '_id',
          as: 'teacherUser',
        },
      },
      {
        $unwind: {
          path: '$teacherUser',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $limit: limit,
      },
    ]);

    return aggregated.map((item) => {
      const total = item.totalStudents || 0;
      const present = item.present || 0;
      const late = item.late || 0;
      const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

      return {
        date: item._id,
        totalStudents: total,
        present,
        absent: item.absent || 0,
        late,
        percentage,
        updatedAt: item.lastUpdated || new Date(),
        markedByName: item.teacherUser?.fullName || 'Teacher',
      };
    });
  }
}
