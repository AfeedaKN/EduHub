import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { MainLayout } from '../components/layout/MainLayout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { ParentDashboardPage } from '../pages/parent/ParentDashboardPage';
import { ParentAssignmentsPage } from '../pages/parent/ParentAssignmentsPage';
import { ParentExamsPage } from '../pages/parent/ParentExamsPage';
import { ParentPlaceholderPage } from '../pages/parent/ParentPlaceholderPage';
import { AddStudentPage } from '../pages/parent/AddStudentPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminAdmissionsPage } from '../pages/admin/AdminAdmissionsPage';
import { AdminClassesPage } from '../pages/admin/AdminClassesPage';
import { AdminTeachersPage } from '../pages/admin/AdminTeachersPage';
import { AdminTimetablePage } from '../pages/admin/AdminTimetablePage';
import { AdminExamsPage } from '../pages/admin/AdminExamsPage';
import { AdminPlaceholderPage } from '../pages/admin/AdminPlaceholderPage';
import { TeacherDashboardPage } from '../pages/teacher/TeacherDashboardPage';
import { TeacherClassesPage } from '../pages/teacher/TeacherClassesPage';
import { TeacherStudentsPage } from '../pages/teacher/TeacherStudentsPage';
import { TeacherAttendancePage } from '../pages/teacher/TeacherAttendancePage';
import { TeacherTimetablePage } from '../pages/teacher/TeacherTimetablePage';
import { TeacherAssignmentsPage } from '../pages/teacher/TeacherAssignmentsPage';
import { TeacherMyExamsPage } from '../pages/teacher/TeacherMyExamsPage';
import { TeacherEnterMarksPage } from '../pages/teacher/TeacherEnterMarksPage';
import { TeacherPlaceholderPage } from '../pages/teacher/TeacherPlaceholderPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Common Shared Login Page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Parent Registration Page */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/parent-register" element={<RegisterPage />} />

        {/* Parent Portal Protected Routes */}
        <Route
          path="/parent/dashboard"
          element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <ParentDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/parent" element={<Navigate to="/parent/dashboard" replace />} />

        {/* Add Student Admission Request */}
        <Route
          path="/parent/students/add"
          element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <AddStudentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/children/add"
          element={<Navigate to="/parent/students/add" replace />}
        />

        {/* Parent Secondary Routes */}
        <Route
          path="/parent/children"
          element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <ParentDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/attendance"
          element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <ParentPlaceholderPage title="Student Attendance Records" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/academics"
          element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <ParentPlaceholderPage title="Academic Syllabus & Subjects" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/timetable"
          element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <ParentPlaceholderPage title="Class Timetable & Schedule" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/assignments"
          element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <ParentAssignmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/exams"
          element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <ParentExamsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/fees"
          element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <ParentPlaceholderPage title="Tuition & School Fees" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/communication/notices"
          element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <ParentPlaceholderPage title="School Circulars & Notices" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/communication/messages"
          element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <ParentPlaceholderPage title="Teacher & Staff Messages" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/communication/meetings"
          element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <ParentPlaceholderPage title="Parent-Teacher Meetings" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/profile"
          element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <ParentPlaceholderPage title="Parent Account Profile" />
            </ProtectedRoute>
          }
        />

        {/* ============================================================== */}
        {/* Admin / School Management Protected Routes                      */}
        {/* ============================================================== */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['MANAGEMENT']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Admissions Management Page */}
        <Route
          path="/admin/admissions"
          element={
            <ProtectedRoute allowedRoles={['MANAGEMENT']}>
              <AdminAdmissionsPage />
            </ProtectedRoute>
          }
        />

        {/* Secondary Admin Module Routes (Ensuring no broken links) */}
        <Route
          path="/admin/people/students"
          element={
            <ProtectedRoute allowedRoles={['MANAGEMENT']}>
              <AdminPlaceholderPage
                title="Enrolled Students Management"
                description="Manage student records, enrollment status, section allocations, and student profiles."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/people/teachers"
          element={
            <ProtectedRoute allowedRoles={['MANAGEMENT']}>
              <AdminTeachersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teachers"
          element={<Navigate to="/admin/people/teachers" replace />}
        />
        <Route
          path="/admin/people/parents"
          element={
            <ProtectedRoute allowedRoles={['MANAGEMENT']}>
              <AdminPlaceholderPage
                title="Parent Accounts Directory"
                description="Directory of registered parent guardians, their linked children, and contact verifications."
              />
            </ProtectedRoute>
          }
        />
        {/* Classes & Sections Management Page */}
        <Route
          path="/admin/academics/classes"
          element={
            <ProtectedRoute allowedRoles={['MANAGEMENT']}>
              <AdminClassesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes"
          element={<Navigate to="/admin/academics/classes" replace />}
        />
        <Route
          path="/admin/academics/subjects"
          element={
            <ProtectedRoute allowedRoles={['MANAGEMENT']}>
              <AdminPlaceholderPage
                title="Curriculum & Subjects"
                description="Define academic subjects, syllabus modules, elective options, and grading criteria."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/academics/timetable"
          element={
            <ProtectedRoute allowedRoles={['MANAGEMENT']}>
              <AdminTimetablePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute allowedRoles={['MANAGEMENT']}>
              <AdminPlaceholderPage
                title="School Attendance Management"
                description="Review daily school-wide attendance, generate monthly reports, and manage leave records."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/exams"
          element={
            <ProtectedRoute allowedRoles={['MANAGEMENT']}>
              <AdminExamsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/exams/:id"
          element={
            <ProtectedRoute allowedRoles={['MANAGEMENT']}>
              <AdminExamsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/fees"
          element={
            <ProtectedRoute allowedRoles={['MANAGEMENT']}>
              <AdminPlaceholderPage
                title="Fee Collection & Accounting"
                description="Configure school fee structures, review pending collections, and generate payment receipts."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/communication/notices"
          element={
            <ProtectedRoute allowedRoles={['MANAGEMENT']}>
              <AdminPlaceholderPage
                title="School Circulars & Notices"
                description="Draft and broadcast official circulars, event alerts, and announcements to parents and faculty."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/communication/meetings"
          element={
            <ProtectedRoute allowedRoles={['MANAGEMENT']}>
              <AdminPlaceholderPage
                title="Parent-Teacher Meetings"
                description="Schedule school-wide PTM sessions, configure appointment slots, and track parent attendance."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/careers"
          element={
            <ProtectedRoute allowedRoles={['MANAGEMENT']}>
              <AdminPlaceholderPage
                title="Career Openings & Applications"
                description="Post school job openings, review teacher candidate resumes, and schedule hiring interviews."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['MANAGEMENT']}>
              <AdminPlaceholderPage
                title="School Profile & Settings"
                description="Manage school information, academic year calendars, user access rules, and system configurations."
              />
            </ProtectedRoute>
          }
        />

        {/* Teacher Portal Protected Routes */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
        <Route
          path="/teacher/classes"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherClassesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/students"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherStudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherAttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/timetable"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherTimetablePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/assignments"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherAssignmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/exams"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherMyExamsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/exams/:scheduleId/marks"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherEnterMarksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/exams/:examId/schedules/:scheduleId/marks"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherEnterMarksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/notices"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherPlaceholderPage
                title="School Circulars & Announcements"
                description="Stay up to date with official circulars, faculty meetings, and institutional announcements."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/profile"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherPlaceholderPage
                title="Faculty Profile"
                description="View your professional teaching credentials, employee identification, and contact information."
              />
            </ProtectedRoute>
          }
        />

        {/* System Diagnostics */}
        <Route
          path="/system-status"
          element={
            <MainLayout>
              <HomePage />
            </MainLayout>
          }
        />

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <MainLayout>
              <NotFoundPage />
            </MainLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
