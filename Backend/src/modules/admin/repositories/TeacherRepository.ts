import mongoose, { ClientSession } from 'mongoose';
import { TeacherModel, ITeacherDoc } from '../models/Teacher.model';
import { UserModel, IUserDocument } from '../../auth/models/User.model';
import { TeacherFilterDTO } from '../dtos/teacher.dto';

export interface ITeacherRepository {
  createTeacher(data: Partial<ITeacherDoc>, session?: ClientSession): Promise<ITeacherDoc>;
  findTeacherById(id: string): Promise<ITeacherDoc | null>;
  findTeacherByUserId(userId: string): Promise<ITeacherDoc | null>;
  findTeacherByEmail(email: string): Promise<ITeacherDoc | null>;
  findTeacherByEmployeeId(employeeId: string): Promise<ITeacherDoc | null>;
  findAllTeachers(filter?: TeacherFilterDTO): Promise<ITeacherDoc[]>;
  updateTeacher(id: string, data: Partial<ITeacherDoc>, session?: ClientSession): Promise<ITeacherDoc | null>;
  deleteTeacher(id: string, session?: ClientSession): Promise<ITeacherDoc | null>;
  countTeachers(status?: string): Promise<number>;
  getNextEmployeeSequence(): Promise<number>;
  createUserForTeacher(userData: Partial<IUserDocument>, session?: ClientSession): Promise<IUserDocument>;
  updateUserForTeacher(userId: string, userData: Partial<IUserDocument>, session?: ClientSession): Promise<IUserDocument | null>;
  findUserByEmail(email: string): Promise<IUserDocument | null>;
  deleteUser(userId: string, session?: ClientSession): Promise<void>;
}

export class TeacherRepository implements ITeacherRepository {
  async createTeacher(data: Partial<ITeacherDoc>, session?: ClientSession): Promise<ITeacherDoc> {
    if (session) {
      const [teacher] = await TeacherModel.create([data], { session });
      return teacher;
    }
    const teacher = new TeacherModel(data);
    return await teacher.save();
  }

  async findTeacherById(id: string): Promise<ITeacherDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await TeacherModel.findById(id).populate('userId', 'fullName email phone status').exec();
  }

  async findTeacherByUserId(userId: string): Promise<ITeacherDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    return await TeacherModel.findOne({ userId }).exec();
  }

  async findTeacherByEmail(email: string): Promise<ITeacherDoc | null> {
    return await TeacherModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async findTeacherByEmployeeId(employeeId: string): Promise<ITeacherDoc | null> {
    return await TeacherModel.findOne({ employeeId: employeeId.trim() }).exec();
  }

  async findAllTeachers(filter?: TeacherFilterDTO): Promise<ITeacherDoc[]> {
    const query: Record<string, any> = {};

    if (filter?.status && filter.status !== 'ALL') {
      query.status = filter.status;
    }

    if (filter?.department && filter.department !== 'ALL') {
      query.department = filter.department;
    }

    if (filter?.search && filter.search.trim()) {
      const searchRegex = new RegExp(filter.search.trim(), 'i');
      query.$or = [
        { fullName: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { phone: { $regex: searchRegex } },
        { employeeId: { $regex: searchRegex } },
        { designation: { $regex: searchRegex } },
        { department: { $regex: searchRegex } },
      ];
    }

    return await TeacherModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async updateTeacher(
    id: string,
    data: Partial<ITeacherDoc>,
    session?: ClientSession
  ): Promise<ITeacherDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const opts = session ? { new: true, session } : { new: true };
    return await TeacherModel.findByIdAndUpdate(id, { $set: data }, opts).exec();
  }

  async deleteTeacher(id: string, session?: ClientSession): Promise<ITeacherDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const opts = session ? { session } : {};
    return await TeacherModel.findByIdAndDelete(id, opts).exec();
  }

  async countTeachers(status?: string): Promise<number> {
    const query: Record<string, any> = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }
    return await TeacherModel.countDocuments(query).exec();
  }

  async getNextEmployeeSequence(): Promise<number> {
    const count = await TeacherModel.countDocuments().exec();
    return count + 1;
  }

  async createUserForTeacher(
    userData: Partial<IUserDocument>,
    session?: ClientSession
  ): Promise<IUserDocument> {
    if (session) {
      const [user] = await UserModel.create([userData], { session });
      return user;
    }
    const user = new UserModel(userData);
    return await user.save();
  }

  async updateUserForTeacher(
    userId: string,
    userData: Partial<IUserDocument>,
    session?: ClientSession
  ): Promise<IUserDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    const opts = session ? { new: true, session } : { new: true };
    return await UserModel.findByIdAndUpdate(userId, { $set: userData }, opts).exec();
  }

  async findUserByEmail(email: string): Promise<IUserDocument | null> {
    return await UserModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async deleteUser(userId: string, session?: ClientSession): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return;
    const opts = session ? { session } : {};
    await UserModel.findByIdAndDelete(userId, opts).exec();
  }
}
