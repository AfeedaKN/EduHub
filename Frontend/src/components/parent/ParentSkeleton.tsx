import React from 'react';

export const ParentSkeleton: React.FC = () => {
  return (
    <div className="parent-skeleton-wrapper">
      <div className="parent-skeleton-welcome">
        <div className="skeleton-line skeleton-title" style={{ width: '40%' }} />
        <div className="skeleton-line skeleton-sub" style={{ width: '65%' }} />
      </div>

      <div className="parent-dashboard-layout-grid">
        <div className="parent-dashboard-main-col">
          <div className="parent-skeleton-card" style={{ height: '220px' }}>
            <div className="skeleton-line" style={{ width: '30%', height: '20px', marginBottom: '16px' }} />
            <div className="skeleton-line" style={{ width: '80%', height: '14px', marginBottom: '8px' }} />
            <div className="skeleton-line" style={{ width: '50%', height: '14px', marginBottom: '24px' }} />
            <div className="skeleton-line" style={{ width: '140px', height: '40px', borderRadius: '8px' }} />
          </div>
        </div>

        <div className="parent-dashboard-side-col">
          <div className="parent-skeleton-card" style={{ height: '180px' }} />
          <div className="parent-skeleton-card" style={{ height: '180px' }} />
        </div>
      </div>
    </div>
  );
};
