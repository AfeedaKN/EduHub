import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { AdminService } from '../../../src/modules/admin/services/AdminService';
import { IAdminDashboardRepository } from '../../../src/modules/admin/repositories/AdminDashboardRepository';
import { NotFoundError, ConflictError, ValidationError } from '../../../src/shared/domain/errors/AppError';
import { RegistrationStatus } from '../../../src/modules/parent/models/StudentRegistrationRequest.model';

import { IClassRepository } from '../../../src/modules/admin/repositories/ClassRepository';

describe('AdminService Unit Tests', () => {
  let adminService: AdminService;
  let mockRepo: IAdminDashboardRepository;
  let mockClassRepo: IClassRepository;

  beforeEach(() => {
    mockRepo = {
      countActiveStudents: vi.fn(),
      countStudentStatusCounts: vi.fn().mockResolvedValue({ total: 150, active: 145, inactive: 5 }),
      countActiveTeachers: vi.fn(),
      countPendingAdmissions: vi.fn(),
      getRecentPendingAdmissions: vi.fn(),
      getAllAdmissions: vi.fn(),
      getAdmissions: vi.fn(),
      getAdmissionCounts: vi.fn(),
      getAdmissionById: vi.fn(),
      countClassEnrollment: vi.fn().mockResolvedValue(15),
      countGradeEnrollment: vi.fn().mockResolvedValue(30),
      getEnrollmentByClass: vi.fn().mockResolvedValue([{ className: 'Grade 1', count: 20 }]),
      getAttendanceSummary: vi.fn().mockResolvedValue(null),
      getExamOverview: vi.fn().mockResolvedValue({
        pendingReviewCount: 1,
        publishedCount: 2,
        scheduledExamsCount: 3,
        recentExams: [],
      }),
      getRecentActivities: vi.fn().mockResolvedValue([]),
      getUpcomingActivities: vi.fn().mockResolvedValue(null),
      saveRegistrationRequest: vi.fn().mockImplementation(async (doc) => doc),
      createStudent: vi.fn(),
      getNextStudentSequence: vi.fn().mockResolvedValue(42),
      startSession: vi.fn().mockResolvedValue(null),
    };

    mockClassRepo = {
      createClass: vi.fn(),
      findClassById: vi.fn(),
      findClassByName: vi.fn().mockResolvedValue(null),
      findClassByNameAndYear: vi.fn(),
      findAllClasses: vi.fn(),
      updateClass: vi.fn(),
      deleteClass: vi.fn(),
      countClasses: vi.fn(),
      createSection: vi.fn(),
      findSectionById: vi.fn(),
      findSectionByClassAndName: vi.fn(),
      findSectionsByClassId: vi.fn(),
      findAllActiveSections: vi.fn(),
      updateSection: vi.fn(),
      updateSectionsByClassId: vi.fn(),
      deleteSection: vi.fn(),
      countSections: vi.fn(),
      countEnrolledStudents: vi.fn(),
      countAllEnrolledStudents: vi.fn(),
      isClassReferencedByStudents: vi.fn(),
      isClassReferencedByAdmissions: vi.fn(),
      isSectionReferencedByStudents: vi.fn(),
      findSectionByGradeAndName: vi.fn().mockResolvedValue(null),
    };

    adminService = new AdminService(mockRepo, mockClassRepo);
  });

  describe('getDashboardSummary', () => {
    it('should aggregate counts and return recent pending admissions with null for unimplemented modules', async () => {
      vi.mocked(mockRepo.countActiveStudents).mockResolvedValue(150);
      vi.mocked(mockRepo.countActiveTeachers).mockResolvedValue(12);
      vi.mocked(mockRepo.countPendingAdmissions).mockResolvedValue(3);

      const fakeRecentDocs: any[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          studentFullName: 'Aisha Rahman',
          requestedGrade: 'Grade 8',
          academicYear: '2026-2027',
          parentId: {
            fullName: 'Farhan Rahman',
            email: 'farhan@example.com',
            phone: '+1234567890',
          },
          createdAt: new Date('2026-10-10'),
          status: RegistrationStatus.PENDING,
          dateOfBirth: new Date('2012-05-15'),
          gender: 'FEMALE',
          previousSchool: 'City Primary School',
          parentRelationship: 'FATHER',
        },
      ];

      vi.mocked(mockRepo.getRecentPendingAdmissions).mockResolvedValue(fakeRecentDocs);

      const result = await adminService.getDashboardSummary();

      expect(result.totalStudents).toBe(150);
      expect(result.activeStudents).toBe(145);
      expect(result.inactiveStudents).toBe(5);
      expect(result.totalTeachers).toBe(12);
      expect(result.pendingAdmissionsCount).toBe(3);
      expect(result.recentPendingAdmissions).toHaveLength(1);
      expect(result.recentPendingAdmissions[0].studentFullName).toBe('Aisha Rahman');
      expect(result.recentPendingAdmissions[0].parentName).toBe('Farhan Rahman');
      expect(result.recentPendingAdmissions[0].status).toBe('PENDING');

      // Unimplemented modules must be null (no fabricated numbers)
      expect(result.feesSummary).toBeNull();
    });
  });

  describe('getAdmissions and getAdmissionCounts', () => {
    it('should retrieve admissions with filters', async () => {
      const fakeDocs: any[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          studentFullName: 'Adam Thomas',
          requestedGrade: 'Grade 5',
          academicYear: '2026-2027',
          parentId: { fullName: 'Mary Thomas', email: 'mary@example.com' },
          createdAt: new Date('2026-10-09'),
          status: RegistrationStatus.PENDING,
        },
      ];

      vi.mocked(mockRepo.getAdmissions).mockResolvedValue(fakeDocs);

      const result = await adminService.getAdmissions({ status: 'PENDING', search: 'Adam' });
      expect(result).toHaveLength(1);
      expect(result[0].studentFullName).toBe('Adam Thomas');
      expect(mockRepo.getAdmissions).toHaveBeenCalledWith({ status: 'PENDING', search: 'Adam' });
    });

    it('should return admission counts', async () => {
      vi.mocked(mockRepo.getAdmissionCounts).mockResolvedValue({
        pendingCount: 5,
        approvedCount: 12,
        rejectedCount: 2,
        totalCount: 19,
      });

      const counts = await adminService.getAdmissionCounts();
      expect(counts.pendingCount).toBe(5);
      expect(counts.approvedCount).toBe(12);
      expect(counts.rejectedCount).toBe(2);
      expect(counts.totalCount).toBe(19);
    });
  });

  describe('getClassCapacity', () => {
    it('should return capacity details with maxCapacity 40 and calculate available seats', async () => {
      vi.mocked(mockRepo.countClassEnrollment).mockResolvedValue(37);

      const capacity = await adminService.getClassCapacity('Grade 8', 'A');
      expect(capacity.grade).toBe('Grade 8');
      expect(capacity.section).toBe('A');
      expect(capacity.maxCapacity).toBe(40);
      expect(capacity.currentlyEnrolled).toBe(37);
      expect(capacity.availableSeats).toBe(3);
      expect(capacity.isAtCapacity).toBe(false);
    });

    it('should flag isAtCapacity as true when enrolled >= 40', async () => {
      vi.mocked(mockRepo.countClassEnrollment).mockResolvedValue(40);

      const capacity = await adminService.getClassCapacity('Grade 8', 'B');
      expect(capacity.currentlyEnrolled).toBe(40);
      expect(capacity.availableSeats).toBe(0);
      expect(capacity.isAtCapacity).toBe(true);
    });

    it('should mark class at capacity with 0 available seats if parent class is inactive', async () => {
      vi.mocked(mockClassRepo.findClassByName).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: 'Grade 8',
        status: 'INACTIVE',
      } as any);

      const capacity = await adminService.getClassCapacity('Grade 8', 'A');
      expect(capacity.availableSeats).toBe(0);
      expect(capacity.isAtCapacity).toBe(true);
    });

    it('should mark section at capacity with 0 available seats if section is inactive', async () => {
      vi.mocked(mockClassRepo.findClassByName).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: 'Grade 8',
        status: 'ACTIVE',
      } as any);
      vi.mocked(mockClassRepo.findSectionByGradeAndName).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: 'A',
        status: 'INACTIVE',
        capacity: 30,
      } as any);

      const capacity = await adminService.getClassCapacity('Grade 8', 'A');
      expect(capacity.availableSeats).toBe(0);
      expect(capacity.isAtCapacity).toBe(true);
    });
  });

  describe('getAdmissionDetail', () => {
    it('should return mapped admission details when found and include capacity check', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const fakeDoc: any = {
        _id: new mongoose.Types.ObjectId(fakeId),
        studentFullName: 'Sarah Connor',
        requestedGrade: 'Grade 10',
        academicYear: '2026-2027',
        parentId: {
          fullName: 'John Connor',
          email: 'john@example.com',
        },
        createdAt: new Date('2026-10-08'),
        status: RegistrationStatus.PENDING,
      };

      vi.mocked(mockRepo.getAdmissionById).mockResolvedValue(fakeDoc);
      vi.mocked(mockRepo.countClassEnrollment).mockResolvedValue(22);

      const result = await adminService.getAdmissionDetail(fakeId);
      expect(result.id).toBe(fakeId);
      expect(result.studentFullName).toBe('Sarah Connor');
      expect(result.capacity).toBeDefined();
      expect(result.capacity?.currentlyEnrolled).toBe(22);
      expect(result.capacity?.availableSeats).toBe(18);
    });

    it('should throw NotFoundError when request does not exist', async () => {
      vi.mocked(mockRepo.getAdmissionById).mockResolvedValue(null);

      await expect(adminService.getAdmissionDetail(new mongoose.Types.ObjectId().toString())).rejects.toThrow(NotFoundError);
    });
  });

  describe('approveAdmission', () => {
    const parentId = new mongoose.Types.ObjectId();
    const adminId = new mongoose.Types.ObjectId().toString();

    it('should approve a valid pending request and create official student record', async () => {
      const requestId = new mongoose.Types.ObjectId().toString();
      const fakeDoc: any = {
        _id: new mongoose.Types.ObjectId(requestId),
        studentFullName: 'Liam Vance',
        requestedGrade: 'Grade 7',
        academicYear: '2026-2027',
        parentId: {
          _id: parentId,
          fullName: 'Robert Vance',
          email: 'bob@example.com',
        },
        status: RegistrationStatus.PENDING,
        createdAt: new Date(),
      };

      vi.mocked(mockRepo.getAdmissionById).mockResolvedValue(fakeDoc);
      vi.mocked(mockRepo.countClassEnrollment).mockResolvedValue(30); // 30 < 40
      vi.mocked(mockRepo.getNextStudentSequence).mockResolvedValue(105);

      const fakeStudentId = new mongoose.Types.ObjectId();
      vi.mocked(mockRepo.createStudent).mockResolvedValue({
        _id: fakeStudentId,
        parentId,
        fullName: 'Liam Vance',
        studentId: 'STU-2026-0105',
        grade: 'Grade 7',
        section: 'A',
        status: 'ACTIVE',
      } as any);

      const result = await adminService.approveAdmission(requestId, adminId, { section: 'A' });

      expect(mockRepo.createStudent).toHaveBeenCalledWith(
        expect.objectContaining({
          parentId,
          fullName: 'Liam Vance',
          studentId: 'STU-2026-0105',
          grade: 'Grade 7',
          section: 'A',
          status: 'ACTIVE',
        }),
        undefined
      );

      expect(mockRepo.saveRegistrationRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          status: RegistrationStatus.APPROVED,
          createdStudentId: fakeStudentId,
          reviewedBy: new mongoose.Types.ObjectId(adminId),
        }),
        undefined
      );

      expect(result.student.studentId).toBe('STU-2026-0105');
      expect(result.request.status).toBe(RegistrationStatus.APPROVED);
      expect(result.message).toContain('successfully approved');
    });

    it('should throw ConflictError if class has reached maximum capacity', async () => {
      const requestId = new mongoose.Types.ObjectId().toString();
      const fakeDoc: any = {
        _id: new mongoose.Types.ObjectId(requestId),
        studentFullName: 'Liam Vance',
        requestedGrade: 'Grade 7',
        academicYear: '2026-2027',
        parentId,
        status: RegistrationStatus.PENDING,
      };

      vi.mocked(mockRepo.getAdmissionById).mockResolvedValue(fakeDoc);
      vi.mocked(mockRepo.countClassEnrollment).mockResolvedValue(40); // Full!

      await expect(
        adminService.approveAdmission(requestId, adminId, { section: 'A' })
      ).rejects.toThrow(ConflictError);

      expect(mockRepo.createStudent).not.toHaveBeenCalled();
    });

    it('should throw ConflictError if class is inactive during admission approval', async () => {
      const requestId = new mongoose.Types.ObjectId().toString();
      const fakeDoc: any = {
        _id: new mongoose.Types.ObjectId(requestId),
        studentFullName: 'Liam Vance',
        requestedGrade: 'Grade 7',
        academicYear: '2026-2027',
        parentId,
        status: RegistrationStatus.PENDING,
      };

      vi.mocked(mockRepo.getAdmissionById).mockResolvedValue(fakeDoc);
      vi.mocked(mockClassRepo.findClassByName).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: 'Grade 7',
        status: 'INACTIVE',
      } as any);

      await expect(
        adminService.approveAdmission(requestId, adminId, { section: 'A' })
      ).rejects.toThrow(ConflictError);

      expect(mockRepo.createStudent).not.toHaveBeenCalled();
    });

    it('should throw ConflictError if assigned section is inactive during admission approval', async () => {
      const requestId = new mongoose.Types.ObjectId().toString();
      const fakeDoc: any = {
        _id: new mongoose.Types.ObjectId(requestId),
        studentFullName: 'Liam Vance',
        requestedGrade: 'Grade 7',
        academicYear: '2026-2027',
        parentId,
        status: RegistrationStatus.PENDING,
      };

      vi.mocked(mockRepo.getAdmissionById).mockResolvedValue(fakeDoc);
      vi.mocked(mockClassRepo.findClassByName).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: 'Grade 7',
        status: 'ACTIVE',
      } as any);
      vi.mocked(mockClassRepo.findSectionByGradeAndName).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: 'A',
        status: 'INACTIVE',
      } as any);

      await expect(
        adminService.approveAdmission(requestId, adminId, { section: 'A' })
      ).rejects.toThrow(ConflictError);

      expect(mockRepo.createStudent).not.toHaveBeenCalled();
    });

    it('should throw ConflictError if request was already approved or rejected', async () => {
      const requestId = new mongoose.Types.ObjectId().toString();
      const fakeDoc: any = {
        _id: new mongoose.Types.ObjectId(requestId),
        studentFullName: 'Liam Vance',
        requestedGrade: 'Grade 7',
        status: RegistrationStatus.APPROVED, // Already finalized
      };

      vi.mocked(mockRepo.getAdmissionById).mockResolvedValue(fakeDoc);

      await expect(
        adminService.approveAdmission(requestId, adminId)
      ).rejects.toThrow(ConflictError);

      expect(mockRepo.createStudent).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if requestId is invalid', async () => {
      await expect(
        adminService.approveAdmission('invalid-id', adminId)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('rejectAdmission', () => {
    const adminId = new mongoose.Types.ObjectId().toString();

    it('should reject a pending request, save reason and audit info, and NOT create a student', async () => {
      const requestId = new mongoose.Types.ObjectId().toString();
      const fakeDoc: any = {
        _id: new mongoose.Types.ObjectId(requestId),
        studentFullName: 'Maya Lin',
        requestedGrade: 'Grade 6',
        academicYear: '2026-2027',
        parentId: {
          _id: new mongoose.Types.ObjectId(),
          fullName: 'Helen Lin',
          email: 'helen@example.com',
        },
        status: RegistrationStatus.PENDING,
        createdAt: new Date(),
      };

      vi.mocked(mockRepo.getAdmissionById).mockResolvedValue(fakeDoc);

      const result = await adminService.rejectAdmission(requestId, adminId, {
        rejectionReason: 'Grade 6 is at full capacity and no seats are available.',
      });

      expect(mockRepo.createStudent).not.toHaveBeenCalled();
      expect(mockRepo.saveRegistrationRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          status: RegistrationStatus.REJECTED,
          rejectionReason: 'Grade 6 is at full capacity and no seats are available.',
          reviewedBy: new mongoose.Types.ObjectId(adminId),
        })
      );
      expect(result.request.status).toBe(RegistrationStatus.REJECTED);
      expect(result.message).toContain('has been rejected');
    });

    it('should throw ValidationError if rejectionReason is missing or whitespace', async () => {
      const requestId = new mongoose.Types.ObjectId().toString();

      await expect(
        adminService.rejectAdmission(requestId, adminId, { rejectionReason: '   ' })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError if request was already finalized', async () => {
      const requestId = new mongoose.Types.ObjectId().toString();
      const fakeDoc: any = {
        _id: new mongoose.Types.ObjectId(requestId),
        studentFullName: 'Maya Lin',
        status: RegistrationStatus.REJECTED,
      };

      vi.mocked(mockRepo.getAdmissionById).mockResolvedValue(fakeDoc);

      await expect(
        adminService.rejectAdmission(requestId, adminId, { rejectionReason: 'Another reason' })
      ).rejects.toThrow(ConflictError);
    });
  });
});
