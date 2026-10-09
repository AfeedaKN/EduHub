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
import { ParentPlaceholderPage } from '../pages/parent/ParentPlaceholderPage';
import { AddStudentPage } from '../pages/parent/AddStudentPage';

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
              <ParentPlaceholderPage title="Homework & Assignments" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/exams"
          element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <ParentPlaceholderPage title="Examinations & Grade Reports" />
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
