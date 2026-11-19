import { axiosClient } from './axiosClient';
import {
  ParentDashboardData,
  ChildProfile,
  StudentRegistrationRequest,
  AddStudentPayload,
  AdmissionMetadata,
  ParentAssignmentsQueryParams,
  ParentAssignmentsResponse,
  ParentAssignment,
  SubmitAssignmentPayload,
  SubmissionDetails,
  PaymentConfig,
  CreatePaymentOrderPayload,
  PaymentOrderResponse,
  VerifyPaymentPayload,
  ParentPaymentRecord,
  ParentPaymentHistoryResponse,
  ParentInvoice,
} from '../types/parent.types';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const parentApi = {
  // Get parent dashboard data (children, registration requests)
  getDashboardData: async (): Promise<ApiResponse<ParentDashboardData>> => {
    const res = await axiosClient.get<ApiResponse<ParentDashboardData>>('/parent/dashboard');
    return res.data;
  },

  // Get children list
  getChildren: async (): Promise<ApiResponse<ChildProfile[]>> => {
    const res = await axiosClient.get<ApiResponse<ChildProfile[]>>('/parent/children');
    return res.data;
  },

  // Get registration requests list
  getRegistrationRequests: async (): Promise<ApiResponse<StudentRegistrationRequest[]>> => {
    const res = await axiosClient.get<ApiResponse<StudentRegistrationRequest[]>>('/parent/registration-requests');
    return res.data;
  },

  // Submit student registration request
  addStudent: async (payload: AddStudentPayload): Promise<ApiResponse<StudentRegistrationRequest>> => {
    const res = await axiosClient.post<ApiResponse<StudentRegistrationRequest>>('/parent/students/add', payload);
    return res.data;
  },

  // Get admission metadata (classes, academic years, genders, relationships)
  getAdmissionMetadata: async (): Promise<ApiResponse<AdmissionMetadata>> => {
    try {
      const res = await axiosClient.get<ApiResponse<AdmissionMetadata>>('/parent/meta');
      return res.data;
    } catch {
      // Fallback default metadata if endpoint is unavailable
      return {
        success: true,
        message: 'Default metadata loaded',
        data: {
          classes: [
            'Pre-KG',
            'LKG',
            'UKG',
            'Grade 1',
            'Grade 2',
            'Grade 3',
            'Grade 4',
            'Grade 5',
            'Grade 6',
            'Grade 7',
            'Grade 8',
            'Grade 9',
            'Grade 10',
            'Grade 11',
            'Grade 12',
          ],
          academicYears: ['2026-2027', '2027-2028'],
          genders: [
            { label: 'Male', value: 'MALE' },
            { label: 'Female', value: 'FEMALE' },
            { label: 'Other', value: 'OTHER' },
            { label: 'Prefer not to say', value: 'PREFER_NOT_TO_SAY' },
          ],
          relationships: [
            { label: 'Father', value: 'FATHER' },
            { label: 'Mother', value: 'MOTHER' },
            { label: 'Guardian', value: 'GUARDIAN' },
            { label: 'Other', value: 'OTHER' },
          ],
        },
      };
    }
  },

  // Get assignments for parent's children
  getAssignments: async (params?: ParentAssignmentsQueryParams): Promise<ApiResponse<ParentAssignmentsResponse>> => {
    const res = await axiosClient.get<ApiResponse<ParentAssignmentsResponse>>('/parent/assignments', { params });
    return res.data;
  },

  // Get single assignment details
  getAssignmentById: async (id: string): Promise<ApiResponse<ParentAssignment>> => {
    const res = await axiosClient.get<ApiResponse<ParentAssignment>>(`/parent/assignments/${id}`);
    return res.data;
  },

  // Submit or resubmit assignment coursework
  submitAssignment: async (
    assignmentId: string,
    payload: SubmitAssignmentPayload
  ): Promise<ApiResponse<SubmissionDetails>> => {
    const res = await axiosClient.post<ApiResponse<SubmissionDetails>>(
      `/parent/assignments/${assignmentId}/submit`,
      payload
    );
    return res.data;
  },

  // Get published exam results for enrolled children
  getExamResults: async (
    params?: import('../types/parent.types').ParentExamResultsQueryParams
  ): Promise<ApiResponse<import('../types/parent.types').ParentExamResultsResponse>> => {
    const res = await axiosClient.get<
      ApiResponse<import('../types/parent.types').ParentExamResultsResponse>
    >('/parent/exams', { params });
    return res.data;
  },

  // Fee Invoices and Payment History for children
  getFeeInvoices: async (
    params?: import('../types/parent.types').ParentFeeInvoicesQueryParams
  ): Promise<ApiResponse<import('../types/parent.types').ParentFeeInvoicesResponse>> => {
    const res = await axiosClient.get<
      ApiResponse<import('../types/parent.types').ParentFeeInvoicesResponse>
    >('/parent/fees/invoices', { params });
    return res.data;
  },

  getFeeInvoiceDetails: async (
    id: string
  ): Promise<ApiResponse<import('../types/parent.types').ParentInvoice>> => {
    const res = await axiosClient.get<
      ApiResponse<import('../types/parent.types').ParentInvoice>
    >(`/parent/fees/invoices/${id}`);
    return res.data;
  },

  // Online Fee Payment Gateway (Razorpay)
  getPaymentConfig: async (): Promise<ApiResponse<PaymentConfig>> => {
    const res = await axiosClient.get<ApiResponse<PaymentConfig>>('/parent/fees/config');
    return res.data;
  },

  createPaymentOrder: async (
    payload: CreatePaymentOrderPayload
  ): Promise<ApiResponse<PaymentOrderResponse>> => {
    const res = await axiosClient.post<ApiResponse<PaymentOrderResponse>>(
      '/parent/fees/create-order',
      payload
    );
    return res.data;
  },

  verifyPayment: async (
    payload: VerifyPaymentPayload
  ): Promise<ApiResponse<{ payment: ParentPaymentRecord; receiptNumber: string; invoice: ParentInvoice }>> => {
    const res = await axiosClient.post<
      ApiResponse<{ payment: ParentPaymentRecord; receiptNumber: string; invoice: ParentInvoice }>
    >('/parent/fees/verify-payment', payload);
    return res.data;
  },

  getParentPayments: async (
    params?: { studentId?: string; academicYear?: string }
  ): Promise<ApiResponse<ParentPaymentHistoryResponse>> => {
    const res = await axiosClient.get<ApiResponse<ParentPaymentHistoryResponse>>(
      '/parent/fees/payments',
      { params }
    );
    return res.data;
  },
};
