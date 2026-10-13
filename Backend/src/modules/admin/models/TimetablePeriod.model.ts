import mongoose, { Schema, Document } from 'mongoose';

export type PeriodType = 'TEACHING' | 'BREAK' | 'ASSEMBLY' | 'ACTIVITY';
export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface ITimetablePeriodDoc extends Document {
  academicYear: string;
  classId: mongoose.Types.ObjectId;
  className: string;
  sectionId?: mongoose.Types.ObjectId;
  section: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm" (24-hour format, e.g. "09:00")
  endTime: string; // "HH:mm" (24-hour format, e.g. "09:45")
  subject: string;
  teacherId?: mongoose.Types.ObjectId;
  teacherName?: string;
  roomNumber?: string;
  periodType: PeriodType;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimetablePeriodSchema = new Schema<ITimetablePeriodDoc>(
  {
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
      required: [true, 'Section name is required'],
      trim: true,
      uppercase: true,
    },
    dayOfWeek: {
      type: String,
      required: [true, 'Day of week is required'],
      enum: [
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
      ],
      uppercase: true,
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
    subject: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
      index: true,
    },
    teacherName: {
      type: String,
      trim: true,
      default: '',
    },
    roomNumber: {
      type: String,
      trim: true,
      default: '',
    },
    periodType: {
      type: String,
      enum: ['TEACHING', 'BREAK', 'ASSEMBLY', 'ACTIVITY'],
      default: 'TEACHING',
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

// Indexes for conflict detection and schedule lookups
TimetablePeriodSchema.index({
  academicYear: 1,
  className: 1,
  section: 1,
  dayOfWeek: 1,
});

TimetablePeriodSchema.index({
  academicYear: 1,
  teacherId: 1,
  dayOfWeek: 1,
});

TimetablePeriodSchema.index({
  academicYear: 1,
  roomNumber: 1,
  dayOfWeek: 1,
});

export const TimetablePeriodModel = mongoose.model<ITimetablePeriodDoc>(
  'TimetablePeriod',
  TimetablePeriodSchema
);
