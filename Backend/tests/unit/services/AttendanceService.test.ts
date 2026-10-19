import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { AttendanceService } from '../../../src/modules/teacher/services/AttendanceService';
import { IAttendanceRepository } from '../../../src/modules/teacher/repositories/AttendanceRepository';
import {
  ValidationError,
  ForbiddenError,
  UnauthorizedError,
  ConflictError,
} from '../../../src/shared/domain/errors/AppError';

describe('AttendanceService (Unit Tests)', () => {
  let attendanceService: AttendanceService;
  let mockRepo: IAttendanceRepository;

  const validUserId = new mongoose.Types.ObjectId().toString();
  const validTeacherId = new mongoose.Types.ObjectId().toString();
  const student1Id = new mongoose.Types.ObjectId().toString();
  const student2Id = new mongoose.Types.ObjectId().toString();

  const mockTeacher = {
    _id: validTeacherId,
    userId: validUserId,
    fullName: 'Test Faculty',
    status: 'ACTIVE',
    assignedClasses: [
      {
        className: 'Grade 10',
        section: 'A',
        subject: 'Mathematics',
        academicYear: '2026-2027',
      },
    ],
  };

  const mockStudents = [
    {
      _id: new mongoose.Types.ObjectId(student1Id),
      studentId: 'STU-1001',
      fullName: 'Alice Smith',
      grade: 'Grade 10',
      section: 'A',
      rollNumber: '01',
      status: 'ACTIVE',
    },
    {
      _id: new mongoose.Types.ObjectId(student2Id),
      studentId: 'STU-1002',
      fullName: 'Bob Johnson',
      grade: 'Grade 10',
      section: 'A',
      rollNumber: '02',
      status: 'ACTIVE',
    },
  ];

  beforeEach(() => {
    mockRepo = {
      findTeacherByUserId: vi.fn().mockResolvedValue(mockTeacher),
      findUserById: vi.fn(),
      findStudentsBySection: vi.fn().mockResolvedValue(mockStudents),
      findAttendanceBySectionAndDate: vi.fn().mockResolvedValue([]),
      findSectionAcademicYear: vi.fn().mockResolvedValue('2026-2027'),
      saveAttendanceBatch: vi.fn().mockResolvedValue([]),
      updateAttendanceBatch: vi.fn().mockResolvedValue(undefined),
      findHistoryBySection: vi.fn().mockResolvedValue([]),
    };

    attendanceService = new AttendanceService(mockRepo);
  });

  describe('Authorization & Assignment Validation', () => {
    it('should throw ValidationError if className or section is missing', async () => {
      await expect(
        attendanceService.getSectionAttendance(validUserId, '', 'A', '2026-10-10')
      ).rejects.toThrow(ValidationError);

      await expect(
        attendanceService.getSectionAttendance(validUserId, 'Grade 10', '', '2026-10-10')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw UnauthorizedError if teacher profile is not found or inactive', async () => {
      vi.mocked(mockRepo.findTeacherByUserId).mockResolvedValue(null);

      await expect(
        attendanceService.getSectionAttendance(validUserId, 'Grade 10', 'A', '2026-10-10')
      ).rejects.toThrow(UnauthorizedError);

      vi.mocked(mockRepo.findTeacherByUserId).mockResolvedValue({
        ...mockTeacher,
        status: 'INACTIVE',
      } as any);

      await expect(
        attendanceService.getSectionAttendance(validUserId, 'Grade 10', 'A', '2026-10-10')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw ForbiddenError if teacher is not assigned to the requested class or section', async () => {
      await expect(
        attendanceService.getSectionAttendance(validUserId, 'Grade 9', 'A', '2026-10-10')
      ).rejects.toThrow(ForbiddenError);

      await expect(
        attendanceService.getSectionAttendance(validUserId, 'Grade 10', 'B', '2026-10-10')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Date Validation', () => {
    it('should throw ValidationError if date format is invalid', async () => {
      await expect(
        attendanceService.getSectionAttendance(validUserId, 'Grade 10', 'A', '10-10-2026')
      ).rejects.toThrow(ValidationError);

      await expect(
        attendanceService.getSectionAttendance(validUserId, 'Grade 10', 'A', 'invalid-date')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if date is in the future', async () => {
      await expect(
        attendanceService.getSectionAttendance(validUserId, 'Grade 10', 'A', '2099-12-31')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if calendar date does not exist (e.g. Feb 30, Apr 31)', async () => {
      await expect(
        attendanceService.getSectionAttendance(validUserId, 'Grade 10', 'A', '2026-02-30')
      ).rejects.toThrow(ValidationError);

      await expect(
        attendanceService.getSectionAttendance(validUserId, 'Grade 10', 'A', '2026-04-31')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getSectionAttendance', () => {
    it('should return register with enrolled students defaulted to PRESENT when not previously marked', async () => {
      const result = await attendanceService.getSectionAttendance(
        validUserId,
        'Grade 10',
        'A',
        '2026-10-10'
      );

      expect(result.className).toBe('Grade 10');
      expect(result.section).toBe('A');
      expect(result.isAlreadyMarked).toBe(false);
      expect(result.existingCount).toBe(0);
      expect(result.students.length).toBe(2);
      expect(result.students[0].status).toBe('PRESENT');
      expect(result.summary.total).toBe(2);
      expect(result.summary.present).toBe(2);
      expect(result.summary.absent).toBe(0);
    });

    it('should return register with existing statuses and isAlreadyMarked: true when previously marked', async () => {
      vi.mocked(mockRepo.findAttendanceBySectionAndDate).mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(),
          studentId: new mongoose.Types.ObjectId(student1Id),
          status: 'PRESENT',
          remarks: 'On time',
          date: '2026-10-10',
          markedBy: { fullName: 'Prof. Vance' },
        } as any,
        {
          _id: new mongoose.Types.ObjectId(),
          studentId: new mongoose.Types.ObjectId(student2Id),
          status: 'ABSENT',
          remarks: 'Sick leave',
          date: '2026-10-10',
          markedBy: { fullName: 'Prof. Vance' },
        } as any,
      ]);

      const result = await attendanceService.getSectionAttendance(
        validUserId,
        'Grade 10',
        'A',
        '2026-10-10'
      );

      expect(result.isAlreadyMarked).toBe(true);
      expect(result.existingCount).toBe(2);
      expect(result.students.find((s) => s.studentId === student1Id)?.status).toBe('PRESENT');
      expect(result.students.find((s) => s.studentId === student2Id)?.status).toBe('ABSENT');
      expect(result.summary.present).toBe(1);
      expect(result.summary.absent).toBe(1);
      expect(result.summary.percentage).toBe(50);
    });

    it('should resolve section academic year from SectionModel when teacher assignment has an older year', async () => {
      // Teacher assignment has 2025-2026, but section has 2026-2027
      vi.mocked(mockRepo.findTeacherByUserId).mockResolvedValue({
        ...mockTeacher,
        assignedClasses: [
          {
            className: 'Grade 10',
            section: 'A',
            subject: 'Mathematics',
            academicYear: '2025-2026',
          },
        ],
      } as any);

      vi.mocked(mockRepo.findSectionAcademicYear).mockResolvedValue('2026-2027');

      const result = await attendanceService.getSectionAttendance(
        validUserId,
        'Grade 10',
        'A',
        '2026-10-10'
      );

      expect(mockRepo.findSectionAcademicYear).toHaveBeenCalled();
      expect(mockRepo.findStudentsBySection).toHaveBeenCalledWith(
        'Grade 10',
        'A',
        '2026-2027'
      );
      expect(result.students.length).toBe(2);
    });
  });

  describe('saveSectionAttendance', () => {
    it('should throw ConflictError if attendance was already recorded for that date', async () => {
      vi.mocked(mockRepo.findAttendanceBySectionAndDate).mockResolvedValue([
        { _id: new mongoose.Types.ObjectId() } as any,
      ]);

      await expect(
        attendanceService.saveSectionAttendance(validUserId, {
          className: 'Grade 10',
          section: 'A',
          date: '2026-10-10',
          records: [{ studentId: student1Id, status: 'PRESENT' }],
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ValidationError if records array is empty', async () => {
      await expect(
        attendanceService.saveSectionAttendance(validUserId, {
          className: 'Grade 10',
          section: 'A',
          date: '2026-10-10',
          records: [],
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if any student ID is not enrolled in the section', async () => {
      const foreignStudentId = new mongoose.Types.ObjectId().toString();

      await expect(
        attendanceService.saveSectionAttendance(validUserId, {
          className: 'Grade 10',
          section: 'A',
          date: '2026-10-10',
          records: [
            { studentId: student1Id, status: 'PRESENT' },
            { studentId: foreignStudentId, status: 'PRESENT' },
          ],
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if duplicate student IDs are present in submission', async () => {
      await expect(
        attendanceService.saveSectionAttendance(validUserId, {
          className: 'Grade 10',
          section: 'A',
          date: '2026-10-10',
          records: [
            { studentId: student1Id, status: 'PRESENT' },
            { studentId: student1Id, status: 'ABSENT' },
          ],
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should successfully save batch and return updated register', async () => {
      const result = await attendanceService.saveSectionAttendance(validUserId, {
        className: 'Grade 10',
        section: 'A',
        date: '2026-10-10',
        records: [
          { studentId: student1Id, status: 'PRESENT', remarks: 'Good' },
          { studentId: student2Id, status: 'LATE', remarks: 'Bus delay' },
        ],
      });

      expect(mockRepo.saveAttendanceBatch).toHaveBeenCalledTimes(1);
      expect(result.className).toBe('Grade 10');
      expect(result.section).toBe('A');
    });
  });

  describe('updateSectionAttendance', () => {
    it('should successfully call updateAttendanceBatch and return register', async () => {
      const result = await attendanceService.updateSectionAttendance(validUserId, {
        className: 'Grade 10',
        section: 'A',
        date: '2026-10-10',
        records: [
          { studentId: student1Id, status: 'PRESENT' },
          { studentId: student2Id, status: 'ABSENT', remarks: 'Informed' },
        ],
      });

      expect(mockRepo.updateAttendanceBatch).toHaveBeenCalledTimes(1);
      expect(result.className).toBe('Grade 10');
    });
  });

  describe('getSectionAttendanceHistory', () => {
    it('should return aggregated history entries', async () => {
      vi.mocked(mockRepo.findHistoryBySection).mockResolvedValue([
        {
          date: '2026-10-10',
          totalStudents: 2,
          present: 2,
          absent: 0,
          late: 0,
          percentage: 100,
          updatedAt: new Date(),
          markedByName: 'Prof. Vance',
        },
      ]);

      const history = await attendanceService.getSectionAttendanceHistory(
        validUserId,
        'Grade 10',
        'A'
      );

      expect(history.length).toBe(1);
      expect(history[0].percentage).toBe(100);
      expect(history[0].date).toBe('2026-10-10');
    });
  });
});
