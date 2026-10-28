import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarCheck,
  RotateCw,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Users,
  UserCheck,
  UserX,
  Clock,
  Save,
  Search,
  History,
  ClipboardList,
  Calendar,
} from 'lucide-react';
import { TeacherLayout } from '../../components/teacher/TeacherLayout';
import { teacherApi } from '../../api/teacherApi';
import type { TeacherClassItem } from '../../types/teacher.types';
import type {
  AttendanceRegister,
  StudentAttendanceItem,
  AttendanceStatus,
  AttendanceHistoryEntry,
} from '../../types/attendance.types';

export const TeacherAttendancePage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Teacher assigned classes list
  const [classes, setClasses] = useState<TeacherClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');

  // Today's date formatted as YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Tab view: 'register' | 'history'
  const [activeTab, setActiveTab] = useState<'register' | 'history'>('register');

  // Register state
  const [register, setRegister] = useState<AttendanceRegister | null>(null);
  const [studentRows, setStudentRows] = useState<StudentAttendanceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // History state
  const [historyList, setHistoryList] = useState<AttendanceHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // Async UI states
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [registerLoading, setRegisterLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1. Fetch assigned classes on mount
  useEffect(() => {
    const fetchAssignedClasses = async () => {
      try {
        setInitialLoading(true);
        setError(null);
        const res = await teacherApi.getMyClasses();
        if (res.success && res.data && res.data.length > 0) {
          setClasses(res.data);

          // Check if URL params contain pre-selected class and section
          const urlClass = searchParams.get('className');
          const urlSection = searchParams.get('section');

          const matchedByUrl = res.data.find(
            (c) =>
              c.className.toLowerCase() === (urlClass || '').toLowerCase() &&
              c.section.toLowerCase() === (urlSection || '').toLowerCase()
          );

          if (matchedByUrl) {
            setSelectedClass(matchedByUrl.className);
            setSelectedSection(matchedByUrl.section);
          } else {
            // Default to first assigned class that has enrolled students, or fallback to first assigned class
            const defaultClass =
              res.data.find((c) => (c.studentCount || 0) > 0) || res.data[0];
            setSelectedClass(defaultClass.className);
            setSelectedSection(defaultClass.section);
          }
        } else {
          setClasses([]);
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            'Failed to load your assigned classes. Please check your network and try again.'
        );
      } finally {
        setInitialLoading(false);
      }
    };

    fetchAssignedClasses();
  }, [searchParams]);

  // Derived available sections for the selected class
  const availableSections = useMemo(() => {
    if (!selectedClass) return [];
    const sectionSet = new Set<string>();
    classes.forEach((c) => {
      if (c.className.toLowerCase() === selectedClass.toLowerCase()) {
        sectionSet.add(c.section);
      }
    });
    return Array.from(sectionSet).sort();
  }, [classes, selectedClass]);

  // 2. Fetch register whenever class, section, or date changes
  const fetchRegister = async () => {
    if (!selectedClass || !selectedSection || !selectedDate) return;

    try {
      setRegisterLoading(true);
      setError(null);
      setSuccessMessage(null);

      const res = await teacherApi.getAttendanceRegister({
        className: selectedClass,
        section: selectedSection,
        date: selectedDate,
      });

      if (res.success && res.data) {
        setRegister(res.data);
        setStudentRows(res.data.students);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Failed to retrieve attendance register. Please try again.'
      );
      setRegister(null);
      setStudentRows([]);
    } finally {
      setRegisterLoading(false);
    }
  };

  // 3. Fetch history when history tab is opened
  const fetchHistory = async () => {
    if (!selectedClass || !selectedSection) return;

    try {
      setHistoryLoading(true);
      setError(null);

      const res = await teacherApi.getAttendanceHistory({
        className: selectedClass,
        section: selectedSection,
      });

      if (res.success && res.data) {
        setHistoryList(res.data);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Failed to load attendance history for this section.'
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass && selectedSection) {
      if (activeTab === 'register') {
        fetchRegister();
      } else {
        fetchHistory();
      }
    }
  }, [selectedClass, selectedSection, selectedDate, activeTab]);

  // Live Summary metrics calculated from local studentRows
  const liveSummary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;

    studentRows.forEach((s) => {
      if (s.status === 'PRESENT') present++;
      else if (s.status === 'ABSENT') absent++;
      else if (s.status === 'LATE') late++;
    });

    const total = studentRows.length;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { total, present, absent, late, percentage };
  }, [studentRows]);

  // Status toggle handler
  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    setStudentRows((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s))
    );
  };

  // Remarks change handler
  const handleRemarksChange = (studentId: string, remarks: string) => {
    setStudentRows((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, remarks } : s))
    );
  };

  // Bulk actions: Mark all present / absent
  const handleMarkAll = (status: AttendanceStatus) => {
    setStudentRows((prev) => prev.map((s) => ({ ...s, status })));
  };

  // Save / Update Attendance
  const handleSaveAttendance = async () => {
    if (!selectedClass || !selectedSection || !selectedDate) return;
    if (studentRows.length === 0) {
      setError('No students in this section to mark attendance.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const payload = {
        className: selectedClass,
        section: selectedSection,
        date: selectedDate,
        academicYear: register?.academicYear,
        records: studentRows.map((s) => ({
          studentId: s.studentId,
          status: s.status,
          remarks: s.remarks,
        })),
      };

      let res;
      if (register?.isAlreadyMarked) {
        res = await teacherApi.updateAttendance(payload);
      } else {
        res = await teacherApi.saveAttendance(payload);
      }

      if (res.success && res.data) {
        setRegister(res.data);
        setStudentRows(res.data.students);
        setSuccessMessage(
          register?.isAlreadyMarked
            ? 'Attendance register updated successfully.'
            : 'Attendance register saved successfully.'
        );
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Failed to save attendance. Please verify your data and retry.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Filter students by local search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentRows;
    const q = searchQuery.trim().toLowerCase();
    return studentRows.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q))
    );
  }, [studentRows, searchQuery]);

  // Load a historical date into the register
  const handleLoadHistoricalDate = (histDate: string) => {
    setSelectedDate(histDate);
    setActiveTab('register');
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
      <div className="teacher-attendance-page-container" style={{ padding: '4px 0 32px' }}>
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
                Classroom Registers
              </span>
            </div>
            <h1 className="teacher-welcome-heading" style={{ margin: '0 0 6px' }}>
              Daily Attendance
            </h1>
            <p className="teacher-welcome-subtitle" style={{ margin: 0 }}>
              <span>
                Record, verify, and submit morning attendance registers for your classroom sessions
              </span>
            </p>
          </div>

          <div className="teacher-welcome-actions">
            <button
              type="button"
              className="teacher-btn-refresh"
              onClick={() => {
                if (activeTab === 'register') fetchRegister();
                else fetchHistory();
              }}
              disabled={registerLoading || historyLoading}
              title="Refresh attendance data"
            >
              <RotateCw
                size={14}
                className={registerLoading || historyLoading ? 'teacher-spin' : ''}
              />
              <span>Refresh</span>
            </button>
          </div>
        </section>

        {/* 2. Controls & Selectors Card */}
        <div className="teacher-attendance-controls-card">
          <div className="teacher-attendance-pickers">
            {/* Class Selector */}
            <div className="teacher-attendance-field-group">
              <label className="teacher-attendance-field-label">Assigned Class</label>
              <select
                className="teacher-students-select"
                value={selectedClass}
                onChange={(e) => {
                  const newClass = e.target.value;
                  setSelectedClass(newClass);
                  // Auto-select first section for this class
                  const sec = classes.find((c) => c.className === newClass)?.section || 'A';
                  setSelectedSection(sec);
                }}
                disabled={classes.length === 0}
              >
                {classes.length === 0 ? (
                  <option value="">No Classes Assigned</option>
                ) : (
                  Array.from(new Set(classes.map((c) => c.className))).map((clsName) => {
                    const totalStudentsInClass = classes
                      .filter((c) => c.className === clsName)
                      .reduce((sum, c) => sum + (c.studentCount || 0), 0);
                    return (
                      <option key={clsName} value={clsName}>
                        {clsName} ({totalStudentsInClass} {totalStudentsInClass === 1 ? 'enrolled' : 'enrolled'})
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            {/* Section Selector */}
            <div className="teacher-attendance-field-group">
              <label className="teacher-attendance-field-label">Section</label>
              <select
                className="teacher-students-select"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={availableSections.length === 0}
              >
                {availableSections.map((sec) => {
                  const secItem = classes.find(
                    (c) =>
                      c.className.toLowerCase() === selectedClass.toLowerCase() &&
                      c.section.toLowerCase() === sec.toLowerCase()
                  );
                  const count = secItem?.studentCount;
                  return (
                    <option key={sec} value={sec}>
                      Section {sec} {count !== undefined ? `(${count} enrolled)` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Date Picker */}
            <div className="teacher-attendance-field-group">
              <label className="teacher-attendance-field-label">Attendance Date</label>
              <input
                type="date"
                className="teacher-attendance-date-picker"
                value={selectedDate}
                max={todayStr}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {/* Mode Tabs: Register vs History */}
          <div className="teacher-attendance-tabs">
            <button
              type="button"
              className={`teacher-attendance-tab-btn ${
                activeTab === 'register' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('register')}
            >
              <ClipboardList size={14} />
              <span>Daily Register</span>
            </button>
            <button
              type="button"
              className={`teacher-attendance-tab-btn ${
                activeTab === 'history' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('history')}
            >
              <History size={14} />
              <span>Past History</span>
            </button>
          </div>
        </div>

        {/* 3. Alerts: Success / Error / Existing Record Warning */}
        {error && (
          <div
            style={{
              backgroundColor: '#FDF2F2',
              border: '1px solid #F8D7DA',
              borderRadius: '8px',
              padding: '12px 18px',
              color: '#B91C1C',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              fontSize: '0.85rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>{error}</div>
            <button
              type="button"
              onClick={fetchRegister}
              className="teacher-btn-refresh"
              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
              padding: '12px 18px',
              color: '#15803D',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              fontSize: '0.85rem',
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>{successMessage}</div>
          </div>
        )}

        {activeTab === 'register' && register?.isAlreadyMarked && (
          <div className="teacher-attendance-warning-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Attendance Already Recorded:</strong> A register has already been submitted
                for <strong>{selectedClass} Section {selectedSection}</strong> on{' '}
                <strong>{selectedDate}</strong>
                {register.markedByName ? ` by ${register.markedByName}` : ''}. Updating below will
                modify existing records.
              </div>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                backgroundColor: '#FEF08A',
                padding: '3px 8px',
                borderRadius: '4px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              Update Mode
            </span>
          </div>
        )}

        {/* 4. TAB CONTENT: DAILY REGISTER */}
        {activeTab === 'register' ? (
          <>
            {/* Live Metrics Row */}
            <div
              className="teacher-summary-cards-row"
              style={{ marginBottom: '20px' }}
              aria-label="Attendance Summary Metrics"
            >
              {/* Metric 1: Total Students */}
              <div className="teacher-summary-card">
                <div className="teacher-card-top-row">
                  <span className="teacher-card-label">Total Roster</span>
                  <div className="teacher-card-icon-wrap">
                    <Users size={17} />
                  </div>
                </div>
                <div className="teacher-card-value-row">
                  <div className="teacher-card-value">{liveSummary.total}</div>
                  <span className="teacher-card-indicator">Enrolled</span>
                </div>
                <div className="teacher-card-subtext">Students in this section</div>
              </div>

              {/* Metric 2: Present */}
              <div className="teacher-summary-card">
                <div className="teacher-card-top-row">
                  <span className="teacher-card-label">Present</span>
                  <div className="teacher-card-icon-wrap icon-sage">
                    <UserCheck size={17} />
                  </div>
                </div>
                <div className="teacher-card-value-row">
                  <div className="teacher-card-value" style={{ color: '#15803D' }}>
                    {liveSummary.present}
                  </div>
                  <span className="teacher-card-indicator indicator-sage">Active</span>
                </div>
                <div className="teacher-card-subtext">Marked present today</div>
              </div>

              {/* Metric 3: Absent */}
              <div className="teacher-summary-card">
                <div className="teacher-card-top-row">
                  <span className="teacher-card-label">Absent</span>
                  <div className="teacher-card-icon-wrap icon-coral">
                    <UserX size={17} />
                  </div>
                </div>
                <div className="teacher-card-value-row">
                  <div className="teacher-card-value" style={{ color: '#B91C1C' }}>
                    {liveSummary.absent}
                  </div>
                  <span
                    className="teacher-card-indicator"
                    style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}
                  >
                    Absent
                  </span>
                </div>
                <div className="teacher-card-subtext">Students absent from session</div>
              </div>

              {/* Metric 4: Late & Attendance Rate */}
              <div className="teacher-summary-card">
                <div className="teacher-card-top-row">
                  <span className="teacher-card-label">Attendance Rate</span>
                  <div className="teacher-card-icon-wrap icon-blue">
                    <Clock size={17} />
                  </div>
                </div>
                <div className="teacher-card-value-row">
                  <div className="teacher-card-value">{liveSummary.percentage}%</div>
                  <span className="teacher-card-indicator">
                    {liveSummary.late} Late
                  </span>
                </div>
                <div className="teacher-card-subtext">Present + Late student ratio</div>
              </div>
            </div>

            {/* Quick Actions & Search Bar */}
            <div className="teacher-attendance-quick-bar">
              {/* Local Search Input */}
              <div style={{ position: 'relative', minWidth: '240px', maxWidth: '340px', flex: 1 }}>
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#8A94A0',
                  }}
                />
                <input
                  type="text"
                  placeholder="Filter student by name or roll..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    fontSize: '0.84rem',
                    borderRadius: '6px',
                    border: '1px solid var(--teacher-border)',
                    outline: 'none',
                    backgroundColor: '#FFFFFF',
                  }}
                />
              </div>

              {/* Bulk Toggle Buttons & Submit */}
              <div className="teacher-attendance-quick-actions">
                <button
                  type="button"
                  className="teacher-attendance-quick-btn"
                  onClick={() => handleMarkAll('PRESENT')}
                  title="Mark all students as Present"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  className="teacher-attendance-quick-btn"
                  onClick={() => handleMarkAll('ABSENT')}
                  title="Mark all students as Absent"
                >
                  Mark All Absent
                </button>

                <button
                  type="button"
                  className="teacher-attendance-save-btn"
                  onClick={handleSaveAttendance}
                  disabled={saving || studentRows.length === 0}
                  title="Save attendance register"
                >
                  <Save size={15} />
                  <span>
                    {saving
                      ? 'Saving...'
                      : register?.isAlreadyMarked
                      ? 'Update Attendance'
                      : 'Save Attendance'}
                  </span>
                </button>
              </div>
            </div>

            {/* Attendance Table Card */}
            <div className="teacher-students-table-card">
              {initialLoading || registerLoading ? (
                /* Skeleton */
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        style={{
                          height: '52px',
                          backgroundColor: '#F5F5F0',
                          borderRadius: '6px',
                          animation: 'pulse 1.5s ease-in-out infinite',
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : classes.length === 0 ? (
                /* Empty state: No classes assigned */
                <div style={{ padding: '60px 24px', textAlign: 'center', color: '#647F99' }}>
                  <CalendarCheck size={36} style={{ marginBottom: '12px', color: '#20354A' }} />
                  <h3 style={{ margin: '0 0 6px', color: '#20354A', fontSize: '1.05rem' }}>
                    No Classes Assigned
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.86rem' }}>
                    You currently have no classes or sections assigned. Once management assigns
                    classes to your profile, attendance registers will be available here.
                  </p>
                </div>
              ) : studentRows.length === 0 ? (
                /* Empty state: No students enrolled */
                <div style={{ padding: '60px 24px', textAlign: 'center', color: '#647F99' }}>
                  <Users size={36} style={{ marginBottom: '12px', color: '#20354A' }} />
                  <h3 style={{ margin: '0 0 6px', color: '#20354A', fontSize: '1.05rem' }}>
                    No Enrolled Students
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.86rem' }}>
                    There are no officially enrolled students in {selectedClass} Section{' '}
                    {selectedSection}.
                  </p>
                </div>
              ) : (
                /* Register Table */
                <div className="teacher-students-table-wrap">
                  <table className="teacher-students-table">
                    <thead>
                      <tr>
                        <th># Roll</th>
                        <th>Student Name</th>
                        <th>Admission ID</th>
                        <th style={{ textAlign: 'center' }}>Attendance Status</th>
                        <th>Remarks / Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, idx) => (
                        <tr key={student.studentId}>
                          {/* 1. Roll number */}
                          <td style={{ width: '80px' }}>
                            <span className="teacher-student-roll-pill">
                              {student.rollNumber || String(idx + 1).padStart(2, '0')}
                            </span>
                          </td>

                          {/* 2. Name & Avatar */}
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

                          {/* 3. Admission ID */}
                          <td>
                            <span className="teacher-student-id-badge">
                              {student.admissionNumber}
                            </span>
                          </td>

                          {/* 4. Status Selector Buttons */}
                          <td style={{ textAlign: 'center', width: '250px' }}>
                            <div className="teacher-attendance-status-selector">
                              <button
                                type="button"
                                className={`teacher-status-btn present ${
                                  student.status === 'PRESENT' ? 'active' : ''
                                }`}
                                onClick={() => handleStatusChange(student.studentId, 'PRESENT')}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                className={`teacher-status-btn absent ${
                                  student.status === 'ABSENT' ? 'active' : ''
                                }`}
                                onClick={() => handleStatusChange(student.studentId, 'ABSENT')}
                              >
                                Absent
                              </button>
                              <button
                                type="button"
                                className={`teacher-status-btn late ${
                                  student.status === 'LATE' ? 'active' : ''
                                }`}
                                onClick={() => handleStatusChange(student.studentId, 'LATE')}
                              >
                                Late
                              </button>
                            </div>
                          </td>

                          {/* 5. Remarks Field */}
                          <td>
                            <input
                              type="text"
                              className="teacher-attendance-remarks-field"
                              placeholder={
                                student.status === 'ABSENT'
                                  ? 'Reason for absence...'
                                  : student.status === 'LATE'
                                  ? 'Late arrival reason...'
                                  : 'Optional remarks...'
                              }
                              value={student.remarks || ''}
                              onChange={(e) =>
                                handleRemarksChange(student.studentId, e.target.value)
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          /* 5. TAB CONTENT: ATTENDANCE HISTORY */
          <div className="teacher-students-table-card">
            {historyLoading ? (
              /* Loading Skeleton */
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
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
            ) : historyList.length === 0 ? (
              /* Empty History */
              <div style={{ padding: '60px 24px', textAlign: 'center', color: '#647F99' }}>
                <History size={36} style={{ marginBottom: '12px', color: '#20354A' }} />
                <h3 style={{ margin: '0 0 6px', color: '#20354A', fontSize: '1.05rem' }}>
                  No History Records Found
                </h3>
                <p style={{ margin: 0, fontSize: '0.86rem' }}>
                  No past attendance sessions recorded yet for {selectedClass} Section{' '}
                  {selectedSection}.
                </p>
              </div>
            ) : (
              /* History Table */
              <div className="teacher-students-table-wrap">
                <table className="teacher-students-table">
                  <thead>
                    <tr>
                      <th>Session Date</th>
                      <th>Class &amp; Section</th>
                      <th>Total Students</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Late</th>
                      <th>Attendance Rate</th>
                      <th>Recorded By</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.map((entry) => (
                      <tr key={entry.date}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={14} style={{ color: '#647F99' }} />
                            <strong style={{ color: '#20354A' }}>{entry.date}</strong>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{selectedClass}</span>
                            <span className="teacher-section-badge">Sec {selectedSection}</span>
                          </div>
                        </td>
                        <td>{entry.totalStudents}</td>
                        <td style={{ color: '#15803D', fontWeight: 600 }}>{entry.present}</td>
                        <td style={{ color: '#B91C1C', fontWeight: 600 }}>{entry.absent}</td>
                        <td style={{ color: '#B45309', fontWeight: 600 }}>{entry.late}</td>
                        <td>
                          <span className="teacher-attendance-rate-badge">
                            {entry.percentage}%
                          </span>
                        </td>
                        <td>{entry.markedByName || 'Teacher'}</td>
                        <td>
                          <button
                            type="button"
                            className="teacher-pagination-btn"
                            onClick={() => handleLoadHistoricalDate(entry.date)}
                            title="Load and edit this register"
                          >
                            <span>View / Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};
