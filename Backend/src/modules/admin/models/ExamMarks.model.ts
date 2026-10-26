import mongoose, { Schema, Document } from 'mongoose';

export const VALID_EXAM_MARKS_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'PUBLISHED',
  'RETURNED',
] as const;

export type ExamMarksStatus = typeof VALID_EXAM_MARKS_STATUSES[number];

export interface IStudentMarkItem {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  admissionNumber: string;
  rollNumber?: string;
  marksObtained: number | null;
  isAbsent: boolean;
  remarks?: string;
}

export interface IReviewHistoryItem {
  status: ExamMarksStatus;
  changedAt: Date;
  changedBy?: mongoose.Types.ObjectId | null;
  changedByName?: string;
  reason?: string;
}

export interface IExamMarksDoc extends Document {
  examScheduleId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  academicYear: string;
  classId: mongoose.Types.ObjectId;
  className: string;
  sectionId?: mongoose.Types.ObjectId;
  section: string;
  subject: string;
  maxMarks: number;
  passingMarks: number;
  status: ExamMarksStatus;
  teacherUserId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  teacherName: string;
  submittedAt?: Date | null;
  submittedBy?: mongoose.Types.ObjectId | null;
  submittedByName?: string;
  returnedAt?: Date | null;
  returnedBy?: mongoose.Types.ObjectId | null;
  returnedByName?: string;
  returnReason?: string;
  publishedAt?: Date | null;
  publishedBy?: mongoose.Types.ObjectId | null;
  publishedByName?: string;
  reviewHistory?: IReviewHistoryItem[];
  students: IStudentMarkItem[];
  totalStudents: number;
  enteredCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const StudentMarkItemSchema = new Schema<IStudentMarkItem>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID reference is required'],
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    admissionNumber: {
      type: String,
      required: [true, 'Admission number is required'],
      trim: true,
    },
    rollNumber: {
      type: String,
      trim: true,
      default: '',
    },
    marksObtained: {
      type: Number,
      default: null,
      min: [0, 'Marks obtained cannot be negative'],
    },
    isAbsent: {
      type: Boolean,
      default: false,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [250, 'Remarks cannot exceed 250 characters'],
      default: '',
    },
  },
  { _id: false }
);

const ExamMarksSchema = new Schema<IExamMarksDoc>(
  {
    examScheduleId: {
      type: Schema.Types.ObjectId,
      ref: 'ExamSchedule',
      required: [true, 'Exam schedule reference is required'],
      unique: true,
      index: true,
    },
    examId: {
      type: Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam reference is required'],
      index: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required'],
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
    maxMarks: {
      type: Number,
      required: [true, 'Max marks reference is required'],
      min: [1, 'Maximum marks must be greater than zero'],
    },
    passingMarks: {
      type: Number,
      required: [true, 'Passing marks reference is required'],
      min: [0, 'Passing marks cannot be negative'],
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'PUBLISHED', 'RETURNED'],
      default: 'DRAFT',
      index: true,
    },
    teacherUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher user ID reference is required'],
      index: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: [true, 'Teacher document ID reference is required'],
      index: true,
    },
    teacherName: {
      type: String,
      required: [true, 'Teacher name is required'],
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    submittedByName: {
      type: String,
      trim: true,
      default: '',
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    returnedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    returnedByName: {
      type: String,
      trim: true,
      default: '',
    },
    returnReason: {
      type: String,
      trim: true,
      default: '',
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    publishedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    publishedByName: {
      type: String,
      trim: true,
      default: '',
    },
    reviewHistory: {
      type: [
        {
          status: { type: String, required: true },
          changedAt: { type: Date, default: Date.now },
          changedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
          changedByName: { type: String, default: '' },
          reason: { type: String, default: '' },
        },
      ],
      default: [],
    },
    students: {
      type: [StudentMarkItemSchema],
      default: [],
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    enteredCount: {
      type: Number,
      default: 0,
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

ExamMarksSchema.index({ examId: 1, classId: 1, section: 1, subject: 1 });
ExamMarksSchema.index({ academicYear: 1, status: 1 });
ExamMarksSchema.index({ teacherUserId: 1, status: 1 });

export const ExamMarksModel = mongoose.model<IExamMarksDoc>('ExamMarks', ExamMarksSchema);
