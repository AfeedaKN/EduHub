import React, { useState } from 'react';
import { Plus, ArrowRight, CheckCircle2 } from 'lucide-react';
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
  const [selectedChildId, setSelectedChildId] = useState<string>(
    childrenList[0]?.id || ''
  );

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <section className="parent-dashboard-section">
      <div className="parent-section-header-row">
        <div>
          <h3 className="parent-section-title">My Children</h3>
          <p className="parent-section-subtitle">
            Your children&apos;s school information, all in one place.
          </p>
        </div>

        <button
          type="button"
          className="btn-parent-outline-action"
          onClick={onAddChild}
        >
          <Plus size={14} />
          <span>+ Add Another Child</span>
        </button>
      </div>

      {/* Multiple Children Quick Tabs if more than 1 child */}
      {childrenList.length > 1 && (
        <div className="parent-children-tabs">
          {childrenList.map((child) => (
            <button
              key={child.id}
              type="button"
              className={`parent-child-tab-btn ${selectedChildId === child.id ? 'active' : ''}`}
              onClick={() => setSelectedChildId(child.id)}
            >
              <div className="child-tab-avatar">{getInitials(child.fullName)}</div>
              <span>{child.fullName}</span>
              <span className="child-tab-grade">{child.grade}</span>
            </button>
          ))}
        </div>
      )}

      {/* Horizontal Child Profile Cards */}
      <div className="parent-children-horizontal-list">
        {childrenList.map((child) => (
          <div
            key={child.id}
            className={`parent-child-horizontal-card ${
              childrenList.length > 1 && selectedChildId === child.id ? 'is-selected' : ''
            }`}
          >
            <div className="parent-child-h-main">
              {/* Avatar Box */}
              <div className="parent-child-h-avatar-wrap">
                {child.avatarUrl ? (
                  <img
                    src={child.avatarUrl}
                    alt={child.fullName}
                    className="parent-child-h-avatar-img"
                  />
                ) : (
                  <div className="parent-child-h-avatar-initials">
                    {getInitials(child.fullName)}
                  </div>
                )}
              </div>

              {/* Information Column */}
              <div className="parent-child-h-info">
                <div className="parent-child-h-name-row">
                  <h4 className="parent-child-h-name">{child.fullName}</h4>
                  <span className="parent-child-h-status-pill">
                    <CheckCircle2 size={12} />
                    <span>Active</span>
                  </span>
                </div>

                <div className="parent-child-h-meta-row">
                  <span className="parent-child-h-grade">
                    {child.grade} {child.section}
                  </span>
                  <span className="parent-child-h-dot">·</span>
                  <span className="parent-child-h-id">
                    Student ID {child.studentId}
                  </span>
                  {child.classTeacher && (
                    <>
                      <span className="parent-child-h-dot">·</span>
                      <span className="parent-child-h-teacher">
                        Class Teacher: {child.classTeacher}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Area */}
            <div className="parent-child-h-action-wrap">
              <button
                type="button"
                className="btn-view-profile-primary"
                onClick={() => onViewChildProfile(child.id)}
              >
                <span>View Profile</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
