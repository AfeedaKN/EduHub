import { SubjectCategory, SubjectStatus } from '../models/Subject.model';

export interface ApplicableClassDTO {
  classId: string;
  className: string;
}

export interface CreateSubjectDTO {
  name: string;
  code: string;
  category?: SubjectCategory;
  description?: string;
  applicableClasses?: ApplicableClassDTO[];
  academicYear?: string;
  status?: SubjectStatus;
}

export interface UpdateSubjectDTO {
  name?: string;
  code?: string;
  category?: SubjectCategory;
  description?: string;
  applicableClasses?: ApplicableClassDTO[];
  academicYear?: string;
  status?: SubjectStatus;
}

export interface SubjectFilterOptions {
  search?: string;
  category?: string;
  classId?: string;
  className?: string;
  academicYear?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort?: 'name_asc' | 'name_desc' | 'code_asc' | 'code_desc' | 'newest' | 'oldest';
}

export interface SubjectSummaryStatsDTO {
  totalSubjects: number;
  activeSubjects: number;
  assignedSubjects: number;
  unassignedSubjects: number;
}

export interface AssignedTeacherInfoDTO {
  id: string;
  teacherId: string;
  fullName: string;
  employeeId: string;
  email: string;
  phone: string;
  department: string;
  className: string;
  section: string;
  academicYear: string;
}

export interface SubjectResponseDTO {
  id: string;
  name: string;
  code: string;
  category: SubjectCategory;
  categoryLabel: string;
  description: string;
  applicableClasses: ApplicableClassDTO[];
  academicYear: string;
  status: SubjectStatus;
  assignedTeachers: AssignedTeacherInfoDTO[];
  assignedTeachersCount: number;
  associatedClassesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectListResponseDTO {
  subjects: SubjectResponseDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SubjectReferencesDTO {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  timetableCount: number;
  examScheduleCount: number;
  assignmentCount: number;
  teacherAssignmentCount: number;
  totalReferences: number;
  hasActiveReferences: boolean;
  referenceSummary: string;
}
