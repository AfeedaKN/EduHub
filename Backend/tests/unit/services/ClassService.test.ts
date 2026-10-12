import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { ClassService } from '../../../src/modules/admin/services/ClassService';
import { IClassRepository } from '../../../src/modules/admin/repositories/ClassRepository';
import {
  ConflictError,
  ValidationError,
  NotFoundError,
} from '../../../src/shared/domain/errors/AppError';

describe('ClassService Unit Tests', () => {
  let classService: ClassService;
  let mockRepo: IClassRepository;

  beforeEach(() => {
    mockRepo = {
      createClass: vi.fn(),
      findClassById: vi.fn(),
      findClassByName: vi.fn(),
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
      findSectionByGradeAndName: vi.fn(),
    };

    classService = new ClassService(mockRepo);
  });

  describe('createClass', () => {
    it('should successfully create a new class', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      vi.mocked(mockRepo.findClassByNameAndYear).mockResolvedValue(null);
      vi.mocked(mockRepo.createClass).mockResolvedValue({
        _id: fakeId,
        name: 'Grade 8',
        academicYear: '2026-2027',
        description: 'Middle school grade 8',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await classService.createClass({
        name: 'Grade 8',
        academicYear: '2026-2027',
        description: 'Middle school grade 8',
      });

      expect(result.name).toBe('Grade 8');
      expect(result.academicYear).toBe('2026-2027');
      expect(result.status).toBe('ACTIVE');
      expect(mockRepo.createClass).toHaveBeenCalledWith({
        name: 'Grade 8',
        academicYear: '2026-2027',
        description: 'Middle school grade 8',
        status: 'ACTIVE',
      });
    });

    it('should throw ConflictError if class already exists for same academic year', async () => {
      vi.mocked(mockRepo.findClassByNameAndYear).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: 'Grade 8',
        academicYear: '2026-2027',
      } as any);

      await expect(
        classService.createClass({ name: 'Grade 8', academicYear: '2026-2027' })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ValidationError if class name is empty', async () => {
      await expect(
        classService.createClass({ name: '   ', academicYear: '2026-2027' })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('updateClass and changeClassStatus', () => {
    it('should update class name and description', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      vi.mocked(mockRepo.findClassById).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeId),
        name: 'Grade 8',
        academicYear: '2026-2027',
        description: 'Old desc',
        status: 'ACTIVE',
      } as any);
      vi.mocked(mockRepo.findClassByNameAndYear).mockResolvedValue(null);
      vi.mocked(mockRepo.updateClass).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeId),
        name: 'Grade 8 Advanced',
        academicYear: '2026-2027',
        description: 'Updated desc',
        status: 'ACTIVE',
      } as any);
      vi.mocked(mockRepo.findSectionsByClassId).mockResolvedValue([]);

      const result = await classService.updateClass(fakeId, {
        name: 'Grade 8 Advanced',
        description: 'Updated desc',
      });

      expect(result.name).toBe('Grade 8 Advanced');
      expect(result.description).toBe('Updated desc');
    });

    it('should cascade deactivate sections when a class is deactivated', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      vi.mocked(mockRepo.findClassById).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeId),
        name: 'Grade 8',
        academicYear: '2026-2027',
        status: 'ACTIVE',
      } as any);
      vi.mocked(mockRepo.updateClass).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeId),
        name: 'Grade 8',
        academicYear: '2026-2027',
        status: 'INACTIVE',
      } as any);
      vi.mocked(mockRepo.findSectionsByClassId).mockResolvedValue([]);

      await classService.changeClassStatus(fakeId, 'INACTIVE');

      expect(mockRepo.updateClass).toHaveBeenCalledWith(fakeId, { status: 'INACTIVE' });
      expect(mockRepo.updateSectionsByClassId).toHaveBeenCalledWith(fakeId, { status: 'INACTIVE' });
    });

    it('should throw NotFoundError if class does not exist', async () => {
      vi.mocked(mockRepo.findClassById).mockResolvedValue(null);

      await expect(
        classService.updateClass(new mongoose.Types.ObjectId().toString(), { name: 'Grade 9' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteClass', () => {
    it('should prevent deleting class if official students are enrolled', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      vi.mocked(mockRepo.findClassById).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeId),
        name: 'Grade 8',
      } as any);
      vi.mocked(mockRepo.isClassReferencedByStudents).mockResolvedValue(true);

      await expect(classService.deleteClass(fakeId)).rejects.toThrow(ConflictError);
    });

    it('should prevent deleting class if admission requests reference it', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      vi.mocked(mockRepo.findClassById).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeId),
        name: 'Grade 8',
      } as any);
      vi.mocked(mockRepo.isClassReferencedByStudents).mockResolvedValue(false);
      vi.mocked(mockRepo.isClassReferencedByAdmissions).mockResolvedValue(true);

      await expect(classService.deleteClass(fakeId)).rejects.toThrow(ConflictError);
    });
  });

  describe('createSection', () => {
    const classId = new mongoose.Types.ObjectId().toString();
    const parentClass = {
      _id: new mongoose.Types.ObjectId(classId),
      name: 'Grade 8',
      academicYear: '2026-2027',
      status: 'ACTIVE',
    };

    it('should create section with valid capacity and inherited academic year', async () => {
      vi.mocked(mockRepo.findClassById).mockResolvedValue(parentClass as any);
      vi.mocked(mockRepo.findSectionByClassAndName).mockResolvedValue(null);
      vi.mocked(mockRepo.createSection).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        classId: parentClass._id,
        name: 'A',
        academicYear: '2026-2027',
        capacity: 35,
        roomNumber: 'Room 201',
        status: 'ACTIVE',
      } as any);
      vi.mocked(mockRepo.countEnrolledStudents).mockResolvedValue(0);

      const result = await classService.createSection(classId, {
        name: 'A',
        capacity: 35,
        roomNumber: 'Room 201',
      });

      expect(result.name).toBe('A');
      expect(result.capacity).toBe(35);
      expect(result.availableSeats).toBe(35);
      expect(result.academicYear).toBe('2026-2027');
    });

    it('should throw ConflictError if trying to add a section to an INACTIVE class', async () => {
      vi.mocked(mockRepo.findClassById).mockResolvedValue({
        ...parentClass,
        status: 'INACTIVE',
      } as any);

      await expect(
        classService.createSection(classId, { name: 'A', capacity: 30 })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ValidationError if capacity is not a positive integer', async () => {
      vi.mocked(mockRepo.findClassById).mockResolvedValue(parentClass as any);

      await expect(
        classService.createSection(classId, { name: 'A', capacity: -5 })
      ).rejects.toThrow(ValidationError);

      await expect(
        classService.createSection(classId, { name: 'A', capacity: 0 })
      ).rejects.toThrow(ValidationError);

      await expect(
        classService.createSection(classId, { name: 'A', capacity: 12.5 })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError if duplicate section name in same class', async () => {
      vi.mocked(mockRepo.findClassById).mockResolvedValue(parentClass as any);
      vi.mocked(mockRepo.findSectionByClassAndName).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: 'A',
      } as any);

      await expect(
        classService.createSection(classId, { name: 'A', capacity: 30 })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('updateSection', () => {
    const classId = new mongoose.Types.ObjectId().toString();
    const sectionId = new mongoose.Types.ObjectId().toString();
    const parentClass = {
      _id: new mongoose.Types.ObjectId(classId),
      name: 'Grade 8',
      status: 'ACTIVE',
    };
    const existingSection = {
      _id: new mongoose.Types.ObjectId(sectionId),
      classId: { _id: new mongoose.Types.ObjectId(classId) },
      name: 'A',
      capacity: 35,
      status: 'ACTIVE',
    };

    it('should prevent setting section to ACTIVE if parent class is INACTIVE', async () => {
      vi.mocked(mockRepo.findClassById).mockResolvedValue({
        ...parentClass,
        status: 'INACTIVE',
      } as any);
      vi.mocked(mockRepo.findSectionById).mockResolvedValue({
        ...existingSection,
        status: 'INACTIVE',
      } as any);

      await expect(
        classService.changeSectionStatus(classId, sectionId, 'ACTIVE')
      ).rejects.toThrow(ConflictError);
    });

    it('should prevent reducing capacity below current enrollment count', async () => {
      vi.mocked(mockRepo.findClassById).mockResolvedValue(parentClass as any);
      vi.mocked(mockRepo.findSectionById).mockResolvedValue(existingSection as any);
      vi.mocked(mockRepo.countEnrolledStudents).mockResolvedValue(28);

      await expect(
        classService.updateSection(classId, sectionId, { capacity: 20 })
      ).rejects.toThrow(ConflictError);
    });

    it('should allow increasing capacity or setting it at or above current enrollment', async () => {
      vi.mocked(mockRepo.findClassById).mockResolvedValue(parentClass as any);
      vi.mocked(mockRepo.findSectionById).mockResolvedValue(existingSection as any);
      vi.mocked(mockRepo.countEnrolledStudents).mockResolvedValue(28);
      vi.mocked(mockRepo.updateSection).mockResolvedValue({
        ...existingSection,
        capacity: 40,
      } as any);

      const result = await classService.updateSection(classId, sectionId, { capacity: 40 });
      expect(result.capacity).toBe(40);
    });
  });

  describe('getSummaryStats', () => {
    it('should calculate summary counts accurately from classes and their sections', async () => {
      const fakeClasses = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Grade 8',
          academicYear: '2026-2027',
          status: 'ACTIVE',
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Grade 9',
          academicYear: '2026-2027',
          status: 'ACTIVE',
        },
      ];

      vi.mocked(mockRepo.findAllClasses).mockResolvedValue(fakeClasses as any);

      const secClass1 = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'A',
          capacity: 30,
          status: 'ACTIVE',
        },
      ];
      const secClass2 = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'A',
          capacity: 30,
          status: 'ACTIVE',
        },
      ];

      vi.mocked(mockRepo.findSectionsByClassId)
        .mockResolvedValueOnce(secClass1 as any)
        .mockResolvedValueOnce(secClass2 as any);

      vi.mocked(mockRepo.countEnrolledStudents)
        .mockResolvedValueOnce(25) // Grade 8 Sec A: 25 enrolled
        .mockResolvedValueOnce(28); // Grade 9 Sec A: 28 enrolled

      const stats = await classService.getSummaryStats('2026-2027');

      expect(stats.totalClasses).toBe(2);
      expect(stats.totalSections).toBe(2);
      expect(stats.totalEnrolledStudents).toBe(53); // 25 + 28
      // Available seats: (30-25) + (30-28) = 5 + 2 = 7
      expect(stats.totalAvailableSeats).toBe(7);
    });

    it('should return 0 available seats for sections in an INACTIVE class', async () => {
      const inactiveClass = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Grade 8',
          academicYear: '2026-2027',
          status: 'INACTIVE',
        },
      ];

      vi.mocked(mockRepo.findAllClasses).mockResolvedValue(inactiveClass as any);
      vi.mocked(mockRepo.findSectionsByClassId).mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'A',
          capacity: 30,
          status: 'ACTIVE',
        },
      ] as any);
      vi.mocked(mockRepo.countEnrolledStudents).mockResolvedValue(0);

      const stats = await classService.getSummaryStats();

      expect(stats.totalClasses).toBe(1);
      expect(stats.totalSections).toBe(1);
      expect(stats.totalEnrolledStudents).toBe(0);
      expect(stats.totalAvailableSeats).toBe(0); // Inactive class offers 0 seats!
    });
  });
});
