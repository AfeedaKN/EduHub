import mongoose, { Schema, Document } from 'mongoose';

export type ConcessionType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type ConcessionStatus = 'ACTIVE' | 'INACTIVE';

export interface IFeeConcessionDoc extends Document {
  name: string;
  code: string;
  discountType: ConcessionType;
  value: number; // percentage (e.g. 10) or fixed amount (e.g. 5000)
  applicableCategories: string[]; // Category names or ['ALL']
  description: string;
  status: ConcessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const FeeConcessionSchema = new Schema<IFeeConcessionDoc>(
  {
    name: {
      type: String,
      required: [true, 'Concession name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Concession code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      maxlength: [20, 'Code cannot exceed 20 characters'],
    },
    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
      required: [true, 'Discount type is required'],
    },
    value: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    applicableCategories: {
      type: [String],
      default: ['ALL'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
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

export const FeeConcessionModel = mongoose.model<IFeeConcessionDoc>(
  'FeeConcession',
  FeeConcessionSchema
);
