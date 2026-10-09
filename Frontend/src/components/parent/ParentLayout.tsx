import React, { useState } from 'react';
import { ParentSidebar } from './ParentSidebar';
import { ParentHeader } from './ParentHeader';
import './ParentDashboard.css';

interface ParentLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export const ParentLayout: React.FC<ParentLayoutProps> = ({
  children,
  pageTitle = 'Dashboard',
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="parent-portal-root">
      {/* Left Sidebar */}
      <ParentSidebar
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="parent-main-wrapper">
        <ParentHeader
          pageTitle={pageTitle}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        {/* Spacious Content Viewport */}
        <main className="parent-content-viewport">
          <div className="parent-content-inner">{children}</div>
        </main>
      </div>
    </div>
  );
};
