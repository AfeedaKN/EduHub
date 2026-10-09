import React from 'react';
import { UserPlus, ShieldCheck, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';

interface ParentEmptyStateProps {
  onAddStudent: () => void;
}

export const ParentEmptyState: React.FC<ParentEmptyStateProps> = ({ onAddStudent }) => {
  return (
    <div className="parent-empty-state-card">
      <div className="parent-empty-badge">
        <Sparkles size={14} className="text-sage" />
        <span>Get Started</span>
      </div>

      <div className="parent-empty-visual-wrap">
        <div className="parent-empty-icon-halo">
          <GraduationCap size={40} className="parent-empty-main-icon" />
        </div>
      </div>

      <div className="parent-empty-body">
        <h3 className="parent-empty-heading">Your child&apos;s school journey starts here.</h3>
        <p className="parent-empty-description">
          Add your child to submit a registration request to the school.
        </p>

        <div className="parent-empty-actions">
          <button
            type="button"
            className="btn-add-student-primary"
            onClick={onAddStudent}
          >
            <UserPlus size={17} />
            <span>+ Add Student</span>
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="parent-empty-review-note">
          <ShieldCheck size={14} className="parent-empty-shield-icon" />
          <span>Your child&apos;s registration request will be reviewed by school management.</span>
        </div>
      </div>
    </div>
  );
};
