import { z } from 'zod';
import { StudentGender, ParentRelationship } from '../dtos/parent.dto';

export const createStudentRegistrationSchema = z.object({
  body: z.object({
    studentFullName: z
      .string()
      .trim()
      .min(2, 'Student full name must be at least 2 characters long.')
      .max(100, 'Student full name cannot exceed 100 characters.'),

    dateOfBirth: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format. Please provide a valid date of birth.',
      })
      .refine(
        (val) => {
          const dob = new Date(val);
          const now = new Date();
          return dob < now;
        },
        {
          message: 'Date of birth cannot be in the future.',
        }
      )
      .refine(
        (val) => {
          const dob = new Date(val);
          const now = new Date();
          const ageYears = (now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
          return ageYears >= 2 && ageYears <= 25;
        },
        {
          message: 'Student age must be between 2 and 25 years for admission eligibility.',
        }
      ),

    gender: z.nativeEnum(StudentGender),

    requestedGrade: z
      .string()
      .trim()
      .min(1, 'Please select the class or grade you are applying for.'),

    academicYear: z
      .string()
      .trim()
      .min(1, 'Academic year is required.'),

    previousSchool: z
      .string()
      .trim()
      .max(150, 'Previous school name cannot exceed 150 characters.')
      .optional(),

    previousClass: z
      .string()
      .trim()
      .max(50, 'Previous class cannot exceed 50 characters.')
      .optional(),

    parentRelationship: z.nativeEnum(ParentRelationship),

    documents: z
      .array(
        z.object({
          name: z.string().min(1, 'Document name is required.'),
          url: z.string().url('Invalid document URL.'),
          fileType: z.string().optional(),
        })
      )
      .optional(),
  }),
});

export type CreateStudentRegistrationInput = z.infer<typeof createStudentRegistrationSchema>['body'];
