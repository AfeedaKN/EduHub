import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  RotateCw,
  Eye,
  UserCheck,
  UserX,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Power,
  Clock,
  BookOpen,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/adminApi';
import {
  ParentDirectoryItem,
  ParentSummaryStats,
  ParentDetail,
  StudentDetail,
} from '../../types/admin.types';

export const AdminParentsPage: React.FC = () => {
  const navigate = useNavigate();

  // Data states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [parents, setParents] = useState<ParentDirectoryItem[]>([]);
  const [totalParents, setTotalParents] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit] = useState<number>(10);

  // Summary stats
  const [summary, setSummary] = useState<ParentSummaryStats>({
    totalParents: 0,
    parentsWithChildren: 0,
    parentsWithoutChildren: 0,
    multipleChildrenFamilies: 0,
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'ALL' | 'WITH_CHILDREN' | 'WITHOUT_CHILDREN'>('ALL');
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>('ALL');

  // Modals
  const [selectedParent, setSelectedParent] = useState<ParentDetail | null>(null);

  // Child view modal (when clicking on a child from the parent list/modal)
  const [viewingChild, setViewingChild] = useState<StudentDetail | null>(null);

  // Status toggle confirmation
  const [parentToToggle, setParentToToggle] = useState<ParentDirectoryItem | null>(null);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch summary counts
  const fetchSummary = async () => {
    try {
      const res = await adminApi.getParentSummaryStats();
      if (res.data) {
        setSummary(res.data);
      }
    } catch {
      // Ignore non-fatal
    }
  };

  // Fetch parents list
  const fetchParents = async (currentPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getParents({
        search: searchTerm.trim() || undefined,
        studentStatus: studentStatusFilter === 'ALL' ? undefined : studentStatusFilter,
        status: accountStatusFilter === 'ALL' ? undefined : accountStatusFilter,
        page: currentPage,
        limit,
      });

      if (res.data) {
        setParents(res.data.parents || []);
        setTotalParents(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        setPage(res.data.page || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load parents directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Trigger search on debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchParents(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, studentStatusFilter, accountStatusFilter]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStudentStatusFilter('ALL');
    setAccountStatusFilter('ALL');
  };

  // Open Parent Details modal
  const handleOpenParentModal = async (parentId: string) => {
    try {
      const res = await adminApi.getParentById(parentId);
      if (res.data) {
        setSelectedParent(res.data);
      }
    } catch {
      // Fallback
      const fallback = parents.find((p) => p.id === parentId);
      if (fallback) {
        setSelectedParent({
          parent: {
            id: fallback.id,
            fullName: fallback.fullName,
            email: fallback.email,
            phone: fallback.phone,
            role: fallback.role,
            status: fallback.status,
            createdAt: fallback.createdAt,
          },
          linkedChildren: fallback.linkedChildren,
          admissionRequests: [],
        });
      }
    }
  };

  // Open Child Profile Modal
  const handleViewChildProfile = async (childId: string) => {
    try {
      const res = await adminApi.getStudentById(childId);
      if (res.data) {
        setViewingChild(res.data);
      }
    } catch {
      // Child detail failed
    }
  };

  // Handle Account Status Toggle (Active <-> Disabled)
  const handleConfirmStatusToggle = async () => {
    if (!parentToToggle) return;
    setIsToggling(true);
    setToggleError(null);
    try {
      const newStatus = parentToToggle.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
      const res = await adminApi.updateParentStatus(parentToToggle.id, newStatus);
      setToastMessage(res.message || `Account ${newStatus.toLowerCase()} successfully.`);
      setParentToToggle(null);
      if (selectedParent && selectedParent.parent.id === parentToToggle.id) {
        setSelectedParent({
          ...selectedParent,
          parent: { ...selectedParent.parent, status: newStatus },
        });
      }
      fetchParents(page);
      fetchSummary();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToggleError(err.message || 'Failed to update account status.');
    } finally {
      setIsToggling(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'PG';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <AdminLayout breadcrumbTitle="Parents & Guardians">
      {/* Page Header */}
      <div className="admin-admissions-page-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="admin-admissions-page-title" style={{ margin: 0 }}>
                Parents & Guardians
              </h1>
              <span
                style={{
                  backgroundColor: '#FAF5FF',
                  color: '#9333EA',
                  border: '1px solid #E9D5FF',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {summary.totalParents} Registered
              </span>
            </div>
            <p className="admin-admissions-page-subtitle" style={{ marginTop: '4px' }}>
              Manage parent accounts, contact information and linked students.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => {
                fetchSummary();
                fetchParents(page);
              }}
              title="Refresh Directory"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => navigate('/admin/admissions')}
              title="Review family admissions requests"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <BookOpen size={14} />
              <span>Admissions Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {toastMessage && (
        <div
          style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '8px',
            padding: '12px 16px',
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
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 1. Summary Cards Grid */}
      <section className="admin-classes-summary-grid" aria-label="Parents Directory Summary Metrics">
        {/* Card 1: Total Parents */}
        <div className="admin-classes-card-stat">
          <div>
            <div className="admin-card-stat-label">Total Parents</div>
            <div className="admin-card-stat-value">{summary.totalParents}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
              Registered accounts
            </div>
          </div>
          <div className="admin-card-stat-icon-wrap admin-stat-icon-blue">
            <Users size={20} />
          </div>
        </div>

        {/* Card 2: Parents with Linked Students */}
        <div className="admin-classes-card-stat">
          <div>
            <div className="admin-card-stat-label">With Linked Students</div>
            <div className="admin-card-stat-value">{summary.parentsWithChildren}</div>
            <div style={{ fontSize: '0.74rem', color: '#16A34A', marginTop: '4px', fontWeight: 600 }}>
              Enrolled students connected
            </div>
          </div>
          <div className="admin-card-stat-icon-wrap admin-stat-icon-sage">
            <UserCheck size={20} />
          </div>
        </div>

        {/* Card 3: Parents Without Linked Students */}
        <div className="admin-classes-card-stat">
          <div>
            <div className="admin-card-stat-label">Without Enrolled Child</div>
            <div className="admin-card-stat-value">{summary.parentsWithoutChildren}</div>
            <div style={{ fontSize: '0.74rem', color: '#D97706', marginTop: '4px', fontWeight: 600 }}>
              Prospect or pending
            </div>
          </div>
          <div className="admin-card-stat-icon-wrap admin-stat-icon-amber">
            <UserX size={20} />
          </div>
        </div>

        {/* Card 4: Families with Multiple Children */}
        <div className="admin-classes-card-stat">
          <div>
            <div className="admin-card-stat-label">Multiple Children</div>
            <div className="admin-card-stat-value">{summary.multipleChildrenFamilies}</div>
            <div style={{ fontSize: '0.74rem', color: '#9333EA', marginTop: '4px', fontWeight: 600 }}>
              Families with ≥2 siblings
            </div>
          </div>
          <div className="admin-card-stat-icon-wrap admin-stat-icon-purple">
            <Layers size={20} />
          </div>
        </div>
      </section>

      {/* 2. Search & Filters Toolbar */}
      <div className="admin-admissions-filter-toolbar">
        <div className="admin-search-input-wrap">
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by parent name, email address, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="admin-filter-controls-right">
          {/* Linked Students Filter */}
          <select
            className="admin-filter-select"
            value={studentStatusFilter}
            onChange={(e) => setStudentStatusFilter(e.target.value as any)}
          >
            <option value="ALL">All Guardians</option>
            <option value="WITH_CHILDREN">With Linked Students</option>
            <option value="WITHOUT_CHILDREN">Without Linked Students</option>
          </select>

          {/* Account Status Filter */}
          <select
            className="admin-filter-select"
            value={accountStatusFilter}
            onChange={(e) => setAccountStatusFilter(e.target.value)}
          >
            <option value="ALL">All Account Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
          </select>

          {/* Reset Filters */}
          {(searchTerm || studentStatusFilter !== 'ALL' || accountStatusFilter !== 'ALL') && (
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={handleResetFilters}
              style={{ fontSize: '0.8rem', padding: '7px 12px' }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Parents Directory Table Card */}
      <div className="admin-admissions-table-card">
        {loading && parents.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
            <RotateCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading registered parent accounts...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: '#DC2626' }}>
            <AlertCircle size={28} style={{ margin: '0 auto 8px auto' }} />
            <p style={{ fontWeight: 600, margin: '0 0 8px 0' }}>{error}</p>
            <button type="button" className="admin-btn-secondary" onClick={() => fetchParents(page)}>
              Try Again
            </button>
          </div>
        ) : parents.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Users size={40} style={{ color: 'var(--admin-text-subtle)', margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', color: 'var(--admin-primary)', fontSize: '1.05rem' }}>
              No parent accounts found
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: 'var(--admin-text-muted)', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
              {searchTerm || studentStatusFilter !== 'ALL' || accountStatusFilter !== 'ALL'
                ? 'No registered parent accounts match the active search and filter criteria.'
                : 'There are currently no registered parent accounts in the database.'}
            </p>
            {(searchTerm || studentStatusFilter !== 'ALL' || accountStatusFilter !== 'ALL') && (
              <button type="button" className="admin-btn-secondary" onClick={handleResetFilters}>
                Clear Active Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="admin-admissions-table-wrap-desktop">
              <table className="admin-admissions-table">
                <thead>
                  <tr>
                    <th>Parent / Guardian</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Linked Children</th>
                    <th>Children's Class / Section</th>
                    <th>Account Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parents.map((parent) => (
                    <tr key={parent.id}>
                      {/* Parent Column */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: '#FAF5FF',
                              color: '#9333EA',
                              border: '1px solid #E9D5FF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(parent.fullName)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--admin-primary)', fontSize: '0.88rem' }}>
                              {parent.fullName}
                            </div>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: 'var(--admin-muted-blue)',
                                backgroundColor: '#F0F4F8',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                display: 'inline-block',
                                marginTop: '2px',
                              }}
                            >
                              {parent.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--admin-text-main)' }}>
                          <Mail size={13} style={{ color: 'var(--admin-muted-blue)', flexShrink: 0 }} />
                          <span>{parent.email}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--admin-text-main)' }}>
                          <Phone size={13} style={{ color: 'var(--admin-muted-blue)', flexShrink: 0 }} />
                          <span>{parent.phone || '—'}</span>
                        </div>
                      </td>

                      {/* Linked Children */}
                      <td>
                        {parent.linkedChildren.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                            <span
                              style={{
                                backgroundColor: '#EFF6FF',
                                color: '#2563EB',
                                border: '1px solid #BFDBFE',
                                padding: '2px 8px',
                                borderRadius: '999px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                              }}
                            >
                              {parent.linkedChildren.length} {parent.linkedChildren.length === 1 ? 'Child' : 'Children'}
                            </span>

                            {parent.linkedChildren.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => handleViewChildProfile(c.id)}
                                title={`Click to view ${c.fullName}'s student profile`}
                                style={{
                                  background: 'none',
                                  border: '1px solid var(--admin-border)',
                                  borderRadius: '4px',
                                  padding: '2px 6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  color: 'var(--admin-primary)',
                                  cursor: 'pointer',
                                  backgroundColor: '#FFFFFF',
                                }}
                              >
                                {c.fullName}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>
                            No linked students
                          </span>
                        )}
                      </td>

                      {/* Children's Class / Section */}
                      <td>
                        {parent.linkedChildren.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {parent.linkedChildren.map((c) => (
                              <span key={c.id} className="admin-section-pill">
                                <span>{c.grade}</span>
                                <span className="admin-section-pill-tag">Sec {c.section}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--admin-text-subtle)' }}>—</span>
                        )}
                      </td>

                      {/* Account Status */}
                      <td>
                        <span
                          className={`admin-badge-status ${
                            parent.status === 'ACTIVE'
                              ? 'admin-badge-status-active'
                              : 'admin-badge-status-inactive'
                          }`}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: parent.status === 'ACTIVE' ? '#16A34A' : '#DC2626',
                            }}
                          />
                          {parent.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="admin-btn-secondary"
                            onClick={() => handleOpenParentModal(parent.id)}
                            title="View Parent Profile & Details"
                            style={{ padding: '6px 10px', fontSize: '0.76rem' }}
                          >
                            <Eye size={13} style={{ marginRight: '4px' }} />
                            <span>Profile</span>
                          </button>

                          <button
                            type="button"
                            className="admin-btn-secondary"
                            onClick={() => setParentToToggle(parent)}
                            title={parent.status === 'ACTIVE' ? 'Disable Account' : 'Activate Account'}
                            style={{
                              padding: '6px 8px',
                              color: parent.status === 'ACTIVE' ? '#DC2626' : '#16A34A',
                            }}
                          >
                            <Power size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="admin-admissions-cards-mobile">
              {parents.map((parent) => (
                <div key={parent.id} className="admin-admission-card-mobile">
                  <div className="admin-card-mobile-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: '#FAF5FF',
                          color: '#9333EA',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                        }}
                      >
                        {getInitials(parent.fullName)}
                      </div>
                      <div>
                        <div className="admin-card-mobile-name">{parent.fullName}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                          {parent.email}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`admin-badge-status ${
                        parent.status === 'ACTIVE'
                          ? 'admin-badge-status-active'
                          : 'admin-badge-status-inactive'
                      }`}
                    >
                      {parent.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', padding: '8px 0', borderTop: '1px solid var(--admin-border-subtle)', borderBottom: '1px solid var(--admin-border-subtle)' }}>
                    <div>
                      <span style={{ color: 'var(--admin-text-muted)' }}>Phone:</span>{' '}
                      <span>{parent.phone || 'Not Provided'}</span>
                    </div>
                    <div style={{ marginTop: '6px' }}>
                      <span style={{ color: 'var(--admin-text-muted)' }}>Linked Children:</span>{' '}
                      {parent.linkedChildren.length > 0 ? (
                        <strong>
                          {parent.linkedChildren.map((c) => `${c.fullName} (${c.grade})`).join(', ')}
                        </strong>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: 'var(--admin-text-muted)' }}>
                          No linked students
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => handleOpenParentModal(parent.id)}
                      style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                    >
                      <Eye size={13} style={{ marginRight: '4px' }} />
                      View Profile
                    </button>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => setParentToToggle(parent)}
                      style={{ fontSize: '0.78rem', padding: '6px 10px', color: parent.status === 'ACTIVE' ? '#DC2626' : '#16A34A' }}
                    >
                      <Power size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderTop: '1px solid var(--admin-border)',
                backgroundColor: '#FFFFFF',
                borderRadius: '0 0 10px 10px',
                fontSize: '0.84rem',
                color: 'var(--admin-text-muted)',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalParents} total records)
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  disabled={page <= 1}
                  onClick={() => fetchParents(page - 1)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  disabled={page >= totalPages}
                  onClick={() => fetchParents(page + 1)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ==========================================
          MODAL 1: PARENT PROFILE & DETAILS MODAL
         ========================================== */}
      {selectedParent && (
        <div className="admin-modal-overlay" onClick={() => setSelectedParent(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: '#FAF5FF',
                    color: '#9333EA',
                    border: '1px solid #E9D5FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  {getInitials(selectedParent.parent.fullName)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--admin-primary)' }}>
                    {selectedParent.parent.fullName}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--admin-muted-blue)',
                        backgroundColor: '#F0F4F8',
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {selectedParent.parent.role}
                    </span>
                    <span
                      className={`admin-badge-status ${
                        selectedParent.parent.status === 'ACTIVE'
                          ? 'admin-badge-status-active'
                          : 'admin-badge-status-inactive'
                      }`}
                      style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                    >
                      {selectedParent.parent.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedParent(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Account Details Box */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', backgroundColor: 'var(--admin-bg-subtle)', padding: '14px', borderRadius: '8px', border: '1px solid var(--admin-border)', marginBottom: '18px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Email Address</span>
                  <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--admin-primary)' }}>
                    {selectedParent.parent.email}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Phone Number</span>
                  <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--admin-primary)' }}>
                    {selectedParent.parent.phone || 'Not Provided'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Registered Since</span>
                  <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                    {selectedParent.parent.createdAt ? selectedParent.parent.createdAt.split('T')[0] : '—'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Portal Access</span>
                  <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                    {selectedParent.parent.status === 'ACTIVE' ? 'Authorized & Active' : 'Access Restricted'}
                  </div>
                </div>
              </div>

              {/* Linked Children List */}
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--admin-text-muted)', letterSpacing: '0.04em', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <GraduationCap size={14} /> Officially Enrolled Children ({selectedParent.linkedChildren.length})
                </h4>

                {selectedParent.linkedChildren.length === 0 ? (
                  <div style={{ padding: '16px', backgroundColor: 'var(--admin-bg-subtle)', borderRadius: '8px', border: '1px dashed var(--admin-border)', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.82rem' }}>
                    No officially enrolled students are linked to this parent account.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedParent.linkedChildren.map((child) => (
                      <div
                        key={child.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          border: '1px solid var(--admin-border)',
                          borderRadius: '8px',
                          backgroundColor: '#FFFFFF',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              backgroundColor: '#EFF6FF',
                              color: '#2563EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                            }}
                          >
                            {getInitials(child.fullName)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--admin-primary)' }}>
                              {child.fullName}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                              {child.grade} - Section {child.section} | ID: {child.studentId}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="admin-btn-secondary"
                          onClick={() => {
                            setSelectedParent(null);
                            handleViewChildProfile(child.id);
                          }}
                          style={{ fontSize: '0.76rem', padding: '5px 10px' }}
                        >
                          <Eye size={12} style={{ marginRight: '4px' }} />
                          View Student
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Admission Requests Submitted */}
              {selectedParent.admissionRequests.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--admin-text-muted)', letterSpacing: '0.04em', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} /> Admissions History ({selectedParent.admissionRequests.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedParent.admissionRequests.map((req) => (
                      <div
                        key={req.id}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '6px',
                          border: '1px solid var(--admin-border)',
                          backgroundColor: 'var(--admin-bg-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--admin-primary)' }}>
                            {req.studentFullName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>
                            Grade: {req.requestedGrade} | Submitted: {req.submissionDate}
                          </div>
                          {req.rejectionReason && (
                            <div style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: '2px' }}>
                              Reason: {req.rejectionReason}
                            </div>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor:
                              req.status === 'APPROVED' ? '#DCFCE7' : req.status === 'REJECTED' ? '#FEE2E2' : '#FFFBEB',
                            color:
                              req.status === 'APPROVED' ? '#15803D' : req.status === 'REJECTED' ? '#B91C1C' : '#B45309',
                            border: `1px solid ${
                              req.status === 'APPROVED' ? '#BBF7D0' : req.status === 'REJECTED' ? '#FCA5A5' : '#FDE68A'
                            }`,
                          }}
                        >
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => {
                  setParentToToggle({
                    id: selectedParent.parent.id,
                    fullName: selectedParent.parent.fullName,
                    email: selectedParent.parent.email,
                    phone: selectedParent.parent.phone,
                    role: selectedParent.parent.role,
                    status: selectedParent.parent.status,
                    linkedChildren: selectedParent.linkedChildren,
                    linkedChildrenCount: selectedParent.linkedChildren.length,
                    createdAt: selectedParent.parent.createdAt,
                  });
                }}
                style={{
                  color: selectedParent.parent.status === 'ACTIVE' ? '#DC2626' : '#16A34A',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Power size={14} />
                <span>{selectedParent.parent.status === 'ACTIVE' ? 'Disable Account' : 'Activate Account'}</span>
              </button>

              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setSelectedParent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: CHILD DETAIL MODAL
         ========================================== */}
      {viewingChild && (
        <div className="admin-modal-overlay" onClick={() => setViewingChild(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '580px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    border: '1px solid #BFDBFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  {getInitials(viewingChild.fullName)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--admin-primary)' }}>
                    {viewingChild.fullName}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                      ID: {viewingChild.studentId}
                    </span>
                    <span
                      className={`admin-badge-status ${
                        viewingChild.status === 'ACTIVE'
                          ? 'admin-badge-status-active'
                          : 'admin-badge-status-inactive'
                      }`}
                      style={{ fontSize: '0.68rem', padding: '1px 6px' }}
                    >
                      {viewingChild.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setViewingChild(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', backgroundColor: 'var(--admin-bg-subtle)', padding: '14px', borderRadius: '8px', border: '1px solid var(--admin-border)', marginBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Class / Grade</span>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--admin-primary)' }}>
                    {viewingChild.grade}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Section</span>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--admin-primary)' }}>
                    Section {viewingChild.section}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Roll Number</span>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--admin-primary)' }}>
                    {viewingChild.rollNumber || '—'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Academic Year</span>
                  <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{viewingChild.academicYear}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Enrollment Date</span>
                  <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{viewingChild.enrolledAt}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Class Teacher</span>
                  <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{viewingChild.classTeacher || 'Assigned Faculty'}</div>
                </div>
              </div>

              {viewingChild.parent && (
                <div style={{ padding: '12px', border: '1px solid var(--admin-border)', borderRadius: '6px', backgroundColor: '#FFFFFF' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Authorized Guardian
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--admin-primary)', marginTop: '2px' }}>
                    {viewingChild.parent.fullName}{' '}
                    {viewingChild.parent.relationship && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--admin-muted-blue)', fontWeight: 500 }}>
                        ({viewingChild.parent.relationship})
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                    {viewingChild.parent.email} {viewingChild.parent.phone ? `• ${viewingChild.parent.phone}` : ''}
                  </div>
                </div>
              )}
            </div>

            <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setViewingChild(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 3: ACCOUNT STATUS TOGGLE CONFIRMATION
         ========================================== */}
      {parentToToggle && (
        <div className="admin-modal-overlay" onClick={() => setParentToToggle(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--admin-primary)' }}>
                {parentToToggle.status === 'ACTIVE' ? 'Disable Parent Account' : 'Activate Parent Account'}
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setParentToToggle(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              {toggleError && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{toggleError}</span>
                </div>
              )}

              <p style={{ margin: '0 0 12px 0', fontSize: '0.86rem', color: 'var(--admin-text-main)' }}>
                Are you sure you want to{' '}
                <strong>{parentToToggle.status === 'ACTIVE' ? 'disable' : 'activate'}</strong> the parent account for{' '}
                <strong>{parentToToggle.fullName}</strong> ({parentToToggle.email})?
              </p>

              {parentToToggle.status === 'ACTIVE' ? (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', padding: '10px 12px', borderRadius: '6px', fontSize: '0.78rem', color: '#991B1B' }}>
                  Disabling this account will prevent the parent from logging into the Parent Portal, accessing academic dashboards, and submitting student inquiries until re-activated.
                </div>
              ) : (
                <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '10px 12px', borderRadius: '6px', fontSize: '0.78rem', color: '#166534' }}>
                  Activating this account will restore full Parent Portal access, enabling the guardian to view their children's grades, attendance, and notifications.
                </div>
              )}
            </div>

            <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="admin-btn-secondary"
                disabled={isToggling}
                onClick={() => setParentToToggle(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={parentToToggle.status === 'ACTIVE' ? 'admin-btn-reject' : 'admin-btn-approve'}
                disabled={isToggling}
                onClick={handleConfirmStatusToggle}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {isToggling && <RotateCw size={14} className="animate-spin" />}
                <span>
                  {parentToToggle.status === 'ACTIVE' ? 'Confirm Disable' : 'Confirm Activate'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
export default AdminParentsPage;
