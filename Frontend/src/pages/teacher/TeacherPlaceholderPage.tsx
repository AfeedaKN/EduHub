import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, ShieldCheck, LucideIcon } from 'lucide-react';
import { TeacherLayout } from '../../components/teacher/TeacherLayout';

interface TeacherPlaceholderPageProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  badgeText?: string;
}

export const TeacherPlaceholderPage: React.FC<TeacherPlaceholderPageProps> = ({
  title,
  description,
  icon: Icon = Clock,
  badgeText = 'Module Under Construction',
}) => {
  return (
    <TeacherLayout>
      <div className="teacher-placeholder-container">
        {/* Breadcrumb Navigation */}
        <div className="teacher-page-nav-back">
          <Link to="/teacher/dashboard" className="teacher-back-btn">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Card */}
        <div className="teacher-placeholder-card">
          <div className="teacher-placeholder-icon-wrap">
            <Icon size={36} className="teacher-placeholder-icon" />
          </div>

          <div className="teacher-placeholder-status-badge">
            <span className="teacher-status-pulse" />
            <span>{badgeText}</span>
          </div>

          <h1 className="teacher-placeholder-title">{title}</h1>
          <p className="teacher-placeholder-desc">{description}</p>

          <div className="teacher-placeholder-notice-box">
            <div className="teacher-placeholder-notice-header">
              <ShieldCheck size={18} style={{ color: 'var(--teacher-sage)' }} />
              <strong>Official EduHub School ERP Roadmap</strong>
            </div>
            <p>
              This module is scheduled for full rollout in the upcoming academic release.
              All administrative configurations and grade records are being calibrated by School Management.
            </p>
          </div>

          <div className="teacher-placeholder-actions">
            <Link to="/teacher/dashboard" className="teacher-btn-primary">
              Return to Faculty Dashboard
            </Link>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
};
