import React, { useState } from 'react';
import { TeacherSidebar } from './TeacherSidebar';
import { TeacherHeader } from './TeacherHeader';
import type { TeacherNotice } from '../../types/teacher.types';
import './TeacherDashboard.css';

interface TeacherLayoutProps {
  children: React.ReactNode;
  notices?: TeacherNotice[];
}

export const TeacherLayout: React.FC<TeacherLayoutProps> = ({
  children,
  notices,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="teacher-portal-root">
      {/* Sidebar */}
      <TeacherSidebar
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="teacher-main-wrapper">
        <TeacherHeader
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          notices={notices}
        />

        <main className="teacher-content-viewport">
          {children}
        </main>
      </div>
    </div>
  );
};
