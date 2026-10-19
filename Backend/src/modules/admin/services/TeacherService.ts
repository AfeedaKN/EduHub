import mongoose from 'mongoose';
import { ITeacherRepository } from '../repositories/TeacherRepository';
import { IClassRepository } from '../repositories/ClassRepository';
import { IPasswordService } from '../../auth/services/PasswordService';
import {
  CreateTeacherDTO,
  UpdateTeacherDTO,
  TeacherResponseDTO,
  TeacherSummaryDTO,
  TeacherFilterDTO,
  TeacherStatus,
  AssignTeacherDTO,
  TeacherAssignmentDetailDTO,
  AssignmentFilterDTO,
} from '../dtos/teacher.dto';
import { ITeacherDoc, ITeacherAssignedClass } from '../models/Teacher.model';
import { UserRole, AccountStatus } from '../../auth/dtos/auth.dto';
import {
  ValidationError,
  ConflictError,
  NotFoundError,
} from '../../../shared/domain/errors/AppError';

export const DEPARTMENT_SUBJECT_COMPATIBILITY: Record<string, string[]> = {
  Mathematics: [
    'math',
    'mathematics',
    'algebra',
    'geometry',
    'calculus',
    'statistics',
    'trigonometry',
    'arithmetic',
    'applied math',
  ],
  Science: [
    'science',
    'physics',
    'chemistry',
    'biology',
    'botany',
    'zoology',
    'environmental science',
    'general science',
  ],
  English: [
    'english',
    'english literature',
    'literature',
    'grammar',
    'reading',
    'writing',
    'creative writing',
    'english language',
  ],
  'Social Studies': [
    'social studies',
    'history',
    'geography',
    'civics',
    'economics',
    'political science',
    'sociology',
  ],
  'Computer Science': [
    'computer science',
    'cs',
    'informatics',
    'information technology',
    'coding',
    'programming',
    'robotics',
    'ai',
  ],
  Languages: [
    'language',
    'languages',
    'french',
    'spanish',
    'german',
    'hindi',
    'arabic',
    'mandarin',
    'sanskrit',
    'malayalam',
    'tamil',
    'urdu',
    'latin',
  ],
  'Arts & Music': [
    'art',
    'arts',
    'music',
    'drawing',
    'painting',
    'drama',
    'theatre',
    'fine arts',
    'sculpture',
    'craft',
  ],
  'Physical Education': [
    'physical education',
    'pe',
    'sports',
    'health',
    'fitness',
    'athletics',
    'games',
    'yoga',
  ],
  General: [],
};

export class TeacherService {
  constructor(
    private readonly teacherRepo: ITeacherRepository,
    private readonly passwordService: IPasswordService,
    private readonly classRepo?: IClassRepository
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
        academicYear: ac.academicYear || '2026-2027',
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
        academicYear: ac.academicYear || '2026-2027',
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
  private extractUserId(
    userIdField: { _id?: unknown; toString(): string } | string | null | undefined
  ): string {
    if (!userIdField) return '';
    if (typeof userIdField === 'object' && '_id' in userIdField && userIdField._id) {
      return String(userIdField._id);
    }
    return userIdField.toString();
  }

  /**
   * Validate subject compatibility with teacher's department
   */
  validateSubjectCompatibility(department: string, subject: string): void {
    if (!subject || !subject.trim()) {
      throw new ValidationError('Subject name is required for assignment.', 'MISSING_SUBJECT');
    }

    const cleanDept = (department || 'General').trim();
    if (cleanDept.toLowerCase() === 'general') {
      return;
    }

    const keywords = DEPARTMENT_SUBJECT_COMPATIBILITY[cleanDept];
    if (!keywords || keywords.length === 0) {
      return;
    }

    const cleanSubject = subject.trim().toLowerCase();
    const isCompatible = keywords.some(
      (kw) => cleanSubject.includes(kw) || kw.includes(cleanSubject)
    );

    if (!isCompatible) {
      throw new ValidationError(
        `Subject "${subject.trim()}" is not compatible with teacher's department "${cleanDept}".`,
        'SUBJECT_INCOMPATIBLE'
      );
    }
  }

  /**
   * Validate class exists and is active, section exists for class and is active, and academic year matches
   */
  async validateClassAndSection(
    classId: string | undefined,
    className: string,
    section: string,
    academicYear?: string
  ): Promise<{ resolvedClassId: mongoose.Types.ObjectId; resolvedYear: string }> {
    if (!className || !className.trim()) {
      throw new ValidationError('Class name is required for assignment.', 'MISSING_CLASS_NAME');
    }
    if (!section || !section.trim()) {
      throw new ValidationError('Section name is required for assignment.', 'MISSING_SECTION');
    }

    if (!this.classRepo) {
      return {
        resolvedClassId:
          classId && mongoose.Types.ObjectId.isValid(classId)
            ? new mongoose.Types.ObjectId(classId)
            : new mongoose.Types.ObjectId(),
        resolvedYear: academicYear || '2026-2027',
      };
    }

    let classDoc = null;
    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      classDoc = await this.classRepo.findClassById(classId);
    } else {
      classDoc = await this.classRepo.findClassByName(className.trim(), academicYear);
    }

    if (!classDoc) {
      throw new NotFoundError(
        `Class "${className.trim()}" was not found in the academic directory.`,
        'CLASS_NOT_FOUND'
      );
    }

    if (classDoc.status === 'INACTIVE') {
      throw new ValidationError(
        `Cannot assign to inactive class "${classDoc.name}".`,
        'CLASS_INACTIVE'
      );
    }

    const resolvedYear =
      (academicYear && academicYear.trim()) || classDoc.academicYear || '2026-2027';
    if (
      academicYear &&
      classDoc.academicYear &&
      academicYear.trim() !== classDoc.academicYear.trim()
    ) {
      throw new ValidationError(
        `Class "${classDoc.name}" belongs to academic year ${classDoc.academicYear}, but ${academicYear} was specified.`,
        'ACADEMIC_YEAR_MISMATCH'
      );
    }

    const cleanSection = section.trim().toUpperCase();
    const sectionDoc = await this.classRepo.findSectionByClassAndName(
      classDoc._id.toString(),
      cleanSection
    );
    if (!sectionDoc) {
      throw new NotFoundError(
        `Section "${cleanSection}" does not exist for class "${classDoc.name}".`,
        'SECTION_NOT_FOUND'
      );
    }

    if (sectionDoc.status === 'INACTIVE') {
      throw new ValidationError(
        `Cannot assign to inactive section "${cleanSection}" in class "${classDoc.name}".`,
        'SECTION_INACTIVE'
      );
    }

    return {
      resolvedClassId: classDoc._id,
      resolvedYear,
    };
  }

  /**
   * Validate teacher status is ACTIVE
   */
  validateTeacherActive(teacher: ITeacherDoc): void {
    if (teacher.status !== 'ACTIVE') {
      throw new ValidationError(
        `Cannot assign classes to teacher "${teacher.fullName}" because the account is INACTIVE. Please activate the teacher account first.`,
        'TEACHER_INACTIVE'
      );
    }
  }

  /**
   * Prevent duplicate active assignments
   */
  async checkDuplicateAssignment(
    teacherId: string,
    className: string,
    section: string,
    subject: string,
    academicYear: string,
    excludeAssignmentId?: string
  ): Promise<void> {
    const conflict = await this.teacherRepo.findAssignmentConflict({
      className,
      section,
      subject,
      academicYear,
      excludeTeacherId: teacherId,
      excludeAssignmentId,
    });

    if (conflict) {
      if (conflict.teacherId === teacherId) {
        throw new ConflictError(
          `Teacher is already actively assigned to ${className} - Section ${section} for ${subject} (${academicYear}).`,
          'DUPLICATE_TEACHER_ASSIGNMENT'
        );
      } else {
        throw new ConflictError(
          `${className} - Section ${section} for subject "${subject}" (${academicYear}) is already actively assigned to ${conflict.teacherName} (${conflict.employeeId}).`,
          'DUPLICATE_CLASS_ASSIGNMENT'
        );
      }
    }
  }

  /**
   * Calculate student count from officially enrolled students in assigned section
   */
  private async getEnrolledStudentCount(
    grade: string,
    section: string,
    academicYear?: string
  ): Promise<number> {
    if (this.classRepo && typeof this.classRepo.countEnrolledStudents === 'function') {
      return await this.classRepo.countEnrolledStudents(grade, section, academicYear);
    }
    return 0;
  }

  /**
   * Assign a teacher to a class, section, subject, and academic year
   */
  async assignTeacherToClass(
    teacherId: string,
    dto: AssignTeacherDTO
  ): Promise<TeacherAssignmentDetailDTO> {
    if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
      throw new ValidationError('Invalid teacher ID.', 'INVALID_ID');
    }

    const teacher = await this.teacherRepo.findTeacherById(teacherId);
    if (!teacher) {
      throw new NotFoundError('Teacher profile not found.');
    }

    this.validateTeacherActive(teacher);
    this.validateSubjectCompatibility(teacher.department, dto.subject);

    const { resolvedClassId, resolvedYear } = await this.validateClassAndSection(
      dto.classId,
      dto.className,
      dto.section,
      dto.academicYear
    );

    const cleanClassName = dto.className.trim();
    const cleanSection = dto.section.trim().toUpperCase();
    const cleanSubject = dto.subject.trim();

    await this.checkDuplicateAssignment(
      teacher._id.toString(),
      cleanClassName,
      cleanSection,
      cleanSubject,
      resolvedYear
    );

    const newAssignment: ITeacherAssignedClass = {
      classId: resolvedClassId,
      className: cleanClassName,
      section: cleanSection,
      subject: cleanSubject,
      academicYear: resolvedYear,
    };

    const updated = await this.teacherRepo.addAssignment(teacherId, newAssignment);
    if (!updated) {
      throw new NotFoundError('Failed to record class assignment.');
    }

    const addedSubdoc = updated.assignedClasses[updated.assignedClasses.length - 1];
    const assignmentId = (addedSubdoc as any)?._id ? (addedSubdoc as any)._id.toString() : '';

    const studentCount = await this.getEnrolledStudentCount(
      cleanClassName,
      cleanSection,
      resolvedYear
    );

    return {
      id: assignmentId,
      teacherId: updated._id.toString(),
      teacherName: updated.fullName,
      teacherEmployeeId: updated.employeeId,
      teacherDepartment: updated.department,
      teacherStatus: updated.status,
      classId: resolvedClassId.toString(),
      className: cleanClassName,
      section: cleanSection,
      subject: cleanSubject,
      academicYear: resolvedYear,
      studentCount,
    };
  }

  /**
   * Update an existing teacher assignment
   */
  async updateTeacherAssignment(
    teacherId: string,
    assignmentId: string,
    dto: AssignTeacherDTO
  ): Promise<TeacherAssignmentDetailDTO> {
    if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
      throw new ValidationError('Invalid teacher ID.', 'INVALID_ID');
    }
    if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw new ValidationError('Invalid assignment ID.', 'INVALID_ID');
    }

    const teacher = await this.teacherRepo.findTeacherById(teacherId);
    if (!teacher) {
      throw new NotFoundError('Teacher profile not found.');
    }

    const existing = (teacher.assignedClasses || []).find(
      (ac) => (ac as any)._id && (ac as any)._id.toString() === assignmentId
    );
    if (!existing) {
      throw new NotFoundError('Assignment record not found for this teacher.');
    }

    this.validateTeacherActive(teacher);
    this.validateSubjectCompatibility(teacher.department, dto.subject);

    const { resolvedClassId, resolvedYear } = await this.validateClassAndSection(
      dto.classId,
      dto.className,
      dto.section,
      dto.academicYear
    );

    const cleanClassName = dto.className.trim();
    const cleanSection = dto.section.trim().toUpperCase();
    const cleanSubject = dto.subject.trim();

    await this.checkDuplicateAssignment(
      teacher._id.toString(),
      cleanClassName,
      cleanSection,
      cleanSubject,
      resolvedYear,
      assignmentId
    );

    const updated = await this.teacherRepo.updateAssignment(teacherId, assignmentId, {
      classId: resolvedClassId,
      className: cleanClassName,
      section: cleanSection,
      subject: cleanSubject,
      academicYear: resolvedYear,
    });

    if (!updated) {
      throw new NotFoundError('Failed to update class assignment.');
    }

    const studentCount = await this.getEnrolledStudentCount(
      cleanClassName,
      cleanSection,
      resolvedYear
    );

    return {
      id: assignmentId,
      teacherId: updated._id.toString(),
      teacherName: updated.fullName,
      teacherEmployeeId: updated.employeeId,
      teacherDepartment: updated.department,
      teacherStatus: updated.status,
      classId: resolvedClassId.toString(),
      className: cleanClassName,
      section: cleanSection,
      subject: cleanSubject,
      academicYear: resolvedYear,
      studentCount,
    };
  }

  /**
   * Remove an assignment from a teacher
   */
  async removeTeacherAssignment(teacherId: string, assignmentId: string): Promise<void> {
    if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
      throw new ValidationError('Invalid teacher ID.', 'INVALID_ID');
    }
    if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw new ValidationError('Invalid assignment ID.', 'INVALID_ID');
    }

    const teacher = await this.teacherRepo.findTeacherById(teacherId);
    if (!teacher) {
      throw new NotFoundError('Teacher profile not found.');
    }

    const existing = (teacher.assignedClasses || []).find(
      (ac) => (ac as any)._id && (ac as any)._id.toString() === assignmentId
    );
    if (!existing) {
      throw new NotFoundError('Assignment record not found for this teacher.');
    }

    await this.teacherRepo.removeAssignment(teacherId, assignmentId);
  }

  /**
   * Get all assignments for a specific teacher with real student counts
   */
  async getTeacherAssignments(teacherId: string): Promise<TeacherAssignmentDetailDTO[]> {
    if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
      throw new ValidationError('Invalid teacher ID.', 'INVALID_ID');
    }

    const teacher = await this.teacherRepo.findTeacherById(teacherId);
    if (!teacher) {
      throw new NotFoundError('Teacher profile not found.');
    }

    return await Promise.all(
      (teacher.assignedClasses || []).map(async (ac) => {
        const studentCount = await this.getEnrolledStudentCount(
          ac.className,
          ac.section,
          ac.academicYear
        );

        return {
          id: (ac as any)._id ? (ac as any)._id.toString() : '',
          teacherId: teacher._id.toString(),
          teacherName: teacher.fullName,
          teacherEmployeeId: teacher.employeeId,
          teacherDepartment: teacher.department,
          teacherStatus: teacher.status,
          classId: ac.classId ? ac.classId.toString() : undefined,
          className: ac.className,
          section: ac.section,
          subject: ac.subject || '',
          academicYear: ac.academicYear || '2026-2027',
          studentCount,
        };
      })
    );
  }

  /**
   * Get all assignments across all teachers with optional filtering
   */
  async getAllAssignments(filter?: AssignmentFilterDTO): Promise<TeacherAssignmentDetailDTO[]> {
    const teachers = await this.teacherRepo.findAllTeachers();
    const results: TeacherAssignmentDetailDTO[] = [];

    for (const teacher of teachers) {
      if (filter?.teacherId && teacher._id.toString() !== filter.teacherId) {
        continue;
      }

      for (const ac of teacher.assignedClasses || []) {
        const acYear = ac.academicYear || '2026-2027';

        if (
          filter?.academicYear &&
          filter.academicYear !== 'ALL' &&
          acYear !== filter.academicYear
        ) {
          continue;
        }

        if (
          filter?.className &&
          filter.className !== 'ALL' &&
          ac.className.toLowerCase() !== filter.className.toLowerCase()
        ) {
          continue;
        }

        if (
          filter?.section &&
          filter.section !== 'ALL' &&
          ac.section.toLowerCase() !== filter.section.toLowerCase()
        ) {
          continue;
        }

        if (
          filter?.subject &&
          filter.subject.trim() &&
          !ac.subject?.toLowerCase().includes(filter.subject.trim().toLowerCase())
        ) {
          continue;
        }

        if (filter?.search && filter.search.trim()) {
          const s = filter.search.trim().toLowerCase();
          const matches =
            teacher.fullName.toLowerCase().includes(s) ||
            teacher.employeeId.toLowerCase().includes(s) ||
            ac.className.toLowerCase().includes(s) ||
            ac.section.toLowerCase().includes(s) ||
            (ac.subject && ac.subject.toLowerCase().includes(s));
          if (!matches) continue;
        }

        const studentCount = await this.getEnrolledStudentCount(
          ac.className,
          ac.section,
          ac.academicYear
        );

        results.push({
          id: (ac as any)._id ? (ac as any)._id.toString() : '',
          teacherId: teacher._id.toString(),
          teacherName: teacher.fullName,
          teacherEmployeeId: teacher.employeeId,
          teacherDepartment: teacher.department,
          teacherStatus: teacher.status,
          classId: ac.classId ? ac.classId.toString() : undefined,
          className: ac.className,
          section: ac.section,
          subject: ac.subject || '',
          academicYear: acYear,
          studentCount,
        });
      }
    }

    return results;
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
        id: (ac as any)._id ? (ac as any)._id.toString() : undefined,
        classId: ac.classId ? ac.classId.toString() : undefined,
        className: ac.className,
        section: ac.section,
        subject: ac.subject || '',
        academicYear: ac.academicYear || '2026-2027',
      })),
      joiningDate: doc.joiningDate ? doc.joiningDate.toISOString() : '',
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : '',
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : '',
    };
  }
}
