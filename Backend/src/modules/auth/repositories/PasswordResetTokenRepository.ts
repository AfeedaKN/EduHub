import mongoose from 'mongoose';
import { IPasswordResetTokenRepository, CreatePasswordResetTokenData } from '../interfaces/IPasswordResetTokenRepository';
import { PasswordResetTokenModel, IPasswordResetTokenDocument } from '../models/PasswordResetToken.model';

export class PasswordResetTokenRepository implements IPasswordResetTokenRepository {
  async create(data: CreatePasswordResetTokenData): Promise<IPasswordResetTokenDocument> {
    return PasswordResetTokenModel.create({
      ...data,
      userId: new mongoose.Types.ObjectId(data.userId),
    });
  }

  async findByTokenHash(tokenHash: string): Promise<IPasswordResetTokenDocument | null> {
    return PasswordResetTokenModel.findOne({
      tokenHash,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    });
  }

  async consume(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await PasswordResetTokenModel.findByIdAndUpdate(id, {
      $set: { consumedAt: new Date() },
    });
  }

  async invalidateAllForUser(userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return;
    await PasswordResetTokenModel.updateMany(
      {
        userId: new mongoose.Types.ObjectId(userId),
        consumedAt: null,
      },
      {
        $set: { consumedAt: new Date() },
      }
    );
  }
}
