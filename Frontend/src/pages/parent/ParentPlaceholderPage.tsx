import React from 'react';
import { ParentLayout } from '../../components/parent/ParentLayout';
import { ArrowLeft, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ParentPlaceholderPageProps {
  title: string;
  description?: string;
}

export const ParentPlaceholderPage: React.FC<ParentPlaceholderPageProps> = ({
  title,
  description = 'This section will be fully accessible once your child is admitted and enrolled in classes.',
}) => {
  return (
    <ParentLayout pageTitle={title}>
      <div className="parent-empty-state-card" style={{ padding: '40px 24px' }}>
        <div className="parent-empty-visual-wrap">
          <div className="parent-empty-icon-halo">
            <Clock size={36} className="text-primary" />
          </div>
        </div>

        <h3 className="parent-empty-heading">{title}</h3>
        <p className="parent-empty-description">{description}</p>

        <div className="parent-empty-actions">
          <Link to="/parent/dashboard" className="btn-parent-outline-action">
            <ArrowLeft size={16} />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </ParentLayout>
  );
};
