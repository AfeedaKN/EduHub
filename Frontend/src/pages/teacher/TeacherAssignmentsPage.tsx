import React, { useEffect, useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileEdit,
  Trash2,
  Eye,
  X,
  ExternalLink,
  Layers,
  Check,
  AlertTriangle,
  Users,
  GraduationCap,
  FileText,
  Download,
  HelpCircle,
  History,
} from 'lucide-react';

import { TeacherLayout } from '../../components/teacher/TeacherLayout';
import { teacherApi } from '../../api/teacherApi';
import { getApiErrorMessage } from '../../api/axiosClient';
import type {
  Assignment,
  AssignmentStatus,
  AssignmentSummaryStats,
  CreateAssignmentPayload,
  UpdateAssignmentPayload,
  TeacherSubmissionItem,
} from '../../types/assignment.types';
import type { TeacherClassItem } from '../../types/teacher.types';

const ACADEMIC_YEARS = ['2026-2027', '2027-2028', '2025-2026'];

export const TeacherAssignmentsPage: React.FC = () => {
  // Primary data states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [summary, setSummary] = useState<AssignmentSummaryStats>({
    total: 0,
    published: 0,
    drafts: 0,
    pastDue: 0,
  });
  const [teacherClasses, setTeacherClasses] = useState<TeacherClassItem[]>([]);

  // Filter states
  const [selectedYear, setSelectedYear] = useState<string>('2026-2027');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals & Action states
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [deleteConfirmAssignment, setDeleteConfirmAssignment] = useState<Assignment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Submissions list modal states
  const [submissionsModalAssignment, setSubmissionsModalAssignment] = useState<Assignment | null>(null);
  const [submissionsList, setSubmissionsList] = useState<TeacherSubmissionItem[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState<boolean>(false);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);
  const [subFilterStatus, setSubFilterStatus] = useState<string>('ALL');
  const [subSearchQuery, setSubSearchQuery] = useState<string>('');

  // Grading & Review modal states
  const [gradingSubmission, setGradingSubmission] = useState<TeacherSubmissionItem | null>(null);
  const [gradingMarksInput, setGradingMarksInput] = useState<string>('');
  const [gradingFeedbackInput, setGradingFeedbackInput] = useState<string>('');
  const [gradingError, setGradingError] = useState<string | null>(null);
  const [isSavingReview, setIsSavingReview] = useState<boolean>(false);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState<boolean>(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formClass, setFormClass] = useState<string>('');
  const [formSection, setFormSection] = useState<string>('');
  const [formSubject, setFormSubject] = useState<string>('');
  const [formAcademicYear, setFormAcademicYear] = useState<string>('2026-2027');
  const [formAssignedDate, setFormAssignedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formDueDate, setFormDueDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [formMaxMarks, setFormMaxMarks] = useState<number>(50);
  const [formAttachmentUrl, setFormAttachmentUrl] = useState<string>('');
  const [formAttachmentName, setFormAttachmentName] = useState<string>('');

  // Show auto-dismiss toast
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch initial assigned classes and assignments
  const fetchTeacherClasses = async () => {
    try {
      const res = await teacherApi.getMyClasses();
      if (res.success && res.data) {
        setTeacherClasses(res.data);
      }
    } catch (err) {
      console.error('Failed to load teacher classes:', err);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await teacherApi.getAssignments({
        academicYear: selectedYear === 'ALL' ? undefined : selectedYear,
        className: selectedClass === 'ALL' ? undefined : selectedClass,
        section: selectedSection === 'ALL' ? undefined : selectedSection,
        subject: selectedSubject === 'ALL' ? undefined : selectedSubject,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        search: searchTerm.trim() ? searchTerm.trim() : undefined,
      });

      if (res.success && res.data) {
        setAssignments(res.data.assignments || []);
        setSummary(
          res.data.summary || {
            total: 0,
            published: 0,
            drafts: 0,
            pastDue: 0,
          }
        );
      }
    } catch (err: unknown) {
      console.error('Failed to fetch assignments:', err);
      setError(
        getApiErrorMessage(
          err,
          'Failed to load assignments. Please check your connection and try again.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherClasses();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [selectedYear, selectedClass, selectedSection, selectedSubject, selectedStatus, searchTerm]);

  // Derived filter options from teacherClasses
  const distinctClasses = useMemo(() => {
    const set = new Set<string>();
    teacherClasses.forEach((c) => set.add(c.className));
    return Array.from(set);
  }, [teacherClasses]);

  const availableSections = useMemo(() => {
    if (selectedClass === 'ALL') {
      const set = new Set<string>();
      teacherClasses.forEach((c) => set.add(c.section));
      return Array.from(set);
    }
    return teacherClasses
      .filter((c) => c.className.toLowerCase() === selectedClass.toLowerCase())
      .map((c) => c.section);
  }, [teacherClasses, selectedClass]);

  const availableSubjects = useMemo(() => {
    const list: string[] = [];
    teacherClasses.forEach((c) => {
      if (
        (selectedClass === 'ALL' || c.className.toLowerCase() === selectedClass.toLowerCase()) &&
        (selectedSection === 'ALL' || c.section.toLowerCase() === selectedSection.toLowerCase()) &&
        c.subject
      ) {
        if (!list.includes(c.subject)) list.push(c.subject);
      }
    });
    return list;
  }, [teacherClasses, selectedClass, selectedSection]);

  // Derived modal options for section and subject based on formClass
  const modalAvailableSections = useMemo(() => {
    if (!formClass) return [];
    const sections = teacherClasses
      .filter((c) => c.className.toLowerCase() === formClass.toLowerCase())
      .map((c) => c.section);
    return Array.from(new Set(sections));
  }, [teacherClasses, formClass]);

  const modalAvailableSubjects = useMemo(() => {
    if (!formClass) return [];
    const subjects = teacherClasses
      .filter(
        (c) =>
          c.className.toLowerCase() === formClass.toLowerCase() &&
          (!formSection || c.section.toLowerCase() === formSection.toLowerCase()) &&
          c.subject
      )
      .map((c) => c.subject!);
    return Array.from(new Set(subjects));
  }, [teacherClasses, formClass, formSection]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingAssignment(null);
    setFormError(null);

    const firstClass = teacherClasses[0];
    const defaultClassName = firstClass?.className || '';
    const defaultSec = firstClass?.section || '';
    const defaultSub = firstClass?.subject || '';

    setFormTitle('');
    setFormDescription('');
    setFormClass(defaultClassName);
    setFormSection(defaultSec);
    setFormSubject(defaultSub);
    setFormAcademicYear(selectedYear !== 'ALL' ? selectedYear : '2026-2027');
    setFormAssignedDate(new Date().toISOString().split('T')[0]);
    setFormDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setFormMaxMarks(50);
    setFormAttachmentUrl('');
    setFormAttachmentName('');

    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormError(null);

    setFormTitle(assignment.title);
    setFormDescription(assignment.description);
    setFormClass(assignment.className);
    setFormSection(assignment.section);
    setFormSubject(assignment.subject);
    setFormAcademicYear(assignment.academicYear);
    setFormAssignedDate(assignment.assignedDate);
    setFormDueDate(assignment.dueDate);
    setFormMaxMarks(assignment.maxMarks);
    setFormAttachmentUrl(assignment.attachmentUrl || '');
    setFormAttachmentName(assignment.attachmentName || '');

    setIsFormModalOpen(true);
  };

  // Cascading class selection in form
  const handleFormClassChange = (newClass: string) => {
    setFormClass(newClass);
    const matches = teacherClasses.filter((c) => c.className.toLowerCase() === newClass.toLowerCase());
    if (matches.length > 0) {
      setFormSection(matches[0].section);
      if (matches[0].subject) setFormSubject(matches[0].subject);
    } else {
      setFormSection('');
      setFormSubject('');
    }
  };

  // Submit Form (Draft or Published)
  const handleSubmitForm = async (status: AssignmentStatus) => {
    setFormError(null);

    // Validation checks
    if (!formTitle.trim()) {
      setFormError('Assignment title is required.');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('Assignment instructions / description is required.');
    }
    if (!formClass) {
      setFormError('Please select a class.');
      return;
    }
    if (!formSection) {
      setFormError('Please select a section.');
      return;
    }
    if (!formSubject) {
      setFormError('Please select a subject.');
      return;
    }
    if (!formDueDate) {
      setFormError('Please provide a valid due date.');
      return;
    }
    if (formDueDate < formAssignedDate) {
      setFormError('Due date cannot be earlier than the assigned date.');
      return;
    }
    if (Number(formMaxMarks) <= 0) {
      setFormError('Maximum marks must be a positive number.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: CreateAssignmentPayload = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        className: formClass,
        section: formSection,
        subject: formSubject,
        academicYear: formAcademicYear,
        assignedDate: formAssignedDate,
        dueDate: formDueDate,
        maxMarks: Number(formMaxMarks),
        status,
        attachmentUrl: formAttachmentUrl.trim() || undefined,
        attachmentName: formAttachmentName.trim() || undefined,
      };

      if (editingAssignment) {
        const res = await teacherApi.updateAssignment(editingAssignment.id, payload as UpdateAssignmentPayload);
        if (res.success) {
          showToast(`Assignment "${res.data.title}" updated successfully.`);
          setIsFormModalOpen(false);
          fetchAssignments();
        }
      } else {
        const res = await teacherApi.createAssignment(payload);
        if (res.success) {
          showToast(
            status === 'DRAFT'
              ? 'Assignment saved as Draft.'
              : `Assignment "${res.data.title}" published successfully.`
          );
          setIsFormModalOpen(false);
          fetchAssignments();
        }
      }
    } catch (err: unknown) {
      console.error('Failed to save assignment:', err);
      setFormError(
        getApiErrorMessage(
          err,
          'Failed to save assignment. Please check all fields and try again.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle status between PUBLISHED and DRAFT
  const handleToggleStatus = async (assignment: Assignment) => {
    const newStatus: AssignmentStatus = assignment.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const res = await teacherApi.updateAssignmentStatus(assignment.id, newStatus);
      if (res.success) {
        showToast(
          newStatus === 'PUBLISHED'
            ? `Assignment "${assignment.title}" is now Published.`
            : `Assignment "${assignment.title}" moved to Drafts.`
        );
        fetchAssignments();
      }
    } catch (err: unknown) {
      console.error('Failed to update assignment status:', err);
      showToast(getApiErrorMessage(err, 'Failed to update assignment status.'), 'error');
    }
  };

  // Delete Assignment
  const handleConfirmDelete = async () => {
    if (!deleteConfirmAssignment) return;
    try {
      setIsSubmitting(true);
      const res = await teacherApi.deleteAssignment(deleteConfirmAssignment.id);
      if (res.success) {
        showToast(`Assignment "${deleteConfirmAssignment.title}" deleted.`);
        setDeleteConfirmAssignment(null);
        fetchAssignments();
      }
    } catch (err: unknown) {
      console.error('Failed to delete assignment:', err);
      showToast(getApiErrorMessage(err, 'Failed to delete assignment.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date and time
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  // Helper: check if assignment is past due
  const todayStr = new Date().toISOString().split('T')[0];
  const isPastDue = (dueDate: string) => dueDate < todayStr;

  // Open Submissions Modal
  const handleOpenSubmissionsModal = async (assignment: Assignment) => {
    setSubmissionsModalAssignment(assignment);
    setSubFilterStatus('ALL');
    setSubSearchQuery('');
    setSubmissionsLoading(true);
    setSubmissionsError(null);
    try {
      const res = await teacherApi.getAssignmentSubmissions(assignment.id);
      if (res.success && res.data) {
        setSubmissionsList(res.data);
      }
    } catch (err: unknown) {
      console.error('Failed to load submissions:', err);
      setSubmissionsError(getApiErrorMessage(err, 'Failed to load student submissions.'));
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // Filtered submissions list
  const filteredSubmissions = useMemo(() => {
    return submissionsList.filter((s) => {
      const q = subSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.studentName.toLowerCase().includes(q) ||
        s.studentAdmissionNumber.toLowerCase().includes(q) ||
        s.studentRollNumber.toLowerCase().includes(q);

      let matchesStatus = true;
      if (subFilterStatus === 'LATE') {
        matchesStatus = s.isLate;
      } else if (subFilterStatus === 'GRADED') {
        matchesStatus = s.status === 'GRADED' || s.isPublished;
      } else if (subFilterStatus === 'UNDER_REVIEW') {
        matchesStatus = s.status === 'UNDER_REVIEW' || s.gradingStatus === 'UNDER_REVIEW';
      } else if (subFilterStatus === 'SUBMITTED') {
        matchesStatus = s.status === 'SUBMITTED' || s.status === 'RESUBMITTED';
      }

      return matchesSearch && matchesStatus;
    });
  }, [submissionsList, subSearchQuery, subFilterStatus]);

  // Open Review / Grading Modal
  const handleOpenGradingModal = (sub: TeacherSubmissionItem) => {
    setGradingSubmission(sub);
    setGradingMarksInput(
      sub.marksObtained !== null && sub.marksObtained !== undefined ? String(sub.marksObtained) : ''
    );
    setGradingFeedbackInput(sub.feedback || '');
    setGradingError(null);
    setIsPublishConfirmOpen(false);
  };

  // Save Review (draft or publish)
  const handleSaveReview = async (publishResult: boolean) => {
    if (!submissionsModalAssignment || !gradingSubmission || isSavingReview) return;

    setGradingError(null);

    // Validate marks
    if (gradingMarksInput === '' || gradingMarksInput.trim() === '') {
      setGradingError('Please enter marks awarded before saving.');
      return;
    }

    const marksNum = Number(gradingMarksInput);
    if (isNaN(marksNum)) {
      setGradingError('Marks awarded must be a valid number.');
      return;
    }

    if (marksNum < 0) {
      setGradingError('Marks cannot be negative.');
      return;
    }

    if (marksNum > submissionsModalAssignment.maxMarks) {
      setGradingError(
        `Marks cannot exceed maximum marks of ${submissionsModalAssignment.maxMarks}.`
      );
      return;
    }

    if (gradingFeedbackInput.length > 2000) {
      setGradingError('Teacher feedback cannot exceed 2,000 characters.');
      return;
    }

    try {
      setIsSavingReview(true);
      const res = await teacherApi.gradeSubmission(
        submissionsModalAssignment.id,
        gradingSubmission.id,
        {
          marksObtained: marksNum,
          feedback: gradingFeedbackInput.trim(),
          publishResult,
        }
      );

      if (res.success && res.data) {
        const updatedSub = res.data;

        // Update local submissions list
        setSubmissionsList((prev) =>
          prev.map((s) => (s.id === updatedSub.id ? updatedSub : s))
        );

        // Compute updated stats
        const updatedSubmissions = submissionsList.map((s) =>
          s.id === updatedSub.id ? updatedSub : s
        );
        const total = updatedSubmissions.length;
        const graded = updatedSubmissions.filter((s) => s.isPublished).length;
        const pending = Math.max(0, total - graded);

        const newStats = { total, pending, graded };

        setSubmissionsModalAssignment((prev) =>
          prev ? { ...prev, submissionStats: newStats } : null
        );

        setAssignments((prev) =>
          prev.map((a) =>
            a.id === submissionsModalAssignment.id ? { ...a, submissionStats: newStats } : a
          )
        );

        showToast(
          publishResult
            ? `Result published successfully for ${gradingSubmission.studentName}!`
            : `Draft review saved for ${gradingSubmission.studentName}.`
        );

        setGradingSubmission(null);
        setIsPublishConfirmOpen(false);
      }
    } catch (err: unknown) {
      console.error('Failed to save review:', err);
      setGradingError(
        getApiErrorMessage(
          err,
          'Failed to save review. Please check your connection and try again.'
        )
      );
      setIsPublishConfirmOpen(false);
    } finally {
      setIsSavingReview(false);
    }
  };

  return (
    <TeacherLayout>
      <div style={{ maxWidth: 1360, margin: '0 auto', width: '100%' }}>
        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 18px',
              borderRadius: 8,
              backgroundColor: toastMessage.type === 'success' ? '#10B981' : '#EF4444',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              fontSize: '0.86rem',
              fontWeight: 500,
              animation: 'fadeIn 0.2s ease',
            }}
          >
            {toastMessage.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* 1. Page Header Section */}
        <section
          className="teacher-welcome-section"
          style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--teacher-muted-blue)',
                  backgroundColor: 'var(--teacher-primary-light)',
                  padding: '3px 8px',
                  borderRadius: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <BookOpen size={12} />
                Coursework Management
              </span>
            </div>
            <h1 className="teacher-welcome-heading">Assignments</h1>
            <p className="teacher-welcome-subtitle">
              Create and manage assignments, homework exercises, and grading rubrics for your classes.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: 6,
                border: '1px solid var(--teacher-border)',
                backgroundColor: 'var(--teacher-surface)',
                color: 'var(--teacher-primary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {ACADEMIC_YEARS.map((yr) => (
                <option key={yr} value={yr}>
                  Academic Year: {yr}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="teacher-btn-refresh"
              onClick={fetchAssignments}
              disabled={loading}
              title="Refresh assignments"
            >
              <RotateCw size={14} className={loading ? 'teacher-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                backgroundColor: 'var(--teacher-primary)',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: 6,
                fontSize: '0.84rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                boxShadow: '0 2px 6px rgba(32, 53, 74, 0.15)',
              }}
            >
              <Plus size={16} />
              <span>Create Assignment</span>
            </button>
          </div>
        </section>

        {/* 2. Key Metrics Row (4 Cards) */}
        <section className="teacher-summary-cards-row" aria-label="Assignments Metrics" style={{ marginBottom: 24 }}>
          {/* Metric 1: Total Assignments */}
          <div className="teacher-summary-card">
            <div className="teacher-card-top-row">
              <span className="teacher-card-label">Total Assignments</span>
              <div className="teacher-card-icon-wrap icon-blue">
                <BookOpen size={16} />
              </div>
            </div>
            <div className="teacher-card-value-row">
              <div className="teacher-card-value">{summary.total}</div>
              <span className="teacher-card-indicator">All</span>
            </div>
            <div className="teacher-card-subtext">Total coursework created for your sections</div>
          </div>

          {/* Metric 2: Published */}
          <div className="teacher-summary-card">
            <div className="teacher-card-top-row">
              <span className="teacher-card-label">Published</span>
              <div className="teacher-card-icon-wrap icon-sage">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="teacher-card-value-row">
              <div className="teacher-card-value">{summary.published}</div>
              <span className="teacher-card-indicator indicator-sage">Active</span>
            </div>
            <div className="teacher-card-subtext">Live tasks visible to students &amp; parents</div>
          </div>

          {/* Metric 3: Drafts */}
          <div className="teacher-summary-card">
            <div className="teacher-card-top-row">
              <span className="teacher-card-label">Drafts</span>
              <div className="teacher-card-icon-wrap icon-amber">
                <FileEdit size={16} />
              </div>
            </div>
            <div className="teacher-card-value-row">
              <div className="teacher-card-value">{summary.drafts}</div>
              <span className="teacher-card-indicator indicator-muted">Unpublished</span>
            </div>
            <div className="teacher-card-subtext">Saved drafts pending publication</div>
          </div>

          {/* Metric 4: Past Due */}
          <div className="teacher-summary-card">
            <div className="teacher-card-top-row">
              <span className="teacher-card-label">Past Due</span>
              <div
                className="teacher-card-icon-wrap"
                style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
              >
                <Clock size={16} />
              </div>
            </div>
            <div className="teacher-card-value-row">
              <div className="teacher-card-value" style={{ color: summary.pastDue > 0 ? '#DC2626' : undefined }}>
                {summary.pastDue}
              </div>
              <span
                className="teacher-card-indicator"
                style={
                  summary.pastDue > 0
                    ? { backgroundColor: '#FEE2E2', color: '#DC2626', borderColor: '#FECACA' }
                    : undefined
                }
              >
                Overdue
              </span>
            </div>
            <div className="teacher-card-subtext">Published assignments past submission deadline</div>
          </div>
        </section>

        {/* 3. Search and Filter Toolbar */}
        <div
          style={{
            backgroundColor: 'var(--teacher-surface)',
            border: '1px solid var(--teacher-border)',
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
            boxShadow: 'var(--teacher-shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 220 }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--teacher-text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search by assignment title, subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: 6,
                  border: '1px solid var(--teacher-border)',
                  backgroundColor: 'var(--teacher-bg-subtle)',
                  color: 'var(--teacher-text-main)',
                  fontSize: '0.84rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--teacher-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection('ALL');
                setSelectedSubject('ALL');
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--teacher-border)',
                backgroundColor: 'var(--teacher-bg-subtle)',
                color: 'var(--teacher-text-main)',
                fontSize: '0.82rem',
                outline: 'none',
                minWidth: 140,
              }}
            >
              <option value="ALL">All Classes</option>
              {distinctClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>

            {/* Section Filter */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--teacher-border)',
                backgroundColor: 'var(--teacher-bg-subtle)',
                color: 'var(--teacher-text-main)',
                fontSize: '0.82rem',
                outline: 'none',
                minWidth: 120,
              }}
            >
              <option value="ALL">All Sections</option>
              {availableSections.map((sec) => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>

            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--teacher-border)',
                backgroundColor: 'var(--teacher-bg-subtle)',
                color: 'var(--teacher-text-main)',
                fontSize: '0.82rem',
                outline: 'none',
                minWidth: 130,
              }}
            >
              <option value="ALL">All Subjects</option>
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--teacher-border)',
                backgroundColor: 'var(--teacher-bg-subtle)',
                color: 'var(--teacher-text-main)',
                fontSize: '0.82rem',
                outline: 'none',
                minWidth: 130,
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="PAST_DUE">Past Due</option>
            </select>

            {/* Reset Filters Button */}
            {(selectedClass !== 'ALL' ||
              selectedSection !== 'ALL' ||
              selectedSubject !== 'ALL' ||
              selectedStatus !== 'ALL' ||
              searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedClass('ALL');
                  setSelectedSection('ALL');
                  setSelectedSubject('ALL');
                  setSelectedStatus('ALL');
                  setSearchTerm('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--teacher-muted-blue)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 8px',
                }}
              >
                <X size={12} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. Error State */}
        {error && (
          <div className="teacher-error-banner" role="alert" style={{ marginBottom: 20 }}>
            <div className="teacher-error-content">
              <AlertCircle size={22} className="teacher-error-icon" />
              <div>
                <h3 className="teacher-error-title">Error Loading Assignments</h3>
                <p className="teacher-error-desc">{error}</p>
              </div>
            </div>
            <button type="button" className="teacher-retry-btn" onClick={fetchAssignments}>
              <RotateCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* 5. Loading Skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="teacher-skeleton-pulse"
                style={{ height: 84, borderRadius: 8 }}
              />
            ))}
          </div>
        )}

        {/* 6. Empty State */}
        {!loading && !error && assignments.length === 0 && (
          <div
            className="teacher-panel-card"
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: 'var(--teacher-primary-light)',
                color: 'var(--teacher-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4,
              }}
            >
              <BookOpen size={28} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--teacher-primary)', margin: 0 }}>
              No Assignments Found
            </h3>
            <p
              style={{
                fontSize: '0.86rem',
                color: 'var(--teacher-text-muted)',
                maxWidth: 440,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {searchTerm || selectedClass !== 'ALL' || selectedStatus !== 'ALL'
                ? 'No coursework assignments match your filter criteria. Try resetting your search filters.'
                : "You haven't scheduled any assignments for your classes yet. Create your first assignment to get started."}
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'var(--teacher-primary)',
                color: '#FFFFFF',
                padding: '9px 18px',
                borderRadius: 6,
                fontSize: '0.84rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                marginTop: 8,
              }}
            >
              <Plus size={16} />
              <span>Create First Assignment</span>
            </button>
          </div>
        )}

        {/* 7. Assignments Table / List */}
        {!loading && !error && assignments.length > 0 && (
          <div
            style={{
              backgroundColor: 'var(--teacher-surface)',
              border: '1px solid var(--teacher-border)',
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: 'var(--teacher-shadow-card)',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '0.84rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--teacher-border)',
                      backgroundColor: 'var(--teacher-bg-subtle)',
                      color: 'var(--teacher-text-muted)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <th style={{ padding: '14px 18px' }}>Assignment &amp; Task</th>
                    <th style={{ padding: '14px 14px' }}>Class / Section</th>
                    <th style={{ padding: '14px 14px' }}>Subject</th>
                    <th style={{ padding: '14px 14px' }}>Assigned</th>
                    <th style={{ padding: '14px 14px' }}>Due Date</th>
                    <th style={{ padding: '14px 14px' }}>Max Marks</th>
                    <th style={{ padding: '14px 14px' }}>Submissions</th>
                    <th style={{ padding: '14px 14px' }}>Status</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((item) => {
                    const overdue = item.status === 'PUBLISHED' && isPastDue(item.dueDate);
                    const isDueToday = item.dueDate === todayStr;

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid var(--teacher-border-subtle)',
                          transition: 'background-color 0.12s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--teacher-bg-subtle)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {/* Assignment Title & Snippet */}
                        <td style={{ padding: '14px 18px', maxWidth: 280 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              color: 'var(--teacher-primary)',
                              fontSize: '0.9rem',
                              marginBottom: 3,
                            }}
                          >
                            {item.title}
                          </div>
                          <div
                            style={{
                              color: 'var(--teacher-text-muted)',
                              fontSize: '0.78rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: 260,
                            }}
                          >
                            {item.description}
                          </div>
                          {item.attachmentUrl && (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                color: 'var(--teacher-muted-blue)',
                                fontSize: '0.72rem',
                                marginTop: 4,
                              }}
                            >
                              <ExternalLink size={11} />
                              <span>{item.attachmentName || 'Attached resource'}</span>
                            </div>
                          )}
                        </td>

                        {/* Class & Section Badge */}
                        <td style={{ padding: '14px 14px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 4,
                              backgroundColor: 'var(--teacher-primary-light)',
                              color: 'var(--teacher-primary)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <Layers size={11} />
                            {item.className} - {item.section}
                          </span>
                        </td>

                        {/* Subject */}
                        <td style={{ padding: '14px 14px' }}>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: 'var(--teacher-text-main)',
                            }}
                          >
                            {item.subject}
                          </span>
                        </td>

                        {/* Assigned Date */}
                        <td style={{ padding: '14px 14px', color: 'var(--teacher-text-muted)', fontSize: '0.8rem' }}>
                          {item.assignedDate}
                        </td>

                        {/* Due Date with indicator */}
                        <td style={{ padding: '14px 14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.82rem', color: overdue ? '#DC2626' : 'var(--teacher-text-main)' }}>
                              {item.dueDate}
                            </span>
                            {overdue && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  color: '#DC2626',
                                  backgroundColor: '#FEE2E2',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  display: 'inline-block',
                                  width: 'fit-content',
                                }}
                              >
                                Past Due
                              </span>
                            )}
                            {isDueToday && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  color: '#B45309',
                                  backgroundColor: '#FEF3C7',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  display: 'inline-block',
                                  width: 'fit-content',
                                }}
                              >
                                Due Today
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Max Marks */}
                        <td style={{ padding: '14px 14px' }}>
                          <span
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              color: 'var(--teacher-primary)',
                            }}
                          >
                            {item.maxMarks} pts
                          </span>
                        </td>

                        {/* Submissions Stats Column */}
                        <td style={{ padding: '14px 14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--teacher-primary)' }}>
                                {item.submissionStats?.total || 0} Total
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                              {(item.submissionStats?.pending || 0) > 0 ? (
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    backgroundColor: '#FEF3C7',
                                    color: '#92400E',
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    border: '1px solid #FDE68A',
                                  }}
                                  title="Submissions awaiting evaluation"
                                >
                                  {item.submissionStats?.pending} Pending
                                </span>
                              ) : null}
                              {(item.submissionStats?.graded || 0) > 0 ? (
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    backgroundColor: '#ECFDF5',
                                    color: '#065F46',
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    border: '1px solid #A7F3D0',
                                  }}
                                  title="Graded submissions published"
                                >
                                  {item.submissionStats?.graded} Graded
                                </span>
                              ) : null}
                              {(!item.submissionStats || item.submissionStats.total === 0) && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--teacher-text-muted)' }}>
                                  0 submitted
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td style={{ padding: '14px 14px' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 10,
                              backgroundColor:
                                item.status === 'PUBLISHED'
                                  ? 'var(--teacher-sage-light)'
                                  : item.status === 'DRAFT'
                                  ? '#FEF3C7'
                                  : '#F3F4F6',
                              color:
                                item.status === 'PUBLISHED'
                                  ? '#2E4B28'
                                  : item.status === 'DRAFT'
                                  ? '#92400E'
                                  : '#4B5563',
                              border:
                                item.status === 'PUBLISHED'
                                  ? '1px solid var(--teacher-sage-border)'
                                  : '1px solid #FDE68A',
                            }}
                          >
                            {item.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {/* View / Grade Submissions Action */}
                            <button
                              type="button"
                              onClick={() => handleOpenSubmissionsModal(item)}
                              title="View & grade submissions"
                              style={{
                                padding: '4px 9px',
                                borderRadius: 5,
                                border: '1px solid var(--teacher-border)',
                                backgroundColor: 'var(--teacher-primary-light)',
                                color: 'var(--teacher-primary)',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <Users size={12} />
                              <span>Submissions ({item.submissionStats?.total || 0})</span>
                            </button>

                            {/* View Details */}
                            <button
                              type="button"
                              onClick={() => setViewingAssignment(item)}
                              title="View assignment details"
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 5,
                                border: '1px solid var(--teacher-border)',
                                backgroundColor: 'var(--teacher-surface)',
                                color: 'var(--teacher-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <Eye size={13} />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              title="Edit assignment"
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 5,
                                border: '1px solid var(--teacher-border)',
                                backgroundColor: 'var(--teacher-surface)',
                                color: 'var(--teacher-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <FileEdit size={13} />
                            </button>

                            {/* Publish / Unpublish Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(item)}
                              title={item.status === 'PUBLISHED' ? 'Move to Draft' : 'Publish Assignment'}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 5,
                                border: '1px solid var(--teacher-border)',
                                backgroundColor:
                                  item.status === 'PUBLISHED'
                                    ? 'var(--teacher-surface)'
                                    : 'var(--teacher-primary-light)',
                                color:
                                  item.status === 'PUBLISHED'
                                    ? 'var(--teacher-text-muted)'
                                    : 'var(--teacher-primary)',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {item.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmAssignment(item)}
                              title="Delete assignment"
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 5,
                                border: '1px solid #FECACA',
                                backgroundColor: '#FFF5F5',
                                color: '#DC2626',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer info */}
            <div
              style={{
                padding: '12px 18px',
                borderTop: '1px solid var(--teacher-border)',
                backgroundColor: 'var(--teacher-bg-subtle)',
                color: 'var(--teacher-text-muted)',
                fontSize: '0.78rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>
                Showing {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'}
              </span>
              <span>Academic Session {selectedYear}</span>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* CREATE / EDIT ASSIGNMENT MODAL                                  */}
        {/* ============================================================== */}
        {isFormModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(18, 30, 43, 0.5)',
              backdropFilter: 'blur(2px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid var(--teacher-border)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                width: '100%',
                maxWidth: 620,
                maxHeight: '90vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '18px 22px',
                  borderBottom: '1px solid var(--teacher-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--teacher-primary)', margin: 0 }}>
                    {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: 'var(--teacher-text-muted)', margin: '2px 0 0' }}>
                    Configure coursework details, class targeting, due dates, and grading criteria.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--teacher-text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitForm('PUBLISHED');
                }}
                style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                {/* Form Error Banner */}
                {formError && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 6,
                      backgroundColor: '#FEE2E2',
                      border: '1px solid #FCA5A5',
                      color: '#B91C1C',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Assignment Title */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: 'var(--teacher-text-main)',
                      marginBottom: 5,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Assignment Title <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chapter 4 Thermodynamics Practice Problems"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--teacher-border)',
                      fontSize: '0.86rem',
                      color: 'var(--teacher-text-main)',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Instructions / Description */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: 'var(--teacher-text-main)',
                      marginBottom: 5,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Instructions / Description <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide detailed instructions, expected format, reading material, or problems to solve..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--teacher-border)',
                      fontSize: '0.84rem',
                      color: 'var(--teacher-text-main)',
                      boxSizing: 'border-box',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* Class, Section, Subject Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {/* Class Dropdown */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: 'var(--teacher-text-main)',
                        marginBottom: 4,
                      }}
                    >
                      Class <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <select
                      required
                      value={formClass}
                      onChange={(e) => handleFormClassChange(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--teacher-border)',
                        fontSize: '0.82rem',
                        color: 'var(--teacher-text-main)',
                        outline: 'none',
                      }}
                    >
                      <option value="">Select Class</option>
                      {distinctClasses.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Section Dropdown */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: 'var(--teacher-text-main)',
                        marginBottom: 4,
                      }}
                    >
                      Section <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <select
                      required
                      value={formSection}
                      onChange={(e) => setFormSection(e.target.value)}
                      disabled={!formClass}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--teacher-border)',
                        fontSize: '0.82rem',
                        color: 'var(--teacher-text-main)',
                        outline: 'none',
                      }}
                    >
                      <option value="">Select Section</option>
                      {modalAvailableSections.map((sec) => (
                        <option key={sec} value={sec}>
                          Section {sec}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subject Dropdown */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: 'var(--teacher-text-main)',
                        marginBottom: 4,
                      }}
                    >
                      Subject <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <select
                      required
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      disabled={!formClass}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--teacher-border)',
                        fontSize: '0.82rem',
                        color: 'var(--teacher-text-main)',
                        outline: 'none',
                      }}
                    >
                      <option value="">Select Subject</option>
                      {modalAvailableSubjects.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dates & Maximum Marks */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: 'var(--teacher-text-main)',
                        marginBottom: 4,
                      }}
                    >
                      Assigned Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formAssignedDate}
                      onChange={(e) => setFormAssignedDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--teacher-border)',
                        fontSize: '0.82rem',
                        color: 'var(--teacher-text-main)',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: 'var(--teacher-text-main)',
                        marginBottom: 4,
                      }}
                    >
                      Due Date <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={formAssignedDate}
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--teacher-border)',
                        fontSize: '0.82rem',
                        color: 'var(--teacher-text-main)',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: 'var(--teacher-text-main)',
                        marginBottom: 4,
                      }}
                    >
                      Max Marks <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={1000}
                      value={formMaxMarks}
                      onChange={(e) => setFormMaxMarks(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--teacher-border)',
                        fontSize: '0.82rem',
                        color: 'var(--teacher-text-main)',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Optional Attachment Fields */}
                <div
                  style={{
                    backgroundColor: 'var(--teacher-bg-subtle)',
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid var(--teacher-border-subtle)',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: 'var(--teacher-muted-blue)',
                      marginBottom: 8,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Optional Attachment / Resource
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 10 }}>
                    <input
                      type="text"
                      placeholder="Resource label (e.g. Worksheet.pdf)"
                      value={formAttachmentName}
                      onChange={(e) => setFormAttachmentName(e.target.value)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--teacher-border)',
                        fontSize: '0.8rem',
                        backgroundColor: '#FFFFFF',
                        outline: 'none',
                      }}
                    />
                    <input
                      type="url"
                      placeholder="Resource URL (e.g. https://...)"
                      value={formAttachmentUrl}
                      onChange={(e) => setFormAttachmentUrl(e.target.value)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--teacher-border)',
                        fontSize: '0.8rem',
                        backgroundColor: '#FFFFFF',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 10,
                    marginTop: 6,
                    paddingTop: 12,
                    borderTop: '1px solid var(--teacher-border-subtle)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    disabled={isSubmitting}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      border: '1px solid var(--teacher-border)',
                      backgroundColor: 'transparent',
                      color: 'var(--teacher-text-main)',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSubmitForm('DRAFT')}
                    disabled={isSubmitting}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      border: '1px solid var(--teacher-border)',
                      backgroundColor: 'var(--teacher-bg-subtle)',
                      color: 'var(--teacher-primary)',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Save as Draft
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 6,
                      border: 'none',
                      backgroundColor: 'var(--teacher-primary)',
                      color: '#FFFFFF',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 4px rgba(32, 53, 74, 0.15)',
                    }}
                  >
                    {isSubmitting && <RotateCw size={13} className="teacher-spin" />}
                    <span>{editingAssignment ? 'Update & Publish' : 'Publish Assignment'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW ASSIGNMENT DETAILS MODAL                                   */}
        {/* ============================================================== */}
        {viewingAssignment && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(18, 30, 43, 0.5)',
              backdropFilter: 'blur(2px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid var(--teacher-border)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                width: '100%',
                maxWidth: 580,
                maxHeight: '90vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  padding: '18px 22px',
                  borderBottom: '1px solid var(--teacher-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 10,
                      backgroundColor:
                        viewingAssignment.status === 'PUBLISHED'
                          ? 'var(--teacher-sage-light)'
                          : '#FEF3C7',
                      color:
                        viewingAssignment.status === 'PUBLISHED'
                          ? '#2E4B28'
                          : '#92400E',
                    }}
                  >
                    {viewingAssignment.status}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--teacher-text-muted)' }}>
                    {viewingAssignment.className} - Section {viewingAssignment.section}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingAssignment(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--teacher-text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h3
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: 'var(--teacher-primary)',
                      margin: '0 0 6px',
                    }}
                  >
                    {viewingAssignment.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--teacher-text-muted)' }}>
                    <span>Subject: <strong>{viewingAssignment.subject}</strong></span>
                    <span>&bull;</span>
                    <span>Max Marks: <strong>{viewingAssignment.maxMarks} pts</strong></span>
                    <span>&bull;</span>
                    <span>Assigned: {viewingAssignment.assignedDate}</span>
                    <span>&bull;</span>
                    <span style={{ color: isPastDue(viewingAssignment.dueDate) ? '#DC2626' : undefined }}>
                      Due: <strong>{viewingAssignment.dueDate}</strong>
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--teacher-bg-subtle)',
                    padding: 16,
                    borderRadius: 8,
                    border: '1px solid var(--teacher-border)',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: 'var(--teacher-muted-blue)',
                      textTransform: 'uppercase',
                      marginBottom: 8,
                    }}
                  >
                    Instructions &amp; Criteria
                  </span>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                      color: 'var(--teacher-text-main)',
                      margin: 0,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {viewingAssignment.description}
                  </p>
                </div>

                {viewingAssignment.attachmentUrl && (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid var(--teacher-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <BookOpen size={16} style={{ color: 'var(--teacher-muted-blue)' }} />
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--teacher-primary)' }}>
                        {viewingAssignment.attachmentName || 'Learning Material Resource'}
                      </span>
                    </div>
                    <a
                      href={viewingAssignment.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--teacher-muted-blue)',
                        textDecoration: 'none',
                      }}
                    >
                      <span>Open Link</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 10,
                    paddingTop: 12,
                    borderTop: '1px solid var(--teacher-border-subtle)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const a = viewingAssignment;
                      setViewingAssignment(null);
                      handleOpenEditModal(a);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 6,
                      border: '1px solid var(--teacher-border)',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--teacher-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <FileEdit size={13} />
                    <span>Edit Assignment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewingAssignment(null)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      border: 'none',
                      backgroundColor: 'var(--teacher-primary)',
                      color: '#FFFFFF',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* DELETE CONFIRMATION MODAL                                       */}
        {/* ============================================================== */}
        {deleteConfirmAssignment && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(18, 30, 43, 0.5)',
              backdropFilter: 'blur(2px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid var(--teacher-border)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                width: '100%',
                maxWidth: 440,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: '#FEE2E2',
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                    Delete Assignment
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: '4px 0 0' }}>
                    Are you sure you want to delete &ldquo;{deleteConfirmAssignment.title}&rdquo;?
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--teacher-text-muted)', margin: 0, lineHeight: 1.5 }}>
                This coursework assignment will be permanently removed for students of{' '}
                <strong>
                  {deleteConfirmAssignment.className}-{deleteConfirmAssignment.section}
                </strong>
                . This action cannot be undone.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmAssignment(null)}
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: '1px solid var(--teacher-border)',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {isSubmitting && <RotateCw size={13} className="teacher-spin" />}
                  <span>Delete Assignment</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUBMISSIONS LIST MODAL                                         */}
        {/* ============================================================== */}
        {submissionsModalAssignment && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(32, 53, 74, 0.45)',
              backdropFilter: 'blur(3px)',
              zIndex: 9990,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              overflowY: 'auto',
            }}
            onClick={() => setSubmissionsModalAssignment(null)}
          >
            <div
              style={{
                backgroundColor: 'var(--teacher-surface)',
                borderRadius: 12,
                width: '100%',
                maxWidth: 980,
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18)',
                overflow: 'hidden',
                animation: 'scaleIn 0.2s ease',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid var(--teacher-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--teacher-bg-subtle)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: 'var(--teacher-primary-light)',
                        color: 'var(--teacher-primary)',
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}
                    >
                      {submissionsModalAssignment.className} - {submissionsModalAssignment.section}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: 'var(--teacher-sage-light)',
                        color: 'var(--teacher-sage)',
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}
                    >
                      {submissionsModalAssignment.subject}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--teacher-text-muted)' }}>
                      • Max Marks: {submissionsModalAssignment.maxMarks} pts
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--teacher-text-muted)' }}>
                      • Due: {submissionsModalAssignment.dueDate}
                    </span>
                  </div>
                  <h2
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: 'var(--teacher-primary)',
                      margin: 0,
                    }}
                  >
                    Submissions: {submissionsModalAssignment.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setSubmissionsModalAssignment(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--teacher-text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 4,
                  }}
                  title="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Toolbar & Filters */}
              <div
                style={{
                  padding: '12px 24px',
                  borderBottom: '1px solid var(--teacher-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 320px' }}>
                  {/* Search Input */}
                  <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
                    <Search
                      size={14}
                      style={{
                        position: 'absolute',
                        left: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--teacher-text-muted)',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search by student or admission ID..."
                      value={subSearchQuery}
                      onChange={(e) => setSubSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 12px 7px 32px',
                        borderRadius: 6,
                        border: '1px solid var(--teacher-border)',
                        backgroundColor: 'var(--teacher-bg-subtle)',
                        fontSize: '0.82rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={subFilterStatus}
                    onChange={(e) => setSubFilterStatus(e.target.value)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--teacher-border)',
                      backgroundColor: 'var(--teacher-bg-subtle)',
                      fontSize: '0.82rem',
                      outline: 'none',
                      cursor: 'pointer',
                      color: 'var(--teacher-text-main)',
                    }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="SUBMITTED">Submitted / Resubmitted</option>
                    <option value="UNDER_REVIEW">Under Review (Draft)</option>
                    <option value="GRADED">Graded (Published)</option>
                    <option value="LATE">Late Submissions</option>
                  </select>

                  {(subSearchQuery || subFilterStatus !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSubSearchQuery('');
                        setSubFilterStatus('ALL');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--teacher-muted-blue)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--teacher-text-muted)' }}>
                  Showing <strong>{filteredSubmissions.length}</strong> of{' '}
                  <strong>{submissionsList.length}</strong> submissions
                </div>
              </div>

              {/* Scrollable Submissions Content */}
              <div style={{ overflowY: 'auto', padding: '16px 24px', flex: 1, minHeight: 280 }}>
                {submissionsLoading && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '48px 0',
                      gap: 12,
                      color: 'var(--teacher-text-muted)',
                      fontSize: '0.88rem',
                    }}
                  >
                    <RotateCw size={24} className="teacher-spin" style={{ color: 'var(--teacher-primary)' }} />
                    <span>Loading student submissions...</span>
                  </div>
                )}

                {submissionsError && (
                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: 8,
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      color: '#991B1B',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      margin: '12px 0',
                    }}
                  >
                    <span>{submissionsError}</span>
                    <button
                      type="button"
                      onClick={() => submissionsModalAssignment && handleOpenSubmissionsModal(submissionsModalAssignment)}
                      style={{
                        background: 'none',
                        border: '1px solid #F87171',
                        padding: '4px 10px',
                        borderRadius: 5,
                        color: '#991B1B',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!submissionsLoading && !submissionsError && submissionsList.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '48px 24px',
                      backgroundColor: 'var(--teacher-bg-subtle)',
                      borderRadius: 10,
                      border: '1px dashed var(--teacher-border)',
                      margin: '12px 0',
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        backgroundColor: 'var(--teacher-primary-light)',
                        color: 'var(--teacher-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                      }}
                    >
                      <Users size={22} />
                    </div>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--teacher-primary)', margin: '0 0 6px' }}>
                      No Student Submissions Yet
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--teacher-text-muted)', margin: 0, maxWidth: 420 }}>
                      No students from {submissionsModalAssignment.className}-{submissionsModalAssignment.section} have submitted coursework for this assignment yet. Submissions will appear here once turned in.
                    </p>
                  </div>
                )}

                {!submissionsLoading &&
                  !submissionsError &&
                  submissionsList.length > 0 &&
                  filteredSubmissions.length === 0 && (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '36px 20px',
                        color: 'var(--teacher-text-muted)',
                        fontSize: '0.84rem',
                      }}
                    >
                      No submissions match your active filter criteria. Try searching with a different keyword or resetting status.
                    </div>
                  )}

                {!submissionsLoading && !submissionsError && filteredSubmissions.length > 0 && (
                  <div
                    style={{
                      border: '1px solid var(--teacher-border)',
                      borderRadius: 8,
                      overflow: 'hidden',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                      <thead>
                        <tr
                          style={{
                            borderBottom: '1px solid var(--teacher-border)',
                            backgroundColor: 'var(--teacher-bg-subtle)',
                            color: 'var(--teacher-text-muted)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          <th style={{ padding: '12px 16px' }}>Student Information</th>
                          <th style={{ padding: '12px 14px' }}>Submission Date &amp; Time</th>
                          <th style={{ padding: '12px 14px' }}>Status</th>
                          <th style={{ padding: '12px 14px' }}>Late Indicator</th>
                          <th style={{ padding: '12px 14px' }}>Marks Awarded</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubmissions.map((sub) => {
                          const isGraded = sub.isPublished || sub.status === 'GRADED';
                          const isUnderReview = !sub.isPublished && (sub.status === 'UNDER_REVIEW' || sub.gradingStatus === 'UNDER_REVIEW');

                          return (
                            <tr
                              key={sub.id}
                              style={{
                                borderBottom: '1px solid var(--teacher-border-subtle)',
                                transition: 'background-color 0.12s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--teacher-bg-subtle)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              {/* Student Details */}
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: '50%',
                                      backgroundColor: 'var(--teacher-primary)',
                                      color: '#FFFFFF',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 700,
                                      fontSize: '0.75rem',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {sub.studentName
                                      ? sub.studentName
                                          .split(' ')
                                          .map((n) => n[0])
                                          .slice(0, 2)
                                          .join('')
                                          .toUpperCase()
                                      : 'ST'}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, color: 'var(--teacher-primary)', fontSize: '0.86rem' }}>
                                      {sub.studentName || 'Student'}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--teacher-text-muted)' }}>
                                      Adm: <strong>{sub.studentAdmissionNumber || '—'}</strong>
                                      {sub.studentRollNumber && ` • Roll: ${sub.studentRollNumber}`}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Submitted At */}
                              <td style={{ padding: '12px 14px', color: 'var(--teacher-text-main)' }}>
                                <div>{formatDateTime(sub.submittedAt)}</div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--teacher-text-muted)' }}>
                                  Version {sub.version}
                                </span>
                              </td>

                              {/* Status Badge */}
                              <td style={{ padding: '12px 14px' }}>
                                {isGraded ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      padding: '3px 8px',
                                      borderRadius: 12,
                                      backgroundColor: '#ECFDF5',
                                      color: '#065F46',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      border: '1px solid #A7F3D0',
                                    }}
                                  >
                                    <CheckCircle2 size={12} />
                                    <span>Graded</span>
                                  </span>
                                ) : isUnderReview ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      padding: '3px 8px',
                                      borderRadius: 12,
                                      backgroundColor: '#FEF3C7',
                                      color: '#92400E',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      border: '1px solid #FDE68A',
                                    }}
                                  >
                                    <FileEdit size={12} />
                                    <span>Under Review</span>
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      padding: '3px 8px',
                                      borderRadius: 12,
                                      backgroundColor: 'var(--teacher-primary-light)',
                                      color: 'var(--teacher-primary)',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      border: '1px solid var(--teacher-border)',
                                    }}
                                  >
                                    <Clock size={12} />
                                    <span>{sub.status === 'RESUBMITTED' ? 'Resubmitted' : 'Submitted'}</span>
                                  </span>
                                )}
                              </td>

                              {/* Late Indicator */}
                              <td style={{ padding: '12px 14px' }}>
                                {sub.isLate ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      padding: '2px 7px',
                                      borderRadius: 4,
                                      backgroundColor: '#FEE2E2',
                                      color: '#DC2626',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                    }}
                                  >
                                    <Clock size={11} />
                                    <span>Late</span>
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.74rem', color: 'var(--teacher-text-muted)' }}>On time</span>
                                )}
                              </td>

                              {/* Marks Awarded */}
                              <td style={{ padding: '12px 14px' }}>
                                {isGraded ? (
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 700, color: '#065F46', fontSize: '0.88rem' }}>
                                      {sub.marksObtained ?? '—'} / {sub.maxMarks}
                                    </span>
                                    <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600 }}>
                                      Published
                                    </span>
                                  </div>
                                ) : isUnderReview ? (
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 700, color: '#92400E', fontSize: '0.84rem' }}>
                                      Draft: {sub.marksObtained ?? '—'} / {sub.maxMarks}
                                    </span>
                                    <span style={{ fontSize: '0.68rem', color: '#B45309' }}>
                                      Draft Review
                                    </span>
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--teacher-text-muted)', fontSize: '0.78rem' }}>
                                    Not graded yet
                                  </span>
                                )}
                              </td>

                              {/* Action */}
                              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenGradingModal(sub)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '5px 12px',
                                    borderRadius: 6,
                                    border: isGraded ? '1px solid var(--teacher-border)' : 'none',
                                    backgroundColor: isGraded ? 'var(--teacher-surface)' : 'var(--teacher-primary)',
                                    color: isGraded ? 'var(--teacher-primary)' : '#FFFFFF',
                                    fontSize: '0.76rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: isGraded ? 'none' : '0 2px 4px rgba(32, 53, 74, 0.12)',
                                  }}
                                >
                                  <GraduationCap size={13} />
                                  <span>{isGraded ? 'Update Grade' : isUnderReview ? 'Continue Review' : 'Grade Work'}</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '14px 24px',
                  borderTop: '1px solid var(--teacher-border)',
                  backgroundColor: 'var(--teacher-bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => setSubmissionsModalAssignment(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid var(--teacher-border)',
                    backgroundColor: 'var(--teacher-surface)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--teacher-text-main)',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* REVIEW AND GRADING MODAL                                       */}
        {/* ============================================================== */}
        {gradingSubmission && submissionsModalAssignment && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(32, 53, 74, 0.55)',
              backdropFilter: 'blur(4px)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              overflowY: 'auto',
            }}
            onClick={() => !isSavingReview && setGradingSubmission(null)}
          >
            <div
              style={{
                backgroundColor: 'var(--teacher-surface)',
                borderRadius: 12,
                width: '100%',
                maxWidth: 860,
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 24px 48px rgba(0, 0, 0, 0.22)',
                overflow: 'hidden',
                animation: 'scaleIn 0.2s ease',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid var(--teacher-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--teacher-bg-subtle)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: 'var(--teacher-primary-light)',
                        color: 'var(--teacher-primary)',
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}
                    >
                      Evaluation &amp; Feedback
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--teacher-text-muted)' }}>
                      Version {gradingSubmission.version}
                    </span>
                  </div>
                  <h2
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: 'var(--teacher-primary)',
                      margin: 0,
                    }}
                  >
                    Review: {gradingSubmission.studentName}
                  </h2>
                  <div style={{ fontSize: '0.76rem', color: 'var(--teacher-text-muted)', marginTop: 2 }}>
                    Admission ID: <strong>{gradingSubmission.studentAdmissionNumber || '—'}</strong> • Class:{' '}
                    <strong>
                      {submissionsModalAssignment.className}-{submissionsModalAssignment.section}
                    </strong>
                    {gradingSubmission.studentRollNumber && ` • Roll: ${gradingSubmission.studentRollNumber}`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => !isSavingReview && setGradingSubmission(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--teacher-text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                  title="Close evaluation"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Evaluation Body */}
              <div style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
                {/* 1. Status Notices */}
                {gradingSubmission.isLate && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      color: '#991B1B',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Clock size={16} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Late Submission:</strong> This coursework was submitted after the deadline (due on{' '}
                      {submissionsModalAssignment.dueDate}).
                    </div>
                  </div>
                )}

                {gradingSubmission.isPublished && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      backgroundColor: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      color: '#065F46',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Result Published:</strong> The current grade ({gradingSubmission.marksObtained} / {submissionsModalAssignment.maxMarks}) and feedback are visible to the student and their parent.
                    </div>
                  </div>
                )}

                {!gradingSubmission.isPublished && gradingSubmission.status === 'UNDER_REVIEW' && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      backgroundColor: '#FEF3C7',
                      border: '1px solid #FDE68A',
                      color: '#92400E',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <FileEdit size={16} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Draft Review:</strong> Saved evaluation is in progress. Marks and feedback remain confidential until published.
                    </div>
                  </div>
                )}

                {/* 2. Assignment Context Snippet */}
                <div
                  style={{
                    backgroundColor: 'var(--teacher-bg-subtle)',
                    border: '1px solid var(--teacher-border)',
                    borderRadius: 8,
                    padding: '12px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--teacher-muted-blue)', textTransform: 'uppercase' }}>
                      Assignment Criteria &amp; Overview
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--teacher-primary)' }}>
                      Max Marks: {submissionsModalAssignment.maxMarks} points
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--teacher-primary)', marginBottom: 4 }}>
                    {submissionsModalAssignment.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--teacher-text-muted)', lineHeight: 1.5, maxHeight: 80, overflowY: 'auto' }}>
                    {submissionsModalAssignment.description || 'No additional instructions.'}
                  </div>
                </div>

                {/* 3. Student Submission Work */}
                <div>
                  <h3
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: 'var(--teacher-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      margin: '0 0 8px',
                    }}
                  >
                    Student&apos;s Submitted Answer
                  </h3>

                  {gradingSubmission.answerText ? (
                    <div
                      style={{
                        padding: '14px 16px',
                        borderRadius: 8,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--teacher-border)',
                        fontSize: '0.86rem',
                        lineHeight: 1.6,
                        color: 'var(--teacher-text-main)',
                        whiteSpace: 'pre-wrap',
                        maxHeight: 200,
                        overflowY: 'auto',
                      }}
                    >
                      {gradingSubmission.answerText}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 8,
                        backgroundColor: 'var(--teacher-bg-subtle)',
                        border: '1px dashed var(--teacher-border)',
                        fontSize: '0.8rem',
                        color: 'var(--teacher-text-muted)',
                      }}
                    >
                      No written answer text submitted.
                    </div>
                  )}
                </div>

                {/* 4. Student's Uploaded Attachment */}
                <div>
                  <h3
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: 'var(--teacher-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      margin: '0 0 8px',
                    }}
                  >
                    Student Attachment
                  </h3>

                  {gradingSubmission.attachmentUrl ? (
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: 8,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--teacher-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 6,
                            backgroundColor: 'var(--teacher-primary-light)',
                            color: 'var(--teacher-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <FileText size={18} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '0.84rem',
                              fontWeight: 600,
                              color: 'var(--teacher-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={gradingSubmission.attachmentName || 'Submitted File'}
                          >
                            {gradingSubmission.attachmentName || 'Student Worksheet Document'}
                          </div>
                          {gradingSubmission.attachmentSize ? (
                            <div style={{ fontSize: '0.72rem', color: 'var(--teacher-text-muted)' }}>
                              {(gradingSubmission.attachmentSize / (1024 * 1024)).toFixed(2)} MB
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <a
                        href={gradingSubmission.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={gradingSubmission.attachmentName || 'submission-file'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: '1px solid var(--teacher-border)',
                          backgroundColor: 'var(--teacher-bg-subtle)',
                          color: 'var(--teacher-primary)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <Download size={13} />
                        <span>View / Download</span>
                      </a>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 8,
                        backgroundColor: 'var(--teacher-bg-subtle)',
                        border: '1px dashed var(--teacher-border)',
                        fontSize: '0.8rem',
                        color: 'var(--teacher-text-muted)',
                      }}
                    >
                      No file attachment uploaded for this submission.
                    </div>
                  )}
                </div>

                {/* 5. Grading Input Section */}
                <div
                  style={{
                    borderTop: '1px solid var(--teacher-border)',
                    paddingTop: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  <h3
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: 'var(--teacher-primary)',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <GraduationCap size={16} />
                    <span>Grading &amp; Teacher Feedback</span>
                  </h3>

                  {gradingError && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        color: '#991B1B',
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <span>{gradingError}</span>
                    </div>
                  )}

                  {/* Marks Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--teacher-primary)' }}>
                      Marks Awarded (out of {submissionsModalAssignment.maxMarks} points) *
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="number"
                        min={0}
                        max={submissionsModalAssignment.maxMarks}
                        step="any"
                        placeholder={`0 to ${submissionsModalAssignment.maxMarks}`}
                        value={gradingMarksInput}
                        onChange={(e) => {
                          setGradingMarksInput(e.target.value);
                          setGradingError(null);
                        }}
                        style={{
                          width: 140,
                          padding: '9px 12px',
                          borderRadius: 6,
                          border: '1px solid var(--teacher-border)',
                          backgroundColor: '#FFFFFF',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: 'var(--teacher-primary)',
                          outline: 'none',
                        }}
                      />
                      <span style={{ fontSize: '0.86rem', color: 'var(--teacher-text-muted)' }}>
                        / {submissionsModalAssignment.maxMarks} maximum marks
                      </span>
                    </div>
                  </div>

                  {/* Teacher Feedback Textarea */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--teacher-primary)' }}>
                        Teacher Feedback &amp; Constructive Remarks (Optional)
                      </label>
                      <span style={{ fontSize: '0.72rem', color: 'var(--teacher-text-muted)' }}>
                        {gradingFeedbackInput.length} / 2,000 chars
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      maxLength={2000}
                      placeholder="Enter comments, performance review, areas for improvement, or praise for the student..."
                      value={gradingFeedbackInput}
                      onChange={(e) => {
                        setGradingFeedbackInput(e.target.value);
                        setGradingError(null);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: '1px solid var(--teacher-border)',
                        backgroundColor: '#FFFFFF',
                        fontSize: '0.84rem',
                        lineHeight: 1.5,
                        color: 'var(--teacher-text-main)',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  {/* Grading History Timeline if present */}
                  {gradingSubmission.gradingHistory && gradingSubmission.gradingHistory.length > 0 && (
                    <div
                      style={{
                        backgroundColor: 'var(--teacher-bg-subtle)',
                        borderRadius: 8,
                        border: '1px solid var(--teacher-border)',
                        padding: '12px 16px',
                        marginTop: 4,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          color: 'var(--teacher-primary)',
                          marginBottom: 8,
                        }}
                      >
                        <History size={14} />
                        <span>Grading Audit &amp; Evaluation History ({gradingSubmission.gradingHistory.length})</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {gradingSubmission.gradingHistory.map((h, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: '#FFFFFF',
                              borderRadius: 6,
                              border: '1px solid var(--teacher-border-subtle)',
                              fontSize: '0.78rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                              <span style={{ fontWeight: 700, color: 'var(--teacher-primary)' }}>
                                {h.marksObtained} / {h.maxMarks} marks ({h.action})
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--teacher-text-muted)' }}>
                                {formatDateTime(h.gradedAt)}
                              </span>
                            </div>
                            {h.feedback && (
                              <div style={{ color: 'var(--teacher-text-muted)', fontStyle: 'italic', fontSize: '0.74rem' }}>
                                &ldquo;{h.feedback}&rdquo;
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confirmation Step for Publishing */}
                  {isPublishConfirmOpen && (
                    <div
                      style={{
                        padding: '14px 18px',
                        borderRadius: 8,
                        backgroundColor: '#FEF3C7',
                        border: '1px solid #F59E0B',
                        color: '#92400E',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        animation: 'fadeIn 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.88rem' }}>
                        <HelpCircle size={18} />
                        <span>Confirm Result Publication</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5 }}>
                        You are about to publish <strong>{gradingMarksInput} / {submissionsModalAssignment.maxMarks} marks</strong> for{' '}
                        <strong>{gradingSubmission.studentName}</strong>. Once published, the score and teacher feedback will be immediately visible to the student and their parent on the Parent Portal.
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => setIsPublishConfirmOpen(false)}
                          disabled={isSavingReview}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #D97706',
                            backgroundColor: '#FFFFFF',
                            color: '#92400E',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Back to Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveReview(true)}
                          disabled={isSavingReview}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 6,
                            border: 'none',
                            backgroundColor: '#059669',
                            color: '#FFFFFF',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          {isSavingReview && <RotateCw size={13} className="teacher-spin" />}
                          <span>Confirm &amp; Publish Result</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid var(--teacher-border)',
                  backgroundColor: 'var(--teacher-bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => !isSavingReview && setGradingSubmission(null)}
                  disabled={isSavingReview}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid var(--teacher-border)',
                    backgroundColor: 'var(--teacher-surface)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--teacher-text-main)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                {!isPublishConfirmOpen && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Save Draft Review */}
                    <button
                      type="button"
                      onClick={() => handleSaveReview(false)}
                      disabled={isSavingReview}
                      title="Save review as draft without publishing to parents"
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: '1px solid var(--teacher-border)',
                        backgroundColor: '#FFFFFF',
                        color: 'var(--teacher-primary)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {isSavingReview && <RotateCw size={13} className="teacher-spin" />}
                      <span>Save Review (Draft)</span>
                    </button>

                    {/* Publish Result Action */}
                    <button
                      type="button"
                      onClick={() => {
                        // Pre-validate marks before opening confirmation
                        if (gradingMarksInput === '' || gradingMarksInput.trim() === '') {
                          setGradingError('Please enter marks awarded before publishing.');
                          return;
                        }
                        const m = Number(gradingMarksInput);
                        if (isNaN(m) || m < 0 || m > submissionsModalAssignment.maxMarks) {
                          setGradingError(
                            `Marks must be a valid number between 0 and ${submissionsModalAssignment.maxMarks}.`
                          );
                          return;
                        }
                        setGradingError(null);
                        setIsPublishConfirmOpen(true);
                      }}
                      disabled={isSavingReview}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 6,
                        border: 'none',
                        backgroundColor: '#059669',
                        color: '#FFFFFF',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                      }}
                    >
                      <CheckCircle2 size={14} />
                      <span>Publish Result</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};
