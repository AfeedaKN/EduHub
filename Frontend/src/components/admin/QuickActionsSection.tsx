import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  UserPlus,
  Send,
  Zap,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface QuickActionsSectionProps {
  onAddTeacher?: () => void;
  onPublishNotice?: () => void;
}

export const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  onAddTeacher,
  onPublishNotice,
}) => {
  const navigate = useNavigate();

  return (
    <div className="admin-section-card">
      <div className="admin-section-header">
        <h2 className="admin-section-title">
          <Zap size={18} style={{ color: '#20354A' }} />
          <span>Quick Actions</span>
        </h2>
      </div>

      <div className="admin-quick-actions-list">
        {/* Action 1: Review Admissions */}
        <button
          type="button"
          className="admin-quick-action-btn"
          onClick={() => navigate('/admin/admissions')}
        >
          <div className="admin-quick-action-left">
            <FileCheck2 size={16} className="admin-quick-action-icon" />
            <span>Review Admissions</span>
          </div>
          <ArrowRight size={14} style={{ color: '#707781' }} />
        </button>

        {/* Action 2: Add Teacher */}
        <button
          type="button"
          className="admin-quick-action-btn"
          onClick={onAddTeacher || (() => navigate('/admin/people/teachers'))}
        >
          <div className="admin-quick-action-left">
            <UserPlus size={16} className="admin-quick-action-icon" />
            <span>Add Teacher</span>
          </div>
          <ArrowRight size={14} style={{ color: '#707781' }} />
        </button>

        {/* Action 3: Manage Classes & Sections */}
        <button
          type="button"
          className="admin-quick-action-btn"
          onClick={() => navigate('/admin/academics/classes')}
        >
          <div className="admin-quick-action-left">
            <Layers size={16} className="admin-quick-action-icon" />
            <span>Manage Classes</span>
          </div>
          <ArrowRight size={14} style={{ color: '#707781' }} />
        </button>

        {/* Action 4: Publish Notice */}
        <button
          type="button"
          className="admin-quick-action-btn"
          onClick={onPublishNotice || (() => navigate('/admin/communication/notices'))}
        >
          <div className="admin-quick-action-left">
            <Send size={16} className="admin-quick-action-icon" />
            <span>Publish Notice</span>
          </div>
          <ArrowRight size={14} style={{ color: '#707781' }} />
        </button>
      </div>
    </div>
  );
};
