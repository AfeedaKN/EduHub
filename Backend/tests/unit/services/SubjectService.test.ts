import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { SubjectService } from '../../../src/modules/admin/services/SubjectService';
import { ISubjectRepository } from '../../../src/modules/admin/repositories/SubjectRepository';
import { IClassRepository } from '../../../src/modules/admin/repositories/ClassRepository';
import {
  ConflictError,
  ValidationError,
  NotFoundError,
} from '../../../src/shared/domain/errors/AppError';

describe('SubjectService Unit Tests', () => {
  let subjectService: SubjectService;
  let mockSubjectRepo: ISubjectRepository;
  let mockClassRepo: IClassRepository;

  beforeEach(() => {
    mockSubjectRepo = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByCode: vi.fn(),
      findByName: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
      getSummaryStats: vi.fn(),
      getAssignedTeachers: vi.fn(),
      getReferencesCount: vi.fn(),
      ensureDefaultSubjects: vi.fn(),
    };

    mockClassRepo = {
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

    subjectService = new SubjectService(mockSubjectRepo, mockClassRepo);
  });

  describe('createSubject', () => {
    it('should successfully create a new subject', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const fakeClassId = new mongoose.Types.ObjectId().toString();

      vi.mocked(mockSubjectRepo.findByCode).mockResolvedValue(null);
      vi.mocked(mockSubjectRepo.findByName).mockResolvedValue(null);
      vi.mocked(mockSubjectRepo.getAssignedTeachers).mockResolvedValue([]);

      vi.mocked(mockSubjectRepo.create).mockResolvedValue({
        _id: fakeId,
        name: 'Physics',
        code: 'PHY-101',
        category: 'SCIENCE',
        applicableClasses: [{ classId: new mongoose.Types.ObjectId(fakeClassId), className: 'Grade 10' }],
        status: 'ACTIVE',
      } as any);

      const result = await subjectService.createSubject({
        name: 'Physics',
        code: 'phy-101',
        category: 'SCIENCE',
        applicableClasses: [{ classId: fakeClassId, className: 'Grade 10' }],
      });

      expect(result.code).toBe('PHY-101');
      expect(result.name).toBe('Physics');
      expect(mockSubjectRepo.create).toHaveBeenCalled();
    });

    it('should throw ValidationError if name or code is missing', async () => {
      await expect(
        subjectService.createSubject({
          name: '',
          code: 'MATH',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        subjectService.createSubject({
          name: 'Mathematics',
          code: '',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError if subject code already exists', async () => {
      vi.mocked(mockSubjectRepo.findByCode).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        code: 'MATH-101',
        name: 'Math',
      } as any);

      await expect(
        subjectService.createSubject({
          name: 'Mathematics',
          code: 'MATH-101',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ValidationError if category is invalid', async () => {
      vi.mocked(mockSubjectRepo.findByCode).mockResolvedValue(null);
      vi.mocked(mockSubjectRepo.findByName).mockResolvedValue(null);

      await expect(
        subjectService.createSubject({
          name: 'Quantum Cooking',
          code: 'QC-101',
          category: 'INVALID_CATEGORY' as any,
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('updateSubject', () => {
    it('should update an existing subject', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      vi.mocked(mockSubjectRepo.findById).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeId),
        name: 'Physics',
        code: 'PHY-101',
        category: 'SCIENCE',
        status: 'ACTIVE',
      } as any);

      vi.mocked(mockSubjectRepo.getAssignedTeachers).mockResolvedValue([]);
      vi.mocked(mockSubjectRepo.update).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeId),
        name: 'Advanced Physics',
        code: 'PHY-102',
        category: 'SCIENCE',
        status: 'ACTIVE',
      } as any);

      const result = await subjectService.updateSubject(fakeId, {
        name: 'Advanced Physics',
        code: 'PHY-102',
      });

      expect(result.name).toBe('Advanced Physics');
      expect(result.code).toBe('PHY-102');
    });

    it('should throw NotFoundError if subject to update is not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      vi.mocked(mockSubjectRepo.findById).mockResolvedValue(null);

      await expect(
        subjectService.updateSubject(fakeId, { name: 'New Name' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError if updated code collides with another subject', async () => {
      const fakeId1 = new mongoose.Types.ObjectId().toString();
      const fakeId2 = new mongoose.Types.ObjectId();

      vi.mocked(mockSubjectRepo.findById).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeId1),
        name: 'Physics',
        code: 'PHY-101',
      } as any);

      vi.mocked(mockSubjectRepo.findByCode).mockResolvedValue({
        _id: fakeId2,
        code: 'CHEM-101',
      } as any);

      await expect(
        subjectService.updateSubject(fakeId1, { code: 'CHEM-101' })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('changeSubjectStatus', () => {
    it('should successfully update subject status', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      vi.mocked(mockSubjectRepo.findById).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeId),
        name: 'Physics',
        status: 'ACTIVE',
      } as any);

      vi.mocked(mockSubjectRepo.getAssignedTeachers).mockResolvedValue([]);
      vi.mocked(mockSubjectRepo.updateStatus).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeId),
        name: 'Physics',
        status: 'INACTIVE',
      } as any);

      const result = await subjectService.changeSubjectStatus(fakeId, 'INACTIVE');
      expect(result.status).toBe('INACTIVE');
    });
  });

  describe('deleteSubject', () => {
    it('should delete subject if it has no active references', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      vi.mocked(mockSubjectRepo.findById).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeId),
        name: 'Music',
        code: 'MUS-101',
      } as any);

      vi.mocked(mockSubjectRepo.getReferencesCount).mockResolvedValue({
        timetablePeriods: 0,
        examSchedules: 0,
        assignments: 0,
        teacherAssignments: 0,
        totalReferences: 0,
      });

      vi.mocked(mockSubjectRepo.delete).mockResolvedValue(true);

      const res = await subjectService.deleteSubject(fakeId);
      expect(res.success).toBe(true);
      expect(mockSubjectRepo.delete).toHaveBeenCalledWith(fakeId);
    });

    it('should throw ConflictError when attempting to delete a subject with existing references', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      vi.mocked(mockSubjectRepo.findById).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(fakeId),
        name: 'Mathematics',
        code: 'MATH-101',
      } as any);

      vi.mocked(mockSubjectRepo.getReferencesCount).mockResolvedValue({
        timetablePeriods: 5,
        examSchedules: 2,
        assignments: 10,
        teacherAssignments: 2,
        totalReferences: 19,
      });

      await expect(subjectService.deleteSubject(fakeId)).rejects.toThrow(ConflictError);
    });
  });

  describe('getSummaryStats', () => {
    it('should return calculated summary statistics', async () => {
      vi.mocked(mockSubjectRepo.getSummaryStats).mockResolvedValue({
        totalSubjects: 10,
        activeSubjects: 8,
        assignedSubjects: 6,
        unassignedSubjects: 2,
      });

      const stats = await subjectService.getSummaryStats();
      expect(stats.totalSubjects).toBe(10);
      expect(stats.activeSubjects).toBe(8);
      expect(stats.assignedSubjects).toBe(6);
      expect(stats.unassignedSubjects).toBe(2);
    });
  });
});
