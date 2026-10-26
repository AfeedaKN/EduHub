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

  // Get coursework assignments list and summary metrics
  getAssignments: async (
    params?: import('../types/assignment.types').AssignmentFilterParams
  ): Promise<ApiResponse<import('../types/assignment.types').AssignmentsListResponse>> => {
    const res = await axiosClient.get<
      ApiResponse<import('../types/assignment.types').AssignmentsListResponse>
    >('/teacher/assignments', { params });
    return res.data;
  },

  // Get single assignment details
  getAssignmentById: async (
    id: string
  ): Promise<ApiResponse<import('../types/assignment.types').Assignment>> => {
    const res = await axiosClient.get<
      ApiResponse<import('../types/assignment.types').Assignment>
    >(`/teacher/assignments/${id}`);
    return res.data;
  },

  // Create new assignment
  createAssignment: async (
    payload: import('../types/assignment.types').CreateAssignmentPayload
  ): Promise<ApiResponse<import('../types/assignment.types').Assignment>> => {
    const res = await axiosClient.post<
      ApiResponse<import('../types/assignment.types').Assignment>
    >('/teacher/assignments', payload);
    return res.data;
  },

  // Update existing assignment
  updateAssignment: async (
    id: string,
    payload: import('../types/assignment.types').UpdateAssignmentPayload
  ): Promise<ApiResponse<import('../types/assignment.types').Assignment>> => {
    const res = await axiosClient.put<
      ApiResponse<import('../types/assignment.types').Assignment>
    >(`/teacher/assignments/${id}`, payload);
    return res.data;
  },

  // Update assignment status
  updateAssignmentStatus: async (
    id: string,
    status: import('../types/assignment.types').AssignmentStatus
  ): Promise<ApiResponse<import('../types/assignment.types').Assignment>> => {
    const res = await axiosClient.patch<
      ApiResponse<import('../types/assignment.types').Assignment>
    >(`/teacher/assignments/${id}/status`, { status });
    return res.data;
  },

  // Delete assignment
  deleteAssignment: async (id: string): Promise<ApiResponse<null>> => {
    const res = await axiosClient.delete<ApiResponse<null>>(`/teacher/assignments/${id}`);
    return res.data;
  },

  // Get submissions for an assignment
  getAssignmentSubmissions: async (
    assignmentId: string
  ): Promise<ApiResponse<import('../types/assignment.types').TeacherSubmissionItem[]>> => {
    const res = await axiosClient.get<
      ApiResponse<import('../types/assignment.types').TeacherSubmissionItem[]>
    >(`/teacher/assignments/${assignmentId}/submissions`);
    return res.data;
  },

  // Grade or save draft review for a student submission
  gradeSubmission: async (
    assignmentId: string,
    submissionId: string,
    payload: import('../types/assignment.types').GradeSubmissionPayload
  ): Promise<ApiResponse<import('../types/assignment.types').TeacherSubmissionItem>> => {
    const res = await axiosClient.put<
      ApiResponse<import('../types/assignment.types').TeacherSubmissionItem>
    >(`/teacher/assignments/${assignmentId}/submissions/${submissionId}/grade`, payload);
    return res.data;
  },

  // Get assigned exams and schedule marks overview
  getTeacherExams: async (
    params?: import('../types/exam.types').TeacherExamFilterParams
  ): Promise<ApiResponse<import('../types/exam.types').TeacherExamsListResponse>> => {
    const res = await axiosClient.get<
      ApiResponse<import('../types/exam.types').TeacherExamsListResponse>
    >('/teacher/exams', { params });
    return res.data;
  },

  // Get detailed marks roster for an authorized scheduled subject
  getExamScheduleMarks: async (
    scheduleId: string
  ): Promise<ApiResponse<import('../types/exam.types').TeacherExamScheduleDetails>> => {
    const res = await axiosClient.get<
      ApiResponse<import('../types/exam.types').TeacherExamScheduleDetails>
    >(`/teacher/exams/schedules/${scheduleId}`);
    return res.data;
  },

  // Save draft marks for an exam schedule
  saveExamMarksDraft: async (
    scheduleId: string,
    payload: import('../types/exam.types').SaveMarksPayload
  ): Promise<ApiResponse<import('../types/exam.types').TeacherExamScheduleDetails>> => {
    const res = await axiosClient.post<
      ApiResponse<import('../types/exam.types').TeacherExamScheduleDetails>
    >(`/teacher/exams/schedules/${scheduleId}/draft`, payload);
    return res.data;
  },

  // Submit marks for Management review
  submitExamMarks: async (
    scheduleId: string,
    payload: import('../types/exam.types').SaveMarksPayload
  ): Promise<ApiResponse<import('../types/exam.types').TeacherExamScheduleDetails>> => {
    const res = await axiosClient.post<
      ApiResponse<import('../types/exam.types').TeacherExamScheduleDetails>
    >(`/teacher/exams/schedules/${scheduleId}/submit`, payload);
    return res.data;
  },
};

