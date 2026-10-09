import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { ParentService } from '../../../src/modules/parent/services/ParentService';
import { IRegistrationRequestRepository } from '../../../src/modules/parent/repositories/RegistrationRequestRepository';
import { IStudentRepository } from '../../../src/modules/parent/repositories/StudentRepository';
import {
  StudentGender,
  ParentRelationship,
  RegistrationStatus,
  CreateStudentRegistrationDTO,
} from '../../../src/modules/parent/dtos/parent.dto';
import { ConflictError, ValidationError } from '../../../src/shared/domain/errors/AppError';

describe('ParentService Unit Tests', () => {
  let parentService: ParentService;
  let mockRegistrationRepo: IRegistrationRequestRepository;
  let mockStudentRepo: IStudentRepository;

  const validParentId = new mongoose.Types.ObjectId().toString();
  const validDto: CreateStudentRegistrationDTO = {
    studentFullName: 'Sarah Jenkins',
    dateOfBirth: '2018-04-12',
    gender: StudentGender.FEMALE,
    requestedGrade: 'Grade 3',
    academicYear: '2026-2027',
    previousSchool: 'Greenwood Elementary',
    previousClass: 'Grade 2',
    parentRelationship: ParentRelationship.MOTHER,
  };

  beforeEach(() => {
    mockRegistrationRepo = {
      create: vi.fn(),
      findByParentId: vi.fn(),
      findById: vi.fn(),
      findPendingByParentAndStudent: vi.fn(),
    };

    mockStudentRepo = {
      findByParentId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
    };

    parentService = new ParentService(mockRegistrationRepo, mockStudentRepo);
  });

  describe('createRegistrationRequest', () => {
    it('should successfully create a pending registration request for a student', async () => {
      vi.mocked(mockRegistrationRepo.findPendingByParentAndStudent).mockResolvedValue(null);

      const fakeSavedDoc: any = {
        _id: new mongoose.Types.ObjectId(),
        parentId: new mongoose.Types.ObjectId(validParentId),
        studentFullName: validDto.studentFullName,
        dateOfBirth: new Date(validDto.dateOfBirth),
        gender: validDto.gender,
        requestedGrade: validDto.requestedGrade,
        academicYear: validDto.academicYear,
        previousSchool: validDto.previousSchool,
        previousClass: validDto.previousClass,
        parentRelationship: validDto.parentRelationship,
        status: RegistrationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockRegistrationRepo.create).mockResolvedValue(fakeSavedDoc);

      const result = await parentService.createRegistrationRequest(validParentId, validDto);

      expect(mockRegistrationRepo.findPendingByParentAndStudent).toHaveBeenCalledWith(
        validParentId,
        validDto.studentFullName,
        validDto.requestedGrade
      );
      expect(mockRegistrationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentFullName: validDto.studentFullName,
          requestedGrade: validDto.requestedGrade,
          status: RegistrationStatus.PENDING,
        })
      );
      expect(result.status).toBe(RegistrationStatus.PENDING);
      expect(result.studentFullName).toBe('Sarah Jenkins');
    });

    it('should throw ConflictError if an identical request is already pending review', async () => {
      const existingDoc: any = {
        _id: new mongoose.Types.ObjectId(),
        parentId: new mongoose.Types.ObjectId(validParentId),
        studentFullName: validDto.studentFullName,
        status: RegistrationStatus.PENDING,
      };

      vi.mocked(mockRegistrationRepo.findPendingByParentAndStudent).mockResolvedValue(existingDoc as any);

      await expect(
        parentService.createRegistrationRequest(validParentId, validDto)
      ).rejects.toThrow(ConflictError);

      expect(mockRegistrationRepo.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if parentId is invalid', async () => {
      await expect(
        parentService.createRegistrationRequest('invalid-id', validDto)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getParentDashboard', () => {
    it('should aggregate children and registration requests', async () => {
      const mockChildDoc: any = {
        _id: new mongoose.Types.ObjectId(),
        fullName: 'Oliver Jenkins',
        studentId: 'STU-2025-001',
        grade: 'Grade 5',
        section: 'A',
        classTeacher: 'Mrs. Eleanor Vance',
        status: 'ACTIVE',
        avatarUrl: '',
        rollNumber: '14',
        academicYear: '2026-2027',
      };

      const mockRequestDoc: any = {
        _id: new mongoose.Types.ObjectId(),
        parentId: new mongoose.Types.ObjectId(validParentId),
        studentFullName: 'Sarah Jenkins',
        dateOfBirth: new Date('2018-04-12'),
        gender: StudentGender.FEMALE,
        requestedGrade: 'Grade 3',
        academicYear: '2026-2027',
        parentRelationship: ParentRelationship.MOTHER,
        status: RegistrationStatus.PENDING,
        createdAt: new Date(),
      };

      vi.mocked(mockStudentRepo.findByParentId).mockResolvedValue([mockChildDoc]);
      vi.mocked(mockRegistrationRepo.findByParentId).mockResolvedValue([mockRequestDoc]);

      const dashboard = await parentService.getParentDashboard(validParentId);

      expect(dashboard.children).toHaveLength(1);
      expect(dashboard.children[0].fullName).toBe('Oliver Jenkins');
      expect(dashboard.registrationRequests).toHaveLength(1);
      expect(dashboard.registrationRequests[0].studentFullName).toBe('Sarah Jenkins');
    });
  });

  describe('getSchoolMetadata', () => {
    it('should return available classes, academic years, genders and relationships', () => {
      const meta = parentService.getSchoolMetadata();
      expect(meta.classes.length).toBeGreaterThan(5);
      expect(meta.classes).toContain('Grade 1');
      expect(meta.academicYears).toContain('2026-2027');
      expect(meta.genders.length).toBe(4);
      expect(meta.relationships.length).toBe(4);
    });
  });
});
