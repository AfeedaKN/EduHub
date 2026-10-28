import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  UserPlus,
  Users,
  GraduationCap,
  Clock,
  AlertCircle,
  Search,
  X,
  RotateCw,
  CheckCircle2,
  FileText,
  Award,
  CalendarCheck,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Hash,
  Sparkles,
} from 'lucide-react';
import { ParentLayout } from '../../components/parent/ParentLayout';
import { ParentSkeleton } from '../../components/parent/ParentSkeleton';
import { ChildProfileModal } from '../../components/parent/ChildProfileModal';
import { RegistrationRequestModal } from '../../components/parent/RegistrationRequestModal';
import { parentApi } from '../../api/parentApi';
import { ChildProfile, StudentRegistrationRequest } from '../../types/parent.types';

export const MyChildrenPage: React.FC = () => {
  const navigate = useNavigate();
  const { childId: routeChildId } = useParams<{ childId?: string }>();

  // Data states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [registrationRequests, setRegistrationRequests] = useState<StudentRegistrationRequest[]>([]);

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ENROLLED' | 'PENDING' | 'REJECTED'>('ALL');

  // Modals state
  const [selectedChildForProfile, setSelectedChildForProfile] = useState<ChildProfile | null>(null);
  const [selectedRequestForModal, setSelectedRequestForModal] = useState<StudentRegistrationRequest | null>(null);

  // Fetch all children & registration requests
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await parentApi.getDashboardData();
      if (res.data) {
        setChildren(res.data.children || []);
        setRegistrationRequests(res.data.registrationRequests || []);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load children and admission records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Check if a specific childId was passed via URL to open their profile
  useEffect(() => {
    if (routeChildId && children.length > 0) {
      const matched = children.find((c) => c.id === routeChildId);
      if (matched) {
        setSelectedChildForProfile(matched);
      }
    }
  }, [routeChildId, children]);

  const handleCloseChildModal = () => {
    setSelectedChildForProfile(null);
    if (routeChildId) {
      navigate('/parent/children', { replace: true });
    }
  };

  const handleAddStudent = () => {
    navigate('/parent/students/add');
  };

  // KPI Calculations (guaranteed no double counting)
  const enrolledCount = children.length;
  const pendingRequestsCount = registrationRequests.filter(
    (r) => r.status === 'PENDING' || r.status === 'UNDER_REVIEW'
  ).length;
  const rejectedRequestsCount = registrationRequests.filter((r) => r.status === 'REJECTED').length;
  const totalChildrenCount =
    children.length + registrationRequests.filter((r) => r.status !== 'APPROVED').length;

  // Extract unique available class options for filter
  const classOptions = useMemo(() => {
    const set = new Set<string>();
    children.forEach((c) => {
      if (c.grade) set.add(c.grade);
    });
    registrationRequests.forEach((r) => {
      if (r.requestedGrade) set.add(r.requestedGrade);
    });
    return Array.from(set).sort();
  }, [children, registrationRequests]);

  // Filtering Enrolled Children
  const filteredChildren = useMemo(() => {
    if (selectedStatus === 'PENDING' || selectedStatus === 'REJECTED') {
      return [];
    }

    return children.filter((child) => {
      // Search term matching
      const matchesSearch =
        !searchTerm.trim() ||
        child.fullName.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        child.studentId.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        child.grade.toLowerCase().includes(searchTerm.toLowerCase().trim());

      // Class matching
      const matchesClass = selectedClass === 'ALL' || child.grade === selectedClass;

      return matchesSearch && matchesClass;
    });
  }, [children, searchTerm, selectedClass, selectedStatus]);

  // Filtering Registration Requests
  const filteredRequests = useMemo(() => {
    if (selectedStatus === 'ENROLLED') {
      return [];
    }

    return registrationRequests.filter((req) => {
      // Search term matching
      const matchesSearch =
        !searchTerm.trim() ||
        req.studentFullName.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        req.requestedGrade.toLowerCase().includes(searchTerm.toLowerCase().trim());

      // Class matching
      const matchesClass = selectedClass === 'ALL' || req.requestedGrade === selectedClass;

      // Status matching
      let matchesStatus = true;
      if (selectedStatus === 'PENDING') {
        matchesStatus = req.status === 'PENDING' || req.status === 'UNDER_REVIEW';
      } else if (selectedStatus === 'REJECTED') {
        matchesStatus = req.status === 'REJECTED';
      }

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [registrationRequests, searchTerm, selectedClass, selectedStatus]);

  const hasAnyRecords = children.length > 0 || registrationRequests.length > 0;
  const isFilterActive = searchTerm.trim() !== '' || selectedClass !== 'ALL' || selectedStatus !== 'ALL';
  const hasFilterResults = filteredChildren.length > 0 || filteredRequests.length > 0;

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedClass('ALL');
    setSelectedStatus('ALL');
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <ParentLayout pageTitle="My Children">
      <div className="my-children-page-container">
        {/* Breadcrumb Navigation */}
        <div className="my-children-breadcrumb-row">
          <nav className="parent-breadcrumb" aria-label="Breadcrumb">
            <Link to="/parent/dashboard" className="breadcrumb-item">
              Dashboard
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item current">My Children</span>
          </nav>
        </div>

        {/* Page Header with Desktop & Mobile Add Student Button */}
        <div className="my-children-header-row">
          <div className="my-children-header-titles">
            <h1 className="my-children-title">My Children</h1>
            <p className="my-children-subtitle">
              Manage your children&apos;s school profiles and admission requests.
            </p>
          </div>

          <div className="my-children-header-actions">
            <button
              type="button"
              className="btn-add-student-primary"
              onClick={handleAddStudent}
              id="my-children-add-student-btn"
            >
              <UserPlus size={16} />
              <span>+ Add Student</span>
            </button>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && <ParentSkeleton />}

        {/* Error State with Retry */}
        {!loading && error && (
          <div className="parent-dashboard-error-state">
            <AlertCircle size={28} className="text-danger" />
            <h4 className="parent-error-title">Unable to Load Children Profiles</h4>
            <p className="parent-error-desc">{error}</p>
            <button
              type="button"
              className="btn-parent-outline-action"
              onClick={fetchData}
              style={{ marginTop: '12px' }}
            >
              <RotateCw size={14} />
              <span>Retry Loading</span>
            </button>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <>
            {/* Global Empty State: No children and no requests at all */}
            {!hasAnyRecords ? (
              <div className="my-children-empty-card">
                <div className="empty-icon-halo">
                  <GraduationCap size={44} className="text-primary" />
                </div>
                <div className="empty-badge-pill">
                  <Sparkles size={13} />
                  <span>Get Started</span>
                </div>
                <h3 className="empty-title">No Children Connected Yet</h3>
                <p className="empty-description">
                  Connect your child to EduHub by submitting a student admission request. School management
                  will review your application and assign an official class and section.
                </p>
                <button
                  type="button"
                  className="btn-add-student-primary"
                  onClick={handleAddStudent}
                  style={{ marginTop: '8px' }}
                >
                  <UserPlus size={16} />
                  <span>+ Add Student</span>
                  <ArrowRight size={15} />
                </button>
                <div className="empty-notice-row">
                  <ShieldCheck size={14} className="text-sage" />
                  <span>Admission requests are reviewed and approved directly by school administration.</span>
                </div>
              </div>
            ) : (
              <>
                {/* 1. Student Overview KPI Summary Cards */}
                <div className="my-children-kpi-grid">
                  <div className="my-children-kpi-card">
                    <div className="kpi-icon-wrap bg-blue-subtle text-primary">
                      <Users size={20} />
                    </div>
                    <div className="kpi-info">
                      <span className="kpi-label">Total Children</span>
                      <div className="kpi-value-row">
                        <span className="kpi-value">{totalChildrenCount}</span>
                        <span className="kpi-subtext">Connected profiles</span>
                      </div>
                    </div>
                  </div>

                  <div className="my-children-kpi-card">
                    <div className="kpi-icon-wrap bg-sage-subtle text-sage">
                      <GraduationCap size={20} />
                    </div>
                    <div className="kpi-info">
                      <span className="kpi-label">Enrolled</span>
                      <div className="kpi-value-row">
                        <span className="kpi-value">{enrolledCount}</span>
                        <span className="kpi-subtext">Active in school</span>
                      </div>
                    </div>
                  </div>

                  <div className="my-children-kpi-card">
                    <div className="kpi-icon-wrap bg-amber-subtle text-amber">
                      <Clock size={20} />
                    </div>
                    <div className="kpi-info">
                      <span className="kpi-label">Pending Requests</span>
                      <div className="kpi-value-row">
                        <span className="kpi-value">{pendingRequestsCount}</span>
                        <span className="kpi-subtext">Awaiting review</span>
                      </div>
                    </div>
                  </div>

                  <div className="my-children-kpi-card">
                    <div className="kpi-icon-wrap bg-red-subtle text-danger">
                      <AlertCircle size={20} />
                    </div>
                    <div className="kpi-info">
                      <span className="kpi-label">Returned / Rejected</span>
                      <div className="kpi-value-row">
                        <span className="kpi-value">{rejectedRequestsCount}</span>
                        <span className="kpi-subtext">Declined or returned</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Search & Filter Bar */}
                <div className="my-children-filter-panel">
                  <div className="filter-search-box">
                    <Search size={16} className="filter-search-icon" />
                    <input
                      type="text"
                      className="filter-search-input"
                      placeholder="Search by student name or admission ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        className="filter-search-clear"
                        onClick={() => setSearchTerm('')}
                        aria-label="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="filter-controls-group">
                    {/* Class / Grade Filter */}
                    <div className="filter-select-wrap">
                      <select
                        className="filter-select"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        aria-label="Filter by Class"
                      >
                        <option value="ALL">All Grades</option>
                        {classOptions.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div className="filter-select-wrap">
                      <select
                        className="filter-select"
                        value={selectedStatus}
                        onChange={(e) =>
                          setSelectedStatus(
                            e.target.value as 'ALL' | 'ENROLLED' | 'PENDING' | 'REJECTED'
                          )
                        }
                        aria-label="Filter by Status"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="ENROLLED">Enrolled ({enrolledCount})</option>
                        <option value="PENDING">Pending Review ({pendingRequestsCount})</option>
                        <option value="REJECTED">Declined / Returned ({rejectedRequestsCount})</option>
                      </select>
                    </div>

                    {/* Reset Filters button */}
                    {isFilterActive && (
                      <button
                        type="button"
                        className="btn-filter-clear"
                        onClick={resetFilters}
                        title="Reset all filters"
                      >
                        <X size={13} />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Empty State */}
                {isFilterActive && !hasFilterResults && (
                  <div className="my-children-no-results">
                    <Search size={28} className="text-muted-blue" />
                    <h4 className="no-results-title">No matching students or requests</h4>
                    <p className="no-results-desc">
                      No records matched &quot;{searchTerm || selectedClass || selectedStatus}&quot;. Try
                      adjusting your search keyword or active filters.
                    </p>
                    <button type="button" className="btn-parent-outline-action" onClick={resetFilters}>
                      Reset Filters
                    </button>
                  </div>
                )}

                {/* 3. Approved & Enrolled Children Section */}
                {filteredChildren.length > 0 && (
                  <section className="my-children-section">
                    <div className="my-children-section-header">
                      <div className="section-title-wrap">
                        <div className="section-title-row">
                          <h2 className="my-children-section-title">Enrolled Children</h2>
                          <span className="section-count-badge">{filteredChildren.length}</span>
                        </div>
                        <p className="my-children-section-subtitle">
                          Active students officially enrolled and attending classes.
                        </p>
                      </div>
                    </div>

                    <div className="my-children-cards-grid">
                      {filteredChildren.map((child) => (
                        <div key={child.id} className="my-child-card">
                          {/* Top Row: Avatar & Basic Details */}
                          <div className="my-child-card-header">
                            <div className="my-child-avatar-wrap">
                              {child.avatarUrl ? (
                                <img
                                  src={child.avatarUrl}
                                  alt={child.fullName}
                                  className="my-child-avatar-img"
                                />
                              ) : (
                                <div className="my-child-avatar-initials">
                                  {getInitials(child.fullName)}
                                </div>
                              )}
                            </div>

                            <div className="my-child-header-info">
                              <div className="my-child-name-row">
                                <h3 className="my-child-name">{child.fullName}</h3>
                                <span className="my-child-status-badge">
                                  <CheckCircle2 size={12} />
                                  <span>{child.status === 'ACTIVE' ? 'Enrolled' : child.status}</span>
                                </span>
                              </div>

                              <div className="my-child-submeta">
                                <span className="my-child-admission-id">
                                  <Hash size={12} />
                                  <span>ID: {child.studentId}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Academic Information Grid */}
                          <div className="my-child-details-grid">
                            <div className="my-child-detail-col">
                              <span className="child-meta-label">Class & Section</span>
                              <span className="child-meta-val highlight">
                                {child.grade} · Section {child.section || 'A'}
                              </span>
                            </div>

                            <div className="my-child-detail-col">
                              <span className="child-meta-label">Academic Year</span>
                              <span className="child-meta-val">
                                {child.academicYear || '2026-2027'}
                              </span>
                            </div>

                            <div className="my-child-detail-col">
                              <span className="child-meta-label">Class Teacher</span>
                              <span className="child-meta-val">
                                {child.classTeacher || 'Assigned in Class'}
                              </span>
                            </div>

                            {child.rollNumber && (
                              <div className="my-child-detail-col">
                                <span className="child-meta-label">Roll Number</span>
                                <span className="child-meta-val">#{child.rollNumber}</span>
                              </div>
                            )}
                          </div>

                          {/* Card Footer Actions */}
                          <div className="my-child-card-footer">
                            <button
                              type="button"
                              className="btn-child-primary-profile"
                              onClick={() => setSelectedChildForProfile(child)}
                            >
                              <span>View Profile</span>
                              <ArrowRight size={14} />
                            </button>

                            <div className="my-child-footer-shortcuts">
                              <button
                                type="button"
                                className="btn-child-shortcut"
                                onClick={() => navigate('/parent/assignments')}
                                title="View Assignments"
                              >
                                <FileText size={14} />
                                <span>Assignments</span>
                              </button>
                              <button
                                type="button"
                                className="btn-child-shortcut"
                                onClick={() => navigate('/parent/exams')}
                                title="View Exam Results"
                              >
                                <Award size={14} />
                                <span>Results</span>
                              </button>
                              <button
                                type="button"
                                className="btn-child-shortcut"
                                onClick={() => navigate('/parent/attendance')}
                                title="View Attendance"
                              >
                                <CalendarCheck size={14} />
                                <span>Attendance</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 4. Admission Requests Section */}
                {filteredRequests.length > 0 && (
                  <section className="my-children-section" style={{ marginTop: '36px' }}>
                    <div className="my-children-section-header">
                      <div className="section-title-wrap">
                        <div className="section-title-row">
                          <h2 className="my-children-section-title">Admission & Registration Requests</h2>
                          <span className="section-count-badge warning">{filteredRequests.length}</span>
                        </div>
                        <p className="my-children-section-subtitle">
                          Applications submitted to school management. Official student status requires
                          approval.
                        </p>
                      </div>
                    </div>

                    <div className="my-requests-cards-stack">
                      {filteredRequests.map((req) => {
                        const isRejected = req.status === 'REJECTED';
                        const isApproved = req.status === 'APPROVED';

                        return (
                          <div
                            key={req.id}
                            className={`my-request-card ${
                              isRejected ? 'is-declined' : isApproved ? 'is-approved' : 'is-review'
                            }`}
                          >
                            <div className="my-request-card-left">
                              <div
                                className={`my-request-icon-box ${
                                  isRejected
                                    ? 'icon-declined'
                                    : isApproved
                                    ? 'icon-approved'
                                    : 'icon-review'
                                }`}
                              >
                                {isRejected ? (
                                  <AlertCircle size={20} className="text-danger" />
                                ) : isApproved ? (
                                  <CheckCircle2 size={20} style={{ color: '#2E7D32' }} />
                                ) : (
                                  <Clock size={20} className="text-muted-blue" />
                                )}
                              </div>

                              <div className="my-request-content">
                                <div className="my-request-headline">
                                  <h4 className="my-request-name">{req.studentFullName}</h4>
                                  <span className="my-request-class-tag">
                                    Requested: <strong>{req.requestedGrade}</strong>
                                  </span>
                                  <span
                                    className={`parent-request-badge ${
                                      isRejected
                                        ? 'badge-rejected'
                                        : isApproved
                                        ? 'badge-approved'
                                        : 'badge-pending'
                                    }`}
                                  >
                                    {isRejected
                                      ? 'Application Declined'
                                      : isApproved
                                      ? 'Approved & Enrolled'
                                      : req.status === 'UNDER_REVIEW'
                                      ? 'Under School Review'
                                      : 'Pending Management Review'}
                                  </span>
                                </div>

                                <div className="my-request-meta-row">
                                  <span className="my-request-meta-item">
                                    Submitted: {req.submissionDate || 'Recently'}
                                  </span>
                                  {req.academicYear && (
                                    <span className="my-request-meta-item">
                                      · Academic Year: {req.academicYear}
                                    </span>
                                  )}
                                  {req.parentRelationship && (
                                    <span className="my-request-meta-item">
                                      · Relationship: {req.parentRelationship}
                                    </span>
                                  )}
                                </div>

                                {isRejected && req.rejectionReason && (
                                  <div className="my-request-feedback-box">
                                    <AlertCircle size={14} className="text-danger" />
                                    <span>
                                      <strong>Management Feedback:</strong> {req.rejectionReason}
                                    </span>
                                  </div>
                                )}

                                {!isRejected && !isApproved && (
                                  <p className="my-request-note">
                                    School management reviews applications in order of submission. You will
                                    see your child appear under Enrolled Children once approved.
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="my-request-card-right">
                              <button
                                type="button"
                                className="btn-request-action"
                                onClick={() => setSelectedRequestForModal(req)}
                              >
                                <FileText size={14} />
                                <span>{isRejected ? 'View Feedback' : 'View Application'}</span>
                                <ChevronRight size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Child Profile Modal */}
      <ChildProfileModal
        child={selectedChildForProfile}
        isOpen={Boolean(selectedChildForProfile)}
        onClose={handleCloseChildModal}
      />

      {/* View Request Details Modal */}
      <RegistrationRequestModal
        request={selectedRequestForModal}
        isOpen={Boolean(selectedRequestForModal)}
        onClose={() => setSelectedRequestForModal(null)}
      />
    </ParentLayout>
  );
};

export default MyChildrenPage;
