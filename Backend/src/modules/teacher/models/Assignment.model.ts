import mongoose, { Schema, Document } from 'mongoose';

export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface IAssignmentDoc extends Document {
  title: string;
  description: string;
  teacherId: mongoose.Types.ObjectId;
  teacherUserId: mongoose.Types.ObjectId;
  teacherName: string;
  classId?: mongoose.Types.ObjectId;
  className: string;
  section: string;
  subject: string;
  academicYear: string;
  assignedDate: string; // ISO Date string "YYYY-MM-DD"
  dueDate: string; // ISO Date string "YYYY-MM-DD"
  maxMarks: number;
  status: AssignmentStatus;
  allowLateSubmissions?: boolean;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignmentDoc>(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Assignment instructions or description is required'],
      trim: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Teacher profile reference is required'],
      index: true,
    },
    teacherUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher user account reference is required'],
      index: true,
    },
    teacherName: {
      type: String,
      required: [true, 'Teacher name is required'],
      trim: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
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
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      index: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
      default: '2026-2027',
      index: true,
    },
    assignedDate: {
      type: String,
      required: [true, 'Assigned date is required'],
      trim: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Assigned date must be formatted as YYYY-MM-DD'],
    },
    dueDate: {
      type: String,
      required: [true, 'Due date is required'],
      trim: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Due date must be formatted as YYYY-MM-DD'],
      index: true,
    },
    maxMarks: {
      type: Number,
      required: [true, 'Maximum marks are required'],
      min: [1, 'Maximum marks must be at least 1'],
    },
    status: {
      type: String,
      enum: {
        values: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
        message: '{VALUE} is not a valid assignment status',
      },
      default: 'PUBLISHED',
      index: true,
    },
    allowLateSubmissions: {
      type: Boolean,
      default: false,
    },
    attachmentUrl: {
      type: String,
      trim: true,
      default: '',
    },
    attachmentName: {
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

// Indexes for optimal querying by teacher, class section, academic year and status
AssignmentSchema.index({ teacherUserId: 1, academicYear: 1, createdAt: -1 });
AssignmentSchema.index({ className: 1, section: 1, subject: 1, status: 1 });
AssignmentSchema.index({ status: 1, dueDate: 1 });

export const AssignmentModel = mongoose.model<IAssignmentDoc>('Assignment', AssignmentSchema);
