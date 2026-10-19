import { describe, it, expect } from 'vitest';
import { createStudentRegistrationSchema } from '../../../src/modules/parent/validators/parent.validator';
import { StudentGender, ParentRelationship } from '../../../src/modules/parent/dtos/parent.dto';

describe('createStudentRegistrationSchema Validator', () => {
  const validPayload = {
    studentFullName: 'Emma Watson',
    dateOfBirth: '2016-05-15',
    gender: StudentGender.FEMALE,
    requestedGrade: 'Grade 4',
    academicYear: '2026-2027',
    previousSchool: 'Sunrise Primary',
    previousClass: 'Grade 3',
    parentRelationship: ParentRelationship.MOTHER,
    documents: [
      {
        name: 'Birth Certificate',
        url: 'https://storage.eduhub.school/docs/birth-cert.pdf',
        fileType: 'application/pdf',
      },
    ],
  };

  it('should accept valid registration input', () => {
    const result = createStudentRegistrationSchema.safeParse({ body: validPayload });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.studentFullName).toBe('Emma Watson');
      expect(result.data.body.documents?.[0].name).toBe('Birth Certificate');
    }
  });

  it('should reject whitespace-only document names', () => {
    const payload = {
      ...validPayload,
      documents: [
        {
          name: '   ',
          url: 'https://storage.eduhub.school/docs/birth-cert.pdf',
        },
      ],
    };

    const result = createStudentRegistrationSchema.safeParse({ body: payload });
    expect(result.success).toBe(false);
  });

  it('should reject invalid document URLs', () => {
    const payload = {
      ...validPayload,
      documents: [
        {
          name: 'Medical Record',
          url: 'not-a-valid-url',
        },
      ],
    };

    const result = createStudentRegistrationSchema.safeParse({ body: payload });
    expect(result.success).toBe(false);
  });

  it('should reject future date of birth', () => {
    const payload = {
      ...validPayload,
      dateOfBirth: '2099-01-01',
    };

    const result = createStudentRegistrationSchema.safeParse({ body: payload });
    expect(result.success).toBe(false);
  });

  it('should reject students outside eligible age range (2 to 25)', () => {
    const tooOldPayload = {
      ...validPayload,
      dateOfBirth: '1970-01-01',
    };
    expect(createStudentRegistrationSchema.safeParse({ body: tooOldPayload }).success).toBe(false);

    const tooYoungPayload = {
      ...validPayload,
      dateOfBirth: new Date().toISOString().slice(0, 10), // today (0 years old)
    };
    expect(createStudentRegistrationSchema.safeParse({ body: tooYoungPayload }).success).toBe(false);
  });
});
