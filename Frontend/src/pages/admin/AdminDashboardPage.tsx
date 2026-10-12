import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  FileCheck2,
  CreditCard,
  AlertCircle,
  RotateCw,
  Info,
  X,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { SummaryCard } from '../../components/admin/SummaryCard';
import { PendingAdmissionsSection } from '../../components/admin/PendingAdmissionsSection';
import { AttendanceSummarySection } from '../../components/admin/AttendanceSummarySection';
import { UpcomingActivitiesSection } from '../../components/admin/UpcomingActivitiesSection';
import { QuickActionsSection } from '../../components/admin/QuickActionsSection';
import { adminApi } from '../../api/adminApi';
import { AdminDashboardData } from '../../types/admin.types';
import { useAppSelector } from '../../store/hooks';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<AdminDashboardData>({
    totalStudents: 0,
    totalTeachers: 0,
    pendingAdmissionsCount: 0,
    recentPendingAdmissions: [],
    attendanceSummary: null,
    feesSummary: null,
    upcomingActivities: null,
  });

  // Modal for quick actions placeholder notice
  const [quickActionModal, setQuickActionModal] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getDashboardSummary();
      if (res.data) {
        setDashboardData(res.data);
      }
    } catch (err: any) {
      setError(
        err.message || 'Unable to load school management summary. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const adminName = user?.name || 'Administrator';

  return (
    <AdminLayout
      breadcrumbTitle="Dashboard"
      pendingAdmissionsCount={dashboardData.pendingAdmissionsCount}
    >
      {/* Loading Skeleton Indicator */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            className="admin-skeleton-pulse"
            style={{ height: '40px', width: '320px', borderRadius: '8px' }}
          />
          <div className="admin-summary-cards-row">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="admin-skeleton-pulse"
                style={{ height: '110px', borderRadius: '10px' }}
              />
            ))}
          </div>
          <div
            className="admin-skeleton-pulse"
            style={{ height: '280px', borderRadius: '10px' }}
          />
        </div>
      )}

      {/* Global Error Banner with Retry */}
      {!loading && error && (
        <div className="admin-dashboard-error-banner">
          <div className="admin-error-text-block">
            <AlertCircle size={22} />
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem' }}>
                Dashboard Data Unavailable
              </strong>
              <span style={{ fontSize: '0.82rem' }}>{error}</span>
            </div>
          </div>
          <button
            type="button"
            className="admin-btn-retry"
            onClick={fetchDashboard}
          >
            <RotateCw size={14} />
            <span>Retry Loading</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {!loading && !error && (
        <>
          {/* Welcome Section */}
          <section className="admin-welcome-section">
            <div>
              <h1 className="admin-welcome-heading">
                Welcome back, {adminName}
              </h1>
              <p className="admin-welcome-subtitle">
                Here's an overview of your school's activities.
              </p>
            </div>
            <div className="admin-welcome-date">{formattedDate}</div>
          </section>

          {/* Essential Summary Cards Row */}
          <section className="admin-summary-cards-row" aria-label="Key School Metrics">
            {/* Card 1: Total Students */}
            <SummaryCard
              label="Total Students"
              value={dashboardData.totalStudents}
              icon={GraduationCap}
              subtext="Officially enrolled active students"
              indicatorText="Enrolled"
              indicatorVariant="neutral"
            />

            {/* Card 2: Total Teachers */}
            <SummaryCard
              label="Total Teachers"
              value={dashboardData.totalTeachers}
              icon={Users}
              subtext="Active teaching faculty accounts"
              indicatorText="Faculty"
              indicatorVariant="neutral"
            />

            {/* Card 3: Pending Admissions (Most Important - Clickable) */}
            <SummaryCard
              label="Pending Admissions"
              value={dashboardData.pendingAdmissionsCount}
              icon={FileCheck2}
              indicatorText="Awaiting review"
              indicatorVariant="admissions"
              subtext="Click to review student registration requests"
              isClickable={true}
              onClick={() => navigate('/admin/admissions')}
              isHighlight={true}
            />

            {/* Card 4: Pending Fees (Restrained Unavailable State without fabricated data) */}
            <SummaryCard
              label="Pending Fees"
              value={
                dashboardData.feesSummary
                  ? `${dashboardData.feesSummary.currency} ${dashboardData.feesSummary.pendingAmount}`
                  : 'Pending Setup'
              }
              icon={CreditCard}
              indicatorText="Module Setup"
              indicatorVariant="muted"
              subtext="Fee management will activate with the upcoming module"
            />
          </section>

          {/* Main Content Grid: Two Column Layout */}
          <div className="admin-dashboard-grid">
            {/* Primary Main Column */}
            <div className="admin-dashboard-main-col">
              {/* Recent Admission Requests Section */}
              <PendingAdmissionsSection
                requests={dashboardData.recentPendingAdmissions}
                isLoading={loading}
                error={error}
                onRetry={fetchDashboard}
              />

              {/* Today's Attendance Section */}
              <AttendanceSummarySection
                attendanceData={dashboardData.attendanceSummary}
              />
            </div>

            {/* Secondary Side Column */}
            <div className="admin-dashboard-side-col">
              {/* Quick Actions (Restrained: 3 actions) */}
              <QuickActionsSection
                onAddTeacher={() =>
                  setQuickActionModal({
                    title: 'Teacher Account Provisioning',
                    message:
                      'Teacher creation interface is being implemented in the Faculty Management module. School administrators will be able to invite and configure teachers with assigned classes.',
                  })
                }
                onPublishNotice={() =>
                  setQuickActionModal({
                    title: 'School Circulars & Notices',
                    message:
                      'Communication center is being finalized in the Announcements module. School management will be able to broadcast notices to parents and teachers.',
                  })
                }
              />

              {/* Upcoming Activities Section */}
              <UpcomingActivitiesSection
                activities={dashboardData.upcomingActivities}
              />
            </div>
          </div>
        </>
      )}

      {/* Quick Action Modal Dialog */}
      {quickActionModal && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setQuickActionModal(null)}
        >
          <div
            className="admin-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{quickActionModal.title}</h3>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setQuickActionModal(null)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <Info size={20} style={{ color: '#20354A', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, color: '#4A5568', lineHeight: 1.5 }}>
                  {quickActionModal.message}
                </p>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn-action-primary"
                onClick={() => setQuickActionModal(null)}
              >
                <span>Understood</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboardPage;
