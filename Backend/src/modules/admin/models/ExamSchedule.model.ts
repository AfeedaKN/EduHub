import mongoose, { Schema, Document } from 'mongoose';

export interface IExamScheduleDoc extends Document {
  examId: mongoose.Types.ObjectId;
  academicYear: string;
  classId: mongoose.Types.ObjectId;
  className: string;
  sectionId?: mongoose.Types.ObjectId;
  section: string;
  subject: string;
  examDate: Date;
  startTime: string; // "HH:mm" (24-hour format, e.g. "09:30")
  endTime: string; // "HH:mm" (24-hour format, e.g. "12:30")
  maxMarks: number;
  passingMarks: number;
  roomNumber?: string;
  invigilatorId?: mongoose.Types.ObjectId;
  invigilatorName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExamScheduleSchema = new Schema<IExamScheduleDoc>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam ID is required'],
      index: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
      default: '2026-2027',
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class ID is required'],
      index: true,
    },
    className: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      default: null,
      index: true,
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      trim: true,
      uppercase: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    examDate: {
      type: Date,
      required: [true, 'Exam date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid start time format (HH:mm)'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      trim: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid end time format (HH:mm)'],
    },
    maxMarks: {
      type: Number,
      required: [true, 'Maximum marks is required'],
      min: [1, 'Maximum marks must be greater than zero'],
    },
    passingMarks: {
      type: Number,
      required: [true, 'Passing marks is required'],
      min: [0, 'Passing marks cannot be negative'],
    },
    roomNumber: {
      type: String,
      trim: true,
      default: '',
    },
    invigilatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
    invigilatorName: {
      type: String,
      trim: true,
      default: '',
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

// Indexes for schedule queries and overlap conflict detection
ExamScheduleSchema.index({ examId: 1, className: 1, section: 1 });
ExamScheduleSchema.index({ academicYear: 1, examDate: 1, className: 1, section: 1 });
ExamScheduleSchema.index({ academicYear: 1, examDate: 1, roomNumber: 1 });

export const ExamScheduleModel = mongoose.model<IExamScheduleDoc>(
  'ExamSchedule',
  ExamScheduleSchema
);
