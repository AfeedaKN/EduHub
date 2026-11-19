import mongoose, { Schema, Document } from 'mongoose';

export type OnlineOrderStatus = 'CREATED' | 'PAID' | 'FAILED' | 'EXPIRED';

export interface IFeeOnlineOrderDoc extends Document {
  orderId: string; // Razorpay order_... or internal ORD-...
  gatewayOrderId: string;
  invoiceId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  studentAdmissionNumber: string;
  className: string;
  section: string;
  academicYear: string;
  parentId: mongoose.Types.ObjectId;
  parentName: string;
  parentEmail?: string;
  amount: number; // In Rupees
  amountInPaise: number;
  currency: string;
  status: OnlineOrderStatus;
  paymentId?: mongoose.Types.ObjectId;
  receiptNumber?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  paymentMethod?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeeOnlineOrderSchema = new Schema<IFeeOnlineOrderDoc>(
  {
    orderId: {
      type: String,
      required: [true, 'Order identifier is required'],
      unique: true,
      trim: true,
      index: true,
    },
    gatewayOrderId: {
      type: String,
      required: true,
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
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentAdmissionNumber: {
      type: String,
      required: true,
      trim: true,
    },
    className: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      default: 'A',
    },
    academicYear: {
      type: String,
      required: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    parentName: {
      type: String,
      required: true,
      trim: true,
    },
    parentEmail: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be greater than zero'],
    },
    amountInPaise: {
      type: Number,
      required: true,
      min: [100, 'Amount in paise must be at least 100'],
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    status: {
      type: String,
      enum: ['CREATED', 'PAID', 'FAILED', 'EXPIRED'],
      default: 'CREATED',
      index: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'FeePayment',
      default: null,
    },
    receiptNumber: {
      type: String,
      default: null,
    },
    gatewayPaymentId: {
      type: String,
      default: null,
      index: true,
    },
    gatewaySignature: {
      type: String,
      default: null,
    },
    paymentMethod: {
      type: String,
      default: 'ONLINE',
    },
    failureReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const FeeOnlineOrderModel = mongoose.model<IFeeOnlineOrderDoc>(
  'FeeOnlineOrder',
  FeeOnlineOrderSchema
);
