import mongoose, { Schema, Document } from 'mongoose';

export type InvoiceStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface IInvoiceItem {
  categoryName: string;
  amount: number;
}

export interface IFeeInvoiceDoc extends Document {
  invoiceNumber: string;
  studentId: mongoose.Types.ObjectId;
  studentAdmissionNumber: string;
  studentName: string;
  parentId?: mongoose.Types.ObjectId;
  parentName: string;
  parentContact: string;
  className: string;
  section: string;
  academicYear: string;
  feeAssignmentId: mongoose.Types.ObjectId;
  feeStructureId: mongoose.Types.ObjectId;
  installmentNumber: number;
  installmentName: string;
  items: IInvoiceItem[];
  subtotal: number;
  concessionAmount: number;
  lateFeeAmount: number;
  totalPayable: number;
  paidAmount: number;
  outstandingAmount: number;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: InvoiceStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
  {
    categoryName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const FeeInvoiceSchema = new Schema<IFeeInvoiceDoc>(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
      index: true,
    },
    studentAdmissionNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    parentName: {
      type: String,
      trim: true,
      default: '',
    },
    parentContact: {
      type: String,
      trim: true,
      default: '',
    },
    className: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
      default: '2026-2027',
      index: true,
    },
    feeAssignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'StudentFeeAssignment',
      required: true,
      index: true,
    },
    feeStructureId: {
      type: Schema.Types.ObjectId,
      ref: 'FeeStructure',
      required: true,
      index: true,
    },
    installmentNumber: {
      type: Number,
      required: true,
    },
    installmentName: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [InvoiceItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    concessionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateFeeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPayable: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    outstandingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    issueDate: {
      type: String,
      required: true,
    },
    dueDate: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'],
      default: 'UNPAID',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
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

FeeInvoiceSchema.index({ feeAssignmentId: 1, installmentNumber: 1 }, { unique: true });
FeeInvoiceSchema.index({ status: 1, dueDate: 1 });
FeeInvoiceSchema.index({ className: 1, section: 1, academicYear: 1 });

export const FeeInvoiceModel = mongoose.model<IFeeInvoiceDoc>(
  'FeeInvoice',
  FeeInvoiceSchema
);
