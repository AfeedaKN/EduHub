import mongoose from 'mongoose';
import { TeacherModel, ITeacherDoc } from '../../admin/models/Teacher.model';
import { UserModel, IUserDocument } from '../../auth/models/User.model';
import { StudentModel, IStudentDoc } from '../../parent/models/Student.model';

export interface ITeacherDashboardRepository {
  findTeacherByUserId(userId: string): Promise<ITeacherDoc | null>;
  findUserById(userId: string): Promise<IUserDocument | null>;
  countStudentsInClass(grade: string, section: string): Promise<number>;
  findStudentsByClasses(filters: Array<{ grade: string; section: string }>): Promise<IStudentDoc[]>;
}

export class TeacherDashboardRepository implements ITeacherDashboardRepository {
  async findTeacherByUserId(userId: string): Promise<ITeacherDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    return await TeacherModel.findOne({ userId }).exec();
  }

  async findUserById(userId: string): Promise<IUserDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    return await UserModel.findById(userId).exec();
  }

  async countStudentsInClass(grade: string, section: string): Promise<number> {
    return await StudentModel.countDocuments({
      grade,
      section,
      status: 'ACTIVE',
    }).exec();
  }

  async findStudentsByClasses(filters: Array<{ grade: string; section: string }>): Promise<IStudentDoc[]> {
    if (!filters || filters.length === 0) return [];

    const conditions = filters.map((f) => ({
      grade: f.grade,
      section: f.section,
      status: 'ACTIVE',
    }));

    return await StudentModel.find({ $or: conditions })
      .sort({ grade: 1, section: 1, fullName: 1 })
      .exec();
  }
}
