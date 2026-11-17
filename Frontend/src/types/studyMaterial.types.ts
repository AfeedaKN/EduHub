export type StudyMaterialStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type StudyMaterialType = 'DOCUMENT' | 'VIDEO' | 'LINK';

// Teacher Interfaces
export interface TeacherStudyMaterial {
  id: string;
  title: string;
  description?: string;
  teacherId: string;
  teacherUserId: string;
  teacherName: string;
  className: string;
  section: string;
  subject: string;
  academicYear: string;
  materialType: StudyMaterialType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  externalUrl?: string;
  status: StudyMaterialStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudyMaterialPayload {
  title: string;
  description?: string;
  className: string;
  section: string;
  subject: string;
  academicYear?: string;
  materialType: StudyMaterialType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  externalUrl?: string;
  status: StudyMaterialStatus;
}

export interface UpdateStudyMaterialPayload {
  title?: string;
  description?: string;
  className?: string;
  section?: string;
  subject?: string;
  academicYear?: string;
  materialType?: StudyMaterialType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  externalUrl?: string;
  status?: StudyMaterialStatus;
}

export interface TeacherStudyMaterialsResponse {
  materials: TeacherStudyMaterial[];
  summary: {
    total: number;
    published: number;
    draft: number;
  };
}

export interface TeacherStudyMaterialFilters {
  className?: string;
  section?: string;
  subject?: string;
  academicYear?: string;
  status?: string;
  materialType?: string;
  search?: string;
}

// Parent Interfaces
export interface ChildProfile {
  id: string;
  fullName: string;
  studentId: string;
  grade: string;
  section: string;
  classTeacher: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED';
  avatarUrl?: string;
  rollNumber?: string;
  academicYear?: string;
}

export interface ParentStudyMaterialItem {
  id: string;
  title: string;
  description: string;
  teacherName: string;
  className: string;
  section: string;
  subject: string;
  academicYear: string;
  materialType: StudyMaterialType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  externalUrl: string;
  createdAt: string;
}

export interface ParentStudyMaterialsResponse {
  children: ChildProfile[];
  selectedChild: ChildProfile | null;
  materials: ParentStudyMaterialItem[];
  subjects: string[];
  academicYears: string[];
}

export interface ParentStudyMaterialsQuery {
  studentId?: string;
  subject?: string;
  academicYear?: string;
  materialType?: string;
  search?: string;
}

// Admin Interfaces
export interface AdminStudyMaterialSummary {
  totalMaterials: number;
  publishedMaterials: number;
  draftMaterials: number;
  totalTeachersUploading: number;
}

export interface AdminStudyMaterialListItem {
  id: string;
  title: string;
  description?: string;
  teacherId: string;
  teacherUserId: string;
  teacherName: string;
  className: string;
  section: string;
  subject: string;
  academicYear: string;
  materialType: StudyMaterialType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  externalUrl?: string;
  status: StudyMaterialStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStudyMaterialFilterParams {
  academicYear?: string;
  teacherId?: string;
  className?: string;
  section?: string;
  subject?: string;
  status?: string;
  materialType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminStudyMaterialListResponse {
  materials: AdminStudyMaterialListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminStudyMaterialMetadata {
  academicYears: string[];
  teachers: Array<{ id: string; name: string }>;
  classes: string[];
  sections: string[];
  subjects: string[];
}
