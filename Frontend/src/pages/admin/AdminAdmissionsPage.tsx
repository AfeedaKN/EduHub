import React, { useEffect, useState } from 'react';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  AlertCircle,
  RotateCw,
  Search,
  Filter,
  Check,
  ArrowUpDown,
  FileText,
  GraduationCap,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/adminApi';
import {
  AdminPendingAdmission,
  AdminAdmissionDetail,
  AdmissionsSummaryCounts,
  ClassCapacity,
} from '../../types/admin.types';

const CLASS_OPTIONS = [
  'All Grades',
  'Pre-KG',
  'LKG',
  'UKG',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
];

export const AdminAdmissionsPage: React.FC = () => {
  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [admissions, setAdmissions] = useState<AdminPendingAdmission[]>([]);
  const [counts, setCounts] = useState<AdmissionsSummaryCounts>({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalCount: 0,
  });

  // Filter & Search states
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All Grades');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Request Details modal state
  const [selectedAdmission, setSelectedAdmission] = useState<AdminAdmissionDetail | null>(null);

  // Approval Workflow state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState('A');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  // Rejection Workflow state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  // Success Feedback Toast
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Live capacity state in modal
  const [liveCapacity, setLiveCapacity] = useState<ClassCapacity | null>(null);

  // Fetch summary counts and admissions list
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [countsRes, admissionsRes] = await Promise.all([
        adminApi.getAdmissionCounts(),
        adminApi.getAdmissions({
          status: filterStatus === 'ALL' ? undefined : filterStatus,
          search: searchTerm ? searchTerm : undefined,
          grade: selectedGrade !== 'All Grades' ? selectedGrade : undefined,
          sort: sortOrder,
        }),
      ]);

      if (countsRes.data) {
        setCounts(countsRes.data);
      }
      if (admissionsRes.data) {
        setAdmissions(admissionsRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load admission requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, selectedGrade, sortOrder]);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Open detailed view modal with live class capacity check
  const handleOpenDetail = async (adm: AdminPendingAdmission) => {
    setApprovalError(null);
    setRejectionError(null);
    try {
      const res = await adminApi.getAdmissionDetail(adm.id);
      if (res.data) {
        setSelectedAdmission(res.data);
        if (res.data.capacity) {
          setLiveCapacity(res.data.capacity);
        }
      }
    } catch {
      // Fallback to basic info if detail API fails
      setSelectedAdmission(adm as AdminAdmissionDetail);
    }
  };

  // Recheck capacity when changing section during approval
  const handleSectionChange = async (section: string) => {
    setSelectedSection(section);
    if (selectedAdmission) {
      try {
        const res = await adminApi.getClassCapacity(selectedAdmission.requestedGrade, section);
        if (res.data) {
          setLiveCapacity(res.data);
        }
      } catch {
        // Keep existing
      }
    }
  };

  // Handle Approve Submission
  const handleConfirmApproval = async () => {
    if (!selectedAdmission) return;

    if (liveCapacity && liveCapacity.isAtCapacity) {
      setApprovalError(
        `This class has reached its maximum capacity (${liveCapacity.maxCapacity} students). The request cannot be approved until a seat is available.`
      );
      return;
    }

    setIsApproving(true);
    setApprovalError(null);

    try {
      const res = await adminApi.approveAdmission(selectedAdmission.id, {
        section: selectedSection,
        notes: approvalNotes.trim() || undefined,
      });

      setSuccessMessage(res.message || 'Student registration approved successfully.');
      setShowApproveModal(false);
      setSelectedAdmission(null);

      // Refresh list and counts
      await fetchData();

      // Clear success alert after 5s
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setApprovalError(err.message || 'Failed to approve registration request.');
    } finally {
      setIsApproving(false);
    }
  };

  // Handle Reject Submission
  const handleConfirmRejection = async () => {
    if (!selectedAdmission) return;

    if (!rejectionReason.trim()) {
      setRejectionError('Please provide a reason for rejecting this admission request.');
      return;
    }

    setIsRejecting(true);
    setRejectionError(null);

    try {
      const res = await adminApi.rejectAdmission(selectedAdmission.id, {
        rejectionReason: rejectionReason.trim(),
      });

      setSuccessMessage(res.message || 'Admission request has been rejected.');
      setShowRejectModal(false);
      setSelectedAdmission(null);
      setRejectionReason('');

      // Refresh list and counts
      await fetchData();

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setRejectionError(err.message || 'Failed to reject registration request.');
    } finally {
      setIsRejecting(false);
    }
  };

  const getStudentInitials = (name: string) => {
    if (!name) return 'S';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <AdminLayout
      breadcrumbTitle="Admissions"
      pendingAdmissionsCount={counts.pendingCount}
    >
      {/* Page Heading */}
      <div className="admin-admissions-page-header">
        <h1 className="admin-admissions-page-title">Admissions</h1>
        <p className="admin-admissions-page-subtitle">
          Review student registration requests and manage school admissions.
        </p>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div
          style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '8px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#166534',
            fontSize: '0.86rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 1. Three Summary Metric Cards */}
      <section className="admin-admissions-summary-row" aria-label="Admissions Summary Metrics">
        {/* Card 1: Pending Review */}
        <div
          className={`admin-summary-card clickable ${filterStatus === 'PENDING' ? 'card-admissions-highlight' : ''}`}
          onClick={() => setFilterStatus('PENDING')}
        >
          <div className="admin-card-top-row">
            <span className="admin-card-label">Pending Review</span>
            <div className="admin-card-icon-wrap icon-admissions">
              <Clock size={16} />
            </div>
          </div>
          <div className="admin-card-value-row">
            <div className="admin-card-value">{counts.pendingCount}</div>
            <span className="admin-card-indicator indicator-admissions">Needs Review</span>
          </div>
          <div className="admin-card-subtext">Awaiting administrative decision</div>
        </div>

        {/* Card 2: Approved */}
        <div
          className={`admin-summary-card clickable ${filterStatus === 'APPROVED' ? 'card-admissions-highlight' : ''}`}
          onClick={() => setFilterStatus('APPROVED')}
        >
          <div className="admin-card-top-row">
            <span className="admin-card-label">Approved</span>
            <div
              className="admin-card-icon-wrap"
              style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', borderColor: '#C8E6C9' }}
            >
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="admin-card-value-row">
            <div className="admin-card-value">{counts.approvedCount}</div>
            <span
              className="admin-card-indicator"
              style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', border: '1px solid #C8E6C9' }}
            >
              Enrolled
            </span>
          </div>
          <div className="admin-card-subtext">Officially enrolled in student directory</div>
        </div>

        {/* Card 3: Rejected */}
        <div
          className={`admin-summary-card clickable ${filterStatus === 'REJECTED' ? 'card-admissions-highlight' : ''}`}
          onClick={() => setFilterStatus('REJECTED')}
        >
          <div className="admin-card-top-row">
            <span className="admin-card-label">Rejected</span>
            <div
              className="admin-card-icon-wrap"
              style={{ backgroundColor: '#FEE2E2', color: '#DC2626', borderColor: '#FCA5A5' }}
            >
              <XCircle size={16} />
            </div>
          </div>
          <div className="admin-card-value-row">
            <div className="admin-card-value">{counts.rejectedCount}</div>
            <span
              className="admin-card-indicator"
              style={{ backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}
            >
              Not Admitted
            </span>
          </div>
          <div className="admin-card-subtext">Registration requests declined with feedback</div>
        </div>
      </section>

      {/* 2. Status Filter Tabs */}
      <div className="admin-admissions-tabs-row">
        <button
          type="button"
          className={`admin-admissions-tab-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilterStatus('ALL')}
        >
          <span>All Requests</span>
          <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>({counts.totalCount})</span>
        </button>

        <button
          type="button"
          className={`admin-admissions-tab-btn ${filterStatus === 'PENDING' ? 'active' : ''}`}
          onClick={() => setFilterStatus('PENDING')}
        >
          <Clock size={13} />
          <span>Pending Review</span>
          <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>({counts.pendingCount})</span>
        </button>

        <button
          type="button"
          className={`admin-admissions-tab-btn ${filterStatus === 'APPROVED' ? 'active' : ''}`}
          onClick={() => setFilterStatus('APPROVED')}
        >
          <CheckCircle2 size={13} />
          <span>Approved</span>
          <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>({counts.approvedCount})</span>
        </button>

        <button
          type="button"
          className={`admin-admissions-tab-btn ${filterStatus === 'REJECTED' ? 'active' : ''}`}
          onClick={() => setFilterStatus('REJECTED')}
        >
          <XCircle size={13} />
          <span>Rejected</span>
          <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>({counts.rejectedCount})</span>
        </button>
      </div>

      {/* 3. Search and Filter Toolbar */}
      <div className="admin-admissions-filter-toolbar">
        {/* Search Input */}
        <div className="admin-search-input-wrap">
          <Search size={15} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by student or parent name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Controls Right */}
        <div className="admin-filter-controls-right">
          {/* Grade Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} style={{ color: '#707781' }} />
            <select
              className="admin-filter-select"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              aria-label="Filter by requested class"
            >
              {CLASS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={14} style={{ color: '#707781' }} />
            <select
              className="admin-filter-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              aria-label="Sort by submission date"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Clear Filters Button if any active */}
          {(searchTerm || selectedGrade !== 'All Grades' || filterStatus !== 'ALL') && (
            <button
              type="button"
              className="admin-btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.78rem' }}
              onClick={() => {
                setSearchTerm('');
                setSelectedGrade('All Grades');
                setFilterStatus('ALL');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="admin-skeleton-pulse"
              style={{ height: '54px', borderRadius: '8px' }}
            />
          ))}
        </div>
      )}

      {/* Global Error Banner */}
      {!loading && error && (
        <div className="admin-dashboard-error-banner">
          <div className="admin-error-text-block">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <button type="button" className="admin-btn-retry" onClick={fetchData}>
            <RotateCw size={14} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 4. Requests List: Table on Desktop, Cards on Mobile */}
      {!loading && !error && (
        <div className="admin-admissions-table-card">
          {admissions.length === 0 ? (
            <div className="admin-empty-state-card">
              <div className="admin-empty-icon-box">
                <FileCheck2 size={24} />
              </div>
              <h3 className="admin-empty-title">
                {filterStatus === 'PENDING'
                  ? 'No pending admission requests.'
                  : 'No admission requests found.'}
              </h3>
              <p className="admin-empty-desc">
                {filterStatus === 'PENDING'
                  ? 'New parent registration requests will appear here for review.'
                  : 'Try adjusting your search query, grade selection, or status filters.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="admin-admissions-table-wrap-desktop" style={{ overflowX: 'auto' }}>
                <table className="admin-admissions-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Parent</th>
                      <th>Class Requested</th>
                      <th>Submitted Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admissions.map((adm) => (
                      <tr key={adm.id}>
                        {/* Student Column */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="admin-request-avatar">
                              {getStudentInitials(adm.studentFullName)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#20354A' }}>
                                {adm.studentFullName}
                              </div>
                              {adm.gender && (
                                <span style={{ fontSize: '0.72rem', color: '#707781' }}>
                                  {adm.gender.toLowerCase()}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Parent Column */}
                        <td>
                          <div style={{ color: '#27313A', fontWeight: 500 }}>
                            {adm.parentName || 'Parent account'}
                          </div>
                          {adm.parentEmail && (
                            <div style={{ fontSize: '0.74rem', color: '#707781' }}>
                              {adm.parentEmail}
                            </div>
                          )}
                        </td>

                        {/* Class Requested */}
                        <td>
                          <span style={{ fontWeight: 600, color: '#20354A' }}>
                            {adm.requestedGrade}
                          </span>
                          {adm.academicYear && (
                            <span style={{ display: 'block', fontSize: '0.72rem', color: '#707781' }}>
                              AY {adm.academicYear}
                            </span>
                          )}
                        </td>

                        {/* Submission Date */}
                        <td style={{ color: '#4A5568' }}>{adm.submissionDate}</td>

                        {/* Status Badge */}
                        <td>
                          <span
                            className={`admin-status-badge ${
                              adm.status === 'APPROVED'
                                ? 'status-approved'
                                : adm.status === 'REJECTED'
                                ? 'status-rejected'
                                : 'status-pending'
                            }`}
                          >
                            {adm.status === 'PENDING'
                              ? 'Pending Review'
                              : adm.status === 'UNDER_REVIEW'
                              ? 'Under Review'
                              : adm.status}
                          </span>
                        </td>

                        {/* Action Column */}
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="admin-btn-view-request"
                            onClick={() => handleOpenDetail(adm)}
                          >
                            <Eye size={13} />
                            <span>View Request</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="admin-admissions-cards-mobile">
                {admissions.map((adm) => (
                  <div key={adm.id} className="admin-admission-card-mobile">
                    <div className="admin-card-mobile-header">
                      <div className="admin-card-mobile-name">{adm.studentFullName}</div>
                      <span
                        className={`admin-status-badge ${
                          adm.status === 'APPROVED'
                            ? 'status-approved'
                            : adm.status === 'REJECTED'
                            ? 'status-rejected'
                            : 'status-pending'
                        }`}
                      >
                        {adm.status === 'PENDING' ? 'Pending Review' : adm.status}
                      </span>
                    </div>

                    <div className="admin-card-mobile-meta">
                      <div>
                        <strong>Class:</strong> {adm.requestedGrade}
                      </div>
                      <div>
                        <strong>Parent:</strong> {adm.parentName || 'Parent account'} (
                        {adm.parentEmail || 'N/A'})
                      </div>
                      <div>
                        <strong>Submitted:</strong> {adm.submissionDate}
                      </div>
                    </div>

                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="admin-btn-view-request"
                        onClick={() => handleOpenDetail(adm)}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        <Eye size={14} />
                        <span>View Request Details</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 5. Request Details Modal Dialog */}
      {selectedAdmission && (
        <div
          className="admin-modal-backdrop"
          onClick={() => {
            if (!isApproving && !isRejecting) setSelectedAdmission(null);
          }}
        >
          <div
            className="admin-modal-dialog"
            style={{ maxWidth: '580px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={20} style={{ color: '#20354A' }} />
                <h3 className="admin-modal-title">Registration Request Review</h3>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setSelectedAdmission(null)}
                aria-label="Close details modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Status Header Block */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#FAF9F5',
                  border: '1px solid #E8E5DD',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: '#707781', fontWeight: 500 }}>
                  Current Review Status:
                </span>
                <span
                  className={`admin-status-badge ${
                    selectedAdmission.status === 'APPROVED'
                      ? 'status-approved'
                      : selectedAdmission.status === 'REJECTED'
                      ? 'status-rejected'
                      : 'status-pending'
                  }`}
                >
                  {selectedAdmission.status === 'PENDING'
                    ? 'Pending Review'
                    : selectedAdmission.status === 'UNDER_REVIEW'
                    ? 'Under Review'
                    : selectedAdmission.status}
                </span>
              </div>

              {/* Student Information Section */}
              <div style={{ marginTop: '8px' }}>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#647F99',
                    letterSpacing: '0.04em',
                    marginBottom: '6px',
                  }}
                >
                  Student Information
                </div>
                <div className="admin-modal-row">
                  <span className="admin-modal-row-label">Full Name:</span>
                  <span className="admin-modal-row-val">{selectedAdmission.studentFullName}</span>
                </div>
                <div className="admin-modal-row">
                  <span className="admin-modal-row-label">Class Requested:</span>
                  <span className="admin-modal-row-val">{selectedAdmission.requestedGrade}</span>
                </div>
                {selectedAdmission.academicYear && (
                  <div className="admin-modal-row">
                    <span className="admin-modal-row-label">Academic Year:</span>
                    <span className="admin-modal-row-val">{selectedAdmission.academicYear}</span>
                  </div>
                )}
                {selectedAdmission.dateOfBirth && (
                  <div className="admin-modal-row">
                    <span className="admin-modal-row-label">Date of Birth:</span>
                    <span className="admin-modal-row-val">{selectedAdmission.dateOfBirth}</span>
                  </div>
                )}
                {selectedAdmission.gender && (
                  <div className="admin-modal-row">
                    <span className="admin-modal-row-label">Gender:</span>
                    <span className="admin-modal-row-val">{selectedAdmission.gender}</span>
                  </div>
                )}
                {selectedAdmission.previousSchool && (
                  <div className="admin-modal-row">
                    <span className="admin-modal-row-label">Previous School:</span>
                    <span className="admin-modal-row-val">{selectedAdmission.previousSchool}</span>
                  </div>
                )}
                {selectedAdmission.previousClass && (
                  <div className="admin-modal-row">
                    <span className="admin-modal-row-label">Previous Class:</span>
                    <span className="admin-modal-row-val">{selectedAdmission.previousClass}</span>
                  </div>
                )}
              </div>

              {/* Parent Information Section */}
              <div style={{ marginTop: '12px' }}>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#647F99',
                    letterSpacing: '0.04em',
                    marginBottom: '6px',
                  }}
                >
                  Parent / Guardian Information
                </div>
                <div className="admin-modal-row">
                  <span className="admin-modal-row-label">Parent Name:</span>
                  <span className="admin-modal-row-val">
                    {selectedAdmission.parentName || 'Parent account'}
                  </span>
                </div>
                {selectedAdmission.parentEmail && (
                  <div className="admin-modal-row">
                    <span className="admin-modal-row-label">Contact Email:</span>
                    <span className="admin-modal-row-val">{selectedAdmission.parentEmail}</span>
                  </div>
                )}
                {selectedAdmission.parentPhone && (
                  <div className="admin-modal-row">
                    <span className="admin-modal-row-label">Phone Number:</span>
                    <span className="admin-modal-row-val">{selectedAdmission.parentPhone}</span>
                  </div>
                )}
                {selectedAdmission.parentRelationship && (
                  <div className="admin-modal-row">
                    <span className="admin-modal-row-label">Relationship:</span>
                    <span className="admin-modal-row-val">
                      {selectedAdmission.parentRelationship}
                    </span>
                  </div>
                )}
              </div>

              {/* Submitted Documents (if present) */}
              {selectedAdmission.documents && selectedAdmission.documents.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#647F99',
                      letterSpacing: '0.04em',
                      marginBottom: '6px',
                    }}
                  >
                    Submitted Documents
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {selectedAdmission.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          backgroundColor: '#FAF9F5',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                        }}
                      >
                        <FileText size={14} style={{ color: '#20354A' }} />
                        <span>{doc.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection Details (if already rejected) */}
              {selectedAdmission.status === 'REJECTED' && selectedAdmission.rejectionReason && (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '12px',
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '0.8rem', color: '#991B1B' }}>
                    Rejection Feedback Sent to Parent:
                  </strong>
                  <p style={{ margin: '4px 0 0', color: '#B91C1C', fontSize: '0.82rem' }}>
                    {selectedAdmission.rejectionReason}
                  </p>
                </div>
              )}

              {/* Class Capacity Check Section */}
              {liveCapacity && (
                <div className="admin-capacity-box">
                  <div className="admin-capacity-title">
                    <span>
                      Class Capacity — {liveCapacity.grade} (Section {liveCapacity.section})
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#20354A' }}>Live Enrollment</span>
                  </div>

                  <div className="admin-capacity-grid">
                    <div className="admin-capacity-item">
                      <div className="admin-capacity-item-val">{liveCapacity.maxCapacity}</div>
                      <div className="admin-capacity-item-label">Max Capacity</div>
                    </div>
                    <div className="admin-capacity-item">
                      <div className="admin-capacity-item-val">{liveCapacity.currentlyEnrolled}</div>
                      <div className="admin-capacity-item-label">Currently Enrolled</div>
                    </div>
                    <div className="admin-capacity-item">
                      <div
                        className="admin-capacity-item-val"
                        style={{ color: liveCapacity.isAtCapacity ? '#DC2626' : '#2E7D32' }}
                      >
                        {liveCapacity.availableSeats}
                      </div>
                      <div className="admin-capacity-item-label">Available Seats</div>
                    </div>
                  </div>

                  {liveCapacity.isAtCapacity && (
                    <div className="admin-capacity-warning">
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>Class Maximum Capacity Reached.</strong> This class has reached its
                        maximum capacity. The request cannot be approved until a seat is available.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div
              className="admin-modal-footer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                borderTop: '1px solid #F0EDE5',
                paddingTop: '16px',
              }}
            >
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setSelectedAdmission(null)}
              >
                Close
              </button>

              {/* Show decision buttons only for pending requests */}
              {(selectedAdmission.status === 'PENDING' ||
                selectedAdmission.status === 'UNDER_REVIEW') && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Reject Button */}
                  <button
                    type="button"
                    className="admin-btn-reject"
                    onClick={() => {
                      setRejectionError(null);
                      setRejectionReason('');
                      setShowRejectModal(true);
                    }}
                  >
                    <XCircle size={15} />
                    <span>Reject Request</span>
                  </button>

                  {/* Approve Button */}
                  <button
                    type="button"
                    className="admin-btn-approve"
                    disabled={liveCapacity?.isAtCapacity}
                    title={
                      liveCapacity?.isAtCapacity
                        ? 'Class has reached maximum capacity'
                        : 'Approve student and enroll'
                    }
                    onClick={() => {
                      setApprovalError(null);
                      setShowApproveModal(true);
                    }}
                  >
                    <CheckCircle2 size={15} />
                    <span>Approve Request</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Approval Confirmation Modal Dialog */}
      {showApproveModal && selectedAdmission && (
        <div className="admin-modal-backdrop" onClick={() => !isApproving && setShowApproveModal(false)}>
          <div
            className="admin-modal-dialog"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} style={{ color: '#2E7D32' }} />
                <h3 className="admin-modal-title">Approve Registration?</h3>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                disabled={isApproving}
                onClick={() => setShowApproveModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <p style={{ margin: 0, color: '#4A5568', lineHeight: 1.5 }}>
                Approving this request will create the official student record for{' '}
                <strong style={{ color: '#20354A' }}>{selectedAdmission.studentFullName}</strong> and enroll
                the student in{' '}
                <strong style={{ color: '#20354A' }}>{selectedAdmission.requestedGrade}</strong>.
              </p>

              {/* Section Allocation */}
              <div style={{ marginTop: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#27313A',
                    marginBottom: '6px',
                  }}
                >
                  Assign Section:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['A', 'B', 'C'].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      className={`admin-admissions-tab-btn ${selectedSection === sec ? 'active' : ''}`}
                      onClick={() => handleSectionChange(sec)}
                    >
                      Section {sec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Capacity Status */}
              {liveCapacity && (
                <div
                  style={{
                    marginTop: '10px',
                    fontSize: '0.78rem',
                    color: '#647F99',
                    backgroundColor: '#FAF9F5',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #E8E5DD',
                  }}
                >
                  Available seats in Section {selectedSection}:{' '}
                  <strong style={{ color: liveCapacity.isAtCapacity ? '#DC2626' : '#2E7D32' }}>
                    {liveCapacity.availableSeats} of {liveCapacity.maxCapacity} seats remaining
                  </strong>
                </div>
              )}

              {/* Optional Administrative Notes */}
              <div style={{ marginTop: '12px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#27313A',
                    marginBottom: '4px',
                  }}
                >
                  Administrative Notes (Optional):
                </label>
                <textarea
                  className="admin-rejection-textarea"
                  style={{ minHeight: '60px' }}
                  placeholder="e.g. Verified transfer certificate and grade 7 marks sheet."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                />
              </div>

              {approvalError && (
                <div
                  style={{
                    marginTop: '12px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    padding: '10px',
                    borderRadius: '6px',
                    color: '#991B1B',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{approvalError}</span>
                </div>
              )}
            </div>

            <div className="admin-modal-footer" style={{ gap: '10px' }}>
              <button
                type="button"
                className="admin-btn-secondary"
                disabled={isApproving}
                onClick={() => setShowApproveModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-approve"
                disabled={isApproving || liveCapacity?.isAtCapacity}
                onClick={handleConfirmApproval}
              >
                {isApproving ? (
                  <>
                    <RotateCw size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Processing Enrollment...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Confirm Approval</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Rejection Confirmation Modal Dialog */}
      {showRejectModal && selectedAdmission && (
        <div className="admin-modal-backdrop" onClick={() => !isRejecting && setShowRejectModal(false)}>
          <div
            className="admin-modal-dialog"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={20} style={{ color: '#DC2626' }} />
                <h3 className="admin-modal-title">Reject Admission Request</h3>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                disabled={isRejecting}
                onClick={() => setShowRejectModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <p style={{ margin: 0, color: '#4A5568', lineHeight: 1.5 }}>
                Please provide the official reason for declining the registration request for{' '}
                <strong style={{ color: '#20354A' }}>{selectedAdmission.studentFullName}</strong>. This
                feedback will be displayed to the parent guardian.
              </p>

              <div style={{ marginTop: '12px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#27313A',
                  }}
                >
                  Rejection Reason <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  className="admin-rejection-textarea"
                  placeholder="e.g. Grade 8 is currently at maximum capacity for the upcoming academic session."
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (rejectionError) setRejectionError(null);
                  }}
                />
              </div>

              {rejectionError && (
                <div
                  style={{
                    marginTop: '8px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    color: '#991B1B',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <AlertCircle size={14} />
                  <span>{rejectionError}</span>
                </div>
              )}
            </div>

            <div className="admin-modal-footer" style={{ gap: '10px' }}>
              <button
                type="button"
                className="admin-btn-secondary"
                disabled={isRejecting}
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-reject"
                disabled={isRejecting || !rejectionReason.trim()}
                onClick={handleConfirmRejection}
              >
                {isRejecting ? (
                  <>
                    <RotateCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <X size={14} />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAdmissionsPage;
