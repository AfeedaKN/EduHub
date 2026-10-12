import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  CalendarDays,
  FileSpreadsheet,
  Clock,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  AlertCircle,
  RotateCw,
  Bell,
  MapPin,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { TeacherLayout } from '../../components/teacher/TeacherLayout';
import { teacherApi } from '../../api/teacherApi';
import { useAppSelector } from '../../store/hooks';
import type {
  TeacherDashboardData,
  TodayTimetableSlot,
  TeacherClassItem,
  UpcomingActivity,
  TeacherNotice,
} from '../../types/teacher.types';

export const TeacherDashboardPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await teacherApi.getDashboardData();
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load teacher dashboard data:', err);
      setError(
        err?.response?.data?.message ||
        'Unable to load your dashboard data. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = data?.summaryStats;
  const teacher = data?.teacher;
  const todayTimetable: TodayTimetableSlot[] = data?.todayTimetable || [];
  const assignedClasses: TeacherClassItem[] = data?.assignedClasses || [];
  const upcomingActivities: UpcomingActivity[] = data?.upcomingActivities || [];
  const recentNotices: TeacherNotice[] = data?.recentNotices || [];

  const teacherDisplayName = teacher?.fullName || user?.name || 'Faculty Member';
  const employeeId = teacher?.employeeId || 'TCH-001';
  const department = teacher?.department || 'General Academics';

  return (
    <TeacherLayout notices={recentNotices}>
      {/* Loading Skeleton Indicator */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            className="teacher-skeleton-pulse"
            style={{ height: '56px', width: '380px' }}
          />
          <div className="teacher-summary-cards-row">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="teacher-skeleton-pulse"
                style={{ height: '110px' }}
              />
            ))}
          </div>
          <div
            className="teacher-skeleton-pulse"
            style={{ height: '320px' }}
          />
        </div>
      )}

      {/* Error Banner with Retry */}
      {!isLoading && error && (
        <div className="teacher-error-banner" role="alert">
          <div className="teacher-error-content">
            <AlertCircle size={22} className="teacher-error-icon" />
            <div>
              <h3 className="teacher-error-title">Failed to load Dashboard Data</h3>
              <p className="teacher-error-desc">{error}</p>
            </div>
          </div>
          <button
            type="button"
            className="teacher-retry-btn"
            onClick={fetchDashboardData}
          >
            <RotateCw size={14} />
            <span>Retry Loading</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {!isLoading && !error && (
        <>
          {/* Page Introduction / Welcome Section */}
          <section className="teacher-welcome-section">
            <div>
              <h1 className="teacher-welcome-heading">Teacher Dashboard</h1>
              <p className="teacher-welcome-subtitle">
                <span>Welcome back, {teacherDisplayName}</span>
                <span>&bull;</span>
                <span>Employee ID: <span className="teacher-badge-code">{employeeId}</span></span>
                <span>&bull;</span>
                <span>Department: <strong>{department}</strong></span>
              </p>
            </div>

            <div className="teacher-welcome-actions">
              <button
                type="button"
                className="teacher-btn-refresh"
                onClick={fetchDashboardData}
                title="Refresh dashboard metrics"
              >
                <RotateCw size={14} />
                <span>Refresh</span>
              </button>
            </div>
          </section>

          {/* 4 Summary Cards Grid (Responsive Row) */}
          <section className="teacher-summary-cards-row" aria-label="Key Teaching Statistics">
            {/* Card 1: Assigned Classes */}
            <div className="teacher-summary-card">
              <div className="teacher-card-top-row">
                <span className="teacher-card-label">Assigned Classes</span>
                <div className="teacher-card-icon-wrap">
                  <GraduationCap size={17} />
                </div>
              </div>
              <div className="teacher-card-value-row">
                <div className="teacher-card-value">
                  {stats?.assignedClassesCount ?? 0}
                </div>
                <span className="teacher-card-indicator">Active</span>
              </div>
              <div className="teacher-card-subtext">
                Classes &amp; sections assigned to you
              </div>
            </div>

            {/* Card 2: Total Students */}
            <div className="teacher-summary-card">
              <div className="teacher-card-top-row">
                <span className="teacher-card-label">Total Students</span>
                <div className="teacher-card-icon-wrap icon-sage">
                  <Users size={17} />
                </div>
              </div>
              <div className="teacher-card-value-row">
                <div className="teacher-card-value">
                  {stats?.totalStudentsCount ?? 0}
                </div>
                <span className="teacher-card-indicator indicator-sage">Enrolled</span>
              </div>
              <div className="teacher-card-subtext">
                Active students across your sections
              </div>
            </div>

            {/* Card 3: Today's Classes */}
            <div className="teacher-summary-card">
              <div className="teacher-card-top-row">
                <span className="teacher-card-label">Today's Classes</span>
                <div className="teacher-card-icon-wrap icon-blue">
                  <CalendarDays size={17} />
                </div>
              </div>
              <div className="teacher-card-value-row">
                <div className="teacher-card-value">
                  {stats?.todayClassesCount ?? 0}
                </div>
                <span className="teacher-card-indicator">Periods</span>
              </div>
              <div className="teacher-card-subtext">
                Scheduled lecture sessions today
              </div>
            </div>

            {/* Card 4: Pending Reviews */}
            <div className="teacher-summary-card">
              <div className="teacher-card-top-row">
                <span className="teacher-card-label">Pending Reviews</span>
                <div className="teacher-card-icon-wrap icon-amber">
                  <FileSpreadsheet size={17} />
                </div>
              </div>
              <div className="teacher-card-value-row">
                <div
                  className={`teacher-card-value ${
                    stats?.pendingAssignmentsCount === null || stats?.pendingAssignmentsCount === undefined
                      ? 'value-unavailable'
                      : ''
                  }`}
                >
                  {stats?.pendingAssignmentsCount !== null && stats?.pendingAssignmentsCount !== undefined
                    ? stats.pendingAssignmentsCount
                    : '—'}
                </div>
                <span className="teacher-card-indicator indicator-muted">
                  {stats?.pendingAssignmentsCount !== null && stats?.pendingAssignmentsCount !== undefined
                    ? 'To Grade'
                    : 'Module Setup'}
                </span>
              </div>
              <div className="teacher-card-subtext">
                {stats?.pendingAssignmentsCount !== null && stats?.pendingAssignmentsCount !== undefined
                  ? 'Pending assignment submissions to grade'
                  : 'Assignment grading module scheduled in roadmap'}
              </div>
            </div>
          </section>

          {/* Balanced Two-Column Desktop Layout */}
          <div className="teacher-dashboard-grid">
            {/* LEFT COLUMN: 1. Today's Timetable, 2. My Classes */}
            <div className="teacher-dashboard-main-col">
              {/* SECTION 1: Today's Timetable */}
              <section className="teacher-panel-card" aria-labelledby="timetable-heading">
                <div className="teacher-panel-header">
                  <div className="teacher-panel-title-wrap">
                    <Clock size={18} className="teacher-panel-header-icon" />
                    <h2 id="timetable-heading" className="teacher-panel-title">
                      Today's Timetable
                    </h2>
                  </div>
                  <Link to="/teacher/timetable" className="teacher-panel-link">
                    <span>View Full Schedule</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>

                {todayTimetable.length > 0 ? (
                  <div className="teacher-timetable-list">
                    {todayTimetable.map((slot: TodayTimetableSlot) => (
                      <div key={slot.id} className="teacher-timetable-slot-row">
                        <div className="teacher-slot-time-box">
                          <Clock size={13} />
                          <span>{slot.time}</span>
                        </div>

                        <div className="teacher-slot-info">
                          <div className="teacher-slot-heading-row">
                            <span className="teacher-slot-subject">{slot.subject}</span>
                            <span className="teacher-slot-class-badge">
                              Grade {slot.className}-{slot.section}
                            </span>
                          </div>
                          <div className="teacher-slot-room-meta">
                            <MapPin size={12} />
                            <span>{slot.roomNumber || 'Assigned Classroom'}</span>
                          </div>
                        </div>

                        <div className="teacher-slot-status-pill">
                          Scheduled
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="teacher-empty-box">
                    <Clock size={32} className="teacher-empty-icon" />
                    <h3 className="teacher-empty-title">No Classes Scheduled Today</h3>
                    <p className="teacher-empty-desc">
                      You have no lectures scheduled for today. Consult your full weekly schedule for upcoming classes.
                    </p>
                  </div>
                )}
              </section>

              {/* SECTION 2: My Classes */}
              <section className="teacher-panel-card" aria-labelledby="classes-heading">
                <div className="teacher-panel-header">
                  <div className="teacher-panel-title-wrap">
                    <GraduationCap size={18} className="teacher-panel-header-icon" />
                    <h2 id="classes-heading" className="teacher-panel-title">
                      My Classes
                    </h2>
                  </div>
                  <Link to="/teacher/classes" className="teacher-panel-link">
                    <span>View All</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>

                {assignedClasses.length > 0 ? (
                  <div className="teacher-classes-grid">
                    {assignedClasses.map((cls: TeacherClassItem, idx: number) => (
                      <div key={idx} className="teacher-class-card-item">
                        <div className="teacher-class-header-row">
                          <div>
                            <h3 className="teacher-class-name-title">
                              Class {cls.className} &bull; Sec {cls.section}
                            </h3>
                            <div className="teacher-class-subject-sub">
                              {cls.subject || 'Core Subject'}
                            </div>
                          </div>
                          <span className="teacher-class-year-pill">2026-2027</span>
                        </div>

                        <div className="teacher-class-meta-row">
                          <Users size={14} />
                          <span>
                            <strong>{cls.studentCount}</strong> Students Enrolled
                          </span>
                        </div>

                        <div className="teacher-class-actions-row">
                          <Link
                            to="/teacher/attendance"
                            className="teacher-class-btn-action"
                            title={`Take attendance for ${cls.className}-${cls.section}`}
                          >
                            <CalendarCheck size={13} />
                            <span>Attendance</span>
                          </Link>
                          <Link
                            to="/teacher/students"
                            className="teacher-class-btn-action"
                            title={`View students in ${cls.className}-${cls.section}`}
                          >
                            <Users size={13} />
                            <span>Students</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="teacher-empty-box">
                    <GraduationCap size={32} className="teacher-empty-icon" />
                    <h3 className="teacher-empty-title">No Classes Assigned</h3>
                    <p className="teacher-empty-desc">
                      School Administration has not linked any classrooms to your faculty profile yet.
                    </p>
                  </div>
                )}
              </section>
            </div>

            {/* RIGHT COLUMN: 1. Upcoming Activities, 2. Recent School Notices, 3. Quick Actions */}
            <div className="teacher-dashboard-side-col">
              {/* 1. UPCOMING ACTIVITIES */}
              <section className="teacher-panel-card" aria-labelledby="activities-heading">
                <div className="teacher-panel-header">
                  <div className="teacher-panel-title-wrap">
                    <Calendar size={18} className="teacher-panel-header-icon" />
                    <h2 id="activities-heading" className="teacher-panel-title">
                      Upcoming Activities
                    </h2>
                  </div>
                  <Link to="/teacher/exams" className="teacher-panel-link">
                    <span>View Calendar</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>

                {upcomingActivities.length > 0 ? (
                  <div className="teacher-activities-list">
                    {upcomingActivities.map((act: UpcomingActivity) => {
                      const typeClass =
                        act.type.toLowerCase() === 'exam'
                          ? 'badge-exam'
                          : act.type.toLowerCase() === 'event'
                          ? 'badge-event'
                          : 'badge-assignment';
                      return (
                        <div key={act.id} className="teacher-activity-row">
                          <span className={`teacher-activity-badge ${typeClass}`}>
                            {act.type}
                          </span>
                          <div className="teacher-activity-details">
                            <div className="teacher-activity-title-text" title={act.title}>
                              {act.title}
                            </div>
                            <div className="teacher-activity-date-meta">
                              {act.className && <span>{act.className} &bull; </span>}
                              <span>{act.date}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="teacher-empty-box-compact">
                    <CheckCircle2 size={24} style={{ color: 'var(--teacher-sage)', marginBottom: 4 }} />
                    <div className="teacher-empty-title-sm">No Pending Deadlines</div>
                    <p className="teacher-empty-desc-sm">
                      No examinations or assignments due in the next 7 days.
                    </p>
                  </div>
                )}
              </section>

              {/* 2. RECENT SCHOOL NOTICES */}
              <section className="teacher-panel-card" aria-labelledby="notices-heading">
                <div className="teacher-panel-header">
                  <div className="teacher-panel-title-wrap">
                    <Bell size={18} className="teacher-panel-header-icon" />
                    <h2 id="notices-heading" className="teacher-panel-title">
                      Recent School Notices
                    </h2>
                  </div>
                  <Link to="/teacher/notices" className="teacher-panel-link">
                    <span>All Notices</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>

                {recentNotices.length > 0 ? (
                  <div className="teacher-notices-feed">
                    {recentNotices.map((notice: TeacherNotice) => (
                      <div key={notice.id} className="teacher-notice-item-card">
                        <div className="teacher-notice-header-row">
                          <span className="teacher-notice-item-title">{notice.title}</span>
                          <span className="teacher-notice-tag">{notice.category || 'General'}</span>
                        </div>
                        <span className="teacher-notice-item-date">{notice.date}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="teacher-empty-box-compact">
                    <Info size={24} style={{ color: 'var(--teacher-muted-blue)', marginBottom: 4 }} />
                    <div className="teacher-empty-title-sm">No Announcements</div>
                    <p className="teacher-empty-desc-sm">
                      There are no active school notices posted at this time.
                    </p>
                  </div>
                )}
              </section>

              {/* 3. QUICK ACTIONS */}
              <section className="teacher-panel-card" aria-labelledby="quick-actions-heading">
                <div className="teacher-panel-header">
                  <div className="teacher-panel-title-wrap">
                    <h2 id="quick-actions-heading" className="teacher-panel-title">
                      Quick Actions
                    </h2>
                  </div>
                </div>

                <div className="teacher-quick-actions-col">
                  <Link to="/teacher/attendance" className="teacher-quick-action-link-btn">
                    <div className="teacher-action-left-block">
                      <div className="teacher-action-icon-pill sage">
                        <CalendarCheck size={16} />
                      </div>
                      <div className="teacher-action-text-info">
                        <span className="teacher-action-main-title">Mark Attendance</span>
                        <span className="teacher-action-helper-desc">Daily classroom attendance register</span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="teacher-action-chevron" />
                  </Link>

                  <Link to="/teacher/timetable" className="teacher-quick-action-link-btn">
                    <div className="teacher-action-left-block">
                      <div className="teacher-action-icon-pill blue">
                        <Clock size={16} />
                      </div>
                      <div className="teacher-action-text-info">
                        <span className="teacher-action-main-title">Weekly Timetable</span>
                        <span className="teacher-action-helper-desc">Class schedules &amp; lecture halls</span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="teacher-action-chevron" />
                  </Link>

                  <Link to="/teacher/students" className="teacher-quick-action-link-btn">
                    <div className="teacher-action-left-block">
                      <div className="teacher-action-icon-pill navy">
                        <Users size={16} />
                      </div>
                      <div className="teacher-action-text-info">
                        <span className="teacher-action-main-title">My Students</span>
                        <span className="teacher-action-helper-desc">Enrolled student rosters &amp; profiles</span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="teacher-action-chevron" />
                  </Link>

                  <Link to="/teacher/assignments" className="teacher-quick-action-link-btn">
                    <div className="teacher-action-left-block">
                      <div className="teacher-action-icon-pill blue">
                        <BookOpen size={16} />
                      </div>
                      <div className="teacher-action-text-info">
                        <span className="teacher-action-main-title">Assignments</span>
                        <span className="teacher-action-helper-desc">Review homework &amp; submissions</span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="teacher-action-chevron" />
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </TeacherLayout>
  );
};
