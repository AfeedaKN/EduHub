import mongoose from 'mongoose';
import { IStudentDirectoryRepository } from '../repositories/StudentDirectoryRepository';
import {
  StudentFilterDTO,
  StudentSummaryStatsDTO,
  StudentDirectoryResponseDTO,
  StudentDetailDTO,
  UpdateStudentDTO,
} from '../dtos/studentDirectory.dto';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors/AppError';

export interface IStudentDirectoryService {
  getSummaryStats(): Promise<StudentSummaryStatsDTO>;
  getStudents(filter: StudentFilterDTO): Promise<StudentDirectoryResponseDTO>;
  getStudentById(id: string): Promise<StudentDetailDTO>;
  updateStudent(id: string, dto: UpdateStudentDTO): Promise<StudentDetailDTO>;
}

export class StudentDirectoryService implements IStudentDirectoryService {
  constructor(private readonly studentDirectoryRepo: IStudentDirectoryRepository) {}

  async getSummaryStats(): Promise<StudentSummaryStatsDTO> {
    return await this.studentDirectoryRepo.getSummaryStats();
  }

  async getStudents(filter: StudentFilterDTO): Promise<StudentDirectoryResponseDTO> {
    return await this.studentDirectoryRepo.findStudents(filter);
  }

  async getStudentById(id: string): Promise<StudentDetailDTO> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid student ID format.', 'INVALID_STUDENT_ID');
    }

    const student = await this.studentDirectoryRepo.findStudentById(id);
    if (!student) {
      throw new NotFoundError(`Student with ID ${id} was not found.`, 'STUDENT_NOT_FOUND');
    }

    return student;
  }

  async updateStudent(id: string, dto: UpdateStudentDTO): Promise<StudentDetailDTO> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid student ID format.', 'INVALID_STUDENT_ID');
    }

    const existing = await this.studentDirectoryRepo.findStudentById(id);
    if (!existing) {
      throw new NotFoundError(`Student with ID ${id} was not found.`, 'STUDENT_NOT_FOUND');
    }

    const updateFields: Record<string, any> = {};

    if (dto.section !== undefined) {
      updateFields.section = dto.section.trim();
    }
    if (dto.rollNumber !== undefined) {
      updateFields.rollNumber = dto.rollNumber.trim();
    }
    if (dto.classTeacher !== undefined) {
      updateFields.classTeacher = dto.classTeacher.trim();
    }
    if (dto.status !== undefined) {
      updateFields.status = dto.status;
    }
    if (dto.grade !== undefined) {
      updateFields.grade = dto.grade.trim();
    }
    if (dto.academicYear !== undefined) {
      updateFields.academicYear = dto.academicYear.trim();
    }

    await this.studentDirectoryRepo.updateStudent(id, updateFields);

    const updated = await this.studentDirectoryRepo.findStudentById(id);
    if (!updated) {
      throw new NotFoundError(`Student with ID ${id} was not found after update.`, 'STUDENT_NOT_FOUND');
    }

    return updated;
  }
}
