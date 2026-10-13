import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { TimetableService } from '../../../src/modules/admin/services/TimetableService';
import { ITimetableRepository } from '../../../src/modules/admin/repositories/TimetableRepository';
import { IClassRepository } from '../../../src/modules/admin/repositories/ClassRepository';
import { ITeacherRepository } from '../../../src/modules/admin/repositories/TeacherRepository';
import {
  ValidationError,
  ConflictError,
  NotFoundError,
} from '../../../src/shared/domain/errors/AppError';

describe('TimetableService Unit Tests', () => {
  let service: TimetableService;
  let mockTimetableRepo: ITimetableRepository;
  let mockClassRepo: IClassRepository;
  let mockTeacherRepo: ITeacherRepository;

  beforeEach(() => {
    mockTimetableRepo = {
      findById: vi.fn(),
      findByFilter: vi.fn(),
      findSectionOverlaps: vi.fn().mockResolvedValue([]),
      findTeacherOverlaps: vi.fn().mockResolvedValue([]),
      findRoomOverlaps: vi.fn().mockResolvedValue([]),
      findByTeacherId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockClassRepo = {
      findById: vi.fn(),
      findClassById: vi.fn(),
      findByNameAndYear: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
      findSectionById: vi.fn(),
      findSectionsByClassId: vi.fn(),
      createSection: vi.fn(),
      updateSection: vi.fn(),
      updateSectionStatus: vi.fn(),
      deleteSection: vi.fn(),
      countTotalClasses: vi.fn(),
      countTotalSections: vi.fn(),
      sumCapacity: vi.fn(),
    } as any;

    mockTeacherRepo = {
      findById: vi.fn(),
      findTeacherById: vi.fn(),
      findByUserId: vi.fn(),
      findByEmail: vi.fn(),
      findByEmployeeId: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
      countTotalTeachers: vi.fn(),
      countActiveTeachers: vi.fn(),
      countInactiveTeachers: vi.fn(),
      addAssignedClass: vi.fn(),
      updateAssignedClass: vi.fn(),
      removeAssignedClass: vi.fn(),
      findAllAssignedClasses: vi.fn(),
    };

    service = new TimetableService(mockTimetableRepo, mockClassRepo, mockTeacherRepo);
  });

  describe('Time Helper Methods', () => {
    it('should correctly convert HH:mm time to minutes from midnight', () => {
      expect(service.timeToMinutes('00:00')).toBe(0);
      expect(service.timeToMinutes('09:00')).toBe(540);
      expect(service.timeToMinutes('09:45')).toBe(585);
      expect(service.timeToMinutes('14:30')).toBe(870);
      expect(service.timeToMinutes('23:59')).toBe(1439);
    });

    it('should normalize single-digit hour time strings', () => {
      expect(service.normalizeTime('9:00')).toBe('09:00');
      expect(service.normalizeTime('09:45')).toBe('09:45');
      expect(service.normalizeTime(' 8:30 ')).toBe('08:30');
    });

    it('should format 24h time to 12h representation', () => {
      expect(service.formatTime12Hour('09:00')).toBe('9:00 AM');
      expect(service.formatTime12Hour('12:00')).toBe('12:00 PM');
      expect(service.formatTime12Hour('13:30')).toBe('1:30 PM');
      expect(service.formatTime12Hour('00:15')).toBe('12:15 AM');
    });
  });

  describe('createPeriod', () => {
    const validClassId = new mongoose.Types.ObjectId().toString();
    const validSectionId = new mongoose.Types.ObjectId();
    const validTeacherId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
      vi.mocked(mockClassRepo.findClassById).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(validClassId),
        name: 'Grade 8',
        academicYear: '2026-2027',
      } as any);

      vi.mocked(mockClassRepo.findSectionsByClassId).mockResolvedValue([
        {
          _id: validSectionId,
          name: 'A',
          roomNumber: 'Room 201',
          academicYear: '2026-2027',
        } as any,
      ]);

      vi.mocked(mockTeacherRepo.findTeacherById).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(validTeacherId),
        fullName: 'Prof. David Miller',
        status: 'ACTIVE',
      } as any);

      vi.mocked(mockTimetableRepo.create).mockImplementation(async (data) => ({
        _id: new mongoose.Types.ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      } as any));
    });

    it('should successfully create a valid timetable period and inherit room from section', async () => {
      const result = await service.createPeriod({
        academicYear: '2026-2027',
        classId: validClassId,
        section: 'A',
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '09:45',
        subject: 'Mathematics',
        teacherId: validTeacherId,
      });

      expect(result.className).toBe('Grade 8');
      expect(result.section).toBe('A');
      expect(result.subject).toBe('Mathematics');
      expect(result.teacherName).toBe('Prof. David Miller');
      expect(result.roomNumber).toBe('Room 201'); // Inherited from section
      expect(result.formattedTime).toBe('9:00 AM - 9:45 AM');
      expect(mockTimetableRepo.create).toHaveBeenCalled();
    });

    it('should throw ValidationError if end time is equal to or earlier than start time', async () => {
      await expect(
        service.createPeriod({
          academicYear: '2026-2027',
          classId: validClassId,
          section: 'A',
          dayOfWeek: 'MONDAY',
          startTime: '10:00',
          endTime: '09:30',
          subject: 'Mathematics',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        service.createPeriod({
          academicYear: '2026-2027',
          classId: validClassId,
          section: 'A',
          dayOfWeek: 'MONDAY',
          startTime: '10:00',
          endTime: '10:00',
          subject: 'Mathematics',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if time format is invalid', async () => {
      await expect(
        service.createPeriod({
          academicYear: '2026-2027',
          classId: validClassId,
          section: 'A',
          dayOfWeek: 'MONDAY',
          startTime: '99:00',
          endTime: '10:00',
          subject: 'Mathematics',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid day of week', async () => {
      await expect(
        service.createPeriod({
          academicYear: '2026-2027',
          classId: validClassId,
          section: 'A',
          dayOfWeek: 'FUNDAY' as any,
          startTime: '09:00',
          endTime: '09:45',
          subject: 'Mathematics',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if parent class does not exist', async () => {
      vi.mocked(mockClassRepo.findClassById).mockResolvedValue(null);

      await expect(
        service.createPeriod({
          academicYear: '2026-2027',
          classId: 'non-existent-class',
          section: 'A',
          dayOfWeek: 'MONDAY',
          startTime: '09:00',
          endTime: '09:45',
          subject: 'Mathematics',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if section does not belong to parent class', async () => {
      await expect(
        service.createPeriod({
          academicYear: '2026-2027',
          classId: validClassId,
          section: 'Z', // Not in mockSections
          dayOfWeek: 'MONDAY',
          startTime: '09:00',
          endTime: '09:45',
          subject: 'Mathematics',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if assigning an inactive teacher', async () => {
      vi.mocked(mockTeacherRepo.findTeacherById).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(validTeacherId),
        fullName: 'Inactive Teacher',
        status: 'INACTIVE',
      } as any);

      await expect(
        service.createPeriod({
          academicYear: '2026-2027',
          classId: validClassId,
          section: 'A',
          dayOfWeek: 'MONDAY',
          startTime: '09:00',
          endTime: '09:45',
          subject: 'Mathematics',
          teacherId: validTeacherId,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError if section has overlapping period', async () => {
      vi.mocked(mockTimetableRepo.findSectionOverlaps).mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(),
          className: 'Grade 8',
          section: 'A',
          subject: 'Physics',
          startTime: '09:15',
          endTime: '10:00',
        } as any,
      ]);

      await expect(
        service.createPeriod({
          academicYear: '2026-2027',
          classId: validClassId,
          section: 'A',
          dayOfWeek: 'MONDAY',
          startTime: '09:00',
          endTime: '09:45',
          subject: 'Mathematics',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError if teacher has overlapping period in another class', async () => {
      vi.mocked(mockTimetableRepo.findTeacherOverlaps).mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(),
          className: 'Grade 10',
          section: 'B',
          subject: 'Advanced Math',
          startTime: '09:00',
          endTime: '09:45',
        } as any,
      ]);

      await expect(
        service.createPeriod({
          academicYear: '2026-2027',
          classId: validClassId,
          section: 'A',
          dayOfWeek: 'MONDAY',
          startTime: '09:00',
          endTime: '09:45',
          subject: 'Mathematics',
          teacherId: validTeacherId,
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError if room is already booked by another class', async () => {
      vi.mocked(mockTimetableRepo.findRoomOverlaps).mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(),
          className: 'Grade 9',
          section: 'C',
          subject: 'Chemistry Lab',
          startTime: '09:00',
          endTime: '09:45',
        } as any,
      ]);

      await expect(
        service.createPeriod({
          academicYear: '2026-2027',
          classId: validClassId,
          section: 'A',
          dayOfWeek: 'MONDAY',
          startTime: '09:00',
          endTime: '09:45',
          subject: 'Mathematics',
          roomNumber: 'Room 201',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should allow adjacent periods without conflict', async () => {
      // Adjacent period ending at 09:45; new period starts at 09:45
      vi.mocked(mockTimetableRepo.findSectionOverlaps).mockResolvedValue([]);

      const result = await service.createPeriod({
        academicYear: '2026-2027',
        classId: validClassId,
        section: 'A',
        dayOfWeek: 'MONDAY',
        startTime: '09:45',
        endTime: '10:30',
        subject: 'English',
      });

      expect(result.subject).toBe('English');
      expect(result.startTime).toBe('09:45');
      expect(result.endTime).toBe('10:30');
    });
  });

  describe('updatePeriod', () => {
    const periodId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
      vi.mocked(mockTimetableRepo.findById).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(periodId),
        academicYear: '2026-2027',
        classId: new mongoose.Types.ObjectId(),
        className: 'Grade 8',
        sectionId: new mongoose.Types.ObjectId(),
        section: 'A',
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '09:45',
        subject: 'Mathematics',
        periodType: 'TEACHING',
      } as any);

      vi.mocked(mockTimetableRepo.update).mockImplementation(async (id, data) => ({
        _id: new mongoose.Types.ObjectId(id),
        ...data,
      } as any));
    });

    it('should update period successfully when no conflicts occur', async () => {
      const result = await service.updatePeriod(periodId, {
        subject: 'Applied Mathematics',
        startTime: '09:15',
        endTime: '10:00',
      });

      expect(result.subject).toBe('Applied Mathematics');
      expect(result.startTime).toBe('09:15');
      expect(result.endTime).toBe('10:00');
      expect(mockTimetableRepo.update).toHaveBeenCalled();
    });

    it('should throw NotFoundError if period to update does not exist', async () => {
      vi.mocked(mockTimetableRepo.findById).mockResolvedValue(null);

      await expect(
        service.updatePeriod('non-existent-period', {
          subject: 'New Subject',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError if updated time overlaps with another section period', async () => {
      vi.mocked(mockTimetableRepo.findSectionOverlaps).mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(),
          className: 'Grade 8',
          section: 'A',
          subject: 'Science',
          startTime: '10:00',
          endTime: '10:45',
        } as any,
      ]);

      await expect(
        service.updatePeriod(periodId, {
          startTime: '09:45',
          endTime: '10:30', // Overlaps with 10:00 - 10:45
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('deletePeriod', () => {
    it('should delete existing period successfully', async () => {
      const periodId = new mongoose.Types.ObjectId().toString();
      vi.mocked(mockTimetableRepo.findById).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(periodId),
      } as any);
      vi.mocked(mockTimetableRepo.delete).mockResolvedValue(true);

      await service.deletePeriod(periodId);

      expect(mockTimetableRepo.delete).toHaveBeenCalledWith(periodId);
    });

    it('should throw NotFoundError if period does not exist', async () => {
      vi.mocked(mockTimetableRepo.findById).mockResolvedValue(null);

      await expect(service.deletePeriod('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getPeriods & getTeacherSchedule', () => {
    it('should query periods by filter and format response', async () => {
      vi.mocked(mockTimetableRepo.findByFilter).mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(),
          academicYear: '2026-2027',
          classId: new mongoose.Types.ObjectId(),
          className: 'Grade 8',
          section: 'A',
          dayOfWeek: 'MONDAY',
          startTime: '09:00',
          endTime: '09:45',
          subject: 'Mathematics',
          periodType: 'TEACHING',
        } as any,
      ]);

      const list = await service.getPeriods({ className: 'Grade 8' });

      expect(list).toHaveLength(1);
      expect(list[0].className).toBe('Grade 8');
      expect(list[0].formattedTime).toBe('9:00 AM - 9:45 AM');
    });

    it('should query teacher schedule by teacherId', async () => {
      const teacherId = new mongoose.Types.ObjectId().toString();
      vi.mocked(mockTimetableRepo.findByTeacherId).mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(),
          academicYear: '2026-2027',
          classId: new mongoose.Types.ObjectId(),
          className: 'Grade 8',
          section: 'A',
          dayOfWeek: 'MONDAY',
          startTime: '09:00',
          endTime: '09:45',
          subject: 'Mathematics',
          teacherId: new mongoose.Types.ObjectId(teacherId),
          periodType: 'TEACHING',
        } as any,
      ]);

      const schedule = await service.getTeacherSchedule(teacherId);

      expect(schedule).toHaveLength(1);
      expect(schedule[0].subject).toBe('Mathematics');
      expect(schedule[0].teacherId).toBe(teacherId);
    });
  });
});
