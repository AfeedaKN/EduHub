import React from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { StudentRegistrationRequest } from '../../types/parent.types';

interface RegistrationRequestModalProps {
  request: StudentRegistrationRequest | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RegistrationRequestModal: React.FC<RegistrationRequestModalProps> = ({
  request,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !request) return null;

  const isRejected = request.status === 'REJECTED';
  const isApproved = request.status === 'APPROVED';
  const isPending = !isRejected && !isApproved;

  return (
    <div className="auth-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="auth-modal-dialog parent-profile-detail-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px' }}
      >
        {/* Modal Header */}
        <div className="child-modal-header">
          <div className="child-modal-hero">
            <div
              className={`child-modal-avatar-box ${
                isRejected ? 'avatar-rejected' : isApproved ? 'avatar-approved' : 'avatar-pending'
              }`}
            >
              {isRejected ? (
                <AlertCircle size={24} className="text-danger" />
              ) : isApproved ? (
                <CheckCircle2 size={24} style={{ color: '#2E7D32' }} />
              ) : (
                <Clock size={24} className="text-muted-blue" />
              )}
            </div>
            <div className="child-modal-hero-text">
              <div className="child-modal-title-row">
                <h3 className="child-modal-name">{request.studentFullName}</h3>
              </div>
              <span
                className={`parent-request-badge ${
                  isRejected ? 'badge-rejected' : isApproved ? 'badge-approved' : 'badge-pending'
                }`}
                style={{ marginTop: '4px', alignSelf: 'flex-start' }}
              >
                {isRejected
                  ? 'Application Declined'
                  : isApproved
                  ? 'Approved & Enrolled'
                  : request.status === 'UNDER_REVIEW'
                  ? 'Under School Review'
                  : 'Pending Management Review'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="parent-dialog-close-btn"
            onClick={onClose}
            aria-label="Close details"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="child-modal-body">
          {/* Status Context Banner */}
          {isPending && (
            <div className="req-status-banner info">
              <ShieldCheck size={16} />
              <span>
                This admission request is awaiting review by school management. Official student enrollment
                will be confirmed once management approves the application.
              </span>
            </div>
          )}

          {isRejected && (
            <div className="req-status-banner error">
              <AlertCircle size={16} />
              <div>
                <strong>Management Feedback:</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>
                  {request.rejectionReason ||
                    'The admission application could not be approved at this time. Please contact the school admissions office for further information.'}
                </p>
              </div>
            </div>
          )}

          {isApproved && (
            <div className="req-status-banner success">
              <CheckCircle2 size={16} />
              <span>
                This registration request was approved. The student profile is now active under Enrolled
                Children.
              </span>
            </div>
          )}

          <div className="child-modal-section-title" style={{ marginTop: '16px' }}>
            REGISTRATION DETAILS
          </div>
          <div className="child-details-grid">
            <div className="child-detail-item">
              <span className="child-detail-label">Requested Class / Grade</span>
              <span className="child-detail-value highlight">{request.requestedGrade}</span>
            </div>
            <div className="child-detail-item">
              <span className="child-detail-label">Academic Year</span>
              <span className="child-detail-value">{request.academicYear || '2026-2027'}</span>
            </div>
            <div className="child-detail-item">
              <span className="child-detail-label">Submission Date</span>
              <span className="child-detail-value">{request.submissionDate || 'Recently'}</span>
            </div>
            <div className="child-detail-item">
              <span className="child-detail-label">Guardian Relationship</span>
              <span className="child-detail-value">{request.parentRelationship || 'Parent'}</span>
            </div>
            {request.dateOfBirth && (
              <div className="child-detail-item">
                <span className="child-detail-label">Date of Birth</span>
                <span className="child-detail-value">{request.dateOfBirth}</span>
              </div>
            )}
            {request.gender && (
              <div className="child-detail-item">
                <span className="child-detail-label">Gender</span>
                <span className="child-detail-value">{request.gender}</span>
              </div>
            )}
            {request.previousSchool && (
              <div className="child-detail-item full-width">
                <span className="child-detail-label">Previous School</span>
                <span className="child-detail-value">{request.previousSchool}</span>
              </div>
            )}
            {request.previousClass && (
              <div className="child-detail-item full-width">
                <span className="child-detail-label">Previous Class / Grade</span>
                <span className="child-detail-value">{request.previousClass}</span>
              </div>
            )}
            {request.notes && (
              <div className="child-detail-item full-width">
                <span className="child-detail-label">Notes & Remarks</span>
                <span className="child-detail-value">{request.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="auth-modal-actions" style={{ marginTop: '20px' }}>
          <button
            type="button"
            className="btn-nav-primary"
            onClick={onClose}
            style={{ width: '100%', justifyContent: 'center', padding: '9px 16px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
