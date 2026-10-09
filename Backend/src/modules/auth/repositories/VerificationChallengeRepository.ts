import mongoose from 'mongoose';
import { IVerificationChallengeRepository, CreateChallengeData } from '../interfaces/IVerificationChallengeRepository';
import { VerificationChallengeModel, IVerificationChallengeDocument } from '../models/VerificationChallenge.model';
import { ChallengeType } from '../dtos/auth.dto';

export class VerificationChallengeRepository implements IVerificationChallengeRepository {
  async create(data: CreateChallengeData): Promise<IVerificationChallengeDocument> {
    return VerificationChallengeModel.create({
      ...data,
      userId: new mongoose.Types.ObjectId(data.userId),
    });
  }

  async findLatestValid(userId: string, type: ChallengeType): Promise<IVerificationChallengeDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    return VerificationChallengeModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      type,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });
  }

  async incrementAttempt(id: string): Promise<IVerificationChallengeDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return VerificationChallengeModel.findByIdAndUpdate(
      id,
      { $inc: { attemptCount: 1 } },
      { new: true }
    );
  }

  async consume(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await VerificationChallengeModel.findByIdAndUpdate(id, {
      $set: { consumedAt: new Date() },
    });
  }

  async invalidateAllForUser(userId: string, type: ChallengeType): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return;
    await VerificationChallengeModel.updateMany(
      {
        userId: new mongoose.Types.ObjectId(userId),
        type,
        consumedAt: null,
      },
      {
        $set: { consumedAt: new Date() },
      }
    );
  }
}
