export interface ParentFilterDTO {
  search?: string;
  studentStatus?: 'ALL' | 'WITH_CHILDREN' | 'WITHOUT_CHILDREN';
  status?: string;
  page?: number;
  limit?: number;
}

export interface ParentSummaryStatsDTO {
  totalParents: number;
  parentsWithChildren: number;
  parentsWithoutChildren: number;
  multipleChildrenFamilies: number;
}

export interface ParentLinkedChildDTO {
  id: string;
  fullName: string;
  studentId: string;
  grade: string;
  section: string;
  status: string;
  academicYear?: string;
  classTeacher?: string;
  rollNumber?: string;
}

export interface ParentAdmissionRequestSummaryDTO {
  id: string;
  studentFullName: string;
  requestedGrade: string;
  academicYear: string;
  status: string;
  submissionDate: string;
  rejectionReason?: string;
}

export interface ParentDirectoryItemDTO {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  linkedChildren: ParentLinkedChildDTO[];
  linkedChildrenCount: number;
  createdAt: string;
}

export interface ParentDirectoryResponseDTO {
  parents: ParentDirectoryItemDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ParentDetailDTO {
  parent: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    createdAt: string;
  };
  linkedChildren: ParentLinkedChildDTO[];
  admissionRequests: ParentAdmissionRequestSummaryDTO[];
}

export interface UpdateParentStatusDTO {
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}
