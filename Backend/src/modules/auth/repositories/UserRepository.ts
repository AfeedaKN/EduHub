import mongoose from 'mongoose';
import { IUserRepository, CreateUserData } from '../interfaces/IUserRepository';
import { UserModel, IUserDocument } from '../models/User.model';
import { AccountStatus } from '../dtos/auth.dto';

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<IUserDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return UserModel.findById(id);
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ email: email.toLowerCase().trim() });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ email: email.toLowerCase().trim() });
    return count > 0;
  }

  async create(data: CreateUserData): Promise<IUserDocument> {
    return UserModel.create({
      ...data,
      email: data.email.toLowerCase().trim(),
    });
  }

  async updateStatus(
    id: string,
    status: AccountStatus,
    emailVerifiedAt?: Date
  ): Promise<IUserDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const updateFields: Partial<IUserDocument> = { status };
    if (emailVerifiedAt) {
      updateFields.emailVerifiedAt = emailVerifiedAt;
    }

    return UserModel.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
  }

  async updatePasswordHash(id: string, newPasswordHash: string): Promise<IUserDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return UserModel.findByIdAndUpdate(
      id,
      { $set: { passwordHash: newPasswordHash } },
      { new: true }
    );
  }
}
