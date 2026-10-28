import React from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  FileText,
  Award,
  Calendar,
  Clock,
} from 'lucide-react';
import { RecentSchoolActivity } from '../../types/admin.types';

interface RecentSchoolActivitySectionProps {
  activities?: RecentSchoolActivity[];
}

export const RecentSchoolActivitySection: React.FC<RecentSchoolActivitySectionProps> = ({
  activities = [],
}) => {
  const getActivityIcon = (type: RecentSchoolActivity['type']) => {
    switch (type) {
      case 'ADMISSION_APPROVED':
        return <CheckCircle2 size={16} style={{ color: '#2F522C' }} />;
      case 'ADMISSION_REJECTED':
        return <XCircle size={16} style={{ color: '#991B1B' }} />;
      case 'MARKS_SUBMITTED':
        return <Clock size={16} style={{ color: '#92400E' }} />;
      case 'MARKS_PUBLISHED':
        return <Award size={16} style={{ color: '#1E40AF' }} />;
      case 'EXAM_SCHEDULED':
        return <Calendar size={16} style={{ color: '#374151' }} />;
      default:
        return <FileText size={16} style={{ color: '#647F99' }} />;
    }
  };

  const formatActivityTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="admin-section-card admin-recent-activity-card">
      <div className="admin-section-header">
        <h2 className="admin-section-title">
          <History size={18} style={{ color: '#20354A' }} />
          <span>Recent School Activity</span>
        </h2>
      </div>

      {activities && activities.length > 0 ? (
        <div className="admin-activity-timeline">
          {activities.map((act) => (
            <div key={act.id} className="admin-timeline-item">
              <div className="admin-timeline-icon-wrap">
                {getActivityIcon(act.type)}
              </div>
              <div className="admin-timeline-content">
                <div className="admin-timeline-header">
                  <span className="admin-timeline-title">{act.title}</span>
                  <span className={`admin-status-badge badge-${act.badgeVariant}`}>
                    {act.badgeText}
                  </span>
                </div>
                <p className="admin-timeline-desc">{act.description}</p>
                <span className="admin-timeline-time">
                  {formatActivityTime(act.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-overview-empty-box">
          <History size={22} style={{ color: '#647F99', marginBottom: '6px' }} />
          <strong>No Recent School Activity Recorded</strong>
          <span>Recent events such as admissions decisions and exam marks updates will show here.</span>
        </div>
      )}
    </div>
  );
};
