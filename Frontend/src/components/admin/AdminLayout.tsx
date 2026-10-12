import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import './AdminDashboard.css';

interface AdminLayoutProps {
  children: React.ReactNode;
  breadcrumbTitle?: string;
  pendingAdmissionsCount?: number;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  breadcrumbTitle = 'Dashboard',
  pendingAdmissionsCount,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="admin-portal-root">
      {/* Slim Persistent Sidebar */}
      <AdminSidebar
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        pendingAdmissionsCount={pendingAdmissionsCount}
      />

      {/* Main Column */}
      <div className="admin-main-wrapper">
        <AdminHeader
          breadcrumbTitle={breadcrumbTitle}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        {/* Content Viewport */}
        <main className="admin-content-viewport">
          {children}
        </main>
      </div>
    </div>
  );
};
