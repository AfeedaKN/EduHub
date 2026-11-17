import { axiosClient } from './axiosClient';
import {
  AdminAssignmentSummaryStats,
  AdminAssignmentListResponse,
  AdminAssignmentDetails,
  AdminTeacherMonitoringItem,
  AdminAssignmentFilterParams,
  AdminAssignmentFilterMetadata,
} from '../types/adminAssignment.types';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export const adminAssignmentApi = {
  // Get dashboard summary statistics
  getSummary: async (academicYear?: string): Promise<ApiResponse<AdminAssignmentSummaryStats>> => {
    const res = await axiosClient.get<ApiResponse<AdminAssignmentSummaryStats>>(
      '/admin/assignments/summary',
      {
        params: academicYear ? { academicYear } : undefined,
      }
    );
    return res.data;
  },

  // Get filter metadata (classes, sections, subjects, teachers, years)
  getMetadata: async (): Promise<ApiResponse<AdminAssignmentFilterMetadata>> => {
    const res = await axiosClient.get<ApiResponse<AdminAssignmentFilterMetadata>>(
      '/admin/assignments/metadata'
    );
    return res.data;
  },

  // Get paginated and filtered assignments list
  getAssignments: async (
    params?: AdminAssignmentFilterParams
  ): Promise<ApiResponse<AdminAssignmentListResponse>> => {
    const res = await axiosClient.get<ApiResponse<AdminAssignmentListResponse>>(
      '/admin/assignments',
      { params }
    );
    return res.data;
  },

  // Get single assignment details with student submission roster
  getAssignmentDetails: async (id: string): Promise<ApiResponse<AdminAssignmentDetails>> => {
    const res = await axiosClient.get<ApiResponse<AdminAssignmentDetails>>(
      `/admin/assignments/${id}`
    );
    return res.data;
  },

  // Get teacher-wise monitoring statistics
  getTeacherMonitoring: async (
    academicYear?: string,
    search?: string
  ): Promise<ApiResponse<AdminTeacherMonitoringItem[]>> => {
    const res = await axiosClient.get<ApiResponse<AdminTeacherMonitoringItem[]>>(
      '/admin/assignments/monitoring/teachers',
      {
        params: {
          academicYear: academicYear || undefined,
          search: search || undefined,
        },
      }
    );
    return res.data;
  },
};
