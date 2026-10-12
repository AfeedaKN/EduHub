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
  });
});
