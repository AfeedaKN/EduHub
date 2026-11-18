import mongoose, { Schema, Document } from 'mongoose';

export type PaymentFrequency = 'ANNUAL' | 'TERM' | 'MONTHLY' | 'CUSTOM';
export type FeeStructureStatus = 'ACTIVE' | 'INACTIVE';

export interface IFeeCategoryItem {
  categoryId: mongoose.Types.ObjectId;
  categoryName: string;
  amount: number;
  isMandatory?: boolean;
}

export interface IFeeInstallmentPlan {
  installmentNumber: number;
  name: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
}

export interface ILateFeeRule {
  enabled: boolean;
  gracePeriodDays: number;
  feeType: 'FIXED' | 'DAILY';
  amount: number;
}

export interface IFeeStructureDoc extends Document {
  name: string;
  description?: string;
  academicYear: string;
  className: string;
  section: string;
  categories: IFeeCategoryItem[];
  totalAmount: number;
  paymentFrequency: PaymentFrequency;
  installments: IFeeInstallmentPlan[];
  lateFeeRule: ILateFeeRule;
  status: FeeStructureStatus;
  createdAt: Date;
  updatedAt: Date;
}

const FeeCategoryItemSchema = new Schema<IFeeCategoryItem>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'FeeCategory',
      required: true,
    },
    categoryName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    isMandatory: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const FeeInstallmentPlanSchema = new Schema<IFeeInstallmentPlan>(
  {
    installmentNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Installment amount cannot be negative'],
    },
    dueDate: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD'],
    },
  },
  { _id: false }
);

const LateFeeRuleSchema = new Schema<ILateFeeRule>(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    gracePeriodDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    feeType: {
      type: String,
      enum: ['FIXED', 'DAILY'],
      default: 'FIXED',
    },
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const FeeStructureSchema = new Schema<IFeeStructureDoc>(
  {
    name: {
      type: String,
      required: [true, 'Fee structure name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
      default: '2026-2027',
      index: true,
    },
    className: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
      index: true,
    },
    section: {
      type: String,
      trim: true,
      default: 'ALL',
      uppercase: true,
    },
    categories: {
      type: [FeeCategoryItemSchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total fee amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    paymentFrequency: {
      type: String,
      enum: ['ANNUAL', 'TERM', 'MONTHLY', 'CUSTOM'],
      default: 'TERM',
    },
    installments: {
      type: [FeeInstallmentPlanSchema],
      default: [],
    },
    lateFeeRule: {
      type: LateFeeRuleSchema,
      default: () => ({ enabled: false, gracePeriodDays: 0, feeType: 'FIXED', amount: 0 }),
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

FeeStructureSchema.index({ className: 1, academicYear: 1, status: 1 });
FeeStructureSchema.index({ name: 1, academicYear: 1 }, { unique: true });

export const FeeStructureModel = mongoose.model<IFeeStructureDoc>(
  'FeeStructure',
  FeeStructureSchema
);
