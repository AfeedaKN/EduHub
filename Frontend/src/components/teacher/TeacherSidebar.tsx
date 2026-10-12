import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  CalendarCheck,
  Clock,
  BookOpen,
  Award,
  Bell,
  User,
  LogOut,
  X,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { authApi } from '../../api/authApi';

interface TeacherSidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore API logout error if session expired
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

  const teachingNavLinks = [
    { to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/teacher/classes', label: 'My Classes', icon: GraduationCap },
    { to: '/teacher/students', label: 'My Students', icon: Users },
    { to: '/teacher/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/teacher/timetable', label: 'Timetable', icon: Clock },
  ];

  const academicNavLinks = [
    { to: '/teacher/assignments', label: 'Assignments', icon: BookOpen },
    { to: '/teacher/exams', label: 'Exams & Marks', icon: Award },
    { to: '/teacher/notices', label: 'Notices', icon: Bell },
    { to: '/teacher/profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="teacher-sidebar-mobile-overlay"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`teacher-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Top Brand Header */}
        <div className="teacher-sidebar-header">
          <NavLink
            to="/teacher/dashboard"
            className="teacher-sidebar-brand"
            onClick={onCloseMobile}
          >
            <img
              src="/EduHub-logoti.png"
              alt="EduHub Logo"
              className="teacher-sidebar-logo-img"
            />
            <div className="teacher-sidebar-brand-text">
              <span className="teacher-sidebar-school-label">EduHub School</span>
              <span className="teacher-sidebar-portal-tag">Faculty Portal</span>
            </div>
          </NavLink>
          {isMobileOpen && (
            <button
              type="button"
              className="teacher-sidebar-close-btn"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="teacher-sidebar-nav" aria-label="Teacher Portal Navigation">
          <div className="teacher-nav-section-title">Teaching &amp; Classes</div>
          <ul className="teacher-nav-list">
            {teachingNavLinks.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to} className="teacher-nav-item">
                  <NavLink
                    to={item.to}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `teacher-nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <Icon size={17} className="teacher-nav-icon" />
                    <span className="teacher-nav-label">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>

          <div className="teacher-nav-section-title">Academic &amp; Updates</div>
          <ul className="teacher-nav-list">
            {academicNavLinks.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to} className="teacher-nav-item">
                  <NavLink
                    to={item.to}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `teacher-nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <Icon size={17} className="teacher-nav-icon" />
                    <span className="teacher-nav-label">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer with Teacher profile info & Logout anchored neatly at the bottom */}
        <div className="teacher-sidebar-footer">
          <div className="teacher-user-pill">
            <div className="teacher-avatar-badge">{getTeacherInitials()}</div>
            <div className="teacher-user-info">
              <div className="teacher-user-name" title={user?.name || 'Teacher'}>
                {user?.name || 'Teacher'}
              </div>
              <div className="teacher-user-role-badge">Faculty Member</div>
            </div>
            <button
              type="button"
              className="teacher-sidebar-logout-btn"
              onClick={handleLogout}
              title="Log out of Teacher Portal"
              aria-label="Log out of Teacher Portal"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
