import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ArrowRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { AttendanceSummary } from '../../types/admin.types';

interface AttendanceSummarySectionProps {
  attendanceData?: AttendanceSummary | null;
}

export const AttendanceSummarySection: React.FC<AttendanceSummarySectionProps> = ({
  attendanceData,
}) => {
  const isRecorded = attendanceData && attendanceData.totalMarked > 0;
  const isComplete =
    attendanceData &&
    attendanceData.totalSections > 0 &&
    attendanceData.sectionsSubmitted >= attendanceData.totalSections;

  return (
    <div className="admin-section-card">
      <div className="admin-section-header">
        <h2 className="admin-section-title">
          <CalendarCheck size={18} style={{ color: '#20354A' }} />
          <span>Today's Attendance</span>
        </h2>
        <Link to="/admin/attendance" className="admin-section-header-link">
          <span>Manage Attendance</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {attendanceData ? (
        <div className="admin-attendance-container">
          {/* Status & Date Row */}
          <div className="admin-attendance-stat-row">
            <div className="admin-attendance-pct-group">
              <span className="admin-attendance-percentage">
                {isRecorded ? `${attendanceData.overallPercentage}%` : '0%'}
              </span>
              <span className="admin-attendance-label">Present</span>
            </div>

            <div className="admin-attendance-badge-wrap">
              {isRecorded ? (
                isComplete ? (
                  <span className="admin-status-badge status-approved" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} />
                    <span>Complete ({attendanceData.sectionsSubmitted}/{attendanceData.totalSections} sections)</span>
                  </span>
                ) : (
                  <span className="admin-status-badge status-under-review" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    <span>Partial ({attendanceData.sectionsSubmitted}/{attendanceData.totalSections} sections)</span>
                  </span>
                )
              ) : (
                <span className="admin-status-badge status-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />
                  <span>Pending Submissions</span>
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="admin-attendance-progress-track">
            <div
              className="admin-attendance-progress-fill"
              style={{
                width: isRecorded ? `${Math.min(100, Math.max(0, attendanceData.overallPercentage))}%` : '0%',
              }}
            />
          </div>

          {/* Detailed Metric Pills */}
          <div className="admin-attendance-metrics-grid">
            <div className="admin-attendance-metric-item metric-present">
              <span className="metric-num">{attendanceData.presentCount}</span>
              <span className="metric-label">Present</span>
            </div>
            <div className="admin-attendance-metric-item metric-absent">
              <span className="metric-num">{attendanceData.absentCount}</span>
              <span className="metric-label">Absent</span>
            </div>
            <div className="admin-attendance-metric-item metric-late">
              <span className="metric-num">{attendanceData.lateCount}</span>
              <span className="metric-label">Late</span>
            </div>
            <div className="admin-attendance-metric-item metric-total">
              <span className="metric-num">{attendanceData.totalMarked}</span>
              <span className="metric-label">Marked Total</span>
            </div>
          </div>

          {!isRecorded && (
            <p className="admin-attendance-pending-hint">
              No classroom attendance submissions recorded for today ({attendanceData.date}) yet. Teachers record attendance during morning homeroom.
            </p>
          )}
        </div>
      ) : (
        <div className="admin-attendance-empty-note">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
            <AlertCircle size={15} style={{ color: '#647F99' }} />
            <strong style={{ color: '#20354A' }}>Attendance data currently unavailable</strong>
          </div>
          <span>Connect with the class teacher portal or inspect daily roll records.</span>
        </div>
      )}
    </div>
  );
};

