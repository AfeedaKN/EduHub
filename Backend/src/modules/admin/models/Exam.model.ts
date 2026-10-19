import mongoose, { Schema, Document } from 'mongoose';

export type ExamType =
  | 'UNIT_TEST'
  | 'FIRST_TERM'
  | 'MID_TERM'
  | 'SECOND_TERM'
  | 'ANNUAL_EXAM'
  | 'OTHER';

export type ExamStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface IApplicableClass {
  classId: mongoose.Types.ObjectId;
  className: string;
}

export interface IExamDoc extends Document {
  name: string;
  examType: ExamType;
  academicYear: string;
  applicableClasses: IApplicableClass[];
  startDate: Date;
  endDate: Date;
  description?: string;
  status: ExamStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicableClassSchema = new Schema<IApplicableClass>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class ID is required'],
    },
    className: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
    },
  },
  { _id: false }
);

const ExamSchema = new Schema<IExamDoc>(
  {
    name: {
      type: String,
      required: [true, 'Exam name is required'],
      trim: true,
    },
    examType: {
      type: String,
      enum: [
        'UNIT_TEST',
        'FIRST_TERM',
        'MID_TERM',
        'SECOND_TERM',
        'ANNUAL_EXAM',
        'OTHER',
      ],
      required: [true, 'Exam type is required'],
      default: 'MID_TERM',
      index: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
      default: '2026-2027',
      index: true,
    },
    applicableClasses: {
      type: [ApplicableClassSchema],
      validate: {
        validator: function (v: IApplicableClass[]) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one applicable class must be selected',
      },
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'],
      default: 'DRAFT',
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

// Prevent duplicate exam names in the same academic year
ExamSchema.index({ academicYear: 1, name: 1 }, { unique: true });
ExamSchema.index({ academicYear: 1, status: 1 });
ExamSchema.index({ startDate: 1, endDate: 1 });

export const ExamModel = mongoose.model<IExamDoc>('Exam', ExamSchema);
