import mongoose, { Schema, Document } from 'mongoose';
import { AttendanceStatus } from '../../teacher/models/Attendance.model';

export interface ISubjectAttendanceDoc extends Document {
  studentId: mongoose.Types.ObjectId;
  classId?: mongoose.Types.ObjectId;
  className: string;
  section: string;
  subjectName: string;
  subjectId?: mongoose.Types.ObjectId;
  periodNumber?: number;
  periodTime?: string;
  academicYear: string;
  date: string; // "YYYY-MM-DD"
  status: AttendanceStatus;
  remarks?: string;
  markedBy: mongoose.Types.ObjectId;
  markedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectAttendanceSchema = new Schema<ISubjectAttendanceDoc>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
    },
    className: {
      type: String,
      required: [true, 'Class name is required'],
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
    subjectName: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
    },
    periodNumber: {
      type: Number,
      default: 1,
    },
    periodTime: {
      type: String,
      trim: true,
      default: '',
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
      default: '2026-2027',
      index: true,
    },
    date: {
      type: String,
      required: [true, 'Attendance date (YYYY-MM-DD) is required'],
      trim: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['PRESENT', 'ABSENT', 'LATE'],
        message: '{VALUE} is not a valid attendance status',
      },
      required: [true, 'Attendance status is required'],
      default: 'PRESENT',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
      maxlength: [250, 'Remarks cannot exceed 250 characters'],
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    markedByName: {
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

// Compound index to ensure 1 attendance record per student, date, subject, and period
SubjectAttendanceSchema.index(
  { studentId: 1, date: 1, subjectName: 1, periodNumber: 1 },
  { unique: true }
);

// Query indexes
SubjectAttendanceSchema.index({ className: 1, section: 1, date: 1 });
SubjectAttendanceSchema.index({ className: 1, section: 1, subjectName: 1, date: 1 });
SubjectAttendanceSchema.index({ studentId: 1, date: -1 });

export const SubjectAttendanceModel = mongoose.model<ISubjectAttendanceDoc>(
  'SubjectAttendance',
  SubjectAttendanceSchema
);
