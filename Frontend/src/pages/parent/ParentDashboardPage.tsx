import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, RotateCw } from 'lucide-react';
import { ParentLayout } from '../../components/parent/ParentLayout';
import { ParentWelcomeSection } from '../../components/parent/ParentWelcomeSection';
import { ParentEmptyState } from '../../components/parent/ParentEmptyState';
import { ChildrenListSection } from '../../components/parent/ChildrenListSection';
import { RegistrationRequestsSection } from '../../components/parent/RegistrationRequestsSection';
import { ParentQuickAccess } from '../../components/parent/ParentQuickAccess';
import { UpcomingActivitiesSection } from '../../components/parent/UpcomingActivitiesSection';
import { RecentNoticesSection } from '../../components/parent/RecentNoticesSection';
import { ParentSkeleton } from '../../components/parent/ParentSkeleton';
import { ChildProfileModal } from '../../components/parent/ChildProfileModal';
import { RegistrationRequestModal } from '../../components/parent/RegistrationRequestModal';
import { parentApi } from '../../api/parentApi';
import { ParentDashboardData, StudentRegistrationRequest, ChildProfile } from '../../types/parent.types';

export const ParentDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<ParentDashboardData>({
    children: [],
    registrationRequests: [],
    unreadNoticesCount: 0,
    upcomingActivitiesCount: 0,
  });

  const [selectedChildForProfile, setSelectedChildForProfile] = useState<ChildProfile | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<StudentRegistrationRequest | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await parentApi.getDashboardData();
      if (res.data) {
        setDashboardData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load parent dashboard information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleAddStudent = () => {
    navigate('/parent/students/add');
  };

  const handleViewChildProfile = (childId: string) => {
    const child = dashboardData.children.find((c) => c.id === childId);
    if (child) {
      setSelectedChildForProfile(child);
    }
  };

  const handleViewRequest = (request: StudentRegistrationRequest) => {
    setSelectedRequest(request);
  };

  const hasApprovedChildren = dashboardData.children && dashboardData.children.length > 0;
  const hasRequests = dashboardData.registrationRequests && dashboardData.registrationRequests.length > 0;
  const isFirstTimeParent = !hasApprovedChildren && !hasRequests;

  // Extract academic year if available
  const academicYear =
    dashboardData.children[0]?.academicYear ||
    dashboardData.registrationRequests[0]?.academicYear ||
    '2026-2027';

  return (
    <ParentLayout pageTitle="Dashboard">
      {/* Loading Skeleton */}
      {loading && <ParentSkeleton />}

      {/* Error State with Retry */}
      {!loading && error && (
        <div className="parent-dashboard-error-state">
          <AlertCircle size={28} className="text-danger" />
          <h4 className="parent-error-title">Unable to Load Dashboard Data</h4>
          <p className="parent-error-desc">{error}</p>
          <button
            type="button"
            className="btn-parent-outline-action"
            onClick={fetchDashboard}
            style={{ marginTop: '12px' }}
          >
            <RotateCw size={14} />
            <span>Retry Loading</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {!loading && !error && (
        <>
          {/* Personalized Welcome Header with Academic Year */}
          <ParentWelcomeSection academicYear={academicYear} />

          <div className="parent-dashboard-layout-grid">
            {/* Main Column */}
            <div className="parent-dashboard-main-col">
              {/* 1. First-Time Parent Empty State (No children and no requests) */}
              {isFirstTimeParent && (
                <ParentEmptyState onAddStudent={handleAddStudent} />
              )}

              {/* 2. Registration Requests Stack (Separate from enrolled children) */}
              {hasRequests && (
                <RegistrationRequestsSection
                  requests={dashboardData.registrationRequests}
                  onViewRequest={handleViewRequest}
                />
              )}

              {/* 3. Approved Children Overview (Compact cards with View All link) */}
              {(!isFirstTimeParent || hasApprovedChildren) && (
                <ChildrenListSection
                  childrenList={dashboardData.children}
                  onAddChild={handleAddStudent}
                  onViewChildProfile={handleViewChildProfile}
                />
              )}

              {/* 4. Quick Access Shortcuts Grid (All 6 tools) */}
              <ParentQuickAccess />
            </div>

            {/* Side Column: Activities & Notices */}
            <div className="parent-dashboard-side-col">
              <UpcomingActivitiesSection />
              <RecentNoticesSection />
            </div>
          </div>
        </>
      )}

      {/* Child Profile Modal */}
      <ChildProfileModal
        child={selectedChildForProfile}
        isOpen={Boolean(selectedChildForProfile)}
        onClose={() => setSelectedChildForProfile(null)}
      />

      {/* View Request Details Modal */}
      <RegistrationRequestModal
        request={selectedRequest}
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
      />
    </ParentLayout>
  );
};

export default ParentDashboardPage;
