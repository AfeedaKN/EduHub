import { IVerificationChallengeDocument } from '../models/VerificationChallenge.model';
import { ChallengeType } from '../dtos/auth.dto';

export interface CreateChallengeData {
  userId: string;
  type: ChallengeType;
  codeHash: string;
  expiresAt: Date;
  attemptCount?: number;
  maxAttempts?: number;
}

export interface IVerificationChallengeRepository {
  create(data: CreateChallengeData): Promise<IVerificationChallengeDocument>;
  findLatestValid(userId: string, type: ChallengeType): Promise<IVerificationChallengeDocument | null>;
  incrementAttempt(id: string): Promise<IVerificationChallengeDocument | null>;
  consume(id: string): Promise<void>;
  invalidateAllForUser(userId: string, type: ChallengeType): Promise<void>;
}
