import { FeeCategoryType, FeeNature, FeeCategoryStatus } from '../models/FeeCategory.model';
import { ConcessionType, ConcessionStatus } from '../models/FeeConcession.model';
import { PaymentFrequency, FeeStructureStatus } from '../models/FeeStructure.model';
import { AssignmentInstallmentStatus, StudentFeeAssignmentStatus } from '../models/StudentFeeAssignment.model';
import { InvoiceStatus } from '../models/FeeInvoice.model';
import { PaymentMethod, PaymentRecordStatus } from '../models/FeePayment.model';

// Category DTOs
export interface FeeCategoryDTO {
  id: string;
  name: string;
  code: string;
  description: string;
  categoryType: FeeCategoryType;
  feeNature: FeeNature;
  isMandatory: boolean;
  isRefundable: boolean;
  status: FeeCategoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeeCategoryDTO {
  name: string;
  code: string;
  description?: string;
  categoryType: FeeCategoryType;
  feeNature: FeeNature;
  isMandatory?: boolean;
  isRefundable?: boolean;
  status?: FeeCategoryStatus;
}

export interface UpdateFeeCategoryDTO {
  name?: string;
  description?: string;
  categoryType?: FeeCategoryType;
  feeNature?: FeeNature;
  isMandatory?: boolean;
  isRefundable?: boolean;
  status?: FeeCategoryStatus;
}

// Concession DTOs
export interface FeeConcessionDTO {
  id: string;
  name: string;
  code: string;
  discountType: ConcessionType;
  value: number;
  applicableCategories: string[];
  description: string;
  status: ConcessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeeConcessionDTO {
  name: string;
  code: string;
  discountType: ConcessionType;
  value: number;
  applicableCategories?: string[];
  description?: string;
}

export interface UpdateFeeConcessionDTO {
  name?: string;
  discountType?: ConcessionType;
  value?: number;
  applicableCategories?: string[];
  description?: string;
  status?: ConcessionStatus;
}

// Fee Structure DTOs
export interface FeeStructureCategoryDTO {
  categoryId: string;
  categoryName: string;
  amount: number;
  isMandatory?: boolean;
}

export interface FeeStructureInstallmentDTO {
  installmentNumber: number;
  name: string;
  amount: number;
  dueDate: string;
}

export interface LateFeeRuleDTO {
  enabled: boolean;
  gracePeriodDays: number;
  feeType: 'FIXED' | 'DAILY';
  amount: number;
}

export interface FeeStructureDTO {
  id: string;
  name: string;
  description?: string;
  academicYear: string;
  className: string;
  section: string;
  categories: FeeStructureCategoryDTO[];
  totalAmount: number;
  paymentFrequency: PaymentFrequency;
  installments: FeeStructureInstallmentDTO[];
  lateFeeRule: LateFeeRuleDTO;
  status: FeeStructureStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeeStructureDTO {
  name: string;
  description?: string;
  academicYear: string;
  className: string;
  section?: string;
  categories: FeeStructureCategoryDTO[];
  totalAmount: number;
  paymentFrequency: PaymentFrequency;
  installments: FeeStructureInstallmentDTO[];
  lateFeeRule?: LateFeeRuleDTO;
}

export interface UpdateFeeStructureDTO {
  name?: string;
  description?: string;
  categories?: FeeStructureCategoryDTO[];
  totalAmount?: number;
  paymentFrequency?: PaymentFrequency;
  installments?: FeeStructureInstallmentDTO[];
  lateFeeRule?: LateFeeRuleDTO;
  status?: FeeStructureStatus;
}

export interface FeeStructureUsageDTO {
  id: string;
  name: string;
  assignmentsCount: number;
  invoicesCount: number;
  canEditFinancials: boolean;
}

export interface DuplicateFeeStructureDTO {
  targetAcademicYear: string;
  name?: string;
}

// Student Fee Assignment DTOs
export interface AssignedInstallmentDTO {
  installmentNumber: number;
  name: string;
  baseAmount: number;
  concessionAmount: number;
  netAmount: number;
  dueDate: string;
  paidAmount: number;
  status: AssignmentInstallmentStatus;
}

export interface StudentFeeAssignmentDTO {
  id: string;
  studentId: string;
  admissionNumber: string;
  studentName: string;
  className: string;
  section: string;
  academicYear: string;
  feeStructureId: string;
  feeStructureName: string;
  baseAmount: number;
  concessionId?: string;
  concessionName?: string;
  concessionAmount: number;
  concessionReason?: string;
  netPayable: number;
  installments: AssignedInstallmentDTO[];
  status: StudentFeeAssignmentStatus;
  createdAt: string;
}

export interface AssignFeeDTO {
  academicYear: string;
  className: string;
  section?: string;
  studentIds?: string[]; // If omitted or empty, applies bulk to all active enrolled students in class/section
  feeStructureId: string;
  concessionId?: string;
  concessionReason?: string;
}

// Invoice DTOs
export interface InvoiceItemDTO {
  categoryName: string;
  amount: number;
}

export interface FeeInvoiceDTO {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentAdmissionNumber: string;
  studentName: string;
  parentId?: string;
  parentName: string;
  parentContact: string;
  className: string;
  section: string;
  academicYear: string;
  feeAssignmentId: string;
  feeStructureId: string;
  installmentNumber: number;
  installmentName: string;
  items: InvoiceItemDTO[];
  subtotal: number;
  concessionAmount: number;
  lateFeeAmount: number;
  totalPayable: number;
  paidAmount: number;
  outstandingAmount: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
}

export interface GenerateInvoicesDTO {
  academicYear: string;
  className: string;
  section?: string;
  installmentNumber: number;
  studentId?: string; // Optional: generate for single student
  dueDate?: string;
}

// Fee Payment / Collection DTOs
export interface CollectFeeDTO {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  bankName?: string;
  chequeDate?: string;
  remarks?: string;
}

export interface ReversePaymentDTO {
  reason: string;
}

export interface FeePaymentDTO {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  studentId: string;
  studentAdmissionNumber: string;
  studentName: string;
  className: string;
  section: string;
  academicYear: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  bankName?: string;
  chequeDate?: string;
  chequeStatus?: string;
  remarks?: string;
  recordedByName: string;
  status: PaymentRecordStatus;
  reversalReason?: string;
  reversedAt?: string;
  createdAt: string;
}

// Defaulter DTOs
export interface DefaulterItemDTO {
  studentId: string;
  admissionNumber: string;
  studentName: string;
  parentContact: string;
  className: string;
  section: string;
  invoiceId: string;
  invoiceNumber: string;
  installmentName: string;
  outstandingAmount: number;
  dueDate: string;
  daysOverdue: number;
}

// Dashboard Summary DTOs
export interface MonthlyCollectionItem {
  month: string; // e.g. "2026-04" or "Apr 2026"
  amount: number;
  count: number;
}

export interface ClassWiseCollectionItem {
  className: string;
  expected: number;
  collected: number;
  outstanding: number;
  percentage: number;
}

export interface PaymentMethodBreakdownItem {
  method: string;
  amount: number;
  count: number;
}

export interface FeeDashboardSummaryDTO {
  totalExpected: number;
  totalCollected: number;
  outstandingFees: number;
  overdueFees: number;
  totalTransactions: number;
  collectionPercentage: number;
  monthlyCollection: MonthlyCollectionItem[];
  classWiseCollection: ClassWiseCollectionItem[];
  paymentMethodBreakdown: PaymentMethodBreakdownItem[];
  recentTransactions: FeePaymentDTO[];
}

// Report DTOs
export type FeeReportType =
  | 'COLLECTION_SUMMARY'
  | 'CLASS_WISE'
  | 'CATEGORY_WISE'
  | 'DEFAULTERS'
  | 'PAYMENT_METHODS';

export interface FeeReportDTO {
  reportType: FeeReportType;
  generatedAt: string;
  filters?: {
    academicYear?: string;
    className?: string;
    startDate?: string;
    endDate?: string;
  };
  headers: string[];
  rows: Record<string, any>[];
  summary?: Record<string, any>;
}
