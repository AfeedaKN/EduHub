import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Hash,
  CheckCircle2,
  FileText,
  Award,
  CalendarCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { ChildProfile } from '../../types/parent.types';

interface ChildProfileModalProps {
  child: ChildProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ChildProfileModal: React.FC<ChildProfileModalProps> = ({ child, isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen || !child) return null;

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="auth-modal-dialog parent-profile-detail-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px' }}
      >
        {/* Modal Header */}
        <div className="child-modal-header">
          <div className="child-modal-hero">
            <div className="child-modal-avatar-box">
              {child.avatarUrl ? (
                <img src={child.avatarUrl} alt={child.fullName} className="child-modal-avatar-img" />
              ) : (
                <div className="child-modal-avatar-initials">{getInitials(child.fullName)}</div>
              )}
            </div>
            <div className="child-modal-hero-text">
              <div className="child-modal-title-row">
                <h3 className="child-modal-name">{child.fullName}</h3>
                <span className="child-modal-status-badge">
                  <CheckCircle2 size={12} />
                  <span>{child.status === 'ACTIVE' ? 'Officially Enrolled' : child.status}</span>
                </span>
              </div>
              <div className="child-modal-admission-badge">
                <Hash size={12} />
                <span>Admission ID: {child.studentId}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="parent-dialog-close-btn"
            onClick={onClose}
            aria-label="Close child profile"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="child-modal-body">
          <div className="child-modal-section-title">ACADEMIC & ENROLLMENT INFORMATION</div>
          <div className="child-details-grid">
            <div className="child-detail-item">
              <span className="child-detail-label">Grade / Class</span>
              <span className="child-detail-value highlight">{child.grade || 'Not Assigned'}</span>
            </div>
            <div className="child-detail-item">
              <span className="child-detail-label">Section</span>
              <span className="child-detail-value">{child.section || 'A'}</span>
            </div>
            <div className="child-detail-item">
              <span className="child-detail-label">Academic Year</span>
              <span className="child-detail-value">{child.academicYear || '2026-2027'}</span>
            </div>
            <div className="child-detail-item">
              <span className="child-detail-label">Roll Number</span>
              <span className="child-detail-value">{child.rollNumber || 'Assigned in Class'}</span>
            </div>
            <div className="child-detail-item full-width">
              <span className="child-detail-label">Class Teacher</span>
              <span className="child-detail-value">
                {child.classTeacher || 'Assigned by School Administration'}
              </span>
            </div>
          </div>

          {/* Quick Academic Shortcuts for this student */}
          <div className="child-modal-section-title" style={{ marginTop: '20px' }}>
            ACADEMIC QUICK SHORTCUTS
          </div>
          <div className="child-modal-actions-grid">
            <button
              type="button"
              className="child-modal-action-card"
              onClick={() => handleNavigate('/parent/assignments')}
            >
              <FileText size={16} className="text-primary" />
              <div className="child-modal-action-texts">
                <span className="child-modal-action-title">Assignments</span>
                <span className="child-modal-action-sub">View homework & tasks</span>
              </div>
              <ArrowRight size={14} className="child-modal-action-arr" />
            </button>

            <button
              type="button"
              className="child-modal-action-card"
              onClick={() => handleNavigate('/parent/exams')}
            >
              <Award size={16} className="text-primary" />
              <div className="child-modal-action-texts">
                <span className="child-modal-action-title">Exam Results</span>
                <span className="child-modal-action-sub">Grades & report cards</span>
              </div>
              <ArrowRight size={14} className="child-modal-action-arr" />
            </button>

            <button
              type="button"
              className="child-modal-action-card"
              onClick={() => handleNavigate('/parent/attendance')}
            >
              <CalendarCheck size={16} className="text-primary" />
              <div className="child-modal-action-texts">
                <span className="child-modal-action-title">Attendance</span>
                <span className="child-modal-action-sub">Daily attendance log</span>
              </div>
              <ArrowRight size={14} className="child-modal-action-arr" />
            </button>

            <button
              type="button"
              className="child-modal-action-card"
              onClick={() => handleNavigate('/parent/timetable')}
            >
              <Clock size={16} className="text-primary" />
              <div className="child-modal-action-texts">
                <span className="child-modal-action-title">Timetable</span>
                <span className="child-modal-action-sub">Daily class periods</span>
              </div>
              <ArrowRight size={14} className="child-modal-action-arr" />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="auth-modal-actions" style={{ marginTop: '22px' }}>
          <button
            type="button"
            className="btn-parent-outline-action"
            onClick={onClose}
            style={{ width: '100%', justifyContent: 'center', padding: '9px 16px' }}
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
