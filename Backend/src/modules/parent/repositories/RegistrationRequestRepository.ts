import mongoose from 'mongoose';
import {
  IStudentRegistrationRequestDoc,
  StudentRegistrationRequestModel,
} from '../models/StudentRegistrationRequest.model';
import { RegistrationStatus } from '../dtos/parent.dto';

export interface IRegistrationRequestRepository {
  create(data: Partial<IStudentRegistrationRequestDoc>): Promise<IStudentRegistrationRequestDoc>;
  findByParentId(parentId: string): Promise<IStudentRegistrationRequestDoc[]>;
  findById(id: string): Promise<IStudentRegistrationRequestDoc | null>;
  findPendingByParentAndStudent(
    parentId: string,
    studentFullName: string,
    requestedGrade: string
  ): Promise<IStudentRegistrationRequestDoc | null>;
}

export class RegistrationRequestRepository implements IRegistrationRequestRepository {
  async create(data: Partial<IStudentRegistrationRequestDoc>): Promise<IStudentRegistrationRequestDoc> {
    const request = new StudentRegistrationRequestModel(data);
    return await request.save();
  }

  async findByParentId(parentId: string): Promise<IStudentRegistrationRequestDoc[]> {
    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      return [];
    }
    return await StudentRegistrationRequestModel.find({ parentId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<IStudentRegistrationRequestDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await StudentRegistrationRequestModel.findById(id).exec();
  }

  async findPendingByParentAndStudent(
    parentId: string,
    studentFullName: string,
    requestedGrade: string
  ): Promise<IStudentRegistrationRequestDoc | null> {
    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      return null;
    }
    return await StudentRegistrationRequestModel.findOne({
      parentId,
      studentFullName: { $regex: new RegExp(`^${studentFullName.trim()}$`, 'i') },
      requestedGrade,
      status: { $in: [RegistrationStatus.PENDING, RegistrationStatus.UNDER_REVIEW] },
    }).exec();
  }
}
