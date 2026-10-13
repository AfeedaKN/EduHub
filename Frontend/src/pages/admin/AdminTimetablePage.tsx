import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Clock,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RotateCw,
  X,
  BookOpen,
  UserCheck,
  DoorOpen,
  Layers,
  Calendar,
  Grid3X3,
  ListFilter,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/adminApi';
import {
  TimetablePeriod,
  DayOfWeek,
  PeriodType,
  DAYS_OF_WEEK,
  PERIOD_TYPES,
  CreatePeriodPayload,
  UpdatePeriodPayload,
} from '../../types/timetable.types';
import { ClassDetail, TeacherDetail } from '../../types/admin.types';

const ACADEMIC_YEAR_OPTIONS = ['2026-2027', '2027-2028', '2025-2026'];

const DEFAULT_TIME_SLOTS = [
  { start: '08:30', end: '09:15', label: 'Period 1' },
  { start: '09:15', end: '10:00', label: 'Period 2' },
  { start: '10:00', end: '10:15', label: 'Morning Recess' },
  { start: '10:15', end: '11:00', label: 'Period 3' },
  { start: '11:00', end: '11:45', label: 'Period 4' },
  { start: '11:45', end: '12:30', label: 'Lunch Break' },
  { start: '12:30', end: '13:15', label: 'Period 5' },
  { start: '13:15', end: '14:00', label: 'Period 6' },
];

export const AdminTimetablePage: React.FC = () => {
  // Primary Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [periods, setPeriods] = useState<TimetablePeriod[]>([]);
  const [classes, setClasses] = useState<ClassDetail[]>([]);
  const [teachers, setTeachers] = useState<TeacherDetail[]>([]);

  // Filter States
  const [selectedYear, setSelectedYear] = useState<string>('2026-2027');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedDayTab, setSelectedDayTab] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'tabs'>('grid');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Notification Toasts
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  const showToastSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const showToastError = (msg: string) => {
    setToastError(msg);
    setTimeout(() => setToastError(null), 5000);
  };

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingPeriod, setEditingPeriod] = useState<TimetablePeriod | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [formAcademicYear, setFormAcademicYear] = useState<string>('2026-2027');
  const [formClassId, setFormClassId] = useState<string>('');
  const [formSection, setFormSection] = useState<string>('A');
  const [formDayOfWeek, setFormDayOfWeek] = useState<DayOfWeek>('MONDAY');
  const [formStartTime, setFormStartTime] = useState<string>('09:00');
  const [formEndTime, setFormEndTime] = useState<string>('09:45');
  const [formSubject, setFormSubject] = useState<string>('');
  const [formTeacherId, setFormTeacherId] = useState<string>('');
  const [formRoomNumber, setFormRoomNumber] = useState<string>('');
  const [formPeriodType, setFormPeriodType] = useState<PeriodType>('TEACHING');
  const [formNotes, setFormNotes] = useState<string>('');

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirming, setConfirming] = useState<boolean>(false);

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [periodsRes, classesRes, teachersRes] = await Promise.all([
        adminApi.getTimetable({
          academicYear: selectedYear === 'ALL' ? undefined : selectedYear,
          classId: selectedClassId === 'ALL' ? undefined : selectedClassId,
          section: selectedSection === 'ALL' ? undefined : selectedSection,
          dayOfWeek: selectedDayTab === 'ALL' ? undefined : (selectedDayTab as DayOfWeek),
        }),
        adminApi.getClasses({
          academicYear: selectedYear === 'ALL' ? undefined : selectedYear,
        }),
        adminApi.getTeachers({ status: 'ACTIVE' }),
      ]);

      setPeriods(periodsRes.data || []);
      setClasses(classesRes.data || []);
      setTeachers(teachersRes.data || []);
    } catch (err: any) {
      console.error('Failed to load timetable data:', err);
      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          'Failed to load academic timetable. Please refresh and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedClassId, selectedSection, selectedDayTab]);

  // Derived sections based on selected class filter
  const currentFilteredClass = classes.find((c) => c.id === selectedClassId);
  const availableSectionsForFilter = currentFilteredClass?.sections || [];

  // Derived sections for the modal based on formClassId
  const currentModalClass = classes.find((c) => c.id === formClassId);
  const availableSectionsForModal = currentModalClass?.sections || [];

  // Open modal in "Add" mode
  const handleOpenAddModal = (initialDay?: DayOfWeek, initialTime?: { start: string; end: string }) => {
    setEditingPeriod(null);
    setModalError(null);

    // Pick first class if available
    const defaultClass =
      (selectedClassId !== 'ALL' && classes.find((c) => c.id === selectedClassId)) ||
      classes[0];

    const defaultClassId = defaultClass?.id || '';
    const defaultSection = defaultClass?.sections?.[0]?.name || 'A';
    const defaultRoom = defaultClass?.sections?.[0]?.roomNumber || '';

    setFormAcademicYear(selectedYear !== 'ALL' ? selectedYear : '2026-2027');
    setFormClassId(defaultClassId);
    setFormSection(defaultSection);
    setFormDayOfWeek(initialDay || (selectedDayTab !== 'ALL' ? (selectedDayTab as DayOfWeek) : 'MONDAY'));
    setFormStartTime(initialTime?.start || '09:00');
    setFormEndTime(initialTime?.end || '09:45');
    setFormSubject('');
    setFormTeacherId('');
    setFormRoomNumber(defaultRoom);
    setFormPeriodType('TEACHING');
    setFormNotes('');

    setShowModal(true);
  };

  // Open modal in "Edit" mode
  const handleOpenEditModal = (period: TimetablePeriod) => {
    setEditingPeriod(period);
    setModalError(null);

    setFormAcademicYear(period.academicYear);
    setFormClassId(period.classId);
    setFormSection(period.section);
    setFormDayOfWeek(period.dayOfWeek);
    setFormStartTime(period.startTime);
    setFormEndTime(period.endTime);
    setFormSubject(period.subject);
    setFormTeacherId(period.teacherId || '');
    setFormRoomNumber(period.roomNumber || '');
    setFormPeriodType(period.periodType);
    setFormNotes(period.notes || '');

    setShowModal(true);
  };

  // Auto-fill room when section changes in modal
  const handleModalClassChange = (newClassId: string) => {
    setFormClassId(newClassId);
    const targetClass = classes.find((c) => c.id === newClassId);
    if (targetClass && targetClass.sections && targetClass.sections.length > 0) {
      const firstSec = targetClass.sections[0];
      setFormSection(firstSec.name);
      if (firstSec.roomNumber) {
        setFormRoomNumber(firstSec.roomNumber);
      }
    }
  };

  const handleModalSectionChange = (newSectionName: string) => {
    setFormSection(newSectionName);
    const matchedSec = availableSectionsForModal.find(
      (s) => s.name.toUpperCase() === newSectionName.toUpperCase()
    );
    if (matchedSec && matchedSec.roomNumber) {
      setFormRoomNumber(matchedSec.roomNumber);
    }
  };

  // Auto-suggest subject when teacher is selected
  const handleModalTeacherChange = (teacherId: string) => {
    setFormTeacherId(teacherId);
    if (!teacherId) return;

    const teacher = teachers.find((t) => t.id === teacherId);
    if (teacher && teacher.assignedClasses && teacher.assignedClasses.length > 0) {
      // If teacher has an assignment matching current class & section, auto-fill subject
      const matchingAssignment = teacher.assignedClasses.find(
        (ac) =>
          ac.className === currentModalClass?.name &&
          ac.section.toUpperCase() === formSection.toUpperCase()
      );
      if (matchingAssignment && matchingAssignment.subject && !formSubject) {
        setFormSubject(matchingAssignment.subject);
      } else if (!formSubject && teacher.assignedClasses[0]?.subject) {
        setFormSubject(teacher.assignedClasses[0].subject);
      }
    }
  };

  // Submit modal form
  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formClassId) {
      setModalError('Please select a parent class.');
      return;
    }
    if (!formSection.trim()) {
      setModalError('Please specify the class section.');
      return;
    }
    if (!formSubject.trim()) {
      setModalError('Please provide a subject or activity title.');
      return;
    }

    // Time validation: start < end
    const [startH, startM] = formStartTime.split(':').map(Number);
    const [endH, endM] = formEndTime.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (endMins <= startMins) {
      setModalError(`End time (${formEndTime}) must be strictly after start time (${formStartTime}).`);
      return;
    }

    try {
      setModalSubmitting(true);

      const targetTeacher = teachers.find((t) => t.id === formTeacherId);

      if (editingPeriod) {
        const payload: UpdatePeriodPayload = {
          academicYear: formAcademicYear,
          classId: formClassId,
          section: formSection,
          dayOfWeek: formDayOfWeek,
          startTime: formStartTime,
          endTime: formEndTime,
          subject: formSubject.trim(),
          teacherId: formTeacherId ? formTeacherId : null,
          teacherName: targetTeacher?.fullName || '',
          roomNumber: formRoomNumber.trim(),
          periodType: formPeriodType,
          notes: formNotes.trim(),
        };

        const res = await adminApi.updateTimetablePeriod(editingPeriod.id, payload);
        showToastSuccess(`Period "${res.data.subject}" updated successfully.`);
      } else {
        const payload: CreatePeriodPayload = {
          academicYear: formAcademicYear,
          classId: formClassId,
          section: formSection,
          dayOfWeek: formDayOfWeek,
          startTime: formStartTime,
          endTime: formEndTime,
          subject: formSubject.trim(),
          teacherId: formTeacherId || undefined,
          teacherName: targetTeacher?.fullName || '',
          roomNumber: formRoomNumber.trim(),
          periodType: formPeriodType,
          notes: formNotes.trim(),
        };

        const res = await adminApi.createTimetablePeriod(payload);
        showToastSuccess(
          `Period "${res.data.subject}" scheduled for ${res.data.className}-${res.data.section}.`
        );
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      console.error('Failed to save period:', err);
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to save timetable period. Please check conflicts and try again.';
      setModalError(errMsg);
    } finally {
      setModalSubmitting(false);
    }
  };

  // Delete period action
  const handleDeletePeriod = (period: TimetablePeriod) => {
    setConfirmModal({
      title: 'Remove Timetable Period',
      description: `Are you sure you want to remove ${period.subject} (${period.formattedTime}) for ${period.className}-${period.section} on ${period.dayOfWeek}? This will free up the classroom and teacher slot.`,
      onConfirm: async () => {
        try {
          setConfirming(true);
          await adminApi.deleteTimetablePeriod(period.id);
          showToastSuccess(`Period "${period.subject}" removed successfully.`);
          setConfirmModal(null);
          fetchData();
        } catch (err: any) {
          console.error('Failed to delete period:', err);
          showToastError(
            err?.response?.data?.error?.message ||
              err?.response?.data?.message ||
              'Failed to delete timetable period.'
          );
        } finally {
          setConfirming(false);
        }
      },
    });
  };

  // Filter periods by search term
  const displayedPeriods = periods.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.subject.toLowerCase().includes(term) ||
      p.className.toLowerCase().includes(term) ||
      p.section.toLowerCase().includes(term) ||
      (p.teacherName && p.teacherName.toLowerCase().includes(term)) ||
      (p.roomNumber && p.roomNumber.toLowerCase().includes(term)) ||
      p.dayOfWeek.toLowerCase().includes(term)
    );
  });

  // Aggregate stats
  const totalPeriodsCount = displayedPeriods.length;
  const teachingPeriodsCount = displayedPeriods.filter((p) => p.periodType === 'TEACHING').length;
  const breakPeriodsCount = displayedPeriods.filter(
    (p) => p.periodType === 'BREAK' || p.periodType === 'ASSEMBLY'
  ).length;
  const distinctRoomsCount = new Set(
    displayedPeriods.map((p) => p.roomNumber?.trim().toLowerCase()).filter(Boolean)
  ).size;

  return (
    <AdminLayout>
      <div className="admin-timetable-page-container">
        {/* Toast Feedbacks */}
        {successToast && (
          <div className="admin-toast-success" role="status">
            <CheckCircle2 size={18} />
            <span>{successToast}</span>
          </div>
        )}
        {toastError && (
          <div className="admin-toast-error" role="alert">
            <AlertCircle size={18} />
            <span>{toastError}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="admin-timetable-header-wrap">
          <div className="admin-timetable-title-group">
            <h1>Timetable Management</h1>
            <p>
              Configure weekly class schedules, lecture timings, classroom allocations, and faculty periods with real-time conflict prevention.
            </p>
          </div>

          <div className="admin-timetable-header-actions">
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={fetchData}
              disabled={loading}
              title="Refresh Timetable"
            >
              <RotateCw size={15} className={loading ? 'admin-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              className="admin-btn-primary-action"
              onClick={() => handleOpenAddModal()}
              id="admin-add-period-btn"
            >
              <Plus size={16} />
              <span>Add Period</span>
            </button>
          </div>
        </div>

        {/* Metric Summary Cards (4 equal-width responsive cards) */}
        <div className="admin-timetable-summary-grid">
          <div className="admin-timetable-card-stat">
            <div className="admin-timetable-card-stat-info">
              <span className="admin-card-stat-label">Scheduled Periods</span>
              <span className="admin-card-stat-value">{totalPeriodsCount}</span>
            </div>
            <div className="admin-card-stat-icon-wrap admin-stat-icon-blue">
              <CalendarDays size={22} />
            </div>
          </div>

          <div className="admin-timetable-card-stat">
            <div className="admin-timetable-card-stat-info">
              <span className="admin-card-stat-label">Teaching Lectures</span>
              <span className="admin-card-stat-value">{teachingPeriodsCount}</span>
            </div>
            <div className="admin-card-stat-icon-wrap admin-stat-icon-sage">
              <BookOpen size={22} />
            </div>
          </div>

          <div className="admin-timetable-card-stat">
            <div className="admin-timetable-card-stat-info">
              <span className="admin-card-stat-label">Breaks & Assemblies</span>
              <span className="admin-card-stat-value">{breakPeriodsCount}</span>
            </div>
            <div className="admin-card-stat-icon-wrap admin-stat-icon-amber">
              <Clock size={22} />
            </div>
          </div>

          <div className="admin-timetable-card-stat">
            <div className="admin-timetable-card-stat-info">
              <span className="admin-card-stat-label">Rooms Allocated</span>
              <span className="admin-card-stat-value">{distinctRoomsCount}</span>
            </div>
            <div className="admin-card-stat-icon-wrap admin-stat-icon-purple">
              <DoorOpen size={22} />
            </div>
          </div>
        </div>

        {/* Filter and Control Toolbar */}
        <div className="admin-timetable-toolbar">
          <div className="admin-timetable-controls-row">
            {/* Academic Year Selector */}
            <div className="admin-filter-group admin-filter-group-year">
              <label htmlFor="filter-academic-year" className="admin-filter-label">Academic Year</label>
              <select
                id="filter-academic-year"
                className="admin-filter-select-control"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setSelectedClassId('ALL');
                  setSelectedSection('ALL');
                }}
              >
                {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Class / Grade Selector */}
            <div className="admin-filter-group admin-filter-group-class">
              <label htmlFor="filter-class" className="admin-filter-label">Class / Grade</label>
              <select
                id="filter-class"
                className="admin-filter-select-control"
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSection('ALL');
                }}
              >
                <option value="ALL">All Classes & Grades</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.academicYear})
                  </option>
                ))}
              </select>
            </div>

            {/* Section Selector (Filtered by Class) */}
            <div className="admin-filter-group admin-filter-group-section">
              <label htmlFor="filter-section" className="admin-filter-label">Section</label>
              <select
                id="filter-section"
                className="admin-filter-select-control"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={selectedClassId === 'ALL'}
              >
                <option value="ALL">All Sections</option>
                {availableSectionsForFilter.map((sec) => (
                  <option key={sec.id} value={sec.name}>
                    Section {sec.name} {sec.roomNumber ? `(${sec.roomNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div className="admin-filter-group admin-filter-group-search">
              <label htmlFor="filter-search" className="admin-filter-label">Search Schedule</label>
              <div className="admin-search-input-box">
                <Search size={15} className="admin-search-box-icon" />
                <input
                  id="filter-search"
                  type="text"
                  className="admin-search-box-input"
                  placeholder="Search subject, faculty, room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="admin-search-box-clear"
                    onClick={() => setSearchTerm('')}
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="admin-filter-group admin-filter-group-toggle">
              <label className="admin-filter-label">Layout View</label>
              <div className="admin-view-toggle">
                <button
                  type="button"
                  className={`admin-view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Weekly Grid View"
                >
                  <Grid3X3 size={14} />
                  <span>Weekly</span>
                </button>
                <button
                  type="button"
                  className={`admin-view-toggle-btn ${viewMode === 'tabs' ? 'active' : ''}`}
                  onClick={() => setViewMode('tabs')}
                  title="Daily List View"
                >
                  <ListFilter size={14} />
                  <span>Day View</span>
                </button>
              </div>
            </div>
          </div>

          {/* Weekday Filter Ribbon */}
          <div className="admin-timetable-day-filter-bar">
            <span className="admin-day-filter-hint">Day Filter:</span>
            <div className="admin-day-filter-pills">
              <button
                type="button"
                className={`admin-day-pill-btn ${selectedDayTab === 'ALL' ? 'active' : ''}`}
                onClick={() => setSelectedDayTab('ALL')}
              >
                All Days <span className="admin-day-pill-badge">{periods.length}</span>
              </button>
              {DAYS_OF_WEEK.map((day) => {
                const dayCount = periods.filter((p) => p.dayOfWeek === day).length;
                return (
                  <button
                    key={day}
                    type="button"
                    className={`admin-day-pill-btn ${selectedDayTab === day ? 'active' : ''}`}
                    onClick={() => setSelectedDayTab(day)}
                  >
                    {day.charAt(0) + day.slice(1).toLowerCase()}
                    <span className="admin-day-pill-badge">{dayCount}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="admin-error-banner" role="alert">
            <AlertCircle size={20} />
            <div style={{ flex: 1 }}>
              <div className="admin-error-title">Error Loading Timetable</div>
              <p>{error}</p>
            </div>
            <button type="button" className="admin-btn-secondary" onClick={fetchData}>
              Try Again
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="admin-timetable-loading-wrap">
            <div className="admin-skeleton-pulse" style={{ height: 120, borderRadius: 12 }} />
            <div className="admin-skeleton-pulse" style={{ height: 350, borderRadius: 12 }} />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && displayedPeriods.length === 0 && (
          <div className="admin-timetable-empty-card">
            <div className="admin-timetable-empty-icon">
              <Calendar size={28} />
            </div>
            <h3 className="admin-timetable-empty-title">No Timetable Periods Configured</h3>
            <p className="admin-timetable-empty-desc">
              {searchTerm || selectedClassId !== 'ALL' || selectedDayTab !== 'ALL'
                ? 'No periods match the current search filters. Try resetting the filters or add a new schedule slot.'
                : 'No academic periods have been set up for this academic year yet. Start by scheduling your first period.'}
            </p>
            <button
              type="button"
              className="admin-btn-primary-action"
              onClick={() => handleOpenAddModal()}
              style={{ marginTop: 8 }}
            >
              <Plus size={16} />
              <span>Schedule First Period</span>
            </button>
          </div>
        )}

        {/* Content: Weekly Grid View */}
        {!loading && !error && displayedPeriods.length > 0 && viewMode === 'grid' && (
          <div className="admin-weekly-scroll-container">
            <div className="admin-weekly-timetable-grid">
              {DAYS_OF_WEEK.filter((d) => selectedDayTab === 'ALL' || selectedDayTab === d).map((day) => {
                const dayPeriods = displayedPeriods
                  .filter((p) => p.dayOfWeek === day)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                return (
                  <div key={day} className="admin-timetable-day-col">
                    {/* Column Header */}
                    <div className="admin-day-col-header">
                      <div>
                        <div className="admin-day-name">
                          {day.charAt(0) + day.slice(1).toLowerCase()}
                        </div>
                        <div className="admin-day-slots-badge">
                          {dayPeriods.length} {dayPeriods.length === 1 ? 'Period' : 'Periods'}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="admin-col-add-btn"
                        onClick={() => handleOpenAddModal(day)}
                        title={`Add period on ${day}`}
                        aria-label={`Add period on ${day}`}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Day Period Cards */}
                    <div className="admin-day-periods-stack">
                      {dayPeriods.length === 0 ? (
                        <div className="admin-col-empty-slot">
                          <Clock size={16} />
                          <span>No periods scheduled</span>
                          <button
                            type="button"
                            className="admin-btn-link"
                            onClick={() => handleOpenAddModal(day)}
                          >
                            + Add
                          </button>
                        </div>
                      ) : (
                        dayPeriods.map((period) => (
                          <div
                            key={period.id}
                            className={`admin-period-card ${
                              period.periodType === 'BREAK'
                                ? 'period-card-break'
                                : period.periodType === 'ASSEMBLY'
                                ? 'period-card-assembly'
                                : period.periodType === 'ACTIVITY'
                                ? 'period-card-activity'
                                : 'period-card-teaching'
                            }`}
                          >
                            {/* Card Top: Time and Type Badge */}
                            <div className="admin-period-top">
                              <div className="admin-period-time">
                                <Clock size={12} />
                                <span>{period.formattedTime || `${period.startTime} - ${period.endTime}`}</span>
                              </div>
                              <span
                                className={`admin-period-type-pill ${
                                  period.periodType === 'BREAK'
                                    ? 'pill-break'
                                    : period.periodType === 'ASSEMBLY'
                                    ? 'pill-assembly'
                                    : period.periodType === 'ACTIVITY'
                                    ? 'pill-activity'
                                    : 'pill-teaching'
                                }`}
                              >
                                {period.periodType === 'BREAK'
                                  ? 'Break'
                                  : period.periodType === 'ASSEMBLY'
                                  ? 'Assembly'
                                  : period.periodType === 'ACTIVITY'
                                  ? 'Lab'
                                  : 'Lecture'}
                              </span>
                            </div>

                            {/* Subject Name */}
                            <div className="admin-period-subject">{period.subject}</div>

                            {/* Meta: Class, Section, Teacher, Room */}
                            <div className="admin-period-meta-grid">
                              <div className="admin-period-class-badge">
                                <Layers size={11} />
                                <span>
                                  {period.className}-{period.section}
                                </span>
                              </div>

                              {period.roomNumber && (
                                <div className="admin-period-room-badge">
                                  <DoorOpen size={11} />
                                  <span>{period.roomNumber}</span>
                                </div>
                              )}
                            </div>

                            {period.teacherName && (
                              <div className="admin-period-teacher">
                                <UserCheck size={12} />
                                <span>{period.teacherName}</span>
                              </div>
                            )}

                            {/* Card Hover Action Buttons */}
                            <div className="admin-period-actions">
                              <button
                                type="button"
                                className="admin-period-action-btn edit"
                                onClick={() => handleOpenEditModal(period)}
                                title="Edit period"
                                aria-label="Edit period"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                type="button"
                                className="admin-period-action-btn delete"
                                onClick={() => handleDeletePeriod(period)}
                                title="Remove period"
                                aria-label="Remove period"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Content: List / Daily Tab View */}
        {!loading && !error && displayedPeriods.length > 0 && viewMode === 'tabs' && (
          <div className="admin-timetable-table-card">
            <div className="admin-table-responsive" style={{ overflowX: 'auto' }}>
              <table className="admin-admissions-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time Interval</th>
                    <th>Class & Section</th>
                    <th>Subject / Module</th>
                    <th>Type</th>
                    <th>Assigned Faculty</th>
                    <th>Room</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedPeriods
                    .sort((a, b) => {
                      const dayOrder = DAYS_OF_WEEK.indexOf(a.dayOfWeek) - DAYS_OF_WEEK.indexOf(b.dayOfWeek);
                      if (dayOrder !== 0) return dayOrder;
                      return a.startTime.localeCompare(b.startTime);
                    })
                    .map((p) => (
                      <tr key={p.id}>
                        <td>
                          <span className="admin-day-label">
                            {p.dayOfWeek.charAt(0) + p.dayOfWeek.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                            <Clock size={13} style={{ color: 'var(--admin-text-muted)' }} />
                            <span>{p.formattedTime || `${p.startTime} - ${p.endTime}`}</span>
                          </div>
                        </td>
                        <td>
                          <span className="admin-class-section-tag">
                            {p.className} - {p.section}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                            {p.subject}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`admin-period-type-pill ${
                              p.periodType === 'BREAK'
                                ? 'pill-break'
                                : p.periodType === 'ASSEMBLY'
                                ? 'pill-assembly'
                                : p.periodType === 'ACTIVITY'
                                ? 'pill-activity'
                                : 'pill-teaching'
                            }`}
                          >
                            {p.periodType}
                          </span>
                        </td>
                        <td>
                          {p.teacherName ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <UserCheck size={14} style={{ color: '#10b981' }} />
                              <span>{p.teacherName}</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td>
                          {p.roomNumber ? (
                            <span className="admin-room-pill">{p.roomNumber}</span>
                          ) : (
                            <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              type="button"
                              className="admin-table-action-btn"
                              onClick={() => handleOpenEditModal(p)}
                              title="Edit Period"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className="admin-table-action-btn delete"
                              onClick={() => handleDeletePeriod(p)}
                              title="Remove Period"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add / Edit Period Modal Dialog */}
        {showModal && (
          <div
            className="admin-modal-backdrop"
            onClick={() => !modalSubmitting && setShowModal(false)}
            role="presentation"
          >
            <div
              className="admin-modal-card admin-timetable-modal-card"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="period-modal-title"
            >
              {/* Modal Header: Fixed */}
              <div className="admin-modal-header admin-timetable-modal-header">
                <div>
                  <h3 id="period-modal-title" className="admin-modal-title">
                    {editingPeriod ? 'Edit Timetable Period' : 'Schedule New Period'}
                  </h3>
                  <p className="admin-modal-subtitle">
                    {editingPeriod
                      ? 'Modify time, faculty allotment, or classroom for this slot.'
                      : 'Define subject, teacher, classroom, and timings for the period.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => setShowModal(false)}
                  disabled={modalSubmitting}
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSubmitModal} className="admin-timetable-modal-form">
                <div className="admin-modal-body admin-timetable-modal-body">
                  {modalError && (
                    <div className="admin-modal-error-banner" role="alert">
                      <AlertCircle size={18} />
                      <span>{modalError}</span>
                    </div>
                  )}

                  {/* Row 1: Academic Year & Period Type */}
                  <div className="admin-form-row-2" style={{ marginBottom: 14 }}>
                    <div>
                      <label className="admin-form-label">Academic Year *</label>
                      <select
                        className="admin-form-select"
                        value={formAcademicYear}
                        onChange={(e) => setFormAcademicYear(e.target.value)}
                        required
                      >
                        {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="admin-form-label">Period Type *</label>
                      <select
                        className="admin-form-select"
                        value={formPeriodType}
                        onChange={(e) => setFormPeriodType(e.target.value as PeriodType)}
                        required
                      >
                        {PERIOD_TYPES.map((pt) => (
                          <option key={pt.value} value={pt.value}>
                            {pt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Parent Class & Section (Dynamic Filtering) */}
                  <div className="admin-form-row-2" style={{ marginBottom: 14 }}>
                    <div>
                      <label className="admin-form-label">Class / Grade *</label>
                      <select
                        className="admin-form-select"
                        value={formClassId}
                        onChange={(e) => handleModalClassChange(e.target.value)}
                        required
                      >
                        <option value="" disabled>
                          Select Class
                        </option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.academicYear})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="admin-form-label">Section *</label>
                      <select
                        className="admin-form-select"
                        value={formSection}
                        onChange={(e) => handleModalSectionChange(e.target.value)}
                        required
                      >
                        {availableSectionsForModal.length > 0 ? (
                          availableSectionsForModal.map((s) => (
                            <option key={s.id} value={s.name}>
                              Section {s.name} {s.roomNumber ? `(${s.roomNumber})` : ''}
                            </option>
                          ))
                        ) : (
                          <option value="A">Section A</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Day of Week */}
                  <div style={{ marginBottom: 14 }}>
                    <label className="admin-form-label">Day of the Week *</label>
                    <select
                      className="admin-form-select"
                      value={formDayOfWeek}
                      onChange={(e) => setFormDayOfWeek(e.target.value as DayOfWeek)}
                      required
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          {d.charAt(0) + d.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Row 4: Start Time & End Time */}
                  <div className="admin-form-row-2" style={{ marginBottom: 14 }}>
                    <div>
                      <label className="admin-form-label">Start Time (24h) *</label>
                      <input
                        type="time"
                        className="admin-form-input"
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="admin-form-label">End Time (24h) *</label>
                      <input
                        type="time"
                        className="admin-form-input"
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Preset quick time slots helper */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', marginBottom: 6 }}>
                      Quick Timing Presets:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {DEFAULT_TIME_SLOTS.slice(0, 5).map((ts) => (
                        <button
                          key={ts.label}
                          type="button"
                          className="admin-preset-time-chip"
                          onClick={() => {
                            setFormStartTime(ts.start);
                            setFormEndTime(ts.end);
                          }}
                        >
                          {ts.label} ({ts.start} - {ts.end})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Row 5: Subject Name */}
                  <div style={{ marginBottom: 14 }}>
                    <label className="admin-form-label">Subject / Activity Name *</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. Mathematics, Physics, Morning Assembly, Lunch Break"
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      required
                    />
                  </div>

                  {/* Row 6: Assigned Faculty Teacher */}
                  <div style={{ marginBottom: 14 }}>
                    <label className="admin-form-label">Assigned Teacher (Optional for Breaks)</label>
                    <select
                      className="admin-form-select"
                      value={formTeacherId}
                      onChange={(e) => handleModalTeacherChange(e.target.value)}
                    >
                      <option value="">No Teacher (Recess / Break / Assembly)</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName} ({t.department} - {t.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Row 7: Classroom / Room Allocation */}
                  <div style={{ marginBottom: 14 }}>
                    <label className="admin-form-label">Classroom / Room Number (Optional)</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. Room 204, Science Wing Lab B"
                      value={formRoomNumber}
                      onChange={(e) => setFormRoomNumber(e.target.value)}
                    />
                  </div>

                  {/* Row 8: Optional Notes */}
                  <div style={{ marginBottom: 8 }}>
                    <label className="admin-form-label">Additional Instructions / Notes</label>
                    <textarea
                      className="admin-form-textarea"
                      rows={2}
                      placeholder="e.g. Bring lab equipment, alternating bi-weekly schedule"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Fixed Footer: Cancel on left, Save Period on right */}
                <div className="admin-modal-footer admin-timetable-modal-footer">
                  <button
                    type="button"
                    className="admin-btn-secondary admin-timetable-modal-btn"
                    onClick={() => setShowModal(false)}
                    disabled={modalSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-btn-primary-action admin-timetable-modal-btn"
                    disabled={modalSubmitting}
                  >
                    {modalSubmitting ? (
                      <>
                        <RotateCw size={14} className="admin-spin" />
                        <span>Validating Conflicts...</span>
                      </>
                    ) : (
                      <span>{editingPeriod ? 'Save Changes' : 'Save Period'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmModal && (
          <div
            className="admin-modal-backdrop"
            onClick={() => !confirming && setConfirmModal(null)}
            role="presentation"
          >
            <div
              className="admin-modal-card admin-confirm-modal-card"
              onClick={(e) => e.stopPropagation()}
              role="alertdialog"
              aria-modal="true"
            >
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">{confirmModal.title}</h3>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => setConfirmModal(null)}
                  disabled={confirming}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="admin-modal-body">
                <p className="admin-modal-description">{confirmModal.description}</p>
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setConfirmModal(null)}
                  disabled={confirming}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-danger"
                  onClick={confirmModal.onConfirm}
                  disabled={confirming}
                >
                  {confirming ? 'Removing...' : 'Confirm Remove'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
