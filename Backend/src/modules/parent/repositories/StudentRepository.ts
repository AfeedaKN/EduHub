import mongoose from 'mongoose';
import { IStudentDoc, StudentModel } from '../models/Student.model';

export interface IStudentRepository {
  findByParentId(parentId: string): Promise<IStudentDoc[]>;
  findById(id: string): Promise<IStudentDoc | null>;
  create(data: Partial<IStudentDoc>): Promise<IStudentDoc>;
}

export class StudentRepository implements IStudentRepository {
  async findByParentId(parentId: string): Promise<IStudentDoc[]> {
    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      return [];
    }
    return await StudentModel.find({ parentId }).sort({ createdAt: 1 }).exec();
  }

  async findById(id: string): Promise<IStudentDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await StudentModel.findById(id).exec();
  }

  async create(data: Partial<IStudentDoc>): Promise<IStudentDoc> {
    const student = new StudentModel(data);
    return await student.save();
  }
}
