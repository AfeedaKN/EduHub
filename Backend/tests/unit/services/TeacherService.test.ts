import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { TeacherService } from '../../../src/modules/admin/services/TeacherService';
import { ITeacherRepository } from '../../../src/modules/admin/repositories/TeacherRepository';
import { IPasswordService } from '../../../src/modules/auth/services/PasswordService';
import { UserRole, AccountStatus } from '../../../src/modules/auth/dtos/auth.dto';
import {
  ValidationError,
  ConflictError,
  NotFoundError,
} from '../../../src/shared/domain/errors/AppError';

describe('TeacherService Unit Tests', () => {
  let teacherService: TeacherService;
  let mockRepo: ITeacherRepository;
  let mockPasswordService: IPasswordService;

  beforeEach(() => {
    mockRepo = {
      createTeacher: vi.fn(),
      findTeacherById: vi.fn(),
      findTeacherByUserId: vi.fn(),
      findTeacherByEmail: vi.fn(),
      findTeacherByEmployeeId: vi.fn(),
      findAllTeachers: vi.fn(),
      updateTeacher: vi.fn(),
      deleteTeacher: vi.fn(),
      countTeachers: vi.fn(),
      getNextEmployeeSequence: vi.fn().mockResolvedValue(1),
      createUserForTeacher: vi.fn(),
      updateUserForTeacher: vi.fn(),
      findUserByEmail: vi.fn().mockResolvedValue(null),
      deleteUser: vi.fn(),
    };

    mockPasswordService = {
      hash: vi.fn().mockResolvedValue('hashed_secret_password_123'),
      compare: vi.fn().mockResolvedValue(true),
    };

    teacherService = new TeacherService(mockRepo, mockPasswordService);
  });

  describe('createTeacher', () => {
    it('should successfully create a teacher account and user record without returning password', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const fakeTeacherId = new mongoose.Types.ObjectId();

      vi.mocked(mockRepo.createUserForTeacher).mockResolvedValue({
        _id: fakeUserId,
        fullName: 'Dr. Robert Miller',
        email: 'robert.miller@eduhub.school',
        phone: '+1 555-0199',
        passwordHash: 'hashed_secret_password_123',
        role: UserRole.TEACHER,
        status: AccountStatus.ACTIVE,
      } as any);

      vi.mocked(mockRepo.createTeacher).mockResolvedValue({
        _id: fakeTeacherId,
        userId: fakeUserId,
        employeeId: 'TCH-0001',
        fullName: 'Dr. Robert Miller',
        email: 'robert.miller@eduhub.school',
        phone: '+1 555-0199',
        qualification: 'Ph.D. in Physics, B.Ed',
        designation: 'Senior Science Teacher',
        department: 'Science',
        status: 'ACTIVE',
        assignedClasses: [],
        joiningDate: new Date('2026-08-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await teacherService.createTeacher({
        fullName: 'Dr. Robert Miller',
        email: 'robert.miller@eduhub.school',
        phone: '+1 555-0199',
        password: 'SecureTeacherPassword123!',
        qualification: 'Ph.D. in Physics, B.Ed',
        designation: 'Senior Science Teacher',
        department: 'Science',
      });

      expect(result.id).toBe(fakeTeacherId.toString());
      expect(result.employeeId).toBe('TCH-0001');
      expect(result.fullName).toBe('Dr. Robert Miller');
      expect(result.email).toBe('robert.miller@eduhub.school');
      expect(result.status).toBe('ACTIVE');

      // Security verify: password and passwordHash MUST NOT be exposed in result
      expect((result as any).password).toBeUndefined();
      expect((result as any).passwordHash).toBeUndefined();

      // Ensure password was hashed before storage
      expect(mockPasswordService.hash).toHaveBeenCalledWith('SecureTeacherPassword123!');
      expect(mockRepo.createUserForTeacher).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.TEACHER,
          passwordHash: 'hashed_secret_password_123',
          status: AccountStatus.ACTIVE,
        })
      );
    });

    it('should throw ConflictError if user email already exists', async () => {
      vi.mocked(mockRepo.findUserByEmail).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        email: 'taken@eduhub.school',
      } as any);

      await expect(
        teacherService.createTeacher({
          fullName: 'Jane Doe',
          email: 'taken@eduhub.school',
          phone: '+1 555-0123',
          password: 'Password123!',
        })
      ).rejects.toThrow(ConflictError);

      expect(mockRepo.createUserForTeacher).not.toHaveBeenCalled();
      expect(mockRepo.createTeacher).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if password is less than 6 characters', async () => {
      await expect(
        teacherService.createTeacher({
          fullName: 'Jane Doe',
          email: 'jane@eduhub.school',
          phone: '+1 555-0123',
          password: '123',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if email is missing or invalid', async () => {
      await expect(
        teacherService.createTeacher({
          fullName: 'Jane Doe',
          email: 'invalid-email-format',
          phone: '+1 555-0123',
          password: 'Password123!',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError if provided custom staff ID is already taken', async () => {
      vi.mocked(mockRepo.findTeacherByEmployeeId).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        employeeId: 'TCH-9999',
      } as any);

      await expect(
        teacherService.createTeacher({
          fullName: 'Jane Doe',
          email: 'jane@eduhub.school',
          phone: '+1 555-0123',
          password: 'Password123!',
          employeeId: 'TCH-9999',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('updateTeacher', () => {
    it('should update teacher details and sync User model', async () => {
      const fakeTeacherId = new mongoose.Types.ObjectId().toString();
      const fakeUserId = new mongoose.Types.ObjectId();

      vi.mocked(mockRepo.findTeacherById).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeTeacherId),
        userId: fakeUserId,
        employeeId: 'TCH-0001',
        fullName: 'Robert Miller',
        email: 'robert@eduhub.school',
        phone: '+1 555-0100',
        designation: 'Teacher',
        department: 'Science',
        status: 'ACTIVE',
        assignedClasses: [],
      } as any);

      vi.mocked(mockRepo.updateTeacher).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeTeacherId),
        userId: fakeUserId,
        employeeId: 'TCH-0001',
        fullName: 'Robert Miller Jr.',
        email: 'robert.jr@eduhub.school',
        phone: '+1 555-0100',
        designation: 'Department Head',
        department: 'Science',
        status: 'ACTIVE',
        assignedClasses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await teacherService.updateTeacher(fakeTeacherId, {
        fullName: 'Robert Miller Jr.',
        email: 'robert.jr@eduhub.school',
        designation: 'Department Head',
      });

      expect(result.fullName).toBe('Robert Miller Jr.');
      expect(result.email).toBe('robert.jr@eduhub.school');
      expect(result.designation).toBe('Department Head');

      expect(mockRepo.updateUserForTeacher).toHaveBeenCalledWith(
        fakeUserId.toString(),
        expect.objectContaining({
          fullName: 'Robert Miller Jr.',
          email: 'robert.jr@eduhub.school',
        })
      );
    });

    it('should throw NotFoundError if teacher does not exist', async () => {
      vi.mocked(mockRepo.findTeacherById).mockResolvedValue(null);

      await expect(
        teacherService.updateTeacher(new mongoose.Types.ObjectId().toString(), {
          fullName: 'Ghost Teacher',
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('changeTeacherStatus', () => {
    it('should deactivate teacher and update user status to DISABLED', async () => {
      const fakeTeacherId = new mongoose.Types.ObjectId().toString();
      const fakeUserId = new mongoose.Types.ObjectId();

      vi.mocked(mockRepo.findTeacherById).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeTeacherId),
        userId: fakeUserId,
        employeeId: 'TCH-0001',
        fullName: 'Robert Miller',
        status: 'ACTIVE',
      } as any);

      vi.mocked(mockRepo.updateTeacher).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeTeacherId),
        userId: fakeUserId,
        employeeId: 'TCH-0001',
        fullName: 'Robert Miller',
        status: 'INACTIVE',
      } as any);

      const result = await teacherService.changeTeacherStatus(fakeTeacherId, 'INACTIVE');
      expect(result.status).toBe('INACTIVE');

      expect(mockRepo.updateTeacher).toHaveBeenCalledWith(fakeTeacherId, { status: 'INACTIVE' });
      expect(mockRepo.updateUserForTeacher).toHaveBeenCalledWith(fakeUserId.toString(), {
        status: AccountStatus.DISABLED,
      });
    });

    it('should reactivate teacher and update user status to ACTIVE', async () => {
      const fakeTeacherId = new mongoose.Types.ObjectId().toString();
      const fakeUserId = new mongoose.Types.ObjectId();

      vi.mocked(mockRepo.findTeacherById).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeTeacherId),
        userId: fakeUserId,
        employeeId: 'TCH-0001',
        fullName: 'Robert Miller',
        status: 'INACTIVE',
      } as any);

      vi.mocked(mockRepo.updateTeacher).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeTeacherId),
        userId: fakeUserId,
        employeeId: 'TCH-0001',
        fullName: 'Robert Miller',
        status: 'ACTIVE',
      } as any);

      const result = await teacherService.changeTeacherStatus(fakeTeacherId, 'ACTIVE');
      expect(result.status).toBe('ACTIVE');

      expect(mockRepo.updateTeacher).toHaveBeenCalledWith(fakeTeacherId, { status: 'ACTIVE' });
      expect(mockRepo.updateUserForTeacher).toHaveBeenCalledWith(fakeUserId.toString(), {
        status: AccountStatus.ACTIVE,
      });
    });
  });

  describe('getSummaryStats', () => {
    it('should compute summary counts for total, active, and inactive teachers', async () => {
      vi.mocked(mockRepo.countTeachers)
        .mockResolvedValueOnce(15) // total
        .mockResolvedValueOnce(12) // active
        .mockResolvedValueOnce(3); // inactive

      const summary = await teacherService.getSummaryStats();
      expect(summary.totalTeachers).toBe(15);
      expect(summary.activeTeachers).toBe(12);
      expect(summary.inactiveTeachers).toBe(3);
    });
  });
});
