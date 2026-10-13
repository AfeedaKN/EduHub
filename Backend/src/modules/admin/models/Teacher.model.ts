import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacherAssignedClass {
  _id?: mongoose.Types.ObjectId;
  classId?: mongoose.Types.ObjectId;
  className: string;
  section: string;
  subject?: string;
  academicYear?: string;
}

export interface ITeacherDoc extends Document {
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  qualification: string;
  designation: string;
  department: string;
  status: 'ACTIVE' | 'INACTIVE';
  assignedClasses: ITeacherAssignedClass[];
  joiningDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema = new Schema<ITeacherDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee / Staff ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    qualification: {
      type: String,
      trim: true,
      default: '',
    },
    designation: {
      type: String,
      trim: true,
      default: 'Teacher',
    },
    department: {
      type: String,
      trim: true,
      default: 'General',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
    assignedClasses: [
      {
        classId: {
          type: Schema.Types.ObjectId,
          ref: 'Class',
          default: null,
        },
        className: {
          type: String,
          required: true,
          trim: true,
        },
        section: {
          type: String,
          required: true,
          trim: true,
        },
        subject: {
          type: String,
          trim: true,
          default: '',
        },
        academicYear: {
          type: String,
          trim: true,
          default: '2026-2027',
        },
      },
    ],
    joiningDate: {
      type: Date,
      default: () => new Date(),
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

export const TeacherModel = mongoose.model<ITeacherDoc>('Teacher', TeacherSchema);
