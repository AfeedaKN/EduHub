import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { AdminAttendanceService } from '../../../src/modules/admin/services/AdminAttendanceService';
import { IAdminAttendanceRepository } from '../../../src/modules/admin/repositories/AdminAttendanceRepository';
import {
  ValidationError,
  NotFoundError,
} from '../../../src/shared/domain/errors/AppError';

describe('AdminAttendanceService Unit Tests', () => {
  let attendanceService: AdminAttendanceService;
  let mockRepo: IAdminAttendanceRepository;

  beforeEach(() => {
    mockRepo = {
      getSummary: vi.fn(),
      getDailyRegister: vi.fn(),
      getClassesOverview: vi.fn(),
      getSubmissionsMonitoring: vi.fn(),
      getMonthlyReport: vi.fn(),
      getLowAttendanceReport: vi.fn(),
      getStudentHistory: vi.fn(),
      correctAttendanceRecord: vi.fn(),
      createAttendanceRecord: vi.fn(),
      getSubjectWiseAttendanceGrid: vi.fn(),
      saveSubjectWiseAttendanceBatch: vi.fn(),
      getAttendanceFiltersMetadata: vi.fn(),
    };

    attendanceService = new AdminAttendanceService(mockRepo);
  });

  describe('Date validations', () => {
    it('should reject future dates with ValidationError', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const futureDateStr = tomorrow.toISOString().split('T')[0];

      await expect(attendanceService.getSummary(futureDateStr)).rejects.toThrow(
        ValidationError
      );
    });

    it('should reject invalid date format with ValidationError', async () => {
      await expect(attendanceService.getSummary('27-10-2026')).rejects.toThrow(
        ValidationError
      );
      await expect(attendanceService.getSummary('invalid-date')).rejects.toThrow(
        ValidationError
      );
    });

    it('should accept valid date string and call repository', async () => {
      vi.mocked(mockRepo.getSummary).mockResolvedValue({
        totalEnrolled: 120,
        totalMarked: 110,
        presentCount: 100,
        absentCount: 8,
        lateCount: 2,
        unmarkedCount: 10,
        attendancePercentage: 85,
        totalSections: 6,
        sectionsSubmitted: 5,
        submissionStatus: 'PARTIAL',
        date: '2026-10-20',
        academicYear: '2026-2027',
      });

      const res = await attendanceService.getSummary('2026-10-20');
      expect(res.totalEnrolled).toBe(120);
      expect(res.presentCount).toBe(100);
      expect(mockRepo.getSummary).toHaveBeenCalledWith('2026-10-20', undefined);
    });
  });

  describe('getDailyRegister', () => {
    it('should pass validated parameters and return register', async () => {
      vi.mocked(mockRepo.getDailyRegister).mockResolvedValue({
        records: [
          {
            studentId: 'stu-1',
            admissionNumber: 'ADM-001',
            rollNumber: '01',
            fullName: 'Jane Doe',
            className: 'Grade 8',
            section: 'A',
            academicYear: '2026-2027',
            status: 'PRESENT',
            date: '2026-10-20',
          },
        ],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
        summary: {
          totalEnrolled: 1,
          totalMarked: 1,
          present: 1,
          absent: 0,
          late: 0,
          unmarked: 0,
          percentage: 100,
        },
      });

      const res = await attendanceService.getDailyRegister({
        date: '2026-10-20',
        className: 'Grade 8',
        section: 'A',
      });

      expect(res.records.length).toBe(1);
      expect(res.records[0].fullName).toBe('Jane Doe');
      expect(mockRepo.getDailyRegister).toHaveBeenCalled();
    });
  });

  describe('getLowAttendanceReport', () => {
    it('should reject threshold below 1 or above 100', async () => {
      await expect(
        attendanceService.getLowAttendanceReport({ threshold: 0 })
      ).rejects.toThrow(ValidationError);

      await expect(
        attendanceService.getLowAttendanceReport({ threshold: 105 })
      ).rejects.toThrow(ValidationError);
    });

    it('should default threshold to 75 if not specified', async () => {
      vi.mocked(mockRepo.getLowAttendanceReport).mockResolvedValue([]);

      await attendanceService.getLowAttendanceReport({});
      expect(mockRepo.getLowAttendanceReport).toHaveBeenCalledWith(
        expect.objectContaining({ threshold: 75 })
      );
    });
  });

  describe('getStudentHistory', () => {
    it('should throw ValidationError if studentId is empty', async () => {
      await expect(attendanceService.getStudentHistory('')).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw NotFoundError if repository returns null', async () => {
      vi.mocked(mockRepo.getStudentHistory).mockResolvedValue(null);

      await expect(
        attendanceService.getStudentHistory('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });

    it('should return student history when student exists', async () => {
      vi.mocked(mockRepo.getStudentHistory).mockResolvedValue({
        student: {
          id: 'stu-1',
          fullName: 'Alice Smith',
          admissionNumber: 'ADM-101',
          rollNumber: '05',
          className: 'Grade 10',
          section: 'A',
          academicYear: '2026-2027',
        },
        summary: {
          totalSessions: 20,
          presentCount: 18,
          absentCount: 1,
          lateCount: 1,
          percentage: 95,
        },
        history: [],
      });

      const res = await attendanceService.getStudentHistory('stu-1');
      expect(res.student.fullName).toBe('Alice Smith');
      expect(res.summary.percentage).toBe(95);
    });
  });

  describe('correctAttendanceRecord', () => {
    it('should throw ValidationError if status is invalid', async () => {
      await expect(
        attendanceService.correctAttendanceRecord(
          'record-1',
          { status: 'INVALID_STATUS' as any, reason: 'Correction' },
          'admin-id'
        )
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if attendance record not found', async () => {
      vi.mocked(mockRepo.correctAttendanceRecord).mockResolvedValue(null);

      await expect(
        attendanceService.correctAttendanceRecord(
          'rec-999',
          { status: 'PRESENT', reason: 'Medical note provided' },
          'admin-id'
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should successfully update record with audit trail', async () => {
      const fakeRecordId = new mongoose.Types.ObjectId().toString();
      const fakeStudentId = new mongoose.Types.ObjectId().toString();

      vi.mocked(mockRepo.correctAttendanceRecord).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeRecordId),
        studentId: new mongoose.Types.ObjectId(fakeStudentId),
        className: 'Grade 8',
        section: 'A',
        date: '2026-10-20',
        status: 'PRESENT',
        remarks: '[Admin correction]: Verified parent excused letter',
        updatedAt: new Date(),
      } as any);

      const res = await attendanceService.correctAttendanceRecord(
        fakeRecordId,
        { status: 'PRESENT', reason: 'Verified parent excused letter' },
        'admin-user-id'
      );

      expect(res.status).toBe('PRESENT');
      expect(mockRepo.correctAttendanceRecord).toHaveBeenCalledWith(
        fakeRecordId,
        'PRESENT',
        'Verified parent excused letter',
        'admin-user-id'
      );
    });
  });

  describe('Subject-Wise Attendance Matrix', () => {
    it('should validate className and section', async () => {
      await expect(
        attendanceService.getSubjectWiseAttendanceGrid({
          className: '',
          section: 'A',
          date: '2026-10-27',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        attendanceService.getSubjectWiseAttendanceGrid({
          className: 'Grade 5',
          section: '',
          date: '2026-10-27',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should call repository with validated date', async () => {
      const mockResult: any = {
        academicYear: '2026-2027',
        className: 'Grade 5',
        section: 'A',
        date: '2026-10-27',
        dayName: 'Tuesday, 27 October 2026',
        totalStudents: 28,
        subjects: ['Mathematics', 'English', 'Science'],
        summary: {
          totalStudents: 28,
          presentAllSubjects: 21,
          absentAnySubject: 5,
          lateCount: 2,
          notMarkedCount: 0,
        },
        subjectSummaries: [],
        students: [],
        requiringAttention: [],
      };

      vi.mocked(mockRepo.getSubjectWiseAttendanceGrid).mockResolvedValue(mockResult);

      const res = await attendanceService.getSubjectWiseAttendanceGrid({
        className: 'Grade 5',
        section: 'A',
        date: '2026-10-27',
      });

      expect(res.totalStudents).toBe(28);
      expect(res.summary.presentAllSubjects).toBe(21);
      expect(mockRepo.getSubjectWiseAttendanceGrid).toHaveBeenCalledWith({
        className: 'Grade 5',
        section: 'A',
        date: '2026-10-27',
      });
    });

    it('should save batch records through repository', async () => {
      vi.mocked(mockRepo.saveSubjectWiseAttendanceBatch).mockResolvedValue();

      await attendanceService.saveSubjectWiseAttendanceBatch(
        {
          className: 'Grade 5',
          section: 'A',
          date: '2026-10-27',
          records: [
            {
              studentId: 'st-1',
              subjectName: 'Mathematics',
              status: 'PRESENT',
            },
          ],
        },
        'admin-1',
        'Administrator'
      );

      expect(mockRepo.saveSubjectWiseAttendanceBatch).toHaveBeenCalledWith(
        {
          className: 'Grade 5',
          section: 'A',
          date: '2026-10-27',
          records: [
            {
              studentId: 'st-1',
              subjectName: 'Mathematics',
              status: 'PRESENT',
            },
          ],
        },
        'admin-1',
        'Administrator'
      );
    });

    it('delegates getAttendanceFiltersMetadata to repository', async () => {
      const mockMeta = {
        academicYears: ['2026-2027', '2025-2026'],
        classes: [{ id: 'c-1', name: 'Grade 4', academicYear: '2026-2027', sections: ['A'], studentCount: 2 }],
        defaultAcademicYear: '2026-2027',
        defaultClass: 'Grade 4',
        defaultSection: 'A',
      };
      vi.mocked(mockRepo.getAttendanceFiltersMetadata).mockResolvedValue(mockMeta);

      const res = await attendanceService.getAttendanceFiltersMetadata();
      expect(res).toEqual(mockMeta);
      expect(mockRepo.getAttendanceFiltersMetadata).toHaveBeenCalled();
    });
  });
});

