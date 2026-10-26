import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Percent,
  ShieldCheck,
  Printer,
  FileText,
  X,
  Search,
  BookOpen,
} from 'lucide-react';
import { ParentLayout } from '../../components/parent/ParentLayout';
import { parentApi } from '../../api/parentApi';
import { getApiErrorMessage } from '../../api/axiosClient';
import {
  ChildProfile,
  ParentExamCard,
  ParentExamResultsResponse,
} from '../../types/parent.types';
import './ParentExams.css';

export const ParentExamsPage: React.FC = () => {
  // Primary States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2026-2027');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [examCards, setExamCards] = useState<ParentExamCard[]>([]);
  const [summary, setSummary] = useState<{
    totalExams: number;
    totalSubjectsPassed: number;
    totalSubjectsFailed: number;
    overallAveragePercentage: number;
  }>({
    totalExams: 0,
    totalSubjectsPassed: 0,
    totalSubjectsFailed: 0,
    overallAveragePercentage: 0,
  });

  // Report Card Modal State
  const [reportCardExam, setReportCardExam] = useState<ParentExamCard | null>(null);

  // Helper for initials
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Helper to determine currently active child object
  const currentChild = useMemo(() => {
    return children.find((c) => c.id === selectedChildId) || children[0] || null;
  }, [children, selectedChildId]);

  // Fetch Published Exam Results
  const fetchExamResults = useCallback(
    async (childId?: string, academicYear?: string, search?: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await parentApi.getExamResults({
          studentId: childId && childId !== 'ALL' ? childId : undefined,
          academicYear: academicYear && academicYear !== 'ALL' ? academicYear : undefined,
          search: search && search.trim() ? search.trim() : undefined,
        });

        if (res.success && res.data) {
          const data: ParentExamResultsResponse = res.data;
          setChildren(data.children || []);
          if (data.selectedChild) {
            setSelectedChildId(data.selectedChild.id);
          } else if (data.children && data.children.length > 0 && !childId) {
            setSelectedChildId(data.children[0].id);
          }
          setExamCards(data.exams || []);
          setSummary(data.summary);
        }
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, 'Failed to fetch examination results.'));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchExamResults(selectedChildId, selectedAcademicYear, searchTerm);
  }, [fetchExamResults, selectedChildId, selectedAcademicYear, searchTerm]);

  // Helper for grade pill styling
  const renderGradeBadge = (grade: string) => {
    let gradeClass = 'grade-b';
    if (grade.startsWith('A')) {
      gradeClass = 'grade-a';
    } else if (grade.startsWith('C') || grade.startsWith('D')) {
      gradeClass = 'grade-c';
    } else if (grade === 'F' || grade === 'AB') {
      gradeClass = 'grade-fail';
    }

    return <span className={`parent-grade-pill ${gradeClass}`}>Grade {grade}</span>;
  };

  // Print Report Card Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <ParentLayout pageTitle="Examinations & Results">
      <div className="parent-exams-container">
        {/* Page Header */}
        <div className="parent-exams-header">
          <div className="parent-exams-title-group">
            <h1>Examinations & Results</h1>
            <p className="parent-exams-subtitle">
              Review officially verified and published examination marks, subject evaluations, and academic report cards for your enrolled children.
            </p>
          </div>

          {/* Filters: Academic Year, Search, Refresh */}
          <div className="parent-exams-filter-bar">
            {/* Search Box */}
            <div className="parent-search-wrap">
              <Search size={15} className="parent-search-icon" />
              <input
                type="text"
                className="parent-search-input"
                placeholder="Search exam or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Academic Year Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--parent-text-muted, #707781)', textTransform: 'uppercase' }}>
                Year:
              </label>
              <select
                className="parent-filter-select"
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
              >
                <option value="ALL">All Academic Years</option>
                <option value="2026-2027">2026-2027</option>
                <option value="2027-2028">2027-2028</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>

            {/* Refresh Action */}
            <button
              type="button"
              className="parent-btn-refresh"
              onClick={() => fetchExamResults(selectedChildId, selectedAcademicYear, searchTerm)}
              title="Refresh examination records"
            >
              <RotateCw size={14} className={loading ? 'admin-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Children Selector Tabs (if multiple enrolled children) */}
        {!loading && children.length > 1 && (
          <div className="parent-children-tabs" aria-label="Select Child">
            {children.map((child) => (
              <button
                key={child.id}
                type="button"
                className={`parent-child-tab-btn ${selectedChildId === child.id ? 'active' : ''}`}
                onClick={() => setSelectedChildId(child.id)}
              >
                <div className="parent-child-tab-avatar">{getInitials(child.fullName)}</div>
                <div>
                  <div className="parent-child-tab-name">{child.fullName}</div>
                  <div className="parent-child-tab-meta">
                    {child.grade} - Section {child.section} ({child.studentId})
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Single Child Info Badge (if 1 child) */}
        {!loading && children.length === 1 && currentChild && (
          <div className="parent-single-child-badge">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: 'var(--parent-sage-light, #F0F4EF)',
                  color: 'var(--parent-primary, #20354A)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--parent-sage-border, #D5DFD3)',
                }}
              >
                {getInitials(currentChild.fullName)}
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--parent-primary, #20354A)' }}>
                  {currentChild.fullName}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--parent-text-muted, #707781)' }}>
                  Class: <strong>{currentChild.grade}</strong> • Section: <strong>{currentChild.section}</strong> • Admission ID: <strong>{currentChild.studentId}</strong>
                  {currentChild.rollNumber && <> • Roll No: <strong>{currentChild.rollNumber}</strong></>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#15803D', background: '#DCFCE7', padding: '6px 14px', borderRadius: 20, fontWeight: 700 }}>
              <ShieldCheck size={16} />
              <span>Official Student Record</span>
            </div>
          </div>
        )}

        {/* Real-Data Performance Summary Cards */}
        <div className="parent-exams-summary-grid">
          <div className="parent-exams-summary-card">
            <div className="parent-summary-icon-wrap primary">
              <Award size={20} />
            </div>
            <div>
              <div className="parent-summary-card-label">Total Examinations</div>
              <div className="parent-summary-card-value">{summary.totalExams}</div>
            </div>
          </div>

          <div className="parent-exams-summary-card">
            <div className="parent-summary-icon-wrap success">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="parent-summary-card-label">Subjects Passed</div>
              <div className="parent-summary-card-value" style={{ color: '#15803D' }}>
                {summary.totalSubjectsPassed}
              </div>
            </div>
          </div>

          <div className="parent-exams-summary-card">
            <div className="parent-summary-icon-wrap danger">
              <AlertCircle size={20} />
            </div>
            <div>
              <div className="parent-summary-card-label">Needs Improvement</div>
              <div className="parent-summary-card-value" style={{ color: summary.totalSubjectsFailed > 0 ? '#B91C1C' : undefined }}>
                {summary.totalSubjectsFailed}
              </div>
            </div>
          </div>

          <div className="parent-exams-summary-card">
            <div className="parent-summary-icon-wrap info">
              <Percent size={20} />
            </div>
            <div>
              <div className="parent-summary-card-label">Overall Average</div>
              <div className="parent-summary-card-value">
                {summary.overallAveragePercentage}%
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <RotateCw className="admin-spin" size={32} style={{ color: 'var(--parent-primary, #20354A)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--parent-text-muted, #707781)', fontSize: '0.9rem' }}>
              Retrieving verified examination results for {currentChild?.fullName || 'your child'}...
            </p>
          </div>
        ) : error ? (
          <div
            style={{
              backgroundColor: '#FFF5F5',
              border: '1px solid #FEB2B2',
              borderRadius: 12,
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertCircle size={22} style={{ color: '#E53E3E', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#C53030' }}>Unable to load examination results</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#9B2C2C' }}>{error}</p>
              </div>
            </div>
            <button
              type="button"
              className="parent-btn-refresh"
              onClick={() => fetchExamResults(selectedChildId, selectedAcademicYear, searchTerm)}
            >
              Retry
            </button>
          </div>
        ) : examCards.length === 0 ? (
          <div className="parent-exams-empty-card">
            <div className="parent-exams-empty-icon">
              <BookOpen size={30} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: 'var(--parent-primary, #20354A)' }}>
              No Published Examination Results Found
            </h3>
            <p style={{ color: 'var(--parent-text-muted, #707781)', maxWidth: 540, margin: '0 auto', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Examination scores and report cards appear here as soon as teachers complete marks entry and school management officially approves and publishes the results.
            </p>
          </div>
        ) : (
          <div>
            {examCards.map((exam) => {
              return (
                <div key={exam.examId} className="parent-exam-report-card">
                  {/* Exam Card Header */}
                  <div className="parent-exam-report-header">
                    <div>
                      <div className="parent-exam-title-row">
                        <h2>{exam.examName}</h2>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#EBF0F5',
                            color: '#20354A',
                            fontWeight: 700,
                            fontSize: '0.74rem',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {exam.examType}
                        </span>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '20px',
                            backgroundColor: '#DCFCE7',
                            color: '#15803D',
                            fontWeight: 700,
                            fontSize: '0.74rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={12} />
                          <span>Results Published</span>
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--parent-text-muted, #707781)', marginTop: 4 }}>
                        Academic Year {exam.academicYear} • {exam.totalSubjects} Subject Examination(s) Evaluated
                        {exam.publishedAt && (
                          <> • Published on {new Date(exam.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</>
                        )}
                      </div>
                    </div>

                    <div className="parent-exam-header-right">
                      <div className="parent-exam-overall-stat">
                        <span className="stat-label">Total Score</span>
                        <span className="stat-val">
                          {exam.totalObtainedMarks} <span style={{ fontSize: '0.85rem', color: 'var(--parent-text-muted, #707781)', fontWeight: 400 }}>/ {exam.totalMaxMarks}</span>
                        </span>
                      </div>

                      <div className="parent-exam-overall-stat">
                        <span className="stat-label">Percentage</span>
                        <span className="stat-val" style={{ color: exam.overallPercentage >= 40 ? '#15803D' : '#B91C1C' }}>
                          {exam.overallPercentage}%
                        </span>
                      </div>

                      <div>{renderGradeBadge(exam.overallGrade)}</div>

                      {/* View Report Card Button */}
                      <button
                        type="button"
                        className="parent-btn-view-report"
                        onClick={() => setReportCardExam(exam)}
                        title="View and print official academic report card"
                      >
                        <FileText size={14} />
                        <span>View Report Card</span>
                      </button>
                    </div>
                  </div>

                  {/* Subject-Wise Results Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table className="parent-exam-subjects-table">
                      <thead>
                        <tr>
                          <th style={{ width: '22%' }}>Subject</th>
                          <th style={{ width: '13%' }}>Exam Date</th>
                          <th style={{ width: '10%', textAlign: 'right' }}>Max Marks</th>
                          <th style={{ width: '10%', textAlign: 'right' }}>Pass Marks</th>
                          <th style={{ width: '11%', textAlign: 'right' }}>Marks Obtained</th>
                          <th style={{ width: '10%', textAlign: 'center' }}>Percentage</th>
                          <th style={{ width: '8%', textAlign: 'center' }}>Grade</th>
                          <th style={{ width: '12%', textAlign: 'center' }}>Result Status</th>
                          <th>Teacher Feedback</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exam.subjects.map((subj) => (
                          <tr key={subj.scheduleId}>
                            <td style={{ fontWeight: 600, color: 'var(--parent-primary, #20354A)' }}>
                              {subj.subject}
                            </td>
                            <td style={{ color: 'var(--parent-text-muted, #707781)' }}>
                              {subj.examDate || '—'}
                            </td>
                            <td style={{ textAlign: 'right' }}>{subj.maxMarks}</td>
                            <td style={{ textAlign: 'right', color: 'var(--parent-text-muted, #707781)' }}>
                              {subj.passingMarks}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>
                              {subj.isAbsent ? (
                                <span style={{ color: '#B45309' }}>ABSENT</span>
                              ) : subj.marksObtained !== null ? (
                                <span>{subj.marksObtained}</span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>
                              {subj.percentage !== null ? `${subj.percentage}%` : '—'}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 700 }}>
                              {subj.grade || '—'}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {subj.isAbsent ? (
                                <span className="parent-badge-absent">Absent</span>
                              ) : subj.isPassed ? (
                                <span className="parent-badge-pass">Pass</span>
                              ) : (
                                <span className="parent-badge-fail">Needs Improvement</span>
                              )}
                            </td>
                            <td style={{ fontSize: '0.82rem', color: 'var(--parent-text-muted, #707781)' }}>
                              {subj.remarks || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Official Printable Report Card Modal */}
        {reportCardExam && (
          <div className="parent-report-modal-backdrop" onClick={() => setReportCardExam(null)}>
            <div
              className="parent-report-modal-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Toolbar (Hidden during print) */}
              <div className="parent-report-modal-header">
                <h3 className="parent-report-modal-title">Official Student Performance Report</h3>
                <div className="parent-report-modal-actions">
                  <button
                    type="button"
                    className="parent-print-action-btn"
                    onClick={handlePrint}
                    title="Print report card document"
                  >
                    <Printer size={15} />
                    <span>Print Report Card</span>
                  </button>
                  <button
                    type="button"
                    className="parent-modal-close-btn"
                    onClick={() => setReportCardExam(null)}
                    aria-label="Close report card"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Body / Official Document Area */}
              <div className="parent-report-modal-body">
                <div id="official-report-card-print-target" className="eduhub-official-report-card">
                  {/* Institutional Header */}
                  <div className="report-card-inst-header">
                    <div className="report-card-brand">
                      <img
                        src="/EduHub-logoti.png"
                        alt="EduHub Institutional Crest"
                        className="report-card-logo-img"
                      />
                      <div>
                        <h2 className="report-card-school-name">EDUHUB INTERNATIONAL SCHOOL</h2>
                        <p className="report-card-school-motto">
                          Affiliated with Central Board of Secondary Education • Recognized Institutional ERP
                        </p>
                      </div>
                    </div>

                    <div className="report-card-doc-badge">
                      <h3 className="report-card-doc-title">ACADEMIC REPORT CARD</h3>
                      <div className="report-card-doc-academic-year">
                        ACADEMIC YEAR {reportCardExam.academicYear}
                      </div>
                    </div>
                  </div>

                  {/* Student & Examination Information Grid */}
                  <div className="report-card-meta-grid">
                    <div className="report-card-meta-item">
                      <span className="report-card-meta-label">Student Name:</span>
                      <span className="report-card-meta-val">{currentChild?.fullName || '—'}</span>
                    </div>

                    <div className="report-card-meta-item">
                      <span className="report-card-meta-label">Admission ID:</span>
                      <span className="report-card-meta-val">{currentChild?.studentId || '—'}</span>
                    </div>

                    <div className="report-card-meta-item">
                      <span className="report-card-meta-label">Class & Section:</span>
                      <span className="report-card-meta-val">
                        {currentChild?.grade || '—'} - Section {currentChild?.section || '—'}
                      </span>
                    </div>

                    <div className="report-card-meta-item">
                      <span className="report-card-meta-label">Roll Number:</span>
                      <span className="report-card-meta-val">{currentChild?.rollNumber || '—'}</span>
                    </div>

                    <div className="report-card-meta-item">
                      <span className="report-card-meta-label">Examination:</span>
                      <span className="report-card-meta-val">
                        {reportCardExam.examName} ({reportCardExam.examType})
                      </span>
                    </div>

                    <div className="report-card-meta-item">
                      <span className="report-card-meta-label">Exam Schedule:</span>
                      <span className="report-card-meta-val">{reportCardExam.examDate || 'Institutional Testing Session'}</span>
                    </div>

                    <div className="report-card-meta-item">
                      <span className="report-card-meta-label">Publication Date:</span>
                      <span className="report-card-meta-val">
                        {reportCardExam.publishedAt
                          ? new Date(reportCardExam.publishedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'Official Institutional Record'}
                      </span>
                    </div>

                    <div className="report-card-meta-item">
                      <span className="report-card-meta-label">Class Teacher:</span>
                      <span className="report-card-meta-val">{currentChild?.classTeacher || 'Assigned Faculty'}</span>
                    </div>
                  </div>

                  {/* Subject-Wise Results Table */}
                  <table className="report-card-table">
                    <thead>
                      <tr>
                        <th style={{ width: '5%', textAlign: 'center' }}>#</th>
                        <th style={{ width: '25%' }}>Subject Name</th>
                        <th style={{ width: '12%', textAlign: 'right' }}>Max Marks</th>
                        <th style={{ width: '12%', textAlign: 'right' }}>Pass Marks</th>
                        <th style={{ width: '13%', textAlign: 'right' }}>Marks Obtained</th>
                        <th style={{ width: '11%', textAlign: 'center' }}>Percentage</th>
                        <th style={{ width: '8%', textAlign: 'center' }}>Grade</th>
                        <th style={{ width: '14%', textAlign: 'center' }}>Result Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportCardExam.subjects.map((subj, idx) => (
                        <tr key={subj.scheduleId}>
                          <td style={{ textAlign: 'center', color: '#707781', fontWeight: 600 }}>
                            {idx + 1}
                          </td>
                          <td style={{ fontWeight: 600 }}>{subj.subject}</td>
                          <td style={{ textAlign: 'right' }}>{subj.maxMarks}</td>
                          <td style={{ textAlign: 'right', color: '#707781' }}>{subj.passingMarks}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            {subj.isAbsent ? (
                              <span style={{ color: '#B45309' }}>ABSENT</span>
                            ) : subj.marksObtained !== null ? (
                              subj.marksObtained
                            ) : (
                              '—'
                            )}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>
                            {subj.percentage !== null ? `${subj.percentage}%` : '—'}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>
                            {subj.grade || '—'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {subj.isAbsent ? (
                              <span className="parent-badge-absent">Absent</span>
                            ) : subj.isPassed ? (
                              <span className="parent-badge-pass">Pass</span>
                            ) : (
                              <span className="parent-badge-fail">Needs Improvement</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} style={{ textAlign: 'right', textTransform: 'uppercase' }}>
                          Cumulative Totals:
                        </td>
                        <td style={{ textAlign: 'right' }}>{reportCardExam.totalMaxMarks}</td>
                        <td style={{ textAlign: 'right' }}>—</td>
                        <td style={{ textAlign: 'right' }}>{reportCardExam.totalObtainedMarks}</td>
                        <td style={{ textAlign: 'center' }}>{reportCardExam.overallPercentage}%</td>
                        <td style={{ textAlign: 'center' }}>{reportCardExam.overallGrade}</td>
                        <td style={{ textAlign: 'center' }}>
                          {reportCardExam.isPassed ? (
                            <span className="parent-badge-pass">PASSED</span>
                          ) : (
                            <span className="parent-badge-fail">NEEDS IMPROVEMENT</span>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Cumulative Performance Summary Strip */}
                  <div className="report-card-summary-strip">
                    <div className="report-card-summary-col">
                      <div className="strip-label">Total Marks</div>
                      <div className="strip-val">
                        {reportCardExam.totalObtainedMarks} / {reportCardExam.totalMaxMarks}
                      </div>
                    </div>

                    <div className="report-card-summary-col">
                      <div className="strip-label">Grand Percentage</div>
                      <div className="strip-val" style={{ color: reportCardExam.overallPercentage >= 40 ? '#15803D' : '#B91C1C' }}>
                        {reportCardExam.overallPercentage}%
                      </div>
                    </div>

                    <div className="report-card-summary-col">
                      <div className="strip-label">Overall Grade</div>
                      <div className="strip-val">{reportCardExam.overallGrade}</div>
                    </div>

                    <div className="report-card-summary-col">
                      <div className="strip-label">Academic Standing</div>
                      <div className="strip-val" style={{ fontSize: '1.05rem', color: reportCardExam.isPassed ? '#15803D' : '#B91C1C' }}>
                        {reportCardExam.isPassed ? 'PASSED & PROMOTED' : 'NEEDS IMPROVEMENT'}
                      </div>
                    </div>
                  </div>

                  {/* Standard EduHub Grading Scale Reference */}
                  <div className="report-card-grading-scale">
                    <div className="report-card-grading-scale-title">Institutional Grading Scale Reference</div>
                    <div className="report-card-grading-scale-items">
                      <span className="report-card-scale-item"><strong>A+</strong>: 90–100% (Outstanding)</span>
                      <span className="report-card-scale-item"><strong>A</strong>: 80–89% (Excellent)</span>
                      <span className="report-card-scale-item"><strong>B+</strong>: 70–79% (Very Good)</span>
                      <span className="report-card-scale-item"><strong>B</strong>: 60–69% (Good)</span>
                      <span className="report-card-scale-item"><strong>C</strong>: 50–59% (Satisfactory)</span>
                      <span className="report-card-scale-item"><strong>D</strong>: 40–49% (Pass)</span>
                      <span className="report-card-scale-item"><strong>F</strong>: &lt;40% (Needs Improvement)</span>
                      <span className="report-card-scale-item"><strong>AB</strong>: Absent</span>
                    </div>
                  </div>

                  {/* Formal Signatures and Verification */}
                  <div className="report-card-signatures">
                    <div className="report-card-signature-box">
                      <div className="report-card-signature-line" />
                      <div className="report-card-signature-role">Class Teacher</div>
                      <div className="report-card-official-seal">{currentChild?.classTeacher || 'Teacher In-Charge'}</div>
                    </div>

                    <div className="report-card-signature-box">
                      <div className="report-card-signature-line" />
                      <div className="report-card-signature-role">Controller of Examinations</div>
                      <div className="report-card-official-seal">Academic Verification Cell</div>
                    </div>

                    <div className="report-card-signature-box">
                      <div className="report-card-signature-line" />
                      <div className="report-card-signature-role">Principal</div>
                      <div className="report-card-official-seal">Official Institutional Seal</div>
                    </div>
                  </div>

                  {/* Verification Disclaimer Footer */}
                  <div className="report-card-footer-notice">
                    This certified academic transcript is officially generated and published by EduHub School Management Portal. Any unauthorized alteration renders this document invalid.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ParentLayout>
  );
};
