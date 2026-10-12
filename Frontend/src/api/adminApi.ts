import { axiosClient } from './axiosClient';
import {
  AdminDashboardData,
  AdminPendingAdmission,
  AdminAdmissionDetail,
  AdmissionsSummaryCounts,
  ClassCapacity,
  ApproveAdmissionPayload,
  RejectAdmissionPayload,
  ApprovalResult,
  RejectionResult,
} from '../types/admin.types';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const adminApi = {
  // Get aggregated dashboard summary
  getDashboardSummary: async (): Promise<ApiResponse<AdminDashboardData>> => {
    const res = await axiosClient.get<ApiResponse<AdminDashboardData>>('/admin/dashboard');
    return res.data;
  },

  // Get admission summary counts (Pending, Approved, Rejected, Total)
  getAdmissionCounts: async (): Promise<ApiResponse<AdmissionsSummaryCounts>> => {
    const res = await axiosClient.get<ApiResponse<AdmissionsSummaryCounts>>('/admin/admissions/summary');
    return res.data;
  },

  // Get filtered admissions list
  getAdmissions: async (params?: {
    status?: string;
    search?: string;
    grade?: string;
    sort?: 'newest' | 'oldest';
  }): Promise<ApiResponse<AdminPendingAdmission[]>> => {
    const res = await axiosClient.get<ApiResponse<AdminPendingAdmission[]>>('/admin/admissions', {
      params,
    });
    return res.data;
  },

  // Get all admissions requests (default)
  getAllAdmissions: async (): Promise<ApiResponse<AdminPendingAdmission[]>> => {
    const res = await axiosClient.get<ApiResponse<AdminPendingAdmission[]>>('/admin/admissions');
    return res.data;
  },

  // Get single admission full details with real-time class capacity
  getAdmissionDetail: async (id: string): Promise<ApiResponse<AdminAdmissionDetail>> => {
    const res = await axiosClient.get<ApiResponse<AdminAdmissionDetail>>(`/admin/admissions/${id}`);
    return res.data;
  },

  // Get live class capacity for grade and section
  getClassCapacity: async (grade: string, section = 'A'): Promise<ApiResponse<ClassCapacity>> => {
    const res = await axiosClient.get<ApiResponse<ClassCapacity>>('/admin/admissions/capacity', {
      params: { grade, section },
    });
    return res.data;
  },

  // Approve a pending student admission request
  approveAdmission: async (
    id: string,
    payload?: ApproveAdmissionPayload
  ): Promise<ApiResponse<ApprovalResult>> => {
    const res = await axiosClient.post<ApiResponse<ApprovalResult>>(
      `/admin/admissions/${id}/approve`,
      payload || {}
    );
    return res.data;
  },

  // Reject a pending student admission request
  rejectAdmission: async (
    id: string,
    payload: RejectAdmissionPayload
  ): Promise<ApiResponse<RejectionResult>> => {
    const res = await axiosClient.post<ApiResponse<RejectionResult>>(
      `/admin/admissions/${id}/reject`,
      payload
    );
    return res.data;
  },

  // ==========================================
  // Classes & Sections Management API
  // ==========================================

  // Get class and section summary stats
  getClassSummaryStats: async (params?: {
    academicYear?: string;
  }): Promise<ApiResponse<import('../types/admin.types').ClassSummaryStats>> => {
    const res = await axiosClient.get<ApiResponse<import('../types/admin.types').ClassSummaryStats>>(
      '/admin/classes/summary',
      { params }
    );
    return res.data;
  },

  // Get classes list with filters
  getClasses: async (params?: {
    academicYear?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<import('../types/admin.types').ClassDetail[]>> => {
    const res = await axiosClient.get<ApiResponse<import('../types/admin.types').ClassDetail[]>>(
      '/admin/classes',
      { params }
    );
    return res.data;
  },

  // Get class by ID
  getClassById: async (id: string): Promise<ApiResponse<import('../types/admin.types').ClassDetail>> => {
    const res = await axiosClient.get<ApiResponse<import('../types/admin.types').ClassDetail>>(
      `/admin/classes/${id}`
    );
    return res.data;
  },

  // Create a new class
  createClass: async (
    payload: import('../types/admin.types').CreateClassPayload
  ): Promise<ApiResponse<import('../types/admin.types').ClassDetail>> => {
    const res = await axiosClient.post<ApiResponse<import('../types/admin.types').ClassDetail>>(
      '/admin/classes',
      payload
    );
    return res.data;
  },

  // Update a class
  updateClass: async (
    id: string,
    payload: import('../types/admin.types').UpdateClassPayload
  ): Promise<ApiResponse<import('../types/admin.types').ClassDetail>> => {
    const res = await axiosClient.put<ApiResponse<import('../types/admin.types').ClassDetail>>(
      `/admin/classes/${id}`,
      payload
    );
    return res.data;
  },

  // Change class active/inactive status
  changeClassStatus: async (
    id: string,
    status: import('../types/admin.types').ClassStatus
  ): Promise<ApiResponse<import('../types/admin.types').ClassDetail>> => {
    const res = await axiosClient.patch<ApiResponse<import('../types/admin.types').ClassDetail>>(
      `/admin/classes/${id}/status`,
      { status }
    );
    return res.data;
  },

  // Delete a class
  deleteClass: async (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const res = await axiosClient.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/admin/classes/${id}`
    );
    return res.data;
  },

  // Get sections for a class
  getSectionsForClass: async (
    classId: string
  ): Promise<ApiResponse<import('../types/admin.types').SectionDetail[]>> => {
    const res = await axiosClient.get<ApiResponse<import('../types/admin.types').SectionDetail[]>>(
      `/admin/classes/${classId}/sections`
    );
    return res.data;
  },

  // Create section for a class
  createSection: async (
    classId: string,
    payload: import('../types/admin.types').CreateSectionPayload
  ): Promise<ApiResponse<import('../types/admin.types').SectionDetail>> => {
    const res = await axiosClient.post<ApiResponse<import('../types/admin.types').SectionDetail>>(
      `/admin/classes/${classId}/sections`,
      payload
    );
    return res.data;
  },

  // Update section
  updateSection: async (
    classId: string,
    sectionId: string,
    payload: import('../types/admin.types').UpdateSectionPayload
  ): Promise<ApiResponse<import('../types/admin.types').SectionDetail>> => {
    const res = await axiosClient.put<ApiResponse<import('../types/admin.types').SectionDetail>>(
      `/admin/classes/${classId}/sections/${sectionId}`,
      payload
    );
    return res.data;
  },

  // Change section active/inactive status
  changeSectionStatus: async (
    classId: string,
    sectionId: string,
    status: import('../types/admin.types').SectionStatus
  ): Promise<ApiResponse<import('../types/admin.types').SectionDetail>> => {
    const res = await axiosClient.patch<ApiResponse<import('../types/admin.types').SectionDetail>>(
      `/admin/classes/${classId}/sections/${sectionId}/status`,
      { status }
    );
    return res.data;
  },

  // Delete section
  deleteSection: async (
    classId: string,
    sectionId: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const res = await axiosClient.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/admin/classes/${classId}/sections/${sectionId}`
    );
    return res.data;
  },

  // ==========================================
  // Teacher Management APIs
  // ==========================================

  // Get teacher summary statistics
  getTeacherSummaryStats: async (): Promise<ApiResponse<import('../types/admin.types').TeacherSummaryStats>> => {
    const res = await axiosClient.get<ApiResponse<import('../types/admin.types').TeacherSummaryStats>>(
      '/admin/teachers/summary'
    );
    return res.data;
  },

  // Get list of teachers with optional search & filters
  getTeachers: async (params?: {
    search?: string;
    status?: string;
    department?: string;
  }): Promise<ApiResponse<import('../types/admin.types').TeacherDetail[]>> => {
    const res = await axiosClient.get<ApiResponse<import('../types/admin.types').TeacherDetail[]>>(
      '/admin/teachers',
      { params }
    );
    return res.data;
  },

  // Get single teacher details by ID
  getTeacherById: async (id: string): Promise<ApiResponse<import('../types/admin.types').TeacherDetail>> => {
    const res = await axiosClient.get<ApiResponse<import('../types/admin.types').TeacherDetail>>(
      `/admin/teachers/${id}`
    );
    return res.data;
  },

  // Create new teacher account
  createTeacher: async (
    payload: import('../types/admin.types').CreateTeacherPayload
  ): Promise<ApiResponse<import('../types/admin.types').TeacherDetail>> => {
    const res = await axiosClient.post<ApiResponse<import('../types/admin.types').TeacherDetail>>(
      '/admin/teachers',
      payload
    );
    return res.data;
  },

  // Update existing teacher profile
  updateTeacher: async (
    id: string,
    payload: import('../types/admin.types').UpdateTeacherPayload
  ): Promise<ApiResponse<import('../types/admin.types').TeacherDetail>> => {
    const res = await axiosClient.put<ApiResponse<import('../types/admin.types').TeacherDetail>>(
      `/admin/teachers/${id}`,
      payload
    );
    return res.data;
  },

  // Change teacher active/inactive status
  changeTeacherStatus: async (
    id: string,
    status: import('../types/admin.types').TeacherStatus
  ): Promise<ApiResponse<import('../types/admin.types').TeacherDetail>> => {
    const res = await axiosClient.patch<ApiResponse<import('../types/admin.types').TeacherDetail>>(
      `/admin/teachers/${id}/status`,
      { status }
    );
    return res.data;
  },

  // Delete teacher account
  deleteTeacher: async (id: string): Promise<ApiResponse<null>> => {
    const res = await axiosClient.delete<ApiResponse<null>>(`/admin/teachers/${id}`);
    return res.data;
  },
};

