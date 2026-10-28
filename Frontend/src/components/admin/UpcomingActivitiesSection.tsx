import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, ArrowUpRight, Users2, CalendarDays } from 'lucide-react';
import { SchoolActivity } from '../../types/admin.types';

interface UpcomingActivitiesSectionProps {
  activities?: SchoolActivity[] | null;
}

export const UpcomingActivitiesSection: React.FC<UpcomingActivitiesSectionProps> = ({
  activities,
}) => {
  return (
    <div className="admin-section-card">
      <div className="admin-section-header">
        <h2 className="admin-section-title">
          <Calendar size={18} style={{ color: '#20354A' }} />
          <span>Upcoming Activities</span>
        </h2>
        <Link to="/admin/exams" className="admin-section-header-link">
          <span>Exam Calendar</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {activities && activities.length > 0 ? (
        <div className="admin-activities-list">
          {activities.slice(0, 5).map((act) => (
            <div key={act.id} className="admin-activity-item">
              <div className="admin-activity-icon-bullet">
                <CalendarDays size={14} />
              </div>
              <div className="admin-activity-info">
                <div className="admin-activity-top-line">
                  <div className="admin-activity-title">{act.title}</div>
                  {act.linkUrl && (
                    <Link
                      to={act.linkUrl}
                      className="admin-activity-link-icon"
                      title="View details"
                    >
                      <ArrowUpRight size={13} />
                    </Link>
                  )}
                </div>

                <div className="admin-activity-date">
                  <span>{act.time || act.date}</span>
                </div>

                <div className="admin-activity-tags">
                  {act.category && (
                    <span className="admin-activity-tag tag-category">
                      {act.category}
                    </span>
                  )}
                  {act.audience && (
                    <span className="admin-activity-tag tag-audience">
                      <Users2 size={11} style={{ marginRight: '3px' }} />
                      {act.audience}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-activities-empty-note">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
            <Calendar size={15} style={{ color: '#647F99' }} />
            <strong style={{ color: '#20354A' }}>No scheduled activities</strong>
          </div>
          <span>Active examinations and scheduled academic events will appear here once published.</span>
        </div>
      )}
    </div>
  );
};

