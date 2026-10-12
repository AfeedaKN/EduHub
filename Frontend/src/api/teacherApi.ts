import { axiosClient } from './axiosClient';
import { TeacherDashboardData, TeacherClassItem } from '../types/teacher.types';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const teacherApi = {
  // Get aggregated dashboard data for authenticated teacher
  getDashboardData: async (): Promise<ApiResponse<TeacherDashboardData>> => {
    const res = await axiosClient.get<ApiResponse<TeacherDashboardData>>('/teacher/dashboard');
    return res.data;
  },

  // Get assigned classes list
  getMyClasses: async (): Promise<ApiResponse<TeacherClassItem[]>> => {
    const res = await axiosClient.get<ApiResponse<TeacherClassItem[]>>('/teacher/classes');
    return res.data;
  },

  // Get enrolled students in teacher's classes
  getMyStudents: async (): Promise<ApiResponse<any[]>> => {
    const res = await axiosClient.get<ApiResponse<any[]>>('/teacher/students');
    return res.data;
  },
};
