import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  GraduationCap,
  Calendar,
  Search,
  RotateCw,
  AlertCircle,
  X,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  School,
} from 'lucide-react';
import { TeacherLayout } from '../../components/teacher/TeacherLayout';
import { teacherApi } from '../../api/teacherApi';
import type { TeacherClassItem, TeacherStudentItem } from '../../types/teacher.types';

export const TeacherStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<TeacherStudentItem[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<TeacherClassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Fetch initial assigned classes and students
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assigned classes to build dropdown filters and summary cards
      const [classesRes, studentsRes] = await Promise.all([
        teacherApi.getMyClasses().catch(() => ({ success: true, data: [] })),
        teacherApi.getMyStudents({
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          className: selectedClass !== 'ALL' ? selectedClass : undefined,
          section: selectedSection !== 'ALL' ? selectedSection : undefined,
          search: searchTerm.trim() || undefined,
        }),
      ]);

      if (classesRes.data) {
        setAssignedClasses(classesRes.data);
      }

      if (studentsRes.success && studentsRes.data) {
        setStudents(studentsRes.data);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Failed to load student roster. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedClass, selectedSection, selectedStatus]);

  // Handle live search refetch with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchData();
      setCurrentPage(1);
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Unique class and section options from teacher's assigned classes
  const uniqueClassNames = useMemo(() => {
    const set = new Set<string>();
    assignedClasses.forEach((c) => {
      if (c.className) set.add(c.className);
    });
    return Array.from(set).sort();
  }, [assignedClasses]);

  const uniqueSections = useMemo(() => {
    const set = new Set<string>();
    assignedClasses.forEach((c) => {
      if (selectedClass === 'ALL' || c.className === selectedClass) {
        if (c.section) set.add(c.section);
      }
    });
    return Array.from(set).sort();
  }, [assignedClasses, selectedClass]);

  // Client-side pagination slices
  const totalStudents = students.length;
  const totalPages = Math.ceil(totalStudents / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return students.slice(startIndex, startIndex + pageSize);
  }, [students, currentPage, pageSize]);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedClass !== 'ALL' ||
    selectedSection !== 'ALL' ||
    selectedStatus !== 'ALL';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedClass('ALL');
    setSelectedSection('ALL');
    setSelectedStatus('ALL');
    setCurrentPage(1);
  };

  // Helper avatar generator
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
      <div className="teacher-students-page-container" style={{ padding: '4px 0 32px' }}>
        {/* 1. Page Header */}
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
                Classroom Roster
              </span>
            </div>
            <h1 className="teacher-welcome-heading" style={{ margin: '0 0 6px' }}>
              My Students
            </h1>
            <p className="teacher-welcome-subtitle" style={{ margin: 0 }}>
              <span>
                Directory of officially enrolled students across your assigned classes and sections
              </span>
            </p>
          </div>

          <div className="teacher-welcome-actions">
            <button
              type="button"
              className="teacher-btn-refresh"
              onClick={fetchData}
              disabled={loading}
              title="Refresh students list"
            >
              <RotateCw size={14} className={loading ? 'teacher-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </section>

        {/* 2. Real Metrics / Summary Cards */}
        <div
          className="teacher-summary-cards-row"
          style={{ marginBottom: '24px' }}
          aria-label="My Students Summary"
        >
          {/* Card 1: Total Enrolled Students */}
          <div className="teacher-summary-card">
            <div className="teacher-card-top-row">
              <span className="teacher-card-label">Total Students</span>
              <div className="teacher-card-icon-wrap icon-sage">
                <Users size={17} />
              </div>
            </div>
            <div className="teacher-card-value-row">
              <div className="teacher-card-value">{totalStudents}</div>
              <span className="teacher-card-indicator indicator-sage">Enrolled</span>
            </div>
            <div className="teacher-card-subtext">Active records in your assigned sections</div>
          </div>

          {/* Card 2: Assigned Classes */}
          <div className="teacher-summary-card">
            <div className="teacher-card-top-row">
              <span className="teacher-card-label">Assigned Classes</span>
              <div className="teacher-card-icon-wrap">
                <GraduationCap size={17} />
              </div>
            </div>
            <div className="teacher-card-value-row">
              <div className="teacher-card-value">{uniqueClassNames.length}</div>
              <span className="teacher-card-indicator">Active</span>
            </div>
            <div className="teacher-card-subtext">Distinct grades &amp; courses taught</div>
          </div>

          {/* Card 3: Assigned Sections */}
          <div className="teacher-summary-card">
            <div className="teacher-card-top-row">
              <span className="teacher-card-label">Assigned Sections</span>
              <div className="teacher-card-icon-wrap icon-blue">
                <School size={17} />
              </div>
            </div>
            <div className="teacher-card-value-row">
              <div className="teacher-card-value">{assignedClasses.length}</div>
              <span className="teacher-card-indicator">Roster</span>
            </div>
            <div className="teacher-card-subtext">Total section allotments on your schedule</div>
          </div>

          {/* Card 4: Academic Session */}
          <div className="teacher-summary-card">
            <div className="teacher-card-top-row">
              <span className="teacher-card-label">Academic Session</span>
              <div className="teacher-card-icon-wrap icon-coral">
                <Calendar size={17} />
              </div>
            </div>
            <div className="teacher-card-value-row">
              <div className="teacher-card-value" style={{ fontSize: '1.25rem' }}>
                {assignedClasses[0]?.academicYear || students[0]?.academicYear || '2026-2027'}
              </div>
              <span className="teacher-card-indicator">Current</span>
            </div>
            <div className="teacher-card-subtext">Authorized academic session</div>
          </div>
        </div>

        {/* 3. Search and Filters Bar */}
        <div className="teacher-students-toolbar">
          {/* Search box */}
          <div className="teacher-students-search-wrap">
            <Search size={15} className="teacher-students-search-icon" />
            <input
              type="text"
              className="teacher-students-search-input"
              placeholder="Search by student name, roll no, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#8A94A0',
                  padding: 2,
                }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div className="teacher-students-filters-group">
            {/* Class filter */}
            <select
              className="teacher-students-select"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection('ALL');
                setCurrentPage(1);
              }}
              aria-label="Filter by Class"
            >
              <option value="ALL">All Classes ({uniqueClassNames.length})</option>
              {uniqueClassNames.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Section filter */}
            <select
              className="teacher-students-select"
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Section"
            >
              <option value="ALL">All Sections</option>
              {uniqueSections.map((sec) => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              className="teacher-students-select"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Status"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="GRADUATED">Graduated</option>
            </select>

            {/* Reset Filters button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="teacher-pagination-btn"
                style={{ color: '#D9534F' }}
                title="Clear all filters"
              >
                <X size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. Error Alert */}
        {error && (
          <div
            style={{
              backgroundColor: '#FDF2F2',
              border: '1px solid #F8D7DA',
              borderRadius: '8px',
              padding: '14px 18px',
              color: '#B91C1C',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: '0.85rem' }}>{error}</div>
            <button
              type="button"
              onClick={fetchData}
              className="teacher-btn-refresh"
              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* 5. Main Content: Table / Skeletons / Empty State */}
        <div className="teacher-students-table-card">
          {loading && students.length === 0 ? (
            /* Loading Skeleton */
            <div style={{ padding: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    style={{
                      height: '48px',
                      backgroundColor: '#F5F5F0',
                      borderRadius: '6px',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }}
                  />
                ))}
              </div>
            </div>
          ) : students.length === 0 ? (
            /* Empty State */
            <div
              style={{
                padding: '60px 24px',
                textAlign: 'center',
                color: '#647F99',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#EEF3F8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  color: '#20354A',
                }}
              >
                <Users size={30} />
              </div>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#20354A',
                  margin: '0 0 6px',
                }}
              >
                {hasActiveFilters ? 'No Matching Students' : 'No Students Found'}
              </h3>
              <p
                style={{
                  fontSize: '0.86rem',
                  color: '#647F99',
                  maxWidth: '420px',
                  margin: '0 auto 16px',
                  lineHeight: 1.5,
                }}
              >
                {hasActiveFilters
                  ? 'No students matched your search criteria or filter options. Try adjusting or clearing your filters.'
                  : assignedClasses.length === 0
                  ? 'You currently have no active classes or sections assigned. Once administrators assign classes to your profile, your student roster will appear here.'
                  : 'There are currently no officially enrolled students in your assigned classes or sections.'}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="teacher-btn-refresh"
                  style={{ display: 'inline-flex', margin: '0 auto' }}
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            /* Student Records Table */
            <div className="teacher-students-table-wrap">
              <table className="teacher-students-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Admission / Student ID</th>
                    <th>Roll No</th>
                    <th>Class &amp; Section</th>
                    <th>Academic Year</th>
                    <th>Parent / Guardian</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.map((student) => {
                    const isActive = student.status === 'ACTIVE';
                    return (
                      <tr key={student.id}>
                        {/* 1. Name & Avatar */}
                        <td>
                          <div className="teacher-student-name-cell">
                            <div className="teacher-student-avatar">
                              {getInitials(student.fullName)}
                            </div>
                            <span className="teacher-student-name-text">
                              {student.fullName}
                            </span>
                          </div>
                        </td>

                        {/* 2. Admission ID */}
                        <td>
                          <span className="teacher-student-id-badge">
                            {student.studentId}
                          </span>
                        </td>

                        {/* 3. Roll Number */}
                        <td>
                          <span className="teacher-student-roll-pill">
                            {student.rollNumber || '—'}
                          </span>
                        </td>

                        {/* 4. Class & Section */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: '#20354A' }}>
                              {student.grade}
                            </span>
                            <span className="teacher-section-badge">
                              Sec {student.section}
                            </span>
                          </div>
                        </td>

                        {/* 5. Academic Year */}
                        <td>
                          <span style={{ color: '#5A6872', fontSize: '0.82rem' }}>
                            {student.academicYear || '2026-2027'}
                          </span>
                        </td>

                        {/* 6. Parent / Guardian Contact Details */}
                        <td>
                          {student.parentName || student.parentPhone || student.parentEmail ? (
                            <div className="teacher-student-parent-cell">
                              {student.parentName && (
                                <span className="teacher-student-parent-name">
                                  {student.parentName}
                                </span>
                              )}
                              {student.parentPhone && (
                                <span className="teacher-student-parent-contact">
                                  <Phone size={11} />
                                  <span>{student.parentPhone}</span>
                                </span>
                              )}
                              {student.parentEmail && (
                                <span className="teacher-student-parent-contact">
                                  <Mail size={11} />
                                  <span>{student.parentEmail}</span>
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#A0ABBA', fontStyle: 'italic', fontSize: '0.78rem' }}>
                              Not specified
                            </span>
                          )}
                        </td>

                        {/* 7. Status */}
                        <td>
                          <span
                            className={
                              isActive
                                ? 'teacher-status-badge-active'
                                : 'teacher-status-badge-inactive'
                            }
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: isActive ? '#16A34A' : '#94A3B8',
                              }}
                            />
                            <span>{student.status}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* 6. Pagination Controls */}
              {totalPages > 1 && (
                <div className="teacher-students-pagination">
                  <div>
                    Showing{' '}
                    <strong style={{ color: '#20354A' }}>
                      {(currentPage - 1) * pageSize + 1}
                    </strong>{' '}
                    to{' '}
                    <strong style={{ color: '#20354A' }}>
                      {Math.min(currentPage * pageSize, totalStudents)}
                    </strong>{' '}
                    of <strong style={{ color: '#20354A' }}>{totalStudents}</strong> students
                  </div>

                  <div className="teacher-pagination-controls">
                    <button
                      type="button"
                      className="teacher-pagination-btn"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      title="Previous Page"
                    >
                      <ChevronLeft size={14} />
                      <span>Previous</span>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        className={`teacher-pagination-btn ${
                          currentPage === pageNum ? 'active' : ''
                        }`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="teacher-pagination-btn"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      title="Next Page"
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
};
