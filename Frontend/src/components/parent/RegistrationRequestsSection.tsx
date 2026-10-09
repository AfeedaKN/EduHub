import React from 'react';
import { Clock, AlertCircle, FileText, ArrowRight } from 'lucide-react';
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
            Track status of student admission requests submitted to school management.
          </p>
        </div>
      </div>

      <div className="parent-requests-stack">
        {requests.map((req) => {
          const isRejected = req.status === 'REJECTED';

          return (
            <div
              key={req.id}
              className={`parent-request-card-compact ${isRejected ? 'is-rejected' : 'is-pending'}`}
            >
              <div className="parent-request-c-left">
                <div className="parent-request-c-icon">
                  {isRejected ? (
                    <AlertCircle size={18} className="text-danger" />
                  ) : (
                    <Clock size={18} className="text-muted-blue" />
                  )}
                </div>

                <div className="parent-request-c-info">
                  <div className="parent-request-c-title-row">
                    <h4 className="parent-request-c-name">{req.studentFullName}</h4>
                    <span className="parent-request-c-grade">
                      Requested: {req.requestedGrade}
                    </span>
                    <span
                      className={`parent-request-c-badge ${
                        isRejected ? 'badge-rejected' : 'badge-pending'
                      }`}
                    >
                      {isRejected ? 'Not Approved' : 'Pending Review'}
                    </span>
                  </div>

                  <p className="parent-request-c-desc">
                    {isRejected
                      ? req.rejectionReason || 'The school management was unable to approve this admission request.'
                      : 'The school management is reviewing your registration request.'}
                  </p>

                  {req.submissionDate && (
                    <span className="parent-request-c-date">
                      Submitted on {req.submissionDate}
                    </span>
                  )}
                </div>
              </div>

              <div className="parent-request-c-action">
                <button
                  type="button"
                  className="btn-request-view-compact"
                  onClick={() => onViewRequest(req)}
                >
                  <FileText size={14} />
                  <span>{isRejected ? 'View Details' : 'View Request'}</span>
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
