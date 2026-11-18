import { axiosClient } from './axiosClient';
import {
  FeeCategory,
  CreateFeeCategoryInput,
  UpdateFeeCategoryInput,
  CategoryUsageResult,
  FeeConcession,
  CreateFeeConcessionInput,
  UpdateFeeConcessionInput,
  FeeStructure,
  CreateFeeStructureInput,
  UpdateFeeStructureInput,
  FeeStructureUsage,
  DuplicateFeeStructureInput,
  StudentFeeAssignment,
  AssignFeeInput,
  AssignFeeResult,
  FeeInvoice,
  GenerateInvoicesInput,
  GenerateInvoicesResult,
  FeePayment,
  CollectFeeInput,
  ReversePaymentInput,
  DefaulterItem,
  FeeDashboardSummary,
  FeeReport,
  FeeReportType,
} from '../types/adminFee.types';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export const adminFeeApi = {
  // Dashboard Metrics
  getDashboardSummary: async (academicYear?: string): Promise<ApiResponse<FeeDashboardSummary>> => {
    const res = await axiosClient.get<ApiResponse<FeeDashboardSummary>>('/admin/fees/dashboard', {
      params: academicYear ? { academicYear } : undefined,
    });
    return res.data;
  },

  // Fee Categories
  getCategories: async (status?: string): Promise<ApiResponse<FeeCategory[]>> => {
    const res = await axiosClient.get<ApiResponse<FeeCategory[]>>('/admin/fees/categories', {
      params: status ? { status } : undefined,
    });
    return res.data;
  },

  getCategoryById: async (id: string): Promise<ApiResponse<FeeCategory>> => {
    const res = await axiosClient.get<ApiResponse<FeeCategory>>(`/admin/fees/categories/${id}`);
    return res.data;
  },

  getCategoryUsage: async (id: string): Promise<ApiResponse<CategoryUsageResult>> => {
    const res = await axiosClient.get<ApiResponse<CategoryUsageResult>>(
      `/admin/fees/categories/${id}/usage`
    );
    return res.data;
  },

  createCategory: async (data: CreateFeeCategoryInput): Promise<ApiResponse<FeeCategory>> => {
    const res = await axiosClient.post<ApiResponse<FeeCategory>>('/admin/fees/categories', data);
    return res.data;
  },

  updateCategory: async (
    id: string,
    data: UpdateFeeCategoryInput
  ): Promise<ApiResponse<FeeCategory>> => {
    const res = await axiosClient.put<ApiResponse<FeeCategory>>(`/admin/fees/categories/${id}`, data);
    return res.data;
  },

  // Fee Concessions
  getConcessions: async (status?: string): Promise<ApiResponse<FeeConcession[]>> => {
    const res = await axiosClient.get<ApiResponse<FeeConcession[]>>('/admin/fees/concessions', {
      params: status ? { status } : undefined,
    });
    return res.data;
  },

  createConcession: async (
    data: CreateFeeConcessionInput
  ): Promise<ApiResponse<FeeConcession>> => {
    const res = await axiosClient.post<ApiResponse<FeeConcession>>('/admin/fees/concessions', data);
    return res.data;
  },

  updateConcession: async (
    id: string,
    data: UpdateFeeConcessionInput
  ): Promise<ApiResponse<FeeConcession>> => {
    const res = await axiosClient.put<ApiResponse<FeeConcession>>(
      `/admin/fees/concessions/${id}`,
      data
    );
    return res.data;
  },

  // Fee Structures
  getStructures: async (params?: {
    academicYear?: string;
    className?: string;
    status?: string;
  }): Promise<ApiResponse<FeeStructure[]>> => {
    const res = await axiosClient.get<ApiResponse<FeeStructure[]>>('/admin/fees/structures', {
      params,
    });
    return res.data;
  },

  getStructureById: async (id: string): Promise<ApiResponse<FeeStructure>> => {
    const res = await axiosClient.get<ApiResponse<FeeStructure>>(`/admin/fees/structures/${id}`);
    return res.data;
  },

  createStructure: async (data: CreateFeeStructureInput): Promise<ApiResponse<FeeStructure>> => {
    const res = await axiosClient.post<ApiResponse<FeeStructure>>('/admin/fees/structures', data);
    return res.data;
  },

  updateStructure: async (
    id: string,
    data: UpdateFeeStructureInput
  ): Promise<ApiResponse<FeeStructure>> => {
    const res = await axiosClient.put<ApiResponse<FeeStructure>>(`/admin/fees/structures/${id}`, data);
    return res.data;
  },

  getStructureUsage: async (id: string): Promise<ApiResponse<FeeStructureUsage>> => {
    const res = await axiosClient.get<ApiResponse<FeeStructureUsage>>(
      `/admin/fees/structures/${id}/usage`
    );
    return res.data;
  },

  duplicateStructure: async (
    id: string,
    data: DuplicateFeeStructureInput
  ): Promise<ApiResponse<FeeStructure>> => {
    const res = await axiosClient.post<ApiResponse<FeeStructure>>(
      `/admin/fees/structures/${id}/duplicate`,
      data
    );
    return res.data;
  },

  // Fee Assignments
  getAssignments: async (params?: {
    academicYear?: string;
    className?: string;
    section?: string;
    search?: string;
  }): Promise<ApiResponse<StudentFeeAssignment[]>> => {
    const res = await axiosClient.get<ApiResponse<StudentFeeAssignment[]>>(
      '/admin/fees/assignments',
      { params }
    );
    return res.data;
  },

  assignFees: async (data: AssignFeeInput): Promise<ApiResponse<AssignFeeResult>> => {
    const res = await axiosClient.post<ApiResponse<AssignFeeResult>>('/admin/fees/assignments', data);
    return res.data;
  },

  // Invoices
  getInvoices: async (params?: {
    academicYear?: string;
    className?: string;
    section?: string;
    status?: string;
    studentId?: string;
    search?: string;
  }): Promise<ApiResponse<FeeInvoice[]>> => {
    const res = await axiosClient.get<ApiResponse<FeeInvoice[]>>('/admin/fees/invoices', {
      params,
    });
    return res.data;
  },

  getInvoiceById: async (id: string): Promise<ApiResponse<FeeInvoice>> => {
    const res = await axiosClient.get<ApiResponse<FeeInvoice>>(`/admin/fees/invoices/${id}`);
    return res.data;
  },

  generateInvoices: async (
    data: GenerateInvoicesInput
  ): Promise<ApiResponse<GenerateInvoicesResult>> => {
    const res = await axiosClient.post<ApiResponse<GenerateInvoicesResult>>(
      '/admin/fees/invoices/generate',
      data
    );
    return res.data;
  },

  // Fee Payments & Receipts
  getPayments: async (params?: {
    academicYear?: string;
    className?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<ApiResponse<FeePayment[]>> => {
    const res = await axiosClient.get<ApiResponse<FeePayment[]>>('/admin/fees/payments', {
      params,
    });
    return res.data;
  },

  collectFee: async (data: CollectFeeInput): Promise<ApiResponse<FeePayment>> => {
    const res = await axiosClient.post<ApiResponse<FeePayment>>('/admin/fees/payments/collect', data);
    return res.data;
  },

  reversePayment: async (
    paymentId: string,
    data: ReversePaymentInput
  ): Promise<ApiResponse<FeePayment>> => {
    const res = await axiosClient.post<ApiResponse<FeePayment>>(
      `/admin/fees/payments/${paymentId}/reverse`,
      data
    );
    return res.data;
  },

  // Defaulters
  getDefaulters: async (params?: {
    academicYear?: string;
    className?: string;
  }): Promise<ApiResponse<DefaulterItem[]>> => {
    const res = await axiosClient.get<ApiResponse<DefaulterItem[]>>('/admin/fees/defaulters', {
      params,
    });
    return res.data;
  },

  // Reports
  getReports: async (params: {
    type: FeeReportType;
    academicYear?: string;
    className?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<FeeReport>> => {
    const res = await axiosClient.get<ApiResponse<FeeReport>>('/admin/fees/reports', {
      params,
    });
    return res.data;
  },
};
