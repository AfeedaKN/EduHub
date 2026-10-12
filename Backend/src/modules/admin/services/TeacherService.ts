import mongoose from 'mongoose';
import { ITeacherRepository } from '../repositories/TeacherRepository';
import { IPasswordService } from '../../auth/services/PasswordService';
import {
  CreateTeacherDTO,
  UpdateTeacherDTO,
  TeacherResponseDTO,
  TeacherSummaryDTO,
  TeacherFilterDTO,
  TeacherStatus,
} from '../dtos/teacher.dto';
import { ITeacherDoc } from '../models/Teacher.model';
import { UserRole, AccountStatus } from '../../auth/dtos/auth.dto';
import {
  ValidationError,
  ConflictError,
  NotFoundError,
} from '../../../shared/domain/errors/AppError';

export class TeacherService {
  constructor(
    private readonly teacherRepo: ITeacherRepository,
    private readonly passwordService: IPasswordService
  ) {}

  /**
   * Create a new Teacher account (Management-only operation)
   */
  async createTeacher(dto: CreateTeacherDTO): Promise<TeacherResponseDTO> {
    // 1. Validation
    if (!dto.fullName || !dto.fullName.trim()) {
      throw new ValidationError('Teacher full name is required.', 'MISSING_FULL_NAME');
    }

    if (!dto.email || !dto.email.trim()) {
      throw new ValidationError('Teacher email address is required.', 'MISSING_EMAIL');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = dto.email.toLowerCase().trim();
    if (!emailRegex.test(cleanEmail)) {
      throw new ValidationError('A valid email address is required.', 'INVALID_EMAIL');
    }

    if (!dto.phone || !dto.phone.trim()) {
      throw new ValidationError('Teacher phone number is required.', 'MISSING_PHONE');
    }

    if (!dto.password || dto.password.length < 6) {
      throw new ValidationError(
        'Password must be at least 6 characters long.',
        'WEAK_PASSWORD'
      );
    }

    // 2. Uniqueness check for email
    const existingUser = await this.teacherRepo.findUserByEmail(cleanEmail);
    if (existingUser) {
      throw new ConflictError(
        'An account with this email address already exists in the system.',
        'EMAIL_ALREADY_EXISTS'
      );
    }

    const existingTeacher = await this.teacherRepo.findTeacherByEmail(cleanEmail);
    if (existingTeacher) {
      throw new ConflictError(
        'A teacher record with this email address already exists.',
        'TEACHER_EMAIL_EXISTS'
      );
    }

    // 3. Employee ID generation / validation
    let employeeId = dto.employeeId?.trim();
    if (employeeId) {
      const existingEmployee = await this.teacherRepo.findTeacherByEmployeeId(employeeId);
      if (existingEmployee) {
        throw new ConflictError(
          `Staff ID "${employeeId}" is already assigned to another teacher.`,
          'EMPLOYEE_ID_EXISTS'
        );
      }
    } else {
      const nextSeq = await this.teacherRepo.getNextEmployeeSequence();
      employeeId = `TCH-${String(nextSeq).padStart(4, '0')}`;
    }

    // 4. Hash password
    const passwordHash = await this.passwordService.hash(dto.password);

    // 5. Account status
    const status: TeacherStatus = dto.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const userStatus =
      status === 'INACTIVE' ? AccountStatus.DISABLED : AccountStatus.ACTIVE;

    // 6. Create User record
    const createdUser = await this.teacherRepo.createUserForTeacher({
      fullName: dto.fullName.trim(),
      email: cleanEmail,
      phone: dto.phone.trim(),
      passwordHash,
      role: UserRole.TEACHER,
      status: userStatus,
      emailVerifiedAt: new Date(),
      acceptedTerms: true,
      acceptedTermsAt: new Date(),
    });

    // 7. Create Teacher record
    const createdTeacher = await this.teacherRepo.createTeacher({
      userId: createdUser._id,
      employeeId,
      fullName: dto.fullName.trim(),
      email: cleanEmail,
      phone: dto.phone.trim(),
      qualification: dto.qualification?.trim() || '',
      designation: dto.designation?.trim() || 'Teacher',
      department: dto.department?.trim() || 'General',
      status,
      assignedClasses: (dto.assignedClasses || []).map((ac) => ({
        classId: ac.classId ? new mongoose.Types.ObjectId(ac.classId) : undefined,
        className: ac.className,
        section: ac.section,
        subject: ac.subject || '',
      })),
      joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : new Date(),
    });

    return this.mapToDTO(createdTeacher);
  }

  /**
   * Retrieve list of teachers with search and filters
   */
  async getTeachers(filter?: TeacherFilterDTO): Promise<TeacherResponseDTO[]> {
    const teachers = await this.teacherRepo.findAllTeachers(filter);
    return teachers.map((t) => this.mapToDTO(t));
  }

  /**
   * Retrieve teacher details by ID
   */
  async getTeacherById(id: string): Promise<TeacherResponseDTO> {
    const teacher = await this.teacherRepo.findTeacherById(id);
    if (!teacher) {
      throw new NotFoundError('Teacher profile not found.');
    }
    return this.mapToDTO(teacher);
  }

  /**
   * Update teacher details
   */
  async updateTeacher(id: string, dto: UpdateTeacherDTO): Promise<TeacherResponseDTO> {
    const teacher = await this.teacherRepo.findTeacherById(id);
    if (!teacher) {
      throw new NotFoundError('Teacher profile not found.');
    }

    const updateData: Partial<ITeacherDoc> = {};
    const userUpdateData: Record<string, any> = {};

    if (dto.fullName && dto.fullName.trim()) {
      updateData.fullName = dto.fullName.trim();
      userUpdateData.fullName = dto.fullName.trim();
    }

    if (dto.email && dto.email.trim()) {
      const cleanEmail = dto.email.toLowerCase().trim();
      if (cleanEmail !== teacher.email.toLowerCase()) {
        const existing = await this.teacherRepo.findUserByEmail(cleanEmail);
        if (existing && existing._id.toString() !== teacher.userId.toString()) {
          throw new ConflictError(
            'An account with this email address already exists in the system.',
            'EMAIL_ALREADY_EXISTS'
          );
        }
        updateData.email = cleanEmail;
        userUpdateData.email = cleanEmail;
      }
    }

    if (dto.phone && dto.phone.trim()) {
      updateData.phone = dto.phone.trim();
      userUpdateData.phone = dto.phone.trim();
    }

    if (dto.employeeId && dto.employeeId.trim()) {
      const cleanEmpId = dto.employeeId.trim();
      if (cleanEmpId !== teacher.employeeId) {
        const existingEmp = await this.teacherRepo.findTeacherByEmployeeId(cleanEmpId);
        if (existingEmp && existingEmp._id.toString() !== teacher._id.toString()) {
          throw new ConflictError(
            `Staff ID "${cleanEmpId}" is already assigned to another teacher.`,
            'EMPLOYEE_ID_EXISTS'
          );
        }
        updateData.employeeId = cleanEmpId;
      }
    }

    if (dto.qualification !== undefined) {
      updateData.qualification = dto.qualification.trim();
    }

    if (dto.designation !== undefined) {
      updateData.designation = dto.designation.trim();
    }

    if (dto.department !== undefined) {
      updateData.department = dto.department.trim();
    }

    if (dto.status !== undefined) {
      updateData.status = dto.status;
      userUpdateData.status =
        dto.status === 'INACTIVE' ? AccountStatus.DISABLED : AccountStatus.ACTIVE;
    }

    if (dto.assignedClasses !== undefined) {
      updateData.assignedClasses = dto.assignedClasses.map((ac) => ({
        classId: ac.classId ? new mongoose.Types.ObjectId(ac.classId) : undefined,
        className: ac.className,
        section: ac.section,
        subject: ac.subject || '',
      }));
    }

    if (dto.joiningDate !== undefined) {
      updateData.joiningDate = new Date(dto.joiningDate);
    }

    // Optional password reset
    if (dto.password && dto.password.trim()) {
      if (dto.password.length < 6) {
        throw new ValidationError(
          'Password must be at least 6 characters long.',
          'WEAK_PASSWORD'
        );
      }
      userUpdateData.passwordHash = await this.passwordService.hash(dto.password);
    }

    // Update teacher
    const updatedTeacher = await this.teacherRepo.updateTeacher(id, updateData);
    if (!updatedTeacher) {
      throw new NotFoundError('Failed to update teacher profile.');
    }

    // Sync User record
    const userIdStr = this.extractUserId(teacher.userId);
    if (Object.keys(userUpdateData).length > 0 && userIdStr) {
      await this.teacherRepo.updateUserForTeacher(userIdStr, userUpdateData);
    }

    return this.mapToDTO(updatedTeacher);
  }

  /**
   * Activate or Deactivate teacher
   */
  async changeTeacherStatus(id: string, status: TeacherStatus): Promise<TeacherResponseDTO> {
    const teacher = await this.teacherRepo.findTeacherById(id);
    if (!teacher) {
      throw new NotFoundError('Teacher profile not found.');
    }

    const updated = await this.teacherRepo.updateTeacher(id, { status });
    if (!updated) {
      throw new NotFoundError('Failed to update teacher status.');
    }

    // Sync linked user status
    const userIdStr = this.extractUserId(teacher.userId);
    if (userIdStr) {
      await this.teacherRepo.updateUserForTeacher(userIdStr, {
        status: status === 'INACTIVE' ? AccountStatus.DISABLED : AccountStatus.ACTIVE,
      });
    }

    return this.mapToDTO(updated);
  }

  /**
   * Delete teacher profile and associated user
   */
  async deleteTeacher(id: string): Promise<void> {
    const teacher = await this.teacherRepo.findTeacherById(id);
    if (!teacher) {
      throw new NotFoundError('Teacher profile not found.');
    }

    await this.teacherRepo.deleteTeacher(id);
    const userIdStr = this.extractUserId(teacher.userId);
    if (userIdStr) {
      await this.teacherRepo.deleteUser(userIdStr);
    }
  }

  /**
   * Summary Statistics: total, active, and inactive teachers
   */
  async getSummaryStats(): Promise<TeacherSummaryDTO> {
    const [totalTeachers, activeTeachers, inactiveTeachers] = await Promise.all([
      this.teacherRepo.countTeachers(),
      this.teacherRepo.countTeachers('ACTIVE'),
      this.teacherRepo.countTeachers('INACTIVE'),
    ]);

    return {
      totalTeachers,
      activeTeachers,
      inactiveTeachers,
    };
  }

  /**
   * Helper to extract string ID whether userId is populated or raw ObjectId
   */
  private extractUserId(userIdField: any): string {
    if (!userIdField) return '';
    if (typeof userIdField === 'object' && userIdField._id) {
      return userIdField._id.toString();
    }
    return userIdField.toString();
  }

  /**
   * Map database model to safe DTO (NEVER EXPOSES PASSWORD OR PASSWORD HASH)
   */
  private mapToDTO(doc: ITeacherDoc): TeacherResponseDTO {
    return {
      id: doc._id.toString(),
      userId: this.extractUserId(doc.userId),
      employeeId: doc.employeeId,
      fullName: doc.fullName,
      email: doc.email,
      phone: doc.phone,
      qualification: doc.qualification || '',
      designation: doc.designation || 'Teacher',
      department: doc.department || 'General',
      status: doc.status,
      assignedClasses: (doc.assignedClasses || []).map((ac) => ({
        classId: ac.classId ? ac.classId.toString() : undefined,
        className: ac.className,
        section: ac.section,
        subject: ac.subject || '',
      })),
      joiningDate: doc.joiningDate ? doc.joiningDate.toISOString() : '',
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : '',
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : '',
    };
  }
}
