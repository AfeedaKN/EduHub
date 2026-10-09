import React from 'react';
import { UserPlus, ShieldCheck, X, ArrowRight, BookOpen } from 'lucide-react';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div
        className="auth-modal-dialog parent-info-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
      >
        <div className="parent-info-dialog-header">
          <div className="parent-dialog-icon-halo">
            <UserPlus size={24} className="text-primary" />
          </div>
          <button
            type="button"
            className="parent-dialog-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="parent-info-dialog-body">
          <h4 className="auth-modal-title" style={{ fontSize: '1.25rem' }}>
            Add Student / Admission Request
          </h4>
          <p className="auth-modal-desc" style={{ marginTop: '8px', lineHeight: '1.5' }}>
            To connect your child to your EduHub account, you will submit an admission request containing:
          </p>

          <div className="parent-req-points-list">
            <div className="parent-req-point">
              <BookOpen size={15} className="text-primary" />
              <span>Student basic details & date of birth</span>
            </div>
            <div className="parent-req-point">
              <BookOpen size={15} className="text-primary" />
              <span>Requested grade / class level</span>
            </div>
            <div className="parent-req-point">
              <ShieldCheck size={15} className="text-primary" />
              <span>School management verification and approval</span>
            </div>
          </div>

          <div className="parent-dialog-notice-box">
            <ShieldCheck size={16} className="text-primary" />
            <p className="parent-dialog-notice-text">
              The complete Multi-Step <strong>Add Student</strong> submission form is scheduled in the upcoming Student Admission module. Once submitted, requests appear on this dashboard under <em>Registration Requests</em>.
            </p>
          </div>
        </div>

        <div className="auth-modal-actions" style={{ marginTop: '20px' }}>
          <button
            type="button"
            className="btn-auth-submit"
            onClick={onClose}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <span>Understood</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
