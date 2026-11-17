import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Search,
  RotateCw,
  Eye,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Award,
  Calendar,
  Paperclip,
  ArrowUpDown,
  GraduationCap,
  Layers,
  Check,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminAssignmentApi } from '../../api/adminAssignmentApi';
import {
  AdminAssignmentListItem,
  AdminAssignmentSummaryStats,
  AdminAssignmentFilterMetadata,
  AdminAssignmentDetails,
  AdminStudentSubmissionItem,
  AdminTeacherMonitoringItem,
  AdminAssignmentFilterParams,
} from '../../types/adminAssignment.types';

export const AdminAssignmentsPage: React.FC = () => {
  // Navigation View Tab: 'assignments' | 'teachers'
  const [activeTab, setActiveTab] = useState<'assignments' | 'teachers'>('assignments');

  // Academic Year State
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2026-2027');

  // Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSubmissionStatus, setSelectedSubmissionStatus] = useState<string>('ALL');
  const [selectedPublicationStatus, setSelectedPublicationStatus] = useState<string>('ALL');

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Data State
  const [loading, setLoading] = useState<boolean>(true);
  const [assignments, setAssignments] = useState<AdminAssignmentListItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [summaryStats, setSummaryStats] = useState<AdminAssignmentSummaryStats>({
    totalAssignments: 0,
    publishedAssignments: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    evaluatedSubmissions: 0,
    resultsPublished: 0,
    pendingEvaluations: 0,
  });
  const [filterMetadata, setFilterMetadata] = useState<AdminAssignmentFilterMetadata>({
    academicYears: ['2026-2027'],
    classes: [],
    subjects: [],
    teachers: [],
  });

  // Teacher Monitoring State
  const [teacherSearchTerm, setTeacherSearchTerm] = useState<string>('');
  const [teachersMonitoring, setTeachersMonitoring] = useState<AdminTeacherMonitoringItem[]>([]);
  const [teacherLoading, setTeacherLoading] = useState<boolean>(false);

  // Modal State: Assignment Details
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [assignmentDetails, setAssignmentDetails] = useState<AdminAssignmentDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>('ALL');

  // Child Modals
  const [viewSubmissionStudent, setViewSubmissionStudent] = useState<AdminStudentSubmissionItem | null>(null);
  const [viewFeedbackStudent, setViewFeedbackStudent] = useState<AdminStudentSubmissionItem | null>(null);

  // Error & Feedback Message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load Metadata once on mount
  useEffect(() => {
    let mounted = true;
    adminAssignmentApi
      .getMetadata()
      .then((res) => {
        if (mounted && res.success && res.data) {
          setFilterMetadata(res.data);
          if (res.data.academicYears && res.data.academicYears.length > 0) {
            setSelectedAcademicYear(res.data.academicYears[0]);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load assignment metadata:', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch Assignments List
  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const params: AdminAssignmentFilterParams = {
        academicYear: selectedAcademicYear,
        teacherId: selectedTeacherId !== 'ALL' ? selectedTeacherId : undefined,
        className: selectedClass !== 'ALL' ? selectedClass : undefined,
        section: selectedSection !== 'ALL' ? selectedSection : undefined,
        subject: selectedSubject !== 'ALL' ? selectedSubject : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        submissionStatus: selectedSubmissionStatus !== 'ALL' ? selectedSubmissionStatus : undefined,
        resultPublicationStatus:
          selectedPublicationStatus !== 'ALL' ? selectedPublicationStatus : undefined,
        search: searchTerm.trim() || undefined,
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder,
      };

      const res = await adminAssignmentApi.getAssignments(params);
      if (res.success && res.data) {
        setAssignments(res.data.assignments);
        setTotalCount(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages);
        setSummaryStats(res.data.summary);
      }
    } catch (err: any) {
      console.error('Failed to fetch assignments:', err);
      setErrorMessage(err.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  }, [
    selectedAcademicYear,
    selectedTeacherId,
    selectedClass,
    selectedSection,
    selectedSubject,
    selectedStatus,
    selectedSubmissionStatus,
    selectedPublicationStatus,
    searchTerm,
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
  ]);

  // Fetch Teacher Monitoring Data
  const fetchTeacherMonitoring = useCallback(async () => {
    setTeacherLoading(true);
    try {
      const res = await adminAssignmentApi.getTeacherMonitoring(
        selectedAcademicYear,
        teacherSearchTerm.trim() || undefined
      );
      if (res.success && res.data) {
        setTeachersMonitoring(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch teacher monitoring:', err);
    } finally {
      setTeacherLoading(false);
    }
  }, [selectedAcademicYear, teacherSearchTerm]);

  // Trigger fetch on tab change or filter change
  useEffect(() => {
    if (activeTab === 'assignments') {
      fetchAssignments();
    } else {
      fetchTeacherMonitoring();
    }
  }, [activeTab, fetchAssignments, fetchTeacherMonitoring]);

  // Fetch Assignment Details when modal opened
  const openAssignmentDetails = async (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setDetailsLoading(true);
    setAssignmentDetails(null);
    setStudentSearchTerm('');
    setStudentStatusFilter('ALL');
    try {
      const res = await adminAssignmentApi.getAssignmentDetails(assignmentId);
      if (res.success && res.data) {
        setAssignmentDetails(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch assignment details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeAssignmentDetails = () => {
    setSelectedAssignmentId(null);
    setAssignmentDetails(null);
    setViewSubmissionStudent(null);
    setViewFeedbackStudent(null);
  };

  // Reset Filters Handler
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedTeacherId('ALL');
    setSelectedClass('ALL');
    setSelectedSection('ALL');
    setSelectedSubject('ALL');
    setSelectedStatus('ALL');
    setSelectedSubmissionStatus('ALL');
    setSelectedPublicationStatus('ALL');
    setCurrentPage(1);
  };

  const isFiltersActive =
    searchTerm !== '' ||
    selectedTeacherId !== 'ALL' ||
    selectedClass !== 'ALL' ||
    selectedSection !== 'ALL' ||
    selectedSubject !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedSubmissionStatus !== 'ALL' ||
    selectedPublicationStatus !== 'ALL';

  // Available sections for the currently selected class
  const availableSections = useMemo(() => {
    if (selectedClass === 'ALL') return ['A', 'B', 'C', 'D'];
    const matched = filterMetadata.classes.find(
      (c) => c.className.toLowerCase() === selectedClass.toLowerCase()
    );
    return matched && matched.sections.length > 0 ? matched.sections : ['A', 'B', 'C'];
  }, [selectedClass, filterMetadata.classes]);

  // Filtered student submission list inside Details Modal
  const filteredStudents = useMemo(() => {
    if (!assignmentDetails) return [];
    return assignmentDetails.students.filter((student) => {
      const matchesSearch =
        !studentSearchTerm.trim() ||
        student.studentName.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        student.admissionId.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        (student.rollNumber && student.rollNumber.toLowerCase().includes(studentSearchTerm.toLowerCase()));

      const hasSubmitted = Boolean(student.submissionId || student.submissionStatus === 'SUBMITTED');

      const matchesStatus =
        studentStatusFilter === 'ALL' ||
        (studentStatusFilter === 'SUBMITTED' && hasSubmitted) ||
        (studentStatusFilter === 'NOT_SUBMITTED' && !hasSubmitted) ||
        (studentStatusFilter === 'GRADED' && student.evaluationStatus === 'GRADED') ||
        (studentStatusFilter === 'PENDING' && hasSubmitted && student.evaluationStatus !== 'GRADED');

      return matchesSearch && matchesStatus;
    });
  }, [assignmentDetails, studentSearchTerm, studentStatusFilter]);

  // Sorting Handler
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  return (
    <AdminLayout breadcrumbTitle="Assignments">
      <div className="admin-assignments-root">
        {/* ===================================================================
            HEADER & TOP ACTIONS
            =================================================================== */}
        <div className="admin-page-header-container" style={{ marginBottom: 24 }}>
          <div className="admin-header-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: '#EBF0F5',
                  color: '#20354A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ClipboardList size={24} />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    color: '#20354A',
                    margin: 0,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Assignment Management
                </h1>
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: '#707781',
                    margin: '3px 0 0 0',
                  }}
                >
                  Monitor teacher assignments, student submissions and evaluation progress.
                </p>
              </div>
            </div>
          </div>

          <div
            className="admin-header-actions-group"
            style={{ display: 'flex', alignItems: 'center', gap: 12 }}
          >
            {/* Academic Year Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={16} color="#707781" />
              <select
                value={selectedAcademicYear}
                onChange={(e) => {
                  setSelectedAcademicYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="admin-select-input"
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1px solid #E8E5DD',
                  backgroundColor: '#FFFFFF',
                  color: '#20354A',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {filterMetadata.academicYears.map((yr) => (
                  <option key={yr} value={yr}>
                    AY {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'assignments') fetchAssignments();
                else fetchTeacherMonitoring();
              }}
              className="admin-btn-secondary"
              disabled={loading || teacherLoading}
              title="Refresh assignments data"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid #E8E5DD',
                backgroundColor: '#FFFFFF',
                color: '#20354A',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <RotateCw size={14} className={loading || teacherLoading ? 'spin-icon' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ===================================================================
            VIEW NAVIGATION TABS
            =================================================================== */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: '1px solid #E8E5DD',
            marginBottom: 24,
            paddingBottom: 2,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              fontSize: '0.92rem',
              fontWeight: 600,
              color: activeTab === 'assignments' ? '#20354A' : '#707781',
              borderBottom: activeTab === 'assignments' ? '3px solid #20354A' : '3px solid transparent',
              backgroundColor: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Layers size={16} />
            <span>All Assignments</span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: '0.75rem',
                backgroundColor: activeTab === 'assignments' ? '#20354A' : '#E8E5DD',
                color: activeTab === 'assignments' ? '#FFFFFF' : '#707781',
              }}
            >
              {summaryStats.totalAssignments}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teachers')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              fontSize: '0.92rem',
              fontWeight: 600,
              color: activeTab === 'teachers' ? '#20354A' : '#707781',
              borderBottom: activeTab === 'teachers' ? '3px solid #20354A' : '3px solid transparent',
              backgroundColor: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <GraduationCap size={16} />
            <span>Teacher Monitoring</span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: '0.75rem',
                backgroundColor: activeTab === 'teachers' ? '#20354A' : '#E8E5DD',
                color: activeTab === 'teachers' ? '#FFFFFF' : '#707781',
              }}
            >
              {filterMetadata.teachers.length}
            </span>
          </button>
        </div>

        {/* ===================================================================
            DASHBOARD SUMMARY KPI CARDS (6 CARDS)
            =================================================================== */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* 1. Total Assignments */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: '16px 20px',
              border: '1px solid #E8E5DD',
              boxShadow: '0 1px 3px rgba(32,53,74,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#707781' }}>Total Assignments</span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#EEF3F8',
                  color: '#20354A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ClipboardList size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#20354A', lineHeight: 1.2 }}>
              {summaryStats.totalAssignments}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#707781' }}>Across all classes & subjects</div>
          </div>

          {/* 2. Published Assignments */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: '16px 20px',
              border: '1px solid #E8E5DD',
              boxShadow: '0 1px 3px rgba(32,53,74,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#707781' }}>Published</span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#F0F7ED',
                  color: '#2E7D32',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2E7D32', lineHeight: 1.2 }}>
              {summaryStats.publishedAssignments}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#707781' }}>
              {summaryStats.totalAssignments > 0
                ? `${Math.round((summaryStats.publishedAssignments / summaryStats.totalAssignments) * 100)}% published`
                : 'Active for students'}
            </div>
          </div>

          {/* 3. Total Submissions */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: '16px 20px',
              border: '1px solid #E8E5DD',
              boxShadow: '0 1px 3px rgba(32,53,74,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#707781' }}>Total Submissions</span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#EBF3FB',
                  color: '#1565C0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1565C0', lineHeight: 1.2 }}>
              {summaryStats.totalSubmissions}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#707781' }}>Submitted student work</div>
          </div>

          {/* 4. Pending Submissions */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: '16px 20px',
              border: '1px solid #E8E5DD',
              boxShadow: '0 1px 3px rgba(32,53,74,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#707781' }}>Pending Submissions</span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#FFF8E1',
                  color: '#F57F17',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F57F17', lineHeight: 1.2 }}>
              {summaryStats.pendingSubmissions}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#707781' }}>Awaiting student upload</div>
          </div>

          {/* 5. Evaluated Submissions */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: '16px 20px',
              border: '1px solid #E8E5DD',
              boxShadow: '0 1px 3px rgba(32,53,74,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#707781' }}>Evaluated</span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#F3E5F5',
                  color: '#7B1FA2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Award size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#7B1FA2', lineHeight: 1.2 }}>
              {summaryStats.evaluatedSubmissions}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#707781' }}>
              {summaryStats.totalSubmissions > 0
                ? `${Math.round((summaryStats.evaluatedSubmissions / summaryStats.totalSubmissions) * 100)}% of submissions`
                : 'Graded by teacher'}
            </div>
          </div>

          {/* 6. Results Published */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: '16px 20px',
              border: '1px solid #E8E5DD',
              boxShadow: '0 1px 3px rgba(32,53,74,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#707781' }}>Results Published</span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#E0F2F1',
                  color: '#00796B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#00796B', lineHeight: 1.2 }}>
              {summaryStats.resultsPublished}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#707781' }}>Visible to parents & students</div>
          </div>
        </div>

        {/* ===================================================================
            TAB 1: ALL ASSIGNMENTS VIEW
            =================================================================== */}
        {activeTab === 'assignments' && (
          <>
            {/* Filter Panel */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid #E8E5DD',
                padding: '18px 20px',
                marginBottom: 20,
                boxShadow: '0 1px 3px rgba(32,53,74,0.03)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Filter size={16} color="#707781" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#20354A' }}>
                    Filter Assignments
                  </span>
                </div>
                {isFiltersActive && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#C62828',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <X size={14} />
                    <span>Clear All Filters</span>
                  </button>
                )}
              </div>

              {/* Filters Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: 12,
                }}
              >
                {/* Search Input */}
                <div style={{ position: 'relative' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#707781',
                      marginBottom: 4,
                      textTransform: 'uppercase',
                    }}
                  >
                    Search Title
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Search
                      size={14}
                      color="#9EA5B0"
                      style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type="text"
                      placeholder="Title or keyword..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{
                        width: '100%',
                        padding: '7px 10px 7px 30px',
                        borderRadius: 8,
                        border: '1px solid #E8E5DD',
                        fontSize: '0.84rem',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Teacher Filter */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#707781',
                      marginBottom: 4,
                      textTransform: 'uppercase',
                    }}
                  >
                    Teacher
                  </label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => {
                      setSelectedTeacherId(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 8,
                      border: '1px solid #E8E5DD',
                      fontSize: '0.84rem',
                      backgroundColor: '#FFFFFF',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="ALL">All Teachers</option>
                    {filterMetadata.teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class Filter */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#707781',
                      marginBottom: 4,
                      textTransform: 'uppercase',
                    }}
                  >
                    Class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setSelectedSection('ALL');
                      setCurrentPage(1);
                    }}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 8,
                      border: '1px solid #E8E5DD',
                      fontSize: '0.84rem',
                      backgroundColor: '#FFFFFF',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="ALL">All Classes</option>
                    {filterMetadata.classes.map((c) => (
                      <option key={c.className} value={c.className}>
                        {c.className}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section Filter */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#707781',
                      marginBottom: 4,
                      textTransform: 'uppercase',
                    }}
                  >
                    Section
                  </label>
                  <select
                    value={selectedSection}
                    onChange={(e) => {
                      setSelectedSection(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 8,
                      border: '1px solid #E8E5DD',
                      fontSize: '0.84rem',
                      backgroundColor: '#FFFFFF',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="ALL">All Sections</option>
                    {availableSections.map((s) => (
                      <option key={s} value={s}>
                        Section {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Filter */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#707781',
                      marginBottom: 4,
                      textTransform: 'uppercase',
                    }}
                  >
                    Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => {
                      setSelectedSubject(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 8,
                      border: '1px solid #E8E5DD',
                      fontSize: '0.84rem',
                      backgroundColor: '#FFFFFF',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="ALL">All Subjects</option>
                    {filterMetadata.subjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assignment Status */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#707781',
                      marginBottom: 4,
                      textTransform: 'uppercase',
                    }}
                  >
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 8,
                      border: '1px solid #E8E5DD',
                      fontSize: '0.84rem',
                      backgroundColor: '#FFFFFF',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                {/* Result Publication Status */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#707781',
                      marginBottom: 4,
                      textTransform: 'uppercase',
                    }}
                  >
                    Results
                  </label>
                  <select
                    value={selectedPublicationStatus}
                    onChange={(e) => {
                      setSelectedPublicationStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 8,
                      border: '1px solid #E8E5DD',
                      fontSize: '0.84rem',
                      backgroundColor: '#FFFFFF',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="ALL">All Results</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="PARTIALLY_PUBLISHED">Partially Published</option>
                    <option value="UNPUBLISHED">Unpublished</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#FFEBEE',
                  color: '#C62828',
                  borderRadius: 8,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.88rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Table Container */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid #E8E5DD',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(32,53,74,0.03)',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 1050 }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: '#FAF9F5',
                        borderBottom: '1px solid #E8E5DD',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        color: '#707781',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      <th
                        onClick={() => handleSort('title')}
                        style={{ padding: '14px 16px', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>Assignment</span>
                          <ArrowUpDown size={12} color="#9EA5B0" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('teacherName')}
                        style={{ padding: '14px 14px', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>Teacher</span>
                          <ArrowUpDown size={12} color="#9EA5B0" />
                        </div>
                      </th>
                      <th style={{ padding: '14px 14px' }}>Class & Sec</th>
                      <th style={{ padding: '14px 14px' }}>Subject</th>
                      <th
                        onClick={() => handleSort('dueDate')}
                        style={{ padding: '14px 14px', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>Due Date</span>
                          <ArrowUpDown size={12} color="#9EA5B0" />
                        </div>
                      </th>
                      <th style={{ padding: '14px 12px', textAlign: 'center' }}>Students</th>
                      <th style={{ padding: '14px 12px', textAlign: 'center' }}>Submitted</th>
                      <th style={{ padding: '14px 12px', textAlign: 'center' }}>Pending</th>
                      <th style={{ padding: '14px 12px', textAlign: 'center' }}>Evaluated</th>
                      <th style={{ padding: '14px 14px' }}>Results Status</th>
                      <th style={{ padding: '14px 14px' }}>Status</th>
                      <th style={{ padding: '14px 16px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={12} style={{ padding: '48px 20px', textAlign: 'center', color: '#707781' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                            <RotateCw size={24} className="spin-icon" color="#20354A" />
                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Loading assignments...</span>
                          </div>
                        </td>
                      </tr>
                    ) : assignments.length === 0 ? (
                      <tr>
                        <td colSpan={12} style={{ padding: '56px 20px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 50,
                                height: 50,
                                borderRadius: '50%',
                                backgroundColor: '#FAF9F5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#9EA5B0',
                              }}
                            >
                              <ClipboardList size={26} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1rem', color: '#20354A', fontWeight: 600 }}>
                              No Assignments Found
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#707781', maxWidth: 360 }}>
                              No assignments match the selected filter criteria. Try clearing or relaxing some filters.
                            </p>
                            {isFiltersActive && (
                              <button
                                type="button"
                                onClick={handleResetFilters}
                                style={{
                                  marginTop: 8,
                                  padding: '6px 14px',
                                  borderRadius: 6,
                                  border: '1px solid #20354A',
                                  backgroundColor: '#FFFFFF',
                                  color: '#20354A',
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Clear Filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      assignments.map((item) => {
                        const isPastDue = item.dueDate < new Date().toISOString().slice(0, 10);
                        return (
                          <tr
                            key={item.id}
                            style={{
                              borderBottom: '1px solid #F0EDE5',
                              transition: 'background-color 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF9F5')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            {/* Title & Marks */}
                            <td style={{ padding: '14px 16px', maxWidth: 240 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <div
                                  onClick={() => openAssignmentDetails(item.id)}
                                  style={{
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    color: '#20354A',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                  }}
                                  title={item.title}
                                >
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.title}
                                  </span>
                                  {item.attachmentUrl && (
                                    <span title="Attachment available" style={{ display: 'inline-flex' }}>
                                      <Paperclip size={12} color="#647F99" />
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem' }}>
                                  <span style={{ color: '#707781' }}>Max Marks:</span>
                                  <span style={{ fontWeight: 600, color: '#20354A' }}>{item.maxMarks}</span>
                                </div>
                              </div>
                            </td>

                            {/* Teacher Name */}
                            <td style={{ padding: '14px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    backgroundColor: '#EEF3F8',
                                    color: '#20354A',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  {item.teacherName.charAt(0)}
                                </div>
                                <span style={{ fontSize: '0.86rem', color: '#27313A', fontWeight: 500 }}>
                                  {item.teacherName}
                                </span>
                              </div>
                            </td>

                            {/* Class & Section */}
                            <td style={{ padding: '14px 14px' }}>
                              <span
                                style={{
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  color: '#20354A',
                                  backgroundColor: '#FAF9F5',
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  border: '1px solid #E8E5DD',
                                }}
                              >
                                {item.className} - {item.section}
                              </span>
                            </td>

                            {/* Subject */}
                            <td style={{ padding: '14px 14px' }}>
                              <span
                                style={{
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  color: '#20354A',
                                }}
                              >
                                {item.subject}
                              </span>
                            </td>

                            {/* Due Date */}
                            <td style={{ padding: '14px 14px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span style={{ fontSize: '0.84rem', color: '#27313A' }}>{item.dueDate}</span>
                                {isPastDue && item.status === 'PUBLISHED' && (
                                  <span style={{ fontSize: '0.7rem', color: '#C62828', fontWeight: 600 }}>
                                    Past Due
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Total Students */}
                            <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#27313A' }}>
                                {item.totalStudents}
                              </span>
                            </td>

                            {/* Submitted Count */}
                            <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                              <span
                                style={{
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  color: item.submittedCount > 0 ? '#1565C0' : '#707781',
                                  backgroundColor: item.submittedCount > 0 ? '#EBF3FB' : 'transparent',
                                  padding: '3px 8px',
                                  borderRadius: 10,
                                }}
                              >
                                {item.submittedCount}
                              </span>
                            </td>

                            {/* Pending Count */}
                            <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                              <span
                                style={{
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  color: item.pendingCount > 0 ? '#F57F17' : '#707781',
                                  backgroundColor: item.pendingCount > 0 ? '#FFF8E1' : 'transparent',
                                  padding: '3px 8px',
                                  borderRadius: 10,
                                }}
                              >
                                {item.pendingCount}
                              </span>
                            </td>

                            {/* Evaluated Count */}
                            <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                              <span
                                style={{
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  color: item.evaluatedCount > 0 ? '#7B1FA2' : '#707781',
                                  backgroundColor: item.evaluatedCount > 0 ? '#F3E5F5' : 'transparent',
                                  padding: '3px 8px',
                                  borderRadius: 10,
                                }}
                              >
                                {item.evaluatedCount}
                              </span>
                            </td>

                            {/* Result Publication Status */}
                            <td style={{ padding: '14px 14px' }}>
                              {item.resultPublicationStatus === 'PUBLISHED' ? (
                                <span
                                  style={{
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    padding: '4px 8px',
                                    borderRadius: 12,
                                    backgroundColor: '#E0F2F1',
                                    color: '#00796B',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  <Check size={11} /> Published
                                </span>
                              ) : item.resultPublicationStatus === 'PARTIALLY_PUBLISHED' ? (
                                <span
                                  style={{
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    padding: '4px 8px',
                                    borderRadius: 12,
                                    backgroundColor: '#FFF8E1',
                                    color: '#F57F17',
                                  }}
                                >
                                  Partial ({item.resultsPublishedCount}/{item.evaluatedCount})
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: '0.74rem',
                                    fontWeight: 600,
                                    padding: '4px 8px',
                                    borderRadius: 12,
                                    backgroundColor: '#FAF9F5',
                                    color: '#707781',
                                    border: '1px solid #E8E5DD',
                                  }}
                                >
                                  Unpublished
                                </span>
                              )}
                            </td>

                            {/* Assignment Status */}
                            <td style={{ padding: '14px 14px' }}>
                              {item.status === 'PUBLISHED' ? (
                                <span
                                  style={{
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    padding: '4px 8px',
                                    borderRadius: 12,
                                    backgroundColor: '#F0F7ED',
                                    color: '#2E7D32',
                                  }}
                                >
                                  Published
                                </span>
                              ) : item.status === 'DRAFT' ? (
                                <span
                                  style={{
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    padding: '4px 8px',
                                    borderRadius: 12,
                                    backgroundColor: '#FAF9F5',
                                    color: '#707781',
                                    border: '1px solid #E8E5DD',
                                  }}
                                >
                                  Draft
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: '0.74rem',
                                    fontWeight: 600,
                                    padding: '4px 8px',
                                    borderRadius: 12,
                                    backgroundColor: '#FFEBEE',
                                    color: '#C62828',
                                  }}
                                >
                                  {item.status}
                                </span>
                              )}
                            </td>

                            {/* Action: View Details */}
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => openAssignmentDetails(item.id)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '6px 12px',
                                  borderRadius: 6,
                                  border: '1px solid #E8E5DD',
                                  backgroundColor: '#FFFFFF',
                                  color: '#20354A',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#20354A';
                                  e.currentTarget.style.color = '#FFFFFF';
                                  e.currentTarget.style.borderColor = '#20354A';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                                  e.currentTarget.style.color = '#20354A';
                                  e.currentTarget.style.borderColor = '#E8E5DD';
                                }}
                              >
                                <Eye size={13} />
                                <span>Details</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  backgroundColor: '#FAF9F5',
                  borderTop: '1px solid #E8E5DD',
                  fontSize: '0.84rem',
                  color: '#707781',
                }}
              >
                <div>
                  Showing{' '}
                  <span style={{ fontWeight: 600, color: '#20354A' }}>
                    {assignments.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                  </span>{' '}
                  to{' '}
                  <span style={{ fontWeight: 600, color: '#20354A' }}>
                    {Math.min(currentPage * pageSize, totalCount)}
                  </span>{' '}
                  of <span style={{ fontWeight: 600, color: '#20354A' }}>{totalCount}</span> assignments
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        border: '1px solid #E8E5DD',
                        backgroundColor: '#FFFFFF',
                        fontSize: '0.82rem',
                        outline: 'none',
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      disabled={currentPage <= 1 || loading}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 30,
                        height: 30,
                        borderRadius: 6,
                        border: '1px solid #E8E5DD',
                        backgroundColor: currentPage <= 1 ? '#F0EDE5' : '#FFFFFF',
                        cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                        color: currentPage <= 1 ? '#9EA5B0' : '#20354A',
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#20354A' }}>
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages || loading}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 30,
                        height: 30,
                        borderRadius: 6,
                        border: '1px solid #E8E5DD',
                        backgroundColor: currentPage >= totalPages ? '#F0EDE5' : '#FFFFFF',
                        cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                        color: currentPage >= totalPages ? '#9EA5B0' : '#20354A',
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===================================================================
            TAB 2: TEACHER-WISE MONITORING VIEW
            =================================================================== */}
        {activeTab === 'teachers' && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid #E8E5DD',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(32,53,74,0.03)',
            }}
          >
            {/* Header & Search */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#20354A', margin: 0 }}>
                  Teacher Assignment Activity Overview
                </h2>
                <p style={{ fontSize: '0.84rem', color: '#707781', margin: '4px 0 0 0' }}>
                  Track assignment creation, submissions received, and evaluation completion by faculty member.
                </p>
              </div>

              <div style={{ position: 'relative', width: 260 }}>
                <Search
                  size={14}
                  color="#9EA5B0"
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  placeholder="Filter teachers by name or ID..."
                  value={teacherSearchTerm}
                  onChange={(e) => setTeacherSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 30px',
                    borderRadius: 8,
                    border: '1px solid #E8E5DD',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Teacher Monitoring Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 900 }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: '#FAF9F5',
                      borderBottom: '1px solid #E8E5DD',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: '#707781',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <th style={{ padding: '14px 16px' }}>Teacher Name</th>
                    <th style={{ padding: '14px 14px' }}>Staff ID / Dept</th>
                    <th style={{ padding: '14px 14px' }}>Classes & Subjects</th>
                    <th style={{ padding: '14px 12px', textAlign: 'center' }}>Assignments Created</th>
                    <th style={{ padding: '14px 12px', textAlign: 'center' }}>Published</th>
                    <th style={{ padding: '14px 12px', textAlign: 'center' }}>Submissions</th>
                    <th style={{ padding: '14px 12px', textAlign: 'center' }}>Pending Evaluations</th>
                    <th style={{ padding: '14px 12px', textAlign: 'center' }}>Results Published</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherLoading ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '48px 20px', textAlign: 'center', color: '#707781' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                          <RotateCw size={24} className="spin-icon" color="#20354A" />
                          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            Loading teacher monitoring data...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : teachersMonitoring.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '48px 20px', textAlign: 'center', color: '#707781' }}>
                        No teacher records found.
                      </td>
                    </tr>
                  ) : (
                    teachersMonitoring.map((tm) => (
                      <tr
                        key={tm.teacherId}
                        style={{
                          borderBottom: '1px solid #F0EDE5',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF9F5')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* Name */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                backgroundColor: '#20354A',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                              }}
                            >
                              {tm.teacherName.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#20354A' }}>
                                {tm.teacherName}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#707781' }}>{tm.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* ID / Dept */}
                        <td style={{ padding: '14px 14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#27313A' }}>
                              {tm.employeeId}
                            </span>
                            <span style={{ fontSize: '0.74rem', color: '#707781' }}>
                              {tm.department || 'Academics'}
                            </span>
                          </div>
                        </td>

                        {/* Classes / Subjects */}
                        <td style={{ padding: '14px 14px', maxWidth: 200 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {tm.classesTaught.slice(0, 3).map((ct, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  backgroundColor: '#FAF9F5',
                                  border: '1px solid #E8E5DD',
                                  color: '#27313A',
                                }}
                              >
                                {ct}
                              </span>
                            ))}
                            {tm.classesTaught.length > 3 && (
                              <span style={{ fontSize: '0.7rem', color: '#707781' }}>
                                +{tm.classesTaught.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Assignments Created */}
                        <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#20354A' }}>
                            {tm.assignmentsCreated}
                          </span>
                        </td>

                        {/* Published */}
                        <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#2E7D32' }}>
                            {tm.publishedAssignments}
                          </span>
                        </td>

                        {/* Submissions */}
                        <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1565C0' }}>
                            {tm.totalSubmissionsReceived}
                          </span>
                        </td>

                        {/* Pending Evaluations */}
                        <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                          <span
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              color: tm.pendingEvaluations > 0 ? '#C62828' : '#2E7D32',
                              backgroundColor: tm.pendingEvaluations > 0 ? '#FFEBEE' : '#F0F7ED',
                              padding: '3px 8px',
                              borderRadius: 10,
                            }}
                          >
                            {tm.pendingEvaluations}
                          </span>
                        </td>

                        {/* Published Results */}
                        <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#00796B' }}>
                            {tm.publishedResults}
                          </span>
                        </td>

                        {/* Action: Filter Assignments */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTeacherId(tm.teacherId);
                              setActiveTab('assignments');
                              setCurrentPage(1);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '5px 10px',
                              borderRadius: 6,
                              border: '1px solid #E8E5DD',
                              backgroundColor: '#FFFFFF',
                              color: '#20354A',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <span>View Assignments</span>
                            <ChevronRight size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================================================================
            MODAL 1: ASSIGNMENT DETAILS & STUDENT SUBMISSION ROSTER
            =================================================================== */}
        {selectedAssignmentId && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(32, 53, 74, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999,
              padding: 20,
              backdropFilter: 'blur(3px)',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                boxShadow: '0 20px 40px rgba(32, 53, 74, 0.18)',
                width: '100%',
                maxWidth: 1080,
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid #E8E5DD',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '20px 24px',
                  backgroundColor: '#FAF9F5',
                  borderBottom: '1px solid #E8E5DD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: '#20354A',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ClipboardList size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#20354A' }}>
                        {assignmentDetails?.assignment.title || 'Assignment Details'}
                      </h2>
                      {assignmentDetails && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 10,
                            backgroundColor:
                              assignmentDetails.assignment.status === 'PUBLISHED' ? '#F0F7ED' : '#FAF9F5',
                            color:
                              assignmentDetails.assignment.status === 'PUBLISHED' ? '#2E7D32' : '#707781',
                            border: '1px solid #E8E5DD',
                          }}
                        >
                          {assignmentDetails.assignment.status}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#707781', marginTop: 2 }}>
                      {assignmentDetails && (
                        <span>
                          {assignmentDetails.assignment.className} - Section {assignmentDetails.assignment.section} •{' '}
                          {assignmentDetails.assignment.subject} • Created by {assignmentDetails.assignment.teacherName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeAssignmentDetails}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    border: '1px solid #E8E5DD',
                    backgroundColor: '#FFFFFF',
                    color: '#707781',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                {detailsLoading ? (
                  <div style={{ padding: '64px 20px', textAlign: 'center', color: '#707781' }}>
                    <RotateCw size={28} className="spin-icon" color="#20354A" style={{ margin: '0 auto 12px' }} />
                    <p style={{ margin: 0, fontSize: '0.92rem' }}>Loading assignment details and student submissions...</p>
                  </div>
                ) : assignmentDetails ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Assignment Information Card */}
                    <div
                      style={{
                        backgroundColor: '#FAF9F5',
                        borderRadius: 12,
                        padding: '18px 20px',
                        border: '1px solid #E8E5DD',
                      }}
                    >
                      <h4
                        style={{
                          margin: '0 0 8px 0',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: '#20354A',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Instructions & Overview
                      </h4>
                      <p
                        style={{
                          margin: '0 0 16px 0',
                          fontSize: '0.9rem',
                          color: '#27313A',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {assignmentDetails.assignment.description}
                      </p>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: 14,
                          paddingTop: 12,
                          borderTop: '1px solid #E8E5DD',
                          fontSize: '0.84rem',
                        }}
                      >
                        <div>
                          <span style={{ color: '#707781' }}>Assigned Date: </span>
                          <span style={{ fontWeight: 600, color: '#20354A' }}>
                            {assignmentDetails.assignment.assignedDate}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#707781' }}>Due Date: </span>
                          <span style={{ fontWeight: 600, color: '#20354A' }}>
                            {assignmentDetails.assignment.dueDate}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#707781' }}>Maximum Marks: </span>
                          <span style={{ fontWeight: 700, color: '#20354A' }}>
                            {assignmentDetails.assignment.maxMarks}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#707781' }}>Academic Year: </span>
                          <span style={{ fontWeight: 600, color: '#20354A' }}>
                            {assignmentDetails.assignment.academicYear}
                          </span>
                        </div>
                      </div>

                      {/* Attachment if present */}
                      {assignmentDetails.assignment.attachmentUrl && (
                        <div
                          style={{
                            marginTop: 14,
                            padding: '10px 14px',
                            borderRadius: 8,
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E8E5DD',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Paperclip size={16} color="#1565C0" />
                            <div>
                              <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#20354A' }}>
                                {assignmentDetails.assignment.attachmentName || 'Assignment Attachment'}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: '#707781' }}>Reference material</div>
                            </div>
                          </div>
                          <a
                            href={assignmentDetails.assignment.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '6px 12px',
                              borderRadius: 6,
                              backgroundColor: '#EEF3F8',
                              color: '#20354A',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            <Download size={13} />
                            <span>Download</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Submission Overview & Progress Bars */}
                    <div>
                      <h4
                        style={{
                          margin: '0 0 12px 0',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#20354A',
                        }}
                      >
                        Submission & Evaluation Progress
                      </h4>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                          gap: 12,
                          marginBottom: 16,
                        }}
                      >
                        <div
                          style={{
                            padding: '12px 14px',
                            borderRadius: 8,
                            backgroundColor: '#FAF9F5',
                            border: '1px solid #E8E5DD',
                          }}
                        >
                          <div style={{ fontSize: '0.74rem', color: '#707781', fontWeight: 600 }}>Enrolled</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#20354A' }}>
                            {assignmentDetails.overview.totalEnrolled}
                          </div>
                        </div>

                        <div
                          style={{
                            padding: '12px 14px',
                            borderRadius: 8,
                            backgroundColor: '#EBF3FB',
                            border: '1px solid #BBDEFB',
                          }}
                        >
                          <div style={{ fontSize: '0.74rem', color: '#1565C0', fontWeight: 600 }}>Submitted</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1565C0' }}>
                            {assignmentDetails.overview.submitted}
                          </div>
                        </div>

                        <div
                          style={{
                            padding: '12px 14px',
                            borderRadius: 8,
                            backgroundColor: '#FFF8E1',
                            border: '1px solid #FFE082',
                          }}
                        >
                          <div style={{ fontSize: '0.74rem', color: '#F57F17', fontWeight: 600 }}>Pending</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#F57F17' }}>
                            {assignmentDetails.overview.pending}
                          </div>
                        </div>

                        <div
                          style={{
                            padding: '12px 14px',
                            borderRadius: 8,
                            backgroundColor: '#F3E5F5',
                            border: '1px solid #E1BEE7',
                          }}
                        >
                          <div style={{ fontSize: '0.74rem', color: '#7B1FA2', fontWeight: 600 }}>Evaluated</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#7B1FA2' }}>
                            {assignmentDetails.overview.evaluated}
                          </div>
                        </div>

                        <div
                          style={{
                            padding: '12px 14px',
                            borderRadius: 8,
                            backgroundColor: '#E0F2F1',
                            border: '1px solid #B2DFDB',
                          }}
                        >
                          <div style={{ fontSize: '0.74rem', color: '#00796B', fontWeight: 600 }}>Published</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00796B' }}>
                            {assignmentDetails.overview.resultsPublished}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bars */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 16,
                          padding: '14px 18px',
                          borderRadius: 8,
                          backgroundColor: '#FAF9F5',
                          border: '1px solid #E8E5DD',
                        }}
                      >
                        {/* Submission Rate */}
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              marginBottom: 6,
                            }}
                          >
                            <span style={{ color: '#20354A' }}>Submission Rate</span>
                            <span style={{ color: '#1565C0' }}>
                              {assignmentDetails.overview.submissionRatePercentage}%
                            </span>
                          </div>
                          <div
                            style={{
                              height: 8,
                              backgroundColor: '#E8E5DD',
                              borderRadius: 4,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${assignmentDetails.overview.submissionRatePercentage}%`,
                                height: '100%',
                                backgroundColor: '#1565C0',
                                borderRadius: 4,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>

                        {/* Evaluation Rate */}
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              marginBottom: 6,
                            }}
                          >
                            <span style={{ color: '#20354A' }}>Evaluation Completion</span>
                            <span style={{ color: '#7B1FA2' }}>
                              {assignmentDetails.overview.evaluationRatePercentage}%
                            </span>
                          </div>
                          <div
                            style={{
                              height: 8,
                              backgroundColor: '#E8E5DD',
                              borderRadius: 4,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${assignmentDetails.overview.evaluationRatePercentage}%`,
                                height: '100%',
                                backgroundColor: '#7B1FA2',
                                borderRadius: 4,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Student Submissions Table */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 12,
                          marginBottom: 12,
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            color: '#20354A',
                          }}
                        >
                          Enrolled Student Submissions ({filteredStudents.length})
                        </h4>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {/* Student Search */}
                          <div style={{ position: 'relative', width: 220 }}>
                            <Search
                              size={13}
                              color="#9EA5B0"
                              style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }}
                            />
                            <input
                              type="text"
                              placeholder="Search student..."
                              value={studentSearchTerm}
                              onChange={(e) => setStudentSearchTerm(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px 6px 26px',
                                borderRadius: 6,
                                border: '1px solid #E8E5DD',
                                fontSize: '0.8rem',
                                boxSizing: 'border-box',
                                outline: 'none',
                              }}
                            />
                          </div>

                          {/* Student Status Filter */}
                          <select
                            value={studentStatusFilter}
                            onChange={(e) => setStudentStatusFilter(e.target.value)}
                            style={{
                              padding: '6px 8px',
                              borderRadius: 6,
                              border: '1px solid #E8E5DD',
                              backgroundColor: '#FFFFFF',
                              fontSize: '0.8rem',
                              outline: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="ALL">All Students</option>
                            <option value="SUBMITTED">Submitted</option>
                            <option value="NOT_SUBMITTED">Pending Submission</option>
                            <option value="GRADED">Graded</option>
                            <option value="PENDING">Pending Evaluation</option>
                          </select>
                        </div>
                      </div>

                      {/* Submissions Roster Table */}
                      <div
                        style={{
                          border: '1px solid #E8E5DD',
                          borderRadius: 8,
                          overflow: 'hidden',
                        }}
                      >
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 780 }}>
                          <thead>
                            <tr
                              style={{
                                backgroundColor: '#FAF9F5',
                                borderBottom: '1px solid #E8E5DD',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                color: '#707781',
                                textTransform: 'uppercase',
                              }}
                            >
                              <th style={{ padding: '10px 14px' }}>Student Name</th>
                              <th style={{ padding: '10px 12px' }}>Admission ID</th>
                              <th style={{ padding: '10px 12px' }}>Submission Date</th>
                              <th style={{ padding: '10px 12px' }}>Submission</th>
                              <th style={{ padding: '10px 12px' }}>Evaluation</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Marks</th>
                              <th style={{ padding: '10px 12px' }}>Published</th>
                              <th style={{ padding: '10px 14px', textAlign: 'center' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredStudents.length === 0 ? (
                              <tr>
                                <td colSpan={8} style={{ padding: '32px 16px', textAlign: 'center', color: '#707781' }}>
                                  No student records match this filter.
                                </td>
                              </tr>
                            ) : (
                              filteredStudents.map((st) => (
                                <tr
                                  key={st.studentId}
                                  style={{
                                    borderBottom: '1px solid #F0EDE5',
                                  }}
                                >
                                  {/* Student Name */}
                                  <td style={{ padding: '12px 14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <div
                                        style={{
                                          width: 26,
                                          height: 26,
                                          borderRadius: '50%',
                                          backgroundColor: '#EEF3F8',
                                          color: '#20354A',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '0.72rem',
                                          fontWeight: 700,
                                        }}
                                      >
                                        {st.studentName.charAt(0)}
                                      </div>
                                      <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#20354A' }}>
                                          {st.studentName}
                                        </div>
                                        {st.rollNumber && (
                                          <div style={{ fontSize: '0.7rem', color: '#707781' }}>
                                            Roll: {st.rollNumber}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Admission ID */}
                                  <td style={{ padding: '12px 12px', fontSize: '0.82rem', color: '#27313A' }}>
                                    {st.admissionId}
                                  </td>

                                  {/* Submission Date */}
                                  <td style={{ padding: '12px 12px', fontSize: '0.82rem', color: '#707781' }}>
                                    {st.submissionDate ? st.submissionDate.slice(0, 10) : '—'}
                                  </td>

                                  {/* Submission Status */}
                                  <td style={{ padding: '12px 12px' }}>
                                    {Boolean(st.submissionId || st.submissionStatus === 'SUBMITTED') ? (
                                      <span
                                        style={{
                                          fontSize: '0.72rem',
                                          fontWeight: 700,
                                          padding: '3px 8px',
                                          borderRadius: 10,
                                          backgroundColor: '#EBF3FB',
                                          color: '#1565C0',
                                        }}
                                      >
                                        Submitted
                                      </span>
                                    ) : (
                                      <span
                                        style={{
                                          fontSize: '0.72rem',
                                          fontWeight: 600,
                                          padding: '3px 8px',
                                          borderRadius: 10,
                                          backgroundColor: '#FAF9F5',
                                          color: '#9EA5B0',
                                          border: '1px solid #E8E5DD',
                                        }}
                                      >
                                        Not Submitted
                                      </span>
                                    )}
                                  </td>

                                  {/* Evaluation Status */}
                                  <td style={{ padding: '12px 12px' }}>
                                    {st.evaluationStatus === 'GRADED' ? (
                                      <span
                                        style={{
                                          fontSize: '0.72rem',
                                          fontWeight: 700,
                                          padding: '3px 8px',
                                          borderRadius: 10,
                                          backgroundColor: '#F3E5F5',
                                          color: '#7B1FA2',
                                        }}
                                      >
                                        Graded
                                      </span>
                                    ) : Boolean(st.submissionId || st.submissionStatus === 'SUBMITTED') ? (
                                      <span
                                        style={{
                                          fontSize: '0.72rem',
                                          fontWeight: 600,
                                          padding: '3px 8px',
                                          borderRadius: 10,
                                          backgroundColor: '#FFF8E1',
                                          color: '#F57F17',
                                        }}
                                      >
                                        Pending Review
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: '0.8rem', color: '#9EA5B0' }}>—</span>
                                    )}
                                  </td>

                                  {/* Marks */}
                                  <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                                    {st.evaluationStatus === 'GRADED' && st.marksObtained !== null && st.marksObtained !== undefined ? (
                                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#20354A' }}>
                                        {st.marksObtained}{' '}
                                        <span style={{ fontSize: '0.72rem', color: '#707781', fontWeight: 400 }}>
                                          / {st.maxMarks}
                                        </span>
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: '0.8rem', color: '#9EA5B0' }}>—</span>
                                    )}
                                  </td>

                                  {/* Published Status */}
                                  <td style={{ padding: '12px 12px' }}>
                                    {st.evaluationStatus === 'GRADED' && st.resultPublicationStatus === 'PUBLISHED' ? (
                                      <span
                                        style={{
                                          fontSize: '0.72rem',
                                          fontWeight: 700,
                                          padding: '3px 8px',
                                          borderRadius: 10,
                                          backgroundColor: '#E0F2F1',
                                          color: '#00796B',
                                        }}
                                      >
                                        Published
                                      </span>
                                    ) : st.evaluationStatus === 'GRADED' ? (
                                      <span
                                        style={{
                                          fontSize: '0.72rem',
                                          fontWeight: 600,
                                          padding: '3px 8px',
                                          borderRadius: 10,
                                          backgroundColor: '#FAF9F5',
                                          color: '#707781',
                                          border: '1px solid #E8E5DD',
                                        }}
                                      >
                                        Unpublished
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: '0.8rem', color: '#9EA5B0' }}>—</span>
                                    )}
                                  </td>

                                  {/* Actions */}
                                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                      {st.submissionId && (
                                        <button
                                          type="button"
                                          onClick={() => setViewSubmissionStudent(st)}
                                          title="View student written submission"
                                          style={{
                                            padding: '4px 8px',
                                            borderRadius: 6,
                                            border: '1px solid #E8E5DD',
                                            backgroundColor: '#FFFFFF',
                                            color: '#1565C0',
                                            fontSize: '0.74rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                          }}
                                        >
                                          Submission
                                        </button>
                                      )}
                                      {st.evaluationStatus === 'GRADED' && (
                                        <button
                                          type="button"
                                          onClick={() => setViewFeedbackStudent(st)}
                                          title="View teacher evaluated marks and feedback"
                                          style={{
                                            padding: '4px 8px',
                                            borderRadius: 6,
                                            border: '1px solid #E8E5DD',
                                            backgroundColor: '#FFFFFF',
                                            color: '#7B1FA2',
                                            fontSize: '0.74rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                          }}
                                        >
                                          Feedback
                                        </button>
                                      )}
                                      {!st.submissionId && (
                                        <span style={{ fontSize: '0.74rem', color: '#9EA5B0' }}>None</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#707781' }}>
                    Assignment details not available.
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '16px 24px',
                  backgroundColor: '#FAF9F5',
                  borderTop: '1px solid #E8E5DD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: '#707781' }}>
                  Management Monitoring Mode • Read-only inspection of teacher assignments and student submissions.
                </div>
                <button
                  type="button"
                  onClick={closeAssignmentDetails}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 8,
                    border: '1px solid #E8E5DD',
                    backgroundColor: '#FFFFFF',
                    color: '#20354A',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            MODAL 2: VIEW STUDENT SUBMISSION CONTENT
            =================================================================== */}
        {viewSubmissionStudent && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(32, 53, 74, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1050,
              padding: 20,
              backdropFilter: 'blur(3px)',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                boxShadow: '0 24px 48px rgba(32, 53, 74, 0.22)',
                width: '100%',
                maxWidth: 680,
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid #E8E5DD',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '18px 22px',
                  backgroundColor: '#FAF9F5',
                  borderBottom: '1px solid #E8E5DD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#20354A' }}>
                    Student Submission: {viewSubmissionStudent.studentName}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#707781', marginTop: 3 }}>
                    Admission ID: {viewSubmissionStudent.admissionId} • Submitted on{' '}
                    {viewSubmissionStudent.submissionDate
                      ? new Date(viewSubmissionStudent.submissionDate).toLocaleString()
                      : 'N/A'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewSubmissionStudent(null)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: '1px solid #E8E5DD',
                    backgroundColor: '#FFFFFF',
                    color: '#707781',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '22px', overflowY: 'auto', flex: 1 }}>
                {/* Submission Meta Flags */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 12,
                      backgroundColor: viewSubmissionStudent.isLate ? '#FFF8E1' : '#F0F7ED',
                      color: viewSubmissionStudent.isLate ? '#F57F17' : '#2E7D32',
                    }}
                  >
                    {viewSubmissionStudent.isLate ? 'Late Submission' : 'On-Time Submission'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 12,
                      backgroundColor: '#FAF9F5',
                      color: '#707781',
                      border: '1px solid #E8E5DD',
                    }}
                  >
                    Version {viewSubmissionStudent.version || 1}
                  </span>
                </div>

                {/* Written Answer Text */}
                <div style={{ marginBottom: 20 }}>
                  <h5
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#20354A',
                      textTransform: 'uppercase',
                    }}
                  >
                    Written Answer:
                  </h5>
                  <div
                    style={{
                      backgroundColor: '#FAF9F5',
                      padding: '16px',
                      borderRadius: 8,
                      border: '1px solid #E8E5DD',
                      fontSize: '0.9rem',
                      color: '#27313A',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      maxHeight: 280,
                      overflowY: 'auto',
                    }}
                  >
                    {viewSubmissionStudent.answerText || 'No written answer provided.'}
                  </div>
                </div>

                {/* Student Attachment */}
                {viewSubmissionStudent.attachmentUrl && (
                  <div>
                    <h5
                      style={{
                        margin: '0 0 8px 0',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#20354A',
                        textTransform: 'uppercase',
                      }}
                    >
                      Attached Document:
                    </h5>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: 8,
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E8E5DD',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText size={18} color="#1565C0" />
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#20354A' }}>
                            {viewSubmissionStudent.attachmentName || 'Submission Attachment'}
                          </div>
                          {viewSubmissionStudent.attachmentSize ? (
                            <div style={{ fontSize: '0.72rem', color: '#707781' }}>
                              {(viewSubmissionStudent.attachmentSize / 1024).toFixed(1)} KB
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <a
                        href={viewSubmissionStudent.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 6,
                          backgroundColor: '#EEF3F8',
                          color: '#20354A',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLink size={13} />
                        <span>Open Document</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '14px 22px',
                  backgroundColor: '#FAF9F5',
                  borderTop: '1px solid #E8E5DD',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewSubmissionStudent(null)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 6,
                    border: '1px solid #E8E5DD',
                    backgroundColor: '#FFFFFF',
                    color: '#20354A',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            MODAL 3: VIEW EVALUATION MARKS & FEEDBACK
            =================================================================== */}
        {viewFeedbackStudent && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(32, 53, 74, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1050,
              padding: 20,
              backdropFilter: 'blur(3px)',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                boxShadow: '0 24px 48px rgba(32, 53, 74, 0.22)',
                width: '100%',
                maxWidth: 620,
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid #E8E5DD',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '18px 22px',
                  backgroundColor: '#FAF9F5',
                  borderBottom: '1px solid #E8E5DD',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      backgroundColor: '#F3E5F5',
                      color: '#7B1FA2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Award size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#20354A' }}>
                      Teacher Evaluation & Marks
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: '#707781', marginTop: 2 }}>
                      Student: {viewFeedbackStudent.studentName} ({viewFeedbackStudent.admissionId})
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewFeedbackStudent(null)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: '1px solid #E8E5DD',
                    backgroundColor: '#FFFFFF',
                    color: '#707781',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '22px', overflowY: 'auto', flex: 1 }}>
                {/* Score Card */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: 10,
                    backgroundColor: '#FAF9F5',
                    border: '1px solid #E8E5DD',
                    marginBottom: 20,
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#707781', fontWeight: 600, textTransform: 'uppercase' }}>
                      Marks Awarded
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#20354A', marginTop: 2 }}>
                      {viewFeedbackStudent.marksObtained ?? '—'}{' '}
                      <span style={{ fontSize: '1rem', fontWeight: 400, color: '#707781' }}>
                        / {viewFeedbackStudent.maxMarks}
                      </span>
                    </div>
                  </div>

                  <div>
                    {viewFeedbackStudent.resultPublicationStatus === 'PUBLISHED' ? (
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          padding: '6px 12px',
                          borderRadius: 14,
                          backgroundColor: '#E0F2F1',
                          color: '#00796B',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Check size={14} /> Result Published
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          padding: '6px 12px',
                          borderRadius: 14,
                          backgroundColor: '#FFF8E1',
                          color: '#F57F17',
                        }}
                      >
                        Draft Marks (Unpublished)
                      </span>
                    )}
                  </div>
                </div>

                {/* Teacher Feedback Note */}
                <div style={{ marginBottom: 20 }}>
                  <h5
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#20354A',
                      textTransform: 'uppercase',
                    }}
                  >
                    Teacher Feedback & Remarks:
                  </h5>
                  <div
                    style={{
                      backgroundColor: '#FAF9F5',
                      padding: '16px',
                      borderRadius: 8,
                      border: '1px solid #E8E5DD',
                      fontSize: '0.9rem',
                      color: '#27313A',
                      lineHeight: 1.6,
                      fontStyle: viewFeedbackStudent.feedback ? 'normal' : 'italic',
                    }}
                  >
                    {viewFeedbackStudent.feedback || 'No written feedback provided by the teacher.'}
                  </div>
                </div>

                {/* Grading History if multiple revisions exist */}
                {viewFeedbackStudent.gradingHistory && viewFeedbackStudent.gradingHistory.length > 0 && (
                  <div>
                    <h5
                      style={{
                        margin: '0 0 8px 0',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#20354A',
                        textTransform: 'uppercase',
                      }}
                    >
                      Evaluation Log:
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {viewFeedbackStudent.gradingHistory.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E8E5DD',
                            fontSize: '0.8rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: '#707781',
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 600, color: '#20354A' }}>
                              Score: {item.marksObtained}/{item.maxMarks}
                            </span>
                            {item.feedback && <span> — "{item.feedback}"</span>}
                          </div>
                          <span>
                            {item.gradedAt ? new Date(item.gradedAt).toLocaleDateString() : ''} ({item.action})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '14px 22px',
                  backgroundColor: '#FAF9F5',
                  borderTop: '1px solid #E8E5DD',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewFeedbackStudent(null)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 6,
                    border: '1px solid #E8E5DD',
                    backgroundColor: '#FFFFFF',
                    color: '#20354A',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
