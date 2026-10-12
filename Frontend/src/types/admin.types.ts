export interface AdminPendingAdmission {
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

export interface ClassCapacity {
  grade: string;
  section: string;
  maxCapacity: number;
  currentlyEnrolled: number;
  availableSeats: number;
  isAtCapacity: boolean;
}

export interface AdminAdmissionDetail extends AdminPendingAdmission {
  capacity?: ClassCapacity;
}

export interface AdmissionsSummaryCounts {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalCount: number;
}

export interface ApproveAdmissionPayload {
  section?: string;
  notes?: string;
}

export interface RejectAdmissionPayload {
  rejectionReason: string;
}

export interface ApprovalResult {
  request: AdminPendingAdmission;
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

export interface RejectionResult {
  request: AdminPendingAdmission;
  message: string;
}

export interface AttendanceSummary {
  overallPercentage: number;
  presentCount: number;
  absentCount: number;
  date: string;
}

export interface FeesSummary {
  pendingAmount: number;
  currency: string;
}

export interface SchoolActivity {
  id: string;
  title: string;
  date: string;
  category?: string;
}

export interface AdminDashboardData {
  totalStudents: number;
  totalTeachers: number;
  pendingAdmissionsCount: number;
  recentPendingAdmissions: AdminPendingAdmission[];
  attendanceSummary: AttendanceSummary | null;
  feesSummary: FeesSummary | null;
  upcomingActivities: SchoolActivity[] | null;
}

export type ClassStatus = 'ACTIVE' | 'INACTIVE';
export type SectionStatus = 'ACTIVE' | 'INACTIVE';

export interface SectionDetail {
  id: string;
  classId: string;
  className: string;
  name: string;
  academicYear: string;
  capacity: number;
  enrolledCount: number;
  availableSeats: number;
  roomNumber?: string;
  status: SectionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ClassDetail {
  id: string;
  name: string;
  academicYear: string;
  description?: string;
  status: ClassStatus;
  sectionsCount: number;
  totalEnrolled: number;
  totalCapacity: number;
  availableSeats: number;
  sections: SectionDetail[];
  createdAt: string;
  updatedAt: string;
}

export interface ClassSummaryStats {
  totalClasses: number;
  totalSections: number;
  totalEnrolledStudents: number;
  totalAvailableSeats: number;
}

export interface CreateClassPayload {
  name: string;
  academicYear: string;
  description?: string;
}

export interface UpdateClassPayload {
  name?: string;
  academicYear?: string;
  description?: string;
  status?: ClassStatus;
}

export interface CreateSectionPayload {
  name: string;
  capacity: number;
  roomNumber?: string;
}

export interface UpdateSectionPayload {
  name?: string;
  capacity?: number;
  roomNumber?: string;
  status?: SectionStatus;
}

export type TeacherStatus = 'ACTIVE' | 'INACTIVE';

export interface AssignedClass {
  classId?: string;
  className: string;
  section: string;
  subject?: string;
}

export interface TeacherDetail {
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
  assignedClasses: AssignedClass[];
  joiningDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherSummaryStats {
  totalTeachers: number;
  activeTeachers: number;
  inactiveTeachers: number;
}

export interface CreateTeacherPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  employeeId?: string;
  qualification?: string;
  designation?: string;
  department?: string;
  status?: TeacherStatus;
  assignedClasses?: AssignedClass[];
  joiningDate?: string;
}

export interface UpdateTeacherPayload {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  employeeId?: string;
  qualification?: string;
  designation?: string;
  department?: string;
  status?: TeacherStatus;
  assignedClasses?: AssignedClass[];
  joiningDate?: string;
}

