import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Award,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { ClassEnrollmentBar, ExamOverview } from '../../types/admin.types';

interface SchoolOverviewSectionProps {
  enrollmentByClass: ClassEnrollmentBar[];
  examOverview: ExamOverview;
  totalStudents: number;
}

export const SchoolOverviewSection: React.FC<SchoolOverviewSectionProps> = ({
  enrollmentByClass,
  examOverview,
  totalStudents,
}) => {
  const navigate = useNavigate();

  // Calculate max count for relative bar widths
  const maxEnrollment = Math.max(
    1,
    ...enrollmentByClass.map((c) => c.count)
  );

  return (
    <section className="admin-overview-section" aria-label="School Overview">
      {/* Card A: Student Enrollment by Class */}
      <div className="admin-section-card admin-overview-enrollment-card">
        <div className="admin-section-header">
          <div className="admin-section-title-wrap">
            <h2 className="admin-section-title">
              <BarChart3 size={18} style={{ color: '#20354A' }} />
              <span>Enrollment by Class</span>
            </h2>
            <span className="admin-section-subtitle">
              {totalStudents} officially enrolled students
            </span>
          </div>
          <button
            type="button"
            className="admin-section-header-link admin-btn-link-raw"
            onClick={() => navigate('/admin/people/students')}
          >
            <span>Students Directory</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {enrollmentByClass && enrollmentByClass.length > 0 ? (
          <div className="admin-enrollment-bars-container">
            {enrollmentByClass.map((item) => {
              const percentage = Math.round((item.count / maxEnrollment) * 100);
              return (
                <div
                  key={item.className}
                  className="admin-enrollment-row clickable"
                  onClick={() => navigate(`/admin/people/students?grade=${encodeURIComponent(item.className)}`)}
                  title={`View students in ${item.className}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/admin/people/students?grade=${encodeURIComponent(item.className)}`);
                    }
                  }}
                >
                  <div className="admin-enrollment-class-label">
                    <span className="class-name">{item.className}</span>
                    <span className="class-count">
                      {item.count} {item.count === 1 ? 'student' : 'students'}
                    </span>
                  </div>
                  <div className="admin-enrollment-bar-track">
                    <div
                      className="admin-enrollment-bar-fill"
                      style={{ width: `${Math.max(8, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="admin-overview-empty-box">
            <Layers size={24} style={{ color: '#647F99', marginBottom: '6px' }} />
            <strong>No Class Enrollments Recorded</strong>
            <span>Active student admissions will populate the classroom distribution.</span>
          </div>
        )}
      </div>

      {/* Card B: Examination & Results Overview */}
      <div className="admin-section-card admin-overview-exam-card">
        <div className="admin-section-header">
          <div className="admin-section-title-wrap">
            <h2 className="admin-section-title">
              <Award size={18} style={{ color: '#20354A' }} />
              <span>Examination Overview</span>
            </h2>
            <span className="admin-section-subtitle">
              Academic assessments & results review
            </span>
          </div>
          <button
            type="button"
            className="admin-section-header-link admin-btn-link-raw"
            onClick={() => navigate('/admin/exams')}
          >
            <span>Manage Exams</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Highlight Banner: Marks Pending Review */}
        {examOverview.pendingReviewCount > 0 ? (
          <div
            className="admin-exam-pending-alert"
            onClick={() => navigate('/admin/exams')}
            role="button"
            tabIndex={0}
          >
            <div className="admin-exam-alert-left">
              <div className="admin-exam-alert-icon">
                <Clock size={16} />
              </div>
              <div className="admin-exam-alert-text">
                <strong>{examOverview.pendingReviewCount} Marks Submissions Pending Review</strong>
                <span>Teacher submitted grades awaiting management verification</span>
              </div>
            </div>
            <span className="admin-exam-alert-cta">
              <span>Review</span>
              <ArrowRight size={13} />
            </span>
          </div>
        ) : (
          <div className="admin-exam-all-reviewed-banner">
            <CheckCircle2 size={16} style={{ color: '#2F522C' }} />
            <span>All teacher marks submissions have been reviewed</span>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="admin-exam-stats-grid">
          <div className="admin-exam-stat-box">
            <span className="exam-stat-num">{examOverview.publishedCount}</span>
            <span className="exam-stat-label">Published Results</span>
          </div>
          <div className="admin-exam-stat-box">
            <span className="exam-stat-num">{examOverview.scheduledExamsCount}</span>
            <span className="exam-stat-label">Scheduled Exams</span>
          </div>
        </div>

        {/* Recent Exams List */}
        {examOverview.recentExams && examOverview.recentExams.length > 0 && (
          <div className="admin-recent-exams-list">
            <div className="admin-recent-exams-title">Recent Term Examinations</div>
            {examOverview.recentExams.slice(0, 3).map((exam) => (
              <div
                key={exam.id}
                className="admin-recent-exam-item clickable"
                onClick={() => navigate('/admin/exams')}
              >
                <div className="admin-recent-exam-left">
                  <span className="exam-bullet" />
                  <div>
                    <div className="exam-name">{exam.name}</div>
                    <div className="exam-dates">
                      <Calendar size={11} style={{ marginRight: '3px' }} />
                      <span>{exam.startDate} {exam.endDate ? `to ${exam.endDate}` : ''}</span>
                    </div>
                  </div>
                </div>
                <span className={`admin-status-badge status-${exam.status.toLowerCase()}`}>
                  {exam.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
