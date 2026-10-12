import mongoose, { Schema, Document } from 'mongoose';

export type ClassStatus = 'ACTIVE' | 'INACTIVE';

export interface IClassDoc extends Document {
  name: string; // Grade / Standard name, e.g. "Grade 8", "UKG"
  academicYear: string; // e.g. "2026-2027"
  description?: string;
  status: ClassStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClassDoc>(
  {
    name: {
      type: String,
      required: [true, 'Class name or grade is required'],
      trim: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
      default: '2026-2027',
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
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

// Compound unique index: prevent duplicate class names for the same academic year
ClassSchema.index({ name: 1, academicYear: 1 }, { unique: true });

export const ClassModel = mongoose.model<IClassDoc>('Class', ClassSchema);
