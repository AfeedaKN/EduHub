import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { ExamService } from '../../../src/modules/admin/services/ExamService';
import { IExamRepository } from '../../../src/modules/admin/repositories/ExamRepository';
import { IClassRepository } from '../../../src/modules/admin/repositories/ClassRepository';
import { ITeacherRepository } from '../../../src/modules/admin/repositories/TeacherRepository';
import {
  ValidationError,
  ConflictError,
  NotFoundError,
} from '../../../src/shared/domain/errors/AppError';

describe('ExamService Unit Tests', () => {
  let service: ExamService;
  let mockExamRepo: IExamRepository;
  let mockClassRepo: IClassRepository;
  let mockTeacherRepo: ITeacherRepository;

  const validClassId1 = new mongoose.Types.ObjectId().toString();
  const validClassId2 = new mongoose.Types.ObjectId().toString();
  const validSectionId1 = new mongoose.Types.ObjectId().toString();
  const validExamId = new mongoose.Types.ObjectId().toString();
  const validScheduleId = new mongoose.Types.ObjectId().toString();

  const mockExamDoc: any = {
    _id: new mongoose.Types.ObjectId(validExamId),
    name: 'Mid-Term Examination 2026',
    examType: 'MID_TERM',
    academicYear: '2026-2027',
    applicableClasses: [
      {
        classId: new mongoose.Types.ObjectId(validClassId1),
        className: 'Grade 10',
      },
    ],
    startDate: new Date('2026-11-01T00:00:00.000Z'),
    endDate: new Date('2026-11-15T00:00:00.000Z'),
    description: 'First semester mid-term exams',
    status: 'SCHEDULED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockScheduleDoc: any = {
    _id: new mongoose.Types.ObjectId(validScheduleId),
    examId: new mongoose.Types.ObjectId(validExamId),
    academicYear: '2026-2027',
    classId: new mongoose.Types.ObjectId(validClassId1),
    className: 'Grade 10',
    sectionId: new mongoose.Types.ObjectId(validSectionId1),
    section: 'A',
    subject: 'Mathematics',
    examDate: new Date('2026-11-05T00:00:00.000Z'),
    startTime: '09:30',
    endTime: '12:30',
    maxMarks: 100,
    passingMarks: 40,
    roomNumber: 'Hall A',
    notes: 'Bring geometry set',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockExamRepo = {
      findExams: vi.fn().mockResolvedValue([mockExamDoc]),
      findExamById: vi.fn().mockResolvedValue(mockExamDoc),
      findExamByNameAndYear: vi.fn().mockResolvedValue(null),
      createExam: vi.fn().mockImplementation((data) =>
        Promise.resolve({
          ...mockExamDoc,
          ...data,
          _id: new mongoose.Types.ObjectId(),
        })
      ),
      updateExam: vi.fn().mockImplementation((id, data) =>
        Promise.resolve({
          ...mockExamDoc,
          ...data,
          _id: new mongoose.Types.ObjectId(id),
        })
      ),
      deleteExam: vi.fn().mockResolvedValue(true),
      getExamsSummary: vi.fn().mockResolvedValue({
        totalExams: 1,
        upcomingExams: 1,
        completedExams: 0,
        publishedResults: 0,
      }),
      countSchedulesForExam: vi.fn().mockResolvedValue(1),
      countSchedulesForExams: vi.fn().mockResolvedValue(new Map([[validExamId, 1]])),
      findSchedulesByExamId: vi.fn().mockResolvedValue([mockScheduleDoc]),
      findScheduleById: vi.fn().mockResolvedValue(mockScheduleDoc),
      createSchedule: vi.fn().mockImplementation((data) =>
        Promise.resolve({
          ...mockScheduleDoc,
          ...data,
          _id: new mongoose.Types.ObjectId(),
        })
      ),
      updateSchedule: vi.fn().mockImplementation((id, data) =>
        Promise.resolve({
          ...mockScheduleDoc,
          ...data,
          _id: new mongoose.Types.ObjectId(id),
        })
      ),
      deleteSchedule: vi.fn().mockResolvedValue(true),
      deleteSchedulesByExamId: vi.fn().mockResolvedValue(1),
      findSectionOverlaps: vi.fn().mockResolvedValue([]),
      findRoomOverlaps: vi.fn().mockResolvedValue([]),
      findDistinctSubjectsForClassSection: vi.fn().mockResolvedValue(['Mathematics', 'Science', 'English']),
    };

    mockClassRepo = {
      findClassById: vi.fn().mockImplementation((id: string) => {
        if (id === validClassId1) {
          return Promise.resolve({
            _id: new mongoose.Types.ObjectId(validClassId1),
            name: 'Grade 10',
            academicYear: '2026-2027',
            status: 'ACTIVE',
          });
        }
        if (id === validClassId2) {
          return Promise.resolve({
            _id: new mongoose.Types.ObjectId(validClassId2),
            name: 'Grade 9',
            academicYear: '2026-2027',
            status: 'ACTIVE',
          });
        }
        return Promise.resolve(null);
      }),
      findSectionsByClassId: vi.fn().mockImplementation((classId: string) => {
        if (classId === validClassId1) {
          return Promise.resolve([
            {
              _id: new mongoose.Types.ObjectId(validSectionId1),
              classId: new mongoose.Types.ObjectId(validClassId1),
              name: 'A',
              roomNumber: '101',
              status: 'ACTIVE',
            },
          ]);
        }
        return Promise.resolve([]);
      }),
    } as any;

    mockTeacherRepo = {} as any;

    service = new ExamService(mockExamRepo, mockClassRepo, mockTeacherRepo);
  });

  // ==========================================
  // Exam Creation & Listing Tests
  // ==========================================

  describe('Exam Creation & Management', () => {
    it('should create an exam successfully with valid details and resolve class names', async () => {
      const res = await service.createExam({
        name: 'Unit Test 1',
        examType: 'UNIT_TEST',
        academicYear: '2026-2027',
        applicableClassIds: [validClassId1],
        startDate: '2026-09-01',
        endDate: '2026-09-05',
        description: 'First quarterly unit test',
        status: 'SCHEDULED',
      });

      expect(res.name).toBe('Unit Test 1');
      expect(res.examType).toBe('UNIT_TEST');
      expect(res.applicableClasses).toHaveLength(1);
      expect(res.applicableClasses[0].className).toBe('Grade 10');
      expect(mockExamRepo.createExam).toHaveBeenCalled();
    });

    it('should throw ValidationError if exam name is empty', async () => {
      await expect(
        service.createExam({
          name: '',
          examType: 'UNIT_TEST',
          academicYear: '2026-2027',
          applicableClassIds: [validClassId1],
          startDate: '2026-09-01',
          endDate: '2026-09-05',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if end date is earlier than start date', async () => {
      try {
        await service.createExam({
          name: 'Unit Test 1',
          examType: 'UNIT_TEST',
          academicYear: '2026-2027',
          applicableClassIds: [validClassId1],
          startDate: '2026-09-10',
          endDate: '2026-09-05',
        });
        expect.unreachable('Should have thrown ValidationError');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ValidationError);
        expect(err.message).toContain('Exam end date cannot be earlier than start date');
      }
    });

    it('should throw ValidationError if date format is invalid', async () => {
      try {
        await service.createExam({
          name: 'Unit Test 1',
          examType: 'UNIT_TEST',
          academicYear: '2026-2027',
          applicableClassIds: [validClassId1],
          startDate: 'invalid-date',
          endDate: '2026-09-05',
        });
        expect.unreachable('Should have thrown ValidationError');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ValidationError);
        expect(err.message).toContain('Invalid start date format');
      }
    });

    it('should throw ConflictError if duplicate exam name in same academic year', async () => {
      (mockExamRepo.findExamByNameAndYear as any).mockResolvedValueOnce(mockExamDoc);

      await expect(
        service.createExam({
          name: 'Mid-Term Examination 2026',
          examType: 'MID_TERM',
          academicYear: '2026-2027',
          applicableClassIds: [validClassId1],
          startDate: '2026-11-01',
          endDate: '2026-11-15',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw NotFoundError if applicable class does not exist in Class repository', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(
        service.createExam({
          name: 'Unit Test 1',
          examType: 'UNIT_TEST',
          academicYear: '2026-2027',
          applicableClassIds: [nonExistentId],
          startDate: '2026-09-01',
          endDate: '2026-09-05',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should list exams with accurate schedule count', async () => {
      const exams = await service.getExams({ academicYear: '2026-2027' });
      expect(exams).toHaveLength(1);
      expect(exams[0].scheduledSubjectsCount).toBe(1);
    });

    it('should update an existing exam and reject duplicate names on update', async () => {
      (mockExamRepo.findExamByNameAndYear as any).mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        name: 'Annual Exam 2027',
      });

      await expect(
        service.updateExam(validExamId, {
          name: 'Annual Exam 2027',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should delete exam and associated schedules', async () => {
      await service.deleteExam(validExamId);
      expect(mockExamRepo.deleteSchedulesByExamId).toHaveBeenCalledWith(validExamId);
      expect(mockExamRepo.deleteExam).toHaveBeenCalledWith(validExamId);
    });
  });

  // ==========================================
  // Schedule Creation & Conflict Detection Tests
  // ==========================================

  describe('Subject-Wise Exam Scheduling & Conflict Checks', () => {
    it('should successfully schedule a subject exam with valid data', async () => {
      const schedule = await service.createSchedule(validExamId, {
        classId: validClassId1,
        section: 'A',
        subject: 'Mathematics',
        examDate: '2026-11-05',
        startTime: '09:30',
        endTime: '12:30',
        maxMarks: 100,
        passingMarks: 35,
        roomNumber: 'Hall A',
      });

      expect(schedule.subject).toBe('Mathematics');
      expect(schedule.maxMarks).toBe(100);
      expect(schedule.passingMarks).toBe(35);
      expect(schedule.roomNumber).toBe('Hall A');
      expect(mockExamRepo.createSchedule).toHaveBeenCalled();
    });

    it('should throw ValidationError if class is not applicable for this exam', async () => {
      await expect(
        service.createSchedule(validExamId, {
          classId: validClassId2, // Grade 9 is not in mockExamDoc applicableClasses
          section: 'A',
          subject: 'Mathematics',
          examDate: '2026-11-05',
          startTime: '09:30',
          endTime: '12:30',
          maxMarks: 100,
          passingMarks: 35,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if section does not exist in class', async () => {
      await expect(
        service.createSchedule(validExamId, {
          classId: validClassId1,
          section: 'Z', // Non-existent section
          subject: 'Mathematics',
          examDate: '2026-11-05',
          startTime: '09:30',
          endTime: '12:30',
          maxMarks: 100,
          passingMarks: 35,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if subject is not valid for this class and section', async () => {
      await expect(
        service.createSchedule(validExamId, {
          classId: validClassId1,
          section: 'A',
          subject: 'Astronomy & Astrophysics', // Not in ['Mathematics', 'Science', 'English']
          examDate: '2026-11-05',
          startTime: '09:30',
          endTime: '12:30',
          maxMarks: 100,
          passingMarks: 35,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if maxMarks is <= 0', async () => {
      await expect(
        service.createSchedule(validExamId, {
          classId: validClassId1,
          section: 'A',
          subject: 'Mathematics',
          examDate: '2026-11-05',
          startTime: '09:30',
          endTime: '12:30',
          maxMarks: 0,
          passingMarks: 0,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if passingMarks > maxMarks', async () => {
      await expect(
        service.createSchedule(validExamId, {
          classId: validClassId1,
          section: 'A',
          subject: 'Mathematics',
          examDate: '2026-11-05',
          startTime: '09:30',
          endTime: '12:30',
          maxMarks: 50,
          passingMarks: 60,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if endTime is not strictly after startTime', async () => {
      await expect(
        service.createSchedule(validExamId, {
          classId: validClassId1,
          section: 'A',
          subject: 'Mathematics',
          examDate: '2026-11-05',
          startTime: '10:00',
          endTime: '09:30',
          maxMarks: 100,
          passingMarks: 40,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if examDate is outside the exam window', async () => {
      await expect(
        service.createSchedule(validExamId, {
          classId: validClassId1,
          section: 'A',
          subject: 'Mathematics',
          examDate: '2026-12-01', // Exam is 2026-11-01 to 2026-11-15
          startTime: '09:30',
          endTime: '12:30',
          maxMarks: 100,
          passingMarks: 40,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError if class and section already has a conflicting subject at overlapping time', async () => {
      (mockExamRepo.findSectionOverlaps as any).mockResolvedValueOnce([
        {
          className: 'Grade 10',
          section: 'A',
          subject: 'Science',
          startTime: '09:00',
          endTime: '11:00',
        },
      ]);

      await expect(
        service.createSchedule(validExamId, {
          classId: validClassId1,
          section: 'A',
          subject: 'Mathematics',
          examDate: '2026-11-05',
          startTime: '10:00',
          endTime: '12:00',
          maxMarks: 100,
          passingMarks: 40,
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError if room is already booked by another exam at overlapping time', async () => {
      (mockExamRepo.findRoomOverlaps as any).mockResolvedValueOnce([
        {
          className: 'Grade 9',
          section: 'B',
          subject: 'English',
          startTime: '09:00',
          endTime: '11:00',
          roomNumber: 'Hall A',
        },
      ]);

      await expect(
        service.createSchedule(validExamId, {
          classId: validClassId1,
          section: 'A',
          subject: 'Mathematics',
          examDate: '2026-11-05',
          startTime: '10:00',
          endTime: '12:00',
          maxMarks: 100,
          passingMarks: 40,
          roomNumber: 'Hall A',
        })
      ).rejects.toThrow(ConflictError);
    });
  });
});
