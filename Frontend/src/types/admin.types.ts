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
  lateCount: number;
  totalMarked: number;
  sectionsSubmitted: number;
  totalSections: number;
  date: string;
  status: 'RECORDED' | 'PENDING' | 'PARTIAL';
}

export interface FeesSummary {
  pendingAmount: number;
  currency: string;
}

export interface ClassEnrollmentBar {
  className: string;
  count: number;
}

export interface ExamOverview {
  pendingReviewCount: number;
  publishedCount: number;
  scheduledExamsCount: number;
  recentExams: Array<{
    id: string;
    name: string;
    academicYear: string;
    status: string;
    startDate: string;
    endDate: string;
  }>;
}

export interface RecentSchoolActivity {
  id: string;
  type:
  | 'ADMISSION_APPROVED'
  | 'ADMISSION_REJECTED'
  | 'MARKS_SUBMITTED'
  | 'MARKS_PUBLISHED'
  | 'EXAM_SCHEDULED'
  | 'STUDENT_ENROLLED';
  title: string;
  description: string;
  timestamp: string;
  date: string;
  badgeText: string;
  badgeVariant: 'success' | 'warning' | 'info' | 'danger';
}

export interface SchoolActivity {
  id: string;
  title: string;
  date: string;
  time?: string;
  category?: string;
  audience?: string;
  linkUrl?: string;
}

export interface AdminDashboardData {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  totalTeachers: number;
  pendingAdmissionsCount: number;
  recentPendingAdmissions: AdminPendingAdmission[];
  attendanceSummary: AttendanceSummary | null;
  feesSummary: FeesSummary | null;
  enrollmentByClass: ClassEnrollmentBar[];
  examOverview: ExamOverview;
  recentActivities: RecentSchoolActivity[];
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
  id?: string;
  classId?: string;
  className: string;
  section: string;
  subject?: string;
  academicYear?: string;
  studentCount?: number;
}

export interface AssignTeacherPayload {
  classId?: string;
  className: string;
  section: string;
  subject: string;
  academicYear?: string;
}

export interface TeacherAssignmentRecord {
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

// ==========================================
// Student Directory Types
// ==========================================
export interface StudentSummaryStats {
  totalStudents: number;
  activeStudents: number;
  pendingAdmissions: number;
  classesWithStudents: number;
}

export interface StudentParentInfo {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  relationship?: string;
  status: string;
}

export interface StudentDirectoryItem {
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
  parent: StudentParentInfo | null;
  dateOfBirth?: string;
  gender?: string;
  previousSchool?: string;
  enrolledAt: string;
  createdAt: string;
}

export interface StudentDirectoryResponse {
  students: StudentDirectoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StudentDetail extends StudentDirectoryItem {
  parent: (StudentParentInfo & { createdAt?: string }) | null;
}

export interface UpdateStudentPayload {
  section?: string;
  rollNumber?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'GRADUATED';
  classTeacher?: string;
}

// ==========================================
// Parent Directory Types
// ==========================================
export interface ParentSummaryStats {
  totalParents: number;
  parentsWithChildren: number;
  parentsWithoutChildren: number;
  multipleChildrenFamilies: number;
}

export interface ParentLinkedChild {
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

export interface ParentAdmissionRequestSummary {
  id: string;
  studentFullName: string;
  requestedGrade: string;
  academicYear?: string;
  status: string;
  submissionDate: string;
  rejectionReason?: string;
}

export interface ParentDirectoryItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: 'ACTIVE' | 'DISABLED' | 'PENDING_VERIFICATION';
  linkedChildren: ParentLinkedChild[];
  linkedChildrenCount: number;
  createdAt: string;
}

export interface ParentDirectoryResponse {
  parents: ParentDirectoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ParentDetail {
  parent: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    status: 'ACTIVE' | 'DISABLED' | 'PENDING_VERIFICATION';
    createdAt: string;
  };
  linkedChildren: ParentLinkedChild[];
  admissionRequests: ParentAdmissionRequestSummary[];
}

// ==========================================
// Subjects Management Types
// ==========================================
export type SubjectCategory =
  | 'CORE'
  | 'ELECTIVE'
  | 'LANGUAGE'
  | 'SCIENCE'
  | 'HUMANITIES'
  | 'COMMERCE'
  | 'ARTS'
  | 'VOCATIONAL'
  | 'PHYSICAL_EDUCATION'
  | 'OTHER';

export type SubjectStatus = 'ACTIVE' | 'INACTIVE';

export interface ApplicableClassItem {
  classId: string;
  className: string;
}

export interface AssignedTeacherInfo {
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

export interface SubjectItem {
  id: string;
  name: string;
  code: string;
  category: SubjectCategory;
  categoryLabel: string;
  description: string;
  applicableClasses: ApplicableClassItem[];
  academicYear: string;
  status: SubjectStatus;
  assignedTeachers: AssignedTeacherInfo[];
  assignedTeachersCount: number;
  associatedClassesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectSummaryStats {
  totalSubjects: number;
  activeSubjects: number;
  assignedSubjects: number;
  unassignedSubjects: number;
}

export interface SubjectListResponse {
  subjects: SubjectItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SubjectReferencesInfo {
  timetablePeriods: number;
  examSchedules: number;
  assignments: number;
  teacherAssignments: number;
  totalReferences: number;
}

export interface CreateSubjectPayload {
  name: string;
  code: string;
  category?: SubjectCategory;
  description?: string;
  applicableClasses?: ApplicableClassItem[];
  academicYear?: string;
  status?: SubjectStatus;
}

export interface UpdateSubjectPayload {
  name?: string;
  code?: string;
  category?: SubjectCategory;
  description?: string;
  applicableClasses?: ApplicableClassItem[];
  academicYear?: string;
  status?: SubjectStatus;
}

export interface SubjectFilterParams {
  search?: string;
  category?: string;
  classId?: string;
  className?: string;
  academicYear?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

// ==========================================
// School Attendance Management Types
// ==========================================
export type ExtendedAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'UNMARKED';

export interface AdminAttendanceSummary {
  totalEnrolled: number;
  totalMarked: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  unmarkedCount: number;
  attendancePercentage: number;
  totalSections: number;
  sectionsSubmitted: number;
  submissionStatus: 'SUBMITTED' | 'PARTIAL' | 'PENDING';
  date: string;
  academicYear: string;
}

export interface AdminDailyRegisterItem {
  studentId: string;
  admissionNumber: string;
  rollNumber: string;
  fullName: string;
  className: string;
  section: string;
  academicYear: string;
  status: ExtendedAttendanceStatus;
  remarks?: string;
  attendanceId?: string;
  date: string;
  markedById?: string;
  markedByName?: string;
  markedByEmail?: string;
  lastUpdated?: string;
  avatarUrl?: string;
}

export interface AdminDailyRegisterResponse {
  records: AdminDailyRegisterItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalEnrolled: number;
    totalMarked: number;
    present: number;
    absent: number;
    late: number;
    unmarked: number;
    percentage: number;
  };
}

export interface AdminClassOverviewItem {
  classId?: string;
  className: string;
  section: string;
  academicYear: string;
  enrolledCount: number;
  markedCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  unmarkedCount: number;
  percentage: number;
  submissionStatus: 'SUBMITTED' | 'PARTIAL' | 'NOT_SUBMITTED';
  submissionTimestamp?: string;
  assignedTeacherName?: string;
  assignedTeacherEmail?: string;
}

export interface AdminSubmissionMonitoringItem {
  className: string;
  section: string;
  academicYear: string;
  assignedTeacherName: string;
  assignedTeacherEmail: string;
  assignedTeacherPhone: string;
  submissionStatus: 'SUBMITTED' | 'PENDING';
  submissionTimestamp?: string;
  markedCount: number;
  totalEnrolled: number;
}

export interface AdminMonthlyReportDay {
  date: string;
  dayOfWeek: string;
  totalEnrolled: number;
  totalMarked: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  unmarkedCount: number;
  percentage: number;
  sectionsSubmitted: number;
  totalSections: number;
  status: 'RECORDED' | 'PARTIAL' | 'NO_RECORDS' | 'WEEKEND';
}

export interface AdminMonthlyReportResponse {
  month: string;
  academicYear: string;
  className?: string;
  section?: string;
  totalSchoolDays: number;
  averageAttendancePercentage: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  days: AdminMonthlyReportDay[];
}

export interface AdminLowAttendanceItem {
  studentId: string;
  admissionNumber: string;
  rollNumber: string;
  fullName: string;
  className: string;
  section: string;
  academicYear: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  percentage: number;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
}

export interface AdminStudentAttendanceHistorySession {
  attendanceId: string;
  date: string;
  dayOfWeek: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  remarks?: string;
  markedByName?: string;
  updatedAt: string;
}

export interface AdminStudentAttendanceHistory {
  student: {
    id: string;
    fullName: string;
    admissionNumber: string;
    rollNumber: string;
    className: string;
    section: string;
    academicYear: string;
    avatarUrl?: string;
    parentName?: string;
    parentPhone?: string;
    parentEmail?: string;
  };
  summary: {
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    percentage: number;
  };
  history: AdminStudentAttendanceHistorySession[];
}

export interface AdminAttendanceCorrectionPayload {
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  remarks?: string;
  reason?: string;
}

export interface AdminDailyRegisterFilterParams {
  date?: string;
  academicYear?: string;
  className?: string;
  section?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ==========================================
// Subject-Wise Attendance Matrix Types
// ==========================================

export interface AdminSubjectCellStatus {
  status: ExtendedAttendanceStatus;
  remarks?: string;
  markedByName?: string;
  updatedAt?: string;
}

export interface AdminSubjectGridStudentRow {
  studentId: string;
  admissionNumber: string;
  rollNumber: string;
  fullName: string;
  avatarUrl?: string;
  subjects: Record<string, AdminSubjectCellStatus>;
  attendancePercentage: number;
  remarks: string;
  totalSubjects: number;
  presentSubjects: number;
  absentSubjects: number;
  lateSubjects: number;
  unmarkedSubjects: number;
}

export interface AdminSubjectSummaryItem {
  subjectName: string;
  subjectCode?: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  unmarkedCount: number;
  totalStudents: number;
  assignedTeacherName?: string;
}

export interface AdminAttentionStudentIssue {
  subjectName: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  remarks?: string;
}

export interface AdminAttentionStudent {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  avatarUrl?: string;
  className: string;
  section: string;
  issues: AdminAttentionStudentIssue[];
  primaryIssueDescription: string;
}

export interface AdminSubjectGridSummary {
  totalStudents: number;
  presentAllSubjects: number;
  absentAnySubject: number;
  lateCount: number;
  notMarkedCount: number;
}

export interface AdminSubjectGridResponse {
  academicYear: string;
  className: string;
  section: string;
  date: string;
  dayName: string;
  totalStudents: number;
  subjects: string[];
  summary: AdminSubjectGridSummary;
  subjectSummaries: AdminSubjectSummaryItem[];
  students: AdminSubjectGridStudentRow[];
  requiringAttention: AdminAttentionStudent[];
}

export interface AdminSubjectGridFilterParams {
  academicYear?: string;
  className: string;
  section: string;
  date: string;
  search?: string;
  onlyAbsent?: boolean;
  status?: string;
}

export interface AdminSaveSubjectAttendanceRecord {
  studentId: string;
  subjectName: string;
  status: ExtendedAttendanceStatus;
  remarks?: string;
}

export interface AdminSaveSubjectAttendancePayload {
  date: string;
  className: string;
  section: string;
  academicYear?: string;
  records: AdminSaveSubjectAttendanceRecord[];
}

export interface AdminAttendanceClassMetadataItem {
  id: string;
  name: string;
  academicYear: string;
  sections: string[];
  studentCount: number;
}

export interface AdminAttendanceFiltersMetadata {
  academicYears: string[];
  classes: AdminAttendanceClassMetadataItem[];
  defaultAcademicYear: string;
  defaultClass: string;
  defaultSection: string;
}





