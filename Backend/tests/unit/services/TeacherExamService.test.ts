import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { TeacherExamService } from '../../../src/modules/teacher/services/TeacherExamService';
import { ITeacherExamRepository } from '../../../src/modules/teacher/repositories/TeacherExamRepository';
import {
  ValidationError,
  ForbiddenError,
  UnauthorizedError,
  NotFoundError,
} from '../../../src/shared/domain/errors/AppError';

describe('TeacherExamService (Unit Tests)', () => {
  let service: TeacherExamService;
  let mockRepo: ITeacherExamRepository;

  const validUserId = new mongoose.Types.ObjectId().toString();
  const validTeacherId = new mongoose.Types.ObjectId();
  const exam1Id = new mongoose.Types.ObjectId();
  const schedule1Id = new mongoose.Types.ObjectId();
  const schedule2Id = new mongoose.Types.ObjectId();
  const student1Id = new mongoose.Types.ObjectId();
  const student2Id = new mongoose.Types.ObjectId();

  const mockTeacher: any = {
    _id: validTeacherId,
    userId: new mongoose.Types.ObjectId(validUserId),
    fullName: 'Dr. Jane Smith',
    status: 'ACTIVE',
    assignedClasses: [
      {
        className: 'Grade 10',
        section: 'A',
        subject: 'Mathematics',
        academicYear: '2026-2027',
      },
      {
        className: 'Grade 9',
        section: 'B',
        subject: 'Physics',
        academicYear: '2026-2027',
      },
    ],
  };

  const mockExam: any = {
    _id: exam1Id,
    name: 'Mid-Term Examination 2026',
    examType: 'MID_TERM',
    academicYear: '2026-2027',
    startDate: new Date('2026-11-01'),
    endDate: new Date('2026-11-15'),
    applicableClasses: [{ classId: new mongoose.Types.ObjectId(), className: 'Grade 10' }],
    status: 'SCHEDULED',
  };

  const mockSchedule1: any = {
    _id: schedule1Id,
    examId: exam1Id,
    academicYear: '2026-2027',
    classId: new mongoose.Types.ObjectId(),
    className: 'Grade 10',
    section: 'A',
    subject: 'Mathematics',
    examDate: new Date('2026-11-05'),
    startTime: '09:30',
    endTime: '12:30',
    maxMarks: 100,
    passingMarks: 40,
    roomNumber: 'Room 101',
    notes: 'No calculators allowed',
  };

  const mockSchedule2: any = {
    _id: schedule2Id,
    examId: exam1Id,
    academicYear: '2026-2027',
    classId: new mongoose.Types.ObjectId(),
    className: 'Grade 9',
    section: 'B',
    subject: 'Physics',
    examDate: new Date('2026-11-08'),
    startTime: '10:00',
    endTime: '13:00',
    maxMarks: 80,
    passingMarks: 32,
    roomNumber: 'Lab 2',
  };

  const mockStudents: any[] = [
    {
      _id: student1Id,
      studentId: 'STU-1001',
      fullName: 'Alice Walker',
      grade: 'Grade 10',
      section: 'A',
      rollNumber: '01',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    },
    {
      _id: student2Id,
      studentId: 'STU-1002',
      fullName: 'Bob Davis',
      grade: 'Grade 10',
      section: 'A',
      rollNumber: '02',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    },
  ];

  beforeEach(() => {
    mockRepo = {
      findTeacherByUserId: vi.fn().mockResolvedValue(mockTeacher),
      findExamById: vi.fn().mockResolvedValue(mockExam),
      findExamsByIds: vi.fn().mockResolvedValue([mockExam]),
      findScheduleById: vi.fn().mockResolvedValue(mockSchedule1),
      findSchedulesForTeacher: vi.fn().mockResolvedValue([mockSchedule1, mockSchedule2]),
      findStudentsBySection: vi.fn().mockResolvedValue(mockStudents),
      countStudentsBySection: vi.fn().mockResolvedValue(2),
      findMarksByScheduleId: vi.fn().mockResolvedValue(null),
      findMarksByScheduleIds: vi.fn().mockResolvedValue(new Map()),
      upsertMarks: vi.fn().mockImplementation((_schId, data) => Promise.resolve(data)),
    };

    service = new TeacherExamService(mockRepo);
  });

  describe('Authorization & Teacher Access', () => {
    it('throws UnauthorizedError if teacher account is inactive or not found', async () => {
      vi.mocked(mockRepo.findTeacherByUserId).mockResolvedValueOnce(null);

      await expect(
        service.getScheduleMarks(validUserId, schedule1Id.toString())
      ).rejects.toThrow(UnauthorizedError);
    });

    it('throws NotFoundError if schedule does not exist', async () => {
      vi.mocked(mockRepo.findScheduleById).mockResolvedValueOnce(null);

      await expect(
        service.getScheduleMarks(validUserId, schedule1Id.toString())
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError if teacher is not assigned to schedule class, section, and subject', async () => {
      const unauthorizedSchedule: any = {
        _id: new mongoose.Types.ObjectId(),
        examId: exam1Id,
        className: 'Grade 12',
        section: 'C',
        subject: 'History',
        academicYear: '2026-2027',
        examDate: new Date('2026-11-10'),
        startTime: '09:00',
        endTime: '12:00',
        maxMarks: 100,
        passingMarks: 40,
      };
      vi.mocked(mockRepo.findScheduleById).mockResolvedValueOnce(unauthorizedSchedule);

      await expect(
        service.getScheduleMarks(validUserId, unauthorizedSchedule._id.toString())
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getTeacherExams', () => {
    it('returns authorized exam schedules with accurate summary metrics', async () => {
      const result = await service.getTeacherExams(validUserId, {});

      expect(result.summary.assignedExams).toBe(1);
      expect(result.summary.upcomingExams).toBe(1);
      expect(result.summary.marksPending).toBe(1);
      expect(result.summary.submittedForReview).toBe(0);
      expect(result.schedules).toHaveLength(2);

      const sch1 = result.schedules[0];
      expect(sch1.examName).toBe('Mid-Term Examination 2026');
      expect(sch1.className).toBe('Grade 10');
      expect(sch1.section).toBe('A');
      expect(sch1.subject).toBe('Mathematics');
      expect(sch1.maxMarks).toBe(100);
      expect(sch1.marksStatus).toBe('PENDING');
    });

    it('returns empty list and zeros when teacher has no assigned classes', async () => {
      vi.mocked(mockRepo.findTeacherByUserId).mockResolvedValueOnce({
        ...mockTeacher,
        assignedClasses: [],
      });
      vi.mocked(mockRepo.findSchedulesForTeacher).mockResolvedValueOnce([]);

      const result = await service.getTeacherExams(validUserId, {});
      expect(result.summary.assignedExams).toBe(0);
      expect(result.schedules).toHaveLength(0);
    });

    it('filters by examType and search query correctly', async () => {
      const result = await service.getTeacherExams(validUserId, {
        examType: 'MID_TERM',
        search: 'Math',
      });

      expect(result.schedules).toHaveLength(1);
      expect(result.schedules[0].subject).toBe('Mathematics');
    });
  });

  describe('getScheduleMarks', () => {
    it('returns official student roster and merged marks data with editable status', async () => {
      const result = await service.getScheduleMarks(validUserId, schedule1Id.toString());

      expect(result.isReadOnly).toBe(false);
      expect(result.schedule.id).toBe(schedule1Id.toString());
      expect(result.students).toHaveLength(2);
      expect(result.students[0].studentName).toBe('Alice Walker');
      expect(result.students[0].admissionNumber).toBe('STU-1001');
      expect(result.students[0].marksObtained).toBeNull();
      expect(result.students[0].isAbsent).toBe(false);
      expect(result.summary.totalStudents).toBe(2);
      expect(result.summary.enteredCount).toBe(0);
      expect(result.summary.remainingCount).toBe(2);
    });

    it('marks schedule as read-only when submission status is SUBMITTED', async () => {
      const mockMarksDoc: any = {
        status: 'SUBMITTED',
        submittedAt: new Date('2026-11-06'),
        submittedByName: 'Dr. Jane Smith',
        students: [
          {
            studentId: student1Id,
            studentName: 'Alice Walker',
            admissionNumber: 'STU-1001',
            marksObtained: 85,
            isAbsent: false,
          },
          {
            studentId: student2Id,
            studentName: 'Bob Davis',
            admissionNumber: 'STU-1002',
            marksObtained: null,
            isAbsent: true,
          },
        ],
        totalStudents: 2,
        enteredCount: 2,
      };
      vi.mocked(mockRepo.findMarksByScheduleId).mockResolvedValueOnce(mockMarksDoc);

      const result = await service.getScheduleMarks(validUserId, schedule1Id.toString());
      expect(result.isReadOnly).toBe(true);
      expect(result.schedule.marksStatus).toBe('SUBMITTED');
      expect(result.students[0].marksObtained).toBe(85);
      expect(result.students[1].isAbsent).toBe(true);
      expect(result.students[1].marksObtained).toBeNull();
      expect(result.summary.enteredCount).toBe(2);
      expect(result.summary.remainingCount).toBe(0);
    });
  });

  describe('saveDraftMarks', () => {
    it('successfully saves draft marks and preserves absent state without converting to zero', async () => {
      const payload = {
        records: [
          {
            studentId: student1Id.toString(),
            marksObtained: 92,
            isAbsent: false,
            remarks: 'Superb clarity in problem solving',
          },
          {
            studentId: student2Id.toString(),
            marksObtained: null,
            isAbsent: true,
            remarks: 'Medical leave',
          },
        ],
      };

      await service.saveDraftMarks(validUserId, schedule1Id.toString(), payload);

      expect(mockRepo.upsertMarks).toHaveBeenCalledWith(
        schedule1Id.toString(),
        expect.objectContaining({
          status: 'DRAFT',
          totalStudents: 2,
          enteredCount: 2,
          students: expect.arrayContaining([
            expect.objectContaining({
              studentName: 'Alice Walker',
              marksObtained: 92,
              isAbsent: false,
            }),
            expect.objectContaining({
              studentName: 'Bob Davis',
              marksObtained: null,
              isAbsent: true,
            }),
          ]),
        })
      );
    });

    it('rejects marks exceeding maximum marks with ValidationError', async () => {
      const invalidPayload = {
        records: [
          {
            studentId: student1Id.toString(),
            marksObtained: 105, // maxMarks is 100!
            isAbsent: false,
          },
        ],
      };

      await expect(
        service.saveDraftMarks(validUserId, schedule1Id.toString(), invalidPayload)
      ).rejects.toThrow(ValidationError);
    });

    it('rejects duplicate student entries in payload with ValidationError', async () => {
      const duplicatePayload = {
        records: [
          {
            studentId: student1Id.toString(),
            marksObtained: 80,
          },
          {
            studentId: student1Id.toString(),
            marksObtained: 85,
          },
        ],
      };

      await expect(
        service.saveDraftMarks(validUserId, schedule1Id.toString(), duplicatePayload)
      ).rejects.toThrow(ValidationError);
    });

    it('rejects non-enrolled students with ValidationError', async () => {
      const strangerId = new mongoose.Types.ObjectId().toString();
      const strangerPayload = {
        records: [
          {
            studentId: strangerId,
            marksObtained: 80,
          },
        ],
      };

      await expect(
        service.saveDraftMarks(validUserId, schedule1Id.toString(), strangerPayload)
      ).rejects.toThrow(ValidationError);
    });

    it('rejects modifications when marks are already submitted', async () => {
      vi.mocked(mockRepo.findMarksByScheduleId).mockResolvedValueOnce({
        status: 'SUBMITTED',
      } as any);

      await expect(
        service.saveDraftMarks(validUserId, schedule1Id.toString(), { records: [] })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('submitMarks', () => {
    it('successfully submits completed marks register for Management review', async () => {
      const completePayload = {
        records: [
          {
            studentId: student1Id.toString(),
            marksObtained: 88,
            isAbsent: false,
            remarks: 'Strong work',
          },
          {
            studentId: student2Id.toString(),
            marksObtained: null,
            isAbsent: true,
            remarks: 'Excused absence',
          },
        ],
      };

      await service.submitMarks(validUserId, schedule1Id.toString(), completePayload);

      expect(mockRepo.upsertMarks).toHaveBeenCalledWith(
        schedule1Id.toString(),
        expect.objectContaining({
          status: 'SUBMITTED',
          submittedByName: 'Dr. Jane Smith',
          enteredCount: 2,
          totalStudents: 2,
        })
      );
    });

    it('rejects submission when any enrolled student has missing marks', async () => {
      const incompletePayload = {
        records: [
          {
            studentId: student1Id.toString(),
            marksObtained: 88,
            isAbsent: false,
          },
          // student2 is omitted!
        ],
      };

      await expect(
        service.submitMarks(validUserId, schedule1Id.toString(), incompletePayload)
      ).rejects.toThrow(ValidationError);
    });

    it('rejects submission when student has neither marks nor absent flag', async () => {
      const incompletePayload = {
        records: [
          {
            studentId: student1Id.toString(),
            marksObtained: 88,
            isAbsent: false,
          },
          {
            studentId: student2Id.toString(),
            marksObtained: null,
            isAbsent: false, // NOT marked absent and NO marks!
          },
        ],
      };

      await expect(
        service.submitMarks(validUserId, schedule1Id.toString(), incompletePayload)
      ).rejects.toThrow(ValidationError);
    });

    it('rejects resubmission when marks have already been submitted', async () => {
      vi.mocked(mockRepo.findMarksByScheduleId).mockResolvedValueOnce({
        status: 'SUBMITTED',
      } as any);

      await expect(
        service.submitMarks(validUserId, schedule1Id.toString(), { records: [] })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Management Access: getManagementScheduleMarks', () => {
    it('retrieves marks and student roster for Management review', async () => {
      const mockMarksDoc: any = {
        status: 'SUBMITTED',
        submittedAt: new Date('2026-11-06'),
        submittedByName: 'Dr. Jane Smith',
        students: [
          {
            studentId: student1Id,
            studentName: 'Alice Walker',
            admissionNumber: 'STU-1001',
            marksObtained: 85,
            isAbsent: false,
          },
          {
            studentId: student2Id,
            studentName: 'Bob Davis',
            admissionNumber: 'STU-1002',
            marksObtained: null,
            isAbsent: true,
          },
        ],
        totalStudents: 2,
        enteredCount: 2,
      };
      vi.mocked(mockRepo.findMarksByScheduleId).mockResolvedValueOnce(mockMarksDoc);

      const result = await service.getManagementScheduleMarks(schedule1Id.toString());

      expect(result.schedule.id).toBe(schedule1Id.toString());
      expect(result.isReadOnly).toBe(true);
      expect(result.schedule.marksStatus).toBe('SUBMITTED');
      expect(result.students).toHaveLength(2);
      expect(result.summary.enteredCount).toBe(2);
    });
  });

  describe('Draft & Revision Workflows: saveDraftMarks and submitMarks', () => {
    it('preserves previously entered draft marks for unedited students when updating draft marks', async () => {
      const existingMarksDoc: any = {
        status: 'DRAFT',
        students: [
          {
            studentId: student1Id,
            studentName: 'Alice Walker',
            marksObtained: 75,
            isAbsent: false,
            remarks: 'Good effort',
          },
          {
            studentId: student2Id,
            studentName: 'Bob Davis',
            marksObtained: 88,
            isAbsent: false,
            remarks: 'Excellent',
          },
        ],
        totalStudents: 2,
        enteredCount: 2,
      };

      vi.mocked(mockRepo.findMarksByScheduleId).mockResolvedValue(existingMarksDoc);

      // Partial payload: only editing student1
      const partialPayload = {
        records: [
          {
            studentId: student1Id.toString(),
            marksObtained: 82,
            isAbsent: false,
            remarks: 'Updated mark',
          },
        ],
      };

      await service.saveDraftMarks(validUserId, schedule1Id.toString(), partialPayload);

      expect(mockRepo.upsertMarks).toHaveBeenCalledWith(
        schedule1Id.toString(),
        expect.objectContaining({
          status: 'DRAFT',
          students: expect.arrayContaining([
            expect.objectContaining({
              studentId: student1Id,
              marksObtained: 82,
              remarks: 'Updated mark',
            }),
            expect.objectContaining({
              studentId: student2Id,
              marksObtained: 88, // preserved from existingMap!
              remarks: 'Excellent',
            }),
          ]),
        })
      );
    });

    it('allows updating marks and retains RETURNED status when marks were RETURNED by Management', async () => {
      const returnedMarksDoc: any = {
        status: 'RETURNED',
        returnReason: 'Please recheck Alice Walker mark',
        students: [
          {
            studentId: student1Id,
            studentName: 'Alice Walker',
            marksObtained: 40,
            isAbsent: false,
            remarks: '',
          },
        ],
        totalStudents: 2,
        enteredCount: 1,
      };

      vi.mocked(mockRepo.findMarksByScheduleId).mockResolvedValue(returnedMarksDoc);

      const updatePayload = {
        records: [
          {
            studentId: student1Id.toString(),
            marksObtained: 45,
            isAbsent: false,
            remarks: 'Rechecked and corrected',
          },
        ],
      };

      await service.saveDraftMarks(validUserId, schedule1Id.toString(), updatePayload);

      expect(mockRepo.upsertMarks).toHaveBeenCalledWith(
        schedule1Id.toString(),
        expect.objectContaining({
          status: 'RETURNED',
          students: expect.arrayContaining([
            expect.objectContaining({
              studentId: student1Id,
              marksObtained: 45,
            }),
          ]),
        })
      );
    });

    it('allows resubmitting marks when status is RETURNED and transitions status back to SUBMITTED', async () => {
      const returnedMarksDoc: any = {
        status: 'RETURNED',
        students: [],
        totalStudents: 2,
        enteredCount: 0,
      };

      vi.mocked(mockRepo.findMarksByScheduleId).mockResolvedValue(returnedMarksDoc);

      const fullPayload = {
        records: [
          {
            studentId: student1Id.toString(),
            marksObtained: 85,
            isAbsent: false,
          },
          {
            studentId: student2Id.toString(),
            marksObtained: null,
            isAbsent: true,
            remarks: 'Absent with medical excuse',
          },
        ],
      };

      await service.submitMarks(validUserId, schedule1Id.toString(), fullPayload);

      expect(mockRepo.upsertMarks).toHaveBeenCalledWith(
        schedule1Id.toString(),
        expect.objectContaining({
          status: 'SUBMITTED',
        })
      );
    });
  });
});
