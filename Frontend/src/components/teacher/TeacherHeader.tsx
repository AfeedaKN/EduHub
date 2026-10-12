import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Calendar,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { authApi } from '../../api/authApi';
import type { TeacherNotice } from '../../types/teacher.types';

interface TeacherHeaderProps {
  onOpenMobileSidebar?: () => void;
  notices?: TeacherNotice[];
}

export const TeacherHeader: React.FC<TeacherHeaderProps> = ({
  onOpenMobileSidebar,
  notices = [],
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore API logout error
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };

  const getTeacherInitials = () => {
    if (!user?.name) return 'T';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="teacher-top-header">
      {/* Left: Mobile Trigger, Welcome Greeting & Date Badge */}
      <div className="teacher-header-left">
        <button
          type="button"
          className="teacher-mobile-menu-trigger"
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar menu"
        >
          <Menu size={20} />
        </button>

        <div className="teacher-header-welcome-block">
          <h2 className="teacher-header-greeting-title">
            Welcome back, {user?.name || 'Teacher'}
          </h2>
          <div className="teacher-header-date-badge">
            <Calendar size={13} />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Right: Notifications Bell & Profile Dropdown */}
      <div className="teacher-header-right">
        {/* Notifications Popover */}
        <div className="teacher-header-notif-wrap" ref={notifRef}>
          <button
            type="button"
            className="teacher-header-icon-btn"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="School Announcements & Notifications"
            title="School Notices"
          >
            <Bell size={18} />
            {notices.length > 0 && <span className="teacher-notif-indicator" />}
          </button>

          {notificationsOpen && (
            <div className="teacher-notif-dropdown">
              <div className="teacher-dropdown-user-block">
                <div className="teacher-dropdown-user-name">School Circulars &amp; Notices</div>
                <div className="teacher-dropdown-user-email">
                  {notices.length} active announcements
                </div>
              </div>
              <div className="teacher-dropdown-menu-list">
                {notices.length > 0 ? (
                  notices.map((notice) => (
                    <div
                      key={notice.id}
                      style={{
                        padding: '8px 10px',
                        borderBottom: '1px solid var(--teacher-border-subtle)',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          color: 'var(--teacher-primary)',
                          marginBottom: '2px',
                        }}
                      >
                        {notice.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.70rem',
                          color: 'var(--teacher-text-subtle)',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{notice.category || 'General'}</span>
                        <span>{notice.date}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      padding: '16px 12px',
                      textAlign: 'center',
                      fontSize: '0.78rem',
                      color: 'var(--teacher-text-subtle)',
                    }}
                  >
                    <CheckCircle2 size={20} style={{ margin: '0 auto 6px', color: 'var(--teacher-sage)' }} />
                    <p style={{ margin: 0 }}>No new notifications.</p>
                  </div>
                )}
                <Link
                  to="/teacher/notices"
                  className="teacher-dropdown-item"
                  onClick={() => setNotificationsOpen(false)}
                  style={{
                    justifyContent: 'center',
                    fontWeight: 600,
                    color: 'var(--teacher-muted-blue)',
                    marginTop: '4px',
                  }}
                >
                  <span>View All Notices</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Pill Dropdown */}
        <div className="teacher-header-profile-wrap" ref={dropdownRef}>
          <button
            type="button"
            className="teacher-header-profile-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label="Teacher Account Menu"
          >
            <div className="teacher-header-avatar">{getTeacherInitials()}</div>
            <span className="teacher-header-username" title={user?.name || 'Teacher'}>
              {user?.name || 'Teacher'}
            </span>
            <ChevronDown
              size={14}
              className={`teacher-header-chevron ${dropdownOpen ? 'rotate' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div className="teacher-profile-dropdown">
              <div className="teacher-dropdown-user-block">
                <div className="teacher-dropdown-user-name">{user?.name || 'Teacher'}</div>
                <div className="teacher-dropdown-user-email">{user?.email || ''}</div>
                <span className="teacher-dropdown-role-tag">Teacher</span>
              </div>
              <div className="teacher-dropdown-menu-list">
                <Link
                  to="/teacher/profile"
                  className="teacher-dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <User size={15} />
                  <span>My Profile</span>
                </Link>
                <button
                  type="button"
                  className="teacher-dropdown-item item-danger"
                  onClick={handleLogout}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
