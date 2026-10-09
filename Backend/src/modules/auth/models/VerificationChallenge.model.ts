import mongoose, { Document, Schema } from 'mongoose';
import { ChallengeType } from '../dtos/auth.dto';

export interface IVerificationChallengeDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: ChallengeType;
  codeHash: string;
  expiresAt: Date;
  attemptCount: number;
  maxAttempts: number;
  consumedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const verificationChallengeSchema = new Schema<IVerificationChallengeDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(ChallengeType),
      required: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '7d' },
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const VerificationChallengeModel = mongoose.model<IVerificationChallengeDocument>(
  'VerificationChallenge',
  verificationChallengeSchema
);
