import mongoose, { Document, Schema } from 'mongoose';
import { UserRole, AccountStatus } from '../dtos/auth.dto';

export interface IUserDocument extends Document {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  status: AccountStatus;
  emailVerifiedAt?: Date | null;
  acceptedTerms: boolean;
  acceptedTermsAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.PENDING_VERIFICATION,
      required: true,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    acceptedTerms: {
      type: Boolean,
      default: true,
      required: true,
    },
    acceptedTermsAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.model<IUserDocument>('User', userSchema);
