export enum StudentGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum ParentRelationship {
  FATHER = 'FATHER',
  MOTHER = 'MOTHER',
  GUARDIAN = 'GUARDIAN',
  OTHER = 'OTHER',
}

export enum RegistrationStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface CreateStudentRegistrationDTO {
  studentFullName: string;
  dateOfBirth: string; // ISO format YYYY-MM-DD
  gender: StudentGender;
  requestedGrade: string;
  academicYear: string;
  previousSchool?: string;
  previousClass?: string;
  parentRelationship: ParentRelationship;
  documents?: Array<{
    name: string;
    url: string;
    fileType?: string;
  }>;
}

export interface StudentRegistrationResponseDTO {
  id: string;
  parentId: string;
  studentFullName: string;
  dateOfBirth: string;
  gender: StudentGender;
  requestedGrade: string;
  academicYear: string;
  previousSchool?: string;
  previousClass?: string;
  parentRelationship: ParentRelationship;
  status: RegistrationStatus;
  submissionDate: string;
  rejectionReason?: string;
  notes?: string;
}

export interface ChildProfileDTO {
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

export interface ParentDashboardResponseDTO {
  children: ChildProfileDTO[];
  registrationRequests: StudentRegistrationResponseDTO[];
  unreadNoticesCount: number;
  upcomingActivitiesCount: number;
}

export interface ParentAssignmentDTO {
  id: string;
  title: string;
  description: string;
  subject: string;
  teacherName: string;
  className: string;
  section: string;
  academicYear: string;
  assignedDate: string;
  dueDate: string;
  maxMarks: number;
  status: 'PUBLISHED';
  dueStatus: 'UPCOMING' | 'DUE_TODAY' | 'OVERDUE';
  submissionStatus: ParentSubmissionStatus;
  submissionTrackingAvailable: boolean;
  allowLateSubmissions?: boolean;
  canSubmit: boolean;
  submission?: SubmissionDetailsDTO | null;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
  studentName?: string;
  studentId?: string;
  remainingDays?: number;
  remainingText?: string;
}

export type ParentSubmissionStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'LATE' | 'RESUBMITTED' | 'UNDER_REVIEW' | 'GRADED';

export interface SubmissionDetailsDTO {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  answerText?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
  submittedAt: string;
  status: 'SUBMITTED' | 'LATE' | 'RESUBMITTED' | 'UNDER_REVIEW' | 'GRADED';
  isLate: boolean;
  version: number;
  gradingStatus: 'PENDING' | 'UNDER_REVIEW' | 'GRADED';
  marksObtained?: number;
  maxMarks: number;
  feedback?: string;
  isPublished?: boolean;
  publishedAt?: string;
  canResubmit: boolean;
}

export interface SubmitAssignmentDTO {
  studentId?: string;
  answerText?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
}

export interface ParentAssignmentsSummaryDTO {
  total: number;
  pending: number;
  submitted: number;
  overdue: number;
  upcoming?: number;
  dueToday?: number;
}

export interface ParentAssignmentsQueryDTO {
  studentId?: string;
  subject?: string;
  status?: string;
  dueDate?: string;
  search?: string;
}

export interface ParentAssignmentsResponseDTO {
  children: ChildProfileDTO[];
  selectedChild: ChildProfileDTO | null;
  assignments: ParentAssignmentDTO[];
  summary: ParentAssignmentsSummaryDTO;
  subjects: string[];
}

export interface ParentSubjectResultDTO {
  scheduleId: string;
  examId: string;
  examName: string;
  examType: string;
  subject: string;
  examDate: string;
  maxMarks: number;
  passingMarks: number;
  marksObtained: number | null;
  isAbsent: boolean;
  percentage: number | null;
  grade: string;
  isPassed: boolean;
  remarks: string;
  publishedAt: string | null;
}

export interface ParentExamCardDTO {
  examId: string;
  examName: string;
  examType: string;
  academicYear: string;
  examDate?: string;
  publishedAt?: string | null;
  totalSubjects: number;
  totalMaxMarks: number;
  totalObtainedMarks: number;
  overallPercentage: number;
  overallGrade: string;
  isPassed: boolean;
  subjects: ParentSubjectResultDTO[];
}

export interface ParentExamResultsQueryDTO {
  studentId?: string;
  academicYear?: string;
  search?: string;
}

export interface ParentExamResultsResponseDTO {
  children: ChildProfileDTO[];
  selectedChild: ChildProfileDTO | null;
  summary: {
    totalExams: number;
    totalSubjectsPassed: number;
    totalSubjectsFailed: number;
    overallAveragePercentage: number;
  };
  exams: ParentExamCardDTO[];
}

export interface ParentStudyMaterialItemDTO {
  id: string;
  title: string;
  description: string;
  teacherName: string;
  className: string;
  section: string;
  subject: string;
  academicYear: string;
  materialType: 'DOCUMENT' | 'VIDEO' | 'LINK';
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  externalUrl: string;
  createdAt: string;
}

export interface ParentStudyMaterialsQueryDTO {
  studentId?: string;
  subject?: string;
  academicYear?: string;
  materialType?: string;
  search?: string;
}

export interface ParentStudyMaterialsResponseDTO {
  children: ChildProfileDTO[];
  selectedChild: ChildProfileDTO | null;
  materials: ParentStudyMaterialItemDTO[];
  subjects: string[];
  academicYears: string[];
}

export interface ParentPaymentHistoryDTO {
  id?: string;
  receiptNumber: string;
  paymentDate: string;
  paymentMethod: string;
  amount: number;
  transactionReference?: string;
  status: string;
  recordedByName?: string;
  remarks?: string;
  balanceAfter?: number;
  invoiceNumber?: string;
  installmentName?: string;
  studentName?: string;
  studentAdmissionNumber?: string;
  className?: string;
  section?: string;
  academicYear?: string;
}

export interface ParentInvoiceItemDTO {
  categoryName: string;
  description?: string;
  amount: number;
}

export interface ParentInvoiceDTO {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  studentAdmissionNumber: string;
  className: string;
  section: string;
  academicYear: string;
  feeStructureId?: string;
  feeStructureName?: string;
  installmentNumber: number;
  installmentName: string;
  items: ParentInvoiceItemDTO[];
  subtotal: number;
  concessionAmount: number;
  lateFeeAmount: number;
  totalPayable: number;
  paidAmount: number;
  outstandingAmount: number;
  issueDate: string;
  dueDate: string;
  status: string;
  notes?: string;
  payments?: ParentPaymentHistoryDTO[];
}

export interface ParentAssignedInstallmentDTO {
  installmentNumber: number;
  name: string;
  baseAmount: number;
  concessionAmount: number;
  netAmount: number;
  dueDate: string;
  paidAmount: number;
  status: string;
}

export interface ParentFeeAssignmentDTO {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  section: string;
  academicYear: string;
  feeStructureId: string;
  feeStructureName: string;
  baseAmount: number;
  concessionName?: string;
  concessionAmount: number;
  concessionReason?: string;
  netPayable: number;
  status: string;
  installments: ParentAssignedInstallmentDTO[];
}

export interface ParentFeeInvoicesQueryDTO {
  studentId?: string;
  academicYear?: string;
  status?: string;
}

export interface ParentFeeInvoicesResponseDTO {
  children: ChildProfileDTO[];
  selectedChild: ChildProfileDTO | null;
  hasEnrolledChildren: boolean;
  registrationRequestsCount: number;
  assignment: ParentFeeAssignmentDTO | null;
  assignments: ParentFeeAssignmentDTO[];
  summary: {
    totalFees: number;
    amountPaid: number;
    outstandingBalance: number;
    overdueAmount: number;
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    overdueInvoicesCount: number;
  };
  invoices: ParentInvoiceDTO[];
  academicYears: string[];
}

export interface CreateOnlinePaymentOrderDTO {
  invoiceId: string;
  amount: number;
}

export interface OnlinePaymentOrderResponseDTO {
  orderId: string;
  gatewayOrderId: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  keyId: string;
  invoiceId: string;
  invoiceNumber: string;
  studentName: string;
  studentAdmissionNumber: string;
  className: string;
  section: string;
  installmentName: string;
}

export interface VerifyOnlinePaymentDTO {
  invoiceId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentMethod?: string;
}

export interface ParentPaymentItemDTO {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  studentAdmissionNumber: string;
  className: string;
  section: string;
  academicYear: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionReference?: string;
  status: string;
  isOnline: boolean;
  recordedByName?: string;
  remarks?: string;
  balanceAfter?: number;
}

export interface ParentPaymentHistoryResponseDTO {
  payments: ParentPaymentItemDTO[];
  totalCollected: number;
  totalTransactions: number;
}



