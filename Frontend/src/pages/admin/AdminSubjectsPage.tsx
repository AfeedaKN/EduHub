import React, { useEffect, useState, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Eye,
  Edit2,
  Trash2,
  Power,
  GraduationCap,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  School,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/adminApi';
import {
  SubjectItem,
  SubjectSummaryStats,
  SubjectCategory,
  SubjectStatus,
  ApplicableClassItem,
  ClassDetail,
  SubjectReferencesInfo,
} from '../../types/admin.types';

const CATEGORY_OPTIONS: { value: SubjectCategory; label: string; badgeClass: string }[] = [
  { value: 'CORE', label: 'Core', badgeClass: 'subject-cat-core' },
  { value: 'SCIENCE', label: 'Science', badgeClass: 'subject-cat-science' },
  { value: 'LANGUAGE', label: 'Language', badgeClass: 'subject-cat-language' },
  { value: 'ELECTIVE', label: 'Elective', badgeClass: 'subject-cat-elective' },
  { value: 'HUMANITIES', label: 'Humanities', badgeClass: 'subject-cat-humanities' },
  { value: 'COMMERCE', label: 'Commerce', badgeClass: 'subject-cat-commerce' },
  { value: 'ARTS', label: 'Arts', badgeClass: 'subject-cat-arts' },
  { value: 'VOCATIONAL', label: 'Vocational', badgeClass: 'subject-cat-vocational' },
  { value: 'PHYSICAL_EDUCATION', label: 'Physical Education', badgeClass: 'subject-cat-pe' },
  { value: 'OTHER', label: 'Other', badgeClass: 'subject-cat-other' },
];

const ACADEMIC_YEAR_OPTIONS = ['2026-2027', '2025-2026', '2027-2028'];

export const AdminSubjectsPage: React.FC = () => {
  // Data states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [totalSubjects, setTotalSubjects] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit] = useState<number>(10);

  // Available classes for associations
  const [availableClasses, setAvailableClasses] = useState<ClassDetail[]>([]);

  // Summary stats
  const [summary, setSummary] = useState<SubjectSummaryStats>({
    totalSubjects: 0,
    activeSubjects: 0,
    assignedSubjects: 0,
    unassignedSubjects: 0,
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  // Add / Edit Modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formCode, setFormCode] = useState<string>('');
  const [formCategory, setFormCategory] = useState<SubjectCategory>('CORE');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formSelectedClasses, setFormSelectedClasses] = useState<ApplicableClassItem[]>([]);
  const [formAcademicYear, setFormAcademicYear] = useState<string>('2026-2027');
  const [formStatus, setFormStatus] = useState<SubjectStatus>('ACTIVE');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // View Details Drawer / Modal state
  const [viewingSubject, setViewingSubject] = useState<SubjectItem | null>(null);
  const [viewingReferences, setViewingReferences] = useState<SubjectReferencesInfo | null>(null);
  const [loadingReferences, setLoadingReferences] = useState<boolean>(false);

  // Status / Delete Action Confirmation Modal
  const [confirmDialog, setConfirmDialog] = useState<{
    subject: SubjectItem;
    action: 'ACTIVATE' | 'DEACTIVATE' | 'DELETE';
    references: SubjectReferencesInfo | null;
  } | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  const showSuccess = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const showErrorToast = (msg: string) => {
    setToastError(msg);
    setTimeout(() => setToastError(null), 5000);
  };

  // Load classes for dropdown / associations
  const fetchClasses = async () => {
    try {
      const res = await adminApi.getClasses();
      if (res.success && res.data) {
        setAvailableClasses(res.data);
      }
    } catch (err) {
      console.error('Failed to load classes list for subjects:', err);
    }
  };

  // Load summary statistics
  const fetchSummary = useCallback(async () => {
    try {
      const res = await adminApi.getSubjectSummaryStats(selectedYear !== 'ALL' ? selectedYear : undefined);
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error('Failed to load subject summary stats:', err);
    }
  }, [selectedYear]);

  // Load subjects list
  const fetchSubjects = useCallback(
    async (targetPage = 1) => {
      try {
        setLoading(true);
        setError(null);

        const params: any = {
          page: targetPage,
          limit,
        };

        if (searchTerm.trim()) params.search = searchTerm.trim();
        if (selectedCategory !== 'ALL') params.category = selectedCategory;
        if (selectedClass !== 'ALL') params.className = selectedClass;
        if (selectedYear !== 'ALL') params.academicYear = selectedYear;
        if (selectedStatus !== 'ALL') params.status = selectedStatus;

        const res = await adminApi.getSubjects(params);
        if (res.success && res.data) {
          setSubjects(res.data.subjects);
          setTotalSubjects(res.data.total);
          setPage(res.data.page);
          setTotalPages(res.data.totalPages);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load subjects. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, selectedCategory, selectedClass, selectedYear, selectedStatus, limit]
  );

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchSubjects(1);
  }, [fetchSubjects]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSelectedClass('ALL');
    setSelectedYear('ALL');
    setSelectedStatus('ALL');
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingSubject(null);
    setFormName('');
    setFormCode('');
    setFormCategory('CORE');
    setFormDescription('');
    setFormSelectedClasses([]);
    setFormAcademicYear('2026-2027');
    setFormStatus('ACTIVE');
    setFormError(null);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (subject: SubjectItem) => {
    setEditingSubject(subject);
    setFormName(subject.name);
    setFormCode(subject.code);
    setFormCategory(subject.category);
    setFormDescription(subject.description || '');
    setFormSelectedClasses(subject.applicableClasses || []);
    setFormAcademicYear(subject.academicYear || '2026-2027');
    setFormStatus(subject.status);
    setFormError(null);
    setShowModal(true);
  };

  // Toggle class selection in form
  const handleToggleClassSelection = (cls: ClassDetail) => {
    const isSelected = formSelectedClasses.some((c) => c.className === cls.name);
    if (isSelected) {
      setFormSelectedClasses(formSelectedClasses.filter((c) => c.className !== cls.name));
    } else {
      setFormSelectedClasses([
        ...formSelectedClasses,
        { classId: cls.id, className: cls.name },
      ]);
    }
  };

  // Submit Add / Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      setFormError('Subject name is required.');
      return;
    }

    if (!formCode.trim()) {
      setFormError('Subject code is required (e.g. ENG-101).');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      name: formName.trim(),
      code: formCode.trim().toUpperCase(),
      category: formCategory,
      description: formDescription.trim(),
      applicableClasses: formSelectedClasses,
      academicYear: formAcademicYear,
      status: formStatus,
    };

    try {
      if (editingSubject) {
        await adminApi.updateSubject(editingSubject.id, payload);
        showSuccess(`Subject "${formName.trim()}" (${formCode.trim().toUpperCase()}) updated successfully.`);
      } else {
        await adminApi.createSubject(payload);
        showSuccess(`Subject "${formName.trim()}" (${formCode.trim().toUpperCase()}) created successfully.`);
      }

      setShowModal(false);
      fetchSummary();
      fetchSubjects(page);
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to save subject. Please check inputs and try again.';
      setFormError(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open View Details Drawer
  const handleOpenViewDetails = async (subject: SubjectItem) => {
    setViewingSubject(subject);
    setViewingReferences(null);
    setLoadingReferences(true);

    try {
      const [detailRes, refRes] = await Promise.all([
        adminApi.getSubjectById(subject.id),
        adminApi.getSubjectReferences(subject.id),
      ]);

      if (detailRes.success && detailRes.data) {
        setViewingSubject(detailRes.data);
      }
      if (refRes.success && refRes.data) {
        setViewingReferences(refRes.data);
      }
    } catch (err) {
      console.error('Failed to load complete subject details:', err);
    } finally {
      setLoadingReferences(false);
    }
  };

  // Prompt Status Change or Delete
  const handlePromptAction = async (subject: SubjectItem, action: 'ACTIVATE' | 'DEACTIVATE' | 'DELETE') => {
    try {
      const refRes = await adminApi.getSubjectReferences(subject.id);
      setConfirmDialog({
        subject,
        action,
        references: refRes.success && refRes.data ? refRes.data : null,
      });
    } catch (err) {
      setConfirmDialog({
        subject,
        action,
        references: null,
      });
    }
  };

  // Execute Confirmed Action
  const handleExecuteAction = async () => {
    if (!confirmDialog) return;

    const { subject, action, references } = confirmDialog;
    setIsProcessingAction(true);

    try {
      if (action === 'DELETE') {
        if (references && references.totalReferences > 0) {
          showErrorToast(
            `Cannot delete "${subject.name}" because it is currently referenced in ${references.totalReferences} records. Please deactivate the subject instead.`
          );
          setConfirmDialog(null);
          return;
        }

        await adminApi.deleteSubject(subject.id);
        showSuccess(`Subject "${subject.name}" was successfully deleted.`);
      } else {
        const nextStatus: SubjectStatus = action === 'ACTIVATE' ? 'ACTIVE' : 'INACTIVE';
        await adminApi.updateSubjectStatus(subject.id, nextStatus);
        showSuccess(`Subject "${subject.name}" status changed to ${nextStatus}.`);
      }

      setConfirmDialog(null);
      fetchSummary();
      fetchSubjects(page);
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Operation failed. Please try again.';
      showErrorToast(msg);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Helper for category badge class
  const getCategoryClass = (category: SubjectCategory) => {
    const found = CATEGORY_OPTIONS.find((c) => c.value === category);
    return found ? found.badgeClass : 'subject-cat-other';
  };

  const getCategoryLabel = (category: SubjectCategory) => {
    const found = CATEGORY_OPTIONS.find((c) => c.value === category);
    return found ? found.label : category;
  };

  return (
    <AdminLayout breadcrumbTitle="Academics / Subjects">
      <div className="admin-admissions-container">
        {/* Success Toast */}
        {toastMessage && (
          <div className="admin-feedback-toast admin-toast-success">
            <CheckCircle2 size={18} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Error Toast */}
        {toastError && (
          <div
            className="admin-feedback-toast admin-toast-error"
            style={{ borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', color: '#B91C1C' }}
          >
            <AlertCircle size={18} />
            <span>{toastError}</span>
          </div>
        )}

        {/* 1. Page Header */}
        <div className="admin-classes-header-wrap" style={{ marginBottom: 20 }}>
          <div className="admin-classes-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0 }}>Subjects Management</h1>
              <span
                style={{
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  border: '1px solid #BFDBFE',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {summary.totalSubjects} Catalogued
              </span>
            </div>
            <p style={{ marginTop: 4 }}>
              Manage the school's curriculum, subject assignments, and academic offerings.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => {
                fetchSummary();
                fetchSubjects(page);
              }}
              title="Refresh Directory"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              className="admin-btn-primary-action"
              onClick={handleOpenCreateModal}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={16} />
              <span>Add Subject</span>
            </button>
          </div>
        </div>

        {/* 2. Summary Statistics Cards */}
        <div className="admin-classes-summary-grid">
          {/* Card 1: Total Subjects */}
          <div className="admin-classes-card-stat">
            <div>
              <div className="admin-card-stat-label">Total Subjects</div>
              <div className="admin-card-stat-value">{summary.totalSubjects}</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>
                All registered subjects
              </div>
            </div>
            <div className="admin-card-stat-icon-wrap admin-stat-icon-blue">
              <BookOpen size={22} />
            </div>
          </div>

          {/* Card 2: Active Subjects */}
          <div className="admin-classes-card-stat">
            <div>
              <div className="admin-card-stat-label">Active Subjects</div>
              <div className="admin-card-stat-value" style={{ color: '#047857' }}>
                {summary.activeSubjects}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>
                Curriculum operational
              </div>
            </div>
            <div className="admin-card-stat-icon-wrap admin-stat-icon-emerald">
              <CheckCircle2 size={22} />
            </div>
          </div>

          {/* Card 3: Assigned Subjects */}
          <div className="admin-classes-card-stat">
            <div>
              <div className="admin-card-stat-label">Assigned Subjects</div>
              <div className="admin-card-stat-value" style={{ color: '#6366F1' }}>
                {summary.assignedSubjects}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>
                Classes / teachers assigned
              </div>
            </div>
            <div className="admin-card-stat-icon-wrap admin-stat-icon-purple">
              <GraduationCap size={22} />
            </div>
          </div>

          {/* Card 4: Unassigned Subjects */}
          <div className="admin-classes-card-stat">
            <div>
              <div className="admin-card-stat-label">Unassigned Subjects</div>
              <div className="admin-card-stat-value" style={{ color: summary.unassignedSubjects > 0 ? '#D97706' : '#64748B' }}>
                {summary.unassignedSubjects}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>
                Need class allocation
              </div>
            </div>
            <div className="admin-card-stat-icon-wrap" style={{ backgroundColor: '#FFFBEB', color: '#D97706' }}>
              <AlertCircle size={22} />
            </div>
          </div>
        </div>

        {/* 3. Search and Filters Toolbar */}
        <div className="admin-classes-filter-bar" style={{ marginTop: 24, marginBottom: 16 }}>
          {/* Search Box */}
          <div className="admin-classes-search-wrap" style={{ minWidth: 260, flex: 2 }}>
            <Search size={16} className="admin-classes-search-icon" />
            <input
              type="text"
              placeholder="Search by subject name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-classes-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="admin-search-clear-btn"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div style={{ minWidth: 150 }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="admin-classes-select"
            >
              <option value="ALL">All Categories</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div style={{ minWidth: 140 }}>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="admin-classes-select"
            >
              <option value="ALL">All Classes</option>
              {availableClasses.map((cls) => (
                <option key={cls.id} value={cls.name}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year Filter */}
          <div style={{ minWidth: 130 }}>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="admin-classes-select"
            >
              <option value="ALL">All Years</option>
              {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: 120 }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="admin-classes-select"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(searchTerm ||
            selectedCategory !== 'ALL' ||
            selectedClass !== 'ALL' ||
            selectedYear !== 'ALL' ||
            selectedStatus !== 'ALL') && (
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={handleResetFilters}
              style={{ padding: '8px 12px', fontSize: '0.82rem' }}
              title="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>

        {/* 4. Subject Directory Table / Skeletons / Empty State */}
        {loading ? (
          <div className="admin-admissions-table-card">
            <div style={{ padding: 40, textAlign: 'center' }}>
              <RotateCw size={28} className="animate-spin" style={{ color: 'var(--admin-muted-blue)', margin: '0 auto 12px' }} />
              <div style={{ fontSize: '0.92rem', color: 'var(--admin-text-muted)' }}>Loading subjects directory...</div>
            </div>
          </div>
        ) : error ? (
          <div className="admin-admissions-table-card">
            <div style={{ padding: 40, textAlign: 'center', color: '#DC2626' }}>
              <AlertCircle size={36} style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 6 }}>Failed to load subjects</div>
              <div style={{ fontSize: '0.86rem', color: 'var(--admin-text-muted)', marginBottom: 16 }}>{error}</div>
              <button
                type="button"
                className="admin-btn-primary-action"
                onClick={() => fetchSubjects(page)}
              >
                Retry
              </button>
            </div>
          </div>
        ) : subjects.length === 0 ? (
          <div className="admin-admissions-table-card">
            <div style={{ padding: 60, textAlign: 'center' }}>
              <BookOpen size={44} style={{ color: 'var(--admin-muted-blue)', margin: '0 auto 14px', opacity: 0.6 }} />
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--admin-primary)', marginBottom: 6 }}>
                No subjects found
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--admin-text-muted)', maxWidth: 420, margin: '0 auto 20px' }}>
                {searchTerm || selectedCategory !== 'ALL' || selectedClass !== 'ALL' || selectedStatus !== 'ALL'
                  ? 'No subjects match your active search and filter criteria. Try resetting your filters.'
                  : 'Your school curriculum directory has no subjects registered yet. Create your first subject to get started.'}
              </p>
              {searchTerm || selectedCategory !== 'ALL' || selectedClass !== 'ALL' || selectedStatus !== 'ALL' ? (
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={handleResetFilters}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <RotateCw size={14} />
                  <span>Reset Filters</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="admin-btn-primary-action"
                  onClick={handleOpenCreateModal}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Plus size={16} />
                  <span>Add First Subject</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="admin-admissions-table-card">
            <div className="admin-admissions-table-wrap-desktop">
              <table className="admin-admissions-table">
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Subject Name & Code</th>
                    <th style={{ width: '13%' }}>Category</th>
                    <th style={{ width: '24%' }}>Associated Classes</th>
                    <th style={{ width: '18%' }}>Assigned Teachers</th>
                    <th style={{ width: '9%' }}>Academic Year</th>
                    <th style={{ width: '7%' }}>Status</th>
                    <th style={{ width: '7%', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((sub) => {
                    const isSubjectActive = sub.status === 'ACTIVE';

                    return (
                      <tr key={sub.id} style={{ opacity: isSubjectActive ? 1 : 0.72 }}>
                        {/* Name & Code */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontWeight: 700, color: 'var(--admin-primary)', fontSize: '0.92rem' }}>
                              {sub.name}
                            </span>
                            <span className="subject-code-pill">{sub.code}</span>
                          </div>
                          {sub.description ? (
                            <div
                              style={{
                                fontSize: '0.74rem',
                                color: 'var(--admin-text-muted)',
                                maxWidth: 260,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={sub.description}
                            >
                              {sub.description}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontStyle: 'italic' }}>
                              No description
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td>
                          <span className={`subject-category-badge ${getCategoryClass(sub.category)}`}>
                            {getCategoryLabel(sub.category)}
                          </span>
                        </td>

                        {/* Associated Classes */}
                        <td>
                          {sub.applicableClasses && sub.applicableClasses.length > 0 ? (
                            <div className="subject-classes-wrap">
                              {sub.applicableClasses.slice(0, 3).map((ac, idx) => (
                                <span key={idx} className="subject-class-chip">
                                  {ac.className}
                                </span>
                              ))}
                              {sub.applicableClasses.length > 3 && (
                                <span
                                  className="subject-class-chip-more"
                                  title={sub.applicableClasses.slice(3).map((c) => c.className).join(', ')}
                                >
                                  +{sub.applicableClasses.length - 3} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.76rem', color: '#94A3B8', fontStyle: 'italic' }}>
                              All / Unallocated
                            </span>
                          )}
                        </td>

                        {/* Assigned Teachers */}
                        <td>
                          {sub.assignedTeachers && sub.assignedTeachers.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div className="subject-classes-wrap">
                                {sub.assignedTeachers.slice(0, 2).map((t, idx) => (
                                  <span key={idx} className="subject-teacher-chip" title={`${t.fullName} (${t.email}) - ${t.className} Sec ${t.section}`}>
                                    {t.fullName}
                                  </span>
                                ))}
                                {sub.assignedTeachers.length > 2 && (
                                  <span
                                    className="subject-class-chip-more"
                                    title={sub.assignedTeachers.slice(2).map((t) => `${t.fullName} (${t.department})`).join('\n')}
                                  >
                                    +{sub.assignedTeachers.length - 2} more
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.76rem', color: '#94A3B8', fontStyle: 'italic' }}>
                              No teachers assigned
                            </span>
                          )}
                        </td>

                        {/* Academic Year */}
                        <td>
                          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#475569' }}>
                            {sub.academicYear || '2026-2027'}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 999,
                              backgroundColor: isSubjectActive ? '#ECFDF5' : '#F1F5F9',
                              color: isSubjectActive ? '#047857' : '#64748B',
                              border: isSubjectActive ? '1px solid #A7F3D0' : '1px solid #CBD5E1',
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: isSubjectActive ? '#10B981' : '#94A3B8',
                              }}
                            />
                            {sub.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {/* View */}
                            <button
                              type="button"
                              className="admin-action-icon-btn"
                              onClick={() => handleOpenViewDetails(sub)}
                              title="View Subject Details"
                              aria-label="View Details"
                            >
                              <Eye size={15} />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              className="admin-action-icon-btn"
                              onClick={() => handleOpenEditModal(sub)}
                              title="Edit Subject"
                              aria-label="Edit Subject"
                            >
                              <Edit2 size={15} />
                            </button>

                            {/* Activate / Deactivate Toggle */}
                            <button
                              type="button"
                              className="admin-action-icon-btn"
                              onClick={() =>
                                handlePromptAction(
                                  sub,
                                  isSubjectActive ? 'DEACTIVATE' : 'ACTIVATE'
                                )
                              }
                              title={isSubjectActive ? 'Deactivate Subject' : 'Activate Subject'}
                              style={{ color: isSubjectActive ? '#F59E0B' : '#10B981' }}
                              aria-label={isSubjectActive ? 'Deactivate' : 'Activate'}
                            >
                              <Power size={15} />
                            </button>

                            {/* Delete Action */}
                            <button
                              type="button"
                              className="admin-action-icon-btn"
                              onClick={() => handlePromptAction(sub, 'DELETE')}
                              title="Delete Subject"
                              style={{ color: '#EF4444' }}
                              aria-label="Delete Subject"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderTop: '1px solid var(--admin-border-subtle)',
                  fontSize: '0.82rem',
                  color: 'var(--admin-text-muted)',
                }}
              >
                <div>
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalSubjects)} of {totalSubjects} subjects
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => fetchSubjects(page - 1)}
                    disabled={page <= 1}
                    style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>
                  <span style={{ fontWeight: 600, padding: '0 8px' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => fetchSubjects(page + 1)}
                    disabled={page >= totalPages}
                    style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            ADD / EDIT SUBJECT MODAL
            =================================================================== */}
        {showModal && (
          <div className="admin-modal-overlay" onClick={() => !isSubmitting && setShowModal(false)}>
            <div
              className="admin-modal-box"
              style={{ maxWidth: 620, width: '92%' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="admin-modal-header">
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--admin-primary)' }}>
                    {editingSubject ? `Edit Subject: ${editingSubject.name}` : 'Add New Subject'}
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', margin: '3px 0 0' }}>
                    {editingSubject
                      ? 'Update subject curriculum information and class allocations.'
                      : 'Register a new subject into the academic curriculum.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => !isSubmitting && setShowModal(false)}
                  disabled={isSubmitting}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmitForm}>
                <div className="admin-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '16px 24px' }}>
                  {/* Error Notification */}
                  {formError && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        borderRadius: 6,
                        padding: '10px 14px',
                        marginBottom: 16,
                        color: '#991B1B',
                        fontSize: '0.82rem',
                      }}
                    >
                      <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>{formError}</div>
                    </div>
                  )}

                  {/* Grid: Name & Code */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label className="admin-form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                        Subject Name <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mathematics, English Literature"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="admin-form-input"
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="admin-form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                        Subject Code <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. MATH-101"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                        className="admin-form-input"
                        required
                        disabled={isSubmitting}
                        style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 600 }}
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>
                        Unique catalog identifier
                      </span>
                    </div>
                  </div>

                  {/* Grid: Category & Academic Year */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label className="admin-form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                        Category <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as SubjectCategory)}
                        className="admin-form-input"
                        disabled={isSubmitting}
                      >
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="admin-form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                        Academic Year
                      </label>
                      <select
                        value={formAcademicYear}
                        onChange={(e) => setFormAcademicYear(e.target.value)}
                        className="admin-form-input"
                        disabled={isSubmitting}
                      >
                        {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ marginBottom: 16 }}>
                    <label className="admin-form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                      Description & Syllabus Focus
                    </label>
                    <textarea
                      placeholder="Outline topics covered, prerequisites, or core curriculum objectives..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="admin-form-input"
                      rows={2}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Applicable Classes Selection */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label className="admin-form-label" style={{ fontWeight: 600, fontSize: '0.82rem', margin: 0 }}>
                        Applicable Classes ({formSelectedClasses.length} selected)
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() =>
                            setFormSelectedClasses(
                              availableClasses.map((c) => ({ classId: c.id, className: c.name }))
                            )
                          }
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--admin-primary)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          Select All
                        </button>
                        <span style={{ color: '#CBD5E1' }}>|</span>
                        <button
                          type="button"
                          onClick={() => setFormSelectedClasses([])}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748B',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="subject-classes-selector">
                      {availableClasses.length === 0 ? (
                        <div style={{ fontSize: '0.78rem', color: '#64748B', padding: 8 }}>
                          No classes defined in system yet.
                        </div>
                      ) : (
                        availableClasses.map((cls) => {
                          const isSelected = formSelectedClasses.some((c) => c.className === cls.name);

                          return (
                            <label
                              key={cls.id}
                              className={`subject-class-checkbox-item ${isSelected ? 'selected' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleClassSelection(cls)}
                                disabled={isSubmitting}
                              />
                              <span>{cls.name}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', display: 'block', marginTop: 4 }}>
                      Select all grade levels where this subject is offered.
                    </span>
                  </div>

                  {/* Status */}
                  <div style={{ marginBottom: 8 }}>
                    <label className="admin-form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                      Subject Status
                    </label>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="subjectStatus"
                          value="ACTIVE"
                          checked={formStatus === 'ACTIVE'}
                          onChange={() => setFormStatus('ACTIVE')}
                          disabled={isSubmitting}
                        />
                        <span style={{ fontWeight: formStatus === 'ACTIVE' ? 600 : 400 }}>Active</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="subjectStatus"
                          value="INACTIVE"
                          checked={formStatus === 'INACTIVE'}
                          onChange={() => setFormStatus('INACTIVE')}
                          disabled={isSubmitting}
                        />
                        <span style={{ fontWeight: formStatus === 'INACTIVE' ? 600 : 400 }}>Inactive</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-btn-primary-action"
                    disabled={isSubmitting}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    {isSubmitting ? (
                      <>
                        <RotateCw size={14} className="animate-spin" />
                        <span>Saving Subject...</span>
                      </>
                    ) : (
                      <span>{editingSubject ? 'Update Subject' : 'Save Subject'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===================================================================
            VIEW SUBJECT DETAILS MODAL
            =================================================================== */}
        {viewingSubject && (
          <div className="admin-modal-overlay" onClick={() => setViewingSubject(null)}>
            <div
              className="admin-modal-box"
              style={{ maxWidth: 680, width: '92%' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="admin-modal-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--admin-primary)' }}>
                      {viewingSubject.name}
                    </h2>
                    <span className="subject-code-pill">{viewingSubject.code}</span>
                    <span className={`subject-category-badge ${getCategoryClass(viewingSubject.category)}`}>
                      {getCategoryLabel(viewingSubject.category)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                    <span>Academic Year: <strong>{viewingSubject.academicYear || '2026-2027'}</strong></span>
                    <span>•</span>
                    <span style={{ color: viewingSubject.status === 'ACTIVE' ? '#047857' : '#64748B', fontWeight: 600 }}>
                      Status: {viewingSubject.status}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => setViewingSubject(null)}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="admin-modal-body" style={{ maxHeight: '74vh', overflowY: 'auto', padding: '20px 24px' }}>
                {/* Description */}
                {viewingSubject.description && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-muted)', marginBottom: 6 }}>
                      Description & Scope
                    </div>
                    <div style={{ backgroundColor: '#FAF9F5', padding: '10px 14px', borderRadius: 6, fontSize: '0.86rem', color: '#334155', border: '1px solid var(--admin-border-subtle)' }}>
                      {viewingSubject.description}
                    </div>
                  </div>
                )}

                {/* System References Usage Breakdown */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-muted)', marginBottom: 8 }}>
                    Academic & Curriculum References
                  </div>
                  {loadingReferences ? (
                    <div style={{ padding: 14, textAlign: 'center', color: '#64748B', fontSize: '0.82rem' }}>
                      <RotateCw size={16} className="animate-spin" style={{ display: 'inline', marginRight: 6 }} />
                      Auditing historical references...
                    </div>
                  ) : viewingReferences ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      <div className="subject-reference-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Timetable Periods</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1E293B', marginTop: 4 }}>
                          {viewingReferences.timetablePeriods}
                        </span>
                      </div>
                      <div className="subject-reference-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Exam Schedules</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1E293B', marginTop: 4 }}>
                          {viewingReferences.examSchedules}
                        </span>
                      </div>
                      <div className="subject-reference-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Assignments</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1E293B', marginTop: 4 }}>
                          {viewingReferences.assignments}
                        </span>
                      </div>
                      <div className="subject-reference-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Teacher Allocations</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1E293B', marginTop: 4 }}>
                          {viewingReferences.teacherAssignments}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Applicable Classes */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-muted)', marginBottom: 8 }}>
                    Associated Classes ({viewingSubject.applicableClasses?.length || 0})
                  </div>
                  {viewingSubject.applicableClasses && viewingSubject.applicableClasses.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {viewingSubject.applicableClasses.map((ac, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 10px',
                            backgroundColor: '#F0F4EF',
                            border: '1px solid #D5DFD3',
                            borderRadius: 6,
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: '#334E3C',
                          }}
                        >
                          <School size={13} />
                          <span>{ac.className}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: '#94A3B8', fontStyle: 'italic' }}>
                      No classes explicitly associated.
                    </div>
                  )}
                </div>

                {/* Assigned Teachers */}
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--admin-text-muted)', marginBottom: 8 }}>
                    Assigned Teachers ({viewingSubject.assignedTeachers?.length || 0})
                  </div>
                  {viewingSubject.assignedTeachers && viewingSubject.assignedTeachers.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {viewingSubject.assignedTeachers.map((t, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid var(--admin-border-subtle)',
                            borderRadius: 6,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                backgroundColor: '#EBF0F5',
                                color: 'var(--admin-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                              }}
                            >
                              {t.fullName ? t.fullName.slice(0, 2).toUpperCase() : 'TC'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--admin-primary)' }}>
                                {t.fullName}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                                {t.department} • {t.email}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 4,
                                backgroundColor: '#EEF3F8',
                                color: '#20354A',
                              }}
                            >
                              {t.className} - Sec {t.section}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#FAF9F5',
                        border: '1px solid var(--admin-border-subtle)',
                        borderRadius: 6,
                        fontSize: '0.82rem',
                        color: 'var(--admin-text-muted)',
                      }}
                    >
                      No faculty members are currently assigned to teach {viewingSubject.name}. Assignments can be configured via Teacher Management.
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setViewingSubject(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="admin-btn-primary-action"
                  onClick={() => {
                    const toEdit = viewingSubject;
                    setViewingSubject(null);
                    handleOpenEditModal(toEdit);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Edit2 size={14} />
                  <span>Edit Subject</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            CONFIRMATION DIALOG (STATUS CHANGE / DELETE)
            =================================================================== */}
        {confirmDialog && (
          <div className="admin-modal-overlay" onClick={() => !isProcessingAction && setConfirmDialog(null)}>
            <div
              className="admin-modal-box"
              style={{ maxWidth: 520, width: '92%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor:
                        confirmDialog.action === 'DELETE'
                          ? '#FEE2E2'
                          : confirmDialog.action === 'DEACTIVATE'
                          ? '#FEF3C7'
                          : '#DCFCE7',
                      color:
                        confirmDialog.action === 'DELETE'
                          ? '#DC2626'
                          : confirmDialog.action === 'DEACTIVATE'
                          ? '#D97706'
                          : '#15803D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {confirmDialog.action === 'DELETE' ? (
                      <Trash2 size={18} />
                    ) : confirmDialog.action === 'DEACTIVATE' ? (
                      <Power size={18} />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--admin-primary)' }}>
                      {confirmDialog.action === 'DELETE'
                        ? `Delete Subject: "${confirmDialog.subject.name}"?`
                        : confirmDialog.action === 'DEACTIVATE'
                        ? `Deactivate Subject: "${confirmDialog.subject.name}"?`
                        : `Activate Subject: "${confirmDialog.subject.name}"?`}
                    </h3>
                    <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                      Code: {confirmDialog.subject.code}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => !isProcessingAction && setConfirmDialog(null)}
                  disabled={isProcessingAction}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="admin-modal-body" style={{ padding: '16px 24px' }}>
                {confirmDialog.references && confirmDialog.references.totalReferences > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      backgroundColor: '#FEF3C7',
                      border: '1px solid #FCD34D',
                      borderRadius: 6,
                      padding: '10px 14px',
                      marginBottom: 14,
                      color: '#92400E',
                      fontSize: '0.82rem',
                    }}
                  >
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong>Academic Reference Warning:</strong>
                      <div style={{ marginTop: 2 }}>
                        This subject is referenced by {confirmDialog.references.totalReferences} records:
                      </div>
                      <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                        {confirmDialog.references.timetablePeriods > 0 && (
                          <li>{confirmDialog.references.timetablePeriods} timetable period(s)</li>
                        )}
                        {confirmDialog.references.examSchedules > 0 && (
                          <li>{confirmDialog.references.examSchedules} scheduled exam(s)</li>
                        )}
                        {confirmDialog.references.assignments > 0 && (
                          <li>{confirmDialog.references.assignments} assignment(s)</li>
                        )}
                        {confirmDialog.references.teacherAssignments > 0 && (
                          <li>{confirmDialog.references.teacherAssignments} teacher class assignment(s)</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  {confirmDialog.action === 'DELETE' ? (
                    confirmDialog.references && confirmDialog.references.totalReferences > 0 ? (
                      <span style={{ color: '#B91C1C', fontWeight: 600 }}>
                        This subject cannot be deleted because academic records and schedule periods depend on it. Deactivating it instead will preserve history while preventing new allocations.
                      </span>
                    ) : (
                      'Are you sure you want to permanently delete this subject? This action cannot be undone.'
                    )
                  ) : confirmDialog.action === 'DEACTIVATE' ? (
                    'Deactivating this subject will hide it from new timetable slots and exam scheduling. All historical grades, attendance, and assignment records will remain intact.'
                  ) : (
                    'Activating this subject will restore it to full curriculum availability for timetable allocation and examinations.'
                  )}
                </p>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setConfirmDialog(null)}
                  disabled={isProcessingAction}
                >
                  Cancel
                </button>
                {confirmDialog.action === 'DELETE' &&
                confirmDialog.references &&
                confirmDialog.references.totalReferences > 0 ? (
                  <button
                    type="button"
                    className="admin-btn-primary-action"
                    onClick={() => {
                      const subj = confirmDialog.subject;
                      setConfirmDialog(null);
                      handlePromptAction(subj, 'DEACTIVATE');
                    }}
                  >
                    Deactivate Instead
                  </button>
                ) : (
                  <button
                    type="button"
                    className={
                      confirmDialog.action === 'DELETE'
                        ? 'admin-btn-danger'
                        : 'admin-btn-primary-action'
                    }
                    onClick={handleExecuteAction}
                    disabled={isProcessingAction}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor:
                        confirmDialog.action === 'DELETE'
                          ? '#DC2626'
                          : confirmDialog.action === 'DEACTIVATE'
                          ? '#D97706'
                          : undefined,
                    }}
                  >
                    {isProcessingAction ? (
                      <>
                        <RotateCw size={14} className="animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>
                        {confirmDialog.action === 'DELETE'
                          ? 'Confirm Delete'
                          : confirmDialog.action === 'DEACTIVATE'
                          ? 'Confirm Deactivation'
                          : 'Confirm Activation'}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSubjectsPage;
