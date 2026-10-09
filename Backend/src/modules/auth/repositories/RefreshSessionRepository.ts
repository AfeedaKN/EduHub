import mongoose from 'mongoose';
import { IRefreshSessionRepository, CreateRefreshSessionData } from '../interfaces/IRefreshSessionRepository';
import { RefreshSessionModel, IRefreshSessionDocument } from '../models/RefreshSession.model';

export class RefreshSessionRepository implements IRefreshSessionRepository {
  async create(data: CreateRefreshSessionData): Promise<IRefreshSessionDocument> {
    return RefreshSessionModel.create({
      ...data,
      userId: new mongoose.Types.ObjectId(data.userId),
    });
  }

  async findByTokenHash(tokenHash: string): Promise<IRefreshSessionDocument | null> {
    return RefreshSessionModel.findOne({ tokenHash });
  }

  async revokeByTokenHash(tokenHash: string, replacedByTokenHash?: string): Promise<void> {
    await RefreshSessionModel.updateOne(
      { tokenHash },
      {
        $set: {
          isRevoked: true,
          replacedByTokenHash: replacedByTokenHash || null,
        },
      }
    );
  }

  async revokeAllForUser(userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return;
    await RefreshSessionModel.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), isRevoked: false },
      { $set: { isRevoked: true } }
    );
  }
}
