import mongoose, { Schema, Document } from 'mongoose';

export type LedgerTransactionType =
  | 'FEE_PAYMENT'
  | 'FEE_REVERSAL'
  | 'CONCESSION_APPLIED'
  | 'INVOICE_GENERATED';

export type LedgerEntryType = 'CREDIT' | 'DEBIT';
export type LedgerEntryStatus = 'POSTED' | 'REVERSED';

export interface IFeeLedgerDoc extends Document {
  entryNumber: string;
  transactionType: LedgerTransactionType;
  entryType: LedgerEntryType;
  paymentId?: mongoose.Types.ObjectId;
  receiptNumber?: string;
  invoiceId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  studentId: mongoose.Types.ObjectId;
  studentAdmissionNumber: string;
  studentName: string;
  className: string;
  section: string;
  academicYear: string;
  amount: number;
  paymentMethod?: string;
  description: string;
  balanceAfter: number;
  recordedBy: mongoose.Types.ObjectId;
  recordedByName: string;
  reversalOfLedgerId?: mongoose.Types.ObjectId;
  status: LedgerEntryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const FeeLedgerSchema = new Schema<IFeeLedgerDoc>(
  {
    entryNumber: {
      type: String,
      required: [true, 'Ledger entry number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    transactionType: {
      type: String,
      enum: ['FEE_PAYMENT', 'FEE_REVERSAL', 'CONCESSION_APPLIED', 'INVOICE_GENERATED'],
      required: true,
      index: true,
    },
    entryType: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      required: true,
      index: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'FeePayment',
      index: true,
    },
    receiptNumber: {
      type: String,
      trim: true,
      index: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'FeeInvoice',
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
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
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
      default: '2026-2027',
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    paymentMethod: {
      type: String,
      trim: true,
      default: 'CASH',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: [0, 'Balance after payment cannot be negative'],
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recordedByName: {
      type: String,
      required: true,
      trim: true,
    },
    reversalOfLedgerId: {
      type: Schema.Types.ObjectId,
      ref: 'FeeLedger',
      default: null,
    },
    status: {
      type: String,
      enum: ['POSTED', 'REVERSED'],
      default: 'POSTED',
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

FeeLedgerSchema.index({ createdAt: -1 });
FeeLedgerSchema.index({ academicYear: 1, studentId: 1 });

export const FeeLedgerModel = mongoose.model<IFeeLedgerDoc>('FeeLedger', FeeLedgerSchema);
