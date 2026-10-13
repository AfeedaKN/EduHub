import mongoose, { Schema, Document } from 'mongoose';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export interface IAttendanceDoc extends Document {
  studentId: mongoose.Types.ObjectId;
  classId?: mongoose.Types.ObjectId;
  className: string;
  section: string;
  academicYear: string;
  date: string; // ISO date string "YYYY-MM-DD"
  status: AttendanceStatus;
  remarks?: string;
  markedBy: mongoose.Types.ObjectId; // User ID of the teacher who marked/updated
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendanceDoc>(
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
      required: [true, 'Teacher User ID is required'],
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

// Compound Unique Index: Prevent duplicate attendance records for the same student, section, and date
AttendanceSchema.index({ studentId: 1, section: 1, date: 1 }, { unique: true });

// Compound Query Index: Efficient query by classroom section and date
AttendanceSchema.index({ className: 1, section: 1, date: 1 });

// Compound History Index: Efficient history query by classroom section and date descending
AttendanceSchema.index({ className: 1, section: 1, academicYear: 1, date: -1 });

export const AttendanceModel = mongoose.model<IAttendanceDoc>('Attendance', AttendanceSchema);
