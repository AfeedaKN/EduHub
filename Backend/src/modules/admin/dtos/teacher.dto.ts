export type TeacherStatus = 'ACTIVE' | 'INACTIVE';

export interface AssignedClassDTO {
  id?: string;
  classId?: string;
  className: string;
  section: string;
  subject?: string;
  academicYear?: string;
  studentCount?: number;
}

export interface AssignTeacherDTO {
  classId?: string;
  className: string;
  section: string;
  subject: string;
  academicYear?: string;
}

export interface TeacherAssignmentDetailDTO {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmployeeId: string;
  teacherDepartment: string;
  teacherStatus: TeacherStatus;
  classId?: string;
  className: string;
  section: string;
  subject: string;
  academicYear: string;
  studentCount: number;
}

export interface AssignmentFilterDTO {
  academicYear?: string;
  className?: string;
  section?: string;
  subject?: string;
  teacherId?: string;
  search?: string;
}

export interface CreateTeacherDTO {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  employeeId?: string;
  qualification?: string;
  designation?: string;
  department?: string;
  status?: TeacherStatus;
  assignedClasses?: AssignedClassDTO[];
  joiningDate?: string | Date;
}

export interface UpdateTeacherDTO {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  employeeId?: string;
  qualification?: string;
  designation?: string;
  department?: string;
  status?: TeacherStatus;
  assignedClasses?: AssignedClassDTO[];
  joiningDate?: string | Date;
}

export interface TeacherResponseDTO {
  id: string;
  userId: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  qualification: string;
  designation: string;
  department: string;
  status: TeacherStatus;
  assignedClasses: AssignedClassDTO[];
  joiningDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherSummaryDTO {
  totalTeachers: number;
  activeTeachers: number;
  inactiveTeachers: number;
}

export interface TeacherFilterDTO {
  search?: string;
  status?: 'ALL' | 'ACTIVE' | 'INACTIVE' | string;
  department?: string;
}
