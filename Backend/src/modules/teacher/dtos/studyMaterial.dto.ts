import { StudyMaterialStatus, StudyMaterialType } from '../models/StudyMaterial.model';

export interface StudyMaterialDTO {
  id: string;
  title: string;
  description?: string;
  teacherId: string;
  teacherUserId: string;
  teacherName: string;
  classId?: string;
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

export interface CreateStudyMaterialDTO {
  title: string;
  description?: string;
  className: string;
  section: string;
  subject: string;
  academicYear?: string;
  materialType?: StudyMaterialType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  externalUrl?: string;
  status?: StudyMaterialStatus;
}

export interface UpdateStudyMaterialDTO {
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

export interface StudyMaterialFilterParamsDTO {
  className?: string;
  section?: string;
  subject?: string;
  academicYear?: string;
  status?: StudyMaterialStatus | 'ALL';
  materialType?: StudyMaterialType | 'ALL';
  search?: string;
}

export interface StudyMaterialsListResponseDTO {
  materials: StudyMaterialDTO[];
  summary: {
    total: number;
    published: number;
    draft: number;
  };
}
