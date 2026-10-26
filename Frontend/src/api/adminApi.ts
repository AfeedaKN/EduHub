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

  // ==========================================
  // Teacher Class Assignment APIs
  // ==========================================

  // Get all assignments across all teachers
  getAllTeacherAssignments: async (params?: {
    academicYear?: string;
    className?: string;
    section?: string;
    subject?: string;
    teacherId?: string;
    search?: string;
  }): Promise<ApiResponse<import('../types/admin.types').TeacherAssignmentRecord[]>> => {
    const res = await axiosClient.get<
      ApiResponse<import('../types/admin.types').TeacherAssignmentRecord[]>
    >('/admin/teachers/assignments/all', { params });
    return res.data;
  },

  // Get assignments for a specific teacher
  getTeacherAssignments: async (
    teacherId: string
  ): Promise<ApiResponse<import('../types/admin.types').TeacherAssignmentRecord[]>> => {
    const res = await axiosClient.get<
      ApiResponse<import('../types/admin.types').TeacherAssignmentRecord[]>
    >(`/admin/teachers/${teacherId}/assignments`);
    return res.data;
  },

  // Assign teacher to class, section, subject, academic year
  assignTeacherToClass: async (
    teacherId: string,
    payload: import('../types/admin.types').AssignTeacherPayload
  ): Promise<ApiResponse<import('../types/admin.types').TeacherAssignmentRecord>> => {
    const res = await axiosClient.post<
      ApiResponse<import('../types/admin.types').TeacherAssignmentRecord>
    >(`/admin/teachers/${teacherId}/assignments`, payload);
    return res.data;
  },

  // Update teacher assignment
  updateTeacherAssignment: async (
    teacherId: string,
    assignmentId: string,
    payload: import('../types/admin.types').AssignTeacherPayload
  ): Promise<ApiResponse<import('../types/admin.types').TeacherAssignmentRecord>> => {
    const res = await axiosClient.put<
      ApiResponse<import('../types/admin.types').TeacherAssignmentRecord>
    >(`/admin/teachers/${teacherId}/assignments/${assignmentId}`, payload);
    return res.data;
  },

  // Remove teacher assignment
  removeTeacherAssignment: async (
    teacherId: string,
    assignmentId: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const res = await axiosClient.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/admin/teachers/${teacherId}/assignments/${assignmentId}`
    );
    return res.data;
  },

  // ==========================================
  // Timetable Management APIs
  // ==========================================

  // Get filtered timetable periods
  getTimetable: async (
    params?: import('../types/timetable.types').TimetableFilterParams
  ): Promise<ApiResponse<import('../types/timetable.types').TimetablePeriod[]>> => {
    const res = await axiosClient.get<
      ApiResponse<import('../types/timetable.types').TimetablePeriod[]>
    >('/admin/timetable', { params });
    return res.data;
  },

  // Get single timetable period by ID
  getTimetablePeriod: async (
    id: string
  ): Promise<ApiResponse<import('../types/timetable.types').TimetablePeriod>> => {
    const res = await axiosClient.get<
      ApiResponse<import('../types/timetable.types').TimetablePeriod>
    >(`/admin/timetable/${id}`);
    return res.data;
  },

  // Create new timetable period
  createTimetablePeriod: async (
    payload: import('../types/timetable.types').CreatePeriodPayload
  ): Promise<ApiResponse<import('../types/timetable.types').TimetablePeriod>> => {
    const res = await axiosClient.post<
      ApiResponse<import('../types/timetable.types').TimetablePeriod>
    >('/admin/timetable', payload);
    return res.data;
  },

  // Update existing timetable period
  updateTimetablePeriod: async (
    id: string,
    payload: import('../types/timetable.types').UpdatePeriodPayload
  ): Promise<ApiResponse<import('../types/timetable.types').TimetablePeriod>> => {
    const res = await axiosClient.put<
      ApiResponse<import('../types/timetable.types').TimetablePeriod>
    >(`/admin/timetable/${id}`, payload);
    return res.data;
  },

  // Delete timetable period
  deleteTimetablePeriod: async (id: string): Promise<ApiResponse<null>> => {
    const res = await axiosClient.delete<ApiResponse<null>>(`/admin/timetable/${id}`);
    return res.data;
  },

  // ==========================================
  // Examinations & Subject-wise Scheduling APIs
  // ==========================================

  getExamsSummary: async (params?: {
    academicYear?: string;
  }): Promise<ApiResponse<import('../types/exam.types').ExamsSummaryCounts>> => {
    const res = await axiosClient.get<ApiResponse<import('../types/exam.types').ExamsSummaryCounts>>(
      '/admin/exams/summary',
      { params }
    );
    return res.data;
  },

  getExams: async (
    params?: import('../types/exam.types').ExamFilterParams
  ): Promise<ApiResponse<import('../types/exam.types').Exam[]>> => {
    const res = await axiosClient.get<ApiResponse<import('../types/exam.types').Exam[]>>(
      '/admin/exams',
      { params }
    );
    return res.data;
  },

  getExamById: async (
    id: string
  ): Promise<ApiResponse<import('../types/exam.types').Exam>> => {
    const res = await axiosClient.get<ApiResponse<import('../types/exam.types').Exam>>(
      `/admin/exams/${id}`
    );
    return res.data;
  },

  createExam: async (
    payload: import('../types/exam.types').CreateExamPayload
  ): Promise<ApiResponse<import('../types/exam.types').Exam>> => {
    const res = await axiosClient.post<ApiResponse<import('../types/exam.types').Exam>>(
      '/admin/exams',
      payload
    );
    return res.data;
  },

  updateExam: async (
    id: string,
    payload: import('../types/exam.types').UpdateExamPayload
  ): Promise<ApiResponse<import('../types/exam.types').Exam>> => {
    const res = await axiosClient.put<ApiResponse<import('../types/exam.types').Exam>>(
      `/admin/exams/${id}`,
      payload
    );
    return res.data;
  },

  deleteExam: async (id: string): Promise<ApiResponse<null>> => {
    const res = await axiosClient.delete<ApiResponse<null>>(`/admin/exams/${id}`);
    return res.data;
  },

  getExamSchedules: async (
    examId: string
  ): Promise<ApiResponse<import('../types/exam.types').ExamSchedule[]>> => {
    const res = await axiosClient.get<ApiResponse<import('../types/exam.types').ExamSchedule[]>>(
      `/admin/exams/${examId}/schedules`
    );
    return res.data;
  },

  createExamSchedule: async (
    examId: string,
    payload: import('../types/exam.types').CreateSchedulePayload
  ): Promise<ApiResponse<import('../types/exam.types').ExamSchedule>> => {
    const res = await axiosClient.post<ApiResponse<import('../types/exam.types').ExamSchedule>>(
      `/admin/exams/${examId}/schedules`,
      payload
    );
    return res.data;
  },

  updateExamSchedule: async (
    examId: string,
    scheduleId: string,
    payload: import('../types/exam.types').UpdateSchedulePayload
  ): Promise<ApiResponse<import('../types/exam.types').ExamSchedule>> => {
    const res = await axiosClient.put<ApiResponse<import('../types/exam.types').ExamSchedule>>(
      `/admin/exams/${examId}/schedules/${scheduleId}`,
      payload
    );
    return res.data;
  },

  deleteExamSchedule: async (
    examId: string,
    scheduleId: string
  ): Promise<ApiResponse<null>> => {
    const res = await axiosClient.delete<ApiResponse<null>>(
      `/admin/exams/${examId}/schedules/${scheduleId}`
    );
    return res.data;
  },

  getValidSubjectsForClassSection: async (
    classId: string,
    section: string,
    academicYear?: string
  ): Promise<ApiResponse<string[]>> => {
    const res = await axiosClient.get<ApiResponse<string[]>>(
      `/admin/exams/classes/${classId}/sections/${section}/subjects`,
      { params: { academicYear } }
    );
    return res.data;
  },

  getScheduleMarks: async (
    examId: string,
    scheduleId: string
  ): Promise<ApiResponse<{ schedule: import('../types/exam.types').ExamSchedule; marks: any }>> => {
    const res = await axiosClient.get<
      ApiResponse<{ schedule: import('../types/exam.types').ExamSchedule; marks: any }>
    >(`/admin/exams/${examId}/schedules/${scheduleId}/marks`);
    return res.data;
  },

  returnScheduleMarks: async (
    examId: string,
    scheduleId: string,
    reason: string
  ): Promise<ApiResponse<{ schedule: import('../types/exam.types').ExamSchedule; marks: any }>> => {
    const res = await axiosClient.post<
      ApiResponse<{ schedule: import('../types/exam.types').ExamSchedule; marks: any }>
    >(`/admin/exams/${examId}/schedules/${scheduleId}/marks/return`, { reason });
    return res.data;
  },

  publishScheduleMarks: async (
    examId: string,
    scheduleId: string
  ): Promise<ApiResponse<{ schedule: import('../types/exam.types').ExamSchedule; marks: any }>> => {
    const res = await axiosClient.post<
      ApiResponse<{ schedule: import('../types/exam.types').ExamSchedule; marks: any }>
    >(`/admin/exams/${examId}/schedules/${scheduleId}/marks/publish`);
    return res.data;
  },

  reopenScheduleMarks: async (
    examId: string,
    scheduleId: string,
    reason: string
  ): Promise<ApiResponse<{ schedule: import('../types/exam.types').ExamSchedule; marks: any }>> => {
    const res = await axiosClient.post<
      ApiResponse<{ schedule: import('../types/exam.types').ExamSchedule; marks: any }>
    >(`/admin/exams/${examId}/schedules/${scheduleId}/marks/reopen`, { reason });
    return res.data;
  },

  getResultsDashboard: async (
    params?: import('../types/exam.types').ManagementResultsFilterParams
  ): Promise<ApiResponse<import('../types/exam.types').ManagementResultsDashboardResponse>> => {
    const res = await axiosClient.get<
      ApiResponse<import('../types/exam.types').ManagementResultsDashboardResponse>
    >('/admin/exams/results-dashboard', { params });
    return res.data;
  },

  getScheduleMarksReview: async (
    examId: string,
    scheduleId: string
  ): Promise<ApiResponse<import('../types/exam.types').ManagementScheduleMarksReviewDetails>> => {
    const res = await axiosClient.get<
      ApiResponse<import('../types/exam.types').ManagementScheduleMarksReviewDetails>
    >(`/admin/exams/${examId}/schedules/${scheduleId}/marks-review`);
    return res.data;
  },
};

