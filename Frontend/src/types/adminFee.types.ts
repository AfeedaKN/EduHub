export type FeeCategoryType =
  | 'ACADEMIC'
  | 'TRANSPORT'
  | 'FACILITY'
  | 'ACTIVITY'
  | 'ADMINISTRATIVE'
  | 'OTHER';

export type FeeNature = 'RECURRING' | 'ONE_TIME';
export type FeeCategoryStatus = 'ACTIVE' | 'INACTIVE';

export interface FeeCategory {
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

export interface CreateFeeCategoryInput {
  name: string;
  code: string;
  description?: string;
  categoryType: FeeCategoryType;
  feeNature: FeeNature;
  isMandatory?: boolean;
  isRefundable?: boolean;
  status?: FeeCategoryStatus;
}

export interface UpdateFeeCategoryInput {
  name?: string;
  description?: string;
  categoryType?: FeeCategoryType;
  feeNature?: FeeNature;
  isMandatory?: boolean;
  isRefundable?: boolean;
  status?: FeeCategoryStatus;
}

export interface CategoryUsageResult {
  isUsed: boolean;
  activeStructuresCount: number;
  structures: {
    id: string;
    name: string;
    academicYear: string;
    className: string;
    status: string;
  }[];
}

export type ConcessionType = 'PERCENTAGE' | 'FIXED';
export type ConcessionStatus = 'ACTIVE' | 'INACTIVE';

export interface FeeConcession {
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

export interface CreateFeeConcessionInput {
  name: string;
  code: string;
  discountType: ConcessionType;
  value: number;
  applicableCategories?: string[];
  description?: string;
  status?: ConcessionStatus;
}

export interface UpdateFeeConcessionInput {
  name?: string;
  discountType?: ConcessionType;
  value?: number;
  applicableCategories?: string[];
  description?: string;
  status?: ConcessionStatus;
}

export type PaymentFrequency = 'ANNUAL' | 'TERM' | 'MONTHLY' | 'CUSTOM';
export type FeeStructureStatus = 'ACTIVE' | 'INACTIVE';

export interface FeeCategoryItem {
  categoryId: string;
  categoryName: string;
  amount: number;
  isMandatory?: boolean;
}

export interface FeeInstallmentPlan {
  installmentNumber: number;
  name: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
}

export interface LateFeeRule {
  enabled: boolean;
  gracePeriodDays: number;
  feeType: 'FIXED' | 'DAILY';
  amount: number;
}

export interface FeeStructure {
  id: string;
  name: string;
  description?: string;
  academicYear: string;
  className: string;
  section: string;
  categories: FeeCategoryItem[];
  totalAmount: number;
  paymentFrequency: PaymentFrequency;
  installments: FeeInstallmentPlan[];
  lateFeeRule: LateFeeRule;
  status: FeeStructureStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeeStructureInput {
  name: string;
  description?: string;
  academicYear: string;
  className: string;
  section?: string;
  categories: {
    categoryId: string;
    categoryName: string;
    amount: number;
    isMandatory?: boolean;
  }[];
  totalAmount: number;
  paymentFrequency: PaymentFrequency;
  installments: {
    installmentNumber?: number;
    name: string;
    amount: number;
    dueDate: string;
  }[];
  lateFeeRule?: LateFeeRule;
  status?: FeeStructureStatus;
}

export interface UpdateFeeStructureInput {
  name?: string;
  description?: string;
  categories?: {
    categoryId: string;
    categoryName: string;
    amount: number;
    isMandatory?: boolean;
  }[];
  totalAmount?: number;
  paymentFrequency?: PaymentFrequency;
  installments?: {
    installmentNumber?: number;
    name: string;
    amount: number;
    dueDate: string;
  }[];
  lateFeeRule?: LateFeeRule;
  status?: FeeStructureStatus;
}

export interface FeeStructureUsage {
  id: string;
  name: string;
  assignmentsCount: number;
  invoicesCount: number;
  canEditFinancials: boolean;
}

export interface DuplicateFeeStructureInput {
  targetAcademicYear: string;
  name?: string;
}

export type AssignmentInstallmentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';
export type StudentFeeAssignmentStatus = 'ACTIVE' | 'CANCELLED';

export interface AssignedInstallment {
  installmentNumber: number;
  name: string;
  baseAmount: number;
  concessionAmount: number;
  netAmount: number;
  dueDate: string;
  paidAmount: number;
  status: AssignmentInstallmentStatus;
}

export interface StudentFeeAssignment {
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
  installments: AssignedInstallment[];
  status: StudentFeeAssignmentStatus;
  createdAt: string;
}

export interface AssignFeeInput {
  feeStructureId: string;
  academicYear: string;
  className?: string;
  section?: string;
  studentIds?: string[];
  concessionId?: string;
  concessionReason?: string;
}

export interface AssignFeeResult {
  assignedCount: number;
  skippedCount: number;
  assignments: StudentFeeAssignment[];
}

export type InvoiceStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceLineItem {
  categoryName: string;
  baseAmount: number;
  concessionAmount: number;
  netAmount: number;
}

export interface FeeInvoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentAdmissionNumber: string;
  studentName: string;
  className: string;
  section: string;
  academicYear: string;
  feeAssignmentId: string;
  installmentNumber: number;
  installmentName: string;
  lineItems: InvoiceLineItem[];
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

export interface GenerateInvoicesInput {
  academicYear: string;
  className: string;
  section?: string;
  installmentNumber: number;
  studentId?: string;
  dueDate?: string;
}

export interface GenerateInvoicesResult {
  generatedCount: number;
  invoices: FeeInvoice[];
}

export type PaymentMethod =
  | 'CASH'
  | 'CHEQUE'
  | 'BANK_TRANSFER'
  | 'CARD'
  | 'UPI'
  | 'ONLINE';

export type PaymentRecordStatus = 'SUCCESS' | 'REVERSED';

export interface CollectFeeInput {
  invoiceId: string;
  amount: number;
  paymentDate?: string;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  bankName?: string;
  chequeDate?: string;
  remarks?: string;
}

export interface FeePayment {
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

export interface ReversePaymentInput {
  reason: string;
}

export interface DefaulterItem {
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

export interface MonthlyCollectionItem {
  month: string;
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

export interface FeeDashboardSummary {
  totalExpected: number;
  totalCollected: number;
  outstandingFees: number;
  overdueFees: number;
  totalTransactions: number;
  collectionPercentage: number;
  monthlyCollection: MonthlyCollectionItem[];
  classWiseCollection: ClassWiseCollectionItem[];
  paymentMethodBreakdown: PaymentMethodBreakdownItem[];
  recentTransactions: FeePayment[];
}

export type FeeReportType =
  | 'COLLECTION_SUMMARY'
  | 'CLASS_WISE'
  | 'CATEGORY_WISE'
  | 'DEFAULTERS'
  | 'PAYMENT_METHODS';

export interface FeeReport {
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
