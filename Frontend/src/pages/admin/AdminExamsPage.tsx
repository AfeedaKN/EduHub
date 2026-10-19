import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Award,
  Calendar,
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
  DoorOpen,
  Layers,
  FileText,
  CalendarCheck2,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminApi } from '../../api/adminApi';
import { getApiErrorMessage } from '../../api/axiosClient';
import {
  Exam,
  ExamType,
  ExamStatus,
  ExamSchedule,
  ExamsSummaryCounts,
  CreateExamPayload,
  UpdateExamPayload,
  CreateSchedulePayload,
  UpdateSchedulePayload,
  EXAM_TYPE_LABELS,
} from '../../types/exam.types';
import { ClassDetail } from '../../types/admin.types';

const ACADEMIC_YEAR_OPTIONS = ['2026-2027', '2027-2028', '2025-2026'];

const EXAM_TYPE_OPTIONS: { value: ExamType; label: string }[] = [
  { value: 'UNIT_TEST', label: 'Unit Test' },
  { value: 'FIRST_TERM', label: 'First Term' },
  { value: 'MID_TERM', label: 'Mid-Term' },
  { value: 'SECOND_TERM', label: 'Second Term' },
  { value: 'ANNUAL_EXAM', label: 'Annual Exam' },
  { value: 'OTHER', label: 'Other' },
];

const QUICK_TIME_SLOTS = [
  { start: '09:00', end: '12:00', label: 'Morning Session (3h)' },
  { start: '09:30', end: '12:30', label: 'Standard Morning (3h)' },
  { start: '10:00', end: '12:00', label: 'Morning Short (2h)' },
  { start: '13:30', end: '16:30', label: 'Afternoon Session (3h)' },
  { start: '14:00', end: '16:00', label: 'Afternoon Short (2h)' },
];

export const AdminExamsPage: React.FC = () => {
  const { id: routeExamId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Core Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [summary, setSummary] = useState<ExamsSummaryCounts>({
    totalExams: 0,
    upcomingExams: 0,
    completedExams: 0,
    publishedResults: 0,
  });
  const [classes, setClasses] = useState<ClassDetail[]>([]);

  // Filter States
  const [selectedYear, setSelectedYear] = useState<string>('2026-2027');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Toast Notifications
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setToastSuccess(msg);
    setTimeout(() => setToastSuccess(null), 4000);
  };

  const showError = (msg: string) => {
    setToastError(msg);
    setTimeout(() => setToastError(null), 6000);
  };

  // Exam Modal (Create / Edit)
  const [showExamModal, setShowExamModal] = useState<boolean>(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examSubmitting, setExamSubmitting] = useState<boolean>(false);
  const [examModalError, setExamModalError] = useState<string | null>(null);

  // Exam Form Fields
  const [formExamName, setFormExamName] = useState<string>('');
  const [formExamType, setFormExamType] = useState<ExamType>('MID_TERM');
  const [formAcademicYear, setFormAcademicYear] = useState<string>('2026-2027');
  const [formApplicableClassIds, setFormApplicableClassIds] = useState<string[]>([]);
  const [formStartDate, setFormStartDate] = useState<string>('');
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formStatus, setFormStatus] = useState<ExamStatus>('DRAFT');

  // Schedule Drawer / Modal
  const [activeExamForSchedule, setActiveExamForSchedule] = useState<Exam | null>(null);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState<boolean>(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);

  // Schedule Item Add / Edit Modal
  const [showScheduleFormModal, setShowScheduleFormModal] = useState<boolean>(false);
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null);
  const [scheduleSubmitting, setScheduleSubmitting] = useState<boolean>(false);
  const [scheduleFormError, setScheduleFormError] = useState<string | null>(null);

  // Schedule Form Fields
  const [schClassId, setSchClassId] = useState<string>('');
  const [schSection, setSchSection] = useState<string>('');
  const [schSubject, setSchSubject] = useState<string>('');
  const [schExamDate, setSchExamDate] = useState<string>('');
  const [schStartTime, setSchStartTime] = useState<string>('09:30');
  const [schEndTime, setSchEndTime] = useState<string>('12:30');
  const [schMaxMarks, setSchMaxMarks] = useState<number>(100);
  const [schPassingMarks, setSchPassingMarks] = useState<number>(40);
  const [schRoomNumber, setSchRoomNumber] = useState<string>('');
  const [schNotes, setSchNotes] = useState<string>('');

  // Valid Subjects for selected Class & Section
  const [validSubjects, setValidSubjects] = useState<string[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(false);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirming, setConfirming] = useState<boolean>(false);

  // ==========================================
  // Data Fetching
  // ==========================================

  const fetchClasses = async () => {
    try {
      const res = await adminApi.getClasses({ status: 'ACTIVE' });
      if (res.success && res.data) {
        setClasses(res.data);
      }
    } catch (err) {
      console.error('Failed to load classes for exams:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [examsRes, summaryRes] = await Promise.all([
        adminApi.getExams({
          academicYear: selectedYear === 'ALL' ? undefined : selectedYear,
          examType: selectedType === 'ALL' ? undefined : selectedType,
          status: selectedStatus === 'ALL' ? undefined : selectedStatus,
          search: searchTerm.trim() ? searchTerm.trim() : undefined,
        }),
        adminApi.getExamsSummary({
          academicYear: selectedYear === 'ALL' ? undefined : selectedYear,
        }),
      ]);

      const examsList = examsRes.data || [];
      setExams(examsList);
      setSummary(
        summaryRes.data || {
          totalExams: 0,
          upcomingExams: 0,
          completedExams: 0,
          publishedResults: 0,
        }
      );

      // If route param specified, open that exam's schedule
      if (routeExamId) {
        const target = examsList.find((e) => e.id === routeExamId);
        if (target) {
          openScheduleDrawer(target);
        }
      }
    } catch (err: unknown) {
      console.error('Failed to fetch exams data:', err);
      setError(
        getApiErrorMessage(err, 'Failed to load examinations. Please refresh and try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedType, selectedStatus, searchTerm]);

  // Handle route param when exams update
  useEffect(() => {
    if (routeExamId && exams.length > 0 && !activeExamForSchedule) {
      const target = exams.find((e) => e.id === routeExamId);
      if (target) {
        openScheduleDrawer(target);
      }
    }
  }, [routeExamId, exams]);

  // ==========================================
  // Exam Create / Edit Actions
  // ==========================================

  const handleOpenCreateExam = () => {
    setEditingExam(null);
    setExamModalError(null);
    setFormExamName('');
    setFormExamType('MID_TERM');
    setFormAcademicYear(selectedYear === 'ALL' ? '2026-2027' : selectedYear);
    setFormApplicableClassIds(classes.map((c) => c.id));
    setFormStartDate(new Date().toISOString().split('T')[0]);
    const endDateDefault = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    setFormEndDate(endDateDefault);
    setFormDescription('');
    setFormStatus('DRAFT');
    setShowExamModal(true);
  };

  const handleOpenEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setExamModalError(null);
    setFormExamName(exam.name);
    setFormExamType(exam.examType);
    setFormAcademicYear(exam.academicYear);
    setFormApplicableClassIds(exam.applicableClasses.map((ac) => ac.classId));
    setFormStartDate(exam.startDate);
    setFormEndDate(exam.endDate);
    setFormDescription(exam.description || '');
    setFormStatus(exam.status);
    setShowExamModal(true);
  };

  const toggleClassSelection = (classId: string) => {
    setFormApplicableClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const selectAllClasses = () => {
    setFormApplicableClassIds(classes.map((c) => c.id));
  };

  const clearAllClasses = () => {
    setFormApplicableClassIds([]);
  };

  const handleSubmitExamForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setExamModalError(null);

    if (!formExamName.trim()) {
      setExamModalError('Exam name is required.');
      return;
    }
    if (formApplicableClassIds.length === 0) {
      setExamModalError('Please select at least one applicable class for this exam.');
      return;
    }
    if (!formStartDate || !formEndDate) {
      setExamModalError('Both start date and end date are required.');
      return;
    }
    if (new Date(formEndDate) < new Date(formStartDate)) {
      setExamModalError('End date cannot be earlier than start date.');
      return;
    }

    setExamSubmitting(true);
    try {
      if (editingExam) {
        const payload: UpdateExamPayload = {
          name: formExamName.trim(),
          examType: formExamType,
          academicYear: formAcademicYear,
          applicableClassIds: formApplicableClassIds,
          startDate: formStartDate,
          endDate: formEndDate,
          description: formDescription.trim(),
          status: formStatus,
        };
        const res = await adminApi.updateExam(editingExam.id, payload);
        if (res.success) {
          showSuccess(`Examination "${formExamName}" updated successfully.`);
          setShowExamModal(false);
          fetchData();
        }
      } else {
        const payload: CreateExamPayload = {
          name: formExamName.trim(),
          examType: formExamType,
          academicYear: formAcademicYear,
          applicableClassIds: formApplicableClassIds,
          startDate: formStartDate,
          endDate: formEndDate,
          description: formDescription.trim(),
          status: formStatus,
        };
        const res = await adminApi.createExam(payload);
        if (res.success) {
          showSuccess(`Examination "${formExamName}" created successfully.`);
          setShowExamModal(false);
          fetchData();
        }
      }
    } catch (err: unknown) {
      console.error('Failed to save exam:', err);
      setExamModalError(
        getApiErrorMessage(err, 'Failed to save examination. Please verify input and try again.')
      );
    } finally {
      setExamSubmitting(false);
    }
  };

  const handleDeleteExam = (exam: Exam) => {
    setConfirmModal({
      title: `Delete Exam: ${exam.name}?`,
      description: `This will permanently remove "${exam.name}" and all of its ${exam.scheduledSubjectsCount} scheduled subject examinations. This action cannot be undone.`,
      onConfirm: async () => {
        setConfirming(true);
        try {
          await adminApi.deleteExam(exam.id);
          showSuccess(`Examination "${exam.name}" deleted successfully.`);
          setConfirmModal(null);
          if (activeExamForSchedule?.id === exam.id) {
            closeScheduleDrawer();
          }
          fetchData();
        } catch (err: unknown) {
          showError(getApiErrorMessage(err, 'Failed to delete examination.'));
        } finally {
          setConfirming(false);
        }
      },
    });
  };

  // ==========================================
  // Schedule Drawer & Subject Management
  // ==========================================

  const openScheduleDrawer = async (exam: Exam) => {
    setActiveExamForSchedule(exam);
    setSchedulesLoading(true);
    setSchedulesError(null);
    try {
      const res = await adminApi.getExamSchedules(exam.id);
      setSchedules(res.data || []);
    } catch (err: unknown) {
      console.error('Failed to load schedules for exam:', err);
      setSchedulesError(
        getApiErrorMessage(err, 'Failed to load subject schedules for this examination.')
      );
    } finally {
      setSchedulesLoading(false);
    }
  };

  const closeScheduleDrawer = () => {
    setActiveExamForSchedule(null);
    setSchedules([]);
    if (routeExamId) {
      navigate('/admin/exams', { replace: true });
    }
  };

  // Get available sections for selected class in schedule modal
  const availableSectionsForModal = useMemo(() => {
    if (!schClassId) return [];
    const cls = classes.find((c) => c.id === schClassId);
    return cls?.sections || [];
  }, [schClassId, classes]);

  // Load valid subjects dynamically when class and section change
  const fetchValidSubjectsForSelection = async (classId: string, section: string) => {
    if (!classId || !section) {
      setValidSubjects([]);
      return;
    }
    setLoadingSubjects(true);
    try {
      const res = await adminApi.getValidSubjectsForClassSection(
        classId,
        section,
        activeExamForSchedule?.academicYear
      );
      const subList = res.data || [];
      setValidSubjects(subList);
      // Auto-select first subject if not set or not in list
      if (subList.length > 0 && (!schSubject || !subList.includes(schSubject))) {
        setSchSubject(subList[0]);
      }
    } catch (err) {
      console.error('Failed to fetch valid subjects for class/section:', err);
      setValidSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleOpenAddSchedule = () => {
    if (!activeExamForSchedule) return;
    setEditingSchedule(null);
    setScheduleFormError(null);

    // Pick first applicable class
    const firstClass = activeExamForSchedule.applicableClasses[0];
    const initialClassId = firstClass ? firstClass.classId : '';
    setSchClassId(initialClassId);

    const targetClass = classes.find((c) => c.id === initialClassId);
    const initialSection = targetClass?.sections && targetClass.sections.length > 0
      ? targetClass.sections[0].name
      : 'A';
    setSchSection(initialSection);

    const initialRoom = targetClass?.sections?.[0]?.roomNumber || '';
    setSchRoomNumber(initialRoom);

    setSchExamDate(activeExamForSchedule.startDate);
    setSchStartTime('09:30');
    setSchEndTime('12:30');
    setSchMaxMarks(100);
    setSchPassingMarks(40);
    setSchNotes('');
    setSchSubject('');

    setShowScheduleFormModal(true);

    if (initialClassId && initialSection) {
      fetchValidSubjectsForSelection(initialClassId, initialSection);
    }
  };

  const handleOpenEditSchedule = (sch: ExamSchedule) => {
    setEditingSchedule(sch);
    setScheduleFormError(null);
    setSchClassId(sch.classId);
    setSchSection(sch.section);
    setSchSubject(sch.subject);
    setSchExamDate(sch.examDate);
    setSchStartTime(sch.startTime);
    setSchEndTime(sch.endTime);
    setSchMaxMarks(sch.maxMarks);
    setSchPassingMarks(sch.passingMarks);
    setSchRoomNumber(sch.roomNumber || '');
    setSchNotes(sch.notes || '');

    setShowScheduleFormModal(true);
    fetchValidSubjectsForSelection(sch.classId, sch.section);
  };

  const handleScheduleClassChange = (classId: string) => {
    setSchClassId(classId);
    const targetClass = classes.find((c) => c.id === classId);
    const newSection = targetClass?.sections && targetClass.sections.length > 0
      ? targetClass.sections[0].name
      : 'A';
    setSchSection(newSection);

    const defaultRoom = targetClass?.sections?.[0]?.roomNumber || '';
    setSchRoomNumber(defaultRoom);

    fetchValidSubjectsForSelection(classId, newSection);
  };

  const handleScheduleSectionChange = (sectionName: string) => {
    setSchSection(sectionName);
    const matchedSec = availableSectionsForModal.find(
      (s) => s.name.toUpperCase() === sectionName.toUpperCase()
    );
    if (matchedSec && matchedSec.roomNumber) {
      setSchRoomNumber(matchedSec.roomNumber);
    }
    fetchValidSubjectsForSelection(schClassId, sectionName);
  };

  const handleSubmitScheduleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExamForSchedule) return;
    setScheduleFormError(null);

    if (!schClassId) {
      setScheduleFormError('Please select a class.');
      return;
    }
    if (!schSection.trim()) {
      setScheduleFormError('Section is required.');
      return;
    }
    if (!schSubject.trim()) {
      setScheduleFormError('Subject is required.');
      return;
    }
    if (!schExamDate) {
      setScheduleFormError('Exam date is required.');
      return;
    }
    if (!schStartTime || !schEndTime) {
      setScheduleFormError('Both start time and end time are required.');
      return;
    }
    if (schMaxMarks <= 0) {
      setScheduleFormError('Maximum marks must be greater than zero.');
      return;
    }
    if (schPassingMarks < 0 || schPassingMarks > schMaxMarks) {
      setScheduleFormError(`Passing marks must be between 0 and maximum marks (${schMaxMarks}).`);
      return;
    }

    setScheduleSubmitting(true);
    try {
      if (editingSchedule) {
        const payload: UpdateSchedulePayload = {
          classId: schClassId,
          section: schSection.trim().toUpperCase(),
          subject: schSubject.trim(),
          examDate: schExamDate,
          startTime: schStartTime,
          endTime: schEndTime,
          maxMarks: schMaxMarks,
          passingMarks: schPassingMarks,
          roomNumber: schRoomNumber.trim(),
          notes: schNotes.trim(),
        };
        const res = await adminApi.updateExamSchedule(
          activeExamForSchedule.id,
          editingSchedule.id,
          payload
        );
        if (res.success) {
          showSuccess(`Schedule for ${schSubject} updated successfully.`);
          setShowScheduleFormModal(false);
          openScheduleDrawer(activeExamForSchedule);
          fetchData();
        }
      } else {
        const payload: CreateSchedulePayload = {
          classId: schClassId,
          section: schSection.trim().toUpperCase(),
          subject: schSubject.trim(),
          examDate: schExamDate,
          startTime: schStartTime,
          endTime: schEndTime,
          maxMarks: schMaxMarks,
          passingMarks: schPassingMarks,
          roomNumber: schRoomNumber.trim(),
          notes: schNotes.trim(),
        };
        const res = await adminApi.createExamSchedule(activeExamForSchedule.id, payload);
        if (res.success) {
          showSuccess(`Subject ${schSubject} scheduled successfully.`);
          setShowScheduleFormModal(false);
          openScheduleDrawer(activeExamForSchedule);
          fetchData();
        }
      }
    } catch (err: unknown) {
      console.error('Failed to save subject schedule:', err);
      setScheduleFormError(
        getApiErrorMessage(
          err,
          'Failed to schedule subject. Please check schedule conflicts and try again.'
        )
      );
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const handleDeleteSchedule = (sch: ExamSchedule) => {
    if (!activeExamForSchedule) return;
    setConfirmModal({
      title: `Delete Subject Schedule: ${sch.subject}?`,
      description: `Are you sure you want to remove the exam schedule for ${sch.subject} (${sch.className} - Section ${sch.section}) on ${sch.examDate}?`,
      onConfirm: async () => {
        setConfirming(true);
        try {
          await adminApi.deleteExamSchedule(activeExamForSchedule.id, sch.id);
          showSuccess(`Schedule for ${sch.subject} removed successfully.`);
          setConfirmModal(null);
          openScheduleDrawer(activeExamForSchedule);
          fetchData();
        } catch (err: unknown) {
          showError(getApiErrorMessage(err, 'Failed to delete subject schedule.'));
        } finally {
          setConfirming(false);
        }
      },
    });
  };

  // Helper for exam type badge style
  const getExamTypeBadge = (type: ExamType) => {
    switch (type) {
      case 'UNIT_TEST':
        return <span className="admin-status-pill pill-secondary">Unit Test</span>;
      case 'FIRST_TERM':
        return <span className="admin-status-pill pill-active">First Term</span>;
      case 'MID_TERM':
        return <span className="admin-status-pill pill-primary">Mid-Term</span>;
      case 'SECOND_TERM':
        return <span className="admin-status-pill pill-active">Second Term</span>;
      case 'ANNUAL_EXAM':
        return <span className="admin-status-pill pill-highlight">Annual Exam</span>;
      default:
        return <span className="admin-status-pill pill-secondary">{EXAM_TYPE_LABELS[type] || type}</span>;
    }
  };

  // Helper for exam status badge style
  const getExamStatusBadge = (status: ExamStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="admin-status-pill pill-draft">Draft</span>;
      case 'SCHEDULED':
        return <span className="admin-status-pill pill-active">Scheduled</span>;
      case 'ONGOING':
        return <span className="admin-status-pill pill-warning">Ongoing</span>;
      case 'COMPLETED':
        return <span className="admin-status-pill pill-success">Completed</span>;
      case 'CANCELLED':
        return <span className="admin-status-pill pill-rejected">Cancelled</span>;
      default:
        return <span className="admin-status-pill pill-secondary">{status}</span>;
    }
  };

  return (
    <AdminLayout breadcrumbTitle="Exams & Marks Management">
      <div className="admin-timetable-page-container">
        {/* Toast Notifications */}
        {toastSuccess && (
          <div className="admin-toast-success" role="status">
            <CheckCircle2 size={18} />
            <span>{toastSuccess}</span>
          </div>
        )}
        {toastError && (
          <div className="admin-toast-error" role="alert">
            <AlertCircle size={18} />
            <span>{toastError}</span>
          </div>
        )}

        {/* Page Title & Top Actions */}
        <div className="admin-timetable-header-wrap">
          <div className="admin-timetable-title-group">
            <h1>Exams & Marks Management</h1>
            <p>
              Create institutional examinations, define academic testing windows, and configure conflict-free subject-wise schedules for classes and sections.
            </p>
          </div>

          <div className="admin-timetable-header-actions">
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={fetchData}
              disabled={loading}
              title="Refresh Examinations"
            >
              <RotateCw size={15} className={loading ? 'admin-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              className="admin-btn-primary-action"
              onClick={handleOpenCreateExam}
              id="admin-create-exam-btn"
            >
              <Plus size={16} />
              <span>Create Exam</span>
            </button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="admin-timetable-summary-grid">
          <div className="admin-timetable-card-stat">
            <div className="admin-timetable-card-stat-info">
              <span className="admin-card-stat-label">Total Exams</span>
              <span className="admin-card-stat-value">{summary.totalExams}</span>
            </div>
            <div className="admin-card-stat-icon-wrap admin-stat-icon-blue">
              <Layers size={22} />
            </div>
          </div>

          <div className="admin-timetable-card-stat">
            <div className="admin-timetable-card-stat-info">
              <span className="admin-card-stat-label">Upcoming Exams</span>
              <span className="admin-card-stat-value">{summary.upcomingExams}</span>
            </div>
            <div className="admin-card-stat-icon-wrap admin-stat-icon-sage">
              <CalendarDays size={22} />
            </div>
          </div>

          <div className="admin-timetable-card-stat">
            <div className="admin-timetable-card-stat-info">
              <span className="admin-card-stat-label">Completed Exams</span>
              <span className="admin-card-stat-value">{summary.completedExams}</span>
            </div>
            <div className="admin-card-stat-icon-wrap admin-stat-icon-blue">
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className="admin-timetable-card-stat">
            <div className="admin-timetable-card-stat-info">
              <span className="admin-card-stat-label">Published Results</span>
              <span className="admin-card-stat-value">{summary.publishedResults}</span>
            </div>
            <div className="admin-card-stat-icon-wrap admin-stat-icon-sage">
              <FileText size={22} />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="admin-classes-toolbar" style={{ marginBottom: 20 }}>
          <div className="admin-search-wrapper" style={{ flex: '1 1 240px' }}>
            <Search size={16} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search by exam name..."
              className="admin-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="admin-search-clear-btn"
                onClick={() => setSearchTerm('')}
                title="Clear search"
                aria-label="Clear search query"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Academic Year Filter */}
          <div className="admin-filter-group">
            <label className="admin-filter-label">Academic Year</label>
            <select
              className="admin-filter-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="ALL">All Years</option>
              {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Type Filter */}
          <div className="admin-filter-group">
            <label className="admin-filter-label">Exam Type</label>
            <select
              className="admin-filter-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="ALL">All Types</option>
              {EXAM_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="admin-filter-group">
            <label className="admin-filter-label">Status</label>
            <select
              className="admin-filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Error State Banner */}
        {error && (
          <div className="admin-admissions-error" role="alert" style={{ marginBottom: 20 }}>
            <AlertCircle size={20} className="admin-error-icon" />
            <div className="admin-error-text">
              <h4>Error Loading Examinations</h4>
              <p>{error}</p>
            </div>
            <button
              type="button"
              className="admin-btn-secondary admin-btn-sm"
              onClick={fetchData}
              style={{ marginLeft: 'auto' }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="admin-classes-loading-wrap">
            <RotateCw size={32} className="admin-spin" style={{ color: 'var(--admin-primary)' }} />
            <p>Loading examinations and schedules...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && exams.length === 0 && (
          <div className="admin-admissions-empty" style={{ padding: '60px 20px' }}>
            <div
              className="admin-card-stat-icon-wrap admin-stat-icon-blue"
              style={{ margin: '0 auto 16px auto', width: 56, height: 56 }}
            >
              <Award size={30} />
            </div>
            <h3>
              {searchTerm || selectedType !== 'ALL' || selectedStatus !== 'ALL'
                ? 'No Examinations Found'
                : 'No Examinations Created Yet'}
            </h3>
            <p style={{ maxWidth: 450, margin: '8px auto 20px auto' }}>
              {searchTerm || selectedType !== 'ALL' || selectedStatus !== 'ALL'
                ? 'No examinations matched your active search or filter criteria. Try adjusting your query or resetting filters.'
                : 'Get started by creating your first institutional examination and setting up subject-wise test schedules.'}
            </p>
            {searchTerm || selectedType !== 'ALL' || selectedStatus !== 'ALL' ? (
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('ALL');
                  setSelectedStatus('ALL');
                }}
              >
                Clear Filters
              </button>
            ) : (
              <button
                type="button"
                className="admin-btn-primary-action"
                onClick={handleOpenCreateExam}
              >
                <Plus size={16} />
                <span>Create First Examination</span>
              </button>
            )}
          </div>
        )}

        {/* Responsive Exams Table */}
        {!loading && !error && exams.length > 0 && (
          <div className="admin-timetable-table-card">
            <div className="admin-table-responsive" style={{ overflowX: 'auto' }}>
              <table className="admin-admissions-table">
                <thead>
                  <tr>
                    <th>Examination Name</th>
                    <th>Exam Type</th>
                    <th>Academic Year</th>
                    <th>Date Window</th>
                    <th>Applicable Classes</th>
                    <th>Scheduled Subjects</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--admin-text-main)', fontSize: '0.92rem' }}>
                            {exam.name}
                          </div>
                          {exam.description && (
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--admin-text-muted)',
                                maxWidth: 260,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {exam.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{getExamTypeBadge(exam.examType)}</td>
                      <td>
                        <span style={{ fontWeight: 500, color: 'var(--admin-text-muted)' }}>
                          {exam.academicYear}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem' }}>
                          <Calendar size={13} style={{ color: 'var(--admin-muted-blue)' }} />
                          <span>
                            {exam.startDate} &rarr; {exam.endDate}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 220 }}>
                          {exam.applicableClasses.slice(0, 3).map((ac) => (
                            <span key={ac.classId} className="admin-class-section-tag" style={{ fontSize: '0.72rem' }}>
                              {ac.className}
                            </span>
                          ))}
                          {exam.applicableClasses.length > 3 && (
                            <span
                              className="admin-class-section-tag"
                              style={{ fontSize: '0.72rem', background: 'var(--admin-border)' }}
                              title={exam.applicableClasses.map((c) => c.className).join(', ')}
                            >
                              +{exam.applicableClasses.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`admin-period-type-pill ${
                            exam.scheduledSubjectsCount > 0 ? 'pill-teaching' : 'pill-break'
                          }`}
                          style={{ fontWeight: 600 }}
                        >
                          {exam.scheduledSubjectsCount} {exam.scheduledSubjectsCount === 1 ? 'Subject' : 'Subjects'}
                        </span>
                      </td>
                      <td>{getExamStatusBadge(exam.status)}</td>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 6,
                          }}
                        >
                          <button
                            type="button"
                            className="admin-btn-secondary admin-btn-sm"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '5px 9px',
                              fontSize: '0.78rem',
                              color: 'var(--admin-primary)',
                              borderColor: 'var(--admin-primary-light)',
                            }}
                            onClick={() => openScheduleDrawer(exam)}
                            title="Manage subject schedules"
                          >
                            <CalendarCheck2 size={13} />
                            <span>Schedule</span>
                          </button>
                          <button
                            type="button"
                            className="admin-action-btn"
                            onClick={() => handleOpenEditExam(exam)}
                            title="Edit examination"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="admin-action-btn"
                            style={{ color: '#C0392B' }}
                            onClick={() => handleDeleteExam(exam)}
                            title="Delete examination"
                          >
                            <Trash2 size={15} />
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

        {/* ============================================================== */}
        {/* Create / Edit Exam Modal                                      */}
        {/* ============================================================== */}
        {showExamModal && (
          <div className="admin-modal-overlay" role="dialog" aria-modal="true">
            <div className="admin-modal-card" style={{ maxWidth: 640 }}>
              <div className="admin-modal-header">
                <div>
                  <h3 className="admin-modal-title">
                    {editingExam ? 'Edit Examination' : 'Create New Examination'}
                  </h3>
                  <p className="admin-modal-subtitle">
                    Configure institutional examination details, applicable standards, and dates.
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => setShowExamModal(false)}
                  aria-label="Close examination modal"
                >
                  <X size={18} />
                </button>
              </div>

              {examModalError && (
                <div
                  className="admin-toast-error"
                  style={{ margin: '14px 24px 0 24px', animation: 'none' }}
                  role="alert"
                >
                  <AlertCircle size={16} />
                  <span>{examModalError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitExamForm} className="admin-modal-body">
                {/* Exam Name */}
                <div style={{ marginBottom: 14 }}>
                  <label className="admin-form-label">Examination Name *</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. Mid-Term Examination 2026, Unit Test 1"
                    value={formExamName}
                    onChange={(e) => setFormExamName(e.target.value)}
                    required
                  />
                </div>

                {/* Exam Type & Academic Year */}
                <div className="admin-form-row-2" style={{ marginBottom: 14 }}>
                  <div>
                    <label className="admin-form-label">Exam Type *</label>
                    <select
                      className="admin-form-select"
                      value={formExamType}
                      onChange={(e) => setFormExamType(e.target.value as ExamType)}
                      required
                    >
                      {EXAM_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

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
                </div>

                {/* Start Date & End Date */}
                <div className="admin-form-row-2" style={{ marginBottom: 14 }}>
                  <div>
                    <label className="admin-form-label">Start Date *</label>
                    <input
                      type="date"
                      className="admin-form-input"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">End Date *</label>
                    <input
                      type="date"
                      className="admin-form-input"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Applicable Classes Selection */}
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <label className="admin-form-label" style={{ marginBottom: 0 }}>
                      Applicable Classes / Grades *
                    </label>
                    <div style={{ display: 'flex', gap: 8, fontSize: '0.74rem' }}>
                      <button
                        type="button"
                        onClick={selectAllClasses}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--admin-primary)',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Select All
                      </button>
                      <span style={{ color: 'var(--admin-border)' }}>|</span>
                      <button
                        type="button"
                        onClick={clearAllClasses}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--admin-text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                      maxHeight: 120,
                      overflowY: 'auto',
                      padding: 10,
                      background: 'var(--admin-bg-subtle)',
                      borderRadius: 6,
                      border: '1px solid var(--admin-border)',
                    }}
                  >
                    {classes.map((cls) => {
                      const isSelected = formApplicableClassIds.includes(cls.id);
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => toggleClassSelection(cls.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 16,
                            fontSize: '0.76rem',
                            fontWeight: 500,
                            border: `1px solid ${isSelected ? 'var(--admin-primary)' : 'var(--admin-border)'}`,
                            backgroundColor: isSelected ? 'var(--admin-primary)' : 'var(--admin-surface)',
                            color: isSelected ? '#ffffff' : 'var(--admin-text-main)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {cls.name}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>
                    Selected {formApplicableClassIds.length} of {classes.length} classes
                  </div>
                </div>

                {/* Description or Instructions */}
                <div style={{ marginBottom: 14 }}>
                  <label className="admin-form-label">Description / Instructions (Optional)</label>
                  <textarea
                    className="admin-form-input"
                    rows={2}
                    placeholder="e.g. Bring scientific calculators for Grade 10-12 mathematics. No electronic watches allowed."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>

                {/* Status */}
                <div style={{ marginBottom: 8 }}>
                  <label className="admin-form-label">Examination Status</label>
                  <select
                    className="admin-form-select"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ExamStatus)}
                  >
                    <option value="DRAFT">Draft (Not yet visible to parents/students)</option>
                    <option value="SCHEDULED">Scheduled (Official exam period confirmed)</option>
                    {editingExam && (
                      <>
                        <option value="ONGOING">Ongoing (Currently active)</option>
                        <option value="COMPLETED">Completed (All tests completed)</option>
                        <option value="CANCELLED">Cancelled</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="admin-modal-footer" style={{ padding: '16px 0 0 0', marginTop: 14 }}>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => setShowExamModal(false)}
                    disabled={examSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-btn-primary-action"
                    disabled={examSubmitting}
                  >
                    {examSubmitting ? (
                      <>
                        <RotateCw size={14} className="admin-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingExam ? 'Save Changes' : 'Create Examination'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* Subject-Wise Exam Schedule Drawer / Detail View              */}
        {/* ============================================================== */}
        {activeExamForSchedule && (
          <div className="admin-modal-overlay" role="dialog" aria-modal="true">
            <div
              className="admin-modal-card"
              style={{
                maxWidth: 960,
                width: '95%',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div className="admin-modal-header" style={{ borderBottom: '1px solid var(--admin-border)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="admin-class-section-tag">
                      {EXAM_TYPE_LABELS[activeExamForSchedule.examType]}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                      {activeExamForSchedule.academicYear}
                    </span>
                    {getExamStatusBadge(activeExamForSchedule.status)}
                  </div>
                  <h3 className="admin-modal-title" style={{ fontSize: '1.25rem' }}>
                    {activeExamForSchedule.name} — Subject Schedule
                  </h3>
                  <p className="admin-modal-subtitle">
                    Window: {activeExamForSchedule.startDate} to {activeExamForSchedule.endDate} • Applicable Standards: {activeExamForSchedule.applicableClasses.map((c) => c.className).join(', ')}
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={closeScheduleDrawer}
                  aria-label="Close examination schedule drawer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Action bar inside schedule modal */}
              <div
                style={{
                  padding: '12px 24px',
                  background: 'var(--admin-bg-subtle)',
                  borderBottom: '1px solid var(--admin-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: '0.86rem', color: 'var(--admin-text-main)', fontWeight: 600 }}>
                  Scheduled Subjects: {schedules.length}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="admin-btn-secondary admin-btn-sm"
                    onClick={() => openScheduleDrawer(activeExamForSchedule)}
                    disabled={schedulesLoading}
                  >
                    <RotateCw size={13} className={schedulesLoading ? 'admin-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                  <button
                    type="button"
                    className="admin-btn-primary-action admin-btn-sm"
                    onClick={handleOpenAddSchedule}
                  >
                    <Plus size={14} />
                    <span>Schedule Subject</span>
                  </button>
                </div>
              </div>

              {/* Schedules Content */}
              <div style={{ overflowY: 'auto', padding: 24, flex: 1 }}>
                {schedulesError && (
                  <div className="admin-admissions-error" style={{ marginBottom: 16 }}>
                    <AlertCircle size={18} />
                    <span>{schedulesError}</span>
                  </div>
                )}

                {schedulesLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--admin-text-muted)' }}>
                    <RotateCw size={26} className="admin-spin" style={{ marginBottom: 8 }} />
                    <p>Loading scheduled subjects...</p>
                  </div>
                ) : schedules.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '48px 20px',
                      background: 'var(--admin-bg-subtle)',
                      borderRadius: 8,
                      border: '1px dashed var(--admin-border)',
                    }}
                  >
                    <CalendarDays size={32} style={{ color: 'var(--admin-muted-blue)', marginBottom: 12 }} />
                    <h4 style={{ margin: '0 0 6px 0', color: 'var(--admin-text-main)' }}>
                      No Subject Exams Scheduled Yet
                    </h4>
                    <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: 'var(--admin-text-muted)' }}>
                      Configure date, timing, maximum marks, passing marks, and classroom location for each subject.
                    </p>
                    <button
                      type="button"
                      className="admin-btn-primary-action"
                      onClick={handleOpenAddSchedule}
                    >
                      <Plus size={15} />
                      <span>Schedule First Subject</span>
                    </button>
                  </div>
                ) : (
                  <div className="admin-table-responsive" style={{ overflowX: 'auto' }}>
                    <table className="admin-admissions-table">
                      <thead>
                        <tr>
                          <th>Class & Section</th>
                          <th>Subject / Module</th>
                          <th>Exam Date</th>
                          <th>Time Interval</th>
                          <th>Max Marks</th>
                          <th>Passing</th>
                          <th>Room / Location</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedules.map((sch) => (
                          <tr key={sch.id}>
                            <td>
                              <span className="admin-class-section-tag" style={{ fontWeight: 600 }}>
                                {sch.className} - {sch.section}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--admin-text-main)' }}>
                                {sch.subject}
                              </div>
                              {sch.notes && (
                                <div style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
                                  {sch.notes}
                                </div>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                                <Calendar size={13} style={{ color: 'var(--admin-muted-blue)' }} />
                                <span>{sch.examDate}</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Clock size={13} style={{ color: 'var(--admin-text-muted)' }} />
                                <span>{sch.formattedTime || `${sch.startTime} - ${sch.endTime}`}</span>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontWeight: 600, color: 'var(--admin-primary)' }}>
                                {sch.maxMarks}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 500, color: 'var(--admin-sage)' }}>
                                {sch.passingMarks}
                              </span>
                            </td>
                            <td>
                              {sch.roomNumber ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <DoorOpen size={13} style={{ color: 'var(--admin-text-muted)' }} />
                                  <span>{sch.roomNumber}</span>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--admin-text-subtle)', fontStyle: 'italic' }}>
                                  Unassigned
                                </span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                <button
                                  type="button"
                                  className="admin-action-btn"
                                  onClick={() => handleOpenEditSchedule(sch)}
                                  title="Edit subject schedule"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="admin-action-btn"
                                  style={{ color: '#C0392B' }}
                                  onClick={() => handleDeleteSchedule(sch)}
                                  title="Delete subject schedule"
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
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '14px 24px',
                  background: 'var(--admin-bg-subtle)',
                  borderTop: '1px solid var(--admin-border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={closeScheduleDrawer}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* Add / Edit Schedule Item Sub-Modal                            */}
        {/* ============================================================== */}
        {showScheduleFormModal && activeExamForSchedule && (
          <div className="admin-modal-overlay" style={{ zIndex: 1100 }} role="dialog" aria-modal="true">
            <div className="admin-modal-card" style={{ maxWidth: 580 }}>
              <div className="admin-modal-header">
                <div>
                  <h3 className="admin-modal-title">
                    {editingSchedule ? 'Edit Subject Schedule' : 'Schedule Subject Exam'}
                  </h3>
                  <p className="admin-modal-subtitle">
                    {activeExamForSchedule.name} • {activeExamForSchedule.academicYear}
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => setShowScheduleFormModal(false)}
                  aria-label="Close subject schedule form"
                >
                  <X size={18} />
                </button>
              </div>

              {scheduleFormError && (
                <div
                  className="admin-toast-error"
                  style={{ margin: '14px 24px 0 24px', animation: 'none' }}
                  role="alert"
                >
                  <AlertCircle size={16} />
                  <span>{scheduleFormError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitScheduleForm} className="admin-modal-body">
                {/* Class & Section Selection */}
                <div className="admin-form-row-2" style={{ marginBottom: 14 }}>
                  <div>
                    <label className="admin-form-label">Applicable Class *</label>
                    <select
                      className="admin-form-select"
                      value={schClassId}
                      onChange={(e) => handleScheduleClassChange(e.target.value)}
                      required
                    >
                      <option value="">Select Class</option>
                      {activeExamForSchedule.applicableClasses.map((ac) => (
                        <option key={ac.classId} value={ac.classId}>
                          {ac.className}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="admin-form-label">Section *</label>
                    <select
                      className="admin-form-select"
                      value={schSection}
                      onChange={(e) => handleScheduleSectionChange(e.target.value)}
                      required
                    >
                      {availableSectionsForModal.map((s) => (
                        <option key={s.id} value={s.name}>
                          Section {s.name}
                        </option>
                      ))}
                      {availableSectionsForModal.length === 0 && (
                        <option value="A">Section A</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Subject Selection (Dynamically Loaded from Valid Subjects) */}
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}
                  >
                    <label className="admin-form-label" style={{ marginBottom: 0 }}>
                      Subject / Examination Paper *
                    </label>
                    {loadingSubjects && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>
                        <RotateCw size={11} className="admin-spin" style={{ display: 'inline', marginRight: 4 }} />
                        Loading subjects...
                      </span>
                    )}
                  </div>

                  {validSubjects.length > 0 ? (
                    <select
                      className="admin-form-select"
                      value={schSubject}
                      onChange={(e) => setSchSubject(e.target.value)}
                      required
                    >
                      {validSubjects.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. Mathematics, Physics, Chemistry"
                      value={schSubject}
                      onChange={(e) => setSchSubject(e.target.value)}
                      required
                    />
                  )}
                  {validSubjects.length > 0 && (
                    <div style={{ fontSize: '0.73rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>
                      Verified curriculum subjects assigned to this standard & section
                    </div>
                  )}
                </div>

                {/* Exam Date */}
                <div style={{ marginBottom: 14 }}>
                  <label className="admin-form-label">
                    Exam Date * (Window: {activeExamForSchedule.startDate} to {activeExamForSchedule.endDate})
                  </label>
                  <input
                    type="date"
                    className="admin-form-input"
                    value={schExamDate}
                    min={activeExamForSchedule.startDate}
                    max={activeExamForSchedule.endDate}
                    onChange={(e) => setSchExamDate(e.target.value)}
                    required
                  />
                </div>

                {/* Timing (24h) */}
                <div className="admin-form-row-2" style={{ marginBottom: 8 }}>
                  <div>
                    <label className="admin-form-label">Start Time (24h) *</label>
                    <input
                      type="time"
                      className="admin-form-input"
                      value={schStartTime}
                      onChange={(e) => setSchStartTime(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">End Time (24h) *</label>
                    <input
                      type="time"
                      className="admin-form-input"
                      value={schEndTime}
                      onChange={(e) => setSchEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Preset Timing Chips */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', marginBottom: 6 }}>
                    Quick Presets:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {QUICK_TIME_SLOTS.map((ts) => (
                      <button
                        key={ts.label}
                        type="button"
                        className="admin-preset-time-chip"
                        onClick={() => {
                          setSchStartTime(ts.start);
                          setSchEndTime(ts.end);
                        }}
                      >
                        {ts.label} ({ts.start} - {ts.end})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Marks & Passing Marks */}
                <div className="admin-form-row-2" style={{ marginBottom: 14 }}>
                  <div>
                    <label className="admin-form-label">Maximum Marks *</label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      className="admin-form-input"
                      value={schMaxMarks}
                      onChange={(e) => setSchMaxMarks(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">Passing Marks *</label>
                    <input
                      type="number"
                      min={0}
                      max={schMaxMarks}
                      className="admin-form-input"
                      value={schPassingMarks}
                      onChange={(e) => setSchPassingMarks(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                {/* Room / Location & Notes */}
                <div style={{ marginBottom: 14 }}>
                  <label className="admin-form-label">Room / Hall Number (Optional)</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. Room 204, Examination Hall A, Science Wing"
                    value={schRoomNumber}
                    onChange={(e) => setSchRoomNumber(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: 8 }}>
                  <label className="admin-form-label">Notes / Instructions (Optional)</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. Bring graph sheets and geometry compass"
                    value={schNotes}
                    onChange={(e) => setSchNotes(e.target.value)}
                  />
                </div>

                <div className="admin-modal-footer" style={{ padding: '16px 0 0 0', marginTop: 14 }}>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => setShowScheduleFormModal(false)}
                    disabled={scheduleSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-btn-primary-action"
                    disabled={scheduleSubmitting}
                  >
                    {scheduleSubmitting ? (
                      <>
                        <RotateCw size={14} className="admin-spin" />
                        <span>Saving Schedule...</span>
                      </>
                    ) : (
                      <span>{editingSchedule ? 'Save Changes' : 'Confirm Schedule'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* Generic Confirmation Modal                                    */}
        {/* ============================================================== */}
        {confirmModal && (
          <div className="admin-modal-overlay" style={{ zIndex: 1200 }} role="dialog" aria-modal="true">
            <div className="admin-modal-card" style={{ maxWidth: 440 }}>
              <div className="admin-modal-header">
                <h3 className="admin-modal-title" style={{ color: '#C0392B' }}>
                  {confirmModal.title}
                </h3>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => setConfirmModal(null)}
                  aria-label="Close confirmation dialog"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="admin-modal-body">
                <p style={{ margin: 0, color: 'var(--admin-text-main)', lineHeight: 1.5 }}>
                  {confirmModal.description}
                </p>
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
                  className="admin-btn-primary-action"
                  style={{ backgroundColor: '#C0392B', borderColor: '#C0392B' }}
                  onClick={confirmModal.onConfirm}
                  disabled={confirming}
                >
                  {confirming ? 'Processing...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
