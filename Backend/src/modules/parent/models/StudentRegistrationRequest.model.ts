import mongoose, { Schema, Document } from 'mongoose';
import { StudentGender, ParentRelationship, RegistrationStatus } from '../dtos/parent.dto';

export interface IStudentRegistrationRequestDoc extends Document {
  parentId: mongoose.Types.ObjectId;
  studentFullName: string;
  dateOfBirth: Date;
  gender: StudentGender;
  requestedGrade: string;
  academicYear: string;
  previousSchool?: string;
  previousClass?: string;
  parentRelationship: ParentRelationship;
  status: RegistrationStatus;
  rejectionReason?: string;
  notes?: string;
  documents?: Array<{
    name: string;
    url: string;
    fileType?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const StudentRegistrationRequestSchema = new Schema<IStudentRegistrationRequestDoc>(
  {
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Parent ID is required'],
      index: true,
    },
    studentFullName: {
      type: String,
      required: [true, 'Student full name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: Object.values(StudentGender),
      required: [true, 'Gender is required'],
    },
    requestedGrade: {
      type: String,
      required: [true, 'Requested grade is required'],
      trim: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
    },
    previousSchool: {
      type: String,
      trim: true,
      default: '',
    },
    previousClass: {
      type: String,
      trim: true,
      default: '',
    },
    parentRelationship: {
      type: String,
      enum: Object.values(ParentRelationship),
      required: [true, 'Relationship to student is required'],
    },
    status: {
      type: String,
      enum: Object.values(RegistrationStatus),
      default: RegistrationStatus.PENDING,
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    documents: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        fileType: { type: String },
      },
    ],
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

// Compound index to help prevent identical duplicate pending requests
StudentRegistrationRequestSchema.index({ parentId: 1, studentFullName: 1, requestedGrade: 1 });

export const StudentRegistrationRequestModel = mongoose.model<IStudentRegistrationRequestDoc>(
  'StudentRegistrationRequest',
  StudentRegistrationRequestSchema
);
