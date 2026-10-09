import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, User, LogOut, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { authApi } from '../../api/authApi';

interface ParentHeaderProps {
  pageTitle?: string;
  onOpenMobileSidebar?: () => void;
}

export const ParentHeader: React.FC<ParentHeaderProps> = ({
  pageTitle = 'Dashboard',
  onOpenMobileSidebar,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
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
      // Ignore
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

  return (
    <header className="parent-top-header">
      <div className="parent-header-left">
        {/* Mobile menu hamburger */}
        <button
          type="button"
          className="parent-mobile-menu-trigger"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <div className="parent-header-title-wrap">
          <h1 className="parent-header-page-title">{pageTitle}</h1>
          <span className="parent-header-role-tag">Parent Portal</span>
        </div>
      </div>

      <div className="parent-header-right">
        {/* Notification Bell */}
        <div className="parent-header-notif-wrap" ref={notifRef}>
          <button
            type="button"
            className="parent-header-icon-btn"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="Notifications"
          >
            <Bell size={19} />
            <span className="parent-notif-indicator" />
          </button>

          {notificationsOpen && (
            <div className="parent-notif-dropdown">
              <div className="parent-notif-dropdown-header">
                <span className="parent-notif-title">Notifications</span>
                <span className="parent-notif-badge">1 New</span>
              </div>
              <div className="parent-notif-list">
                <div className="parent-notif-item unread">
                  <div className="parent-notif-icon-box">
                    <CheckCircle2 size={16} className="text-primary" />
                  </div>
                  <div className="parent-notif-content">
                    <p className="parent-notif-text">
                      Welcome to EduHub! Connect your child to get started with admissions.
                    </p>
                    <span className="parent-notif-time">Just now</span>
                  </div>
                </div>
              </div>
              <div className="parent-notif-footer">
                <Link
                  to="/parent/communication/notices"
                  onClick={() => setNotificationsOpen(false)}
                  className="parent-notif-view-all"
                >
                  View All School Notices
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="parent-header-profile-wrap" ref={dropdownRef}>
          <button
            type="button"
            className="parent-header-profile-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
          >
            <div className="parent-header-avatar">{getUserInitials()}</div>
            <span className="parent-header-username">{user?.name || 'Parent'}</span>
            <ChevronDown size={14} className={`parent-header-chevron ${dropdownOpen ? 'rotate' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="parent-profile-dropdown">
              <div className="parent-profile-dropdown-user">
                <div className="parent-dropdown-name">{user?.name || 'Parent'}</div>
                <div className="parent-dropdown-email">{user?.email || 'parent@school.org'}</div>
              </div>

              <div className="parent-dropdown-divider" />

              <Link
                to="/parent/profile"
                className="parent-dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                <User size={16} />
                <span>My Profile</span>
              </Link>

              <button
                type="button"
                className="parent-dropdown-item text-danger"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
