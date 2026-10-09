import mongoose, { Schema, Document } from 'mongoose';

export interface IStudentDoc extends Document {
  parentId: mongoose.Types.ObjectId;
  fullName: string;
  studentId: string;
  grade: string;
  section: string;
  classTeacher: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED';
  avatarUrl?: string;
  rollNumber?: string;
  academicYear?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudentDoc>(
  {
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Parent ID is required'],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    studentId: {
      type: String,
      required: [true, 'Student ID / Admission Number is required'],
      unique: true,
      trim: true,
    },
    grade: {
      type: String,
      required: [true, 'Grade is required'],
      trim: true,
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      default: 'A',
      trim: true,
    },
    classTeacher: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'GRADUATED'],
      default: 'ACTIVE',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    rollNumber: {
      type: String,
      default: '',
    },
    academicYear: {
      type: String,
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

export const StudentModel = mongoose.model<IStudentDoc>('Student', StudentSchema);
