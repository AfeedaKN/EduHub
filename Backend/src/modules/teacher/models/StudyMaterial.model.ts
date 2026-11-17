import mongoose, { Schema, Document } from 'mongoose';

export type StudyMaterialStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type StudyMaterialType = 'DOCUMENT' | 'VIDEO' | 'LINK';

export interface IStudyMaterialDoc extends Document {
  title: string;
  description?: string;
  teacherId: mongoose.Types.ObjectId;
  teacherUserId: mongoose.Types.ObjectId;
  teacherName: string;
  classId?: mongoose.Types.ObjectId;
  className: string;
  section: string;
  subject: string;
  academicYear: string;
  materialType: StudyMaterialType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  externalUrl?: string;
  status: StudyMaterialStatus;
  createdAt: Date;
  updatedAt: Date;
}

const StudyMaterialSchema = new Schema<IStudyMaterialDoc>(
  {
    title: {
      type: String,
      required: [true, 'Material title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
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
    materialType: {
      type: String,
      enum: {
        values: ['DOCUMENT', 'VIDEO', 'LINK'],
        message: '{VALUE} is not a valid material type',
      },
      default: 'DOCUMENT',
      index: true,
    },
    fileUrl: {
      type: String,
      trim: true,
      default: '',
    },
    fileName: {
      type: String,
      trim: true,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    fileType: {
      type: String,
      trim: true,
      default: '',
    },
    externalUrl: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
        message: '{VALUE} is not a valid material status',
      },
      default: 'PUBLISHED',
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

// Query optimization indexes
StudyMaterialSchema.index({ teacherUserId: 1, academicYear: 1, createdAt: -1 });
StudyMaterialSchema.index({ className: 1, section: 1, subject: 1, status: 1 });
StudyMaterialSchema.index({ status: 1, createdAt: -1 });
StudyMaterialSchema.index({ academicYear: 1, status: 1 });

export const StudyMaterialModel = mongoose.model<IStudyMaterialDoc>(
  'StudyMaterial',
  StudyMaterialSchema
);
