import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Award,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCw,
  Clock,
  Eye,
  User,
  BookOpen,
  Undo2,
  X,
  History,
  ShieldCheck,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { getApiErrorMessage } from '../../api/axiosClient';
import {
  ManagementResultsSummary,
  ManagementSubjectScheduleItem,
  ManagementScheduleMarksReviewDetails,
  TeacherMarksStatus,
  EXAM_TYPE_LABELS,
  Exam,
} from '../../types/exam.types';
import { ClassDetail } from '../../types/admin.types';
import './ManagementResultsReview.css';

interface ManagementResultsReviewProps {
  exams: Exam[];
  classes: ClassDetail[];
  academicYears: string[];
  refreshTrigger?: number;
}

export const ManagementResultsReview: React.FC<ManagementResultsReviewProps> = ({
  exams,
  classes,
  academicYears,
  refreshTrigger,
}) => {
  // Data states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ManagementResultsSummary>({
    totalExams: 0,
    scheduledSubjects: 0,
    pendingReviews: 0,
    returnedForCorrection: 0,
    publishedResults: 0,
  });
  const [records, setRecords] = useState<ManagementSubjectScheduleItem[]>([]);

  // Filter states
  const [selectedYear, setSelectedYear] = useState<string>('2026-2027');
  const [selectedExamId, setSelectedExamId] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Review Modal states
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [reviewLoading, setReviewLoading] = useState<boolean>(false);
  const [reviewDetails, setReviewDetails] = useState<ManagementScheduleMarksReviewDetails | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Return for correction sub-dialog state
  const [showReturnConfirm, setShowReturnConfirm] = useState<boolean>(false);
  const [returnReason, setReturnReason] = useState<string>('');
  const [actionSubmitting, setActionSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Publish confirmation sub-dialog state
  const [showPublishConfirm, setShowPublishConfirm] = useState<boolean>(false);

  // Reopen confirmation sub-dialog state
  const [showReopenConfirm, setShowReopenConfirm] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Available sections based on selected class
  const availableSections = useMemo(() => {
    if (selectedClass === 'ALL') return [];
    const cls = classes.find(
      (c) => c.name.toLowerCase() === selectedClass.toLowerCase()
    );
    return cls ? cls.sections.map((s) => s.name) : [];
  }, [classes, selectedClass]);

  // Available subjects based on records
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.subject) set.add(r.subject);
    });
    return Array.from(set).sort();
  }, [records]);

  // Fetch results dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getResultsDashboard({
        academicYear: selectedYear,
        examId: selectedExamId !== 'ALL' ? selectedExamId : undefined,
        className: selectedClass !== 'ALL' ? selectedClass : undefined,
        section: selectedSection !== 'ALL' ? selectedSection : undefined,
        subject: selectedSubject !== 'ALL' ? selectedSubject : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        search: searchTerm.trim() ? searchTerm.trim() : undefined,
      });

      if (res.success && res.data) {
        setSummary(res.data.summary);
        setRecords(res.data.records);
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to fetch examination results dashboard.'));
    } finally {
      setLoading(false);
    }
  }, [
    selectedYear,
    selectedExamId,
    selectedClass,
    selectedSection,
    selectedSubject,
    selectedStatus,
    searchTerm,
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchDashboardData();
    }
  }, [refreshTrigger, fetchDashboardData]);

  // Open review modal for a specific schedule
  const handleOpenReview = async (examId: string, scheduleId: string) => {
    setReviewModalOpen(true);
    setReviewLoading(true);
    setReviewError(null);
    setReviewDetails(null);
    setShowReturnConfirm(false);
    setShowPublishConfirm(false);
    setShowReopenConfirm(false);
    setReturnReason('');
    setReopenReason('');
    setActionError(null);

    try {
      const res = await adminApi.getScheduleMarksReview(examId, scheduleId);
      if (res.success && res.data) {
        setReviewDetails(res.data);
      }
    } catch (err: unknown) {
      setReviewError(getApiErrorMessage(err, 'Failed to load marks review details.'));
    } finally {
      setReviewLoading(false);
    }
  };

  // Submit return for correction
  const handleExecuteReturn = async () => {
    if (!reviewDetails) return;
    if (!returnReason.trim()) {
      setActionError('Please specify a detailed correction reason for the teacher.');
      return;
    }

    setActionSubmitting(true);
    setActionError(null);
    try {
      const res = await adminApi.returnScheduleMarks(
        reviewDetails.schedule.examId,
        reviewDetails.schedule.id,
        returnReason.trim()
      );
      if (res.success) {
        showToast(
          `Marks returned to ${reviewDetails.marksDoc?.teacherName || 'the assigned teacher'} for correction.`,
          'success'
        );
        setShowReturnConfirm(false);
        setReviewModalOpen(false);
        await fetchDashboardData();
      }
    } catch (err: unknown) {
      setActionError(getApiErrorMessage(err, 'Failed to return marks for correction.'));
    } finally {
      setActionSubmitting(false);
    }
  };

  // Submit approve and publish
  const handleExecutePublish = async () => {
    if (!reviewDetails) return;
    if (!reviewDetails.summary.isComplete) {
      setActionError(
        `Cannot publish: ${reviewDetails.summary.missingCount} student(s) have missing marks entries.`
      );
      return;
    }

    setActionSubmitting(true);
    setActionError(null);
    try {
      const res = await adminApi.publishScheduleMarks(
        reviewDetails.schedule.examId,
        reviewDetails.schedule.id
      );
      if (res.success) {
        showToast(
          `Official results for ${reviewDetails.schedule.subject} (${reviewDetails.schedule.className} - ${reviewDetails.schedule.section}) published successfully! Parents can now view these results.`,
          'success'
        );
        setShowPublishConfirm(false);
        setReviewModalOpen(false);
        await fetchDashboardData();
      }
    } catch (err: unknown) {
      setActionError(getApiErrorMessage(err, 'Failed to publish examination results.'));
    } finally {
      setActionSubmitting(false);
    }
  };

  // Submit reopen for post-publication correction
  const handleExecuteReopen = async () => {
    if (!reviewDetails) return;
    if (!reopenReason.trim()) {
      setActionError('Please provide an administrative reason for reopening published results.');
      return;
    }

    setActionSubmitting(true);
    setActionError(null);
    try {
      const res = await adminApi.reopenScheduleMarks(
        reviewDetails.schedule.examId,
        reviewDetails.schedule.id,
        reopenReason.trim()
      );
      if (res.success) {
        showToast(
          `Official results reopened for correction. The assigned teacher can now modify and resubmit the marks.`,
          'success'
        );
        setShowReopenConfirm(false);
        setReviewModalOpen(false);
        await fetchDashboardData();
      }
    } catch (err: unknown) {
      setActionError(getApiErrorMessage(err, 'Failed to reopen published results.'));
    } finally {
      setActionSubmitting(false);
    }
  };

  // Helper for status badge styling
  const renderStatusBadge = (status: TeacherMarksStatus | 'PENDING') => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="admin-status-pill pill-warning">
            <Clock size={12} />
            <span>Submitted for Review</span>
          </span>
        );
      case 'RETURNED':
        return (
          <span className="admin-status-pill pill-rejected">
            <Undo2 size={12} />
            <span>Returned for Correction</span>
          </span>
        );
      case 'PUBLISHED':
        return (
          <span className="admin-status-pill pill-success">
            <CheckCircle2 size={12} />
            <span>Published</span>
          </span>
        );
      case 'DRAFT':
        return (
          <span className="admin-status-pill pill-draft">
            <span>Draft Saved</span>
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="admin-status-pill pill-secondary">
            <span>Marks Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="management-results-review-container">
      {/* Toast alert */}
      {toastMessage && (
        <div
          className={`admin-toast-${toastMessage.type}`}
          role="status"
          style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200 }}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Five Summary Statistics Cards */}
      <div className="admin-results-summary-grid">
        {/* Card 1: Total Exams */}
        <div className="admin-results-stat-card">
          <div className="admin-results-stat-header">
            <span className="admin-results-stat-label">Total Exams</span>
            <div className="admin-results-stat-icon icon-navy">
              <Award size={18} />
            </div>
          </div>
          <div className="admin-results-stat-value">{summary.totalExams}</div>
        </div>

        {/* Card 2: Scheduled Subjects */}
        <div className="admin-results-stat-card">
          <div className="admin-results-stat-header">
            <span className="admin-results-stat-label">Scheduled Subjects</span>
            <div className="admin-results-stat-icon icon-blue">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="admin-results-stat-value">{summary.scheduledSubjects}</div>
        </div>

        {/* Card 3: Pending Reviews */}
        <div className={`admin-results-stat-card ${summary.pendingReviews > 0 ? 'stat-card-amber' : ''}`}>
          <div className="admin-results-stat-header">
            <span className="admin-results-stat-label">Pending Reviews</span>
            <div className="admin-results-stat-icon icon-amber">
              <Clock size={18} />
            </div>
          </div>
          <div className="admin-results-stat-value" style={{ color: summary.pendingReviews > 0 ? '#B45309' : undefined }}>
            {summary.pendingReviews}
          </div>
        </div>

        {/* Card 4: Returned for Correction */}
        <div className={`admin-results-stat-card ${summary.returnedForCorrection > 0 ? 'stat-card-red' : ''}`}>
          <div className="admin-results-stat-header">
            <span className="admin-results-stat-label">Returned for Correction</span>
            <div className="admin-results-stat-icon icon-red">
              <Undo2 size={18} />
            </div>
          </div>
          <div className="admin-results-stat-value" style={{ color: summary.returnedForCorrection > 0 ? '#B91C1C' : undefined }}>
            {summary.returnedForCorrection}
          </div>
        </div>

        {/* Card 5: Published Results */}
        <div className="admin-results-stat-card">
          <div className="admin-results-stat-header">
            <span className="admin-results-stat-label">Published Results</span>
            <div className="admin-results-stat-icon icon-green">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="admin-results-stat-value" style={{ color: '#15803D' }}>
            {summary.publishedResults}
          </div>
        </div>
      </div>

      {/* 2. Search and Filters Panel */}
      <div className="admin-results-filter-panel">
        {/* Row 1: Search, Academic Year, Examination, Class */}
        <div className="admin-results-filter-row">
          {/* Search Input */}
          <div className="admin-results-filter-col">
            <label htmlFor="results-filter-search" className="admin-results-filter-label">
              Search
            </label>
            <div className="admin-results-search-wrap">
              <Search size={16} className="admin-results-search-icon" />
              <input
                id="results-filter-search"
                type="text"
                className="admin-results-filter-input with-icon"
                placeholder="Search exam, subject, teacher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Academic Year */}
          <div className="admin-results-filter-col">
            <label htmlFor="results-filter-year" className="admin-results-filter-label">
              Academic Year
            </label>
            <select
              id="results-filter-year"
              className="admin-results-filter-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="ALL">All Academic Years</option>
              {academicYears.map((yr) => (
                <option key={yr} value={yr}>
                  Academic Year {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Examination */}
          <div className="admin-results-filter-col">
            <label htmlFor="results-filter-exam" className="admin-results-filter-label">
              Examination
            </label>
            <select
              id="results-filter-exam"
              className="admin-results-filter-select"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
            >
              <option value="ALL">All Examinations</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({EXAM_TYPE_LABELS[ex.examType] || ex.examType})
                </option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div className="admin-results-filter-col">
            <label htmlFor="results-filter-class" className="admin-results-filter-label">
              Class
            </label>
            <select
              id="results-filter-class"
              className="admin-results-filter-select"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection('ALL');
              }}
            >
              <option value="ALL">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.name}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Section, Subject, Review Status, Reset Filters */}
        <div className="admin-results-filter-row">
          {/* Section */}
          <div className="admin-results-filter-col">
            <label htmlFor="results-filter-section" className="admin-results-filter-label">
              Section
            </label>
            <select
              id="results-filter-section"
              className="admin-results-filter-select"
              value={selectedSection}
              disabled={selectedClass === 'ALL'}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <option value="ALL">All Sections</option>
              {availableSections.map((sec) => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div className="admin-results-filter-col">
            <label htmlFor="results-filter-subject" className="admin-results-filter-label">
              Subject
            </label>
            <select
              id="results-filter-subject"
              className="admin-results-filter-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="ALL">All Subjects</option>
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Review Status */}
          <div className="admin-results-filter-col">
            <label htmlFor="results-filter-status" className="admin-results-filter-label">
              Review Status
            </label>
            <select
              id="results-filter-status"
              className="admin-results-filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All Review Statuses</option>
              <option value="SUBMITTED">Submitted for Review</option>
              <option value="RETURNED">Returned for Correction</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft Saved</option>
              <option value="PENDING">Marks Pending</option>
            </select>
          </div>

          {/* Reset Filters button */}
          <div className="admin-results-filter-col">
            <label className="admin-results-filter-label" style={{ visibility: 'hidden' }}>
              Action
            </label>
            <button
              id="results-reset-filters-btn"
              type="button"
              className="admin-results-reset-btn"
              onClick={() => {
                setSelectedExamId('ALL');
                setSelectedClass('ALL');
                setSelectedSection('ALL');
                setSelectedSubject('ALL');
                setSelectedStatus('ALL');
                setSearchTerm('');
              }}
            >
              <RotateCw size={14} />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Results Table Card */}
      <div className="admin-results-table-card">
        {/* Section Header */}
        <div className="admin-results-table-header">
          <div>
            <h2 className="admin-results-table-title">Examination Submissions</h2>
            <p className="admin-results-table-subtitle">Review marks submitted by teachers.</p>
          </div>
          <span className="admin-results-table-count">
            {records.length} {records.length === 1 ? 'record' : 'records'} found
          </span>
        </div>

        {loading ? (
          <div className="admin-loading-state" style={{ padding: '60px 0', textAlign: 'center' }}>
            <RotateCw className="admin-spin" size={32} style={{ color: 'var(--admin-primary)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>
              Loading examination submissions and marks review queues...
            </p>
          </div>
        ) : error ? (
          <div className="admin-error-banner" style={{ margin: 24 }}>
            <AlertCircle size={20} />
            <div>
              <strong>Error Loading Results Dashboard</strong>
              <p>{error}</p>
            </div>
            <button
              type="button"
              className="admin-btn-secondary"
              style={{ marginLeft: 'auto' }}
              onClick={fetchDashboardData}
            >
              Retry
            </button>
          </div>
        ) : records.length === 0 ? (
          <div className="admin-empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Award size={44} style={{ color: 'var(--admin-text-subtle)', marginBottom: 14 }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--admin-text-main)', margin: '0 0 6px' }}>
              No Scheduled Examination Records Found
            </h3>
            <p style={{ color: 'var(--admin-text-muted)', maxWidth: 460, margin: '0 auto', fontSize: '0.85rem' }}>
              No subject examinations match your currently selected filters. Adjust your filters or select a different academic year.
            </p>
          </div>
        ) : (
          <div className="admin-results-table-scroll-wrap">
            <table className="admin-results-table">
              <thead>
                <tr>
                  <th style={{ width: '18%', minWidth: 180 }}>Examination</th>
                  <th style={{ width: '12%', minWidth: 130 }}>Class / Section</th>
                  <th style={{ width: '13%', minWidth: 140 }}>Subject</th>
                  <th style={{ width: '13%', minWidth: 140 }}>Assigned Teacher</th>
                  <th style={{ width: '7%', minWidth: 80, textAlign: 'center' }}>Students</th>
                  <th style={{ width: '15%', minWidth: 160 }}>Marks Completeness</th>
                  <th style={{ width: '11%', minWidth: 130 }}>Submission Info</th>
                  <th style={{ width: '11%', minWidth: 140 }}>Review Status</th>
                  <th style={{ width: '10%', minWidth: 130, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => {
                  const isComplete = rec.missingStudentsCount === 0 && rec.totalStudents > 0;
                  const hasMissing = rec.missingStudentsCount > 0 && rec.evaluatedStudentsCount > 0;

                  return (
                    <tr
                      key={rec.id}
                      style={{
                        backgroundColor:
                          rec.marksStatus === 'SUBMITTED' ? '#FFFDF8' : undefined,
                      }}
                    >
                      {/* Examination */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--admin-text-main)', fontSize: '0.875rem' }}>
                          {rec.examName}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-subtle)', marginTop: 2 }}>
                          {EXAM_TYPE_LABELS[rec.examType] || rec.examType} • {rec.examDate}
                        </div>
                      </td>

                      {/* Class / Section */}
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--admin-bg-subtle, #FAF9F5)',
                            border: '1px solid var(--admin-border-subtle, #F0EDE5)',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            color: 'var(--admin-text-main)',
                          }}
                        >
                          {rec.className} - {rec.section}
                        </span>
                      </td>

                      {/* Subject */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>{rec.subject}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-subtle)', marginTop: 2 }}>
                          Max: {rec.maxMarks} | Pass: {rec.passingMarks}
                        </div>
                      </td>

                      {/* Assigned Teacher */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={13} style={{ color: 'var(--admin-text-subtle)', flexShrink: 0 }} />
                          <span
                            style={{
                              fontSize: '0.84rem',
                              color: 'var(--admin-text-main)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 140,
                            }}
                          >
                            {rec.assignedTeacherName}
                          </span>
                        </div>
                      </td>

                      {/* Students */}
                      <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.875rem' }}>
                        {rec.totalStudents}
                      </td>

                      {/* Marks Completeness */}
                      <td>
                        {rec.totalStudents === 0 ? (
                          <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-subtle)' }}>
                            No Enrolled Students
                          </span>
                        ) : isComplete ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle2 size={15} style={{ color: '#15803D', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.82rem', color: '#15803D', fontWeight: 600 }}>
                              Complete ({rec.evaluatedStudentsCount}/{rec.totalStudents})
                            </span>
                          </div>
                        ) : hasMissing ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <AlertTriangle size={14} style={{ color: '#B45309', flexShrink: 0 }} />
                              <span style={{ fontSize: '0.82rem', color: '#B45309', fontWeight: 600 }}>
                                {rec.missingStudentsCount} Missing
                              </span>
                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--admin-text-subtle)', marginTop: 2 }}>
                              {rec.evaluatedStudentsCount} of {rec.totalStudents} evaluated
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-subtle)' }}>
                            0 of {rec.totalStudents} entered
                          </span>
                        )}
                      </td>

                      {/* Submission Info */}
                      <td>
                        {rec.submittedAt ? (
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--admin-text-main)' }}>
                              {new Date(rec.submittedAt).toLocaleDateString()}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--admin-text-subtle)', marginTop: 1 }}>
                              by {rec.submittedByName || 'Teacher'}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-subtle)' }}>
                            Not submitted yet
                          </span>
                        )}
                      </td>

                      {/* Review Status */}
                      <td>{renderStatusBadge(rec.marksStatus)}</td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className={`admin-results-action-btn ${
                            rec.marksStatus === 'SUBMITTED'
                              ? 'primary'
                              : rec.marksStatus === 'RETURNED'
                              ? 'danger-outline'
                              : 'secondary'
                          }`}
                          onClick={() => handleOpenReview(rec.examId, rec.id)}
                          title={
                            rec.marksStatus === 'SUBMITTED'
                              ? 'Review submitted marks for publication or correction'
                              : rec.marksStatus === 'RETURNED'
                              ? 'View returned marks status'
                              : rec.marksStatus === 'PUBLISHED'
                              ? 'View published examination results'
                              : 'View current draft marks'
                          }
                        >
                          <Eye size={13} />
                          <span>
                            {rec.marksStatus === 'SUBMITTED'
                              ? 'Review Marks'
                              : rec.marksStatus === 'RETURNED'
                              ? 'View Revision'
                              : rec.marksStatus === 'PUBLISHED'
                              ? 'View Published'
                              : 'View Marks'}
                          </span>
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

      {/* Review Submitted Marks Modal */}
      {reviewModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => !actionSubmitting && setReviewModalOpen(false)}>
          <div
            className="admin-modal-content"
            style={{ maxWidth: 940, width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="admin-modal-header" style={{ padding: '18px 24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--admin-text-main)' }}>
                    {reviewDetails
                      ? `${reviewDetails.schedule.subject} — Marks Review`
                      : 'Examination Marks Review'}
                  </h2>
                  {reviewDetails && reviewDetails.marksDoc && (
                    <span>{renderStatusBadge(reviewDetails.marksDoc.status)}</span>
                  )}
                </div>
                {reviewDetails && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--admin-text-muted)' }}>
                    {reviewDetails.examName} ({EXAM_TYPE_LABELS[reviewDetails.examType] || reviewDetails.examType}) • Class{' '}
                    <strong>{reviewDetails.schedule.className}</strong>, Section <strong>{reviewDetails.schedule.section}</strong> • Academic Year {reviewDetails.schedule.academicYear}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="admin-modal-close"
                disabled={actionSubmitting}
                onClick={() => setReviewModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="admin-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {reviewLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <RotateCw className="admin-spinner" size={32} />
                  <p style={{ marginTop: 12, color: 'var(--admin-text-muted)' }}>
                    Retrieving official student roster and submission evaluations...
                  </p>
                </div>
              ) : reviewError ? (
                <div className="admin-error-banner">
                  <AlertCircle size={20} />
                  <span>{reviewError}</span>
                </div>
              ) : reviewDetails ? (
                <div>
                  {/* Status Banner / Alerts */}
                  {reviewDetails.marksDoc?.status === 'RETURNED' && (
                    <div
                      style={{
                        backgroundColor: '#FFF5F5',
                        border: '1px solid #FEB2B2',
                        borderRadius: 8,
                        padding: '12px 16px',
                        marginBottom: 18,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <Undo2 size={20} style={{ color: '#E53E3E', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontWeight: 600, color: '#C53030' }}>
                          Returned to Teacher for Correction
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#742A2A', marginTop: 4 }}>
                          <strong>Reason:</strong> {reviewDetails.marksDoc.returnReason}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#9B2C2C', marginTop: 4 }}>
                          Returned by {reviewDetails.marksDoc.returnedByName || 'Management'} on{' '}
                          {reviewDetails.marksDoc.returnedAt
                            ? new Date(reviewDetails.marksDoc.returnedAt).toLocaleString()
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                  )}

                  {reviewDetails.marksDoc?.status === 'PUBLISHED' && (
                    <div
                      style={{
                        backgroundColor: '#F0FFF4',
                        border: '1px solid #9AE6B4',
                        borderRadius: 8,
                        padding: '12px 16px',
                        marginBottom: 18,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <CheckCircle2 size={20} style={{ color: '#38A169', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontWeight: 600, color: '#276749' }}>
                          Official Examination Results Published
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#2F855A', marginTop: 4 }}>
                          These marks have been validated and published to the Parent Portal. Parents of enrolled students can now access their child's marks and performance card.
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#276749', marginTop: 4 }}>
                          Published by {reviewDetails.marksDoc.publishedByName || 'Management'} on{' '}
                          {reviewDetails.marksDoc.publishedAt
                            ? new Date(reviewDetails.marksDoc.publishedAt).toLocaleString()
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                  )}

                  {!reviewDetails.summary.isComplete && (
                    <div
                      style={{
                        backgroundColor: '#FFFAF0',
                        border: '1px solid #FBD38D',
                        borderRadius: 8,
                        padding: '12px 16px',
                        marginBottom: 18,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <AlertTriangle size={20} style={{ color: '#DD6B20', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontWeight: 600, color: '#C05621' }}>
                          Incomplete Marks Submission Detected
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#9C4221', marginTop: 4 }}>
                          {reviewDetails.summary.missingCount} enrolled student(s) on the official roster do not have entered marks or marked absences.
                          Management approval requires 100% evaluated student records. You must return this submission to the teacher for completion before publishing.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary Metric Badges */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: 12,
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ background: 'var(--admin-bg)', padding: '12px', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>
                        Total Enrolled
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--admin-text-main)', marginTop: 4 }}>
                        {reviewDetails.summary.totalEnrolled}
                      </div>
                    </div>

                    <div style={{ background: '#F0F9FF', padding: '12px', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#0369A1', textTransform: 'uppercase' }}>
                        Valid Marks
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0369A1', marginTop: 4 }}>
                        {reviewDetails.summary.validMarksCount}
                      </div>
                    </div>

                    <div style={{ background: '#FEF3C7', padding: '12px', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: '#92400E', textTransform: 'uppercase' }}>
                        Absent Students
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#92400E', marginTop: 4 }}>
                        {reviewDetails.summary.absentCount}
                      </div>
                    </div>

                    <div
                      style={{
                        background: reviewDetails.summary.missingCount > 0 ? '#FEE2E2' : '#F0FDF4',
                        padding: '12px',
                        borderRadius: 8,
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: reviewDetails.summary.missingCount > 0 ? '#991B1B' : '#166534',
                          textTransform: 'uppercase',
                        }}
                      >
                        Missing Entries
                      </div>
                      <div
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: reviewDetails.summary.missingCount > 0 ? '#DC2626' : '#16A34A',
                          marginTop: 4,
                        }}
                      >
                        {reviewDetails.summary.missingCount}
                      </div>
                    </div>

                    <div style={{ background: 'var(--admin-bg)', padding: '12px', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>
                        Passing / Max Marks
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--admin-text-main)', marginTop: 4 }}>
                        {reviewDetails.schedule.passingMarks} / {reviewDetails.schedule.maxMarks}
                      </div>
                    </div>

                    <div style={{ background: 'var(--admin-bg)', padding: '12px', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>
                        Class Average
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--admin-text-main)', marginTop: 4 }}>
                        {reviewDetails.summary.averageMarks !== null
                          ? `${reviewDetails.summary.averageMarks} / ${reviewDetails.schedule.maxMarks}`
                          : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Official Student Roster Table */}
                  <div style={{ border: '1px solid var(--admin-border)', borderRadius: 8, overflow: 'hidden' }}>
                    <div
                      style={{
                        background: 'var(--admin-bg)',
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--admin-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        Official Student Roster & Evaluation Breakdown ({reviewDetails.roster.length} Enrolled)
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                        Evaluator: <strong>{reviewDetails.marksDoc?.teacherName || 'Assigned Teacher'}</strong>
                      </span>
                    </div>

                    <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                      <table className="admin-timetable-table" style={{ margin: 0 }}>
                        <thead>
                          <tr>
                            <th style={{ width: 60 }}>Roll</th>
                            <th style={{ width: 110 }}>Admission ID</th>
                            <th>Student Full Name</th>
                            <th style={{ width: 110, textAlign: 'right' }}>Marks Obtained</th>
                            <th style={{ width: 90, textAlign: 'center' }}>Percentage</th>
                            <th style={{ width: 70, textAlign: 'center' }}>Grade</th>
                            <th style={{ width: 90, textAlign: 'center' }}>Status</th>
                            <th>Teacher Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reviewDetails.roster.map((stu) => {
                            return (
                              <tr
                                key={stu.studentId}
                                style={{
                                  backgroundColor: stu.isMissing
                                    ? '#FEF2F2'
                                    : stu.isAbsent
                                    ? '#FFFBEB'
                                    : undefined,
                                }}
                              >
                                <td style={{ color: 'var(--admin-text-subtle)' }}>
                                  {stu.rollNumber || '—'}
                                </td>
                                <td style={{ fontWeight: 500 }}>{stu.admissionNumber}</td>
                                <td style={{ fontWeight: 600 }}>{stu.studentName}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                  {stu.isAbsent ? (
                                    <span style={{ color: '#D97706', fontWeight: 700 }}>ABSENT</span>
                                  ) : stu.marksObtained !== null ? (
                                    <span>
                                      {stu.marksObtained}
                                      <span style={{ color: 'var(--admin-text-subtle)', fontWeight: 400 }}>
                                        {' '}
                                        / {reviewDetails.schedule.maxMarks}
                                      </span>
                                    </span>
                                  ) : (
                                    <span style={{ color: '#DC2626', fontWeight: 700 }}>MISSING</span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'center', fontSize: '0.875rem' }}>
                                  {stu.percentage !== null ? `${stu.percentage}%` : '—'}
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 700 }}>
                                  {stu.grade || '—'}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {stu.isMissing ? (
                                    <span className="admin-status-pill pill-rejected" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                                      MISSING
                                    </span>
                                  ) : stu.isAbsent ? (
                                    <span className="admin-status-pill pill-warning" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                                      ABSENT
                                    </span>
                                  ) : stu.isPassed ? (
                                    <span className="admin-status-pill pill-success" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                                      PASSED
                                    </span>
                                  ) : (
                                    <span className="admin-status-pill pill-rejected" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                                      FAILED
                                    </span>
                                  )}
                                </td>
                                <td style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                                  {stu.remarks || '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Review Audit History */}
                  {reviewDetails.marksDoc?.reviewHistory &&
                    reviewDetails.marksDoc.reviewHistory.length > 0 && (
                      <div style={{ marginTop: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.875rem', marginBottom: 8 }}>
                          <History size={16} />
                          <span>Review & Workflow Audit History</span>
                        </div>
                        <div style={{ border: '1px solid var(--admin-border)', borderRadius: 8, background: 'var(--admin-bg-subtle)', padding: 12 }}>
                          {reviewDetails.marksDoc.reviewHistory.map((item, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: '6px 0',
                                borderBottom:
                                  idx < reviewDetails.marksDoc!.reviewHistory!.length - 1
                                    ? '1px dashed var(--admin-border)'
                                    : 'none',
                                fontSize: '0.82rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 600 }}>{item.status}: </span>
                                <span>{item.reason || 'Status updated'}</span>
                                <span style={{ color: 'var(--admin-text-subtle)' }}>
                                  {' '}
                                  by {item.changedByName || 'User'}
                                </span>
                              </div>
                              <div style={{ color: 'var(--admin-text-subtle)', fontSize: '0.75rem' }}>
                                {new Date(item.changedAt).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              ) : null}
            </div>

            {/* Modal Footer Actions */}
            <div
              className="admin-modal-footer"
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--admin-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                className="admin-btn-secondary"
                disabled={actionSubmitting}
                onClick={() => setReviewModalOpen(false)}
              >
                Close
              </button>

              <div style={{ display: 'flex', gap: 12 }}>
                {/* Return for Correction button (active if SUBMITTED) */}
                {reviewDetails?.marksDoc?.status === 'SUBMITTED' && (
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    style={{
                      color: '#C53030',
                      borderColor: '#FEB2B2',
                      backgroundColor: '#FFF5F5',
                    }}
                    disabled={actionSubmitting}
                    onClick={() => {
                      setActionError(null);
                      setShowReturnConfirm(true);
                    }}
                  >
                    <Undo2 size={16} style={{ marginRight: 6 }} />
                    Return for Correction
                  </button>
                )}

                {/* Approve & Publish Results button (active if SUBMITTED and complete) */}
                {reviewDetails?.marksDoc?.status === 'SUBMITTED' && (
                  <button
                    type="button"
                    className="admin-btn-primary"
                    style={{
                      backgroundColor: reviewDetails.summary.isComplete ? '#276749' : undefined,
                      opacity: reviewDetails.summary.isComplete ? 1 : 0.6,
                      cursor: reviewDetails.summary.isComplete ? 'pointer' : 'not-allowed',
                    }}
                    disabled={actionSubmitting || !reviewDetails.summary.isComplete}
                    title={
                      !reviewDetails.summary.isComplete
                        ? 'All enrolled students must have marks entered or be marked absent before results can be published.'
                        : undefined
                    }
                    onClick={() => {
                      setActionError(null);
                      setShowPublishConfirm(true);
                    }}
                  >
                    <CheckCircle2 size={16} style={{ marginRight: 6 }} />
                    Approve & Publish Results
                  </button>
                )}

                {/* Reopen Published Results for Correction (if already PUBLISHED) */}
                {reviewDetails?.marksDoc?.status === 'PUBLISHED' && (
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    style={{
                      color: '#C53030',
                      borderColor: '#FEB2B2',
                      backgroundColor: '#FFF5F5',
                    }}
                    disabled={actionSubmitting}
                    onClick={() => {
                      setActionError(null);
                      setShowReopenConfirm(true);
                    }}
                  >
                    <Undo2 size={16} style={{ marginRight: 6 }} />
                    Reopen for Correction
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return for Correction Confirmation Dialog */}
      {showReturnConfirm && (
        <div className="admin-modal-backdrop" style={{ zIndex: 1300 }}>
          <div
            className="admin-modal-content"
            style={{ maxWidth: 520, width: '90%', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: '#FFF5F5',
                  color: '#E53E3E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Undo2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Return Marks for Correction</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                  This will unlock the submission so the teacher can edit and resubmit.
                </p>
              </div>
            </div>

            {actionError && (
              <div className="admin-error-banner" style={{ marginBottom: 14 }}>
                <AlertCircle size={16} />
                <span>{actionError}</span>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
                Reason for Revision <span style={{ color: '#E53E3E' }}>*</span>
              </label>
              <textarea
                className="admin-form-input"
                style={{ width: '100%', height: 90, padding: 10, fontSize: '0.875rem', resize: 'vertical' }}
                placeholder="Explain what needs correction (e.g. Missing marks for 2 absent students, recalculate maximum total marks...)"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="admin-btn-secondary"
                disabled={actionSubmitting}
                onClick={() => setShowReturnConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                style={{ backgroundColor: '#C53030' }}
                disabled={actionSubmitting || !returnReason.trim()}
                onClick={handleExecuteReturn}
              >
                {actionSubmitting ? (
                  <>
                    <RotateCw className="admin-spinner" size={14} style={{ marginRight: 6 }} />
                    Returning...
                  </>
                ) : (
                  'Confirm & Return'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Official Results Confirmation Dialog */}
      {showPublishConfirm && (
        <div className="admin-modal-backdrop" style={{ zIndex: 1300 }}>
          <div
            className="admin-modal-content"
            style={{ maxWidth: 520, width: '90%', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: '#F0FFF4',
                  color: '#38A169',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Publish Official Results</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                  Confirm results publication for {reviewDetails?.schedule.subject} ({reviewDetails?.schedule.className} - {reviewDetails?.schedule.section})
                </p>
              </div>
            </div>

            {actionError && (
              <div className="admin-error-banner" style={{ marginBottom: 14 }}>
                <AlertCircle size={16} />
                <span>{actionError}</span>
              </div>
            )}

            <div
              style={{
                backgroundColor: '#F7FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '14px',
                fontSize: '0.875rem',
                color: 'var(--admin-text-main)',
                marginBottom: 18,
                lineHeight: 1.5,
              }}
            >
              <p style={{ margin: 0 }}>
                You are about to publish the official examination marks for <strong>{reviewDetails?.summary.totalEnrolled} student(s)</strong>.
              </p>
              <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                <li>All enrolled students have complete evaluations ({reviewDetails?.summary.validMarksCount} evaluated, {reviewDetails?.summary.absentCount} absent).</li>
                <li>Results will become <strong>immediately visible</strong> to authorized parents on their portal.</li>
                <li>Subsequent edits will require an explicitly authorized correction reopening process.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="admin-btn-secondary"
                disabled={actionSubmitting}
                onClick={() => setShowPublishConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                style={{ backgroundColor: '#276749' }}
                disabled={actionSubmitting}
                onClick={handleExecutePublish}
              >
                {actionSubmitting ? (
                  <>
                    <RotateCw className="admin-spinner" size={14} style={{ marginRight: 6 }} />
                    Publishing...
                  </>
                ) : (
                  'Yes, Publish Results'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Published Results for Correction Dialog */}
      {showReopenConfirm && (
        <div className="admin-modal-backdrop" style={{ zIndex: 1300 }}>
          <div
            className="admin-modal-content"
            style={{ maxWidth: 520, width: '90%', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: '#FFF5F5',
                  color: '#E53E3E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Undo2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Reopen Published Results for Correction</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                  Explicitly authorized workflow for modifying results after publication.
                </p>
              </div>
            </div>

            {actionError && (
              <div className="admin-error-banner" style={{ marginBottom: 14 }}>
                <AlertCircle size={16} />
                <span>{actionError}</span>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
                Administrative Correction Reason <span style={{ color: '#E53E3E' }}>*</span>
              </label>
              <textarea
                className="admin-form-input"
                style={{ width: '100%', height: 90, padding: 10, fontSize: '0.875rem', resize: 'vertical' }}
                placeholder="State why published results need to be reopened and corrected..."
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="admin-btn-secondary"
                disabled={actionSubmitting}
                onClick={() => setShowReopenConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                style={{ backgroundColor: '#C53030' }}
                disabled={actionSubmitting || !reopenReason.trim()}
                onClick={handleExecuteReopen}
              >
                {actionSubmitting ? (
                  <>
                    <RotateCw className="admin-spinner" size={14} style={{ marginRight: 6 }} />
                    Reopening...
                  </>
                ) : (
                  'Reopen for Correction'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
