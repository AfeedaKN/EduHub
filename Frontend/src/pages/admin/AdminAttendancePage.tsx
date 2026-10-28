import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  UserX,
  Clock,
  Users,
  Search,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  ChevronRight as ArrowChevron,
  RotateCw,
  History,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/adminApi';
import {
  ClassDetail,
  AdminSubjectGridResponse,
  AdminSubjectGridStudentRow,
  AdminAttentionStudent,
  ExtendedAttendanceStatus,
} from '../../types/admin.types';

const ACADEMIC_YEAR_OPTIONS = ['2026-2027', '2025-2026', '2027-2028'];

export const AdminAttendancePage: React.FC = () => {
  // Today's local date in YYYY-MM-DD
  const todayDateStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Filter State matching Reference UI
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2026-2027');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);

  // Common Metadata
  const [availableClasses, setAvailableClasses] = useState<ClassDetail[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>(['A']);

  // Grid Data State
  const [loading, setLoading] = useState<boolean>(false);
  const [gridData, setGridData] = useState<AdminSubjectGridResponse | null>(null);

  // Interactive Table Filtering State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showOnlyAbsent, setShowOnlyAbsent] = useState<boolean>(false);
  const [highlightedSubject, setHighlightedSubject] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Student Details & Correction Modal State
  const [detailStudent, setDetailStudent] = useState<AdminSubjectGridStudentRow | null>(null);
  const [studentEdits, setStudentEdits] = useState<
    Record<string, { status: ExtendedAttendanceStatus; remarks: string }>
  >({});
  const [isSavingAttendance, setIsSavingAttendance] = useState<boolean>(false);

  // Quick Actions: History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const showError = (msg: string) => {
    setToastError(msg);
    setTimeout(() => setToastError(null), 5000);
  };

  // 1. Fetch Classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await adminApi.getClasses();
        if (res.success && res.data && res.data.length > 0) {
          setAvailableClasses(res.data);
          // Default to the first available class
          setSelectedClass(res.data[0].name);
          const sections = (res.data[0].sections || []).map((s) => s.name);
          setAvailableSections(sections.length > 0 ? sections : ['A']);
          setSelectedSection(sections.length > 0 ? sections[0] : 'A');
        }
      } catch {
        // Fallback or ignore
      }
    };
    fetchClasses();
  }, []);

  // Update sections when class changes
  const handleClassChange = (className: string) => {
    setSelectedClass(className);
    const cls = availableClasses.find((c) => c.name === className);
    if (cls && cls.sections && cls.sections.length > 0) {
      const secNames = cls.sections.map((s) => s.name);
      setAvailableSections(secNames);
      setSelectedSection(secNames[0]);
    } else {
      setAvailableSections(['A']);
      setSelectedSection('A');
    }
  };

  // 2. Fetch Subject-Wise Attendance Grid
  const fetchAttendanceGrid = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const res = await adminApi.getSubjectWiseAttendanceGrid({
        academicYear: selectedAcademicYear,
        className: selectedClass,
        section: selectedSection,
        date: selectedDate,
      });

      if (res.success && res.data) {
        setGridData(res.data);
        setCurrentPage(1);
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to load subject-wise attendance.');
    } finally {
      setLoading(false);
    }
  }, [selectedAcademicYear, selectedClass, selectedSection, selectedDate]);

  // Load attendance whenever class is initialized or Load button clicked
  useEffect(() => {
    if (selectedClass) {
      fetchAttendanceGrid();
    }
  }, [selectedClass, selectedSection, selectedAcademicYear, fetchAttendanceGrid]);

  // 3. Filter Students in Table
  const filteredStudents = useMemo(() => {
    if (!gridData) return [];
    let list = gridData.students;

    if (showOnlyAbsent) {
      list = list.filter((s) => s.absentSubjects > 0);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.admissionNumber.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q)
      );
    }

    return list;
  }, [gridData, showOnlyAbsent, searchTerm]);

  // Paginated Students
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;

  // 4. Quick Cell Toggle Status
  const handleToggleCellStatus = async (
    studentId: string,
    subjectName: string,
    currentStatus: ExtendedAttendanceStatus
  ) => {
    const nextStatusMap: Record<ExtendedAttendanceStatus, ExtendedAttendanceStatus> = {
      UNMARKED: 'PRESENT',
      PRESENT: 'ABSENT',
      ABSENT: 'LATE',
      LATE: 'UNMARKED',
    };
    const nextStatus = nextStatusMap[currentStatus];

    try {
      await adminApi.saveSubjectWiseAttendanceBatch({
        className: selectedClass,
        section: selectedSection,
        date: selectedDate,
        academicYear: selectedAcademicYear,
        records: [
          {
            studentId,
            subjectName,
            status: nextStatus,
          },
        ],
      });

      // Update locally
      if (gridData) {
        const updatedStudents = gridData.students.map((st) => {
          if (st.studentId === studentId) {
            const currentSub = st.subjects[subjectName] || { status: 'UNMARKED' };
            const newSubjects = {
              ...st.subjects,
              [subjectName]: {
                ...currentSub,
                status: nextStatus,
                updatedAt: new Date().toISOString(),
              },
            };

            let pres = 0;
            let abs = 0;
            let late = 0;
            let unmark = 0;
            Object.values(newSubjects).forEach((sub) => {
              if (sub.status === 'PRESENT') pres++;
              else if (sub.status === 'ABSENT') abs++;
              else if (sub.status === 'LATE') late++;
              else unmark++;
            });
            const marked = pres + abs + late;
            const pct = marked > 0 ? Math.round((pres / marked) * 100) : 0;

            return {
              ...st,
              subjects: newSubjects,
              presentSubjects: pres,
              absentSubjects: abs,
              lateSubjects: late,
              unmarkedSubjects: unmark,
              attendancePercentage: pct,
            };
          }
          return st;
        });

        // Recalculate summary 5 cards
        let presAll = 0;
        let absAny = 0;
        let lateTotal = 0;
        let unmarkTotal = 0;
        updatedStudents.forEach((st) => {
          const m = st.presentSubjects + st.absentSubjects + st.lateSubjects;
          if (st.absentSubjects > 0) absAny++;
          else if (st.lateSubjects > 0) lateTotal++;
          else if (m > 0 && st.absentSubjects === 0 && st.lateSubjects === 0) presAll++;
          else if (m === 0) unmarkTotal++;
        });

        setGridData({
          ...gridData,
          students: updatedStudents,
          summary: {
            ...gridData.summary,
            presentAllSubjects: presAll,
            absentAnySubject: absAny,
            lateCount: lateTotal,
            notMarkedCount: unmarkTotal,
          },
        });
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to update attendance.');
    }
  };

  // 5. Open Student Details Modal
  const handleOpenStudentDetail = (student: AdminSubjectGridStudentRow) => {
    setDetailStudent(student);
    const edits: Record<string, { status: ExtendedAttendanceStatus; remarks: string }> = {};
    if (gridData) {
      gridData.subjects.forEach((subName) => {
        const item = student.subjects[subName];
        edits[subName] = {
          status: item?.status || 'UNMARKED',
          remarks: item?.remarks || '',
        };
      });
    }
    setStudentEdits(edits);
  };

  // Save Modal Attendance Changes
  const handleSaveStudentModalAttendance = async () => {
    if (!detailStudent) return;
    setIsSavingAttendance(true);
    try {
      const records = Object.entries(studentEdits).map(([subjectName, data]) => ({
        studentId: detailStudent.studentId,
        subjectName,
        status: data.status,
        remarks: data.remarks.trim() || undefined,
      }));

      const res = await adminApi.saveSubjectWiseAttendanceBatch({
        className: selectedClass,
        section: selectedSection,
        date: selectedDate,
        academicYear: selectedAcademicYear,
        records,
      });

      if (res.success) {
        showSuccess(`Subject attendance updated for ${detailStudent.fullName}.`);
        setDetailStudent(null);
        fetchAttendanceGrid();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // 6. Export Report CSV
  const handleExportCSV = () => {
    if (!gridData) return;
    const filename = `EduHub_Subject_Attendance_${selectedClass.replace(/\s+/g, '_')}_${selectedSection}_${selectedDate}.csv`;

    const headers = [
      '#',
      'Admission No',
      'Student Name',
      ...gridData.subjects,
      'Attendance %',
      'Remarks',
    ];

    const rows = filteredStudents.map((st, idx) => {
      const subCols = gridData.subjects.map((subName) => {
        const status = st.subjects[subName]?.status || 'UNMARKED';
        return status === 'PRESENT'
          ? 'P'
          : status === 'ABSENT'
          ? 'A'
          : status === 'LATE'
          ? 'L'
          : '-';
      });

      return [
        idx + 1,
        `"${st.admissionNumber}"`,
        `"${st.fullName}"`,
        ...subCols.map((c) => `"${c}"`),
        `"${st.attendancePercentage}%"`,
        `"${st.remarks.replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess(`Exported ${filename} successfully.`);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <AdminLayout>
      <div className="sub-att-dashboard" style={{ maxWidth: 1380, margin: '0 auto', paddingBottom: 40 }}>
        {/* Toast Notifications */}
        {toastMessage && (
          <div
            style={{
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#065F46',
              padding: '12px 18px',
              borderRadius: 8,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </div>
        )}

        {toastError && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#991B1B',
              padding: '12px 18px',
              borderRadius: 8,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={16} />
            <span>{toastError}</span>
          </div>
        )}

        {/* 1. PAGE HEADER & BREADCRUMB */}
        <div className="sub-att-header-row">
          <div className="sub-att-title-group">
            <div className="sub-att-icon-badge">
              <CalendarCheck size={22} />
            </div>
            <div>
              <h1 className="sub-att-title">Attendance</h1>
              <p className="sub-att-subtitle">View subject-wise attendance for students</p>
            </div>
          </div>

          <div className="sub-att-breadcrumb">
            <span>Home</span>
            <span>&gt;</span>
            <span>Attendance</span>
            <span>&gt;</span>
            <span className="active">Class Attendance</span>
          </div>
        </div>

        {/* 2. FILTER BAR CONTROLS CARD */}
        <div className="sub-att-filter-card">
          {/* Academic Year */}
          <div className="sub-att-filter-item">
            <label className="sub-att-filter-label">Academic Year</label>
            <select
              className="sub-att-filter-select"
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
            >
              {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div className="sub-att-filter-item">
            <label className="sub-att-filter-label">Class</label>
            <select
              className="sub-att-filter-select"
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
            >
              {availableClasses.map((c) => (
                <option key={c.id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div className="sub-att-filter-item">
            <label className="sub-att-filter-label">Section</label>
            <select
              className="sub-att-filter-select"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              {availableSections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="sub-att-filter-item">
            <label className="sub-att-filter-label">Date</label>
            <input
              type="date"
              className="sub-att-filter-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {/* Load Attendance Button */}
          <button
            type="button"
            className="sub-att-load-btn"
            disabled={loading}
            onClick={fetchAttendanceGrid}
          >
            {loading ? <RotateCw size={15} className="animate-spin" /> : <Search size={15} />}
            <span>Load Attendance</span>
          </button>
        </div>

        {/* 3. FIVE COMPACT SUMMARY CARDS */}
        <div className="sub-att-cards-grid">
          {/* Total Students */}
          <div className="sub-att-card">
            <div className="sub-att-card-icon icon-students">
              <Users size={20} />
            </div>
            <div className="sub-att-card-content">
              <span className="sub-att-card-label">Total Students</span>
              <span className="sub-att-card-val">{gridData?.summary?.totalStudents ?? 0}</span>
            </div>
          </div>

          {/* Present (All Subjects) */}
          <div className="sub-att-card">
            <div className="sub-att-card-icon icon-present">
              <CheckCircle2 size={20} />
            </div>
            <div className="sub-att-card-content">
              <span className="sub-att-card-label">Present (All Subjects)</span>
              <span className="sub-att-card-val" style={{ color: '#03543F' }}>
                {gridData?.summary?.presentAllSubjects ?? 0}
              </span>
            </div>
          </div>

          {/* Absent (Any Subject) */}
          <div className="sub-att-card">
            <div className="sub-att-card-icon icon-absent">
              <UserX size={20} />
            </div>
            <div className="sub-att-card-content">
              <span className="sub-att-card-label">Absent (Any Subject)</span>
              <span className="sub-att-card-val" style={{ color: '#9B1C1C' }}>
                {gridData?.summary?.absentAnySubject ?? 0}
              </span>
            </div>
          </div>

          {/* Late */}
          <div className="sub-att-card">
            <div className="sub-att-card-icon icon-late">
              <Clock size={20} />
            </div>
            <div className="sub-att-card-content">
              <span className="sub-att-card-label">Late</span>
              <span className="sub-att-card-val" style={{ color: '#92400E' }}>
                {gridData?.summary?.lateCount ?? 0}
              </span>
            </div>
          </div>

          {/* Not Marked */}
          <div className="sub-att-card">
            <div className="sub-att-card-icon icon-unmarked">
              <Calendar size={20} />
            </div>
            <div className="sub-att-card-content">
              <span className="sub-att-card-label">Not Marked</span>
              <span className="sub-att-card-val" style={{ color: '#5B21B6' }}>
                {gridData?.summary?.notMarkedCount ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* 4. MAIN LAYOUT: 2/3 TABLE + 1/3 SIDE PANELS */}
        <div className="sub-att-main-grid">
          {/* LEFT 2/3 COLUMN: SUBJECT-WISE ATTENDANCE TABLE */}
          <div className="sub-att-table-container">
            {/* Header with Title and Actions */}
            <div className="sub-att-table-header">
              <div>
                <h2 className="sub-att-table-title">
                  {selectedClass || 'Class'} - {selectedSection} | Subject-wise Attendance
                </h2>
                <p className="sub-att-table-sub">
                  {gridData?.dayName || selectedDate} | {filteredStudents.length} Students
                </p>
              </div>

              <div className="sub-att-table-actions">
                <button type="button" className="sub-att-btn-action" onClick={handleExportCSV}>
                  <Download size={14} />
                  <span>Export</span>
                </button>

                <button
                  type="button"
                  className={`sub-att-btn-action ${showOnlyAbsent ? 'active-toggle' : ''}`}
                  onClick={() => setShowOnlyAbsent(!showOnlyAbsent)}
                >
                  <Filter size={14} />
                  <span>Show Only Absent</span>
                </button>

                <button type="button" className="sub-att-btn-action" onClick={handlePrint}>
                  <Printer size={14} />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Search Input Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div
                style={{
                  position: 'relative',
                  flex: 1,
                  minWidth: 220,
                  maxWidth: 360,
                }}
              >
                <Search
                  size={15}
                  color="#9CA3AF"
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    height: 34,
                    paddingLeft: 32,
                    paddingRight: 10,
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    fontSize: '0.8rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {highlightedSubject && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    color: '#92400E',
                    fontWeight: 600,
                  }}
                >
                  <span>Focusing on: {highlightedSubject}</span>
                  <button
                    type="button"
                    onClick={() => setHighlightedSubject(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Matrix Table */}
            <div className="sub-att-scroll-table">
              <table className="sub-att-matrix-table">
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>#</th>
                    <th style={{ width: 110 }}>Admission No</th>
                    <th style={{ minWidth: 170 }}>Student Name</th>
                    {(gridData?.subjects || []).map((subName) => (
                      <th
                        key={subName}
                        style={{
                          textAlign: 'center',
                          backgroundColor:
                            highlightedSubject === subName ? '#FEF3C7' : undefined,
                        }}
                      >
                        {subName}
                      </th>
                    ))}
                    <th style={{ width: 110, textAlign: 'center' }}>Attendance %</th>
                    <th style={{ minWidth: 160 }}>Remarks</th>
                    <th style={{ width: 60, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={(gridData?.subjects?.length || 4) + 5}
                        style={{ textAlign: 'center', padding: '36px 0', color: '#6B7280' }}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <RotateCw size={18} className="animate-spin" />
                          <span>Loading attendance records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={(gridData?.subjects?.length || 4) + 5}
                        style={{ textAlign: 'center', padding: '40px 0', color: '#6B7280' }}
                      >
                        {showOnlyAbsent
                          ? 'No absent students found for this class and date.'
                          : 'No enrolled students found in this class and section.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((st, idx) => {
                      const rowNum = (currentPage - 1) * pageSize + idx + 1;
                      const pct = st.attendancePercentage;
                      const pctClass =
                        pct >= 85 ? 'rate-high' : pct >= 70 ? 'rate-med' : 'rate-low';

                      return (
                        <tr key={st.studentId}>
                          <td style={{ textAlign: 'center', color: '#6B7280', fontWeight: 600 }}>
                            {rowNum}
                          </td>
                          <td style={{ fontWeight: 600, color: '#374151' }}>
                            {st.admissionNumber || '—'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  backgroundColor: '#E5E7EB',
                                  color: '#374151',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  flexShrink: 0,
                                  overflow: 'hidden',
                                }}
                              >
                                {st.avatarUrl ? (
                                  <img
                                    src={st.avatarUrl}
                                    alt={st.fullName}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  st.fullName.charAt(0).toUpperCase()
                                )}
                              </div>
                              <span style={{ fontWeight: 600, color: '#1F2937' }}>{st.fullName}</span>
                            </div>
                          </td>

                          {/* Dynamic Subject Cells */}
                          {(gridData?.subjects || []).map((subName) => {
                            const subInfo = st.subjects[subName];
                            const status = subInfo?.status || 'UNMARKED';
                            const pillClass =
                              status === 'PRESENT'
                                ? 'pill-present'
                                : status === 'ABSENT'
                                ? 'pill-absent'
                                : status === 'LATE'
                                ? 'pill-late'
                                : 'pill-unmarked';

                            const label =
                              status === 'PRESENT'
                                ? 'P'
                                : status === 'ABSENT'
                                ? 'A'
                                : status === 'LATE'
                                ? 'L'
                                : '-';

                            return (
                              <td
                                key={subName}
                                style={{
                                  textAlign: 'center',
                                  backgroundColor:
                                    highlightedSubject === subName ? '#FFFBEB' : undefined,
                                }}
                              >
                                <button
                                  type="button"
                                  className={`sub-att-pill ${pillClass}`}
                                  title={`${subName}: ${status} (Click to toggle)`}
                                  onClick={() =>
                                    handleToggleCellStatus(st.studentId, subName, status)
                                  }
                                >
                                  {label}
                                </button>
                              </td>
                            );
                          })}

                          {/* Attendance % */}
                          <td style={{ textAlign: 'center' }}>
                            <span className={`sub-att-rate-badge ${pctClass}`}>{pct}%</span>
                          </td>

                          {/* Remarks */}
                          <td
                            style={{
                              fontSize: '0.76rem',
                              color: st.remarks !== '-' ? '#4B5563' : '#9CA3AF',
                              maxWidth: 200,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={st.remarks}
                          >
                            {st.remarks}
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="sub-att-btn-action"
                              style={{ height: 26, padding: '0 6px' }}
                              title="View details"
                              onClick={() => handleOpenStudentDetail(st)}
                            >
                              <Eye size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 8,
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredStudents.length)} of{' '}
                {filteredStudents.length} students
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  className="sub-att-btn-action"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{ padding: '0 8px' }}
                >
                  <ChevronLeft size={14} />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    type="button"
                    className="sub-att-btn-action"
                    onClick={() => setCurrentPage(i + 1)}
                    style={{
                      padding: '0 10px',
                      backgroundColor: currentPage === i + 1 ? '#385038' : '#FFFFFF',
                      color: currentPage === i + 1 ? '#FFFFFF' : '#374151',
                      borderColor: currentPage === i + 1 ? '#385038' : '#D1D5DB',
                    }}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  type="button"
                  className="sub-att-btn-action"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{ padding: '0 8px' }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Legend Row */}
            <div className="sub-att-legend-row">
              <div className="sub-att-legend-item">
                <div className="sub-att-legend-dot dot-p">P</div>
                <span>Present</span>
              </div>
              <div className="sub-att-legend-item">
                <div className="sub-att-legend-dot dot-a">A</div>
                <span>Absent</span>
              </div>
              <div className="sub-att-legend-item">
                <div className="sub-att-legend-dot dot-l">L</div>
                <span>Late</span>
              </div>
              <div className="sub-att-legend-item">
                <div className="sub-att-legend-dot dot-u">-</div>
                <span>Not Marked</span>
              </div>
            </div>
          </div>

          {/* RIGHT 1/3 COLUMN: THREE PANELS */}
          <div className="sub-att-side-col">
            {/* PANEL 1: SUBJECT-WISE SUMMARY */}
            <div className="sub-att-side-card">
              <h3 className="sub-att-side-title">Subject-wise Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(gridData?.subjectSummaries || []).map((sub) => {
                  const isHighlighted = highlightedSubject === sub.subjectName;

                  return (
                    <div
                      key={sub.subjectName}
                      className="sub-att-subject-item"
                      onClick={() =>
                        setHighlightedSubject(isHighlighted ? null : sub.subjectName)
                      }
                      style={{
                        backgroundColor: isHighlighted ? '#FEF3C7' : undefined,
                      }}
                      title={`Click to ${isHighlighted ? 'clear focus' : 'highlight'}`}
                    >
                      <span className="sub-att-subject-name">{sub.subjectName}</span>
                      <div className="sub-att-pill-counts">
                        <span className="sub-att-count-pill cnt-present" title="Present">
                          {sub.presentCount}
                        </span>
                        <span className="sub-att-count-pill cnt-absent" title="Absent">
                          {sub.absentCount}
                        </span>
                        <span className="sub-att-count-pill cnt-late" title="Late">
                          {sub.lateCount}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PANEL 2: STUDENTS WITH ANY ABSENCE / REQUIRING ATTENTION */}
            <div className="sub-att-side-card">
              <h3 className="sub-att-side-title">Students with Any Absence</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(!gridData?.requiringAttention || gridData.requiringAttention.length === 0) ? (
                  <div style={{ fontSize: '0.78rem', color: '#6B7280', padding: '8px 0' }}>
                    No recorded absences or lates today. All students in full attendance.
                  </div>
                ) : (
                  gridData.requiringAttention.map((att: AdminAttentionStudent) => {
                    const matchStudent = gridData.students.find(
                      (s) => s.studentId === att.studentId
                    );

                    return (
                      <div
                        key={att.studentId}
                        className="sub-att-attention-item"
                        onClick={() => matchStudent && handleOpenStudentDetail(matchStudent)}
                      >
                        <div className="sub-att-attention-info">
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              backgroundColor: '#FEE2E2',
                              color: '#991B1B',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {att.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="sub-att-attention-name">{att.fullName}</div>
                            <div className="sub-att-attention-desc">
                              {att.primaryIssueDescription}
                            </div>
                          </div>
                        </div>

                        <ArrowChevron size={14} color="#9CA3AF" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* PANEL 3: QUICK ACTIONS */}
            <div className="sub-att-side-card">
              <h3 className="sub-att-side-title">Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  type="button"
                  className="sub-att-quick-btn"
                  onClick={handleExportCSV}
                >
                  <Download size={16} color="#374151" />
                  <span>Download Attendance Report</span>
                </button>

                <button
                  type="button"
                  className="sub-att-quick-btn"
                  onClick={() => setShowHistoryModal(true)}
                >
                  <History size={16} color="#374151" />
                  <span>View Attendance History</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 5. MODAL: STUDENT ATTENDANCE DETAILS & CORRECTION */}
        {detailStudent && (
          <div
            className="admin-modal-backdrop"
            onClick={() => setDetailStudent(null)}
          >
            <div
              className="admin-modal-card"
              style={{ maxWidth: 640, width: '95%' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                className="admin-modal-header"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: '1px solid #E5E7EB',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: '#385038',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    {detailStudent.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                      {detailStudent.fullName}
                    </h3>
                    <div style={{ fontSize: '0.76rem', color: '#6B7280', marginTop: 2 }}>
                      Admission: {detailStudent.admissionNumber || '—'} | Class: {selectedClass} -{' '}
                      {selectedSection} | Date: {selectedDate}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailStudent(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <X size={18} color="#6B7280" />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div
                  style={{
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: '0.8rem',
                    color: '#374151',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    Current Rate:{' '}
                    <strong>{detailStudent.attendancePercentage}%</strong>
                  </span>
                  <span>
                    Present: <strong>{detailStudent.presentSubjects}</strong> | Absent:{' '}
                    <strong>{detailStudent.absentSubjects}</strong> | Late:{' '}
                    <strong>{detailStudent.lateSubjects}</strong>
                  </span>
                </div>

                <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead style={{ backgroundColor: '#F9FAFB' }}>
                      <tr>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Subject</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', width: 170 }}>Status</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(gridData?.subjects || []).map((subName) => {
                        const edit = studentEdits[subName] || { status: 'UNMARKED', remarks: '' };

                        return (
                          <tr key={subName} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 600 }}>{subName}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: 4 }}>
                                <button
                                  type="button"
                                  className={`sub-att-pill ${edit.status === 'PRESENT' ? 'pill-present' : 'pill-unmarked'}`}
                                  style={{ height: 24, fontSize: '0.7rem' }}
                                  onClick={() =>
                                    setStudentEdits((prev) => ({
                                      ...prev,
                                      [subName]: { ...prev[subName], status: 'PRESENT' },
                                    }))
                                  }
                                >
                                  P
                                </button>
                                <button
                                  type="button"
                                  className={`sub-att-pill ${edit.status === 'ABSENT' ? 'pill-absent' : 'pill-unmarked'}`}
                                  style={{ height: 24, fontSize: '0.7rem' }}
                                  onClick={() =>
                                    setStudentEdits((prev) => ({
                                      ...prev,
                                      [subName]: { ...prev[subName], status: 'ABSENT' },
                                    }))
                                  }
                                >
                                  A
                                </button>
                                <button
                                  type="button"
                                  className={`sub-att-pill ${edit.status === 'LATE' ? 'pill-late' : 'pill-unmarked'}`}
                                  style={{ height: 24, fontSize: '0.7rem' }}
                                  onClick={() =>
                                    setStudentEdits((prev) => ({
                                      ...prev,
                                      [subName]: { ...prev[subName], status: 'LATE' },
                                    }))
                                  }
                                >
                                  L
                                </button>
                                <button
                                  type="button"
                                  className={`sub-att-pill ${edit.status === 'UNMARKED' ? 'pill-unmarked' : ''}`}
                                  style={{ height: 24, fontSize: '0.7rem', color: '#6B7280' }}
                                  onClick={() =>
                                    setStudentEdits((prev) => ({
                                      ...prev,
                                      [subName]: { ...prev[subName], status: 'UNMARKED' },
                                    }))
                                  }
                                >
                                  -
                                </button>
                              </div>
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <input
                                type="text"
                                placeholder="Add remark..."
                                value={edit.remarks}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setStudentEdits((prev) => ({
                                    ...prev,
                                    [subName]: { ...prev[subName], remarks: val },
                                  }));
                                }}
                                style={{
                                  width: '100%',
                                  padding: '4px 8px',
                                  fontSize: '0.76rem',
                                  borderRadius: 4,
                                  border: '1px solid #D1D5DB',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  padding: '14px 20px',
                  borderTop: '1px solid #E5E7EB',
                  backgroundColor: '#F9FAFB',
                }}
              >
                <button
                  type="button"
                  className="sub-att-btn-action"
                  onClick={() => setDetailStudent(null)}
                  disabled={isSavingAttendance}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="sub-att-load-btn"
                  onClick={handleSaveStudentModalAttendance}
                  disabled={isSavingAttendance}
                >
                  {isSavingAttendance && <RotateCw size={14} className="animate-spin" />}
                  <span>Save Attendance</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. MODAL: VIEW ATTENDANCE HISTORY */}
        {showHistoryModal && (
          <div
            className="admin-modal-backdrop"
            onClick={() => setShowHistoryModal(false)}
          >
            <div
              className="admin-modal-card"
              style={{ maxWidth: 540, width: '95%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="admin-modal-header"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: '1px solid #E5E7EB',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <History size={18} color="#385038" />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                    Attendance History & Calendar
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <X size={18} color="#6B7280" />
                </button>
              </div>

              <div style={{ padding: '20px', fontSize: '0.84rem', color: '#4B5563' }}>
                <p style={{ margin: '0 0 12px 0' }}>
                  Use the date picker in the top filter bar to review and edit past subject-wise
                  attendance records for <strong>{selectedClass} - {selectedSection}</strong>.
                </p>
                <div
                  style={{
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div>
                    Active Academic Year: <strong>{selectedAcademicYear}</strong>
                  </div>
                  <div>
                    Selected Classroom: <strong>{selectedClass} - {selectedSection}</strong>
                  </div>
                  <div>
                    Currently Viewing Date: <strong>{selectedDate}</strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  padding: '12px 20px',
                  borderTop: '1px solid #E5E7EB',
                  backgroundColor: '#F9FAFB',
                }}
              >
                <button
                  type="button"
                  className="sub-att-load-btn"
                  onClick={() => setShowHistoryModal(false)}
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

export default AdminAttendancePage;
