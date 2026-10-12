import React from 'react';
import { Calendar, Info } from 'lucide-react';
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
      </div>

      {activities && activities.length > 0 ? (
        <div className="admin-activities-list">
          {activities.slice(0, 3).map((act) => (
            <div key={act.id} className="admin-activity-item">
              <span className="admin-activity-bullet" />
              <div className="admin-activity-info">
                <div className="admin-activity-title">{act.title}</div>
                <div className="admin-activity-date">
                  {act.date} {act.category ? `• ${act.category}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-activities-empty-note">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
            <Info size={15} style={{ color: '#647F99' }} />
            <strong style={{ color: '#20354A' }}>No scheduled activities</strong>
          </div>
          <span>School examinations and calendar events will appear here once published.</span>
        </div>
      )}
    </div>
  );
};
