import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Edit2,
  Trash2,
  Power,
  X,
  Eye,
  Mail,
  Phone,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/adminApi';
import {
  TeacherDetail,
  TeacherSummaryStats,
  TeacherStatus,
  AssignedClass,
  ClassDetail,
} from '../../types/admin.types';

const DEPARTMENTS = [
  'General',
  'Mathematics',
  'Science',
  'English',
  'Social Studies',
  'Computer Science',
  'Languages',
  'Arts & Music',
  'Physical Education',
];

export const AdminTeachersPage: React.FC = () => {
  // Data states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<TeacherDetail[]>([]);
  const [summaryStats, setSummaryStats] = useState<TeacherSummaryStats>({
    totalTeachers: 0,
    activeTeachers: 0,
    inactiveTeachers: 0,
  });
  const [availableClasses, setAvailableClasses] = useState<ClassDetail[]>([]);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // Feedback toasts
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  // Add / Edit Modal State
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherDetail | null>(null);
  const [formFullName, setFormFullName] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formEmployeeId, setFormEmployeeId] = useState<string>('');
  const [formQualification, setFormQualification] = useState<string>('');
  const [formDesignation, setFormDesignation] = useState<string>('Teacher');
  const [formDepartment, setFormDepartment] = useState<string>('General');
  const [formStatus, setFormStatus] = useState<TeacherStatus>('ACTIVE');
  const [formAssignedClasses, setFormAssignedClasses] = useState<AssignedClass[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Add Assignment Sub-form inside modal
  const [assignGrade, setAssignGrade] = useState<string>('');
  const [assignSection, setAssignSection] = useState<string>('A');
  const [assignSubject, setAssignSubject] = useState<string>('');

  // Details View Modal State
  const [selectedTeacherForView, setSelectedTeacherForView] = useState<TeacherDetail | null>(null);

  // Confirmation Modal State
  const [confirmationModal, setConfirmationModal] = useState<{
    title: string;
    description: string;
    actionLabel: string;
    isDestructive: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  const showSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const showError = (msg: string) => {
    setToastError(msg);
    setTimeout(() => setToastError(null), 5000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, teachersRes, classesRes] = await Promise.all([
        adminApi.getTeacherSummaryStats(),
        adminApi.getTeachers({
          search: searchTerm.trim() || undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          department: selectedDept !== 'ALL' ? selectedDept : undefined,
        }),
        adminApi.getClasses(),
      ]);

      if (statsRes.success && statsRes.data) {
        setSummaryStats(statsRes.data);
      }
      if (teachersRes.success && teachersRes.data) {
        setTeachers(teachersRes.data);
      }
      if (classesRes.success && classesRes.data) {
        setAvailableClasses(classesRes.data);
        if (classesRes.data.length > 0 && !assignGrade) {
          setAssignGrade(classesRes.data[0].name);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load teacher directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedStatus, selectedDept]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setTimeout(() => {
      fetchData();
    }, 0);
  };

  // Open Add Teacher Modal
  const handleOpenAddTeacher = () => {
    setEditingTeacher(null);
    setFormFullName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setFormEmployeeId('');
    setFormQualification('');
    setFormDesignation('Teacher');
    setFormDepartment('General');
    setFormStatus('ACTIVE');
    setFormAssignedClasses([]);
    setFormError(null);
    setShowFormModal(true);
  };

  // Open Edit Teacher Modal
  const handleOpenEditTeacher = (teacher: TeacherDetail) => {
    setEditingTeacher(teacher);
    setFormFullName(teacher.fullName);
    setFormEmail(teacher.email);
    setFormPhone(teacher.phone);
    setFormPassword(''); // blank unless changing
    setFormEmployeeId(teacher.employeeId);
    setFormQualification(teacher.qualification || '');
    setFormDesignation(teacher.designation || 'Teacher');
    setFormDepartment(teacher.department || 'General');
    setFormStatus(teacher.status);
    setFormAssignedClasses(teacher.assignedClasses || []);
    setFormError(null);
    setShowFormModal(true);
  };

  // Add class assignment to draft list
  const handleAddAssignment = () => {
    if (!assignGrade) return;
    const exists = formAssignedClasses.some(
      (c) => c.className === assignGrade && c.section === assignSection
    );
    if (exists) {
      setFormError(`Already assigned to ${assignGrade} - Section ${assignSection}`);
      return;
    }

    const matchedClass = availableClasses.find((c) => c.name === assignGrade);

    setFormAssignedClasses([
      ...formAssignedClasses,
      {
        classId: matchedClass?.id,
        className: assignGrade,
        section: assignSection,
        subject: assignSubject.trim(),
      },
    ]);
    setAssignSubject('');
    setFormError(null);
  };

  const handleRemoveAssignment = (index: number) => {
    setFormAssignedClasses(formAssignedClasses.filter((_, i) => i !== index));
  };

  // Submit Add / Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formFullName.trim()) {
      setFormError('Full name is required.');
      return;
    }
    if (!formEmail.trim()) {
      setFormError('Email address is required.');
      return;
    }
    if (!formPhone.trim()) {
      setFormError('Phone number is required.');
      return;
    }

    // Password validation on create
    if (!editingTeacher && (!formPassword || formPassword.length < 6)) {
      setFormError('Password is required and must be at least 6 characters.');
      return;
    }
    // Password validation on edit (optional)
    if (editingTeacher && formPassword && formPassword.length < 6) {
      setFormError('New password must be at least 6 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingTeacher) {
        const payload: any = {
          fullName: formFullName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          employeeId: formEmployeeId.trim() || undefined,
          qualification: formQualification.trim(),
          designation: formDesignation.trim(),
          department: formDepartment.trim(),
          status: formStatus,
          assignedClasses: formAssignedClasses,
        };
        if (formPassword.trim()) {
          payload.password = formPassword.trim();
        }

        await adminApi.updateTeacher(editingTeacher.id, payload);
        showSuccess(`Teacher "${formFullName}" updated successfully.`);
      } else {
        await adminApi.createTeacher({
          fullName: formFullName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          password: formPassword.trim(),
          employeeId: formEmployeeId.trim() || undefined,
          qualification: formQualification.trim(),
          designation: formDesignation.trim(),
          department: formDepartment.trim(),
          status: formStatus,
          assignedClasses: formAssignedClasses,
        });
        showSuccess(`Teacher account created for "${formFullName}".`);
      }

      setShowFormModal(false);
      await fetchData();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to save teacher account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Teacher Status (Active <-> Inactive)
  const handleToggleStatus = (teacher: TeacherDetail) => {
    const nextStatus: TeacherStatus = teacher.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionWord = nextStatus === 'ACTIVE' ? 'activate' : 'deactivate';

    setConfirmationModal({
      title: `${nextStatus === 'ACTIVE' ? 'Activate' : 'Deactivate'} Teacher Account?`,
      description: `Are you sure you want to ${actionWord} ${teacher.fullName}'s account? When deactivated, the teacher will not be able to log in to the portal.`,
      actionLabel: nextStatus === 'ACTIVE' ? 'Activate Account' : 'Deactivate Account',
      isDestructive: nextStatus === 'INACTIVE',
      onConfirm: async () => {
        try {
          await adminApi.changeTeacherStatus(teacher.id, nextStatus);
          showSuccess(`Teacher account marked as ${nextStatus}.`);
          await fetchData();
        } catch (err: any) {
          showError(err?.response?.data?.message || 'Failed to update teacher status.');
        }
      },
    });
  };

  // Delete Teacher
  const handleDeleteTeacher = (teacher: TeacherDetail) => {
    setConfirmationModal({
      title: `Delete Teacher "${teacher.fullName}"?`,
      description: `Are you sure you want to delete this teacher account? This will permanently remove the faculty profile and associated login account.`,
      actionLabel: 'Confirm Delete',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await adminApi.deleteTeacher(teacher.id);
          showSuccess(`Teacher "${teacher.fullName}" was removed.`);
          await fetchData();
        } catch (err: any) {
          showError(err?.response?.data?.message || 'Failed to delete teacher account.');
        }
      },
    });
  };

  const getInitials = (name: string) => {
    if (!name) return 'T';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
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
          <div
            className="admin-feedback-toast admin-toast-error"
            style={{ borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', color: '#B91C1C' }}
          >
            <AlertCircle size={18} />
            <span>{toastError}</span>
          </div>
        )}

        {/* 1. Page Header */}
        <div className="admin-teacher-header">
          <div className="admin-teacher-title-group">
            <h1>Teacher Management</h1>
            <p>Manage faculty profiles, employee IDs, subject assignments, and account statuses.</p>
          </div>
          <button
            type="button"
            className="admin-btn-primary-action"
            onClick={handleOpenAddTeacher}
            aria-label="Add new teacher"
          >
            <UserPlus size={16} />
            <span>Add Teacher</span>
          </button>
        </div>

        {/* 2. Summary Statistics Cards */}
        <div className="admin-teacher-summary-grid">
          <div className="admin-teacher-card-stat">
            <div className="admin-teacher-card-stat-info">
              <span className="admin-teacher-card-stat-label">Total Faculty</span>
              <span className="admin-teacher-card-stat-value">{summaryStats.totalTeachers}</span>
            </div>
            <div className="admin-teacher-card-stat-icon admin-stat-icon-blue">
              <Users size={22} />
            </div>
          </div>

          <div className="admin-teacher-card-stat">
            <div className="admin-teacher-card-stat-info">
              <span className="admin-teacher-card-stat-label">Active Teachers</span>
              <span className="admin-teacher-card-stat-value">{summaryStats.activeTeachers}</span>
            </div>
            <div className="admin-teacher-card-stat-icon admin-stat-icon-sage">
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className="admin-teacher-card-stat">
            <div className="admin-teacher-card-stat-info">
              <span className="admin-teacher-card-stat-label">Inactive / On Leave</span>
              <span className="admin-teacher-card-stat-value">{summaryStats.inactiveTeachers}</span>
            </div>
            <div className="admin-teacher-card-stat-icon admin-stat-icon-amber">
              <Power size={22} />
            </div>
          </div>
        </div>

        {/* 3. Search and Filter Toolbar */}
        <div className="admin-teacher-toolbar">
          <form className="admin-teacher-search-box" onSubmit={handleSearchSubmit}>
            <Search size={16} className="admin-teacher-search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, phone, staff ID, department..."
              className="admin-teacher-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={() => fetchData()}
              aria-label="Search teachers"
            />
            {searchTerm && (
              <button
                type="button"
                className="admin-teacher-search-clear"
                onClick={handleClearSearch}
                aria-label="Clear search query"
              >
                <X size={14} />
              </button>
            )}
          </form>

          <div className="admin-teacher-filter-group">
            <div className="admin-teacher-select-wrap">
              <span className="admin-teacher-select-label">Status:</span>
              <select
                className="admin-teacher-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                aria-label="Filter by Status"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <ChevronDown size={14} className="admin-teacher-select-chevron" />
            </div>

            <div className="admin-teacher-select-wrap">
              <span className="admin-teacher-select-label">Department:</span>
              <select
                className="admin-teacher-select"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                aria-label="Filter by Department"
              >
                <option value="ALL">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="admin-teacher-select-chevron" />
            </div>

            <button
              type="button"
              className="admin-teacher-btn-refresh"
              onClick={() => fetchData()}
              title="Refresh teacher directory"
              aria-label="Refresh teacher directory"
              disabled={loading}
            >
              <RotateCw size={15} className={loading ? 'admin-spin' : ''} />
            </button>
          </div>
        </div>

        {/* 4. Main Teacher Table / State Area */}
        {loading ? (
          <div className="admin-table-loading-card">
            <RotateCw size={24} className="admin-spin" style={{ color: '#20354A' }} />
            <p>Loading teacher directory...</p>
          </div>
        ) : error ? (
          <div className="admin-table-error-card">
            <AlertCircle size={24} style={{ color: '#EF4444' }} />
            <p>{error}</p>
            <button type="button" className="admin-btn-secondary" onClick={() => fetchData()}>
              Try Again
            </button>
          </div>
        ) : teachers.length === 0 ? (
          <div className="admin-teacher-empty-state">
            <div className="admin-teacher-empty-icon-wrap">
              <Users size={30} />
            </div>
            <h3 className="admin-teacher-empty-title">No Teachers Found</h3>
            <p className="admin-teacher-empty-desc">
              {searchTerm || selectedStatus !== 'ALL' || selectedDept !== 'ALL'
                ? 'No faculty members match your filter criteria. Try adjusting your search query or reset the filters.'
                : 'No teacher accounts have been created yet. Click "+ Add Teacher" to onboard your first faculty member.'}
            </p>
            {searchTerm || selectedStatus !== 'ALL' || selectedDept !== 'ALL' ? (
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('ALL');
                  setSelectedDept('ALL');
                }}
              >
                Reset Filters
              </button>
            ) : (
              <button
                type="button"
                className="admin-btn-primary-action"
                onClick={handleOpenAddTeacher}
              >
                <UserPlus size={16} />
                <span>Add Teacher</span>
              </button>
            )}
          </div>
        ) : (
          <div className="admin-teacher-table-card">
            <div className="admin-teacher-table-scroll">
              <table className="admin-teacher-table">
                <thead>
                  <tr>
                    <th style={{ width: '28%', minWidth: 250 }}>Faculty Member</th>
                    <th style={{ width: '22%', minWidth: 200 }}>Contact</th>
                    <th style={{ width: '16%', minWidth: 160 }}>Department / Role</th>
                    <th style={{ width: '20%', minWidth: 190 }}>Assigned Classes</th>
                    <th style={{ width: '10%', minWidth: 110 }}>Status</th>
                    <th style={{ width: '14%', minWidth: 140, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher.id}>
                      {/* Faculty Member column */}
                      <td>
                        <div className="admin-teacher-faculty-cell">
                          <div className="admin-teacher-avatar" aria-hidden="true">
                            {getInitials(teacher.fullName)}
                          </div>
                          <div className="admin-teacher-faculty-info">
                            <span className="admin-teacher-faculty-name" title={teacher.fullName}>
                              {teacher.fullName}
                            </span>
                            <div className="admin-teacher-faculty-meta">
                              <span className="admin-teacher-staff-id">{teacher.employeeId}</span>
                              {teacher.qualification && (
                                <span className="admin-teacher-qualification" title={teacher.qualification}>
                                  • {teacher.qualification}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact column */}
                      <td>
                        <div className="admin-teacher-contact-cell">
                          <div className="admin-teacher-contact-row" title={teacher.email}>
                            <Mail size={13} className="admin-teacher-contact-icon" />
                            <span className="admin-teacher-contact-text">{teacher.email}</span>
                          </div>
                          <div className="admin-teacher-contact-row admin-teacher-contact-row-sub">
                            <Phone size={13} className="admin-teacher-contact-icon" />
                            <span>{teacher.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Department / Role column */}
                      <td>
                        <div className="admin-teacher-dept-cell">
                          <span className="admin-teacher-dept-badge">
                            {teacher.department || 'General'}
                          </span>
                          <span className="admin-teacher-role-text">
                            {teacher.designation || 'Teacher'}
                          </span>
                        </div>
                      </td>

                      {/* Assigned Classes column */}
                      <td>
                        {teacher.assignedClasses && teacher.assignedClasses.length > 0 ? (
                          <div className="admin-teacher-classes-wrap">
                            {teacher.assignedClasses.map((ac, idx) => (
                              <span
                                key={idx}
                                className="admin-teacher-class-chip"
                                title={ac.subject ? `Subject: ${ac.subject}` : undefined}
                              >
                                <strong>{ac.className}</strong>-{ac.section}
                                {ac.subject && (
                                  <span className="admin-teacher-class-chip-subject">
                                    ({ac.subject})
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="admin-teacher-unassigned">Unassigned</span>
                        )}
                      </td>

                      {/* Status column */}
                      <td>
                        <span
                          className={`admin-teacher-status-pill ${
                            teacher.status === 'ACTIVE' ? 'active' : 'inactive'
                          }`}
                        >
                          <span className="admin-teacher-status-dot" />
                          <span>{teacher.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
                        </span>
                      </td>

                      {/* Actions column */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="admin-teacher-actions-group">
                          <button
                            type="button"
                            className="admin-teacher-action-btn view"
                            onClick={() => setSelectedTeacherForView(teacher)}
                            title="View Faculty Profile"
                            aria-label={`View profile for ${teacher.fullName}`}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className="admin-teacher-action-btn edit"
                            onClick={() => handleOpenEditTeacher(teacher)}
                            title="Edit Teacher"
                            aria-label={`Edit ${teacher.fullName}`}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className={`admin-teacher-action-btn power ${
                              teacher.status === 'ACTIVE' ? 'is-active' : ''
                            }`}
                            onClick={() => handleToggleStatus(teacher)}
                            title={teacher.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                            aria-label={teacher.status === 'ACTIVE' ? `Deactivate ${teacher.fullName}` : `Activate ${teacher.fullName}`}
                          >
                            <Power size={15} />
                          </button>
                          <button
                            type="button"
                            className="admin-teacher-action-btn delete"
                            onClick={() => handleDeleteTeacher(teacher)}
                            title="Delete Account"
                            aria-label={`Delete ${teacher.fullName}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ADD / EDIT TEACHER MODAL                                       */}
        {/* ============================================================== */}
        {showFormModal && (
          <div className="admin-modal-backdrop" onClick={() => setShowFormModal(false)}>
            <div
              className="admin-modal-card"
              style={{ maxWidth: 640 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-header">
                <div>
                  <h3 className="admin-modal-title">
                    {editingTeacher ? 'Edit Teacher Profile' : 'Add New Faculty Member'}
                  </h3>
                  <p className="admin-modal-subtitle">
                    {editingTeacher
                      ? 'Update contact details, role, department, and class assignments.'
                      : 'Create an authenticated faculty account with role-specific login credentials.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => setShowFormModal(false)}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div
                  className="admin-form-error-banner"
                  style={{
                    margin: '0 24px 16px',
                    padding: '10px 14px',
                    borderRadius: 8,
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#B91C1C',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitForm}>
                <div
                  className="admin-modal-body"
                  style={{ maxHeight: '65vh', overflowY: 'auto', padding: '0 24px 20px' }}
                >
                  {/* Basic Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">
                        Full Name <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="admin-form-input"
                        placeholder="e.g. Dr. Arthur Pendelton"
                        value={formFullName}
                        onChange={(e) => setFormFullName(e.target.value)}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">
                        Staff / Employee ID
                      </label>
                      <input
                        type="text"
                        className="admin-form-input"
                        placeholder="Auto-generated if empty (e.g. TCH-0001)"
                        value={formEmployeeId}
                        onChange={(e) => setFormEmployeeId(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 14 }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">
                        Email Address <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="email"
                        required
                        className="admin-form-input"
                        placeholder="e.g. arthur.p@eduhub.school"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">
                        Phone Number <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="admin-form-input"
                        placeholder="e.g. +1 555-0199"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="admin-form-group" style={{ marginTop: 14 }}>
                    <label className="admin-form-label">
                      {editingTeacher ? 'Reset Password (optional)' : 'Login Password'}
                      {!editingTeacher && <span style={{ color: '#EF4444' }}> *</span>}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        required={!editingTeacher}
                        className="admin-form-input"
                        placeholder={
                          editingTeacher
                            ? 'Leave blank to retain current teacher password'
                            : 'Set initial login password (min. 6 characters)'
                        }
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#707781', marginTop: 4, display: 'block' }}>
                      {editingTeacher
                        ? 'Entering a password here updates the teacher credentials for portal login.'
                        : 'Teacher will use this password to sign in to the portal via the Teacher login option.'}
                    </span>
                  </div>

                  {/* Department & Designation */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 14 }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Department</label>
                      <select
                        className="admin-form-select"
                        value={formDepartment}
                        onChange={(e) => setFormDepartment(e.target.value)}
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Designation / Role</label>
                      <input
                        type="text"
                        className="admin-form-input"
                        placeholder="e.g. Senior Teacher, Head of Dept"
                        value={formDesignation}
                        onChange={(e) => setFormDesignation(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Qualification & Status */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginTop: 14 }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Qualification</label>
                      <input
                        type="text"
                        className="admin-form-input"
                        placeholder="e.g. M.Sc. Mathematics, B.Ed"
                        value={formQualification}
                        onChange={(e) => setFormQualification(e.target.value)}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Account Status</label>
                      <select
                        className="admin-form-select"
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as TeacherStatus)}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Assigned Classes Section */}
                  <div style={{ marginTop: 22, borderTop: '1px solid #E8E5DD', paddingTop: 16 }}>
                    <label className="admin-form-label" style={{ marginBottom: 8, display: 'block' }}>
                      Assign Classes & Subjects
                    </label>

                    {/* Assignment input bar */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 2fr auto',
                        gap: 8,
                        alignItems: 'center',
                        backgroundColor: '#FAF9F5',
                        padding: 10,
                        borderRadius: 8,
                        border: '1px solid #E8E5DD',
                      }}
                    >
                      <select
                        className="admin-form-select"
                        style={{ fontSize: '0.85rem' }}
                        value={assignGrade}
                        onChange={(e) => setAssignGrade(e.target.value)}
                      >
                        {availableClasses.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name} ({c.academicYear})
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        className="admin-form-input"
                        style={{ fontSize: '0.85rem' }}
                        placeholder="Sec (A)"
                        value={assignSection}
                        onChange={(e) => setAssignSection(e.target.value)}
                      />

                      <input
                        type="text"
                        className="admin-form-input"
                        style={{ fontSize: '0.85rem' }}
                        placeholder="Subject (e.g. Physics)"
                        value={assignSubject}
                        onChange={(e) => setAssignSubject(e.target.value)}
                      />

                      <button
                        type="button"
                        className="admin-btn-secondary"
                        style={{ padding: '7px 12px', fontSize: '0.82rem' }}
                        onClick={handleAddAssignment}
                      >
                        <Plus size={14} />
                        <span>Assign</span>
                      </button>
                    </div>

                    {/* Assigned pills */}
                    {formAssignedClasses.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                        {formAssignedClasses.map((ac, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 10px',
                              borderRadius: 6,
                              fontSize: '0.8rem',
                              backgroundColor: '#EEF3F8',
                              color: '#20354A',
                              border: '1px solid #D5E1ED',
                            }}
                          >
                            <span>
                              <strong>{ac.className}</strong> - {ac.section}
                              {ac.subject ? ` (${ac.subject})` : ''}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAssignment(idx)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#707781',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              aria-label="Remove assignment"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => setShowFormModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-btn-primary-action"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <RotateCw size={14} className="admin-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingTeacher ? 'Save Changes' : 'Create Teacher Account'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TEACHER DETAILS VIEW MODAL                                     */}
        {/* ============================================================== */}
        {selectedTeacherForView && (
          <div className="admin-modal-backdrop" onClick={() => setSelectedTeacherForView(null)}>
            <div
              className="admin-modal-card"
              style={{ maxWidth: 540 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-header">
                <div>
                  <h3 className="admin-modal-title">Teacher Profile</h3>
                  <p className="admin-modal-subtitle">Official staff credentials and school responsibilities.</p>
                </div>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => setSelectedTeacherForView(null)}
                  aria-label="Close profile"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="admin-modal-body" style={{ padding: '0 24px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: '50%',
                      backgroundColor: '#20354A',
                      color: '#FFFFFF',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getInitials(selectedTeacherForView.fullName)}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#27313A' }}>
                      {selectedTeacherForView.fullName}
                    </h4>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                      <span style={{ fontWeight: 600, color: '#647F99', fontSize: '0.85rem' }}>
                        {selectedTeacherForView.employeeId}
                      </span>
                      <span
                        className={`admin-teacher-status-pill ${
                          selectedTeacherForView.status === 'ACTIVE' ? 'active' : 'inactive'
                        }`}
                      >
                        <span className="admin-teacher-status-dot" />
                        <span>{selectedTeacherForView.status}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 14,
                    padding: 16,
                    backgroundColor: '#FAF9F5',
                    borderRadius: 8,
                    border: '1px solid #E8E5DD',
                    fontSize: '0.88rem',
                  }}
                >
                  <div>
                    <span style={{ color: '#707781', fontSize: '0.78rem', display: 'block' }}>Email</span>
                    <strong style={{ color: '#27313A' }}>{selectedTeacherForView.email}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#707781', fontSize: '0.78rem', display: 'block' }}>Phone</span>
                    <strong style={{ color: '#27313A' }}>{selectedTeacherForView.phone}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#707781', fontSize: '0.78rem', display: 'block' }}>Department</span>
                    <strong style={{ color: '#27313A' }}>{selectedTeacherForView.department || 'General'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#707781', fontSize: '0.78rem', display: 'block' }}>Designation</span>
                    <strong style={{ color: '#27313A' }}>{selectedTeacherForView.designation || 'Teacher'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#707781', fontSize: '0.78rem', display: 'block' }}>Qualification</span>
                    <strong style={{ color: '#27313A' }}>
                      {selectedTeacherForView.qualification || 'Not specified'}
                    </strong>
                  </div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <h5 style={{ margin: '0 0 8px', fontSize: '0.88rem', color: '#20354A' }}>
                    Assigned Classes & Subjects
                  </h5>
                  {selectedTeacherForView.assignedClasses && selectedTeacherForView.assignedClasses.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {selectedTeacherForView.assignedClasses.map((ac, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: 6,
                            border: '1px solid #E8E5DD',
                            fontSize: '0.82rem',
                          }}
                        >
                          <strong>{ac.className}</strong> (Section {ac.section})
                          {ac.subject && <span style={{ color: '#647F99' }}> — {ac.subject}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.82rem', color: '#707781', margin: 0 }}>
                      No academic classes assigned yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setSelectedTeacherForView(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="admin-btn-primary-action"
                  onClick={() => {
                    const t = selectedTeacherForView;
                    setSelectedTeacherForView(null);
                    handleOpenEditTeacher(t);
                  }}
                >
                  <Edit2 size={14} />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* CONFIRMATION DIALOG                                            */}
        {/* ============================================================== */}
        {confirmationModal && (
          <div className="admin-modal-backdrop" onClick={() => setConfirmationModal(null)}>
            <div className="admin-modal-card admin-confirm-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">{confirmationModal.title}</h3>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => setConfirmationModal(null)}
                  aria-label="Close confirmation"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="admin-modal-body">
                <p className="admin-confirm-description">{confirmationModal.description}</p>
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
                  className={
                    confirmationModal.isDestructive
                      ? 'admin-btn-destructive-action'
                      : 'admin-btn-primary-action'
                  }
                  onClick={async () => {
                    try {
                      setIsConfirming(true);
                      await confirmationModal.onConfirm();
                      setConfirmationModal(null);
                    } finally {
                      setIsConfirming(false);
                    }
                  }}
                  disabled={isConfirming}
                >
                  {isConfirming ? 'Processing...' : confirmationModal.actionLabel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
