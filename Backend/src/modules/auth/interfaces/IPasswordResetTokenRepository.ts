import { IPasswordResetTokenDocument } from '../models/PasswordResetToken.model';

export interface CreatePasswordResetTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface IPasswordResetTokenRepository {
  create(data: CreatePasswordResetTokenData): Promise<IPasswordResetTokenDocument>;
  findByTokenHash(tokenHash: string): Promise<IPasswordResetTokenDocument | null>;
  consume(id: string): Promise<void>;
  invalidateAllForUser(userId: string): Promise<void>;
}
