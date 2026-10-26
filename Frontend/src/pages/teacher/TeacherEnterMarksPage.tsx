import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCw,
  Save,
  Send,
  Search,
  UserCheck,
  UserX,
  Users,
  Sparkles,
  X,
  Lock,
} from 'lucide-react';
import { TeacherLayout } from '../../components/teacher/TeacherLayout';
import { teacherApi } from '../../api/teacherApi';
import { getApiErrorMessage } from '../../api/axiosClient';
import {
  TeacherExamScheduleItem,
  StudentRosterMarkItem,
  SaveStudentMarkInput,
  EXAM_TYPE_LABELS,
  TEACHER_MARKS_STATUS_LABELS,
} from '../../types/exam.types';

export const TeacherEnterMarksPage: React.FC = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();

  // Core Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [savingDraft, setSavingDraft] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Loaded Schedule & Marks
  const [schedule, setSchedule] = useState<TeacherExamScheduleItem | null>(null);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [students, setStudents] = useState<StudentRosterMarkItem[]>([]);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'MISSING' | 'ENTERED' | 'ABSENT'>('ALL');

  // Confirmation Modal for Final Submission
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Toast notifications
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setToastSuccess(msg);
    setTimeout(() => setToastSuccess(null), 4500);
  };

  const showError = (msg: string) => {
    setToastError(msg);
    setTimeout(() => setToastError(null), 6000);
  };

  const fetchScheduleAndMarks = async () => {
    if (!scheduleId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await teacherApi.getExamScheduleMarks(scheduleId);
      if (res.success && res.data) {
        setSchedule(res.data.schedule);
        setIsReadOnly(res.data.isReadOnly);
        setStudents(res.data.students || []);
      }
    } catch (err: unknown) {
      console.error('Failed to load exam schedule marks:', err);
      setError(
        getApiErrorMessage(
          err,
          'Failed to load examination schedule and marks roster. Please retry.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleAndMarks();
  }, [scheduleId]);

  // Handle Mark input change
  const handleMarkChange = (studentId: string, val: string) => {
    if (isReadOnly) return;
    setStudents((prev) =>
      prev.map((s) => {
        if (s.studentId !== studentId) return s;
        if (val.trim() === '') {
          return { ...s, marksObtained: null };
        }
        const parsed = Number(val);
        if (isNaN(parsed)) return s;
        return { ...s, marksObtained: parsed };
      })
    );
  };

  // Handle Absent toggle
  const handleAbsentToggle = (studentId: string) => {
    if (isReadOnly) return;
    setStudents((prev) =>
      prev.map((s) => {
        if (s.studentId !== studentId) return s;
        const nextAbsent = !s.isAbsent;
        return {
          ...s,
          isAbsent: nextAbsent,
          // If marking absent, clear numeric marks (do not convert to zero!)
          marksObtained: nextAbsent ? null : s.marksObtained,
        };
      })
    );
  };

  // Handle Remarks change
  const handleRemarksChange = (studentId: string, val: string) => {
    if (isReadOnly) return;
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, remarks: val } : s))
    );
  };

  // Helper: Mark all remaining missing students as absent
  const handleMarkRemainingAbsent = () => {
    if (isReadOnly) return;
    setStudents((prev) =>
      prev.map((s) => {
        if (s.marksObtained === null && !s.isAbsent) {
          return { ...s, isAbsent: true };
        }
        return s;
      })
    );
  };

  // Computed summary metrics
  const liveSummary = useMemo(() => {
    let entered = 0;
    let absent = 0;
    let passed = 0;
    let failed = 0;
    const maxMarks = schedule?.maxMarks || 100;
    const passingMarks = schedule?.passingMarks || 40;

    students.forEach((s) => {
      if (s.isAbsent) {
        absent++;
        entered++;
      } else if (s.marksObtained !== null && s.marksObtained !== undefined) {
        entered++;
        if (s.marksObtained >= passingMarks) {
          passed++;
        } else {
          failed++;
        }
      }
    });

    const total = students.length;
    const remaining = Math.max(0, total - entered);

    return { total, entered, remaining, absent, passed, failed, maxMarks, passingMarks };
  }, [students, schedule]);

  // Filtered students for display
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = s.studentName.toLowerCase().includes(q);
        const matchesId = s.admissionNumber.toLowerCase().includes(q);
        const matchesRoll = s.rollNumber && s.rollNumber.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesRoll) return false;
      }

      // Mode filter
      if (filterMode === 'MISSING') {
        return s.marksObtained === null && !s.isAbsent;
      }
      if (filterMode === 'ENTERED') {
        return s.marksObtained !== null && !s.isAbsent;
      }
      if (filterMode === 'ABSENT') {
        return s.isAbsent;
      }
      return true;
    });
  }, [students, searchQuery, filterMode]);

  // Validation: Check for invalid marks
  const validateEntries = (): string | null => {
    if (!schedule) return 'Schedule details not found.';
    for (const s of students) {
      if (!s.isAbsent && s.marksObtained !== null && s.marksObtained !== undefined) {
        if (s.marksObtained < 0 || s.marksObtained > schedule.maxMarks) {
          return `Marks for "${s.studentName}" must be between 0 and maximum marks (${schedule.maxMarks}).`;
        }
      }
    }
    return null;
  };

  // Save Draft Action
  const handleSaveDraft = async () => {
    if (!scheduleId || isReadOnly) return;
    const validationErr = validateEntries();
    if (validationErr) {
      showError(validationErr);
      return;
    }

    setSavingDraft(true);
    try {
      const payloadRecords: SaveStudentMarkInput[] = students.map((s) => ({
        studentId: s.studentId,
        marksObtained: s.isAbsent ? null : s.marksObtained,
        isAbsent: s.isAbsent,
        remarks: s.remarks,
      }));

      const res = await teacherApi.saveExamMarksDraft(scheduleId, { records: payloadRecords });
      if (res.success && res.data) {
        setSchedule(res.data.schedule);
        setIsReadOnly(res.data.isReadOnly);
        setStudents(res.data.students || []);
        showSuccess('Draft marks saved successfully. You can return to edit anytime.');
      }
    } catch (err: unknown) {
      console.error('Failed to save draft marks:', err);
      showError(
        getApiErrorMessage(err, 'Failed to save draft marks. Please check input and retry.')
      );
    } finally {
      setSavingDraft(false);
    }
  };

  // Submit Action: Validates all students complete, then triggers submit
  const handleOpenSubmitConfirm = () => {
    if (isReadOnly) return;
    const validationErr = validateEntries();
    if (validationErr) {
      showError(validationErr);
      return;
    }

    // Check if any student is missing marks
    if (liveSummary.remaining > 0) {
      showError(
        `Cannot submit: ${liveSummary.remaining} student${liveSummary.remaining === 1 ? '' : 's'
        } still missing marks. Please enter marks or mark as absent before submitting for review.`
      );
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!scheduleId || isReadOnly) return;
    setSubmitting(true);
    try {
      const payloadRecords: SaveStudentMarkInput[] = students.map((s) => ({
        studentId: s.studentId,
        marksObtained: s.isAbsent ? null : s.marksObtained,
        isAbsent: s.isAbsent,
        remarks: s.remarks,
      }));

      const res = await teacherApi.submitExamMarks(scheduleId, { records: payloadRecords });
      if (res.success && res.data) {
        setSchedule(res.data.schedule);
        setIsReadOnly(res.data.isReadOnly);
        setStudents(res.data.students || []);
        setShowConfirmModal(false);
        showSuccess(
          'Marks successfully submitted for Management review! The register is now locked in read-only mode.'
        );
      }
    } catch (err: unknown) {
      console.error('Failed to submit marks:', err);
      showError(
        getApiErrorMessage(
          err,
          'Failed to submit marks. Please ensure all student records are complete and retry.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'S';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <TeacherLayout>
      <div className="teacher-enter-marks-page" style={{ padding: '4px 0 32px' }}>
        {/* Toast Notifications */}
        {toastSuccess && (
          <div className="teacher-toast-success" role="status">
            <CheckCircle2 size={18} />
            <span>{toastSuccess}</span>
          </div>
        )}
        {toastError && (
          <div className="teacher-toast-error" role="alert">
            <AlertCircle size={18} />
            <span>{toastError}</span>
          </div>
        )}

        {/* 1. Top Navigation Bar */}
        <div className="teacher-marks-back-row">
          <Link
            to="/teacher/exams"
            className="teacher-back-link"
            id="back-to-exams-btn"
          >
            <ArrowLeft size={16} />
            <span>Back to My Exams</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="teacher-btn-refresh"
              onClick={fetchScheduleAndMarks}
              disabled={loading || savingDraft || submitting}
              title="Refresh marks roster"
            >
              <RotateCw size={14} className={loading ? 'teacher-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 2. Error Banner */}
        {error && (
          <div className="teacher-error-banner" role="alert" style={{ marginBottom: '20px' }}>
            <div className="teacher-error-content">
              <AlertCircle size={22} className="teacher-error-icon" />
              <div>
                <h3 className="teacher-error-title">Failed to Load Marks Roster</h3>
                <p className="teacher-error-desc">{error}</p>
              </div>
            </div>
            <button
              type="button"
              className="teacher-retry-btn"
              onClick={fetchScheduleAndMarks}
            >
              <RotateCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* 3. Read-Only Lockout Banner if Submitted */}
        {isReadOnly && (
          <div className="teacher-marks-readonly-banner" role="status">
            <div className="teacher-readonly-badge">
              <Lock size={16} />
              <span>Read-Only</span>
            </div>
            <div className="teacher-readonly-text">
              {schedule?.marksStatus === 'PUBLISHED' ? (
                <>
                  <strong>Official Results Published:</strong> Examination results for this subject have been published by Management. Marks and remarks are finalized and read-only.
                </>
              ) : (
                <>
                  <strong>Marks Submitted for Review:</strong> This evaluation register was submitted for
                  Management review
                  {schedule?.marksSubmittedByName ? ` by ${schedule.marksSubmittedByName}` : ''}
                  {schedule?.marksSubmittedAt ? ` on ${new Date(schedule.marksSubmittedAt).toLocaleDateString()}` : ''}.
                  Grades are currently locked in read-only mode pending Management review.
                </>
              )}
            </div>
          </div>
        )}

        {/* 3b. Returned for Correction Banner if Returned by Management */}
        {!isReadOnly && schedule?.marksStatus === 'RETURNED' && (
          <div className="teacher-marks-returned-banner" role="alert" style={{ marginBottom: '20px' }}>
            <div className="teacher-returned-badge">
              <AlertTriangle size={16} />
              <span>Action Required: Returned for Correction</span>
            </div>
            <div className="teacher-returned-text">
              <strong>Management Revision Note:</strong>{' '}
              {schedule.marksReturnReason || 'Management returned this evaluation for revision. Please review student marks and make necessary updates.'}
              {schedule.marksReturnedByName && ` (Returned by: ${schedule.marksReturnedByName})`}
              {schedule.marksReturnedAt &&
                ` on ${new Date(schedule.marksReturnedAt).toLocaleDateString()}`}.
              {' '}You can update individual marks below and click <strong>Resubmit Marks</strong> once revisions are complete.
            </div>
          </div>
        )}

        {/* 4. Exam Details Card (Read-Only) */}
        {schedule && (
          <div className="teacher-exam-details-card">
            <div className="teacher-details-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="teacher-exam-type-pill">
                    {EXAM_TYPE_LABELS[schedule.examType] || schedule.examType}
                  </span>
                  <span className="teacher-year-tag">{schedule.academicYear}</span>
                  <span
                    className={`teacher-marks-pill ${
                      schedule.marksStatus === 'PUBLISHED'
                        ? 'pill-published'
                        : isReadOnly
                        ? 'pill-submitted'
                        : schedule.marksStatus === 'RETURNED'
                        ? 'pill-returned'
                        : schedule.marksStatus === 'DRAFT'
                        ? 'pill-draft'
                        : 'pill-pending'
                    }`}
                  >
                    {TEACHER_MARKS_STATUS_LABELS[schedule.marksStatus] || schedule.marksStatus}
                  </span>
                </div>
                <h1 className="teacher-exam-details-title">{schedule.examName}</h1>
              </div>

              <div className="teacher-details-badge-group">
                <span className="teacher-subject-tag-big">
                  <Sparkles size={14} />
                  <span>{schedule.subject}</span>
                </span>
                <span className="teacher-class-tag-big">
                  {schedule.className} - Section {schedule.section}
                </span>
              </div>
            </div>

            <div className="teacher-details-meta-grid">
              <div className="teacher-meta-item">
                <span className="teacher-meta-label">Exam Date</span>
                <div className="teacher-meta-val">
                  <Calendar size={14} className="teacher-meta-icon" />
                  <span>{schedule.examDate}</span>
                </div>
              </div>

              <div className="teacher-meta-item">
                <span className="teacher-meta-label">Session Time</span>
                <div className="teacher-meta-val">
                  <Clock size={14} className="teacher-meta-icon" />
                  <span>{schedule.formattedTime}</span>
                </div>
              </div>

              <div className="teacher-meta-item">
                <span className="teacher-meta-label">Maximum Marks</span>
                <div className="teacher-meta-val">
                  <strong style={{ fontSize: '1.05rem', color: '#20354A' }}>
                    {schedule.maxMarks}
                  </strong>
                </div>
              </div>

              <div className="teacher-meta-item">
                <span className="teacher-meta-label">Passing Marks</span>
                <div className="teacher-meta-val">
                  <strong style={{ fontSize: '1.05rem', color: '#1E6B52' }}>
                    {schedule.passingMarks}
                  </strong>
                </div>
              </div>

              {schedule.roomNumber && (
                <div className="teacher-meta-item">
                  <span className="teacher-meta-label">Exam Room</span>
                  <div className="teacher-meta-val">
                    <span>{schedule.roomNumber}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. Live Summary Strip */}
        <div className="teacher-marks-summary-strip">
          <div className="teacher-strip-stat">
            <span className="teacher-strip-label">Official Roster</span>
            <div className="teacher-strip-val">
              <Users size={16} />
              <span>{liveSummary.total} Students</span>
            </div>
          </div>

          <div className="teacher-strip-stat">
            <span className="teacher-strip-label">Evaluated / Entered</span>
            <div className="teacher-strip-val" style={{ color: '#15803D' }}>
              <UserCheck size={16} />
              <span>{liveSummary.entered} of {liveSummary.total}</span>
            </div>
          </div>

          <div className="teacher-strip-stat">
            <span className="teacher-strip-label">Missing Marks</span>
            <div
              className="teacher-strip-val"
              style={{ color: liveSummary.remaining > 0 ? '#C05621' : '#15803D' }}
            >
              {liveSummary.remaining > 0 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              <span>
                {liveSummary.remaining === 0 ? 'All Complete' : `${liveSummary.remaining} Remaining`}
              </span>
            </div>
          </div>

          <div className="teacher-strip-stat">
            <span className="teacher-strip-label">Passing / Failing / Absent</span>
            <div className="teacher-strip-val" style={{ fontSize: '0.86rem' }}>
              <span style={{ color: '#15803D', fontWeight: 700 }}>{liveSummary.passed} Pass</span>
              <span style={{ color: '#707781' }}>·</span>
              <span style={{ color: '#B91C1C', fontWeight: 700 }}>{liveSummary.failed} Fail</span>
              <span style={{ color: '#707781' }}>·</span>
              <span style={{ color: '#C05621', fontWeight: 700 }}>{liveSummary.absent} Absent</span>
            </div>
          </div>
        </div>

        {/* 6. Quick Action Toolbar & Search */}
        <div className="teacher-marks-action-toolbar">
          {/* Search Box */}
          <div className="teacher-marks-search-box">
            <Search size={15} className="teacher-search-box-icon" />
            <input
              type="text"
              placeholder="Search student by name, roll, or admission ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="teacher-search-box-input"
              id="student-marks-search"
            />
            {searchQuery && (
              <button
                type="button"
                className="teacher-search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
                aria-label="Clear student search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="teacher-marks-filter-pills">
            <button
              type="button"
              className={`teacher-pill-filter ${filterMode === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterMode('ALL')}
            >
              All ({students.length})
            </button>
            <button
              type="button"
              className={`teacher-pill-filter ${filterMode === 'MISSING' ? 'active' : ''}`}
              onClick={() => setFilterMode('MISSING')}
            >
              Missing ({liveSummary.remaining})
            </button>
            <button
              type="button"
              className={`teacher-pill-filter ${filterMode === 'ENTERED' ? 'active' : ''}`}
              onClick={() => setFilterMode('ENTERED')}
            >
              Entered ({liveSummary.entered - liveSummary.absent})
            </button>
            <button
              type="button"
              className={`teacher-pill-filter ${filterMode === 'ABSENT' ? 'active' : ''}`}
              onClick={() => setFilterMode('ABSENT')}
            >
              Absent ({liveSummary.absent})
            </button>
          </div>

          {/* Submission and Action Buttons */}
          <div className="teacher-marks-buttons-group">
            {!isReadOnly && liveSummary.remaining > 0 && (
              <button
                type="button"
                className="teacher-btn-secondary"
                onClick={handleMarkRemainingAbsent}
                title="Mark all remaining unentered students as Absent"
                id="mark-remaining-absent-btn"
              >
                <UserX size={14} />
                <span>Mark Remaining Absent</span>
              </button>
            )}

            {!isReadOnly && (
              <>
                <button
                  type="button"
                  className="teacher-btn-save-draft"
                  onClick={handleSaveDraft}
                  disabled={savingDraft || submitting}
                  id="save-marks-draft-btn"
                  title={
                    schedule?.marksStatus === 'DRAFT' || schedule?.marksStatus === 'RETURNED'
                      ? 'Update previously saved draft marks'
                      : 'Save current marks as draft without submitting'
                  }
                >
                  <Save size={15} />
                  <span>
                    {savingDraft
                      ? 'Saving Draft...'
                      : schedule?.marksStatus === 'DRAFT' || schedule?.marksStatus === 'RETURNED'
                      ? 'Update Marks'
                      : 'Save Draft'}
                  </span>
                </button>

                <button
                  type="button"
                  className="teacher-btn-submit-review"
                  onClick={handleOpenSubmitConfirm}
                  disabled={savingDraft || submitting || liveSummary.remaining > 0}
                  id="submit-marks-review-btn"
                  title={
                    liveSummary.remaining > 0
                      ? 'Complete all marks before submitting for review'
                      : 'Submit marks for official Management review'
                  }
                >
                  <Send size={15} />
                  <span>
                    {submitting
                      ? 'Submitting...'
                      : schedule?.marksStatus === 'RETURNED'
                      ? 'Resubmit Marks'
                      : 'Submit for Review'}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 7. Student Roster Table */}
        <div className="teacher-table-card">
          <div className="teacher-table-responsive">
            <table className="teacher-marks-entry-table">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>Roll #</th>
                  <th>Official Student Name</th>
                  <th>Admission ID</th>
                  <th style={{ width: '180px' }}>Marks Obtained</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Attendance</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Result Status</th>
                  <th>Teacher Remark (Optional)</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#707781' }}>
                      <RotateCw size={24} className="teacher-spin" style={{ margin: '0 auto 8px' }} />
                      <div>Loading official classroom roster...</div>
                    </td>
                  </tr>
                )}

                {!loading && filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px 24px', textAlign: 'center', color: '#707781' }}>
                      <Users size={28} style={{ margin: '0 auto 8px', color: '#8A94A0' }} />
                      <div style={{ fontWeight: 600, color: '#27313A', marginBottom: '4px' }}>
                        No Students Found Matching Filter
                      </div>
                      <div style={{ fontSize: '0.85rem' }}>
                        Try clearing your search query or switching filter tabs.
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredStudents.map((student, idx) => {
                    const maxMarks = schedule?.maxMarks || 100;
                    const passingMarks = schedule?.passingMarks || 40;
                    const hasMarks = student.marksObtained !== null && student.marksObtained !== undefined;
                    const isPassed = hasMarks && student.marksObtained! >= passingMarks;
                    const isFailed = hasMarks && student.marksObtained! < passingMarks;
                    const isMissing = !hasMarks && !student.isAbsent;
                    const isExceeding = hasMarks && student.marksObtained! > maxMarks;
                    const isNegative = hasMarks && student.marksObtained! < 0;
                    const hasError = isExceeding || isNegative;

                    return (
                      <tr
                        key={student.studentId}
                        className={`teacher-marks-row ${student.isAbsent
                          ? 'row-absent'
                          : isMissing
                            ? 'row-missing'
                            : 'row-complete'
                          }`}
                      >
                        {/* Roll Number */}
                        <td>
                          <span className="teacher-student-roll-pill">
                            {student.rollNumber || String(idx + 1).padStart(2, '0')}
                          </span>
                        </td>

                        {/* Student Name & Avatar */}
                        <td>
                          <div className="teacher-student-name-cell">
                            <div className="teacher-student-avatar">
                              {getInitials(student.studentName)}
                            </div>
                            <span className="teacher-student-name-text">
                              {student.studentName}
                            </span>
                          </div>
                        </td>

                        {/* Admission ID */}
                        <td>
                          <span className="teacher-student-id-badge">
                            {student.admissionNumber}
                          </span>
                        </td>

                        {/* Marks Input */}
                        <td>
                          <div className="teacher-marks-input-wrapper">
                            {student.isAbsent ? (
                              <div className="teacher-marks-absent-placeholder">
                                Absent
                              </div>
                            ) : (
                              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                  type="number"
                                  min={0}
                                  max={maxMarks}
                                  step="any"
                                  className={`teacher-marks-number-input ${hasError ? 'input-error' : ''
                                    }`}
                                  placeholder="0.0"
                                  value={
                                    student.marksObtained !== null && student.marksObtained !== undefined
                                      ? student.marksObtained
                                      : ''
                                  }
                                  onChange={(e) => handleMarkChange(student.studentId, e.target.value)}
                                  disabled={isReadOnly || student.isAbsent}
                                  id={`marks-input-${student.studentId}`}
                                />
                                <span className="teacher-marks-max-affix">/ {maxMarks}</span>
                              </div>
                            )}

                            {hasError && (
                              <span className="teacher-inline-error">
                                {isExceeding
                                  ? `Max is ${maxMarks}`
                                  : 'Cannot be negative'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Absent Toggle Button */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className={`teacher-absent-toggle-btn ${student.isAbsent ? 'active-absent' : ''
                              }`}
                            onClick={() => handleAbsentToggle(student.studentId)}
                            disabled={isReadOnly}
                            title={
                              student.isAbsent
                                ? 'Mark as Present'
                                : 'Mark student as Absent'
                            }
                            id={`absent-toggle-${student.studentId}`}
                          >
                            <UserX size={13} />
                            <span>{student.isAbsent ? 'Absent' : 'Present'}</span>
                          </button>
                        </td>

                        {/* Result Status Indicator */}
                        <td style={{ textAlign: 'center' }}>
                          {student.isAbsent ? (
                            <span className="teacher-result-pill pill-absent">
                              Absent
                            </span>
                          ) : isMissing ? (
                            <span className="teacher-result-pill pill-missing">
                              Missing
                            </span>
                          ) : isPassed ? (
                            <span className="teacher-result-pill pill-pass">
                              Pass ({student.marksObtained})
                            </span>
                          ) : isFailed ? (
                            <span className="teacher-result-pill pill-fail">
                              Fail ({student.marksObtained})
                            </span>
                          ) : (
                            <span className="teacher-result-pill pill-entered">
                              Entered
                            </span>
                          )}
                        </td>

                        {/* Remarks Field */}
                        <td>
                          <input
                            type="text"
                            maxLength={250}
                            placeholder={
                              student.isAbsent
                                ? 'Reason for absence...'
                                : 'Optional teacher feedback...'
                            }
                            className="teacher-remarks-input-field"
                            value={student.remarks || ''}
                            onChange={(e) => handleRemarksChange(student.studentId, e.target.value)}
                            disabled={isReadOnly}
                            id={`remarks-input-${student.studentId}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 8. Confirmation Modal Before Submit */}
        {showConfirmModal && (
          <div className="teacher-modal-backdrop" role="dialog" aria-modal="true">
            <div className="teacher-confirm-modal">
              <div className="teacher-confirm-modal-header">
                <div className="teacher-confirm-icon-wrap">
                  <Send size={22} />
                </div>
                <div>
                  <h3 className="teacher-confirm-title">Submit Marks for Review</h3>
                  <p className="teacher-confirm-subtitle">
                    {schedule?.examName} · {schedule?.className} Section {schedule?.section} ({schedule?.subject})
                  </p>
                </div>
              </div>

              <div className="teacher-confirm-modal-body">
                <p>
                  You are about to submit the completed evaluation register to School Management for official review.
                </p>

                <div className="teacher-confirm-breakdown">
                  <div className="teacher-breakdown-row">
                    <span>Total Students Evaluated:</span>
                    <strong>{liveSummary.total}</strong>
                  </div>
                  <div className="teacher-breakdown-row">
                    <span>Passing Students:</span>
                    <strong style={{ color: '#15803D' }}>{liveSummary.passed}</strong>
                  </div>
                  <div className="teacher-breakdown-row">
                    <span>Failing Students:</span>
                    <strong style={{ color: '#B91C1C' }}>{liveSummary.failed}</strong>
                  </div>
                  <div className="teacher-breakdown-row">
                    <span>Absent Students:</span>
                    <strong style={{ color: '#C05621' }}>{liveSummary.absent}</strong>
                  </div>
                </div>

                <div className="teacher-confirm-warning-note">
                  <AlertCircle size={17} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Important:</strong> Once submitted, marks become strictly <strong>read-only</strong>. You will not be able to edit marks unless Management returns the evaluation for revision.
                  </div>
                </div>
              </div>

              <div className="teacher-confirm-modal-footer">
                <button
                  type="button"
                  className="teacher-btn-secondary"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="teacher-btn-submit-review"
                  onClick={handleConfirmSubmit}
                  disabled={submitting}
                  id="confirm-submit-marks-btn"
                >
                  <CheckCircle2 size={15} />
                  <span>{submitting ? 'Submitting to Management...' : 'Confirm & Submit for Review'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};
