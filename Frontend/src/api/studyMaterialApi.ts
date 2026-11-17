import { axiosClient } from './axiosClient';
import {
  TeacherStudyMaterial,
  TeacherStudyMaterialsResponse,
  TeacherStudyMaterialFilters,
  CreateStudyMaterialPayload,
  UpdateStudyMaterialPayload,
  ParentStudyMaterialsResponse,
  ParentStudyMaterialsQuery,
  AdminStudyMaterialSummary,
  AdminStudyMaterialListResponse,
  AdminStudyMaterialListItem,
  AdminStudyMaterialFilterParams,
  AdminStudyMaterialMetadata,
} from '../types/studyMaterial.types';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export const teacherStudyMaterialApi = {
  getStudyMaterials: async (
    params?: TeacherStudyMaterialFilters
  ): Promise<ApiResponse<TeacherStudyMaterialsResponse>> => {
    const res = await axiosClient.get<ApiResponse<TeacherStudyMaterialsResponse>>(
      '/teacher/study-materials',
      { params }
    );
    return res.data;
  },

  getStudyMaterialById: async (id: string): Promise<ApiResponse<TeacherStudyMaterial>> => {
    const res = await axiosClient.get<ApiResponse<TeacherStudyMaterial>>(
      `/teacher/study-materials/${id}`
    );
    return res.data;
  },

  createStudyMaterial: async (
    payload: CreateStudyMaterialPayload
  ): Promise<ApiResponse<TeacherStudyMaterial>> => {
    const res = await axiosClient.post<ApiResponse<TeacherStudyMaterial>>(
      '/teacher/study-materials',
      payload
    );
    return res.data;
  },

  updateStudyMaterial: async (
    id: string,
    payload: UpdateStudyMaterialPayload
  ): Promise<ApiResponse<TeacherStudyMaterial>> => {
    const res = await axiosClient.put<ApiResponse<TeacherStudyMaterial>>(
      `/teacher/study-materials/${id}`,
      payload
    );
    return res.data;
  },

  deleteStudyMaterial: async (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const res = await axiosClient.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/teacher/study-materials/${id}`
    );
    return res.data;
  },

  getAssignedClasses: async (): Promise<ApiResponse<any>> => {
    const res = await axiosClient.get<ApiResponse<any>>('/teacher/classes');
    return res.data;
  },
};

export const parentStudyMaterialApi = {
  getStudyMaterials: async (
    params?: ParentStudyMaterialsQuery
  ): Promise<ApiResponse<ParentStudyMaterialsResponse>> => {
    const res = await axiosClient.get<ApiResponse<ParentStudyMaterialsResponse>>(
      '/parent/study-materials',
      { params }
    );
    return res.data;
  },
};

export const adminStudyMaterialApi = {
  getSummary: async (academicYear?: string): Promise<ApiResponse<AdminStudyMaterialSummary>> => {
    const res = await axiosClient.get<ApiResponse<AdminStudyMaterialSummary>>(
      '/admin/study-materials/summary',
      {
        params: academicYear ? { academicYear } : undefined,
      }
    );
    return res.data;
  },

  getMetadata: async (academicYear?: string): Promise<ApiResponse<AdminStudyMaterialMetadata>> => {
    const res = await axiosClient.get<ApiResponse<AdminStudyMaterialMetadata>>(
      '/admin/study-materials/metadata',
      {
        params: academicYear ? { academicYear } : undefined,
      }
    );
    return res.data;
  },

  getStudyMaterials: async (
    params?: AdminStudyMaterialFilterParams
  ): Promise<ApiResponse<AdminStudyMaterialListResponse>> => {
    const res = await axiosClient.get<ApiResponse<AdminStudyMaterialListResponse>>(
      '/admin/study-materials',
      { params }
    );
    return res.data;
  },

  getStudyMaterialById: async (
    id: string
  ): Promise<ApiResponse<AdminStudyMaterialListItem>> => {
    const res = await axiosClient.get<ApiResponse<AdminStudyMaterialListItem>>(
      `/admin/study-materials/${id}`
    );
    return res.data;
  },
};
