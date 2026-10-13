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
  BookOpen,
  GraduationCap,
  Sparkles,
  Layers,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/adminApi';
import {
  TeacherDetail,
  TeacherSummaryStats,
  TeacherStatus,
  AssignedClass,
  ClassDetail,
  SectionDetail,
  TeacherAssignmentRecord,
  AssignTeacherPayload,
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

const DEPARTMENT_SUBJECT_SUGGESTIONS: Record<string, string[]> = {
  Mathematics: ['Mathematics', 'Algebra', 'Geometry', 'Calculus', 'Statistics', 'Trigonometry'],
  Science: ['Physics', 'Chemistry', 'Biology', 'General Science', 'Environmental Science'],
  English: ['English Language', 'English Literature', 'Grammar', 'Creative Writing'],
  'Social Studies': ['History', 'Geography', 'Civics', 'Economics', 'Social Studies'],
  'Computer Science': ['Computer Science', 'Programming', 'Information Technology', 'Robotics'],
  Languages: ['Spanish', 'French', 'German', 'Hindi', 'Arabic', 'Latin'],
  'Arts & Music': ['Fine Arts', 'Music', 'Drama', 'Visual Arts'],
  'Physical Education': ['Physical Education', 'Sports & Fitness', 'Health Education'],
  General: ['General Instruction', 'Moral Science', 'Life Skills', 'General Knowledge'],
};

export const AdminTeachersPage: React.FC = () => {
  // Navigation tab state: Faculty Directory vs Class Assignments
  const [activeTab, setActiveTab] = useState<'directory' | 'assignments'>('directory');

  // Data states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<TeacherDetail[]>([]);
  const [allAssignments, setAllAssignments] = useState<TeacherAssignmentRecord[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState<boolean>(false);
  const [summaryStats, setSummaryStats] = useState<TeacherSummaryStats>({
    totalTeachers: 0,
    activeTeachers: 0,
    inactiveTeachers: 0,
  });
  const [availableClasses, setAvailableClasses] = useState<ClassDetail[]>([]);

  // Directory Filter & Search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // Assignments Filter & Search states
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState<string>('');
  const [assignmentClassFilter, setAssignmentClassFilter] = useState<string>('ALL');
  const [assignmentYearFilter, setAssignmentYearFilter] = useState<string>('ALL');

  // Feedback toasts
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  // Add / Edit Teacher Modal State
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

  // Add Assignment Sub-form inside Add/Edit Teacher modal
  const [assignGrade, setAssignGrade] = useState<string>('');
  const [assignSection, setAssignSection] = useState<string>('A');
  const [assignSubject, setAssignSubject] = useState<string>('');

  // Details View Modal State
  const [selectedTeacherForView, setSelectedTeacherForView] = useState<TeacherDetail | null>(null);

  // Teacher Assignment Modal State (Dedicated Assignment Management)
  const [showAssignmentModal, setShowAssignmentModal] = useState<boolean>(false);
  const [selectedTeacherForAssignment, setSelectedTeacherForAssignment] = useState<TeacherDetail | null>(null);
  const [assignmentModalTeacherId, setAssignmentModalTeacherId] = useState<string>('');
  const [assignmentClassId, setAssignmentClassId] = useState<string>('');
  const [assignmentClassName, setAssignmentClassName] = useState<string>('');
  const [assignmentSection, setAssignmentSection] = useState<string>('A');
  const [assignmentSubject, setAssignmentSubject] = useState<string>('');
  const [assignmentAcademicYear, setAssignmentAcademicYear] = useState<string>('2026-2027');
  const [availableSections, setAvailableSections] = useState<SectionDetail[]>([]);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [assignmentModalError, setAssignmentModalError] = useState<string | null>(null);
  const [isSavingAssignment, setIsSavingAssignment] = useState<boolean>(false);

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

  const fetchAssignments = async () => {
    try {
      setAssignmentsLoading(true);
      const res = await adminApi.getAllTeacherAssignments();
      if (res.success && res.data) {
        setAllAssignments(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load assignments:', err);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, teachersRes, classesRes, assignRes] = await Promise.all([
        adminApi.getTeacherSummaryStats(),
        adminApi.getTeachers({
          search: searchTerm.trim() || undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          department: selectedDept !== 'ALL' ? selectedDept : undefined,
        }),
        adminApi.getClasses(),
        adminApi.getAllTeacherAssignments(),
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
      if (assignRes.success && assignRes.data) {
        setAllAssignments(assignRes.data);
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
    setFormPassword('');
    setFormEmployeeId(teacher.employeeId);
    setFormQualification(teacher.qualification || '');
    setFormDesignation(teacher.designation || 'Teacher');
    setFormDepartment(teacher.department || 'General');
    setFormStatus(teacher.status);
    setFormAssignedClasses(teacher.assignedClasses || []);
    setFormError(null);
    setShowFormModal(true);
  };

  // Add draft class assignment inside Add/Edit Teacher modal
  const handleAddAssignmentDraft = () => {
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
        academicYear: matchedClass?.academicYear || '2026-2027',
      },
    ]);
    setAssignSubject('');
    setFormError(null);
  };

  const handleRemoveAssignmentDraft = (index: number) => {
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
      setFormError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          'Failed to save teacher account.'
      );
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
      description: `Are you sure you want to ${actionWord} ${teacher.fullName}'s account? When deactivated, the teacher will not be able to log in or be assigned new classes.`,
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

  // ==============================================================
  // TEACHER ASSIGNMENT FEATURE HANDLERS
  // ==============================================================

  // Load sections dynamically for a chosen class
  const loadSectionsForClass = async (classId: string) => {
    try {
      const res = await adminApi.getSectionsForClass(classId);
      if (res.success && res.data && res.data.length > 0) {
        setAvailableSections(res.data);
        return res.data;
      }
      setAvailableSections([]);
      return [];
    } catch (err) {
      setAvailableSections([]);
      return [];
    }
  };

  // Open Teacher Assignment Modal (for specific teacher or globally)
  const handleOpenAssignmentModal = async (teacher?: TeacherDetail) => {
    setAssignmentModalError(null);
    setEditingAssignmentId(null);
    setAssignmentSubject('');

    const targetTeacher =
      teacher || (teachers.find((t) => t.status === 'ACTIVE') || teachers[0] || null);

    setSelectedTeacherForAssignment(targetTeacher);
    setAssignmentModalTeacherId(targetTeacher?.id || '');

    if (availableClasses.length > 0) {
      const initialClass = availableClasses[0];
      setAssignmentClassId(initialClass.id);
      setAssignmentClassName(initialClass.name);
      setAssignmentAcademicYear(initialClass.academicYear || '2026-2027');

      const sections = await loadSectionsForClass(initialClass.id);
      setAssignmentSection(sections.length > 0 ? sections[0].name : 'A');
    }

    setShowAssignmentModal(true);
  };

  // When class changes in assignment modal
  const handleAssignmentClassChange = async (newClassId: string) => {
    setAssignmentClassId(newClassId);
    const matchedClass = availableClasses.find((c) => c.id === newClassId);
    if (matchedClass) {
      setAssignmentClassName(matchedClass.name);
      setAssignmentAcademicYear(matchedClass.academicYear || '2026-2027');
      const sections = await loadSectionsForClass(matchedClass.id);
      setAssignmentSection(sections.length > 0 ? sections[0].name : 'A');
    }
  };

  // When teacher selector changes in assignment modal (if choosing teacher)
  const handleAssignmentTeacherChange = (teacherId: string) => {
    setAssignmentModalTeacherId(teacherId);
    const t = teachers.find((tch) => tch.id === teacherId) || null;
    setSelectedTeacherForAssignment(t);
  };

  // Start editing an existing assignment
  const handleStartEditAssignment = async (
    assignment: TeacherAssignmentRecord | AssignedClass,
    teacherObj?: TeacherDetail
  ) => {
    setAssignmentModalError(null);
    setEditingAssignmentId(assignment.id || null);

    const targetTeacher =
      teacherObj ||
      selectedTeacherForAssignment ||
      teachers.find((t) => t.id === (assignment as TeacherAssignmentRecord).teacherId) ||
      null;

    if (targetTeacher) {
      setSelectedTeacherForAssignment(targetTeacher);
      setAssignmentModalTeacherId(targetTeacher.id);
    }

    setAssignmentClassName(assignment.className);
    setAssignmentSection(assignment.section);
    setAssignmentSubject(assignment.subject || '');
    setAssignmentAcademicYear(assignment.academicYear || '2026-2027');

    const matchedClass = availableClasses.find(
      (c) => c.name.toLowerCase() === assignment.className.toLowerCase()
    );
    if (matchedClass) {
      setAssignmentClassId(matchedClass.id);
      await loadSectionsForClass(matchedClass.id);
    }

    if (!showAssignmentModal) {
      setShowAssignmentModal(true);
    }
  };

  // Submit assign/update
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignmentModalError(null);

    const teacher =
      selectedTeacherForAssignment ||
      teachers.find((t) => t.id === assignmentModalTeacherId);

    if (!teacher) {
      setAssignmentModalError('Please select a faculty member.');
      return;
    }

    if (teacher.status !== 'ACTIVE') {
      setAssignmentModalError(
        'Cannot assign classes to an inactive teacher. Please activate the teacher account first.'
      );
      return;
    }

    if (!assignmentClassName.trim()) {
      setAssignmentModalError('Class name is required.');
      return;
    }
    if (!assignmentSection.trim()) {
      setAssignmentModalError('Section is required.');
      return;
    }
    if (!assignmentSubject.trim()) {
      setAssignmentModalError('Subject is required.');
      return;
    }

    try {
      setIsSavingAssignment(true);
      const payload: AssignTeacherPayload = {
        classId: assignmentClassId || undefined,
        className: assignmentClassName.trim(),
        section: assignmentSection.trim().toUpperCase(),
        subject: assignmentSubject.trim(),
        academicYear: assignmentAcademicYear.trim() || '2026-2027',
      };

      if (editingAssignmentId) {
        await adminApi.updateTeacherAssignment(teacher.id, editingAssignmentId, payload);
        showSuccess(
          `Assignment updated for ${teacher.fullName} (${payload.className}-${payload.section}).`
        );
      } else {
        await adminApi.assignTeacherToClass(teacher.id, payload);
        showSuccess(
          `Assigned ${payload.subject} in ${payload.className}-${payload.section} to ${teacher.fullName}.`
        );
      }

      setEditingAssignmentId(null);
      setAssignmentSubject('');

      await fetchData();
      await fetchAssignments();

      // Refresh selected teacher in modal
      const refreshed = await adminApi.getTeacherById(teacher.id);
      if (refreshed.success && refreshed.data) {
        setSelectedTeacherForAssignment(refreshed.data);
      }
    } catch (err: any) {
      setAssignmentModalError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          'Failed to record class assignment.'
      );
    } finally {
      setIsSavingAssignment(false);
    }
  };

  // Remove an assignment
  const handleRemoveAssignmentDirect = (
    teacherId: string,
    assignmentId: string,
    className: string,
    section: string,
    subject?: string
  ) => {
    setConfirmationModal({
      title: `Remove Class Assignment?`,
      description: `Are you sure you want to remove the assignment for ${className} - Section ${section} (${subject || 'Class Assignment'})? The teacher will no longer have access to this classroom.`,
      actionLabel: 'Confirm Remove',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await adminApi.removeTeacherAssignment(teacherId, assignmentId);
          showSuccess(`Assignment removed successfully.`);
          await fetchData();
          await fetchAssignments();

          if (selectedTeacherForAssignment && selectedTeacherForAssignment.id === teacherId) {
            const refreshed = await adminApi.getTeacherById(teacherId);
            if (refreshed.success && refreshed.data) {
              setSelectedTeacherForAssignment(refreshed.data);
            }
          }
        } catch (err: any) {
          showError(err?.response?.data?.message || 'Failed to remove assignment.');
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

  // Filtered assignments for the assignments tab
  const filteredAssignments = allAssignments.filter((a) => {
    if (
      assignmentYearFilter !== 'ALL' &&
      a.academicYear &&
      a.academicYear !== assignmentYearFilter
    ) {
      return false;
    }
    if (
      assignmentClassFilter !== 'ALL' &&
      a.className.toLowerCase() !== assignmentClassFilter.toLowerCase()
    ) {
      return false;
    }
    if (assignmentSearchTerm.trim()) {
      const s = assignmentSearchTerm.trim().toLowerCase();
      return (
        a.teacherName.toLowerCase().includes(s) ||
        a.teacherEmployeeId.toLowerCase().includes(s) ||
        a.className.toLowerCase().includes(s) ||
        a.section.toLowerCase().includes(s) ||
        a.subject.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="admin-admissions-container">
        {/* Feedback Toasts */}
        {successToast && (
          <div className="admin-feedback-toast admin-toast-success">
            <CheckCircle2 size={18} />
            <span>{successToast}</span>
          </div>
        )}

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
            <h1>Teacher &amp; Faculty Management</h1>
            <p>
              Manage teacher profiles, role designations, and allocate classrooms, sections, and subjects across academic sessions.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => handleOpenAssignmentModal()}
              aria-label="Assign teacher to class"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: '#20354A',
                backgroundColor: '#EEF3F8',
                borderColor: '#D5E1ED',
              }}
            >
              <BookOpen size={16} />
              <span>Assign to Class</span>
            </button>

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
        </div>

        {/* 2. Navigation Tabs */}
        <div className="admin-teacher-tabs" role="tablist">
          <button
            type="button"
            className={`admin-teacher-tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
            onClick={() => setActiveTab('directory')}
            role="tab"
            aria-selected={activeTab === 'directory'}
          >
            <Users size={16} />
            <span>Faculty Directory</span>
            <span className="admin-teacher-tab-count">{teachers.length}</span>
          </button>

          <button
            type="button"
            className={`admin-teacher-tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('assignments');
              fetchAssignments();
            }}
            role="tab"
            aria-selected={activeTab === 'assignments'}
          >
            <Layers size={16} />
            <span>Class &amp; Subject Assignments</span>
            <span className="admin-teacher-tab-count">{allAssignments.length}</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: FACULTY DIRECTORY                                       */}
        {/* ============================================================== */}
        {activeTab === 'directory' && (
          <>
            {/* Summary Statistics Cards */}
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

            {/* Search and Filter Toolbar */}
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

            {/* Main Teacher Table / State Area */}
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
                        <th style={{ width: '26%', minWidth: 230 }}>Faculty Member</th>
                        <th style={{ width: '20%', minWidth: 190 }}>Contact</th>
                        <th style={{ width: '16%', minWidth: 150 }}>Department / Role</th>
                        <th style={{ width: '22%', minWidth: 210 }}>Assigned Classes</th>
                        <th style={{ width: '8%', minWidth: 95 }}>Status</th>
                        <th style={{ width: '16%', minWidth: 160, textAlign: 'right' }}>Actions</th>
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
                                    <span
                                      className="admin-teacher-qualification"
                                      title={teacher.qualification}
                                    >
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {teacher.assignedClasses && teacher.assignedClasses.length > 0 ? (
                                <div className="admin-teacher-classes-wrap">
                                  {teacher.assignedClasses.map((ac, idx) => (
                                    <span
                                      key={idx}
                                      className="admin-teacher-class-chip"
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => handleOpenAssignmentModal(teacher)}
                                      title={
                                        ac.subject
                                          ? `Subject: ${ac.subject} (${ac.academicYear || '2026-2027'})`
                                          : `Class: ${ac.className}-${ac.section}`
                                      }
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
                              <button
                                type="button"
                                onClick={() => handleOpenAssignmentModal(teacher)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#20354A',
                                  fontSize: '0.74rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  padding: 0,
                                  textAlign: 'left',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Plus size={11} />
                                <span>Manage assignments</span>
                              </button>
                            </div>
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
                              {/* Manage Assignments action button */}
                              <button
                                type="button"
                                className="admin-teacher-action-btn assign"
                                onClick={() => handleOpenAssignmentModal(teacher)}
                                title="Manage Class & Subject Assignments"
                                aria-label={`Manage assignments for ${teacher.fullName}`}
                              >
                                <BookOpen size={15} />
                              </button>

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
                                title={
                                  teacher.status === 'ACTIVE'
                                    ? 'Deactivate Account'
                                    : 'Activate Account'
                                }
                                aria-label={
                                  teacher.status === 'ACTIVE'
                                    ? `Deactivate ${teacher.fullName}`
                                    : `Activate ${teacher.fullName}`
                                }
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
          </>
        )}

        {/* ============================================================== */}
        {/* TAB 2: CLASS & SUBJECT ASSIGNMENTS MASTER VIEW                 */}
        {/* ============================================================== */}
        {activeTab === 'assignments' && (
          <div>
            {/* Assignments Summary Row */}
            <div className="admin-teacher-summary-grid">
              <div className="admin-teacher-card-stat">
                <div className="admin-teacher-card-stat-info">
                  <span className="admin-teacher-card-stat-label">Total Assignments</span>
                  <span className="admin-teacher-card-stat-value">{allAssignments.length}</span>
                </div>
                <div className="admin-teacher-card-stat-icon admin-stat-icon-blue">
                  <Layers size={22} />
                </div>
              </div>

              <div className="admin-teacher-card-stat">
                <div className="admin-teacher-card-stat-info">
                  <span className="admin-teacher-card-stat-label">Active Assigned Faculty</span>
                  <span className="admin-teacher-card-stat-value">
                    {new Set(allAssignments.map((a) => a.teacherId)).size}
                  </span>
                </div>
                <div className="admin-teacher-card-stat-icon admin-stat-icon-sage">
                  <Users size={22} />
                </div>
              </div>

              <div className="admin-teacher-card-stat">
                <div className="admin-teacher-card-stat-info">
                  <span className="admin-teacher-card-stat-label">Classes Covered</span>
                  <span className="admin-teacher-card-stat-value">
                    {new Set(allAssignments.map((a) => `${a.className}-${a.section}`)).size}
                  </span>
                </div>
                <div className="admin-teacher-card-stat-icon admin-stat-icon-amber">
                  <GraduationCap size={22} />
                </div>
              </div>
            </div>

            {/* Assignments Toolbar */}
            <div className="admin-teacher-toolbar">
              <div className="admin-teacher-search-box">
                <Search size={16} className="admin-teacher-search-icon" />
                <input
                  type="text"
                  placeholder="Filter by teacher, subject, class, staff ID..."
                  className="admin-teacher-search-input"
                  value={assignmentSearchTerm}
                  onChange={(e) => setAssignmentSearchTerm(e.target.value)}
                  aria-label="Search assignments"
                />
                {assignmentSearchTerm && (
                  <button
                    type="button"
                    className="admin-teacher-search-clear"
                    onClick={() => setAssignmentSearchTerm('')}
                    aria-label="Clear assignment filter"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="admin-teacher-filter-group">
                <div className="admin-teacher-select-wrap">
                  <span className="admin-teacher-select-label">Academic Year:</span>
                  <select
                    className="admin-teacher-select"
                    value={assignmentYearFilter}
                    onChange={(e) => setAssignmentYearFilter(e.target.value)}
                    aria-label="Filter by Academic Year"
                  >
                    <option value="ALL">All Academic Years</option>
                    <option value="2026-2027">2026-2027</option>
                    <option value="2025-2026">2025-2026</option>
                  </select>
                  <ChevronDown size={14} className="admin-teacher-select-chevron" />
                </div>

                <div className="admin-teacher-select-wrap">
                  <span className="admin-teacher-select-label">Class:</span>
                  <select
                    className="admin-teacher-select"
                    value={assignmentClassFilter}
                    onChange={(e) => setAssignmentClassFilter(e.target.value)}
                    aria-label="Filter by Class"
                  >
                    <option value="ALL">All Classes</option>
                    {availableClasses.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="admin-teacher-select-chevron" />
                </div>

                <button
                  type="button"
                  className="admin-teacher-btn-refresh"
                  onClick={fetchAssignments}
                  title="Refresh assignments"
                  disabled={assignmentsLoading}
                  aria-label="Refresh assignments list"
                >
                  <RotateCw size={15} className={assignmentsLoading ? 'admin-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Assignments Table Area */}
            {assignmentsLoading ? (
              <div className="admin-table-loading-card">
                <RotateCw size={24} className="admin-spin" style={{ color: '#20354A' }} />
                <p>Loading class assignments...</p>
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="admin-teacher-empty-state">
                <div className="admin-teacher-empty-icon-wrap">
                  <Layers size={30} />
                </div>
                <h3 className="admin-teacher-empty-title">No Assignments Found</h3>
                <p className="admin-teacher-empty-desc">
                  {assignmentSearchTerm ||
                  assignmentClassFilter !== 'ALL' ||
                  assignmentYearFilter !== 'ALL'
                    ? 'No assignments match the selected filters. Try adjusting your search query.'
                    : 'No classes have been assigned to faculty members yet. Click "+ Assign Teacher" to configure subject and classroom responsibilities.'}
                </p>
                <button
                  type="button"
                  className="admin-btn-primary-action"
                  onClick={() => handleOpenAssignmentModal()}
                >
                  <BookOpen size={16} />
                  <span>Assign Teacher to Class</span>
                </button>
              </div>
            ) : (
              <div className="admin-teacher-table-card">
                <div className="admin-teacher-table-scroll">
                  <table className="admin-teacher-table">
                    <thead>
                      <tr>
                        <th style={{ width: '12%', minWidth: 110 }}>Academic Year</th>
                        <th style={{ width: '18%', minWidth: 160 }}>Class &amp; Section</th>
                        <th style={{ width: '20%', minWidth: 170 }}>Subject</th>
                        <th style={{ width: '26%', minWidth: 230 }}>Assigned Teacher</th>
                        <th style={{ width: '12%', minWidth: 120 }}>Enrolled Students</th>
                        <th style={{ width: '12%', minWidth: 110, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssignments.map((assignment) => (
                        <tr key={assignment.id}>
                          {/* Academic Year */}
                          <td>
                            <span className="admin-assignment-year-pill">
                              {assignment.academicYear}
                            </span>
                          </td>

                          {/* Class & Section */}
                          <td>
                            <div className="admin-assignment-class-pill">
                              <span>{assignment.className}</span>
                              <span className="admin-assignment-section-pill">
                                Sec {assignment.section}
                              </span>
                            </div>
                          </td>

                          {/* Subject */}
                          <td>
                            <span className="admin-assignment-subject-tag">
                              <Sparkles size={11} />
                              <span>{assignment.subject}</span>
                            </span>
                          </td>

                          {/* Assigned Faculty */}
                          <td>
                            <div className="admin-teacher-faculty-cell">
                              <div className="admin-teacher-avatar" aria-hidden="true">
                                {getInitials(assignment.teacherName)}
                              </div>
                              <div className="admin-teacher-faculty-info">
                                <span
                                  className="admin-teacher-faculty-name"
                                  title={assignment.teacherName}
                                >
                                  {assignment.teacherName}
                                </span>
                                <div className="admin-teacher-faculty-meta">
                                  <span className="admin-teacher-staff-id">
                                    {assignment.teacherEmployeeId}
                                  </span>
                                  <span className="admin-teacher-qualification">
                                    • {assignment.teacherDepartment}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Enrolled Students Count */}
                          <td>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#FAF9F5',
                                border: '1px solid #E8E5DD',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                color: '#27313A',
                              }}
                            >
                              <Users size={13} style={{ color: '#166534' }} />
                              <span>{assignment.studentCount} Students</span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <div className="admin-teacher-actions-group">
                              <button
                                type="button"
                                className="admin-teacher-action-btn edit"
                                onClick={() => handleStartEditAssignment(assignment)}
                                title="Edit Assignment"
                                aria-label={`Edit assignment for ${assignment.teacherName}`}
                              >
                                <Edit2 size={14} />
                              </button>

                              <button
                                type="button"
                                className="admin-teacher-action-btn delete"
                                onClick={() =>
                                  handleRemoveAssignmentDirect(
                                    assignment.teacherId,
                                    assignment.id,
                                    assignment.className,
                                    assignment.section,
                                    assignment.subject
                                  )
                                }
                                title="Remove Assignment"
                                aria-label={`Remove assignment for ${assignment.teacherName}`}
                              >
                                <Trash2 size={14} />
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
          </div>
        )}

        {/* ============================================================== */}
        {/* TEACHER ASSIGNMENT MODAL (ASSIGN TO CLASS & SECTIONS)          */}
        {/* ============================================================== */}
        {showAssignmentModal && (
          <div className="admin-modal-backdrop" onClick={() => setShowAssignmentModal(false)}>
            <div
              className="admin-modal-card"
              style={{ maxWidth: 680 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-modal-header">
                <div>
                  <h3 className="admin-modal-title">
                    {editingAssignmentId ? 'Edit Class Assignment' : 'Teacher Class Assignment'}
                  </h3>
                  <p className="admin-modal-subtitle">
                    Allocate classrooms, sections, and curriculum subjects to faculty members.
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => setShowAssignmentModal(false)}
                  aria-label="Close assignment modal"
                >
                  <X size={18} />
                </button>
              </div>

              {assignmentModalError && (
                <div
                  className="admin-form-error-banner"
                  style={{
                    margin: '0 24px 14px',
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
                  <span>{assignmentModalError}</span>
                </div>
              )}

              <div
                className="admin-modal-body"
                style={{ maxHeight: '70vh', overflowY: 'auto', padding: '0 24px 20px' }}
              >
                {/* Teacher Profile Summary Banner */}
                {selectedTeacherForAssignment ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: '#FAF9F5',
                      borderRadius: 8,
                      border: '1px solid #E8E5DD',
                      marginBottom: 18,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="admin-teacher-avatar" style={{ width: 40, height: 40 }}>
                        {getInitials(selectedTeacherForAssignment.fullName)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#27313A', fontSize: '0.95rem' }}>
                          {selectedTeacherForAssignment.fullName}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#707781' }}>
                          ID: <strong>{selectedTeacherForAssignment.employeeId}</strong> &bull; Dept:{' '}
                          <strong>{selectedTeacherForAssignment.department}</strong>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`admin-teacher-status-pill ${
                        selectedTeacherForAssignment.status === 'ACTIVE' ? 'active' : 'inactive'
                      }`}
                    >
                      <span className="admin-teacher-status-dot" />
                      <span>{selectedTeacherForAssignment.status}</span>
                    </span>
                  </div>
                ) : (
                  <div className="admin-form-group" style={{ marginBottom: 16 }}>
                    <label className="admin-form-label">
                      Select Faculty Member <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      className="admin-form-select"
                      value={assignmentModalTeacherId}
                      onChange={(e) => handleAssignmentTeacherChange(e.target.value)}
                    >
                      <option value="">-- Select Teacher --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id} disabled={t.status !== 'ACTIVE'}>
                          {t.fullName} ({t.employeeId}) — {t.department} {t.status !== 'ACTIVE' ? '(INACTIVE)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Existing Assignments of this teacher */}
                {selectedTeacherForAssignment &&
                  selectedTeacherForAssignment.assignedClasses &&
                  selectedTeacherForAssignment.assignedClasses.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            color: '#20354A',
                          }}
                        >
                          Current Active Assignments ({selectedTeacherForAssignment.assignedClasses.length})
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: '#707781' }}>
                          Click edit or remove to modify existing allocations
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {selectedTeacherForAssignment.assignedClasses.map((ac, idx) => (
                          <div
                            key={ac.id || idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              backgroundColor:
                                editingAssignmentId === ac.id ? '#FFFBEB' : '#FFFFFF',
                              borderRadius: 6,
                              border: `1px solid ${
                                editingAssignmentId === ac.id ? '#FDE68A' : '#E8E5DD'
                              }`,
                              fontSize: '0.84rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: '#20354A',
                                  fontSize: '0.88rem',
                                }}
                              >
                                {ac.className} - Section {ac.section}
                              </span>

                              <span className="admin-assignment-subject-tag">
                                <Sparkles size={11} />
                                <span>{ac.subject || 'Core Subject'}</span>
                              </span>

                              <span style={{ fontSize: '0.75rem', color: '#707781' }}>
                                ({ac.academicYear || '2026-2027'})
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <button
                                type="button"
                                className="admin-teacher-action-btn edit"
                                style={{ width: 28, height: 28 }}
                                onClick={() =>
                                  handleStartEditAssignment(ac, selectedTeacherForAssignment)
                                }
                                title="Edit this assignment"
                              >
                                <Edit2 size={13} />
                              </button>

                              {ac.id && (
                                <button
                                  type="button"
                                  className="admin-teacher-action-btn delete"
                                  style={{ width: 28, height: 28 }}
                                  onClick={() =>
                                    handleRemoveAssignmentDirect(
                                      selectedTeacherForAssignment.id,
                                      ac.id!,
                                      ac.className,
                                      ac.section,
                                      ac.subject
                                    )
                                  }
                                  title="Remove assignment"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Assignment Form */}
                <form
                  onSubmit={handleSaveAssignment}
                  style={{
                    backgroundColor: '#FAF9F5',
                    padding: 16,
                    borderRadius: 8,
                    border: '1px solid #E8E5DD',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: '#20354A',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Plus size={14} />
                      <span>
                        {editingAssignmentId ? 'Modify Assignment' : 'Assign New Class & Subject'}
                      </span>
                    </h4>

                    {editingAssignmentId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAssignmentId(null);
                          setAssignmentSubject('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#647F99',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Cancel Editing
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {/* Class Selector */}
                    <div className="admin-form-group">
                      <label className="admin-form-label">
                        Class / Grade <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <select
                        className="admin-form-select"
                        value={assignmentClassId}
                        onChange={(e) => handleAssignmentClassChange(e.target.value)}
                        required
                      >
                        <option value="">-- Choose Class --</option>
                        {availableClasses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.academicYear})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Section Selector */}
                    <div className="admin-form-group">
                      <label className="admin-form-label">
                        Section <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      {availableSections.length > 0 ? (
                        <select
                          className="admin-form-select"
                          value={assignmentSection}
                          onChange={(e) => setAssignmentSection(e.target.value)}
                          required
                        >
                          {availableSections.map((sec) => (
                            <option key={sec.id} value={sec.name}>
                              Section {sec.name} {sec.roomNumber ? `(${sec.roomNumber})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="admin-form-input"
                          placeholder="e.g. A"
                          value={assignmentSection}
                          onChange={(e) => setAssignmentSection(e.target.value.toUpperCase())}
                          required
                        />
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr',
                      gap: 12,
                      marginTop: 12,
                    }}
                  >
                    {/* Subject Input */}
                    <div className="admin-form-group">
                      <label className="admin-form-label">
                        Subject <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="admin-form-input"
                        placeholder="e.g. Mathematics, Physics, English"
                        value={assignmentSubject}
                        onChange={(e) => setAssignmentSubject(e.target.value)}
                        required
                      />
                    </div>

                    {/* Academic Year */}
                    <div className="admin-form-group">
                      <label className="admin-form-label">
                        Academic Year <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="admin-form-input"
                        placeholder="2026-2027"
                        value={assignmentAcademicYear}
                        onChange={(e) => setAssignmentAcademicYear(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Subject Quick Suggestions based on Teacher's Department */}
                  {selectedTeacherForAssignment &&
                    DEPARTMENT_SUBJECT_SUGGESTIONS[selectedTeacherForAssignment.department] && (
                      <div style={{ marginTop: 10 }}>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            color: '#707781',
                            display: 'block',
                            marginBottom: 4,
                          }}
                        >
                          Suggested subjects for{' '}
                          <strong>{selectedTeacherForAssignment.department}</strong> department:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {DEPARTMENT_SUBJECT_SUGGESTIONS[
                            selectedTeacherForAssignment.department
                          ].map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => setAssignmentSubject(sug)}
                              style={{
                                padding: '2px 8px',
                                fontSize: '0.74rem',
                                borderRadius: 4,
                                border: '1px solid #D5E1ED',
                                backgroundColor:
                                  assignmentSubject.toLowerCase() === sug.toLowerCase()
                                    ? '#20354A'
                                    : '#FFFFFF',
                                color:
                                  assignmentSubject.toLowerCase() === sug.toLowerCase()
                                    ? '#FFFFFF'
                                    : '#20354A',
                                cursor: 'pointer',
                              }}
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Submit Button */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 8,
                      marginTop: 14,
                      borderTop: '1px solid #E8E5DD',
                      paddingTop: 12,
                    }}
                  >
                    <button
                      type="submit"
                      className="admin-btn-primary-action"
                      disabled={isSavingAssignment}
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      {isSavingAssignment ? (
                        <>
                          <RotateCw size={14} className="admin-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>
                          {editingAssignmentId ? 'Update Assignment' : 'Confirm & Assign Class'}
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setShowAssignmentModal(false)}
                >
                  Close
                </button>
              </div>
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
                      <label className="admin-form-label">Staff / Employee ID</label>
                      <input
                        type="text"
                        className="admin-form-input"
                        placeholder="Auto-generated if empty (e.g. TCH-0001)"
                        value={formEmployeeId}
                        onChange={(e) => setFormEmployeeId(e.target.value)}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 16,
                      marginTop: 14,
                    }}
                  >
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
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#707781',
                        marginTop: 4,
                        display: 'block',
                      }}
                    >
                      {editingTeacher
                        ? 'Entering a password here updates the teacher credentials for portal login.'
                        : 'Teacher will use this password to sign in to the portal via the Teacher login option.'}
                    </span>
                  </div>

                  {/* Department & Designation */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 16,
                      marginTop: 14,
                    }}
                  >
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
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr',
                      gap: 16,
                      marginTop: 14,
                    }}
                  >
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
                  <div
                    style={{
                      marginTop: 22,
                      borderTop: '1px solid #E8E5DD',
                      paddingTop: 16,
                    }}
                  >
                    <label
                      className="admin-form-label"
                      style={{ marginBottom: 8, display: 'block' }}
                    >
                      Class &amp; Subject Assignments
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
                        onClick={handleAddAssignmentDraft}
                      >
                        <Plus size={14} />
                        <span>Add</span>
                      </button>
                    </div>

                    {/* Assigned pills */}
                    {formAssignedClasses.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 6,
                          marginTop: 10,
                        }}
                      >
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
                              onClick={() => handleRemoveAssignmentDraft(idx)}
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
                  <p className="admin-modal-subtitle">
                    Official staff credentials and school responsibilities.
                  </p>
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: 20,
                  }}
                >
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
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        marginTop: 4,
                      }}
                    >
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
                    <span style={{ color: '#707781', fontSize: '0.78rem', display: 'block' }}>
                      Email
                    </span>
                    <strong style={{ color: '#27313A' }}>{selectedTeacherForView.email}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#707781', fontSize: '0.78rem', display: 'block' }}>
                      Phone
                    </span>
                    <strong style={{ color: '#27313A' }}>{selectedTeacherForView.phone}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#707781', fontSize: '0.78rem', display: 'block' }}>
                      Department
                    </span>
                    <strong style={{ color: '#27313A' }}>
                      {selectedTeacherForView.department || 'General'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#707781', fontSize: '0.78rem', display: 'block' }}>
                      Designation
                    </span>
                    <strong style={{ color: '#27313A' }}>
                      {selectedTeacherForView.designation || 'Teacher'}
                    </strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#707781', fontSize: '0.78rem', display: 'block' }}>
                      Qualification
                    </span>
                    <strong style={{ color: '#27313A' }}>
                      {selectedTeacherForView.qualification || 'Not specified'}
                    </strong>
                  </div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <h5 style={{ margin: 0, fontSize: '0.88rem', color: '#20354A' }}>
                      Assigned Classes &amp; Subjects
                    </h5>
                    <button
                      type="button"
                      onClick={() => {
                        const t = selectedTeacherForView;
                        setSelectedTeacherForView(null);
                        handleOpenAssignmentModal(t);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#20354A',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <BookOpen size={13} />
                      <span>Manage Assignments</span>
                    </button>
                  </div>

                  {selectedTeacherForView.assignedClasses &&
                  selectedTeacherForView.assignedClasses.length > 0 ? (
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
                          {ac.subject && (
                            <span style={{ color: '#647F99' }}> — {ac.subject}</span>
                          )}
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
            <div
              className="admin-modal-card admin-confirm-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
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
