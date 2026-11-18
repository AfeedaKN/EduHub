import mongoose, { Schema, Document } from 'mongoose';

export type AssignmentInstallmentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';
export type StudentFeeAssignmentStatus = 'ACTIVE' | 'CANCELLED';

export interface IAssignedInstallment {
  installmentNumber: number;
  name: string;
  baseAmount: number;
  concessionAmount: number;
  netAmount: number;
  dueDate: string; // YYYY-MM-DD
  paidAmount: number;
  status: AssignmentInstallmentStatus;
}

export interface IStudentFeeAssignmentDoc extends Document {
  studentId: mongoose.Types.ObjectId;
  admissionNumber: string;
  studentName: string;
  className: string;
  section: string;
  academicYear: string;
  feeStructureId: mongoose.Types.ObjectId;
  feeStructureName: string;
  baseAmount: number;
  concessionId?: mongoose.Types.ObjectId;
  concessionName?: string;
  concessionAmount: number;
  concessionReason?: string;
  netPayable: number;
  installments: IAssignedInstallment[];
  assignedBy?: mongoose.Types.ObjectId;
  status: StudentFeeAssignmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AssignedInstallmentSchema = new Schema<IAssignedInstallment>(
  {
    installmentNumber: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    baseAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    concessionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: String,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['UNPAID', 'PARTIAL', 'PAID', 'OVERDUE'],
      default: 'UNPAID',
    },
  },
  { _id: false }
);

const StudentFeeAssignmentSchema = new Schema<IStudentFeeAssignmentDoc>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
      index: true,
    },
    admissionNumber: {
      type: String,
      required: [true, 'Admission number is required'],
      trim: true,
      index: true,
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    className: {
      type: String,
      required: [true, 'Class is required'],
      trim: true,
      index: true,
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
      default: '2026-2027',
      index: true,
    },
    feeStructureId: {
      type: Schema.Types.ObjectId,
      ref: 'FeeStructure',
      required: [true, 'Fee structure reference is required'],
      index: true,
    },
    feeStructureName: {
      type: String,
      required: true,
      trim: true,
    },
    baseAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    concessionId: {
      type: Schema.Types.ObjectId,
      ref: 'FeeConcession',
      default: null,
    },
    concessionName: {
      type: String,
      trim: true,
      default: '',
    },
    concessionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    concessionReason: {
      type: String,
      trim: true,
      default: '',
    },
    netPayable: {
      type: Number,
      required: true,
      min: 0,
    },
    installments: {
      type: [AssignedInstallmentSchema],
      default: [],
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CANCELLED'],
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

StudentFeeAssignmentSchema.index(
  { studentId: 1, academicYear: 1, status: 1 }
);

export const StudentFeeAssignmentModel = mongoose.model<IStudentFeeAssignmentDoc>(
  'StudentFeeAssignment',
  StudentFeeAssignmentSchema
);
