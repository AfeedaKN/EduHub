import React from 'react';
import { Bell, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface NoticeItem {
  id: string;
  title: string;
  date: string;
  preview: string;
  publisher?: string;
}

interface RecentNoticesSectionProps {
  notices?: NoticeItem[];
}

export const RecentNoticesSection: React.FC<RecentNoticesSectionProps> = ({ notices = [] }) => {
  return (
    <div className="parent-side-card">
      <div className="parent-side-card-header">
        <div className="parent-side-title-wrap">
          <h4 className="parent-side-title">From Your School</h4>
          <span className="parent-side-count">{notices.length}</span>
        </div>
        <Link to="/parent/communication/notices" className="parent-side-view-link">
          <span>View All</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      <div className="parent-side-card-body">
        {notices.length === 0 ? (
          <div className="parent-quiet-empty-state">
            <Bell size={22} className="parent-quiet-icon" />
            <p className="parent-quiet-text">No active school notices published yet.</p>
          </div>
        ) : (
          <div className="parent-notices-editorial-list">
            {notices.slice(0, 3).map((notice) => (
              <div key={notice.id} className="parent-notice-editorial-item">
                <div className="parent-notice-editorial-top">
                  <span className="parent-notice-editorial-date">{notice.date}</span>
                  {notice.publisher && (
                    <span className="parent-notice-editorial-pub">
                      {notice.publisher}
                    </span>
                  )}
                </div>
                <h5 className="parent-notice-editorial-title">{notice.title}</h5>
                <p className="parent-notice-editorial-preview">{notice.preview}</p>
                <Link
                  to={`/parent/communication/notices/${notice.id}`}
                  className="parent-notice-editorial-link"
                >
                  <span>Read Notice</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
