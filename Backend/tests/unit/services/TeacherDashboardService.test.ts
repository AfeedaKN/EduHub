import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { TeacherDashboardService } from '../../../src/modules/teacher/services/TeacherDashboardService';
import { ITeacherDashboardRepository } from '../../../src/modules/teacher/repositories/TeacherDashboardRepository';
import { NotFoundError } from '../../../src/shared/domain/errors/AppError';

describe('TeacherDashboardService Unit Tests', () => {
  let service: TeacherDashboardService;
  let mockRepo: ITeacherDashboardRepository;

  beforeEach(() => {
    mockRepo = {
      findTeacherByUserId: vi.fn(),
      findUserById: vi.fn(),
      countStudentsInClass: vi.fn(),
      findStudentsByClasses: vi.fn(),
      findTimetablePeriodsByTeacher: vi.fn(),
    };

    service = new TeacherDashboardService(mockRepo);
  });

  describe('getTeacherDashboard', () => {
    it('should aggregate real teacher data, assigned classes, and enrolled student counts', async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();
      const fakeTeacherId = new mongoose.Types.ObjectId();

      vi.mocked(mockRepo.findTeacherByUserId).mockResolvedValue({
        _id: fakeTeacherId,
        userId: new mongoose.Types.ObjectId(fakeUserId),
        employeeId: 'TCH-0012',
        fullName: 'Prof. Anjali Sharma',
        email: 'anjali@eduhub.school',
        phone: '+1 555-0144',
        department: 'Mathematics',
        designation: 'Senior Teacher',
        qualification: 'M.Sc. Mathematics',
        assignedClasses: [
          {
            className: 'Grade 8',
            section: 'A',
            subject: 'Mathematics',
          },
          {
            className: 'Grade 7',
            section: 'B',
            subject: 'Algebra',
          },
        ],
      } as any);

      vi.mocked(mockRepo.findUserById).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeUserId),
        fullName: 'Prof. Anjali Sharma',
        email: 'anjali@eduhub.school',
      } as any);

      vi.mocked(mockRepo.countStudentsInClass)
        .mockResolvedValueOnce(30) // Grade 8 - A
        .mockResolvedValueOnce(25); // Grade 7 - B

      vi.mocked(mockRepo.findTimetablePeriodsByTeacher).mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(),
          className: 'Grade 8',
          section: 'A',
          subject: 'Mathematics',
          startTime: '09:00',
          endTime: '09:45',
          roomNumber: 'Room 101',
        },
        {
          _id: new mongoose.Types.ObjectId(),
          className: 'Grade 7',
          section: 'B',
          subject: 'Algebra',
          startTime: '10:00',
          endTime: '10:45',
          roomNumber: 'Room 102',
        },
      ] as any);

      const result = await service.getTeacherDashboard(fakeUserId);

      expect(result.teacher.fullName).toBe('Prof. Anjali Sharma');
      expect(result.teacher.employeeId).toBe('TCH-0012');
      expect(result.teacher.department).toBe('Mathematics');
      expect(result.summaryStats.assignedClassesCount).toBe(2);
      expect(result.summaryStats.totalStudentsCount).toBe(55); // 30 + 25
      expect(result.summaryStats.todayClassesCount).toBe(2);
      expect(result.summaryStats.pendingAssignmentsCount).toBeNull(); // Coming soon

      expect(result.assignedClasses).toHaveLength(2);
      expect(result.assignedClasses[0].studentCount).toBe(30);
      expect(result.assignedClasses[1].studentCount).toBe(25);

      expect(result.todayTimetable).toHaveLength(2);
      expect(result.todayTimetable[0].className).toBe('Grade 8');
      expect(result.todayTimetable[0].section).toBe('A');
      expect(result.todayTimetable[0].subject).toBe('Mathematics');
      expect(result.todayTimetable[0].time).toBe('9:00 AM - 9:45 AM');
    });

    it('should throw NotFoundError if teacher profile and user do not exist', async () => {
      vi.mocked(mockRepo.findTeacherByUserId).mockResolvedValue(null);
      vi.mocked(mockRepo.findUserById).mockResolvedValue(null);

      await expect(service.getTeacherDashboard('fake-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getTeacherClasses & getTeacherStudents', () => {
    it('should return empty arrays gracefully if teacher has no assigned classes', async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();

      vi.mocked(mockRepo.findTeacherByUserId).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        assignedClasses: [],
      } as any);

      const classes = await service.getTeacherClasses(fakeUserId);
      const students = await service.getTeacherStudents(fakeUserId);

      expect(classes).toEqual([]);
      expect(students).toEqual([]);
    });

    it('should return mapped enrolled students with parent information', async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();
      const studentId1 = new mongoose.Types.ObjectId();
      const parentId1 = new mongoose.Types.ObjectId();

      vi.mocked(mockRepo.findTeacherByUserId).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        assignedClasses: [
          { className: 'Grade 8', section: 'A' },
          { className: 'Grade 7', section: 'B' },
        ],
      } as any);

      vi.mocked(mockRepo.findStudentsByClasses).mockResolvedValue([
        {
          _id: studentId1,
          fullName: 'Aarav Patel',
          studentId: 'STU-2026-0001',
          grade: 'Grade 8',
          section: 'A',
          rollNumber: '08',
          status: 'ACTIVE',
          academicYear: '2026-2027',
          parentId: {
            _id: parentId1,
            fullName: 'Rajesh Patel',
            phone: '+1 555-9012',
            email: 'rajesh@patel.com',
          },
        } as any,
      ]);

      const students = await service.getTeacherStudents(fakeUserId);

      expect(students).toHaveLength(1);
      expect(students[0].fullName).toBe('Aarav Patel');
      expect(students[0].studentId).toBe('STU-2026-0001');
      expect(students[0].grade).toBe('Grade 8');
      expect(students[0].section).toBe('A');
      expect(students[0].rollNumber).toBe('08');
      expect(students[0].parentName).toBe('Rajesh Patel');
      expect(students[0].parentPhone).toBe('+1 555-9012');
      expect(students[0].parentEmail).toBe('rajesh@patel.com');
      expect(mockRepo.findStudentsByClasses).toHaveBeenCalledWith(
        [
          { grade: 'Grade 8', section: 'A' },
          { grade: 'Grade 7', section: 'B' },
        ],
        undefined
      );
    });

    it('should pass search and class query options to repository', async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();

      vi.mocked(mockRepo.findTeacherByUserId).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        assignedClasses: [{ className: 'Grade 8', section: 'A' }],
      } as any);

      vi.mocked(mockRepo.findStudentsByClasses).mockResolvedValue([]);

      await service.getTeacherStudents(fakeUserId, {
        search: 'Aarav',
        className: 'Grade 8',
        section: 'A',
        status: 'ACTIVE',
      });

      expect(mockRepo.findStudentsByClasses).toHaveBeenCalledWith(
        [{ grade: 'Grade 8', section: 'A' }],
        {
          grade: 'Grade 8',
          section: 'A',
          status: 'ACTIVE',
          academicYear: undefined,
          search: 'Aarav',
        }
      );
    });
  });

  describe('getTeacherWeeklyTimetable', () => {
    it('should return teacher weekly schedule with formatted periods', async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();
      const fakeTeacherId = new mongoose.Types.ObjectId();

      vi.mocked(mockRepo.findTeacherByUserId).mockResolvedValue({
        _id: fakeTeacherId,
        fullName: 'Prof. Anjali Sharma',
        employeeId: 'TCH-0012',
        department: 'Mathematics',
      } as any);

      vi.mocked(mockRepo.findTimetablePeriodsByTeacher).mockResolvedValue([
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
          teacherName: 'Prof. Anjali Sharma',
          roomNumber: 'Room 201',
          periodType: 'TEACHING',
        },
      ] as any);

      const result = await service.getTeacherWeeklyTimetable(fakeUserId);

      expect(result.teacher.fullName).toBe('Prof. Anjali Sharma');
      expect(result.periods).toHaveLength(1);
      expect(result.periods[0].className).toBe('Grade 8');
      expect(result.periods[0].section).toBe('A');
      expect(result.periods[0].dayOfWeek).toBe('MONDAY');
      expect(result.periods[0].formattedTime).toBe('9:00 AM - 9:45 AM');
    });

    it('should throw NotFoundError if teacher profile is not found', async () => {
      vi.mocked(mockRepo.findTeacherByUserId).mockResolvedValue(null);

      await expect(service.getTeacherWeeklyTimetable('unknown-user')).rejects.toThrow(
        NotFoundError
      );
    });
  });
});

