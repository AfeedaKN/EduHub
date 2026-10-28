import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  GraduationCap,
  UserCheck,
  Users,
  Layers,
  Award,
  Send,
  Zap,
  ArrowRight,
} from 'lucide-react';

interface QuickActionsSectionProps {
  onPublishNotice?: () => void;
}

export const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  onPublishNotice,
}) => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Review Admissions',
      icon: FileCheck2,
      onClick: () => navigate('/admin/admissions'),
    },
    {
      label: 'Manage Students',
      icon: GraduationCap,
      onClick: () => navigate('/admin/people/students'),
    },
    {
      label: 'Manage Parents',
      icon: UserCheck,
      onClick: () => navigate('/admin/people/parents'),
    },
    {
      label: 'Manage Teachers',
      icon: Users,
      onClick: () => navigate('/admin/people/teachers'),
    },
    {
      label: 'Manage Classes',
      icon: Layers,
      onClick: () => navigate('/admin/academics/classes'),
    },
    {
      label: 'Review Exam Results',
      icon: Award,
      onClick: () => navigate('/admin/exams'),
    },
    {
      label: 'Publish Notice',
      icon: Send,
      onClick: onPublishNotice || (() => navigate('/admin/communication/notices')),
    },
  ];

  return (
    <div className="admin-section-card">
      <div className="admin-section-header">
        <h2 className="admin-section-title">
          <Zap size={18} style={{ color: '#20354A' }} />
          <span>Quick Actions</span>
        </h2>
      </div>

      <div className="admin-quick-actions-list">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.label}
              type="button"
              className="admin-quick-action-btn"
              onClick={act.onClick}
            >
              <div className="admin-quick-action-left">
                <Icon size={16} className="admin-quick-action-icon" />
                <span>{act.label}</span>
              </div>
              <ArrowRight size={14} className="admin-quick-action-arrow" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

