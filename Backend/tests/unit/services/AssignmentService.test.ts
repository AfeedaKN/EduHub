import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { AssignmentService } from '../../../src/modules/teacher/services/AssignmentService';
import { IAssignmentRepository } from '../../../src/modules/teacher/repositories/AssignmentRepository';
import {
  ValidationError,
  ForbiddenError,
  UnauthorizedError,
  NotFoundError,
} from '../../../src/shared/domain/errors/AppError';

describe('AssignmentService Unit Tests', () => {
  let service: AssignmentService;
  let mockRepo: IAssignmentRepository;

  const validUserId = new mongoose.Types.ObjectId().toString();
  const validTeacherId = new mongoose.Types.ObjectId();
  const anotherUserId = new mongoose.Types.ObjectId().toString();

  const mockTeacher = {
    _id: validTeacherId,
    userId: new mongoose.Types.ObjectId(validUserId),
    fullName: 'Dr. John Watson',
    status: 'ACTIVE',
    assignedClasses: [
      {
        className: 'Grade 10',
        section: 'A',
        subject: 'Mathematics',
        academicYear: '2026-2027',
      },
      {
        className: 'Grade 10',
        section: 'B',
        subject: 'Physics',
        academicYear: '2026-2027',
      },
      {
        className: 'Grade 9',
        section: 'A',
        subject: 'Mathematics',
        academicYear: '2026-2027',
      },
    ],
  };

  const sampleAssignmentDoc = {
    _id: new mongoose.Types.ObjectId(),
    title: 'Algebra Problem Set 1',
    description: 'Complete exercises 1 to 15 on page 42.',
    teacherId: validTeacherId,
    teacherUserId: new mongoose.Types.ObjectId(validUserId),
    teacherName: 'Dr. John Watson',
    className: 'Grade 10',
    section: 'A',
    subject: 'Mathematics',
    academicYear: '2026-2027',
    assignedDate: '2026-10-15',
    dueDate: '2026-10-22',
    maxMarks: 50,
    status: 'PUBLISHED',
    attachmentUrl: 'https://example.com/algebra.pdf',
    attachmentName: 'algebra_set_1.pdf',
    createdAt: new Date('2026-10-15T08:00:00Z'),
    updatedAt: new Date('2026-10-15T08:00:00Z'),
  };

  let mockSubmissionRepo: any;

  beforeEach(() => {
    mockRepo = {
      findTeacherByUserId: vi.fn().mockResolvedValue(mockTeacher as any),
      findUserById: vi.fn(),
      findAssignmentsByTeacher: vi.fn().mockResolvedValue([sampleAssignmentDoc as any]),
      countTeacherAssignments: vi.fn().mockResolvedValue({
        total: 1,
        published: 1,
        drafts: 0,
        pastDue: 0,
      }),
      findById: vi.fn().mockResolvedValue(sampleAssignmentDoc as any),
      create: vi.fn().mockImplementation(async (data) => ({
        _id: new mongoose.Types.ObjectId(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      update: vi.fn().mockImplementation(async (_id, data) => ({
        ...sampleAssignmentDoc,
        ...data,
        updatedAt: new Date(),
      })),
      delete: vi.fn().mockResolvedValue(true),
    };

    mockSubmissionRepo = {
      findByAssignmentAndStudent: vi.fn(),
      findByStudentAndAssignmentIds: vi.fn().mockResolvedValue([]),
      findByAssignmentId: vi.fn().mockResolvedValue([]),
      findByAssignmentAndId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      countByAssignmentId: vi.fn().mockResolvedValue({ total: 1, pending: 1, graded: 0 }),
      getSubmissionStatsByAssignmentIds: vi.fn().mockResolvedValue({
        [sampleAssignmentDoc._id.toString()]: { total: 1, pending: 1, graded: 0 },
      }),
    };

    service = new AssignmentService(mockRepo, mockSubmissionRepo);
  });

  describe('createAssignment', () => {
    it('should successfully create a PUBLISHED assignment when valid details are provided', async () => {
      const payload = {
        title: 'Trigonometry Quiz Prep',
        description: 'Review chapters 4 and 5',
        className: 'Grade 10',
        section: 'A',
        subject: 'Mathematics',
        assignedDate: '2026-10-15',
        dueDate: '2026-10-20',
        maxMarks: 25,
        status: 'PUBLISHED' as const,
      };

      const result = await service.createAssignment(validUserId, payload);

      expect(result).toBeDefined();
      expect(result.title).toBe('Trigonometry Quiz Prep');
      expect(result.status).toBe('PUBLISHED');
      expect(result.maxMarks).toBe(25);
      expect(result.teacherName).toBe('Dr. John Watson');
      expect(mockRepo.create).toHaveBeenCalledOnce();
    });

    it('should successfully create a DRAFT assignment', async () => {
      const payload = {
        title: 'Draft Mechanics Homework',
        description: 'Rough draft problem set',
        className: 'Grade 10',
        section: 'B',
        subject: 'Physics',
        dueDate: '2026-10-30',
        maxMarks: 100,
        status: 'DRAFT' as const,
      };

      const result = await service.createAssignment(validUserId, payload);

      expect(result.status).toBe('DRAFT');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'DRAFT',
          className: 'Grade 10',
          section: 'B',
          subject: 'Physics',
        })
      );
    });

    it('should throw ValidationError if title is missing', async () => {
      await expect(
        service.createAssignment(validUserId, {
          title: '',
          description: 'Valid instructions',
          className: 'Grade 10',
          section: 'A',
          subject: 'Mathematics',
          dueDate: '2026-10-20',
          maxMarks: 20,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if description is missing', async () => {
      await expect(
        service.createAssignment(validUserId, {
          title: 'Valid Title',
          description: '   ',
          className: 'Grade 10',
          section: 'A',
          subject: 'Mathematics',
          dueDate: '2026-10-20',
          maxMarks: 20,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if maxMarks is zero or negative', async () => {
      await expect(
        service.createAssignment(validUserId, {
          title: 'Valid Title',
          description: 'Valid description',
          className: 'Grade 10',
          section: 'A',
          subject: 'Mathematics',
          dueDate: '2026-10-20',
          maxMarks: 0,
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        service.createAssignment(validUserId, {
          title: 'Valid Title',
          description: 'Valid description',
          className: 'Grade 10',
          section: 'A',
          subject: 'Mathematics',
          dueDate: '2026-10-20',
          maxMarks: -10,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if due date is earlier than assigned date', async () => {
      try {
        await service.createAssignment(validUserId, {
          title: 'Valid Title',
          description: 'Valid description',
          className: 'Grade 10',
          section: 'A',
          subject: 'Mathematics',
          assignedDate: '2026-10-25',
          dueDate: '2026-10-20', // Earlier!
          maxMarks: 50,
        });
        expect.unreachable('Should have thrown ValidationError');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ValidationError);
        expect(err.message).toContain('Due date cannot be earlier than assigned date');
      }
    });

    it('should throw ValidationError if assigned date format is invalid', async () => {
      try {
        await service.createAssignment(validUserId, {
          title: 'Valid Title',
          description: 'Valid description',
          className: 'Grade 10',
          section: 'A',
          subject: 'Mathematics',
          assignedDate: '25-10-2026', // Invalid format (not YYYY-MM-DD)
          dueDate: '2026-10-30',
          maxMarks: 50,
        });
        expect.unreachable('Should have thrown ValidationError');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ValidationError);
        expect(err.message).toContain('Assigned date must be formatted as YYYY-MM-DD');
      }
    });

    it('should throw UnauthorizedError if teacher profile is not found or inactive', async () => {
      vi.mocked(mockRepo.findTeacherByUserId).mockResolvedValueOnce(null);

      await expect(
        service.createAssignment(validUserId, {
          title: 'Title',
          description: 'Description',
          className: 'Grade 10',
          section: 'A',
          subject: 'Mathematics',
          dueDate: '2026-10-20',
          maxMarks: 50,
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw ForbiddenError if teacher is not assigned to the selected class section', async () => {
      await expect(
        service.createAssignment(validUserId, {
          title: 'Chemistry Lab',
          description: 'Lab report',
          className: 'Grade 12', // Teacher only teaches Grade 9 and 10!
          section: 'C',
          subject: 'Chemistry',
          dueDate: '2026-10-20',
          maxMarks: 50,
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getAssignments', () => {
    it('should return list of assignments and summary metrics', async () => {
      const res = await service.getAssignments(validUserId, {
        className: 'Grade 10',
        section: 'A',
      });

      expect(res.assignments).toHaveLength(1);
      expect(res.assignments[0].title).toBe('Algebra Problem Set 1');
      expect(res.summary).toEqual({
        total: 1,
        published: 1,
        drafts: 0,
        pastDue: 0,
      });
      expect(mockRepo.findAssignmentsByTeacher).toHaveBeenCalledWith(validUserId, {
        className: 'Grade 10',
        section: 'A',
      });
    });

    it('should return empty list and 0 metrics if teacher profile does not exist', async () => {
      vi.mocked(mockRepo.findTeacherByUserId).mockResolvedValueOnce(null);

      const res = await service.getAssignments(validUserId);
      expect(res.assignments).toHaveLength(0);
      expect(res.summary.total).toBe(0);
    });
  });

  describe('getAssignmentById', () => {
    it('should return assignment details if authorized', async () => {
      const res = await service.getAssignmentById(
        validUserId,
        sampleAssignmentDoc._id.toString()
      );

      expect(res).toBeDefined();
      expect(res.title).toBe(sampleAssignmentDoc.title);
      expect(res.className).toBe(sampleAssignmentDoc.className);
    });

    it('should throw NotFoundError if assignment does not exist', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValueOnce(null);

      await expect(
        service.getAssignmentById(validUserId, new mongoose.Types.ObjectId().toString())
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if assignment belongs to another teacher', async () => {
      await expect(
        service.getAssignmentById(anotherUserId, sampleAssignmentDoc._id.toString())
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateAssignment', () => {
    it('should update assignment when valid changes are submitted by owner', async () => {
      const res = await service.updateAssignment(
        validUserId,
        sampleAssignmentDoc._id.toString(),
        {
          title: 'Updated Algebra Title',
          maxMarks: 75,
        }
      );

      expect(mockRepo.update).toHaveBeenCalledWith(
        sampleAssignmentDoc._id.toString(),
        expect.objectContaining({
          title: 'Updated Algebra Title',
          maxMarks: 75,
        })
      );
      expect(res).toBeDefined();
    });

    it('should throw ForbiddenError when non-owner attempts update', async () => {
      await expect(
        service.updateAssignment(
          anotherUserId,
          sampleAssignmentDoc._id.toString(),
          { title: 'Hacked Title' }
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError if class is changed to an unassigned section', async () => {
      await expect(
        service.updateAssignment(
          validUserId,
          sampleAssignmentDoc._id.toString(),
          { className: 'Grade 12', section: 'Z' }
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateStatus', () => {
    it('should allow toggling status between PUBLISHED and DRAFT', async () => {
      await service.updateStatus(
        validUserId,
        sampleAssignmentDoc._id.toString(),
        'DRAFT'
      );

      expect(mockRepo.update).toHaveBeenCalledWith(
        sampleAssignmentDoc._id.toString(),
        { status: 'DRAFT' }
      );
    });

    it('should throw ValidationError on invalid status', async () => {
      await expect(
        service.updateStatus(
          validUserId,
          sampleAssignmentDoc._id.toString(),
          'INVALID_STATUS' as any
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteAssignment', () => {
    it('should successfully delete assignment by owner', async () => {
      const res = await service.deleteAssignment(
        validUserId,
        sampleAssignmentDoc._id.toString()
      );

      expect(res).toBe(true);
      expect(mockRepo.delete).toHaveBeenCalledWith(sampleAssignmentDoc._id.toString());
    });

    it('should throw ForbiddenError when non-owner attempts deletion', async () => {
      await expect(
        service.deleteAssignment(
          anotherUserId,
          sampleAssignmentDoc._id.toString()
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getSubmissionsForAssignment', () => {
    it('should return submissions list for authorized teacher', async () => {
      const mockSubDoc = {
        _id: new mongoose.Types.ObjectId(),
        assignmentId: sampleAssignmentDoc._id,
        studentId: {
          _id: new mongoose.Types.ObjectId(),
          fullName: 'Alice Johnson',
          rollNumber: '10',
          studentId: 'STU-1001',
          avatarUrl: '',
        },
        answerText: 'Solution to problem 1',
        attachmentUrl: '',
        attachmentName: '',
        attachmentSize: 0,
        attachmentType: '',
        submittedAt: new Date(),
        status: 'SUBMITTED',
        isLate: false,
        version: 1,
        gradingStatus: 'PENDING',
        marksObtained: null,
        maxMarks: 50,
        feedback: '',
        isPublished: false,
        publishedAt: null,
        gradedAt: null,
        gradedBy: null,
        gradingHistory: [],
      };

      mockSubmissionRepo.findByAssignmentId.mockResolvedValue([mockSubDoc]);

      const result = await service.getSubmissionsForAssignment(
        validUserId,
        sampleAssignmentDoc._id.toString()
      );

      expect(result).toHaveLength(1);
      expect(result[0].studentName).toBe('Alice Johnson');
      expect(result[0].studentAdmissionNumber).toBe('STU-1001');
      expect(result[0].status).toBe('SUBMITTED');
    });

    it('should throw ForbiddenError if another teacher tries to view submissions', async () => {
      await expect(
        service.getSubmissionsForAssignment(
          anotherUserId,
          sampleAssignmentDoc._id.toString()
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('gradeSubmission', () => {
    const submissionId = new mongoose.Types.ObjectId().toString();
    const mockExistingSub = {
      _id: new mongoose.Types.ObjectId(submissionId),
      assignmentId: sampleAssignmentDoc._id,
      studentId: {
        _id: new mongoose.Types.ObjectId(),
        fullName: 'Alice Johnson',
        rollNumber: '10',
        studentId: 'STU-1001',
        avatarUrl: '',
      },
      answerText: 'Solution to problem 1',
      submittedAt: new Date(),
      status: 'SUBMITTED',
      isLate: false,
      version: 1,
      gradingStatus: 'PENDING',
      marksObtained: null,
      maxMarks: 50,
      feedback: '',
      isPublished: false,
      gradingHistory: [],
    };

    it('should save draft review without publishing when publishResult is false', async () => {
      mockSubmissionRepo.findByAssignmentAndId.mockResolvedValue(mockExistingSub);
      mockSubmissionRepo.update.mockResolvedValue({
        ...mockExistingSub,
        marksObtained: 42,
        feedback: 'Good effort, check step 3.',
        gradingStatus: 'UNDER_REVIEW',
        status: 'UNDER_REVIEW',
        isPublished: false,
      });

      const res = await service.gradeSubmission(
        validUserId,
        sampleAssignmentDoc._id.toString(),
        submissionId,
        {
          marksObtained: 42,
          feedback: 'Good effort, check step 3.',
          publishResult: false,
        }
      );

      expect(res.marksObtained).toBe(42);
      expect(res.status).toBe('UNDER_REVIEW');
      expect(res.isPublished).toBe(false);
      expect(mockSubmissionRepo.update).toHaveBeenCalledOnce();
    });

    it('should publish result when publishResult is true', async () => {
      mockSubmissionRepo.findByAssignmentAndId.mockResolvedValue(mockExistingSub);
      mockSubmissionRepo.update.mockResolvedValue({
        ...mockExistingSub,
        marksObtained: 48,
        feedback: 'Excellent work!',
        gradingStatus: 'GRADED',
        status: 'GRADED',
        isPublished: true,
      });

      const res = await service.gradeSubmission(
        validUserId,
        sampleAssignmentDoc._id.toString(),
        submissionId,
        {
          marksObtained: 48,
          feedback: 'Excellent work!',
          publishResult: true,
        }
      );

      expect(res.marksObtained).toBe(48);
      expect(res.status).toBe('GRADED');
      expect(res.isPublished).toBe(true);
    });

    it('should throw ValidationError if marks exceed assignment maxMarks', async () => {
      mockSubmissionRepo.findByAssignmentAndId.mockResolvedValue(mockExistingSub);

      await expect(
        service.gradeSubmission(
          validUserId,
          sampleAssignmentDoc._id.toString(),
          submissionId,
          {
            marksObtained: 55, // maxMarks is 50
            publishResult: true,
          }
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if marks are negative', async () => {
      mockSubmissionRepo.findByAssignmentAndId.mockResolvedValue(mockExistingSub);

      await expect(
        service.gradeSubmission(
          validUserId,
          sampleAssignmentDoc._id.toString(),
          submissionId,
          {
            marksObtained: -5,
            publishResult: true,
          }
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if feedback exceeds 2000 characters', async () => {
      mockSubmissionRepo.findByAssignmentAndId.mockResolvedValue(mockExistingSub);
      const longFeedback = 'a'.repeat(2001);

      await expect(
        service.gradeSubmission(
          validUserId,
          sampleAssignmentDoc._id.toString(),
          submissionId,
          {
            marksObtained: 40,
            feedback: longFeedback,
          }
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if marks are NaN or non-numeric', async () => {
      mockSubmissionRepo.findByAssignmentAndId.mockResolvedValue(mockExistingSub);

      await expect(
        service.gradeSubmission(
          validUserId,
          sampleAssignmentDoc._id.toString(),
          submissionId,
          {
            marksObtained: NaN,
          }
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if assignmentId or submissionId is invalid ObjectId', async () => {
      await expect(
        service.gradeSubmission(validUserId, 'invalid-id', submissionId, { marksObtained: 40 })
      ).rejects.toThrow(ValidationError);

      await expect(
        service.gradeSubmission(validUserId, sampleAssignmentDoc._id.toString(), 'invalid-id', { marksObtained: 40 })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ForbiddenError if unauthorized teacher attempts to grade', async () => {
      await expect(
        service.gradeSubmission(
          anotherUserId,
          sampleAssignmentDoc._id.toString(),
          submissionId,
          {
            marksObtained: 40,
            publishResult: true,
          }
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
