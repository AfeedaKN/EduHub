import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, CheckCircle2, User, UserPlus } from 'lucide-react';
import { ChildProfile } from '../../types/parent.types';

interface ChildrenListSectionProps {
  childrenList: ChildProfile[];
  onAddChild: () => void;
  onViewChildProfile: (childId: string) => void;
}

export const ChildrenListSection: React.FC<ChildrenListSectionProps> = ({
  childrenList,
  onAddChild,
  onViewChildProfile,
}) => {
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const hasChildren = childrenList && childrenList.length > 0;

  return (
    <section className="parent-dashboard-section">
      <div className="parent-section-header-row">
        <div>
          <h3 className="parent-section-title">My Children</h3>
          <p className="parent-section-subtitle">
            Quick overview of enrolled children attending school.
          </p>
        </div>

        {hasChildren ? (
          <Link to="/parent/children" className="btn-parent-outline-action">
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        ) : (
          <button type="button" className="btn-parent-outline-action" onClick={onAddChild}>
            <Plus size={14} />
            <span>+ Add Student</span>
          </button>
        )}
      </div>

      {!hasChildren ? (
        <div className="parent-child-empty-compact">
          <div className="parent-child-empty-icon-wrap">
            <User size={22} className="text-muted-blue" />
          </div>
          <div className="parent-child-empty-content">
            <h5 className="parent-child-empty-title">No children officially enrolled yet</h5>
            <p className="parent-child-empty-text">
              Submit a student admission request to connect your child to EduHub.
            </p>
          </div>
          <button type="button" className="btn-add-student-primary" onClick={onAddChild}>
            <UserPlus size={15} />
            <span>+ Add Student</span>
          </button>
        </div>
      ) : (
        /* Compact Cards Grid for each approved child */
        <div className="parent-dashboard-compact-children-grid">
          {childrenList.map((child) => (
            <div key={child.id} className="parent-child-compact-card">
              <div className="child-compact-top">
                <div className="child-compact-avatar">
                  {child.avatarUrl ? (
                    <img src={child.avatarUrl} alt={child.fullName} className="child-compact-img" />
                  ) : (
                    <span className="child-compact-initials">{getInitials(child.fullName)}</span>
                  )}
                </div>

                <div className="child-compact-info">
                  <div className="child-compact-name-row">
                    <h4 className="child-compact-name" title={child.fullName}>
                      {child.fullName}
                    </h4>
                    <span className="child-compact-status-badge">
                      <CheckCircle2 size={11} />
                      <span>{child.status === 'ACTIVE' ? 'Enrolled' : child.status}</span>
                    </span>
                  </div>

                  <div className="child-compact-meta-row">
                    <span className="child-compact-class">
                      {child.grade} · Sec {child.section}
                    </span>
                    <span className="child-compact-dot">·</span>
                    <span className="child-compact-id">ID: {child.studentId}</span>
                  </div>
                </div>
              </div>

              <div className="child-compact-footer">
                <button
                  type="button"
                  className="btn-child-view-profile"
                  onClick={() => onViewChildProfile(child.id)}
                >
                  <span>View Profile</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
