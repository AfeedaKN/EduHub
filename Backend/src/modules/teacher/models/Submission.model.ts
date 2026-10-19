import mongoose, { Schema, Document } from 'mongoose';

export type SubmissionStatus = 'SUBMITTED' | 'LATE' | 'RESUBMITTED' | 'UNDER_REVIEW' | 'GRADED';
export type GradingStatus = 'PENDING' | 'UNDER_REVIEW' | 'GRADED';

export interface ISubmissionHistoryItem {
  version: number;
  answerText?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
  submittedAt: Date;
  isLate: boolean;
}

export interface IGradingHistoryItem {
  marksObtained: number;
  maxMarks: number;
  feedback?: string;
  gradedBy: mongoose.Types.ObjectId;
  gradedAt: Date;
  isPublished: boolean;
  action: 'DRAFT_SAVED' | 'PUBLISHED' | 'UPDATED';
}

export interface ISubmissionDoc extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  teacherUserId: mongoose.Types.ObjectId;
  className: string;
  section: string;
  academicYear: string;
  subject: string;

  answerText?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;

  submittedAt: Date;
  status: SubmissionStatus;
  isLate: boolean;
  version: number;
  submissionHistory: ISubmissionHistoryItem[];

  gradingStatus: GradingStatus;
  marksObtained?: number;
  maxMarks: number;
  feedback?: string;
  gradedAt?: Date;
  gradedBy?: mongoose.Types.ObjectId;
  isPublished: boolean;
  publishedAt?: Date | null;
  gradingHistory: IGradingHistoryItem[];

  createdAt: Date;
  updatedAt: Date;
}

const SubmissionHistoryItemSchema = new Schema<ISubmissionHistoryItem>(
  {
    version: { type: Number, required: true },
    answerText: { type: String, default: '' },
    attachmentUrl: { type: String, default: '' },
    attachmentName: { type: String, default: '' },
    attachmentSize: { type: Number, default: 0 },
    attachmentType: { type: String, default: '' },
    submittedAt: { type: Date, required: true },
    isLate: { type: Boolean, default: false },
  },
  { _id: false }
);

const GradingHistoryItemSchema = new Schema<IGradingHistoryItem>(
  {
    marksObtained: { type: Number, required: true },
    maxMarks: { type: Number, required: true },
    feedback: { type: String, default: '' },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gradedAt: { type: Date, required: true },
    isPublished: { type: Boolean, default: false },
    action: {
      type: String,
      enum: ['DRAFT_SAVED', 'PUBLISHED', 'UPDATED'],
      required: true,
    },
  },
  { _id: false }
);

const SubmissionSchema = new Schema<ISubmissionDoc>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment reference is required'],
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Parent reference is required'],
      index: true,
    },
    teacherUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher user reference is required'],
      index: true,
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
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    answerText: {
      type: String,
      trim: true,
      maxlength: [5000, 'Answer text cannot exceed 5000 characters'],
      default: '',
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
    attachmentSize: {
      type: Number,
      default: 0,
    },
    attachmentType: {
      type: String,
      trim: true,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['SUBMITTED', 'LATE', 'RESUBMITTED', 'UNDER_REVIEW', 'GRADED'],
        message: '{VALUE} is not a valid submission status',
      },
      default: 'SUBMITTED',
      index: true,
    },
    isLate: {
      type: Boolean,
      default: false,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    submissionHistory: {
      type: [SubmissionHistoryItemSchema],
      default: [],
    },
    gradingStatus: {
      type: String,
      enum: {
        values: ['PENDING', 'UNDER_REVIEW', 'GRADED'],
        message: '{VALUE} is not a valid grading status',
      },
      default: 'PENDING',
      index: true,
    },
    marksObtained: {
      type: Number,
      default: null,
    },
    maxMarks: {
      type: Number,
      required: [true, 'Max marks reference is required'],
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
    },
    gradedAt: {
      type: Date,
      default: null,
    },
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    gradingHistory: {
      type: [GradingHistoryItemSchema],
      default: [],
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

// Compound Unique Index: Exactly one active submission record per assignment per student
SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
// Index for teacher query: All submissions for an assignment
SubmissionSchema.index({ assignmentId: 1, submittedAt: -1 });
// Index for student submissions
SubmissionSchema.index({ studentId: 1, assignmentId: 1 });
// Index for parent querying
SubmissionSchema.index({ parentId: 1, studentId: 1 });

export const SubmissionModel = mongoose.model<ISubmissionDoc>('Submission', SubmissionSchema);
