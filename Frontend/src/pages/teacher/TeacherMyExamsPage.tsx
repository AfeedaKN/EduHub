import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Calendar,
  Clock,
  Search,
  RotateCw,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Layers,
  FileCheck2,
  FileClock,
  CalendarDays,
  X,
  Eye,
  CheckCircle2,
  Pencil,
} from 'lucide-react';
import { TeacherLayout } from '../../components/teacher/TeacherLayout';
import { teacherApi } from '../../api/teacherApi';
import { getApiErrorMessage } from '../../api/axiosClient';
import {
  TeacherExamScheduleItem,
  TeacherExamSummary,
  TeacherMarksStatus,
  ExamType,
  EXAM_TYPE_LABELS,
} from '../../types/exam.types';
import { TeacherClassItem } from '../../types/teacher.types';

const ACADEMIC_YEAR_OPTIONS = ['2026-2027', '2027-2028', '2025-2026'];

const EXAM_TYPE_OPTIONS: { value: ExamType; label: string }[] = [
  { value: 'UNIT_TEST', label: 'Unit Test' },
  { value: 'FIRST_TERM', label: 'First Term' },
  { value: 'MID_TERM', label: 'Mid-Term' },
  { value: 'SECOND_TERM', label: 'Second Term' },
  { value: 'ANNUAL_EXAM', label: 'Annual Exam' },
  { value: 'OTHER', label: 'Other' },
];

export const TeacherMyExamsPage: React.FC = () => {
  const navigate = useNavigate();

  // Core Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<TeacherExamScheduleItem[]>([]);
  const [summary, setSummary] = useState<TeacherExamSummary>({
    assignedExams: 0,
    upcomingExams: 0,
    marksPending: 0,
    submittedForReview: 0,
  });
  const [assignedClasses, setAssignedClasses] = useState<TeacherClassItem[]>([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Load teacher assigned classes for dropdown filter
  const fetchAssignedClasses = async () => {
    try {
      const res = await teacherApi.getMyClasses();
      if (res.success && res.data) {
        setAssignedClasses(res.data);
      }
    } catch (err) {
      console.error('Failed to load teacher classes:', err);
    }
  };

  const fetchExamsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await teacherApi.getTeacherExams({
        academicYear: selectedYear === 'ALL' ? undefined : selectedYear,
        examType: selectedType === 'ALL' ? undefined : selectedType,
        className: selectedClass === 'ALL' ? undefined : selectedClass,
        section: selectedSection === 'ALL' ? undefined : selectedSection,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        search: searchTerm.trim() ? searchTerm.trim() : undefined,
      });

      if (res.success && res.data) {
        setSchedules(res.data.schedules || []);
        setSummary(
          res.data.summary || {
            assignedExams: 0,
            upcomingExams: 0,
            marksPending: 0,
            submittedForReview: 0,
          }
        );
      }
    } catch (err: unknown) {
      console.error('Failed to fetch teacher exams:', err);
      setError(
        getApiErrorMessage(
          err,
          'Failed to load your assigned examinations. Please check your network and try again.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedClasses();
  }, []);

  useEffect(() => {
    fetchExamsData();
  }, [selectedYear, selectedType, selectedClass, selectedSection, selectedStatus, searchTerm]);

  // Derived available sections for the selected class
  const availableSections = useMemo(() => {
    if (selectedClass === 'ALL') {
      const secSet = new Set<string>();
      assignedClasses.forEach((c) => secSet.add(c.section));
      return Array.from(secSet).sort();
    }
    const secSet = new Set<string>();
    assignedClasses
      .filter((c) => c.className.toLowerCase() === selectedClass.toLowerCase())
      .forEach((c) => secSet.add(c.section));
    return Array.from(secSet).sort();
  }, [assignedClasses, selectedClass]);

  const uniqueClassNames = useMemo(() => {
    const classSet = new Set<string>();
    assignedClasses.forEach((c) => classSet.add(c.className));
    return Array.from(classSet).sort();
  }, [assignedClasses]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedYear('ALL');
    setSelectedType('ALL');
    setSelectedClass('ALL');
    setSelectedSection('ALL');
    setSelectedStatus('ALL');
  };

  // Helper for status badge style
  const getStatusBadge = (status: TeacherMarksStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="teacher-marks-pill pill-submitted" title="Submitted for Management review">
            <CheckCircle2 size={13} />
            <span>Submitted for Review</span>
          </span>
        );
      case 'DRAFT':
        return (
          <span className="teacher-marks-pill pill-draft" title="Draft saved - ready to continue entry">
            <FileClock size={13} />
            <span>Draft Saved</span>
          </span>
        );
      case 'RETURNED':
        return (
          <span className="teacher-marks-pill pill-returned" title="Management returned marks for correction">
            <AlertCircle size={13} />
            <span>Returned for Correction</span>
          </span>
        );
      case 'PUBLISHED':
        return (
          <span className="teacher-marks-pill pill-published" title="Official results published">
            <FileCheck2 size={13} />
            <span>Published</span>
          </span>
        );
      default:
        return (
          <span className="teacher-marks-pill pill-pending" title="Marks entry pending">
            <Clock size={13} />
            <span>Marks Pending</span>
          </span>
        );
    }
  };

  // Helper for exam type badge
  const getExamTypePill = (type: ExamType) => {
    return (
      <span className="teacher-exam-type-pill">
        {EXAM_TYPE_LABELS[type] || type}
      </span>
    );
  };

  return (
    <TeacherLayout>
      <div className="teacher-my-exams-container" style={{ padding: '4px 0 32px' }}>
        {/* 1. Header Section */}
        <section className="teacher-welcome-section" style={{ marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#647F99',
                  backgroundColor: '#EEF3F8',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                Academics &amp; Assessments
              </span>
            </div>
            <h1 className="teacher-welcome-heading" style={{ margin: '0 0 6px' }}>
              My Exams
            </h1>
            <p className="teacher-welcome-subtitle" style={{ margin: 0 }}>
              <span>
                Official institutional examinations, subject scheduling, and marks entry for your assigned classrooms
              </span>
            </p>
          </div>

          <div className="teacher-welcome-actions">
            <button
              type="button"
              className="teacher-btn-refresh"
              onClick={fetchExamsData}
              disabled={loading}
              title="Refresh examinations data"
              id="teacher-refresh-exams-btn"
            >
              <RotateCw size={14} className={loading ? 'teacher-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </section>

        {/* 2. Key Metrics Row */}
        <div
          className="teacher-summary-cards-row"
          style={{ marginBottom: '24px' }}
          aria-label="Teacher Exams Summary Metrics"
        >
          {/* Metric 1: Assigned Exams */}
          <div className="teacher-summary-card">
            <div className="teacher-card-top-row">
              <span className="teacher-card-label">Assigned Exams</span>
              <div className="teacher-card-icon-wrap">
                <Layers size={17} />
              </div>
            </div>
            <div className="teacher-card-value-row">
              <div className="teacher-card-value">{summary.assignedExams}</div>
              <span className="teacher-card-indicator">Active</span>
            </div>
            <div className="teacher-card-subtext">Examinations on your teaching roster</div>
          </div>

          {/* Metric 2: Upcoming Exams */}
          <div className="teacher-summary-card">
            <div className="teacher-card-top-row">
              <span className="teacher-card-label">Upcoming Exams</span>
              <div className="teacher-card-icon-wrap icon-blue">
                <CalendarDays size={17} />
              </div>
            </div>
            <div className="teacher-card-value-row">
              <div className="teacher-card-value">{summary.upcomingExams}</div>
              <span className="teacher-card-indicator indicator-sage">Scheduled</span>
            </div>
            <div className="teacher-card-subtext">Subject tests scheduled on or after today</div>
          </div>

          {/* Metric 3: Marks Entry Pending */}
          <div className="teacher-summary-card">
            <div className="teacher-card-top-row">
              <span className="teacher-card-label">Marks Entry Pending</span>
              <div className="teacher-card-icon-wrap icon-coral">
                <Clock size={17} />
              </div>
            </div>
            <div className="teacher-card-value-row">
              <div className="teacher-card-value" style={{ color: '#C05621' }}>
                {summary.marksPending}
              </div>
              <span
                className="teacher-card-indicator"
                style={{ backgroundColor: '#FEEBC8', color: '#7B341E' }}
              >
                Action Required
              </span>
            </div>
            <div className="teacher-card-subtext">Scheduled subjects awaiting completion</div>
          </div>

          {/* Metric 4: Submitted for Review */}
          <div className="teacher-summary-card">
            <div className="teacher-card-top-row">
              <span className="teacher-card-label">Submitted for Review</span>
              <div className="teacher-card-icon-wrap icon-sage">
                <FileCheck2 size={17} />
              </div>
            </div>
            <div className="teacher-card-value-row">
              <div className="teacher-card-value" style={{ color: '#15803D' }}>
                {summary.submittedForReview}
              </div>
              <span className="teacher-card-indicator indicator-sage">Submitted</span>
            </div>
            <div className="teacher-card-subtext">Sent to Management for result approval</div>
          </div>
        </div>

        {/* 3. Search and Multi-Filter Bar */}
        <div className="teacher-exams-filter-bar">
          <div className="teacher-exams-filter-top">
            {/* Search Input */}
            <div className="teacher-search-box-wrap">
              <Search size={15} className="teacher-search-box-icon" />
              <input
                type="text"
                placeholder="Search by exam name, subject, or class..."
                className="teacher-search-box-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                id="teacher-exam-search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="teacher-search-clear-btn"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                  aria-label="Clear search query"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Academic Year Filter */}
            <div className="teacher-filter-item">
              <label className="teacher-filter-label">Academic Year</label>
              <select
                className="teacher-filter-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                id="filter-academic-year"
              >
                <option value="ALL">All Academic Years</option>
                {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Exam Type Filter */}
            <div className="teacher-filter-item">
              <label className="teacher-filter-label">Exam Type</label>
              <select
                className="teacher-filter-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                id="filter-exam-type"
              >
                <option value="ALL">All Exam Types</option>
                {EXAM_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="teacher-exams-filter-bottom">
            {/* Class Filter */}
            <div className="teacher-filter-item">
              <label className="teacher-filter-label">Class</label>
              <select
                className="teacher-filter-select"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSection('ALL');
                }}
                id="filter-class"
              >
                <option value="ALL">All Assigned Classes</option>
                {uniqueClassNames.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Filter */}
            <div className="teacher-filter-item">
              <label className="teacher-filter-label">Section</label>
              <select
                className="teacher-filter-select"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                id="filter-section"
              >
                <option value="ALL">All Sections</option>
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
            </div>

            {/* Marks Status Filter */}
            <div className="teacher-filter-item">
              <label className="teacher-filter-label">Marks Status</label>
              <select
                className="teacher-filter-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                id="filter-status"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Marks Entry Pending</option>
                <option value="DRAFT">Draft Saved</option>
                <option value="RETURNED">Returned for Correction</option>
                <option value="SUBMITTED">Submitted for Review</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>

            {(searchTerm ||
              selectedYear !== 'ALL' ||
              selectedType !== 'ALL' ||
              selectedClass !== 'ALL' ||
              selectedSection !== 'ALL' ||
              selectedStatus !== 'ALL') && (
                <button
                  type="button"
                  className="teacher-reset-filters-btn"
                  onClick={handleResetFilters}
                  title="Reset all search filters"
                >
                  <X size={13} />
                  <span>Reset Filters</span>
                </button>
              )}
          </div>
        </div>

        {/* 4. Loading Skeleton */}
        {loading && (
          <div className="teacher-table-card">
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: '64px',
                      backgroundColor: '#F5F5F0',
                      borderRadius: '8px',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. Error State */}
        {!loading && error && (
          <div className="teacher-error-banner" role="alert">
            <div className="teacher-error-content">
              <AlertCircle size={22} className="teacher-error-icon" />
              <div>
                <h3 className="teacher-error-title">Failed to Load Assigned Examinations</h3>
                <p className="teacher-error-desc">{error}</p>
              </div>
            </div>
            <button
              type="button"
              className="teacher-retry-btn"
              onClick={fetchExamsData}
            >
              <RotateCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* 6. Empty State: No Exams Allocated */}
        {!loading && !error && schedules.length === 0 && !searchTerm && selectedYear === 'ALL' && selectedType === 'ALL' && selectedClass === 'ALL' && selectedStatus === 'ALL' && (
          <div className="teacher-empty-state-box">
            <div className="teacher-empty-icon-wrap">
              <Award size={32} />
            </div>
            <h3 className="teacher-empty-title">No Examinations Assigned Yet</h3>
            <p className="teacher-empty-desc">
              School Management has not scheduled any examinations for your assigned classes or subjects yet. Once exam schedules are published by administration, they will appear here automatically.
            </p>
          </div>
        )}

        {/* 7. No Results State: Filters yielded 0 */}
        {!loading && !error && schedules.length === 0 && (searchTerm || selectedYear !== 'ALL' || selectedType !== 'ALL' || selectedClass !== 'ALL' || selectedSection !== 'ALL' || selectedStatus !== 'ALL') && (
          <div className="teacher-empty-state-box">
            <div className="teacher-empty-icon-wrap">
              <Search size={32} />
            </div>
            <h3 className="teacher-empty-title">No Matching Exam Schedules</h3>
            <p className="teacher-empty-desc">
              No examination schedules match your active filter criteria. Try adjusting your search term or clearing filters to view all assigned examinations.
            </p>
            <button
              type="button"
              className="teacher-retry-btn"
              onClick={handleResetFilters}
            >
              <span>Clear Filters</span>
            </button>
          </div>
        )}

        {/* 8. Table & Card Layout */}
        {!loading && !error && schedules.length > 0 && (
          <div className="teacher-table-card">
            <div className="teacher-table-header-wrap">
              <div>
                <h2 className="teacher-table-title">Scheduled Subject Examinations</h2>
                <p className="teacher-table-subtitle">
                  Authorized subjects requiring student marks evaluation and management submission
                </p>
              </div>
              <div className="teacher-table-counter">
                Showing <strong>{schedules.length}</strong> scheduled {schedules.length === 1 ? 'subject' : 'subjects'}
              </div>
            </div>

            <div className="teacher-table-responsive">
              <table className="teacher-exams-table">
                <thead>
                  <tr>
                    <th>Examination &amp; Type</th>
                    <th>Academic Year</th>
                    <th>Assigned Class &amp; Subject</th>
                    <th>Schedule Date &amp; Time</th>
                    <th>Max / Pass Marks</th>
                    <th style={{ textAlign: 'center' }}>Marks Entry Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((sch) => {
                    const rawStatus = (sch.marksStatus || '').toString().trim().toUpperCase();
                    const isSubmitted = rawStatus === 'SUBMITTED';
                    const isPublished = rawStatus === 'PUBLISHED';
                    const isDraft =
                      rawStatus === 'DRAFT' ||
                      rawStatus === 'RETURNED' ||
                      (sch.enteredMarksCount > 0 && !isSubmitted && !isPublished);

                    return (
                      <tr key={sch.id} className="teacher-exam-row">
                        {/* Exam Name & Type */}
                        <td>
                          <div className="teacher-exam-name-cell">
                            <span className="teacher-exam-name-text">{sch.examName}</span>
                            <div className="teacher-exam-badge-row">
                              {getExamTypePill(sch.examType)}
                              <span className="teacher-exam-window-tag">
                                Window: {sch.examStartDate} to {sch.examEndDate}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Academic Year */}
                        <td>
                          <span className="teacher-year-tag">{sch.academicYear}</span>
                        </td>

                        {/* Class, Section, and Subject */}
                        <td>
                          <div className="teacher-class-subject-cell">
                            <div className="teacher-class-pill-row">
                              <span className="teacher-class-name">{sch.className}</span>
                              <span className="teacher-section-badge">Section {sch.section}</span>
                            </div>
                            <span className="teacher-subject-name">
                              <Sparkles size={12} className="teacher-sparkle-icon" />
                              <span>{sch.subject}</span>
                            </span>
                          </div>
                        </td>

                        {/* Schedule Date & Session Time */}
                        <td>
                          <div className="teacher-datetime-cell">
                            <div className="teacher-date-row">
                              <Calendar size={13} />
                              <span>{sch.examDate}</span>
                            </div>
                            <div className="teacher-time-row">
                              <Clock size={13} />
                              <span>{sch.formattedTime}</span>
                            </div>
                            {sch.roomNumber && (
                              <span className="teacher-room-tag">Room {sch.roomNumber}</span>
                            )}
                          </div>
                        </td>

                        {/* Max Marks & Passing Marks */}
                        <td>
                          <div className="teacher-marks-cell">
                            <div className="teacher-max-marks">
                              Max: <strong>{sch.maxMarks}</strong>
                            </div>
                            <div className="teacher-pass-marks">
                              Pass: <strong>{sch.passingMarks}</strong>
                            </div>
                          </div>
                        </td>

                        {/* Marks Status Pill */}
                        <td style={{ textAlign: 'center' }}>
                          <div className="teacher-status-cell">
                            {getStatusBadge(sch.marksStatus)}
                            {sch.totalStudents > 0 && (
                              <span className="teacher-completion-ratio">
                                {sch.enteredMarksCount} of {sch.totalStudents} students evaluated
                              </span>
                            )}
                            {isSubmitted && sch.marksSubmittedByName && (
                              <span className="teacher-submitted-by-tag">
                                Submitted by {sch.marksSubmittedByName}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action: Enter / Update / View Marks */}
                        <td style={{ textAlign: 'right' }}>
                          {isDraft ? (
                            <button
                              type="button"
                              className="teacher-action-marks-btn btn-update"
                              onClick={() => navigate(`/teacher/exams/${sch.id}/marks`)}
                              id={`update-marks-btn-${sch.id}`}
                              title={
                                rawStatus === 'RETURNED'
                                  ? 'Update returned marks for revision'
                                  : 'Update previously saved draft marks'
                              }
                              aria-label={`Update marks for ${sch.examName} ${sch.subject}`}
                            >
                              <Pencil size={14} />
                              <span>Update Marks</span>
                              <ArrowRight size={13} />
                            </button>
                          ) : isSubmitted ? (
                            <button
                              type="button"
                              className="teacher-action-marks-btn btn-view"
                              onClick={() => navigate(`/teacher/exams/${sch.id}/marks`)}
                              id={`view-marks-btn-${sch.id}`}
                              title="View submitted marks evaluation (Read-Only)"
                              aria-label={`View submitted marks for ${sch.examName} ${sch.subject}`}
                            >
                              <Eye size={14} />
                              <span>View Marks</span>
                              <ArrowRight size={13} />
                            </button>
                          ) : isPublished ? (
                            <button
                              type="button"
                              className="teacher-action-marks-btn btn-view"
                              onClick={() => navigate(`/teacher/exams/${sch.id}/marks`)}
                              id={`view-results-btn-${sch.id}`}
                              title="View official published results (Read-Only)"
                              aria-label={`View published results for ${sch.examName} ${sch.subject}`}
                            >
                              <FileCheck2 size={14} />
                              <span>View Results</span>
                              <ArrowRight size={13} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="teacher-action-marks-btn btn-enter"
                              onClick={() => navigate(`/teacher/exams/${sch.id}/marks`)}
                              id={`enter-marks-btn-${sch.id}`}
                              title="Enter marks for this examination schedule"
                              aria-label={`Enter marks for ${sch.examName} ${sch.subject}`}
                            >
                              <Award size={14} />
                              <span>Enter Marks</span>
                              <ArrowRight size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};
