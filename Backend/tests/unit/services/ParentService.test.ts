import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { ParentService } from '../../../src/modules/parent/services/ParentService';
import { IRegistrationRequestRepository } from '../../../src/modules/parent/repositories/RegistrationRequestRepository';
import { IStudentRepository } from '../../../src/modules/parent/repositories/StudentRepository';
import {
  StudentGender,
  ParentRelationship,
  RegistrationStatus,
  CreateStudentRegistrationDTO,
} from '../../../src/modules/parent/dtos/parent.dto';
import {
  ConflictError,
  ValidationError,
  ForbiddenError,
} from '../../../src/shared/domain/errors/AppError';
import { ExamMarksModel } from '../../../src/modules/admin/models/ExamMarks.model';
import { ExamModel } from '../../../src/modules/admin/models/Exam.model';
import { ExamScheduleModel } from '../../../src/modules/admin/models/ExamSchedule.model';

describe('ParentService Unit Tests', () => {
  let parentService: ParentService;
  let mockRegistrationRepo: IRegistrationRequestRepository;
  let mockStudentRepo: IStudentRepository;

  const validParentId = new mongoose.Types.ObjectId().toString();
  const validDto: CreateStudentRegistrationDTO = {
    studentFullName: 'Sarah Jenkins',
    dateOfBirth: '2018-04-12',
    gender: StudentGender.FEMALE,
    requestedGrade: 'Grade 3',
    academicYear: '2026-2027',
    previousSchool: 'Greenwood Elementary',
    previousClass: 'Grade 2',
    parentRelationship: ParentRelationship.MOTHER,
  };

  beforeEach(() => {
    mockRegistrationRepo = {
      create: vi.fn(),
      findByParentId: vi.fn(),
      findById: vi.fn(),
      findPendingByParentAndStudent: vi.fn(),
    };

    mockStudentRepo = {
      findByParentId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
    };

    parentService = new ParentService(mockRegistrationRepo, mockStudentRepo);
  });

  describe('createRegistrationRequest', () => {
    it('should successfully create a pending registration request for a student', async () => {
      vi.mocked(mockRegistrationRepo.findPendingByParentAndStudent).mockResolvedValue(null);

      const fakeSavedDoc: any = {
        _id: new mongoose.Types.ObjectId(),
        parentId: new mongoose.Types.ObjectId(validParentId),
        studentFullName: validDto.studentFullName,
        dateOfBirth: new Date(validDto.dateOfBirth),
        gender: validDto.gender,
        requestedGrade: validDto.requestedGrade,
        academicYear: validDto.academicYear,
        previousSchool: validDto.previousSchool,
        previousClass: validDto.previousClass,
        parentRelationship: validDto.parentRelationship,
        status: RegistrationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRegistrationRepo.create).mockResolvedValue(fakeSavedDoc);

      const result = await parentService.createRegistrationRequest(validParentId, validDto);

      expect(mockRegistrationRepo.findPendingByParentAndStudent).toHaveBeenCalledWith(
        validParentId,
        validDto.studentFullName,
        validDto.requestedGrade
      );
      expect(mockRegistrationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentFullName: validDto.studentFullName,
          requestedGrade: validDto.requestedGrade,
          status: RegistrationStatus.PENDING,
        })
      );
      expect(result.status).toBe(RegistrationStatus.PENDING);
      expect(result.studentFullName).toBe('Sarah Jenkins');
    });

    it('should throw ConflictError if an identical request is already pending review', async () => {
      const existingDoc: any = {
        _id: new mongoose.Types.ObjectId(),
        parentId: new mongoose.Types.ObjectId(validParentId),
        studentFullName: validDto.studentFullName,
        status: RegistrationStatus.PENDING,
      };

      vi.mocked(mockRegistrationRepo.findPendingByParentAndStudent).mockResolvedValue(existingDoc as any);

      await expect(
        parentService.createRegistrationRequest(validParentId, validDto)
      ).rejects.toThrow(ConflictError);

      expect(mockRegistrationRepo.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if parentId is invalid', async () => {
      await expect(
        parentService.createRegistrationRequest('invalid-id', validDto)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getParentDashboard', () => {
    it('should aggregate children and registration requests', async () => {
      const mockChildDoc: any = {
        _id: new mongoose.Types.ObjectId(),
        fullName: 'Oliver Jenkins',
        studentId: 'STU-2025-001',
        grade: 'Grade 5',
        section: 'A',
        classTeacher: 'Mrs. Eleanor Vance',
        status: 'ACTIVE',
        avatarUrl: '',
        rollNumber: '14',
        academicYear: '2026-2027',
      };

      const mockRequestDoc: any = {
        _id: new mongoose.Types.ObjectId(),
        parentId: new mongoose.Types.ObjectId(validParentId),
        studentFullName: 'Sarah Jenkins',
        dateOfBirth: new Date('2018-04-12'),
        gender: StudentGender.FEMALE,
        requestedGrade: 'Grade 3',
        academicYear: '2026-2027',
        parentRelationship: ParentRelationship.MOTHER,
        status: RegistrationStatus.PENDING,
        createdAt: new Date(),
      };

      vi.mocked(mockStudentRepo.findByParentId).mockResolvedValue([mockChildDoc]);
      vi.mocked(mockRegistrationRepo.findByParentId).mockResolvedValue([mockRequestDoc]);

      const dashboard = await parentService.getParentDashboard(validParentId);

      expect(dashboard.children).toHaveLength(1);
      expect(dashboard.children[0].fullName).toBe('Oliver Jenkins');
      expect(dashboard.registrationRequests).toHaveLength(1);
      expect(dashboard.registrationRequests[0].studentFullName).toBe('Sarah Jenkins');
    });
  });

  describe('getSchoolMetadata', () => {
    it('should return available classes, academic years, genders and relationships', () => {
      const meta = parentService.getSchoolMetadata();
      expect(meta.classes.length).toBeGreaterThan(5);
      expect(meta.classes).toContain('Grade 1');
      expect(meta.academicYears).toContain('2026-2027');
      expect(meta.genders.length).toBe(4);
      expect(meta.relationships.length).toBe(4);
    });
  });

  describe('getParentAssignments & getParentAssignmentById', () => {
    let mockAssignmentRepo: any;
    let mockSubmissionRepo: any;

    const child1Id = new mongoose.Types.ObjectId().toString();
    const child2Id = new mongoose.Types.ObjectId().toString();

    const mockChild1: any = {
      _id: new mongoose.Types.ObjectId(child1Id),
      studentId: 'STU-101',
      fullName: 'Alice Jenkins',
      grade: 'Grade 10',
      section: 'A',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    };

    const mockChild2: any = {
      _id: new mongoose.Types.ObjectId(child2Id),
      studentId: 'STU-102',
      fullName: 'Bob Jenkins',
      grade: 'Grade 7',
      section: 'B',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    };

    const sampleAssignment: any = {
      _id: new mongoose.Types.ObjectId(),
      title: 'Quadratic Equations Worksheet',
      description: 'Solve questions 1-10 on page 25.',
      subject: 'Mathematics',
      teacherName: 'Dr. John Watson',
      className: 'Grade 10',
      section: 'A',
      academicYear: '2026-2027',
      assignedDate: '2026-10-10',
      dueDate: '2026-10-20',
      maxMarks: 50,
      status: 'PUBLISHED',
      attachmentUrl: 'https://example.com/math.pdf',
      attachmentName: 'math.pdf',
      createdAt: new Date(),
    };

    beforeEach(() => {
      mockAssignmentRepo = {
        findPublishedAssignmentsByClass: vi.fn().mockResolvedValue([sampleAssignment]),
        countPublishedAssignmentsByClass: vi.fn().mockResolvedValue({
          total: 1,
          upcoming: 1,
          dueToday: 0,
          overdue: 0,
        }),
        findDistinctPublishedSubjects: vi.fn().mockResolvedValue(['Mathematics']),
        findPublishedById: vi.fn().mockResolvedValue(sampleAssignment),
      };

      mockSubmissionRepo = {
        findByAssignmentAndStudent: vi.fn().mockResolvedValue(null),
        findByStudentAndAssignmentIds: vi.fn().mockResolvedValue([]),
        findByAssignmentId: vi.fn().mockResolvedValue([]),
        findById: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
        update: vi.fn(),
        countByAssignmentId: vi.fn().mockResolvedValue({ total: 0, graded: 0, pending: 0 }),
      };

      parentService = new ParentService(
        mockRegistrationRepo,
        mockStudentRepo,
        mockAssignmentRepo,
        mockSubmissionRepo
      );
    });

    it('should return published assignments for parent with single enrolled child', async () => {
      vi.mocked(mockStudentRepo.findByParentId).mockResolvedValue([mockChild1]);

      const res = await parentService.getParentAssignments(validParentId);

      expect(res.children).toHaveLength(1);
      expect(res.selectedChild?.fullName).toBe('Alice Jenkins');
      expect(res.assignments).toHaveLength(1);
      expect(res.assignments[0].title).toBe('Quadratic Equations Worksheet');
      expect(res.assignments[0].status).toBe('PUBLISHED');
      expect(res.summary.total).toBe(1);
      expect(res.subjects).toEqual(['Mathematics']);
      expect(mockAssignmentRepo.findPublishedAssignmentsByClass).toHaveBeenCalledWith(
        'Grade 10',
        'A',
        '2026-2027',
        expect.any(Object)
      );
    });

    it('should allow selecting second child when parent has multiple enrolled children', async () => {
      vi.mocked(mockStudentRepo.findByParentId).mockResolvedValue([mockChild1, mockChild2]);

      const res = await parentService.getParentAssignments(validParentId, {
        studentId: child2Id,
      });

      expect(res.children).toHaveLength(2);
      expect(res.selectedChild?.fullName).toBe('Bob Jenkins');
      expect(mockAssignmentRepo.findPublishedAssignmentsByClass).toHaveBeenCalledWith(
        'Grade 7',
        'B',
        '2026-2027',
        expect.any(Object)
      );
    });

    it('should throw ForbiddenError if parent tries to access assignments for an unauthorized child', async () => {
      vi.mocked(mockStudentRepo.findByParentId).mockResolvedValue([mockChild1]);
      const strangerChildId = new mongoose.Types.ObjectId().toString();

      await expect(
        parentService.getParentAssignments(validParentId, { studentId: strangerChildId })
      ).rejects.toThrow('You are not authorized to view assignments for this student.');
    });

    it('should return empty state when parent has no approved enrolled children', async () => {
      vi.mocked(mockStudentRepo.findByParentId).mockResolvedValue([]);

      const res = await parentService.getParentAssignments(validParentId);

      expect(res.children).toHaveLength(0);
      expect(res.selectedChild).toBeNull();
      expect(res.assignments).toHaveLength(0);
      expect(res.summary).toEqual({ total: 0, upcoming: 0, dueToday: 0, overdue: 0 });
    });

    it('should get single assignment details if matching child enrolled class', async () => {
      vi.mocked(mockStudentRepo.findByParentId).mockResolvedValue([mockChild1]);

      const res = await parentService.getParentAssignmentById(
        validParentId,
        sampleAssignment._id.toString()
      );

      expect(res).toBeDefined();
      expect(res.title).toBe('Quadratic Equations Worksheet');
      expect(res.submissionStatus).toBe('NOT_SUBMITTED');
      expect(res.submissionTrackingAvailable).toBe(true);
    });

    it('should throw ForbiddenError when assignment belongs to an unrelated class section', async () => {
      // Parent only has child in Grade 7-B, while assignment is for Grade 10-A
      vi.mocked(mockStudentRepo.findByParentId).mockResolvedValue([mockChild2]);

      await expect(
        parentService.getParentAssignmentById(
          validParentId,
          sampleAssignment._id.toString()
        )
      ).rejects.toThrow('You are not authorized to view this assignment.');
    });
  });

  describe('submitAssignment', () => {
    let mockAssignmentRepo: any;
    let mockSubmissionRepo: any;

    const childId = new mongoose.Types.ObjectId().toString();
    const assignmentId = new mongoose.Types.ObjectId().toString();

    const mockChild: any = {
      _id: new mongoose.Types.ObjectId(childId),
      studentId: 'STU-201',
      fullName: 'Emma Watson',
      grade: 'Grade 9',
      section: 'A',
      academicYear: '2026-2027',
      status: 'ACTIVE',
      parentId: new mongoose.Types.ObjectId(validParentId),
    };

    const publishedAssignment: any = {
      _id: new mongoose.Types.ObjectId(assignmentId),
      title: 'Biology Plant Cell Diagram',
      description: 'Draw and label the parts of a plant cell.',
      subject: 'Biology',
      teacherUserId: new mongoose.Types.ObjectId(),
      teacherName: 'Dr. Jane Smith',
      className: 'Grade 9',
      section: 'A',
      academicYear: '2026-2027',
      assignedDate: '2026-10-10',
      dueDate: '2026-10-30', // Future due date
      maxMarks: 25,
      status: 'PUBLISHED',
      allowLateSubmissions: false,
    };

    beforeEach(() => {
      mockAssignmentRepo = {
        findPublishedById: vi.fn().mockResolvedValue(publishedAssignment),
      };

      mockSubmissionRepo = {
        findByAssignmentAndStudent: vi.fn().mockResolvedValue(null),
        findByStudentAndAssignmentIds: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockImplementation((data) =>
          Promise.resolve({
            _id: new mongoose.Types.ObjectId(),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        ),
        update: vi.fn().mockImplementation((id, data) =>
          Promise.resolve({
            _id: new mongoose.Types.ObjectId(id),
            ...data,
            assignmentId: publishedAssignment._id,
            studentId: mockChild._id,
            maxMarks: 25,
            gradingStatus: 'PENDING',
          })
        ),
      };

      mockStudentRepo.findById = vi.fn().mockResolvedValue(mockChild);

      parentService = new ParentService(
        mockRegistrationRepo,
        mockStudentRepo,
        mockAssignmentRepo,
        mockSubmissionRepo
      );
    });

    it('should successfully submit assignment with text answer and attachment', async () => {
      const res = await parentService.submitAssignment(validParentId, assignmentId, {
        studentId: childId,
        answerText: 'Here is my plant cell diagram submission.',
        attachmentUrl: 'https://example.com/cell.pdf',
        attachmentName: 'cell.pdf',
      });

      expect(res).toBeDefined();
      expect(res.status).toBe('SUBMITTED');
      expect(res.isLate).toBe(false);
      expect(res.version).toBe(1);
      expect(res.answerText).toBe('Here is my plant cell diagram submission.');
      expect(mockSubmissionRepo.create).toHaveBeenCalledOnce();
    });

    it('should throw ForbiddenError if parent tries to submit for someone else child', async () => {
      const strangerChild = { ...mockChild, parentId: new mongoose.Types.ObjectId() };
      vi.mocked(mockStudentRepo.findById).mockResolvedValue(strangerChild);

      await expect(
        parentService.submitAssignment(validParentId, assignmentId, {
          studentId: childId,
          answerText: 'Answer text',
        })
      ).rejects.toThrow('You are not authorized to submit assignments on behalf of this student.');
    });

    it('should throw NotFoundError if assignment is not published or not found', async () => {
      vi.mocked(mockAssignmentRepo.findPublishedById).mockResolvedValue(null);

      await expect(
        parentService.submitAssignment(validParentId, assignmentId, {
          studentId: childId,
          answerText: 'Answer text',
        })
      ).rejects.toThrow('Assignment not found or is no longer published.');
    });

    it('should throw ForbiddenError if student grade/section does not match assignment', async () => {
      const mismatchedChild = { ...mockChild, grade: 'Grade 8', section: 'B' };
      vi.mocked(mockStudentRepo.findById).mockResolvedValue(mismatchedChild);

      await expect(
        parentService.submitAssignment(validParentId, assignmentId, {
          studentId: childId,
          answerText: 'Answer text',
        })
      ).rejects.toThrow('This assignment is not assigned to your child’s class and section.');
    });

    it('should throw ValidationError if neither answerText nor attachment is provided', async () => {
      await expect(
        parentService.submitAssignment(validParentId, assignmentId, {
          studentId: childId,
          answerText: '   ',
        })
      ).rejects.toThrow('Please provide either an answer text or a file attachment.');
    });

    it('should throw ValidationError if deadline has passed and allowLateSubmissions is false', async () => {
      const pastDueAssignment = { ...publishedAssignment, dueDate: '2026-10-01', allowLateSubmissions: false };
      vi.mocked(mockAssignmentRepo.findPublishedById).mockResolvedValue(pastDueAssignment);

      await expect(
        parentService.submitAssignment(validParentId, assignmentId, {
          studentId: childId,
          answerText: 'Late submission',
        })
      ).rejects.toThrow('The deadline for this assignment has passed and late submissions are not allowed.');
    });

    it('should mark submission as LATE if deadline passed but allowLateSubmissions is true', async () => {
      const pastDueWithLateAllowed = { ...publishedAssignment, dueDate: '2026-10-01', allowLateSubmissions: true };
      vi.mocked(mockAssignmentRepo.findPublishedById).mockResolvedValue(pastDueWithLateAllowed);

      const res = await parentService.submitAssignment(validParentId, assignmentId, {
        studentId: childId,
        answerText: 'Late submission with permission',
      });

      expect(res.status).toBe('LATE');
      expect(res.isLate).toBe(true);
    });

    it('should allow resubmission preserving previous version in history', async () => {
      const existingSubmission = {
        _id: new mongoose.Types.ObjectId(),
        assignmentId: publishedAssignment._id,
        studentId: mockChild._id,
        version: 1,
        answerText: 'First attempt',
        attachmentUrl: '',
        submittedAt: new Date('2026-10-12'),
        isLate: false,
        gradingStatus: 'PENDING',
        submissionHistory: [],
      };

      vi.mocked(mockSubmissionRepo.findByAssignmentAndStudent).mockResolvedValue(existingSubmission);

      const res = await parentService.submitAssignment(validParentId, assignmentId, {
        studentId: childId,
        answerText: 'Second revised attempt',
      });

      expect(res.version).toBe(2);
      expect(res.status).toBe('RESUBMITTED');
      expect(mockSubmissionRepo.update).toHaveBeenCalledWith(
        existingSubmission._id.toString(),
        expect.objectContaining({
          answerText: 'Second revised attempt',
          version: 2,
          submissionHistory: expect.arrayContaining([
            expect.objectContaining({ version: 1, answerText: 'First attempt' }),
          ]),
        })
      );
    });

    it('should throw ValidationError if attempting to resubmit an already GRADED assignment', async () => {
      const gradedSubmission = {
        _id: new mongoose.Types.ObjectId(),
        assignmentId: publishedAssignment._id,
        studentId: mockChild._id,
        version: 1,
        gradingStatus: 'GRADED',
        marksObtained: 22,
      };

      vi.mocked(mockSubmissionRepo.findByAssignmentAndStudent).mockResolvedValue(gradedSubmission);

      await expect(
        parentService.submitAssignment(validParentId, assignmentId, {
          studentId: childId,
          answerText: 'Trying to change after grade',
        })
      ).rejects.toThrow('This assignment has already been evaluated and graded and cannot be resubmitted.');
    });
  });

  describe('getParentExamResults', () => {
    const childId = new mongoose.Types.ObjectId();
    const mockChild: any = {
      _id: childId,
      parentId: new mongoose.Types.ObjectId(validParentId),
      fullName: 'Sarah Jenkins',
      studentId: 'STU-1001',
      grade: 'Grade 3',
      section: 'A',
      status: 'ACTIVE',
      academicYear: '2026-2027',
    };

    it('should throw ValidationError if parentId is invalid', async () => {
      await expect(parentService.getParentExamResults('invalid-id')).rejects.toThrow(
        ValidationError
      );
    });

    it('should return empty result if parent has no active children', async () => {
      vi.mocked(mockStudentRepo.findByParentId).mockResolvedValue([]);

      const result = await parentService.getParentExamResults(validParentId);
      expect(result.children).toEqual([]);
      expect(result.selectedChild).toBeNull();
      expect(result.exams).toEqual([]);
      expect(result.summary.totalExams).toBe(0);
    });

    it('should throw ForbiddenError if parent queries for a studentId not in their active children', async () => {
      vi.mocked(mockStudentRepo.findByParentId).mockResolvedValue([mockChild]);

      const foreignStudentId = new mongoose.Types.ObjectId().toString();
      await expect(
        parentService.getParentExamResults(validParentId, { studentId: foreignStudentId })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should return published examination results and omit unpublished marks', async () => {
      vi.mocked(mockStudentRepo.findByParentId).mockResolvedValue([mockChild]);

      const examId = new mongoose.Types.ObjectId();
      const scheduleId = new mongoose.Types.ObjectId();

      const mockPublishedMark: any = {
        _id: new mongoose.Types.ObjectId(),
        examId,
        examScheduleId: scheduleId,
        academicYear: '2026-2027',
        subject: 'Mathematics',
        maxMarks: 100,
        passingMarks: 40,
        status: 'PUBLISHED',
        publishedAt: new Date('2026-10-25T10:00:00Z'),
        students: [
          {
            studentId: childId,
            admissionNumber: 'STU-1001',
            studentName: 'Sarah Jenkins',
            marksObtained: 85,
            isAbsent: false,
            remarks: 'Great work!',
          },
        ],
      };

      vi.spyOn(ExamMarksModel, 'find').mockReturnValueOnce({
        sort: vi.fn().mockReturnValueOnce({
          lean: vi.fn().mockReturnValueOnce({
            exec: vi.fn().mockResolvedValue([mockPublishedMark]),
          }),
        }),
      } as any);

      vi.spyOn(ExamModel, 'find').mockReturnValueOnce({
        lean: vi.fn().mockReturnValueOnce({
          exec: vi.fn().mockResolvedValue([
            {
              _id: examId,
              name: 'Mid-Term Exam',
              examType: 'MID-TERM',
            },
          ]),
        }),
      } as any);

      vi.spyOn(ExamScheduleModel, 'find').mockReturnValueOnce({
        lean: vi.fn().mockReturnValueOnce({
          exec: vi.fn().mockResolvedValue([
            {
              _id: scheduleId,
              examId,
              subject: 'Mathematics',
              maxMarks: 100,
              passingMarks: 40,
              examDate: new Date('2026-10-20'),
            },
          ]),
        }),
      } as any);

      const result = await parentService.getParentExamResults(validParentId, {
        studentId: childId.toString(),
      });

      expect(result.selectedChild?.fullName).toBe('Sarah Jenkins');
      expect(result.exams.length).toBe(1);
      expect(result.exams[0].examName).toBe('Mid-Term Exam');
      expect(result.exams[0].overallPercentage).toBe(85);
      expect(result.exams[0].overallGrade).toBe('A');
      expect(result.exams[0].isPassed).toBe(true);
      expect(result.exams[0].publishedAt).toBeDefined();
      expect(result.exams[0].subjects.length).toBe(1);
      expect(result.exams[0].subjects[0].subject).toBe('Mathematics');
      expect(result.exams[0].subjects[0].marksObtained).toBe(85);
      expect(result.exams[0].subjects[0].grade).toBe('A');
      expect(result.exams[0].subjects[0].isPassed).toBe(true);
      expect(result.summary.totalExams).toBe(1);
      expect(result.summary.totalSubjectsPassed).toBe(1);
      expect(result.summary.totalSubjectsFailed).toBe(0);
    });

    it('handles absent student properly with AB grade without treating marks as zero', async () => {
      const parentId = new mongoose.Types.ObjectId().toString();
      const childId = new mongoose.Types.ObjectId();
      const examId = new mongoose.Types.ObjectId();
      const scheduleId = new mongoose.Types.ObjectId();

      vi.mocked(mockStudentRepo.findByParentId).mockResolvedValueOnce([
        {
          _id: childId,
          fullName: 'Sarah Jenkins',
          studentId: 'STU-1001',
          grade: 'Grade 5',
          section: 'A',
          status: 'ACTIVE',
          parentId,
        } as any,
      ]);

      const mockPublishedMark: any = {
        _id: new mongoose.Types.ObjectId(),
        examId,
        examScheduleId: scheduleId,
        academicYear: '2026-2027',
        subject: 'Science',
        maxMarks: 100,
        passingMarks: 40,
        status: 'PUBLISHED',
        publishedAt: new Date('2026-10-25T10:00:00Z'),
        students: [
          {
            studentId: childId,
            admissionNumber: 'STU-1001',
            studentName: 'Sarah Jenkins',
            marksObtained: null,
            isAbsent: true,
            remarks: 'Medical leave on exam day',
          },
        ],
      };

      vi.spyOn(ExamMarksModel, 'find').mockReturnValueOnce({
        sort: vi.fn().mockReturnValueOnce({
          lean: vi.fn().mockReturnValueOnce({
            exec: vi.fn().mockResolvedValue([mockPublishedMark]),
          }),
        }),
      } as any);

      vi.spyOn(ExamModel, 'find').mockReturnValueOnce({
        lean: vi.fn().mockReturnValueOnce({
          exec: vi.fn().mockResolvedValue([
            {
              _id: examId,
              name: 'Mid-Term Exam',
              examType: 'MID-TERM',
            },
          ]),
        }),
      } as any);

      vi.spyOn(ExamScheduleModel, 'find').mockReturnValueOnce({
        lean: vi.fn().mockReturnValueOnce({
          exec: vi.fn().mockResolvedValue([
            {
              _id: scheduleId,
              examId,
              subject: 'Science',
              maxMarks: 100,
              passingMarks: 40,
            },
          ]),
        }),
      } as any);

      const result = await parentService.getParentExamResults(parentId, {
        studentId: childId.toString(),
      });

      expect(result.exams[0].subjects[0].isAbsent).toBe(true);
      expect(result.exams[0].subjects[0].marksObtained).toBeNull();
      expect(result.exams[0].subjects[0].grade).toBe('AB');
      expect(result.exams[0].subjects[0].isPassed).toBe(false);
      expect(result.exams[0].isPassed).toBe(false);
    });

    it('throws ForbiddenError when parent attempts to access results for an unauthorized student', async () => {
      const parentId = new mongoose.Types.ObjectId().toString();
      const authorizedChildId = new mongoose.Types.ObjectId();
      const unauthorizedChildId = new mongoose.Types.ObjectId();

      vi.mocked(mockStudentRepo.findByParentId).mockResolvedValueOnce([
        {
          _id: authorizedChildId,
          fullName: 'Sarah Jenkins',
          studentId: 'STU-1001',
          grade: 'Grade 5',
          section: 'A',
          status: 'ACTIVE',
          parentId,
        } as any,
      ]);

      await expect(
        parentService.getParentExamResults(parentId, {
          studentId: unauthorizedChildId.toString(),
        })
      ).rejects.toThrow('You are not authorized to view examination results for this student.');
    });

    it('returns empty results list and zero metrics when no published results exist', async () => {
      const parentId = new mongoose.Types.ObjectId().toString();
      const childId = new mongoose.Types.ObjectId();

      vi.mocked(mockStudentRepo.findByParentId).mockResolvedValueOnce([
        {
          _id: childId,
          fullName: 'Sarah Jenkins',
          studentId: 'STU-1001',
          grade: 'Grade 5',
          section: 'A',
          status: 'ACTIVE',
          parentId,
        } as any,
      ]);

      vi.spyOn(ExamMarksModel, 'find').mockReturnValueOnce({
        sort: vi.fn().mockReturnValueOnce({
          lean: vi.fn().mockReturnValueOnce({
            exec: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const result = await parentService.getParentExamResults(parentId, {
        academicYear: '2026-2027',
      });

      expect(result.exams).toHaveLength(0);
      expect(result.summary.totalExams).toBe(0);
      expect(result.summary.totalSubjectsPassed).toBe(0);
      expect(result.summary.totalSubjectsFailed).toBe(0);
    });
  });
});


