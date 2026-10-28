import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, AlertCircle, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { StudentRegistrationRequest } from '../../types/parent.types';

interface RegistrationRequestsSectionProps {
  requests: StudentRegistrationRequest[];
  onViewRequest: (request: StudentRegistrationRequest) => void;
}

export const RegistrationRequestsSection: React.FC<RegistrationRequestsSectionProps> = ({
  requests,
  onViewRequest,
}) => {
  if (!requests || requests.length === 0) return null;

  return (
    <section className="parent-dashboard-section">
      <div className="parent-section-header-row">
        <div>
          <h3 className="parent-section-title">Registration Requests</h3>
          <p className="parent-section-subtitle">
            Track admission applications submitted to school management.
          </p>
        </div>

        <Link to="/parent/children" className="btn-parent-outline-action">
          <span>Manage Requests</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="parent-requests-stack">
        {requests.map((req) => {
          const isRejected = req.status === 'REJECTED';
          const isApproved = req.status === 'APPROVED';

          return (
            <div
              key={req.id}
              className={`parent-request-card-compact ${
                isRejected ? 'is-rejected' : isApproved ? 'is-approved' : 'is-pending'
              }`}
            >
              <div className="parent-request-c-left">
                <div
                  className={`parent-request-c-icon ${
                    isRejected ? 'icon-rejected' : isApproved ? 'icon-approved' : 'icon-pending'
                  }`}
                >
                  {isRejected ? (
                    <AlertCircle size={18} className="text-danger" />
                  ) : isApproved ? (
                    <CheckCircle2 size={18} style={{ color: '#2E7D32' }} />
                  ) : (
                    <Clock size={18} className="text-muted-blue" />
                  )}
                </div>

                <div className="parent-request-c-info">
                  <div className="parent-request-c-title-row">
                    <h4 className="parent-request-c-name">{req.studentFullName}</h4>
                    <span className="parent-request-c-grade">
                      Requested: <strong>{req.requestedGrade}</strong>
                    </span>
                    <span
                      className={`parent-request-c-badge ${
                        isRejected
                          ? 'badge-rejected'
                          : isApproved
                          ? 'badge-approved'
                          : 'badge-pending'
                      }`}
                    >
                      {isRejected
                        ? 'Not Approved'
                        : isApproved
                        ? 'Approved & Enrolled'
                        : req.status === 'UNDER_REVIEW'
                        ? 'Under Review'
                        : 'Pending Review'}
                    </span>
                  </div>

                  <p className="parent-request-c-desc">
                    {isRejected
                      ? req.rejectionReason || 'The school management was unable to approve this admission request.'
                      : isApproved
                      ? 'Admission request approved. Your child is officially enrolled.'
                      : 'The school management is reviewing your registration request.'}
                  </p>

                  <div className="parent-request-c-meta-row">
                    {req.submissionDate && (
                      <span className="parent-request-c-date">
                        Submitted on {req.submissionDate}
                      </span>
                    )}
                    {req.academicYear && (
                      <span className="parent-request-c-date">
                        · Academic Year {req.academicYear}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="parent-request-c-action">
                <button
                  type="button"
                  className="btn-request-view-compact"
                  onClick={() => onViewRequest(req)}
                >
                  <FileText size={14} />
                  <span>{isRejected ? 'View Feedback' : 'View Details'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
