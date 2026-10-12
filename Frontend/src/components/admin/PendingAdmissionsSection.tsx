import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  ArrowRight,
  Eye,
  CheckCircle2,
  X,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { AdminPendingAdmission } from '../../types/admin.types';

interface PendingAdmissionsSectionProps {
  requests: AdminPendingAdmission[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const PendingAdmissionsSection: React.FC<PendingAdmissionsSectionProps> = ({
  requests,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  const navigate = useNavigate();
  const [selectedRequest, setSelectedRequest] = useState<AdminPendingAdmission | null>(null);

  const getStudentInitials = (name: string) => {
    if (!name) return 'S';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="admin-section-card">
      <div className="admin-section-header">
        <h2 className="admin-section-title">
          <FileCheck2 size={18} style={{ color: '#20354A' }} />
          <span>Recent Admission Requests</span>
        </h2>
        <Link to="/admin/admissions" className="admin-section-header-link">
          <span>View All Admissions</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="admin-skeleton-pulse"
              style={{ height: '58px', borderRadius: '8px' }}
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="admin-dashboard-error-banner">
          <div className="admin-error-text-block">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          {onRetry && (
            <button type="button" className="admin-btn-retry" onClick={onRetry}>
              <RotateCw size={14} />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Empty State: You're all caught up */}
      {!isLoading && !error && requests.length === 0 && (
        <div className="admin-empty-state-card">
          <div className="admin-empty-icon-box">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="admin-empty-title">You're all caught up.</h3>
          <p className="admin-empty-desc">
            There are no student registration requests awaiting review.
          </p>
          <button
            type="button"
            className="admin-btn-action-primary"
            onClick={() => navigate('/admin/admissions')}
          >
            <span>View All Admissions</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Real Recent Pending Requests List */}
      {!isLoading && !error && requests.length > 0 && (
        <div className="admin-requests-list">
          {requests.slice(0, 3).map((req) => (
            <div key={req.id} className="admin-request-row">
              <div className="admin-request-left">
                <div className="admin-request-avatar">
                  {getStudentInitials(req.studentFullName)}
                </div>
                <div className="admin-request-details">
                  <div className="admin-request-name">{req.studentFullName}</div>
                  <div className="admin-request-meta">
                    <span>Applying for {req.requestedGrade}</span>
                    {req.parentName && (
                      <>
                        <span className="admin-request-meta-dot" />
                        <span>Parent: {req.parentName}</span>
                      </>
                    )}
                    {req.submissionDate && (
                      <>
                        <span className="admin-request-meta-dot" />
                        <span>{req.submissionDate}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="admin-request-right">
                <span className="admin-status-badge status-pending">
                  Pending Review
                </span>
                <button
                  type="button"
                  className="admin-btn-view-request"
                  onClick={() => setSelectedRequest(req)}
                >
                  <Eye size={13} />
                  <span>View Request</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admission Request Detail Modal */}
      {selectedRequest && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="admin-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Student Admission Request</h3>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setSelectedRequest(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-modal-row">
                <span className="admin-modal-row-label">Student Name:</span>
                <span className="admin-modal-row-val">{selectedRequest.studentFullName}</span>
              </div>
              <div className="admin-modal-row">
                <span className="admin-modal-row-label">Requested Class:</span>
                <span className="admin-modal-row-val">{selectedRequest.requestedGrade}</span>
              </div>
              {selectedRequest.academicYear && (
                <div className="admin-modal-row">
                  <span className="admin-modal-row-label">Academic Year:</span>
                  <span className="admin-modal-row-val">{selectedRequest.academicYear}</span>
                </div>
              )}
              {selectedRequest.parentName && (
                <div className="admin-modal-row">
                  <span className="admin-modal-row-label">Parent / Guardian:</span>
                  <span className="admin-modal-row-val">{selectedRequest.parentName}</span>
                </div>
              )}
              {selectedRequest.parentEmail && (
                <div className="admin-modal-row">
                  <span className="admin-modal-row-label">Contact Email:</span>
                  <span className="admin-modal-row-val">{selectedRequest.parentEmail}</span>
                </div>
              )}
              {selectedRequest.parentPhone && (
                <div className="admin-modal-row">
                  <span className="admin-modal-row-label">Contact Phone:</span>
                  <span className="admin-modal-row-val">{selectedRequest.parentPhone}</span>
                </div>
              )}
              <div className="admin-modal-row">
                <span className="admin-modal-row-label">Submitted On:</span>
                <span className="admin-modal-row-val">{selectedRequest.submissionDate}</span>
              </div>
              <div className="admin-modal-row">
                <span className="admin-modal-row-label">Current Status:</span>
                <span className="admin-status-badge status-pending">
                  {selectedRequest.status}
                </span>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn-action-primary"
                onClick={() => {
                  setSelectedRequest(null);
                  navigate('/admin/admissions');
                }}
              >
                <span>Open in Admissions</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
