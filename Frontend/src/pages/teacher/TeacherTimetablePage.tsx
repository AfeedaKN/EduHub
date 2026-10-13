import React, { useEffect, useState } from 'react';
import {
  Clock,
  Calendar,
  CalendarDays,
  RotateCw,
  AlertCircle,
  MapPin,
  Layers,
  BookOpen,
  Search,
} from 'lucide-react';
import { TeacherLayout } from '../../components/teacher/TeacherLayout';
import { teacherApi } from '../../api/teacherApi';
import {
  TimetablePeriod,
  DAYS_OF_WEEK,
  DayOfWeek,
  TeacherWeeklyTimetableResponse,
} from '../../types/timetable.types';

const ACADEMIC_YEARS = ['2026-2027', '2027-2028', '2025-2026'];

export const TeacherTimetablePage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timetableData, setTimetableData] = useState<TeacherWeeklyTimetableResponse | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('2026-2027');
  const [activeDayTab, setActiveDayTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Determine current day of week to highlight today
  const dayNames: DayOfWeek[] = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ];
  const currentDayOfWeek = dayNames[new Date().getDay()];

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await teacherApi.getTimetable({
        academicYear: selectedYear === 'ALL' ? undefined : selectedYear,
      });
      if (res.success && res.data) {
        setTimetableData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load teacher timetable:', err);
      setError(
        err?.response?.data?.message ||
          'Failed to load your weekly timetable. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [selectedYear]);

  const periods: TimetablePeriod[] = timetableData?.periods || [];
  const teacher = timetableData?.teacher;

  // Filter periods by search term
  const filteredPeriods = periods.filter((p) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.trim().toLowerCase();
    return (
      p.subject.toLowerCase().includes(s) ||
      p.className.toLowerCase().includes(s) ||
      p.section.toLowerCase().includes(s) ||
      (p.roomNumber && p.roomNumber.toLowerCase().includes(s)) ||
      p.dayOfWeek.toLowerCase().includes(s)
    );
  });

  // Calculate stats
  const totalWeeklyPeriods = periods.length;
  const todayPeriods = periods.filter((p) => p.dayOfWeek === currentDayOfWeek);
  const distinctClasses = new Set(periods.map((p) => `${p.className}-${p.section}`)).size;

  return (
    <TeacherLayout>
      <div className="teacher-classes-page-container">
        {/* Page Header */}
        <div className="teacher-classes-header">
          <div>
            <div className="teacher-header-badge">
              <CalendarDays size={13} />
              <span>Teaching Schedule</span>
            </div>
            <h1 className="teacher-classes-title">Weekly Timetable</h1>
            <p className="teacher-classes-subtitle">
              View your personalized weekly lecture schedule, classroom allotments, and today's upcoming periods.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select
              className="teacher-filter-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            >
              {ACADEMIC_YEARS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="teacher-btn-secondary"
              onClick={fetchTimetable}
              disabled={loading}
              title="Refresh Timetable"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                cursor: 'pointer',
              }}
            >
              <RotateCw size={14} className={loading ? 'teacher-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="teacher-summary-cards-row">
          <div className="teacher-summary-card">
            <div className="teacher-card-top-row">
              <span className="teacher-card-label">Weekly Periods</span>
              <div className="teacher-card-icon-wrap icon-blue">
                <Clock size={16} />
              </div>
            </div>
            <div className="teacher-card-value-row">
              <div className="teacher-card-value">{totalWeeklyPeriods}</div>
              <span className="teacher-card-indicator">Slots</span>
            </div>
            <div className="teacher-card-subtext">Total lectures assigned this week</div>
          </div>

          <div className="teacher-summary-card">
            <div className="teacher-card-top-row">
              <span className="teacher-card-label">Today's Lectures</span>
              <div className="teacher-card-icon-wrap icon-emerald">
                <Calendar size={16} />
              </div>
            </div>
            <div className="teacher-card-value-row">
              <div className="teacher-card-value">{todayPeriods.length}</div>
              <span className="teacher-card-indicator">
                {currentDayOfWeek.charAt(0) + currentDayOfWeek.slice(1).toLowerCase()}
              </span>
            </div>
            <div className="teacher-card-subtext">Sessions scheduled for today</div>
          </div>

          <div className="teacher-summary-card">
            <div className="teacher-card-top-row">
              <span className="teacher-card-label">Assigned Sections</span>
              <div className="teacher-card-icon-wrap icon-purple">
                <Layers size={16} />
              </div>
            </div>
            <div className="teacher-card-value-row">
              <div className="teacher-card-value">{distinctClasses}</div>
              <span className="teacher-card-indicator">Classrooms</span>
            </div>
            <div className="teacher-card-subtext">Distinct class sections taught</div>
          </div>

          <div className="teacher-summary-card">
            <div className="teacher-card-top-row">
              <span className="teacher-card-label">Department</span>
              <div className="teacher-card-icon-wrap icon-amber">
                <BookOpen size={16} />
              </div>
            </div>
            <div className="teacher-card-value-row">
              <div className="teacher-card-value" style={{ fontSize: '1.2rem' }}>
                {teacher?.department || 'General'}
              </div>
            </div>
            <div className="teacher-card-subtext">Faculty department assignment</div>
          </div>
        </div>

        {/* Toolbar & Day Filter Ribbon */}
        <div
          className="teacher-filter-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginBottom: 20,
            padding: 16,
            borderRadius: 12,
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search subject, grade, section, or room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              />
            </div>
          </div>

          {/* Day Ribbon */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              type="button"
              className={`teacher-tab-btn ${activeDayTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveDayTab('ALL')}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: activeDayTab === 'ALL' ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                backgroundColor: activeDayTab === 'ALL' ? 'var(--primary-color)' : 'var(--bg-primary)',
                color: activeDayTab === 'ALL' ? '#ffffff' : 'var(--text-primary)',
              }}
            >
              Entire Week ({periods.length})
            </button>
            {DAYS_OF_WEEK.map((day) => {
              const count = periods.filter((p) => p.dayOfWeek === day).length;
              const isToday = day === currentDayOfWeek;
              const isSelected = activeDayTab === day;

              return (
                <button
                  key={day}
                  type="button"
                  className={`teacher-tab-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => setActiveDayTab(day)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: isSelected ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                    backgroundColor: isSelected ? 'var(--primary-color)' : 'var(--bg-primary)',
                    color: isSelected ? '#ffffff' : 'var(--text-primary)',
                  }}
                >
                  <span>{day.charAt(0) + day.slice(1).toLowerCase()}</span>
                  {isToday && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '1px 5px',
                        borderRadius: 10,
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(16, 185, 129, 0.2)',
                        color: isSelected ? '#ffffff' : '#10b981',
                        fontWeight: 600,
                      }}
                    >
                      Today
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '0.72rem',
                      opacity: 0.8,
                    }}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="teacher-error-banner" role="alert" style={{ marginBottom: 20 }}>
            <AlertCircle size={20} />
            <div>
              <strong>Error Loading Schedule:</strong> {error}
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="teacher-skeleton-pulse" style={{ height: 160, borderRadius: 12 }} />
            <div className="teacher-skeleton-pulse" style={{ height: 260, borderRadius: 12 }} />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredPeriods.length === 0 && (
          <div
            className="teacher-empty-box"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 12,
              border: '1px dashed var(--border-color)',
            }}
          >
            <Clock size={44} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 6 }}>
              No Teaching Periods Scheduled
            </h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: 440, margin: '0 auto', fontSize: '0.88rem' }}>
              {searchTerm || activeDayTab !== 'ALL'
                ? 'No periods match your selected filter criteria. Try viewing the entire week or clearing your search term.'
                : 'You have no timetable periods assigned for this academic year yet. Contact school administration if you are missing scheduled lectures.'}
            </p>
          </div>
        )}

        {/* Schedule Display */}
        {!loading && !error && filteredPeriods.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                activeDayTab === 'ALL'
                  ? 'repeat(auto-fill, minmax(280px, 1fr))'
                  : '1fr',
              gap: 16,
            }}
          >
            {DAYS_OF_WEEK.filter((d) => activeDayTab === 'ALL' || activeDayTab === d).map((day) => {
              const daySlots = filteredPeriods
                .filter((p) => p.dayOfWeek === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

              if (activeDayTab === 'ALL' && daySlots.length === 0) return null;

              const isToday = day === currentDayOfWeek;

              return (
                <div
                  key={day}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 12,
                    border: isToday ? '2px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-color)',
                    padding: 16,
                    boxShadow: isToday ? '0 4px 16px rgba(59, 130, 246, 0.08)' : 'none',
                  }}
                >
                  {/* Day Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 14,
                      paddingBottom: 10,
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>
                        {day.charAt(0) + day.slice(1).toLowerCase()}
                      </span>
                      {isToday && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '2px 7px',
                            borderRadius: 10,
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          Today
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {daySlots.length} {daySlots.length === 1 ? 'Period' : 'Periods'}
                    </span>
                  </div>

                  {/* Day Periods List */}
                  {daySlots.length === 0 ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No lectures scheduled on this day.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {daySlots.map((slot) => (
                        <div
                          key={slot.id}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 10,
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                          }}
                        >
                          {/* Time & Period Type */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: '0.82rem',
                                color: 'var(--primary-color)',
                                fontWeight: 600,
                              }}
                            >
                              <Clock size={13} />
                              <span>{slot.formattedTime || `${slot.startTime} - ${slot.endTime}`}</span>
                            </div>

                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '2px 8px',
                                borderRadius: 6,
                                backgroundColor:
                                  slot.periodType === 'BREAK'
                                    ? 'rgba(245, 158, 11, 0.15)'
                                    : 'rgba(59, 130, 246, 0.12)',
                                color: slot.periodType === 'BREAK' ? '#d97706' : '#2563eb',
                                fontWeight: 600,
                              }}
                            >
                              {slot.periodType === 'BREAK' ? 'Break' : 'Scheduled'}
                            </span>
                          </div>

                          {/* Subject Title */}
                          <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--text-primary)' }}>
                            {slot.subject}
                          </div>

                          {/* Meta: Class, Section, Room */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                fontSize: '0.76rem',
                                padding: '3px 8px',
                                borderRadius: 6,
                                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                color: '#059669',
                                fontWeight: 600,
                              }}
                            >
                              <Layers size={11} />
                              <span>
                                {slot.className} - {slot.section}
                              </span>
                            </div>

                            {slot.roomNumber && (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  fontSize: '0.76rem',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                <MapPin size={12} />
                                <span>{slot.roomNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};
