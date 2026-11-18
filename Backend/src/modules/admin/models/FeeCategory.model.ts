import mongoose, { Schema, Document } from 'mongoose';

export type FeeCategoryType =
  | 'ACADEMIC'
  | 'TRANSPORT'
  | 'FACILITY'
  | 'ACTIVITY'
  | 'ADMINISTRATIVE'
  | 'OTHER';

export type FeeNature = 'RECURRING' | 'ONE_TIME';
export type FeeCategoryStatus = 'ACTIVE' | 'INACTIVE';

export interface IFeeCategoryDoc extends Document {
  name: string;
  code: string;
  description: string;
  categoryType: FeeCategoryType;
  feeNature: FeeNature;
  isMandatory: boolean;
  isRefundable: boolean;
  status: FeeCategoryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const FeeCategorySchema = new Schema<IFeeCategoryDoc>(
  {
    name: {
      type: String,
      required: [true, 'Fee category name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Fee category code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      maxlength: [20, 'Code cannot exceed 20 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    categoryType: {
      type: String,
      enum: ['ACADEMIC', 'TRANSPORT', 'FACILITY', 'ACTIVITY', 'ADMINISTRATIVE', 'OTHER'],
      default: 'ACADEMIC',
      index: true,
    },
    feeNature: {
      type: String,
      enum: ['RECURRING', 'ONE_TIME'],
      default: 'RECURRING',
    },
    isMandatory: {
      type: Boolean,
      default: true,
    },
    isRefundable: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

FeeCategorySchema.index({ name: 1, status: 1 });

export const FeeCategoryModel = mongoose.model<IFeeCategoryDoc>(
  'FeeCategory',
  FeeCategorySchema
);
