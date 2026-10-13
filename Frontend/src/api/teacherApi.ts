import { axiosClient } from './axiosClient';
import {
  TeacherDashboardData,
  TeacherClassItem,
  TeacherStudentItem,
  TeacherStudentFilterParams,
} from '../types/teacher.types';
import {
  AttendanceRegister,
  SaveAttendancePayload,
  AttendanceHistoryEntry,
} from '../types/attendance.types';

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

  // Get enrolled students in teacher's classes with optional query filters
  getMyStudents: async (
    params?: TeacherStudentFilterParams
  ): Promise<ApiResponse<TeacherStudentItem[]>> => {
    const res = await axiosClient.get<ApiResponse<TeacherStudentItem[]>>('/teacher/students', {
      params,
    });
    return res.data;
  },

  // Get attendance register for a specific section and date
  getAttendanceRegister: async (params: {
    className: string;
    section: string;
    date: string;
  }): Promise<ApiResponse<AttendanceRegister>> => {
    const res = await axiosClient.get<ApiResponse<AttendanceRegister>>('/teacher/attendance', {
      params,
    });
    return res.data;
  },

  // Save new daily attendance register
  saveAttendance: async (
    payload: SaveAttendancePayload
  ): Promise<ApiResponse<AttendanceRegister>> => {
    const res = await axiosClient.post<ApiResponse<AttendanceRegister>>(
      '/teacher/attendance',
      payload
    );
    return res.data;
  },

  // Update existing daily attendance register
  updateAttendance: async (
    payload: SaveAttendancePayload
  ): Promise<ApiResponse<AttendanceRegister>> => {
    const res = await axiosClient.put<ApiResponse<AttendanceRegister>>(
      '/teacher/attendance',
      payload
    );
    return res.data;
  },

  // Get past attendance history sessions for a classroom section
  getAttendanceHistory: async (params: {
    className: string;
    section: string;
    academicYear?: string;
  }): Promise<ApiResponse<AttendanceHistoryEntry[]>> => {
    const res = await axiosClient.get<ApiResponse<AttendanceHistoryEntry[]>>(
      '/teacher/attendance/history',
      { params }
    );
    return res.data;
  },

  // Get complete weekly timetable for authenticated teacher
  getTimetable: async (params?: {
    academicYear?: string;
  }): Promise<ApiResponse<import('../types/timetable.types').TeacherWeeklyTimetableResponse>> => {
    const res = await axiosClient.get<
      ApiResponse<import('../types/timetable.types').TeacherWeeklyTimetableResponse>
    >('/teacher/timetable', { params });
    return res.data;
  },
};
