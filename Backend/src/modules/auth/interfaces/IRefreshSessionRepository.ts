import { IRefreshSessionDocument } from '../models/RefreshSession.model';

export interface CreateRefreshSessionData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface IRefreshSessionRepository {
  create(data: CreateRefreshSessionData): Promise<IRefreshSessionDocument>;
  findByTokenHash(tokenHash: string): Promise<IRefreshSessionDocument | null>;
  revokeByTokenHash(tokenHash: string, replacedByTokenHash?: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}
