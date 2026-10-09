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
import { parentApi } from '../../api/parentApi';
import { ParentDashboardData, StudentRegistrationRequest } from '../../types/parent.types';

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
    navigate(`/parent/children/${childId}`);
  };

  const handleViewRequest = (request: StudentRegistrationRequest) => {
    setSelectedRequest(request);
  };

  const hasApprovedChildren = dashboardData.children && dashboardData.children.length > 0;
  const hasRequests = dashboardData.registrationRequests && dashboardData.registrationRequests.length > 0;
  const isFirstTimeParent = !hasApprovedChildren && !hasRequests;

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
          {/* Personalized Welcome Header */}
          <ParentWelcomeSection />

          <div className="parent-dashboard-layout-grid">
            {/* Main Column */}
            <div className="parent-dashboard-main-col">
              {/* 1. First-Time Parent Empty State */}
              {isFirstTimeParent && (
                <ParentEmptyState onAddStudent={handleAddStudent} />
              )}

              {/* 2. Registration Requests Stack (Pending / Rejected) */}
              {hasRequests && (
                <RegistrationRequestsSection
                  requests={dashboardData.registrationRequests}
                  onViewRequest={handleViewRequest}
                />
              )}

              {/* 3. Approved Children List (Main Focus) */}
              {hasApprovedChildren && (
                <ChildrenListSection
                  childrenList={dashboardData.children}
                  onAddChild={handleAddStudent}
                  onViewChildProfile={handleViewChildProfile}
                />
              )}

              {/* 4. Quick Access Shortcuts (Only for Approved Children) */}
              {hasApprovedChildren && <ParentQuickAccess />}
            </div>

            {/* Side Column: Activities & Notices */}
            <div className="parent-dashboard-side-col">
              <UpcomingActivitiesSection />
              <RecentNoticesSection />
            </div>
          </div>
        </>
      )}

      {/* View Request Details Modal */}
      {selectedRequest && (
        <div className="auth-modal-backdrop" onClick={() => setSelectedRequest(null)}>
          <div className="auth-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h4 className="auth-modal-title">Registration Request Details</h4>
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <span className="req-meta-label">Student:</span>{' '}
                <strong>{selectedRequest.studentFullName}</strong>
              </div>
              <div>
                <span className="req-meta-label">Requested Class:</span>{' '}
                <strong>{selectedRequest.requestedGrade}</strong>
              </div>
              <div>
                <span className="req-meta-label">Status:</span>{' '}
                <span className={`parent-request-badge ${selectedRequest.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>
                  {selectedRequest.status}
                </span>
              </div>
              {selectedRequest.rejectionReason && (
                <div style={{ padding: '10px', background: '#FEE2E2', borderRadius: '6px', color: '#991B1B' }}>
                  <strong>Feedback from School:</strong> {selectedRequest.rejectionReason}
                </div>
              )}
            </div>
            <div className="auth-modal-actions" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="btn-nav-primary"
                onClick={() => setSelectedRequest(null)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </ParentLayout>
  );
};

export default ParentDashboardPage;
