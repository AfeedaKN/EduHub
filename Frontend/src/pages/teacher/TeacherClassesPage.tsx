import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  Search,
  BookOpen,
  Calendar,
  RotateCw,
  AlertCircle,
  ArrowRight,
  Sparkles,
  School,
  X,
} from 'lucide-react';
import { TeacherLayout } from '../../components/teacher/TeacherLayout';
import { teacherApi } from '../../api/teacherApi';
import type { TeacherClassItem } from '../../types/teacher.types';

export const TeacherClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<TeacherClassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await teacherApi.getMyClasses();
      if (res.success && res.data) {
        setClasses(res.data);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Failed to load your assigned classes. Please check your network and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const totalAssignedClasses = classes.length;
  const totalEnrolledStudents = classes.reduce((sum, c) => sum + (c.studentCount || 0), 0);

  const filteredClasses = classes.filter((c) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.trim().toLowerCase();
    return (
      c.className.toLowerCase().includes(s) ||
      c.section.toLowerCase().includes(s) ||
      (c.subject && c.subject.toLowerCase().includes(s)) ||
      (c.academicYear && c.academicYear.toLowerCase().includes(s))
    );
  });

  return (
    <TeacherLayout>
      <div className="teacher-classes-page-container" style={{ padding: '4px 0 32px' }}>
        {/* 1. Header Section */}
        <section
          className="teacher-welcome-section"
          style={{ marginBottom: '24px' }}
        >
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
                Faculty Schedule
              </span>
            </div>
            <h1 className="teacher-welcome-heading" style={{ margin: '0 0 6px' }}>
              My Assigned Classes
            </h1>
            <p className="teacher-welcome-subtitle" style={{ margin: 0 }}>
              <span>Official classrooms and teaching subjects assigned to you for the current academic session</span>
            </p>
          </div>

          <div className="teacher-welcome-actions">
            <button
              type="button"
              className="teacher-btn-refresh"
              onClick={fetchClasses}
              disabled={loading}
              title="Refresh assigned classes list"
            >
              <RotateCw size={14} className={loading ? 'teacher-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </section>

        {/* 2. Key Metrics Row */}
        <div
          className="teacher-summary-cards-row"
          style={{ marginBottom: '24px' }}
          aria-label="Assigned Classes Summary"
        >
          {/* Metric 1: Assigned Classes */}
          <div className="teacher-summary-card">
            <div className="teacher-card-top-row">
              <span className="teacher-card-label">Assigned Sections</span>
              <div className="teacher-card-icon-wrap">
                <GraduationCap size={17} />
              </div>
            </div>
            <div className="teacher-card-value-row">
              <div className="teacher-card-value">{totalAssignedClasses}</div>
              <span className="teacher-card-indicator">Active</span>
            </div>
            <div className="teacher-card-subtext">Classrooms &amp; sections on your roster</div>
          </div>

          {/* Metric 2: Total Enrolled Students */}
          <div className="teacher-summary-card">
            <div className="teacher-card-top-row">
              <span className="teacher-card-label">Total Students</span>
              <div className="teacher-card-icon-wrap icon-sage">
                <Users size={17} />
              </div>
            </div>
            <div className="teacher-card-value-row">
              <div className="teacher-card-value">{totalEnrolledStudents}</div>
              <span className="teacher-card-indicator indicator-sage">Enrolled</span>
            </div>
            <div className="teacher-card-subtext">Active students in your assigned sections</div>
          </div>

          {/* Metric 3: Academic Session */}
          <div className="teacher-summary-card">
            <div className="teacher-card-top-row">
              <span className="teacher-card-label">Academic Session</span>
              <div className="teacher-card-icon-wrap icon-blue">
                <Calendar size={17} />
              </div>
            </div>
            <div className="teacher-card-value-row">
              <div className="teacher-card-value" style={{ fontSize: '1.25rem' }}>
                {classes[0]?.academicYear || '2026-2027'}
              </div>
              <span className="teacher-card-indicator">Current</span>
            </div>
            <div className="teacher-card-subtext">Standard school academic calendar</div>
          </div>
        </div>

        {/* 3. Search & Filter Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: '10px',
            border: '1px solid #E8E5DD',
            marginBottom: '20px',
          }}
        >
          <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
            <Search
              size={15}
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
              placeholder="Search by class name, section, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 32px 8px 34px',
                fontSize: '0.88rem',
                borderRadius: '6px',
                border: '1px solid #D5E1ED',
                outline: 'none',
                backgroundColor: '#FAF9F5',
              }}
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
                }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.85rem', color: '#707781' }}>
            Showing <strong>{filteredClasses.length}</strong> of <strong>{classes.length}</strong> assigned classes
          </div>
        </div>

        {/* 4. Loading Skeleton */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="teacher-skeleton-pulse"
                style={{ height: '180px', borderRadius: '10px' }}
              />
            ))}
          </div>
        )}

        {/* 5. Error Banner */}
        {!loading && error && (
          <div className="teacher-error-banner" role="alert">
            <div className="teacher-error-content">
              <AlertCircle size={22} className="teacher-error-icon" />
              <div>
                <h3 className="teacher-error-title">Failed to Load Assigned Classes</h3>
                <p className="teacher-error-desc">{error}</p>
              </div>
            </div>
            <button
              type="button"
              className="teacher-retry-btn"
              onClick={fetchClasses}
            >
              <RotateCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* 6. Empty State */}
        {!loading && !error && filteredClasses.length === 0 && (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E8E5DD',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                margin: '0 auto 16px',
                borderRadius: '50%',
                backgroundColor: '#EEF3F8',
                color: '#20354A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <School size={28} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: '#27313A' }}>
              {searchTerm ? 'No Matching Classes Found' : 'No Classes Assigned Yet'}
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: '#707781', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
              {searchTerm
                ? 'Try adjusting your search query or clear the filter to view all assigned classrooms.'
                : 'School Administration has not allocated any academic classes or subjects to your faculty profile yet. Please contact Management.'}
            </p>
            {searchTerm && (
              <button
                type="button"
                className="teacher-retry-btn"
                onClick={() => setSearchTerm('')}
              >
                <span>Reset Search</span>
              </button>
            )}
          </div>
        )}

        {/* 7. Class Cards Grid */}
        {!loading && !error && filteredClasses.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '18px',
            }}
          >
            {filteredClasses.map((cls, idx) => (
              <div
                key={cls.id || idx}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E8E5DD',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div>
                  {/* Card Top: Class Name & Academic Year */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '1.15rem',
                            fontWeight: 700,
                            color: '#20354A',
                          }}
                        >
                          {cls.className}
                        </span>
                        <span
                          style={{
                            padding: '2px 8px',
                            backgroundColor: '#EEF3F8',
                            color: '#20354A',
                            borderRadius: '4px',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                          }}
                        >
                          Section {cls.section}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: '#707781',
                          display: 'block',
                          marginTop: '4px',
                        }}
                      >
                        Academic Year: {cls.academicYear || '2026-2027'}
                      </span>
                    </div>

                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: '#F4EFE6',
                        color: '#6B5B3E',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <BookOpen size={18} />
                    </div>
                  </div>

                  {/* Subject Tag */}
                  <div style={{ marginBottom: '16px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#E8F5E9',
                        color: '#1B5E20',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                      }}
                    >
                      <Sparkles size={12} />
                      <span>{cls.subject || 'General Instruction'}</span>
                    </span>
                  </div>

                  {/* Student Count Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      backgroundColor: '#FAF9F5',
                      borderRadius: '8px',
                      border: '1px solid #E8E5DD',
                      marginBottom: '18px',
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#D9ECE4',
                        color: '#1E6B52',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Users size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#27313A' }}>
                        {cls.studentCount} Students
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#707781' }}>
                        Officially enrolled in Section {cls.section}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div
                  style={{
                    borderTop: '1px solid #F0EEE6',
                    paddingTop: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Link
                    to="/teacher/students"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#20354A',
                      textDecoration: 'none',
                    }}
                  >
                    <span>View Student Roster</span>
                    <ArrowRight size={14} />
                  </Link>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#166534',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#22C55E',
                      }}
                    />
                    Active Section
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};
