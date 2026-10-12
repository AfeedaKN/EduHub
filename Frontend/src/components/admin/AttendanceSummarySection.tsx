import React from 'react';
import { CalendarCheck, Info } from 'lucide-react';
import { AttendanceSummary } from '../../types/admin.types';

interface AttendanceSummarySectionProps {
  attendanceData?: AttendanceSummary | null;
}

export const AttendanceSummarySection: React.FC<AttendanceSummarySectionProps> = ({
  attendanceData,
}) => {
  return (
    <div className="admin-section-card">
      <div className="admin-section-header">
        <h2 className="admin-section-title">
          <CalendarCheck size={18} style={{ color: '#20354A' }} />
          <span>Today's Attendance</span>
        </h2>
      </div>

      {attendanceData ? (
        <div className="admin-attendance-container">
          <div className="admin-attendance-stat-row">
            <span className="admin-attendance-percentage">
              {attendanceData.overallPercentage}% Attendance
            </span>
            <span className="admin-attendance-meta-text">
              {attendanceData.date}
            </span>
          </div>

          <div className="admin-attendance-progress-track">
            <div
              className="admin-attendance-progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, attendanceData.overallPercentage))}%` }}
            />
          </div>

          <div className="admin-attendance-counts-row">
            <span>Present: {attendanceData.presentCount} students</span>
            <span>Absent: {attendanceData.absentCount} students</span>
          </div>
        </div>
      ) : (
        <div className="admin-attendance-empty-note">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
            <Info size={15} style={{ color: '#647F99' }} />
            <strong style={{ color: '#20354A' }}>Attendance module integration pending</strong>
          </div>
          <span>
            Daily school attendance recording will appear here once teacher attendance submissions are initiated.
          </span>
        </div>
      )}
    </div>
  );
};
