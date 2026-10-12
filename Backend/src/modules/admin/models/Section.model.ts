import mongoose, { Schema, Document } from 'mongoose';

export type SectionStatus = 'ACTIVE' | 'INACTIVE';

export interface ISectionDoc extends Document {
  classId: mongoose.Types.ObjectId;
  name: string; // e.g. "A", "B", "C"
  academicYear: string; // e.g. "2026-2027"
  capacity: number; // positive integer, max student intake
  roomNumber?: string;
  status: SectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema = new Schema<ISectionDoc>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Parent class is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Section name is required'],
      trim: true,
      uppercase: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
      default: '2026-2027',
      index: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Maximum student capacity is required'],
      min: [1, 'Capacity must be at least 1 student'],
      validate: {
        validator: Number.isInteger,
        message: 'Capacity must be a positive integer',
      },
    },
    roomNumber: {
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

// Compound unique index: prevent duplicate section names within the same class
SectionSchema.index({ classId: 1, name: 1 }, { unique: true });

export const SectionModel = mongoose.model<ISectionDoc>('Section', SectionSchema);
