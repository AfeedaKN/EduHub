import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  AlertCircle,
  AlertTriangle,
  Search,
  RotateCw,
  X,
  ExternalLink,
  User,
  GraduationCap,
  Sparkles,
  ArrowRight,
  UserPlus,
  Eye,
  FileText,
  Info,
  CheckCircle2,
  UploadCloud,
  Send,
  History,
  Award,
  Trash2,
  HelpCircle,
  ArrowLeft,
  FileCheck,
} from 'lucide-react';

import { ParentLayout } from '../../components/parent/ParentLayout';
import { parentApi } from '../../api/parentApi';
import type {
  ParentAssignment,
  ParentAssignmentsSummary,
  ChildProfile,
} from '../../types/parent.types';
import './ParentAssignments.css';

export const ParentAssignmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Primary data states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [assignments, setAssignments] = useState<ParentAssignment[]>([]);
  const [summary, setSummary] = useState<ParentAssignmentsSummary>({
    total: 0,
    upcoming: 0,
    dueToday: 0,
    overdue: 0,
  });
  const [subjects, setSubjects] = useState<string[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals & Action states
  const [viewingAssignment, setViewingAssignment] = useState<ParentAssignment | null>(null);
  const [submittingAssignment, setSubmittingAssignment] = useState<ParentAssignment | null>(null);
  const [submissionSuccessMessage, setSubmissionSuccessMessage] = useState<string | null>(null);

  // Submission Form State
  const [submitAnswerText, setSubmitAnswerText] = useState<string>('');
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: number;
    sizeFormatted: string;
    type: string;
    dataUrl: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitFormError, setSubmitFormError] = useState<string | null>(null);
  const [showConfirmationStep, setShowConfirmationStep] = useState<boolean>(false);

  // Fetch assignments with current filters and child selection
  const fetchAssignments = useCallback(
    async (childId?: string) => {
      try {
        setLoading(true);
        setError(null);

        const res = await parentApi.getAssignments({
          studentId: childId || (selectedChildId ? selectedChildId : undefined),
          subject: selectedSubject !== 'ALL' ? selectedSubject : undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          search: searchQuery.trim() ? searchQuery.trim() : undefined,
        });

        if (res.success && res.data) {
          setChildren(res.data.children || []);
          setAssignments(res.data.assignments || []);
          setSummary(
            res.data.summary || {
              total: 0,
              upcoming: 0,
              dueToday: 0,
              overdue: 0,
            }
          );
          setSubjects(res.data.subjects || []);

          // Keep selected child in sync
          if (res.data.selectedChild) {
            setSelectedChildId(res.data.selectedChild.id);
          } else if (res.data.children && res.data.children.length > 0 && !selectedChildId) {
            setSelectedChildId(res.data.children[0].id);
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch parent assignments:', err);
        setError(
          err?.response?.data?.message ||
            'Unable to load assignments. Please check your network connection and try again.'
        );
      } finally {
        setLoading(false);
      }
    },
    [selectedChildId, selectedSubject, selectedStatus, searchQuery]
  );

  // Initial load
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Handle switching child
  const handleSelectChild = (childId: string) => {
    if (childId === selectedChildId) return;
    setSelectedChildId(childId);
    setSelectedSubject('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
  };

  // Currently selected child object
  const currentChild = useMemo(() => {
    return children.find((c) => c.id === selectedChildId) || children[0] || null;
  }, [children, selectedChildId]);

  // Check if any filters are active
  const hasActiveFilters = searchQuery.trim() !== '' || selectedSubject !== 'ALL' || selectedStatus !== 'ALL';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSubject('ALL');
    setSelectedStatus('ALL');
  };

  // Helper to format dates
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Format date and time
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Open Submit Modal
  const handleOpenSubmit = (assignment: ParentAssignment) => {
    setSubmittingAssignment(assignment);
    setSubmitFormError(null);
    setShowConfirmationStep(false);

    // If assignment was previously submitted, prefill fields for editing/resubmitting
    if (assignment.submission) {
      setSubmitAnswerText(assignment.submission.answerText || '');
      if (assignment.submission.attachmentUrl && assignment.submission.attachmentName) {
        setAttachedFile({
          name: assignment.submission.attachmentName,
          size: assignment.submission.attachmentSize || 0,
          sizeFormatted: assignment.submission.attachmentSize
            ? `${(assignment.submission.attachmentSize / (1024 * 1024)).toFixed(2)} MB`
            : 'Attachment',
          type: assignment.submission.attachmentType || 'application/octet-stream',
          dataUrl: assignment.submission.attachmentUrl,
        });
      } else {
        setAttachedFile(null);
      }
    } else {
      setSubmitAnswerText('');
      setAttachedFile(null);
    }
  };

  // File Selection Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmitFormError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedExts = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'];
    const fileName = file.name.toLowerCase();
    const hasValidExt = allowedExts.some((ext) => fileName.endsWith(ext));

    if (!hasValidExt) {
      setSubmitFormError('Invalid file type. Please upload a PDF, Word (DOC, DOCX), TXT, or Image (PNG, JPG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSubmitFormError('File size exceeds the 10MB limit. Please upload a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        size: file.size,
        sizeFormatted: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.type || 'application/octet-stream',
        dataUrl: (reader.result as string) || `https://storage.eduhub.local/submissions/${encodeURIComponent(file.name)}`,
      });
    };
    reader.readAsDataURL(file);
  };

  // Remove attached file
  const handleRemoveAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validate form before showing confirmation
  const handleProceedToConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitFormError(null);

    const trimmedAnswer = submitAnswerText.trim();
    if (!trimmedAnswer && !attachedFile) {
      setSubmitFormError('Please enter a written answer or attach a homework file before submitting.');
      return;
    }

    if (trimmedAnswer.length > 5000) {
      setSubmitFormError('Answer text exceeds the 5,000 character maximum limit.');
      return;
    }

    setShowConfirmationStep(true);
  };

  // Submit Homework to Backend
  const handleFinalSubmit = async () => {
    if (!submittingAssignment || !selectedChildId) return;

    try {
      setIsSubmitting(true);
      setSubmitFormError(null);

      const res = await parentApi.submitAssignment(submittingAssignment.id, {
        studentId: selectedChildId,
        answerText: submitAnswerText.trim(),
        attachmentUrl: attachedFile?.dataUrl || undefined,
        attachmentName: attachedFile?.name || undefined,
        attachmentSize: attachedFile?.size || undefined,
        attachmentType: attachedFile?.type || undefined,
      });

      if (res.success && res.data) {
        const actionWord = res.data.version > 1 ? 'resubmitted' : 'submitted';
        setSubmissionSuccessMessage(
          `Assignment successfully ${actionWord} for ${currentChild?.fullName || 'your child'}! (Version ${res.data.version})`
        );
        setTimeout(() => setSubmissionSuccessMessage(null), 5000);

        // Close submit modal and update viewing modal if active
        setSubmittingAssignment(null);
        setShowConfirmationStep(false);

        if (viewingAssignment && viewingAssignment.id === submittingAssignment.id) {
          setViewingAssignment((prev) =>
            prev
              ? {
                  ...prev,
                  submissionStatus: res.data.status,
                  submission: res.data,
                }
              : null
          );
        }

        // Refresh assignment list
        await fetchAssignments(selectedChildId);
      }
    } catch (err: any) {
      console.error('Submission failed:', err);
      setSubmitFormError(
        err?.response?.data?.message ||
          'Failed to submit assignment. Please verify your connection and try again.'
      );
      setShowConfirmationStep(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ParentLayout pageTitle="Assignments">
      <div className="parent-assignments-container">
        {/* Page Header */}
        <div className="parent-assignments-header">
          <div className="parent-assignments-title-group">
            <h1>Assignments</h1>
            <p className="parent-assignments-subtitle">
              View schoolwork assigned to your children, monitor deadlines, and submit homework directly from the parent portal.
            </p>
          </div>

          {/* If single enrolled child, show prominent child info pill */}
          {!loading && children.length === 1 && currentChild && (
            <div className="parent-single-child-badge">
              <div className="parent-single-child-avatar">
                {getInitials(currentChild.fullName)}
              </div>
              <div className="parent-single-child-info">
                <span className="parent-single-child-name">{currentChild.fullName}</span>
                <div className="parent-single-child-meta">
                  <span className="parent-meta-pill">
                    {currentChild.grade} - Section {currentChild.section}
                  </span>
                  <span>• {currentChild.academicYear}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Success Notification Toast */}
        {submissionSuccessMessage && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 10,
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#065F46',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              fontSize: '0.86rem',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={20} className="text-emerald-600" />
              <span>{submissionSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSubmissionSuccessMessage(null)}
              style={{ background: 'none', border: 'none', color: '#065F46', cursor: 'pointer' }}
              aria-label="Dismiss success notification"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 10,
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              fontSize: '0.84rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchAssignments()}
              style={{
                background: 'none',
                border: '1px solid #F87171',
                padding: '4px 10px',
                borderRadius: 6,
                color: '#991B1B',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <RotateCw size={13} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Case 1: Parent has NO approved enrolled children */}
        {!loading && children.length === 0 && !error && (
          <div className="parent-empty-state-card" style={{ marginTop: 10 }}>
            <div className="parent-empty-badge">
              <Sparkles size={14} className="text-sage" />
              <span>Student Enrollment Required</span>
            </div>

            <div className="parent-empty-visual-wrap">
              <div className="parent-empty-icon-halo">
                <GraduationCap size={40} className="parent-empty-main-icon" />
              </div>
            </div>

            <div className="parent-empty-body">
              <h3 className="parent-empty-heading">No enrolled children found</h3>
              <p className="parent-empty-description">
                To view coursework, schoolwork, and homework assignments, you must have an active and approved enrolled child in EduHub.
              </p>

              <div className="parent-empty-actions">
                <button
                  type="button"
                  className="btn-add-student-primary"
                  onClick={() => navigate('/parent/students/add')}
                >
                  <UserPlus size={17} />
                  <span>Register Child for Admission</span>
                  <ArrowRight size={15} />
                </button>
              </div>

              <div className="parent-empty-review-note">
                <Info size={14} className="parent-empty-shield-icon" />
                <span>Once admission is approved by school management, assignments will appear here automatically.</span>
              </div>
            </div>
          </div>
        )}

        {/* Case 2: Parent has MULTIPLE children -> Child Selector */}
        {!loading && children.length > 1 && (
          <div className="parent-child-selector-wrap">
            <div className="parent-child-selector-label">
              <GraduationCap size={15} />
              <span>Select Child</span>
            </div>
            <div className="parent-child-selector-pills">
              {children.map((child) => {
                const isSelected = child.id === selectedChildId;
                return (
                  <button
                    key={child.id}
                    type="button"
                    className={`parent-child-pill-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectChild(child.id)}
                  >
                    <div className="parent-child-pill-avatar">
                      {getInitials(child.fullName)}
                    </div>
                    <div className="parent-child-pill-text">
                      <span className="parent-child-pill-name">{child.fullName}</span>
                      <span className="parent-child-pill-desc">
                        {child.grade} - Section {child.section}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* When children exist: render Stats, Filters & Table */}
        {(loading || children.length > 0) && (
          <>
            {/* 4 Summary Stat Cards */}
            <div className="parent-stats-grid">
              {/* Total Assignments */}
              <div className="parent-stat-card">
                <div className="parent-stat-top">
                  <span className="parent-stat-label">Total Assignments</span>
                  <div className="parent-stat-icon-wrap total">
                    <BookOpen size={18} />
                  </div>
                </div>
                <div className="parent-stat-value">
                  {loading ? '—' : summary.total}
                </div>
                <div className="parent-stat-footer">
                  Published for {currentChild ? `${currentChild.grade}-${currentChild.section}` : 'child'}
                </div>
              </div>

              {/* Upcoming */}
              <div className="parent-stat-card">
                <div className="parent-stat-top">
                  <span className="parent-stat-label">Upcoming</span>
                  <div className="parent-stat-icon-wrap upcoming">
                    <Clock size={18} />
                  </div>
                </div>
                <div className="parent-stat-value">
                  {loading ? '—' : summary.upcoming}
                </div>
                <div className="parent-stat-footer">Due in upcoming days</div>
              </div>

              {/* Due Today */}
              <div className="parent-stat-card">
                <div className="parent-stat-top">
                  <span className="parent-stat-label">Due Today</span>
                  <div className="parent-stat-icon-wrap due-today">
                    <AlertCircle size={18} />
                  </div>
                </div>
                <div className="parent-stat-value" style={{ color: '#D97706' }}>
                  {loading ? '—' : summary.dueToday}
                </div>
                <div className="parent-stat-footer">Requires submission today</div>
              </div>

              {/* Overdue */}
              <div className="parent-stat-card">
                <div className="parent-stat-top">
                  <span className="parent-stat-label">Overdue</span>
                  <div className="parent-stat-icon-wrap overdue">
                    <AlertTriangle size={18} />
                  </div>
                </div>
                <div className="parent-stat-value" style={{ color: '#DC2626' }}>
                  {loading ? '—' : summary.overdue}
                </div>
                <div className="parent-stat-footer">Past deadline</div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="parent-filters-bar">
              {/* Search by title */}
              <div className="parent-search-box">
                <Search size={16} className="parent-search-icon" />
                <input
                  type="text"
                  placeholder="Search assignments by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="parent-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="parent-search-clear"
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                    aria-label="Clear assignment search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Dropdowns */}
              <div className="parent-dropdown-group">
                {/* Subject filter */}
                <div className="parent-select-wrap">
                  <select
                    className="parent-select"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                  >
                    <option value="ALL">All Subjects</option>
                    {subjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due status filter */}
                <div className="parent-select-wrap">
                  <select
                    className="parent-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="ALL">All Deadlines</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="DUE_TODAY">Due Today</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>
                </div>

                {/* Reset button */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="btn-reset-filters"
                    onClick={handleResetFilters}
                  >
                    <X size={13} />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>
            </div>

            {/* Assignments List / Table Card */}
            <div className="parent-assignments-card">
              <div className="parent-assignments-card-header">
                <span className="parent-assignments-count-label">
                  {assignments.length} {assignments.length === 1 ? 'Assignment' : 'Assignments'} Found
                </span>
                <span className="parent-assignments-note-label">
                  <FileCheck size={14} />
                  <span>Online assignment submission enabled</span>
                </span>
              </div>

              {/* Loading State */}
              {loading ? (
                <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      style={{
                        height: 56,
                        backgroundColor: '#F8FAFC',
                        borderRadius: 8,
                        animation: 'pulse 1.5s infinite',
                      }}
                    />
                  ))}
                </div>
              ) : assignments.length === 0 ? (
                /* Empty / No Results State */
                <div className="parent-assignments-empty">
                  <div className="parent-empty-icon-circle">
                    <BookOpen size={28} />
                  </div>
                  {hasActiveFilters ? (
                    <>
                      <h3 className="parent-empty-title">No matching assignments</h3>
                      <p className="parent-empty-text">
                        No assignments matched your active search &quot;{searchQuery}&quot; or filter criteria.
                      </p>
                      <button
                        type="button"
                        className="btn-reset-filters"
                        onClick={handleResetFilters}
                        style={{ marginTop: 8 }}
                      >
                        Reset All Filters
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="parent-empty-title">No assignments published yet</h3>
                      <p className="parent-empty-text">
                        There are currently no active or published coursework assignments for{' '}
                        {currentChild ? `${currentChild.fullName} in ${currentChild.grade} - Section ${currentChild.section}` : 'this class'}
                        . Check back soon!
                      </p>
                    </>
                  )}
                </div>
              ) : (
                /* Assignments Table */
                <div className="parent-table-responsive">
                  <table className="parent-assignments-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Assignment</th>
                        <th>Teacher</th>
                        <th>Due Date</th>
                        <th>Deadline</th>
                        <th>Max Marks</th>
                        <th>Submission Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((assignment) => (
                        <tr key={assignment.id}>
                          {/* Subject */}
                          <td>
                            <span className="parent-subject-badge">
                              {assignment.subject}
                            </span>
                          </td>

                          {/* Title & Preview */}
                          <td className="parent-assignment-title-cell">
                            <div className="parent-assignment-title">{assignment.title}</div>
                            <div className="parent-assignment-desc-snippet" title={assignment.description}>
                              {assignment.description}
                            </div>
                          </td>

                          {/* Teacher */}
                          <td>
                            <div className="parent-teacher-cell">
                              <User size={14} className="parent-teacher-icon" />
                              <span>{assignment.teacherName}</span>
                            </div>
                          </td>

                          {/* Dates */}
                          <td>
                            <div className="parent-date-cell">
                              <span className="parent-due-date">Due: {formatDate(assignment.dueDate)}</span>
                              <span className="parent-assigned-date">Assigned: {formatDate(assignment.assignedDate)}</span>
                            </div>
                          </td>

                          {/* Due Status Badge */}
                          <td>
                            {assignment.dueStatus === 'UPCOMING' && (
                              <span className="parent-due-status-badge upcoming">
                                <Clock size={12} />
                                <span>Upcoming</span>
                              </span>
                            )}
                            {assignment.dueStatus === 'DUE_TODAY' && (
                              <span className="parent-due-status-badge due-today">
                                <AlertCircle size={12} />
                                <span>Due Today</span>
                              </span>
                            )}
                            {assignment.dueStatus === 'OVERDUE' && (
                              <span className="parent-due-status-badge overdue">
                                <AlertTriangle size={12} />
                                <span>Overdue</span>
                              </span>
                            )}
                          </td>

                          {/* Max Marks */}
                          <td>
                            <span className="parent-marks-badge">
                              {assignment.maxMarks} pts
                            </span>
                          </td>

                          {/* Submission Status Badge */}
                          <td>
                            {assignment.submissionStatus === 'SUBMITTED' && (
                              <span className="parent-submission-pill submitted" title="Submitted on time">
                                <CheckCircle2 size={12} />
                                <span>Submitted</span>
                              </span>
                            )}
                            {assignment.submissionStatus === 'RESUBMITTED' && (
                              <span className="parent-submission-pill resubmitted" title="Revised submission recorded">
                                <History size={12} />
                                <span>Resubmitted (v{assignment.submission?.version || 2})</span>
                              </span>
                            )}
                            {assignment.submissionStatus === 'UNDER_REVIEW' && (
                              <span className="parent-submission-pill under-review" title="Teacher is reviewing this submission">
                                <Clock size={12} />
                                <span>Under Review</span>
                              </span>
                            )}
                            {assignment.submissionStatus === 'LATE' && (
                              <span className="parent-submission-pill late" title="Submitted after deadline">
                                <Clock size={12} />
                                <span>Late Submission</span>
                              </span>
                            )}
                            {assignment.submissionStatus === 'GRADED' && (
                              <span className="parent-submission-pill graded" title="Evaluated and published by teacher">
                                <Award size={12} />
                                <span>
                                  Graded: {assignment.submission?.marksObtained ?? '—'}/{assignment.maxMarks}
                                </span>
                              </span>
                            )}
                            {assignment.submissionStatus === 'NOT_SUBMITTED' && (
                              <span className="parent-submission-pill not-submitted">
                                Not Submitted
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              {/* Submit / Resubmit Action Button */}
                              {assignment.canSubmit && (!assignment.submission || assignment.submissionStatus === 'NOT_SUBMITTED') && (
                                <button
                                  type="button"
                                  className="btn-submit-action"
                                  onClick={() => handleOpenSubmit(assignment)}
                                  title="Submit student homework"
                                >
                                  <Send size={13} />
                                  <span>Submit</span>
                                </button>
                              )}

                              {assignment.canSubmit && assignment.submission && (
                                <button
                                  type="button"
                                  className="btn-resubmit-action"
                                  onClick={() => handleOpenSubmit(assignment)}
                                  title="Edit and resubmit homework"
                                >
                                  <History size={13} />
                                  <span>Resubmit</span>
                                </button>
                              )}

                              {/* View Details Action */}
                              <button
                                type="button"
                                className="btn-view-details"
                                onClick={() => setViewingAssignment(assignment)}
                                title="View assignment instructions, attachments & submission"
                              >
                                <Eye size={13} />
                                <span>Details</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* View Assignment Details Modal */}
        {viewingAssignment && (
          <div className="parent-modal-overlay" onClick={() => setViewingAssignment(null)}>
            <div className="parent-modal-container" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="parent-modal-header">
                <div className="parent-modal-header-left">
                  <span className="parent-subject-badge" style={{ alignSelf: 'flex-start' }}>
                    {viewingAssignment.subject}
                  </span>
                  <h2 className="parent-modal-title">{viewingAssignment.title}</h2>
                </div>
                <button
                  type="button"
                  className="parent-modal-close-btn"
                  onClick={() => setViewingAssignment(null)}
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="parent-modal-body">
                {/* Metadata Grid */}
                <div className="parent-modal-meta-grid">
                  <div className="parent-modal-meta-item">
                    <span className="parent-modal-meta-label">Teacher</span>
                    <span className="parent-modal-meta-val">{viewingAssignment.teacherName}</span>
                  </div>
                  <div className="parent-modal-meta-item">
                    <span className="parent-modal-meta-label">Class & Section</span>
                    <span className="parent-modal-meta-val">
                      {viewingAssignment.className} - {viewingAssignment.section}
                    </span>
                  </div>
                  <div className="parent-modal-meta-item">
                    <span className="parent-modal-meta-label">Academic Year</span>
                    <span className="parent-modal-meta-val">{viewingAssignment.academicYear}</span>
                  </div>
                  <div className="parent-modal-meta-item">
                    <span className="parent-modal-meta-label">Assigned Date</span>
                    <span className="parent-modal-meta-val">{formatDate(viewingAssignment.assignedDate)}</span>
                  </div>
                  <div className="parent-modal-meta-item">
                    <span className="parent-modal-meta-label">Due Date</span>
                    <span className="parent-modal-meta-val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {formatDate(viewingAssignment.dueDate)}
                      {viewingAssignment.dueStatus === 'UPCOMING' && (
                        <span className="parent-due-status-badge upcoming" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                          Upcoming
                        </span>
                      )}
                      {viewingAssignment.dueStatus === 'DUE_TODAY' && (
                        <span className="parent-due-status-badge due-today" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                          Due Today
                        </span>
                      )}
                      {viewingAssignment.dueStatus === 'OVERDUE' && (
                        <span className="parent-due-status-badge overdue" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                          Overdue
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="parent-modal-meta-item">
                    <span className="parent-modal-meta-label">Maximum Marks</span>
                    <span className="parent-modal-meta-val">{viewingAssignment.maxMarks} points</span>
                  </div>
                </div>

                {/* Instructions Section */}
                <div>
                  <h3 className="parent-modal-section-title">Instructions & Overview</h3>
                  <div className="parent-modal-instructions-box">
                    {viewingAssignment.description || 'No additional instructions provided for this assignment.'}
                  </div>
                </div>

                {/* Teacher Attachment Section */}
                <div>
                  <h3 className="parent-modal-section-title">Teacher Attachment</h3>
                  {viewingAssignment.attachmentUrl ? (
                    <div className="parent-modal-attachment-card">
                      <div className="parent-modal-attachment-left">
                        <FileText size={20} style={{ color: 'var(--parent-primary, #20354A)' }} />
                        <span className="parent-modal-attachment-name">
                          {viewingAssignment.attachmentName || 'Assignment Reference Document'}
                        </span>
                      </div>
                      <a
                        href={viewingAssignment.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-download-attachment"
                      >
                        <ExternalLink size={13} />
                        <span>Open Attachment</span>
                      </a>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 8,
                        backgroundColor: 'var(--parent-bg-subtle, #FAF9F5)',
                        border: '1px solid var(--parent-border, #E8E5DD)',
                        fontSize: '0.78rem',
                        color: 'var(--parent-text-muted, #707781)',
                      }}
                    >
                      No resource attachment provided by the teacher for this coursework.
                    </div>
                  )}
                </div>

                {/* Student's Submission Section if available */}
                {viewingAssignment.submission ? (
                  <div className="parent-existing-submission-card">
                    <div className="parent-existing-sub-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ color: 'var(--parent-primary, #20354A)', fontSize: '0.86rem' }}>
                          Your Child&apos;s Submission
                        </strong>
                        <span className="parent-version-badge">
                          Version {viewingAssignment.submission.version}
                        </span>
                      </div>
                      <span style={{ color: 'var(--parent-text-muted, #707781)', fontSize: '0.72rem' }}>
                        Submitted {formatDateTime(viewingAssignment.submission.submittedAt)}
                      </span>
                    </div>

                    {/* Graded evaluation if present */}
                    {viewingAssignment.submission.gradingStatus === 'GRADED' && (
                      <div className="parent-graded-feedback-box">
                        <div className="parent-graded-score-row">
                          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase' }}>
                            Evaluation Result (Published)
                          </span>
                          <span className="parent-score-badge">
                            {viewingAssignment.submission.marksObtained ?? '—'} / {viewingAssignment.maxMarks} marks
                          </span>
                        </div>
                        {viewingAssignment.submission.feedback && (
                          <div className="parent-feedback-text">
                            &ldquo;{viewingAssignment.submission.feedback}&rdquo;
                          </div>
                        )}
                        {viewingAssignment.submission.publishedAt && (
                          <div style={{ marginTop: 6, fontSize: '0.7rem', color: '#6B7280' }}>
                            Graded & Published on {formatDateTime(viewingAssignment.submission.publishedAt)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Under review notice if review has begun but not published */}
                    {viewingAssignment.submission.gradingStatus === 'UNDER_REVIEW' && (
                      <div style={{ padding: '12px 14px', borderRadius: 8, backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Clock size={16} />
                        <span>Teacher has started reviewing this submission. Evaluation will be available once finalized and published.</span>
                      </div>
                    )}

                    {/* Text Answer */}
                    {viewingAssignment.submission.answerText && (
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--parent-text-muted, #707781)', textTransform: 'uppercase' }}>
                          Submitted Answer
                        </span>
                        <div className="parent-existing-sub-preview" style={{ marginTop: 4 }}>
                          {viewingAssignment.submission.answerText}
                        </div>
                      </div>
                    )}

                    {/* Attached File */}
                    {viewingAssignment.submission.attachmentUrl && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#FFFFFF', border: '1px solid var(--parent-border, #E8E5DD)', borderRadius: 7 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FileText size={16} style={{ color: 'var(--parent-primary, #20354A)' }} />
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--parent-primary, #20354A)' }}>
                            {viewingAssignment.submission.attachmentName || 'Submitted File'}
                          </span>
                        </div>
                        <a
                          href={viewingAssignment.submission.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-download-attachment"
                          style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                        >
                          <ExternalLink size={12} />
                          <span>View File</span>
                        </a>
                      </div>
                    )}

                    {/* Resubmit button if eligible */}
                    {viewingAssignment.submission.canResubmit && (
                      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-resubmit-action"
                          onClick={() => {
                            setViewingAssignment(null);
                            handleOpenSubmit(viewingAssignment);
                          }}
                        >
                          <History size={13} />
                          <span>Edit / Resubmit Assignment</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: 9,
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--parent-primary, #20354A)' }}>
                        Status: Not Submitted
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--parent-text-muted, #707781)' }}>
                        {viewingAssignment.canSubmit
                          ? 'This coursework has not been submitted yet.'
                          : 'The submission window for this assignment has closed.'}
                      </div>
                    </div>
                    {viewingAssignment.canSubmit && (
                      <button
                        type="button"
                        className="btn-submit-action"
                        onClick={() => {
                          setViewingAssignment(null);
                          handleOpenSubmit(viewingAssignment);
                        }}
                      >
                        <Send size={13} />
                        <span>Submit Work Now</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="parent-modal-footer">
                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => setViewingAssignment(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUBMIT ASSIGNMENT MODAL (Step 1: Input, Step 2: Confirmation)  */}
        {/* ============================================================== */}
        {submittingAssignment && (
          <div className="parent-modal-overlay" onClick={() => !isSubmitting && setSubmittingAssignment(null)}>
            <div className="parent-modal-container" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="parent-modal-header">
                <div className="parent-modal-header-left">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="parent-subject-badge">{submittingAssignment.subject}</span>
                    {submittingAssignment.submission && (
                      <span className="parent-version-badge">
                        Resubmitting (v{(submittingAssignment.submission.version || 1) + 1})
                      </span>
                    )}
                  </div>
                  <h2 className="parent-modal-title">
                    {submittingAssignment.submission ? 'Resubmit Assignment' : 'Submit Assignment'}
                  </h2>
                </div>
                {!isSubmitting && (
                  <button
                    type="button"
                    className="parent-modal-close-btn"
                    onClick={() => setSubmittingAssignment(null)}
                    aria-label="Close dialog"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Modal Body */}
              <div className="parent-modal-body">
                {/* Child and Assignment Summary Banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 8,
                    backgroundColor: 'var(--parent-bg-subtle, #FAF9F5)',
                    border: '1px solid var(--parent-border, #E8E5DD)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--parent-text-muted, #707781)' }}>Submitting for: </span>
                    <strong style={{ color: 'var(--parent-primary, #20354A)' }}>
                      {currentChild?.fullName || 'Child'}
                    </strong>{' '}
                    <span style={{ color: 'var(--parent-muted-blue, #647F99)' }}>
                      ({currentChild?.grade} - {currentChild?.section})
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--parent-text-muted, #707781)' }}>Due: </span>
                    <strong>{formatDate(submittingAssignment.dueDate)}</strong>
                  </div>
                </div>

                {/* Late Submission Policy Callout */}
                {submittingAssignment.allowLateSubmissions ? (
                  <div className="parent-submission-policy-box allowed">
                    <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <strong>Late Submissions Allowed:</strong> If submitted after the due date, this assignment will be accepted and flagged as a late submission for your teacher&apos;s review.
                    </div>
                  </div>
                ) : (
                  <div className="parent-submission-policy-box strict">
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <strong>Strict Deadline Policy:</strong> Submissions will not be accepted after the due date ({formatDate(submittingAssignment.dueDate)}).
                    </div>
                  </div>
                )}

                {/* Form Error Alert */}
                {submitFormError && (
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
                    <span>{submitFormError}</span>
                  </div>
                )}

                {/* STEP 1: Form Input */}
                {!showConfirmationStep ? (
                  <form onSubmit={handleProceedToConfirmation} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Text Answer */}
                    <div className="parent-form-group">
                      <label htmlFor="submit-text" className="parent-form-label">
                        <span>Written Answer / Submission Notes</span>
                        <span className="parent-char-count">{submitAnswerText.length} / 5000</span>
                      </label>
                      <textarea
                        id="submit-text"
                        className="parent-textarea"
                        placeholder="Type or paste your coursework answers, project notes, or explanations here..."
                        value={submitAnswerText}
                        onChange={(e) => setSubmitAnswerText(e.target.value)}
                        maxLength={5000}
                        rows={5}
                      />
                    </div>

                    {/* File Attachment Dropzone */}
                    <div className="parent-form-group">
                      <label className="parent-form-label">
                        <span>Supporting Document or Worksheet (Optional)</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--parent-text-subtle, #9EA5B0)', fontWeight: 400 }}>
                          Max 10MB
                        </span>
                      </label>

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />

                      {!attachedFile ? (
                        <div
                          className="parent-file-dropzone"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <UploadCloud size={28} className="parent-dropzone-icon" />
                          <div className="parent-dropzone-title">Click to upload or drag attachment here</div>
                          <div className="parent-dropzone-subtitle">
                            PDF, Word (.doc, .docx), Text, or Images (.png, .jpg) up to 10MB
                          </div>
                        </div>
                      ) : (
                        <div className="parent-selected-file-card">
                          <div className="parent-selected-file-info">
                            <FileText size={20} style={{ color: 'var(--parent-primary, #20354A)', flexShrink: 0 }} />
                            <div>
                              <div className="parent-selected-file-name" title={attachedFile.name}>
                                {attachedFile.name}
                              </div>
                              <div className="parent-selected-file-size">{attachedFile.sizeFormatted}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-remove-file"
                            onClick={handleRemoveAttachedFile}
                            title="Remove attached file"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Resubmission Warning note */}
                    {submittingAssignment.submission && (
                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--parent-text-muted, #707781)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: 'var(--parent-bg-subtle, #FAF9F5)',
                          padding: '8px 12px',
                          borderRadius: 6,
                        }}
                      >
                        <History size={14} />
                        <span>
                          Submitting this will create Version {(submittingAssignment.submission.version || 1) + 1}. Previous submission history will be safely preserved.
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="parent-modal-actions-row">
                      <button
                        type="button"
                        className="btn-cancel-submit"
                        onClick={() => setSubmittingAssignment(null)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-confirm-submit">
                        <span>Review & Submit</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </form>
                ) : (
                  /* STEP 2: Confirmation Review */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="parent-confirmation-card">
                      <div className="parent-confirmation-header">
                        <HelpCircle size={18} />
                        <span>Confirm Assignment Submission</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400E', lineHeight: 1.45 }}>
                        Please review your submission details before sending them to the teacher.
                      </p>

                      <div className="parent-confirmation-list">
                        <div className="parent-conf-item">
                          <span className="parent-conf-label">Student:</span>
                          <span className="parent-conf-val">
                            {currentChild?.fullName} ({currentChild?.grade} - {currentChild?.section})
                          </span>
                        </div>
                        <div className="parent-conf-item">
                          <span className="parent-conf-label">Assignment:</span>
                          <span className="parent-conf-val">{submittingAssignment.title}</span>
                        </div>
                        <div className="parent-conf-item">
                          <span className="parent-conf-label">Subject:</span>
                          <span className="parent-conf-val">{submittingAssignment.subject}</span>
                        </div>
                        <div className="parent-conf-item">
                          <span className="parent-conf-label">Text Answer:</span>
                          <span className="parent-conf-val">
                            {submitAnswerText.trim()
                              ? `${submitAnswerText.trim().substring(0, 60)}${submitAnswerText.trim().length > 60 ? '...' : ''} (${submitAnswerText.trim().length} chars)`
                              : 'None'}
                          </span>
                        </div>
                        <div className="parent-conf-item">
                          <span className="parent-conf-label">Attachment:</span>
                          <span className="parent-conf-val">
                            {attachedFile ? `${attachedFile.name} (${attachedFile.sizeFormatted})` : 'None'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="parent-modal-actions-row">
                      <button
                        type="button"
                        className="btn-cancel-submit"
                        disabled={isSubmitting}
                        onClick={() => setShowConfirmationStep(false)}
                      >
                        <ArrowLeft size={14} style={{ display: 'inline', marginRight: 4 }} />
                        Back to Edit
                      </button>
                      <button
                        type="button"
                        className="btn-confirm-submit"
                        disabled={isSubmitting}
                        onClick={handleFinalSubmit}
                      >
                        {isSubmitting ? (
                          <>
                            <RotateCw size={14} className="animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            <span>Confirm & Submit Work</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ParentLayout>
  );
};
