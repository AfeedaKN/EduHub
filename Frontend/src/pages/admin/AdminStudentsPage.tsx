import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Search,
  RotateCw,
  Eye,
  Edit2,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  UserCheck,
  X,
  Phone,
  Mail,
  BookOpen,
  School,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/adminApi';
import {
  StudentDirectoryItem,
  StudentSummaryStats,
  StudentDetail,
  UpdateStudentPayload,
  ParentDetail,
} from '../../types/admin.types';

const CLASS_OPTIONS = [
  'All Grades',
  'Pre-KG',
  'LKG',
  'UKG',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
];

const ACADEMIC_YEARS = ['ALL', '2026-2027', '2025-2026', '2024-2025'];

const SECTIONS_FOR_CLASS: Record<string, string[]> = {
  'Grade 1': ['A', 'B'],
  'Grade 2': ['A', 'B'],
  'Grade 3': ['A', 'B'],
  'Grade 4': ['A', 'B'],
  'Grade 5': ['A', 'B'],
  'Grade 6': ['A', 'B', 'C'],
  'Grade 7': ['A', 'B'],
  'Grade 8': ['A', 'B'],
  'Grade 9': ['A', 'B'],
  'Grade 10': ['A', 'B'],
  'Grade 11': ['A', 'B'],
  'Grade 12': ['A', 'B'],
};

export const AdminStudentsPage: React.FC = () => {
  const navigate = useNavigate();

  // Data states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentDirectoryItem[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit] = useState<number>(10);

  // Summary stats
  const [summary, setSummary] = useState<StudentSummaryStats>({
    totalStudents: 0,
    activeStudents: 0,
    pendingAdmissions: 0,
    classesWithStudents: 0,
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('All Grades');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal states
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentDetail | null>(null);
  const [editSection, setEditSection] = useState<string>('A');
  const [editRollNumber, setEditRollNumber] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE' | 'GRADUATED'>('ACTIVE');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Parent profile view modal (when clicking View Parent)
  const [viewingParent, setViewingParent] = useState<ParentDetail | null>(null);

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch summary counts once
  const fetchSummary = async () => {
    try {
      const res = await adminApi.getStudentSummaryStats();
      if (res.data) {
        setSummary(res.data);
      }
    } catch {
      // Non-fatal, summary can default
    }
  };

  // Fetch students list
  const fetchStudents = async (currentPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const gradeQuery = selectedGrade === 'All Grades' ? undefined : selectedGrade;
      const res = await adminApi.getStudents({
        search: searchTerm.trim() || undefined,
        academicYear: selectedYear === 'ALL' ? undefined : selectedYear,
        grade: gradeQuery,
        section: selectedSection === 'ALL' ? undefined : selectedSection,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        page: currentPage,
        limit,
      });

      if (res.data) {
        setStudents(res.data.students || []);
        setTotalStudents(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        setPage(res.data.page || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load students directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Trigger search on debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchStudents(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, selectedYear, selectedGrade, selectedSection, selectedStatus]);

  // Dependent section options based on grade
  const availableSections = useMemo(() => {
    if (selectedGrade === 'All Grades') return ['A', 'B', 'C', 'D'];
    return SECTIONS_FOR_CLASS[selectedGrade] || ['A', 'B'];
  }, [selectedGrade]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedYear('ALL');
    setSelectedGrade('All Grades');
    setSelectedSection('ALL');
    setSelectedStatus('ALL');
  };

  // Open Student Detail Profile Modal
  const handleOpenStudentProfile = async (studentId: string) => {
    try {
      const res = await adminApi.getStudentById(studentId);
      if (res.data) {
        setSelectedStudent(res.data);
      }
    } catch {
      // Fallback to item in array if detail fails
      const fallback = students.find((s) => s.id === studentId);
      if (fallback) setSelectedStudent(fallback as StudentDetail);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (student: StudentDetail | StudentDirectoryItem) => {
    setEditingStudent(student as StudentDetail);
    setEditSection(student.section || 'A');
    setEditRollNumber(student.rollNumber || '');
    setEditStatus(student.status || 'ACTIVE');
    setSaveError(null);
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const payload: UpdateStudentPayload = {
        section: editSection,
        rollNumber: editRollNumber.trim() || undefined,
        status: editStatus,
      };

      const res = await adminApi.updateStudent(editingStudent.id, payload);
      setToastMessage(res.message || 'Student record updated successfully.');
      setEditingStudent(null);
      if (selectedStudent && selectedStudent.id === editingStudent.id) {
        setSelectedStudent(res.data);
      }
      fetchStudents(page);
      fetchSummary();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update student.');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Parent Details modal from student profile or row
  const handleViewParent = async (parentId?: string) => {
    if (!parentId) return;
    try {
      const res = await adminApi.getParentById(parentId);
      if (res.data) {
        setViewingParent(res.data);
      }
    } catch {
      // Failed to load parent
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <AdminLayout breadcrumbTitle="Students">
      {/* Page Header */}
      <div className="admin-admissions-page-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="admin-admissions-page-title" style={{ margin: 0 }}>
                Students
              </h1>
              <span
                style={{
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  border: '1px solid #BFDBFE',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {summary.totalStudents} Enrolled
              </span>
            </div>
            <p className="admin-admissions-page-subtitle" style={{ marginTop: '4px' }}>
              Manage student records, enrollment details and family connections.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => {
                fetchSummary();
                fetchStudents(page);
              }}
              title="Refresh Directory"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              className="admin-btn-primary-action"
              onClick={() => navigate('/admin/admissions')}
              title="Official student enrollment occurs through verified Admissions"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <GraduationCap size={16} />
              <span>Admissions Workflow</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {toastMessage && (
        <div
          style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#166534',
            fontSize: '0.86rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 1. Summary Cards Grid */}
      <section className="admin-classes-summary-grid" aria-label="Student Directory Summary Metrics">
        {/* Card 1: Total Students */}
        <div className="admin-classes-card-stat">
          <div>
            <div className="admin-card-stat-label">Total Students</div>
            <div className="admin-card-stat-value">{summary.totalStudents}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
              Officially enrolled
            </div>
          </div>
          <div className="admin-card-stat-icon-wrap admin-stat-icon-blue">
            <Users size={20} />
          </div>
        </div>

        {/* Card 2: Active Students */}
        <div className="admin-classes-card-stat">
          <div>
            <div className="admin-card-stat-label">Active Students</div>
            <div className="admin-card-stat-value">{summary.activeStudents}</div>
            <div style={{ fontSize: '0.74rem', color: '#16A34A', marginTop: '4px', fontWeight: 600 }}>
              Regular attendance
            </div>
          </div>
          <div className="admin-card-stat-icon-wrap admin-stat-icon-sage">
            <UserCheck size={20} />
          </div>
        </div>

        {/* Card 3: Pending Admissions (strictly separated from enrolled students) */}
        <div
          className="admin-classes-card-stat clickable"
          onClick={() => navigate('/admin/admissions')}
          style={{ cursor: 'pointer' }}
          title="Click to review pending admissions requests"
        >
          <div>
            <div className="admin-card-stat-label">Pending Admissions</div>
            <div className="admin-card-stat-value">{summary.pendingAdmissions}</div>
            <div style={{ fontSize: '0.74rem', color: '#D97706', marginTop: '4px', fontWeight: 600 }}>
              Awaiting review in Admissions →
            </div>
          </div>
          <div className="admin-card-stat-icon-wrap admin-stat-icon-amber">
            <Clock size={20} />
          </div>
        </div>

        {/* Card 4: Classes with Enrolled Students */}
        <div className="admin-classes-card-stat">
          <div>
            <div className="admin-card-stat-label">Active Classes</div>
            <div className="admin-card-stat-value">{summary.classesWithStudents}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
              Grades with students
            </div>
          </div>
          <div className="admin-card-stat-icon-wrap admin-stat-icon-purple">
            <Layers size={20} />
          </div>
        </div>
      </section>

      {/* 2. Filter & Search Toolbar */}
      <div className="admin-admissions-filter-toolbar">
        <div className="admin-search-input-wrap">
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by student name, admission ID, or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="admin-filter-controls-right">
          {/* Academic Year */}
          <select
            className="admin-filter-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="ALL">All Academic Years</option>
            {ACADEMIC_YEARS.filter((y) => y !== 'ALL').map((year) => (
              <option key={year} value={year}>
                AY {year}
              </option>
            ))}
          </select>

          {/* Class / Grade Filter */}
          <select
            className="admin-filter-select"
            value={selectedGrade}
            onChange={(e) => {
              setSelectedGrade(e.target.value);
              setSelectedSection('ALL');
            }}
          >
            {CLASS_OPTIONS.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>

          {/* Section Filter (dependent on selected class) */}
          <select
            className="admin-filter-select"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            <option value="ALL">All Sections</option>
            {availableSections.map((sec) => (
              <option key={sec} value={sec}>
                Section {sec}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="admin-filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="GRADUATED">Graduated</option>
          </select>

          {/* Reset Filters */}
          {(searchTerm ||
            selectedYear !== 'ALL' ||
            selectedGrade !== 'All Grades' ||
            selectedSection !== 'ALL' ||
            selectedStatus !== 'ALL') && (
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={handleResetFilters}
              style={{ fontSize: '0.8rem', padding: '7px 12px' }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Students Directory Table Card */}
      <div className="admin-admissions-table-card">
        {loading && students.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
            <RotateCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading officially enrolled students...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: '#DC2626' }}>
            <AlertCircle size={28} style={{ margin: '0 auto 8px auto' }} />
            <p style={{ fontWeight: 600, margin: '0 0 8px 0' }}>{error}</p>
            <button type="button" className="admin-btn-secondary" onClick={() => fetchStudents(page)}>
              Try Again
            </button>
          </div>
        ) : students.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <GraduationCap size={40} style={{ color: 'var(--admin-text-subtle)', margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', color: 'var(--admin-primary)', fontSize: '1.05rem' }}>
              No students found
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: 'var(--admin-text-muted)', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
              {searchTerm || selectedGrade !== 'All Grades' || selectedSection !== 'ALL' || selectedStatus !== 'ALL'
                ? 'No student records match the active search and filter criteria.'
                : 'There are currently no officially enrolled students in the database. New students appear here automatically when admissions are approved.'}
            </p>
            {searchTerm || selectedGrade !== 'All Grades' || selectedSection !== 'ALL' || selectedStatus !== 'ALL' ? (
              <button type="button" className="admin-btn-secondary" onClick={handleResetFilters}>
                Clear Active Filters
              </button>
            ) : (
              <button
                type="button"
                className="admin-btn-primary-action"
                onClick={() => navigate('/admin/admissions')}
              >
                Go to Admissions Workflow
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="admin-admissions-table-wrap-desktop">
              <table className="admin-admissions-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Admission ID</th>
                    <th>Class / Section</th>
                    <th>Academic Year</th>
                    <th>Parent / Guardian</th>
                    <th>Contact</th>
                    <th>Enrollment Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      {/* Student Column */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: '#EFF6FF',
                              color: '#2563EB',
                              border: '1px solid #BFDBFE',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(student.fullName)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--admin-primary)', fontSize: '0.88rem' }}>
                              {student.fullName}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                              Roll: {student.rollNumber || 'Not Assigned'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Admission ID */}
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            backgroundColor: 'var(--admin-bg-subtle)',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--admin-border)',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: 'var(--admin-primary)',
                          }}
                        >
                          {student.studentId}
                        </span>
                      </td>

                      {/* Class / Section */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--admin-primary)', fontSize: '0.84rem' }}>
                          {student.grade}
                        </div>
                        <span
                          className="admin-section-pill"
                          style={{ marginTop: '3px', display: 'inline-block' }}
                        >
                          Section {student.section}
                        </span>
                      </td>

                      {/* Academic Year */}
                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-main)' }}>
                          {student.academicYear}
                        </span>
                      </td>

                      {/* Parent / Guardian */}
                      <td>
                        {student.parent ? (
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--admin-primary)', fontSize: '0.84rem' }}>
                              {student.parent.fullName}
                            </div>
                            {student.parent.relationship && (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  color: 'var(--admin-muted-blue)',
                                  backgroundColor: '#F0F4F8',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  display: 'inline-block',
                                  marginTop: '2px',
                                }}
                              >
                                {student.parent.relationship}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>
                            No guardian linked
                          </span>
                        )}
                      </td>

                      {/* Contact */}
                      <td>
                        {student.parent ? (
                          <div style={{ fontSize: '0.76rem', color: 'var(--admin-text-muted)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Mail size={12} style={{ color: 'var(--admin-muted-blue)' }} />
                              <span>{student.parent.email}</span>
                            </div>
                            {student.parent.phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                                <Phone size={12} style={{ color: 'var(--admin-muted-blue)' }} />
                                <span>{student.parent.phone}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--admin-text-subtle)' }}>—</span>
                        )}
                      </td>

                      {/* Enrollment Status */}
                      <td>
                        <span
                          className={`admin-badge-status ${
                            student.status === 'ACTIVE'
                              ? 'admin-badge-status-active'
                              : 'admin-badge-status-inactive'
                          }`}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: student.status === 'ACTIVE' ? '#16A34A' : '#64748B',
                            }}
                          />
                          {student.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="admin-btn-secondary"
                            onClick={() => handleOpenStudentProfile(student.id)}
                            title="View Student Profile"
                            style={{ padding: '6px 10px', fontSize: '0.76rem' }}
                          >
                            <Eye size={13} style={{ marginRight: '4px' }} />
                            <span>Profile</span>
                          </button>

                          <button
                            type="button"
                            className="admin-btn-secondary"
                            onClick={() => handleOpenEdit(student)}
                            title="Edit Student Details"
                            style={{ padding: '6px 8px' }}
                          >
                            <Edit2 size={13} />
                          </button>

                          {student.parent && (
                            <button
                              type="button"
                              className="admin-btn-secondary"
                              onClick={() => handleViewParent(student.parent?.id)}
                              title="View Parent Profile"
                              style={{ padding: '6px 8px' }}
                            >
                              <Users size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="admin-admissions-cards-mobile">
              {students.map((student) => (
                <div key={student.id} className="admin-admission-card-mobile">
                  <div className="admin-card-mobile-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: '#EFF6FF',
                          color: '#2563EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                        }}
                      >
                        {getInitials(student.fullName)}
                      </div>
                      <div>
                        <div className="admin-card-mobile-name">{student.fullName}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                          ID: {student.studentId} | Roll: {student.rollNumber || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`admin-badge-status ${
                        student.status === 'ACTIVE'
                          ? 'admin-badge-status-active'
                          : 'admin-badge-status-inactive'
                      }`}
                    >
                      {student.status}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem', padding: '8px 0', borderTop: '1px solid var(--admin-border-subtle)', borderBottom: '1px solid var(--admin-border-subtle)' }}>
                    <div>
                      <span style={{ color: 'var(--admin-text-muted)' }}>Class:</span>{' '}
                      <strong>{student.grade} - {student.section}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--admin-text-muted)' }}>AY:</span>{' '}
                      <span>{student.academicYear}</span>
                    </div>
                    {student.parent && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ color: 'var(--admin-text-muted)' }}>Guardian:</span>{' '}
                        <strong>{student.parent.fullName}</strong>{' '}
                        <span style={{ fontSize: '0.72rem', color: 'var(--admin-muted-blue)' }}>
                          ({student.parent.relationship || 'Guardian'})
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => handleOpenStudentProfile(student.id)}
                      style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                    >
                      <Eye size={13} style={{ marginRight: '4px' }} />
                      View Profile
                    </button>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => handleOpenEdit(student)}
                      style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderTop: '1px solid var(--admin-border)',
                backgroundColor: '#FFFFFF',
                borderRadius: '0 0 10px 10px',
                fontSize: '0.84rem',
                color: 'var(--admin-text-muted)',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalStudents} total records)
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  disabled={page <= 1}
                  onClick={() => fetchStudents(page - 1)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  disabled={page >= totalPages}
                  onClick={() => fetchStudents(page + 1)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ==========================================
          MODAL 1: STUDENT PROFILE DETAILS MODAL
         ========================================== */}
      {selectedStudent && (
        <div className="admin-modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    border: '1px solid #BFDBFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  {getInitials(selectedStudent.fullName)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--admin-primary)' }}>
                    {selectedStudent.fullName}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                      ID: {selectedStudent.studentId}
                    </span>
                    <span
                      className={`admin-badge-status ${
                        selectedStudent.status === 'ACTIVE'
                          ? 'admin-badge-status-active'
                          : 'admin-badge-status-inactive'
                      }`}
                      style={{ fontSize: '0.68rem', padding: '2px 8px' }}
                    >
                      {selectedStudent.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedStudent(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="admin-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Section 1: Official Academic Enrollment */}
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--admin-text-muted)', letterSpacing: '0.04em', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={14} /> Official Enrollment
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', backgroundColor: 'var(--admin-bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Class / Grade</span>
                    <div style={{ fontWeight: 700, color: 'var(--admin-primary)', fontSize: '0.9rem' }}>
                      {selectedStudent.grade}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Section</span>
                    <div style={{ fontWeight: 700, color: 'var(--admin-primary)', fontSize: '0.9rem' }}>
                      Section {selectedStudent.section}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Roll Number</span>
                    <div style={{ fontWeight: 700, color: 'var(--admin-primary)', fontSize: '0.9rem' }}>
                      {selectedStudent.rollNumber || 'Not assigned'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Academic Year</span>
                    <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                      {selectedStudent.academicYear}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Enrolled Date</span>
                    <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                      {selectedStudent.enrolledAt || 'Official Record'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Class Teacher</span>
                    <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                      {selectedStudent.classTeacher || 'Assigned Faculty'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Student Personal Background */}
              {(selectedStudent.dateOfBirth || selectedStudent.gender || selectedStudent.previousSchool) && (
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--admin-text-muted)', letterSpacing: '0.04em', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <School size={14} /> Personal & Academic Background
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                    {selectedStudent.dateOfBirth && (
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Date of Birth</span>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{selectedStudent.dateOfBirth}</div>
                      </div>
                    )}
                    {selectedStudent.gender && (
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Gender</span>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{selectedStudent.gender}</div>
                      </div>
                    )}
                    {selectedStudent.previousSchool && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Previous School</span>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{selectedStudent.previousSchool}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Section 3: Linked Guardian / Family Connections */}
              <div>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--admin-text-muted)', letterSpacing: '0.04em', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} /> Family Connections
                </h4>
                {selectedStudent.parent ? (
                  <div
                    style={{
                      border: '1px solid var(--admin-border)',
                      borderRadius: '8px',
                      padding: '14px',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--admin-primary)', fontSize: '0.92rem' }}>
                          {selectedStudent.parent.fullName}
                        </div>
                        {selectedStudent.parent.relationship && (
                          <span
                            style={{
                              backgroundColor: '#EFF6FF',
                              color: '#2563EB',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '1px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            {selectedStudent.parent.relationship}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '0.78rem', color: 'var(--admin-text-muted)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Mail size={13} style={{ color: 'var(--admin-muted-blue)' }} />
                          <span>{selectedStudent.parent.email}</span>
                        </div>
                        {selectedStudent.parent.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Phone size={13} style={{ color: 'var(--admin-muted-blue)' }} />
                            <span>{selectedStudent.parent.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => handleViewParent(selectedStudent.parent?.id)}
                      style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                    >
                      <User size={13} style={{ marginRight: '4px' }} />
                      View Parent Profile
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '16px', backgroundColor: 'var(--admin-bg-subtle)', borderRadius: '8px', border: '1px dashed var(--admin-border)', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.84rem' }}>
                    No authorized guardian is currently linked to this student record.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => handleOpenEdit(selectedStudent)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Edit2 size={14} />
                <span>Edit Record</span>
              </button>

              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setSelectedStudent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: EDIT STUDENT MODAL
         ========================================== */}
      {editingStudent && (
        <div className="admin-modal-overlay" onClick={() => setEditingStudent(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--admin-primary)' }}>
                Edit Student — {editingStudent.fullName}
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setEditingStudent(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              {saveError && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{saveError}</span>
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '5px' }}>
                  Class / Grade (Official)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingStudent.grade}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--admin-border)', backgroundColor: 'var(--admin-bg-subtle)', color: 'var(--admin-text-muted)', fontSize: '0.84rem' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', marginTop: '2px', display: 'block' }}>
                  Grade transfers require academic administration review.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '5px' }}>
                    Section
                  </label>
                  <select
                    value={editSection}
                    onChange={(e) => setEditSection(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--admin-border)', backgroundColor: '#FFFFFF', fontSize: '0.84rem' }}
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '5px' }}>
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={editRollNumber}
                    onChange={(e) => setEditRollNumber(e.target.value)}
                    placeholder="e.g. 101"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--admin-border)', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--admin-text-main)', marginBottom: '5px' }}>
                  Enrollment Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--admin-border)', backgroundColor: '#FFFFFF', fontSize: '0.84rem' }}
                >
                  <option value="ACTIVE">Active (Enrolled & Attending)</option>
                  <option value="INACTIVE">Inactive (Suspended / On Leave)</option>
                  <option value="GRADUATED">Graduated (Alumni)</option>
                </select>
              </div>
            </div>

            <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="admin-btn-secondary"
                disabled={isSaving}
                onClick={() => setEditingStudent(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-primary-action"
                disabled={isSaving}
                onClick={handleSaveEdit}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {isSaving && <RotateCw size={14} className="animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 3: VIEW PARENT PROFILE MODAL
         ========================================== */}
      {viewingParent && (
        <div className="admin-modal-overlay" onClick={() => setViewingParent(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '580px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#FAF5FF',
                    color: '#9333EA',
                    border: '1px solid #E9D5FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  {getInitials(viewingParent.parent.fullName)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--admin-primary)' }}>
                    {viewingParent.parent.fullName}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                    Registered Parent Account
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setViewingParent(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', backgroundColor: 'var(--admin-bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-border)', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Email</span>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{viewingParent.parent.email}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Phone</span>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{viewingParent.parent.phone || '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Account Status</span>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                    <span
                      className={`admin-badge-status ${
                        viewingParent.parent.status === 'ACTIVE'
                          ? 'admin-badge-status-active'
                          : 'admin-badge-status-inactive'
                      }`}
                      style={{ fontSize: '0.7rem' }}
                    >
                      {viewingParent.parent.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>Member Since</span>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                    {viewingParent.parent.createdAt ? viewingParent.parent.createdAt.split('T')[0] : '—'}
                  </div>
                </div>
              </div>

              {/* Linked Children List */}
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--admin-text-muted)', letterSpacing: '0.04em', margin: '0 0 10px 0' }}>
                Officially Enrolled Children ({viewingParent.linkedChildren.length})
              </h4>
              {viewingParent.linkedChildren.length === 0 ? (
                <div style={{ padding: '16px', backgroundColor: 'var(--admin-bg-subtle)', borderRadius: '8px', border: '1px dashed var(--admin-border)', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '0.82rem' }}>
                  No enrolled students linked to this account yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {viewingParent.linkedChildren.map((child) => (
                    <div
                      key={child.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        border: '1px solid var(--admin-border)',
                        borderRadius: '6px',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--admin-primary)' }}>
                          {child.fullName}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                          {child.grade} - Section {child.section} | ID: {child.studentId}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="admin-btn-secondary"
                        onClick={() => {
                          setViewingParent(null);
                          handleOpenStudentProfile(child.id);
                        }}
                        style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                      >
                        <Eye size={12} style={{ marginRight: '4px' }} />
                        View Student
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setViewingParent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
export default AdminStudentsPage;
