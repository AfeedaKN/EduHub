import mongoose, { Schema, Document } from 'mongoose';

export const VALID_SUBJECT_CATEGORIES = [
  'CORE',
  'ELECTIVE',
  'LANGUAGE',
  'SCIENCE',
  'HUMANITIES',
  'COMMERCE',
  'ARTS',
  'VOCATIONAL',
  'PHYSICAL_EDUCATION',
  'OTHER',
] as const;

export type SubjectCategory = (typeof VALID_SUBJECT_CATEGORIES)[number];

export type SubjectStatus = 'ACTIVE' | 'INACTIVE';

export interface IApplicableClassItem {
  classId: mongoose.Types.ObjectId;
  className: string;
}

export interface ISubjectDoc extends Document {
  name: string;
  code: string;
  category: SubjectCategory;
  description: string;
  applicableClasses: IApplicableClassItem[];
  academicYear: string;
  status: SubjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicableClassSchema = new Schema<IApplicableClassItem>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: false,
      default: () => new mongoose.Types.ObjectId(),
    },
    className: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
    },
  },
  { _id: false }
);

const SubjectSchema = new Schema<ISubjectDoc>(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      minlength: [2, 'Subject name must be at least 2 characters'],
      maxlength: [100, 'Subject name cannot exceed 100 characters'],
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      trim: true,
      uppercase: true,
      minlength: [2, 'Subject code must be at least 2 characters'],
      maxlength: [20, 'Subject code cannot exceed 20 characters'],
      unique: true,
      index: true,
    },
    category: {
      type: String,
      enum: {
        values: VALID_SUBJECT_CATEGORIES,
        message: '{VALUE} is not a valid subject category',
      },
      default: 'CORE',
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    applicableClasses: {
      type: [ApplicableClassSchema],
      default: [],
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
      default: '2026-2027',
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
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

SubjectSchema.index({ name: 1, academicYear: 1 });
SubjectSchema.index({ category: 1, status: 1 });
SubjectSchema.index({ 'applicableClasses.className': 1 });

export const SubjectModel = mongoose.model<ISubjectDoc>('Subject', SubjectSchema);
