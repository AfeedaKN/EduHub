import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  GraduationCap,
  Calendar,
  FileText,
  Award,
  CreditCard,
  MessageSquare,
  User,
  LogOut,
  ChevronDown,
  X,
  Bell,
  Mail,
  Video,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { authApi } from '../../api/authApi';

interface ParentSidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const ParentSidebar: React.FC<ParentSidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [communicationOpen, setCommunicationOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout api error
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };

  const getUserInitials = () => {
    if (!user?.name) return 'P';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/parent/dashboard' },
    { label: 'My Children', icon: Users, path: '/parent/children' },
    { label: 'Attendance', icon: CalendarCheck, path: '/parent/attendance' },
    { label: 'Academics', icon: GraduationCap, path: '/parent/academics' },
    { label: 'Timetable', icon: Calendar, path: '/parent/timetable' },
    { label: 'Assignments', icon: FileText, path: '/parent/assignments' },
    { label: 'Exams & Results', icon: Award, path: '/parent/exams' },
    { label: 'Fees', icon: CreditCard, path: '/parent/fees' },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div className="parent-sidebar-mobile-overlay" onClick={onCloseMobile} />
      )}

      <aside className={`parent-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Top Brand Logo */}
        <div className="parent-sidebar-header">
          <NavLink to="/" className="parent-sidebar-logo-link" onClick={onCloseMobile}>
            <img
              src="/EduHub-logoti.png"
              alt="EduHub"
              className="parent-sidebar-logo-img"
            />
          </NavLink>
          {isMobileOpen && (
            <button
              type="button"
              className="parent-sidebar-close-btn"
              onClick={onCloseMobile}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="parent-sidebar-nav">
          <div className="parent-nav-section-title">MAIN MENU</div>
          <ul className="parent-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path} className="parent-nav-item">
                  <NavLink
                    to={item.path}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `parent-nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <Icon size={18} className="parent-nav-icon" />
                    <span className="parent-nav-label">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}

            {/* Expandable Communication Section */}
            <li className="parent-nav-item">
              <button
                type="button"
                className={`parent-nav-link parent-nav-expand-btn ${communicationOpen ? 'expanded' : ''}`}
                onClick={() => setCommunicationOpen(!communicationOpen)}
              >
                <MessageSquare size={18} className="parent-nav-icon" />
                <span className="parent-nav-label">Communication</span>
                <ChevronDown
                  size={15}
                  className={`parent-nav-chevron ${communicationOpen ? 'open' : ''}`}
                />
              </button>

              {communicationOpen && (
                <ul className="parent-nav-sublist">
                  <li>
                    <NavLink
                      to="/parent/communication/notices"
                      onClick={onCloseMobile}
                      className="parent-nav-sublink"
                    >
                      <Bell size={14} />
                      <span>Notices</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/parent/communication/messages"
                      onClick={onCloseMobile}
                      className="parent-nav-sublink"
                    >
                      <Mail size={14} />
                      <span>Messages</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/parent/communication/meetings"
                      onClick={onCloseMobile}
                      className="parent-nav-sublink"
                    >
                      <Video size={14} />
                      <span>PTM Meetings</span>
                    </NavLink>
                  </li>
                </ul>
              )}
            </li>

            {/* Profile */}
            <li className="parent-nav-item">
              <NavLink
                to="/parent/profile"
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `parent-nav-link ${isActive ? 'active' : ''}`
                }
              >
                <User size={18} className="parent-nav-icon" />
                <span className="parent-nav-label">Profile</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Bottom User Pill & Logout */}
        <div className="parent-sidebar-footer">
          <div className="parent-user-pill">
            <div className="parent-avatar-badge">{getUserInitials()}</div>
            <div className="parent-user-info">
              <div className="parent-user-name" title={user?.name || 'Parent User'}>
                {user?.name || 'Parent User'}
              </div>
              <div className="parent-user-role-badge">Parent Account</div>
            </div>
            <button
              type="button"
              className="parent-sidebar-logout-btn"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
