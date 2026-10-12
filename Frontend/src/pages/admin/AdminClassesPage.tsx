import React, { useEffect, useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Edit2,
  Trash2,
  Power,
  Users,
  DoorOpen,
  ArrowRight,
  X,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/adminApi';
import {
  ClassDetail,
  SectionDetail,
  ClassSummaryStats,
  ClassStatus,
  SectionStatus,
} from '../../types/admin.types';

const PRESET_GRADES = [
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

const ACADEMIC_YEAR_OPTIONS = ['2026-2027', '2027-2028', '2025-2026'];

export const AdminClassesPage: React.FC = () => {
  // Data states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassDetail[]>([]);
  const [summaryStats, setSummaryStats] = useState<ClassSummaryStats>({
    totalClasses: 0,
    totalSections: 0,
    totalEnrolledStudents: 0,
    totalAvailableSeats: 0,
  });

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Success message toast
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Add / Edit Class Modal State
  const [showClassModal, setShowClassModal] = useState<boolean>(false);
  const [editingClass, setEditingClass] = useState<ClassDetail | null>(null);
  const [classNameInput, setClassNameInput] = useState<string>('Grade 8');
  const [classYearInput, setClassYearInput] = useState<string>('2026-2027');
  const [classDescInput, setClassDescInput] = useState<string>('');
  const [classStatusInput, setClassStatusInput] = useState<ClassStatus>('ACTIVE');
  const [classFormError, setClassFormError] = useState<string | null>(null);
  const [isSubmittingClass, setIsSubmittingClass] = useState<boolean>(false);

  // Sections Drawer / Drill-down Modal State
  const [activeClassForSections, setActiveClassForSections] = useState<ClassDetail | null>(null);

  // Add / Edit Section Modal State
  const [showSectionModal, setShowSectionModal] = useState<boolean>(false);
  const [editingSection, setEditingSection] = useState<SectionDetail | null>(null);
  const [sectionNameInput, setSectionNameInput] = useState<string>('A');
  const [sectionCapacityInput, setSectionCapacityInput] = useState<number>(30);
  const [sectionRoomInput, setSectionRoomInput] = useState<string>('');
  const [sectionStatusInput, setSectionStatusInput] = useState<SectionStatus>('ACTIVE');
  const [sectionFormError, setSectionFormError] = useState<string | null>(null);
  const [isSubmittingSection, setIsSubmittingSection] = useState<boolean>(false);

  // Confirmation Modal State
  const [confirmationModal, setConfirmationModal] = useState<{
    title: string;
    description: string;
    actionLabel: string;
    isDestructive: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  // Error message toast
  const [toastError, setToastError] = useState<string | null>(null);

  const showError = (msg: string) => {
    setToastError(msg);
    setTimeout(() => {
      setToastError(null);
    }, 5000);
  };

  // Fetch classes and summary statistics
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, classesRes] = await Promise.all([
        adminApi.getClassSummaryStats({
          academicYear: selectedYear === 'ALL' ? undefined : selectedYear,
        }),
        adminApi.getClasses({
          academicYear: selectedYear === 'ALL' ? undefined : selectedYear,
          status: selectedStatus === 'ALL' ? undefined : selectedStatus,
          search: searchTerm ? searchTerm : undefined,
        }),
      ]);

      if (statsRes.success && statsRes.data) {
        setSummaryStats(statsRes.data);
      }

      if (classesRes.success && classesRes.data) {
        setClasses(classesRes.data);
        // If drill-down modal is open, refresh active class data
        if (activeClassForSections) {
          try {
            const singleClassRes = await adminApi.getClassById(activeClassForSections.id);
            if (singleClassRes.success && singleClassRes.data) {
              setActiveClassForSections(singleClassRes.data);
            }
          } catch {
            // Ignore if deleted
          }
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to load classes and sections data. Please check connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedStatus]);

  // Handle Search Input with Enter or blur
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const showSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  // Open Add Class Modal
  const handleOpenAddClass = () => {
    setEditingClass(null);
    setClassNameInput('');
    setClassYearInput(selectedYear !== 'ALL' ? selectedYear : '2026-2027');
    setClassDescInput('');
    setClassStatusInput('ACTIVE');
    setClassFormError(null);
    setShowClassModal(true);
  };

  // Open Edit Class Modal
  const handleOpenEditClass = (c: ClassDetail) => {
    setEditingClass(c);
    setClassNameInput(c.name);
    setClassYearInput(c.academicYear);
    setClassDescInput(c.description || '');
    setClassStatusInput(c.status);
    setClassFormError(null);
    setShowClassModal(true);
  };

  // Save Class (Create or Update)
  const handleSubmitClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput.trim()) {
      setClassFormError('Class name or grade is required.');
      return;
    }

    setIsSubmittingClass(true);
    setClassFormError(null);

    try {
      if (editingClass) {
        await adminApi.updateClass(editingClass.id, {
          name: classNameInput.trim(),
          academicYear: classYearInput.trim(),
          description: classDescInput.trim(),
          status: classStatusInput,
        });
        showSuccess(`Class "${classNameInput}" updated successfully.`);
      } else {
        await adminApi.createClass({
          name: classNameInput.trim(),
          academicYear: classYearInput.trim(),
          description: classDescInput.trim(),
        });
        showSuccess(`Class "${classNameInput}" created successfully.`);
      }
      setShowClassModal(false);
      await fetchData();
    } catch (err: any) {
      setClassFormError(err.response?.data?.message || 'Failed to save class. Please check inputs.');
    } finally {
      setIsSubmittingClass(false);
    }
  };

  // Toggle Class Status (Active / Inactive)
  const handleToggleClassStatus = (c: ClassDetail) => {
    const nextStatus: ClassStatus = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setConfirmationModal({
      title: `${nextStatus === 'ACTIVE' ? 'Activate' : 'Deactivate'} Class "${c.name}"?`,
      description:
        nextStatus === 'INACTIVE'
          ? `Deactivating this class will prevent new sections from being assigned. Existing students will remain enrolled.`
          : `Activating this class will make it active for course registration and section allocations.`,
      actionLabel: nextStatus === 'ACTIVE' ? 'Confirm Activation' : 'Confirm Deactivation',
      isDestructive: nextStatus === 'INACTIVE',
      onConfirm: async () => {
        await adminApi.changeClassStatus(c.id, nextStatus);
        showSuccess(`Class "${c.name}" status changed to ${nextStatus}.`);
        await fetchData();
      },
    });
  };

  // Open Add Section Modal
  const handleOpenAddSection = () => {
    if (!activeClassForSections) return;
    setEditingSection(null);
    // Suggest next section letter (e.g. B if A exists)
    const existingLetters = activeClassForSections.sections.map((s) => s.name.toUpperCase());
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const nextLetter = alphabet.find((l) => !existingLetters.includes(l)) || 'A';

    setSectionNameInput(nextLetter);
    setSectionCapacityInput(30);
    setSectionRoomInput('');
    setSectionStatusInput('ACTIVE');
    setSectionFormError(null);
    setShowSectionModal(true);
  };

  // Open Edit Section Modal
  const handleOpenEditSection = (sec: SectionDetail) => {
    setEditingSection(sec);
    setSectionNameInput(sec.name);
    setSectionCapacityInput(sec.capacity);
    setSectionRoomInput(sec.roomNumber || '');
    setSectionStatusInput(sec.status);
    setSectionFormError(null);
    setShowSectionModal(true);
  };

  // Save Section (Create or Update)
  const handleSubmitSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClassForSections) return;

    if (!sectionNameInput.trim()) {
      setSectionFormError('Section name is required (e.g. A, B).');
      return;
    }

    if (!sectionCapacityInput || sectionCapacityInput < 1) {
      setSectionFormError('Section capacity must be a positive integer greater than zero.');
      return;
    }

    setIsSubmittingSection(true);
    setSectionFormError(null);

    try {
      if (editingSection) {
        await adminApi.updateSection(activeClassForSections.id, editingSection.id, {
          name: sectionNameInput.trim().toUpperCase(),
          capacity: Number(sectionCapacityInput),
          roomNumber: sectionRoomInput.trim(),
          status: sectionStatusInput,
        });
        showSuccess(`Section "${sectionNameInput}" updated successfully.`);
      } else {
        await adminApi.createSection(activeClassForSections.id, {
          name: sectionNameInput.trim().toUpperCase(),
          capacity: Number(sectionCapacityInput),
          roomNumber: sectionRoomInput.trim(),
        });
        showSuccess(`Section "${sectionNameInput}" added to ${activeClassForSections.name}.`);
      }
      setShowSectionModal(false);
      await fetchData();
    } catch (err: any) {
      setSectionFormError(
        err.response?.data?.message || 'Failed to save section. Please verify capacity and section name.'
      );
    } finally {
      setIsSubmittingSection(false);
    }
  };

  // Toggle Section Status (Active / Inactive)
  const handleToggleSectionStatus = (sec: SectionDetail) => {
    if (!activeClassForSections) return;
    const nextStatus: SectionStatus = sec.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    setConfirmationModal({
      title: `${nextStatus === 'ACTIVE' ? 'Activate' : 'Deactivate'} Section "${sec.name}"?`,
      description:
        nextStatus === 'INACTIVE'
          ? `Deactivating Section ${sec.name} will remove it from active capacity totals. Currently enrolled students will not be removed.`
          : `Activating Section ${sec.name} will restore its intake capacity.`,
      actionLabel: nextStatus === 'ACTIVE' ? 'Confirm Activation' : 'Confirm Deactivation',
      isDestructive: nextStatus === 'INACTIVE',
      onConfirm: async () => {
        await adminApi.changeSectionStatus(activeClassForSections.id, sec.id, nextStatus);
        showSuccess(`Section "${sec.name}" status changed to ${nextStatus}.`);
        await fetchData();
      },
    });
  };

  // Delete Section
  const handleDeleteSection = (sec: SectionDetail) => {
    if (!activeClassForSections) return;

    setConfirmationModal({
      title: `Delete Section "${sec.name}"?`,
      description: `Are you sure you want to delete Section ${sec.name} from ${activeClassForSections.name}? This action cannot be undone. If enrolled students exist, deletion will be safely rejected.`,
      actionLabel: 'Confirm Delete',
      isDestructive: true,
      onConfirm: async () => {
        await adminApi.deleteSection(activeClassForSections.id, sec.id);
        showSuccess(`Section "${sec.name}" was removed.`);
        await fetchData();
      },
    });
  };

  return (
    <AdminLayout>
      <div className="admin-admissions-container">
        {/* Success Toast */}
        {successToast && (
          <div className="admin-feedback-toast admin-toast-success">
            <CheckCircle2 size={18} />
            <span>{successToast}</span>
          </div>
        )}

        {/* Error Toast */}
        {toastError && (
          <div className="admin-feedback-toast admin-toast-error" style={{ borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', color: '#B91C1C' }}>
            <AlertCircle size={18} />
            <span>{toastError}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="admin-classes-header-wrap">
          <div className="admin-classes-title-group">
            <h1>Classes & Sections</h1>
            <p>Manage academic classes, sections, and student capacity.</p>
          </div>
          <button
            type="button"
            className="admin-btn-primary-action"
            onClick={handleOpenAddClass}
          >
            <Plus size={16} />
            <span>Add Class</span>
          </button>
        </div>

        {/* Summary Statistics Cards */}
        <div className="admin-classes-summary-grid">
          <div className="admin-classes-card-stat">
            <div>
              <div className="admin-card-stat-label">Total Classes</div>
              <div className="admin-card-stat-value">{summaryStats.totalClasses}</div>
            </div>
            <div className="admin-card-stat-icon-wrap admin-stat-icon-blue">
              <Layers size={22} />
            </div>
          </div>

          <div className="admin-classes-card-stat">
            <div>
              <div className="admin-card-stat-label">Total Sections</div>
              <div className="admin-card-stat-value">{summaryStats.totalSections}</div>
            </div>
            <div className="admin-card-stat-icon-wrap admin-stat-icon-purple">
              <DoorOpen size={22} />
            </div>
          </div>

          <div className="admin-classes-card-stat">
            <div>
              <div className="admin-card-stat-label">Total Enrolled</div>
              <div className="admin-card-stat-value">{summaryStats.totalEnrolledStudents}</div>
            </div>
            <div className="admin-card-stat-icon-wrap admin-stat-icon-sage">
              <Users size={22} />
            </div>
          </div>

          <div className="admin-classes-card-stat">
            <div>
              <div className="admin-card-stat-label">Available Seats</div>
              <div className="admin-card-stat-value">{summaryStats.totalAvailableSeats}</div>
            </div>
            <div className="admin-card-stat-icon-wrap admin-stat-icon-amber">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Academic Year Filter, Status Filter */}
        <div className="admin-classes-toolbar">
          <form className="admin-classes-search-wrap" onSubmit={handleSearchSubmit}>
            <Search size={16} className="admin-classes-search-icon" />
            <input
              type="text"
              placeholder="Search classes or grades..."
              className="admin-classes-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={() => fetchData()}
            />
          </form>

          <div className="admin-classes-filter-controls">
            <select
              className="admin-classes-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              aria-label="Filter by Academic Year"
            >
              <option value="ALL">All Academic Years</option>
              {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            <select
              className="admin-classes-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by Status"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            <button
              type="button"
              className="admin-btn-secondary"
              onClick={fetchData}
              title="Refresh list"
            >
              <RotateCw size={14} />
            </button>
          </div>
        </div>

        {/* Content Body: Loading, Error, Empty, or Table */}
        <div className="admin-admissions-content-card" style={{ borderTop: 'none', borderRadius: '0 0 10px 10px' }}>
          {loading ? (
            <div className="admin-admissions-loading-state">
              <div className="admin-admissions-spinner" />
              <span>Loading classes and sections...</span>
            </div>
          ) : error ? (
            <div className="admin-admissions-error-state">
              <AlertCircle size={32} className="admin-error-icon" />
              <div className="admin-error-text-wrap">
                <h4>Unable to Load Classes</h4>
                <p>{error}</p>
              </div>
              <button type="button" className="admin-btn-retry" onClick={fetchData}>
                <RotateCw size={15} />
                <span>Retry</span>
              </button>
            </div>
          ) : classes.length === 0 ? (
            <div className="admin-admissions-empty-state">
              <Layers size={40} className="admin-empty-icon" />
              <h3>No classes found</h3>
              <p>
                {searchTerm || selectedYear !== 'ALL' || selectedStatus !== 'ALL'
                  ? 'No classes match your current search or filters. Try adjusting your search query.'
                  : 'Start by configuring your first academic class and division sections.'}
              </p>
              <button
                type="button"
                className="admin-btn-primary-action"
                style={{ marginTop: 14 }}
                onClick={handleOpenAddClass}
              >
                <Plus size={16} />
                <span>Create First Class</span>
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Classes Table */}
              <div className="admin-admissions-table-wrap-desktop">
                <table className="admin-admissions-table">
                  <thead>
                    <tr>
                      <th>Class / Grade</th>
                      <th>Academic Year</th>
                      <th>Sections</th>
                      <th>Enrollment & Capacity</th>
                      <th>Available Seats</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((c) => {
                      const fillPercent =
                        c.totalCapacity > 0
                          ? Math.min(100, Math.round((c.totalEnrolled / c.totalCapacity) * 100))
                          : 0;

                      return (
                        <tr key={c.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--admin-primary)', fontSize: '0.92rem' }}>
                              {c.name}
                            </div>
                            {c.description && (
                              <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                                {c.description}
                              </div>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{c.academicYear}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                              {c.sections.length === 0 ? (
                                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>
                                  No sections yet
                                </span>
                              ) : (
                                c.sections.map((sec) => (
                                  <span key={sec.id} className="admin-section-pill">
                                    <span>Sec {sec.name}</span>
                                    <span className="admin-section-pill-tag">({sec.capacity})</span>
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="admin-capacity-meter-wrap">
                              <div className="admin-capacity-meter-bar">
                                <div
                                  className="admin-capacity-meter-fill"
                                  style={{
                                    width: `${fillPercent}%`,
                                    backgroundColor:
                                      fillPercent >= 100 ? '#DC2626' : fillPercent >= 80 ? '#D97706' : '#16A34A',
                                  }}
                                />
                              </div>
                              <div className="admin-capacity-meter-text">
                                <span>{c.totalEnrolled} enrolled</span>
                                <span>{c.totalCapacity} max</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                fontWeight: 700,
                                color: c.availableSeats > 0 ? '#16A34A' : '#DC2626',
                              }}
                            >
                              {c.availableSeats}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`admin-badge-status ${
                                c.status === 'ACTIVE'
                                  ? 'admin-badge-status-active'
                                  : 'admin-badge-status-inactive'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                              <button
                                type="button"
                                className="admin-btn-action"
                                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                onClick={() => setActiveClassForSections(c)}
                                title="View and manage sections"
                              >
                                <span>Sections ({c.sectionsCount})</span>
                                <ArrowRight size={13} />
                              </button>
                              <button
                                type="button"
                                className="admin-btn-action-icon"
                                onClick={() => handleOpenEditClass(c)}
                                title="Edit Class"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                className="admin-btn-action-icon"
                                onClick={() => handleToggleClassStatus(c)}
                                title={c.status === 'ACTIVE' ? 'Deactivate Class' : 'Activate Class'}
                              >
                                <Power size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="admin-admissions-cards-mobile">
                {classes.map((c) => (
                  <div key={c.id} className="admin-admission-card-mobile">
                    <div className="admin-card-mobile-header">
                      <div>
                        <div className="admin-card-mobile-name">{c.name}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                          Academic Year: {c.academicYear}
                        </div>
                      </div>
                      <span
                        className={`admin-badge-status ${
                          c.status === 'ACTIVE'
                            ? 'admin-badge-status-active'
                            : 'admin-badge-status-inactive'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                      <div>Sections: {c.sectionsCount} ({c.sections.map((s) => s.name).join(', ') || 'None'})</div>
                      <div>Enrolled: {c.totalEnrolled} / {c.totalCapacity} ({c.availableSeats} seats available)</div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        type="button"
                        className="admin-btn-action"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => setActiveClassForSections(c)}
                      >
                        <span>Manage Sections</span>
                      </button>
                      <button
                        type="button"
                        className="admin-btn-action-icon"
                        onClick={() => handleOpenEditClass(c)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="admin-btn-action-icon"
                        onClick={() => handleToggleClassStatus(c)}
                      >
                        <Power size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ============================================================== */}
        {/* ADD / EDIT CLASS MODAL                                         */}
        {/* ============================================================== */}
        {showClassModal && (
          <div className="admin-modal-overlay" onClick={() => !isSubmittingClass && setShowClassModal(false)}>
            <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
              <div className="admin-modal-header">
                <h3>{editingClass ? `Edit Class: ${editingClass.name}` : 'Add New Class'}</h3>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => setShowClassModal(false)}
                  disabled={isSubmittingClass}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitClass}>
                <div className="admin-modal-body">
                  {classFormError && (
                    <div className="admin-modal-error-banner">
                      <AlertCircle size={16} />
                      <span>{classFormError}</span>
                    </div>
                  )}

                  <div style={{ marginBottom: 14 }}>
                    <label className="admin-form-label">Class Name / Grade *</label>
                    <input
                      type="text"
                      list="grade-suggestions"
                      className="admin-form-input"
                      value={classNameInput}
                      onChange={(e) => setClassNameInput(e.target.value)}
                      placeholder="e.g. Grade 8, UKG, Pre-KG"
                      required
                    />
                    <datalist id="grade-suggestions">
                      {PRESET_GRADES.map((g) => (
                        <option key={g} value={g} />
                      ))}
                    </datalist>
                    <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>
                      Select from standard school grades or type a custom grade name.
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label className="admin-form-label">Academic Year *</label>
                    <select
                      className="admin-form-select"
                      value={classYearInput}
                      onChange={(e) => setClassYearInput(e.target.value)}
                      required
                    >
                      {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label className="admin-form-label">Description (Optional)</label>
                    <textarea
                      className="admin-form-textarea"
                      rows={2}
                      value={classDescInput}
                      onChange={(e) => setClassDescInput(e.target.value)}
                      placeholder="Optional notes or division curriculum details..."
                    />
                  </div>

                  {editingClass && (
                    <div style={{ marginBottom: 14 }}>
                      <label className="admin-form-label">Status</label>
                      <select
                        className="admin-form-select"
                        value={classStatusInput}
                        onChange={(e) => setClassStatusInput(e.target.value as ClassStatus)}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => setShowClassModal(false)}
                    disabled={isSubmittingClass}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-btn-primary-action"
                    disabled={isSubmittingClass}
                  >
                    {isSubmittingClass ? (
                      <>
                        <div className="admin-btn-spinner" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingClass ? 'Update Class' : 'Create Class'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTIONS MANAGEMENT MODAL (DRILL-DOWN)                          */}
        {/* ============================================================== */}
        {activeClassForSections && (
          <div
            className="admin-modal-overlay"
            onClick={() => setActiveClassForSections(null)}
          >
            <div
              className="admin-modal-card"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: 720, width: '92%' }}
            >
              <div className="admin-modal-header">
                <div>
                  <h3 style={{ margin: 0 }}>
                    {activeClassForSections.name} — Sections
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginTop: 2 }}>
                    Academic Year: {activeClassForSections.academicYear} • Total Enrolled: {activeClassForSections.totalEnrolled} / {activeClassForSections.totalCapacity} ({activeClassForSections.availableSeats} available)
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => setActiveClassForSections(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="admin-modal-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--admin-primary)' }}>
                    Configured Division Sections ({activeClassForSections.sections.length})
                  </div>
                  <button
                    type="button"
                    className="admin-btn-primary-action"
                    style={{ padding: '7px 14px', fontSize: '0.8rem' }}
                    onClick={handleOpenAddSection}
                  >
                    <Plus size={14} />
                    <span>Add Section</span>
                  </button>
                </div>

                {activeClassForSections.sections.length === 0 ? (
                  <div className="admin-admissions-empty-state" style={{ padding: 24 }}>
                    <DoorOpen size={36} className="admin-empty-icon" />
                    <h4>No sections created yet</h4>
                    <p style={{ fontSize: '0.8rem' }}>
                      Add sections (e.g. Section A, Section B) to allocate student capacities for this grade.
                    </p>
                    <button
                      type="button"
                      className="admin-btn-primary-action"
                      style={{ marginTop: 10, padding: '7px 14px', fontSize: '0.8rem' }}
                      onClick={handleOpenAddSection}
                    >
                      <Plus size={14} />
                      <span>Add First Section</span>
                    </button>
                  </div>
                ) : (
                  <div className="admin-sections-list-wrap">
                    {activeClassForSections.sections.map((sec) => (
                      <div key={sec.id} className="admin-section-item-card">
                        <div className="admin-section-info-group">
                          <div className="admin-section-avatar">
                            {sec.name}
                          </div>
                          <div className="admin-section-details">
                            <div className="admin-section-title-line">
                              <span className="admin-section-name">Section {sec.name}</span>
                              <span
                                className={`admin-badge-status ${
                                  sec.status === 'ACTIVE'
                                    ? 'admin-badge-status-active'
                                    : 'admin-badge-status-inactive'
                                }`}
                              >
                                {sec.status}
                              </span>
                            </div>
                            <div className="admin-section-meta-text">
                              <span>Max Capacity: <strong>{sec.capacity}</strong> students</span>
                              <span> • Currently Enrolled: <strong>{sec.enrolledCount}</strong></span>
                              <span> • Available: <strong style={{ color: sec.availableSeats > 0 ? '#16A34A' : '#DC2626' }}>{sec.availableSeats}</strong> seats</span>
                              {sec.roomNumber && <span> • Classroom: {sec.roomNumber}</span>}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="admin-btn-action-icon"
                            onClick={() => handleOpenEditSection(sec)}
                            title="Edit Section Capacity or Room"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="admin-btn-action-icon"
                            onClick={() => handleToggleSectionStatus(sec)}
                            title={sec.status === 'ACTIVE' ? 'Deactivate Section' : 'Activate Section'}
                          >
                            <Power size={14} />
                          </button>
                          <button
                            type="button"
                            className="admin-btn-action-icon admin-btn-action-danger"
                            onClick={() => handleDeleteSection(sec)}
                            title="Delete Section (only if unused)"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setActiveClassForSections(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ADD / EDIT SECTION MODAL                                       */}
        {/* ============================================================== */}
        {showSectionModal && activeClassForSections && (
          <div
            className="admin-modal-overlay"
            style={{ zIndex: 1200 }}
            onClick={() => !isSubmittingSection && setShowSectionModal(false)}
          >
            <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
              <div className="admin-modal-header">
                <h3>{editingSection ? `Edit Section: ${editingSection.name}` : `Add Section to ${activeClassForSections.name}`}</h3>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => setShowSectionModal(false)}
                  disabled={isSubmittingSection}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitSection}>
                <div className="admin-modal-body">
                  {sectionFormError && (
                    <div className="admin-modal-error-banner">
                      <AlertCircle size={16} />
                      <span>{sectionFormError}</span>
                    </div>
                  )}

                  <div className="admin-form-row-2" style={{ marginBottom: 14 }}>
                    <div>
                      <label className="admin-form-label">Section Identifier *</label>
                      <input
                        type="text"
                        className="admin-form-input"
                        value={sectionNameInput}
                        onChange={(e) => setSectionNameInput(e.target.value.toUpperCase())}
                        placeholder="e.g. A, B, C"
                        maxLength={5}
                        required
                      />
                    </div>

                    <div>
                      <label className="admin-form-label">Max Student Capacity *</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="admin-form-input"
                        value={sectionCapacityInput}
                        onChange={(e) => setSectionCapacityInput(parseInt(e.target.value, 10) || 0)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label className="admin-form-label">Classroom / Room Number (Optional)</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={sectionRoomInput}
                      onChange={(e) => setSectionRoomInput(e.target.value)}
                      placeholder="e.g. Room 204, Science Wing Block B"
                    />
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', marginBottom: 14 }}>
                    Academic Year: <strong>{activeClassForSections.academicYear}</strong> (Inherited from parent class)
                  </div>

                  {editingSection && (
                    <div style={{ marginBottom: 14 }}>
                      <label className="admin-form-label">Section Status</label>
                      <select
                        className="admin-form-select"
                        value={sectionStatusInput}
                        onChange={(e) => setSectionStatusInput(e.target.value as SectionStatus)}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => setShowSectionModal(false)}
                    disabled={isSubmittingSection}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-btn-primary-action"
                    disabled={isSubmittingSection}
                  >
                    {isSubmittingSection ? (
                      <>
                        <div className="admin-btn-spinner" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingSection ? 'Update Section' : 'Add Section'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* CONFIRMATION MODAL (DEACTIVATION / CONSEQUENTIAL ACTIONS)     */}
        {/* ============================================================== */}
        {confirmationModal && (
          <div className="admin-modal-overlay" style={{ zIndex: 1300 }}>
            <div className="admin-modal-card" style={{ maxWidth: 460 }}>
              <div className="admin-modal-header">
                <h3>{confirmationModal.title}</h3>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => !isConfirming && setConfirmationModal(null)}
                  disabled={isConfirming}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="admin-modal-body">
                <p style={{ fontSize: '0.88rem', color: 'var(--admin-text-main)', lineHeight: 1.5, margin: 0 }}>
                  {confirmationModal.description}
                </p>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setConfirmationModal(null)}
                  disabled={isConfirming}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={confirmationModal.isDestructive ? 'admin-btn-reject' : 'admin-btn-approve'}
                  disabled={isConfirming}
                  onClick={async () => {
                    setIsConfirming(true);
                    try {
                      await confirmationModal.onConfirm();
                      setConfirmationModal(null);
                    } catch (err: any) {
                      showError(err.response?.data?.message || 'Operation failed.');
                      setConfirmationModal(null);
                    } finally {
                      setIsConfirming(false);
                    }
                  }}
                >
                  {isConfirming ? (
                    <>
                      <div className="admin-btn-spinner" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{confirmationModal.actionLabel}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
