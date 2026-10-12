export interface AdminPendingAdmissionSummaryDTO {
  id: string;
  studentFullName: string;
  requestedGrade: string;
  academicYear?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  submissionDate: string;
  status: string;
  dateOfBirth?: string;
  gender?: string;
  previousSchool?: string;
  previousClass?: string;
  parentRelationship?: string;
  rejectionReason?: string;
  notes?: string;
  documents?: Array<{
    name: string;
    url: string;
    fileType?: string;
  }>;
  reviewedBy?: string;
  reviewedAt?: string;
  createdStudentId?: string;
}

export interface ClassCapacityDTO {
  grade: string;
  section: string;
  maxCapacity: number;
  currentlyEnrolled: number;
  availableSeats: number;
  isAtCapacity: boolean;
}

export interface AdminAdmissionDetailDTO extends AdminPendingAdmissionSummaryDTO {
  capacity: ClassCapacityDTO;
}

export interface AdmissionsSummaryCountDTO {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalCount: number;
}

export interface ApproveAdmissionDTO {
  section?: string;
  notes?: string;
}

export interface RejectAdmissionDTO {
  rejectionReason: string;
}

export interface ApprovalResultDTO {
  request: AdminPendingAdmissionSummaryDTO;
  student: {
    id: string;
    fullName: string;
    studentId: string;
    grade: string;
    section: string;
    status: string;
  };
  message: string;
}

export interface RejectionResultDTO {
  request: AdminPendingAdmissionSummaryDTO;
  message: string;
}

export interface AdminDashboardSummaryDTO {
  totalStudents: number;
  totalTeachers: number;
  pendingAdmissionsCount: number;
  recentPendingAdmissions: AdminPendingAdmissionSummaryDTO[];
  attendanceSummary: {
    overallPercentage: number;
    presentCount: number;
    absentCount: number;
    date: string;
  } | null;
  feesSummary: {
    pendingAmount: number;
    currency: string;
  } | null;
  upcomingActivities: Array<{
    id: string;
    title: string;
    date: string;
    category?: string;
  }> | null;
}
