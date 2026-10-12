import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  CheckCircle2,
  Settings,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { authApi } from '../../api/authApi';

interface AdminHeaderProps {
  breadcrumbTitle?: string;
  onOpenMobileSidebar?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  breadcrumbTitle = 'Dashboard',
  onOpenMobileSidebar,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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

  const getAdminInitials = () => {
    if (!user?.name) return 'A';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="admin-top-header">
      {/* Left: Mobile hamburger & Clean Breadcrumb */}
      <div className="admin-header-left">
        <button
          type="button"
          className="admin-mobile-menu-trigger"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="admin-breadcrumb">
          <span className="admin-breadcrumb-parent">School Management</span>
          <span className="admin-breadcrumb-separator">/</span>
          <span className="admin-breadcrumb-current">{breadcrumbTitle}</span>
        </div>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="admin-header-right">
        {/* Notification Bell */}
        <div className="admin-header-notif-wrap" ref={notifRef}>
          <button
            type="button"
            className="admin-header-icon-btn"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="admin-notif-indicator" />
          </button>

          {notificationsOpen && (
            <div className="admin-notif-dropdown">
              <div className="admin-dropdown-user-block">
                <div className="admin-dropdown-user-name">Notifications</div>
                <div className="admin-dropdown-user-email">School management updates</div>
              </div>
              <div className="admin-dropdown-menu">
                <div style={{ padding: '8px 10px', fontSize: '0.8rem', color: '#4A5568' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <CheckCircle2 size={16} style={{ color: '#2E7D32', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>Management portal active</p>
                      <span style={{ fontSize: '0.72rem', color: '#707781' }}>System operating normally</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div className="admin-header-profile-wrap" ref={dropdownRef}>
          <button
            type="button"
            className="admin-header-profile-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
          >
            <div className="admin-header-avatar">{getAdminInitials()}</div>
            <span className="admin-header-username" title={user?.name || 'Administrator'}>
              {user?.name || 'Administrator'}
            </span>
            <ChevronDown
              size={14}
              className={`admin-header-chevron ${dropdownOpen ? 'rotate' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div className="admin-profile-dropdown">
              <div className="admin-dropdown-user-block">
                <div className="admin-dropdown-user-name">{user?.name || 'Administrator'}</div>
                <div className="admin-dropdown-user-email">{user?.email || 'admin@eduhub.school'}</div>
                <span className="admin-dropdown-role-tag">Management</span>
              </div>

              <div className="admin-dropdown-menu">
                <Link
                  to="/admin/settings"
                  className="admin-dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings size={15} />
                  <span>Admin Settings</span>
                </Link>

                <button
                  type="button"
                  className="admin-dropdown-item item-danger"
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
