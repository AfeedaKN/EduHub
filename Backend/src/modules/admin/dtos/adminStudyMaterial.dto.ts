import { StudyMaterialStatus, StudyMaterialType } from '../../teacher/models/StudyMaterial.model';

export interface AdminStudyMaterialSummaryDTO {
  totalMaterials: number;
  publishedMaterials: number;
  draftMaterials: number;
  totalTeachersUploading: number;
}

export interface AdminStudyMaterialListItemDTO {
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

export interface AdminStudyMaterialFilterQueryDTO {
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

export interface AdminStudyMaterialListResponseDTO {
  materials: AdminStudyMaterialListItemDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminStudyMaterialMetadataDTO {
  academicYears: string[];
  teachers: Array<{ id: string; name: string }>;
  classes: string[];
  sections: string[];
  subjects: string[];
}
