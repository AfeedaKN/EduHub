export interface StudentFilterDTO {
  search?: string;
  academicYear?: string;
  grade?: string;
  section?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface StudentSummaryStatsDTO {
  totalStudents: number;
  activeStudents: number;
  pendingAdmissions: number;
  classesWithStudents: number;
}

export interface StudentParentInfoDTO {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  relationship?: string;
  status: string;
}

export interface StudentDirectoryItemDTO {
  id: string;
  fullName: string;
  studentId: string;
  grade: string;
  section: string;
  academicYear: string;
  rollNumber?: string;
  classTeacher?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED';
  avatarUrl?: string;
  parent: StudentParentInfoDTO | null;
  dateOfBirth?: string;
  gender?: string;
  previousSchool?: string;
  enrolledAt: string;
  createdAt: string;
}

export interface StudentDirectoryResponseDTO {
  students: StudentDirectoryItemDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StudentDetailDTO extends StudentDirectoryItemDTO {
  registrationRequestId?: string;
  admissionNotes?: string;
}

export interface UpdateStudentDTO {
  section?: string;
  rollNumber?: string;
  classTeacher?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'GRADUATED';
  grade?: string;
  academicYear?: string;
}
