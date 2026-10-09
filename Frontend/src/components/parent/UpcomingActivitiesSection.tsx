import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ActivityItem {
  id: string;
  title: string;
  date: string;
  category: 'MEETING' | 'EXAM' | 'ASSIGNMENT' | 'EVENT';
  time?: string;
  description?: string;
}

interface UpcomingActivitiesSectionProps {
  activities?: ActivityItem[];
}

export const UpcomingActivitiesSection: React.FC<UpcomingActivitiesSectionProps> = ({
  activities = [],
}) => {
  return (
    <div className="parent-side-card">
      <div className="parent-side-card-header">
        <div className="parent-side-title-wrap">
          <h4 className="parent-side-title">Coming Up</h4>
          <span className="parent-side-count">{activities.length}</span>
        </div>
        <Link to="/parent/communication/meetings" className="parent-side-view-link">
          <span>View All</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      <div className="parent-side-card-body">
        {activities.length === 0 ? (
          <div className="parent-quiet-empty-state">
            <Calendar size={22} className="parent-quiet-icon" />
            <p className="parent-quiet-text">No upcoming activities scheduled at this time.</p>
          </div>
        ) : (
          <div className="parent-timeline-list">
            {activities.slice(0, 3).map((act) => (
              <div key={act.id} className="parent-timeline-item">
                <div className="parent-timeline-bullet" />
                <div className="parent-timeline-content">
                  <div className="parent-timeline-meta">
                    <span className="parent-timeline-date">{act.date}</span>
                    {act.time && <span className="parent-timeline-time">· {act.time}</span>}
                    <span className="parent-timeline-category">{act.category}</span>
                  </div>
                  <h5 className="parent-timeline-title">{act.title}</h5>
                  {act.description && (
                    <p className="parent-timeline-desc">{act.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
