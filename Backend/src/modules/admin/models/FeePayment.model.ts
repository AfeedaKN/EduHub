import mongoose, { Schema, Document } from 'mongoose';

export type PaymentMethod =
  | 'CASH'
  | 'CHEQUE'
  | 'BANK_TRANSFER'
  | 'CARD'
  | 'UPI'
  | 'ONLINE';

export type PaymentRecordStatus = 'SUCCESS' | 'REVERSED';
export type ChequeStatus = 'CLEARED' | 'PENDING' | 'BOUNCED';

export interface IFeePaymentDoc extends Document {
  receiptNumber: string;
  invoiceId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  studentId: mongoose.Types.ObjectId;
  studentAdmissionNumber: string;
  studentName: string;
  className: string;
  section: string;
  academicYear: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  bankName?: string;
  chequeDate?: string;
  chequeStatus?: ChequeStatus;
  remarks?: string;
  recordedBy: mongoose.Types.ObjectId;
  recordedByName: string;
  status: PaymentRecordStatus;
  reversalReason?: string;
  reversedAt?: Date;
  reversedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FeePaymentSchema = new Schema<IFeePaymentDoc>(
  {
    receiptNumber: {
      type: String,
      required: [true, 'Receipt number is required'],
      unique: true,
      trim: true,
      uppercase: true,
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
      index: true,
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
      min: [1, 'Payment amount must be greater than zero'],
    },
    paymentDate: {
      type: String,
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'CARD', 'UPI', 'ONLINE'],
      required: true,
      index: true,
    },
    transactionReference: {
      type: String,
      trim: true,
      default: '',
    },
    bankName: {
      type: String,
      trim: true,
      default: '',
    },
    chequeDate: {
      type: String,
      trim: true,
      default: '',
    },
    chequeStatus: {
      type: String,
      enum: ['CLEARED', 'PENDING', 'BOUNCED'],
      default: 'CLEARED',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
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
    status: {
      type: String,
      enum: ['SUCCESS', 'REVERSED'],
      default: 'SUCCESS',
      index: true,
    },
    reversalReason: {
      type: String,
      trim: true,
      default: '',
    },
    reversedAt: {
      type: Date,
      default: null,
    },
    reversedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

FeePaymentSchema.index({ paymentDate: -1, createdAt: -1 });
FeePaymentSchema.index({ className: 1, academicYear: 1 });

export const FeePaymentModel = mongoose.model<IFeePaymentDoc>(
  'FeePayment',
  FeePaymentSchema
);
