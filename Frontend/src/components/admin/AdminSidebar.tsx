import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck2,
  Users,
  GraduationCap,
  CalendarCheck,
  Award,
  CreditCard,
  MessageSquare,
  Briefcase,
  Settings,
  ChevronDown,
  X,
  LogOut,
  UserCheck,
  UserPlus,
  BookOpen,
  Calendar,
  Layers,
  Bell,
  Video,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { authApi } from '../../api/authApi';

interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  pendingAdmissionsCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
  pendingAdmissionsCount,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  // Auto-expand submenus if currently on that section
  const [peopleOpen, setPeopleOpen] = useState(
    location.pathname.startsWith('/admin/people') || location.pathname.startsWith('/admin/teachers')
  );
  const [academicsOpen, setAcademicsOpen] = useState(
    location.pathname.startsWith('/admin/academics') || location.pathname.startsWith('/admin/classes')
  );
  const [communicationOpen, setCommunicationOpen] = useState(
    location.pathname.startsWith('/admin/communication')
  );

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore API error
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
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="admin-sidebar-mobile-overlay" onClick={onCloseMobile} />
      )}

      <aside className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Top Brand Logo and School Management Title */}
        <div className="admin-sidebar-header">
          <NavLink to="/admin/dashboard" className="admin-sidebar-brand" onClick={onCloseMobile}>
            <img
              src="/EduHub-logoti.png"
              alt="EduHub Logo"
              className="admin-sidebar-logo-img"
            />
            <div className="admin-sidebar-brand-text">
              <span className="admin-sidebar-school-label">School Management</span>
              <span className="admin-sidebar-portal-tag">Admin Workspace</span>
            </div>
          </NavLink>
          {isMobileOpen && (
            <button
              type="button"
              className="admin-sidebar-close-btn"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="admin-sidebar-nav">
          <div className="admin-nav-section-title">Operations</div>
          <ul className="admin-nav-list">
            {/* 1. Dashboard */}
            <li className="admin-nav-item">
              <NavLink
                to="/admin/dashboard"
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `admin-nav-link ${isActive ? 'active' : ''}`
                }
              >
                <LayoutDashboard size={18} className="admin-nav-icon" />
                <span className="admin-nav-label">Dashboard</span>
              </NavLink>
            </li>

            {/* 2. Admissions */}
            <li className="admin-nav-item">
              <NavLink
                to="/admin/admissions"
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `admin-nav-link ${isActive ? 'active' : ''}`
                }
              >
                <FileCheck2 size={18} className="admin-nav-icon" />
                <span className="admin-nav-label">Admissions</span>
                {typeof pendingAdmissionsCount === 'number' && pendingAdmissionsCount > 0 && (
                  <span className="admin-nav-badge" title={`${pendingAdmissionsCount} Pending Admissions`}>
                    {pendingAdmissionsCount}
                  </span>
                )}
              </NavLink>
            </li>

            {/* 3. People (Expandable: Students, Teachers, Parents) */}
            <li className="admin-nav-item">
              <button
                type="button"
                className={`admin-nav-link ${peopleOpen ? 'expanded' : ''}`}
                onClick={() => setPeopleOpen(!peopleOpen)}
              >
                <Users size={18} className="admin-nav-icon" />
                <span className="admin-nav-label">People</span>
                <ChevronDown
                  size={15}
                  className={`admin-nav-chevron ${peopleOpen ? 'open' : ''}`}
                />
              </button>

              {peopleOpen && (
                <ul className="admin-nav-sublist">
                  <li>
                    <NavLink
                      to="/admin/people/students"
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `admin-nav-sublink ${isActive ? 'active' : ''}`
                      }
                    >
                      <UserCheck size={14} />
                      <span>Students</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/admin/people/teachers"
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `admin-nav-sublink ${isActive ? 'active' : ''}`
                      }
                    >
                      <UserPlus size={14} />
                      <span>Teachers</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/admin/people/parents"
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `admin-nav-sublink ${isActive ? 'active' : ''}`
                      }
                    >
                      <Users size={14} />
                      <span>Parents</span>
                    </NavLink>
                  </li>
                </ul>
              )}
            </li>

            {/* 4. Academics (Expandable: Classes & Sections, Subjects, Timetable) */}
            <li className="admin-nav-item">
              <button
                type="button"
                className={`admin-nav-link ${academicsOpen ? 'expanded' : ''}`}
                onClick={() => setAcademicsOpen(!academicsOpen)}
              >
                <GraduationCap size={18} className="admin-nav-icon" />
                <span className="admin-nav-label">Academics</span>
                <ChevronDown
                  size={15}
                  className={`admin-nav-chevron ${academicsOpen ? 'open' : ''}`}
                />
              </button>

              {academicsOpen && (
                <ul className="admin-nav-sublist">
                  <li>
                    <NavLink
                      to="/admin/academics/classes"
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `admin-nav-sublink ${isActive ? 'active' : ''}`
                      }
                    >
                      <Layers size={14} />
                      <span>Classes & Sections</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/admin/academics/subjects"
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `admin-nav-sublink ${isActive ? 'active' : ''}`
                      }
                    >
                      <BookOpen size={14} />
                      <span>Subjects</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/admin/academics/timetable"
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `admin-nav-sublink ${isActive ? 'active' : ''}`
                      }
                    >
                      <Calendar size={14} />
                      <span>Timetable</span>
                    </NavLink>
                  </li>
                </ul>
              )}
            </li>

            {/* 5. Attendance */}
            <li className="admin-nav-item">
              <NavLink
                to="/admin/attendance"
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `admin-nav-link ${isActive ? 'active' : ''}`
                }
              >
                <CalendarCheck size={18} className="admin-nav-icon" />
                <span className="admin-nav-label">Attendance</span>
              </NavLink>
            </li>

            {/* 6. Exams & Results */}
            <li className="admin-nav-item">
              <NavLink
                to="/admin/exams"
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `admin-nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Award size={18} className="admin-nav-icon" />
                <span className="admin-nav-label">Exams & Results</span>
              </NavLink>
            </li>

            {/* 7. Fees */}
            <li className="admin-nav-item">
              <NavLink
                to="/admin/fees"
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `admin-nav-link ${isActive ? 'active' : ''}`
                }
              >
                <CreditCard size={18} className="admin-nav-icon" />
                <span className="admin-nav-label">Fees</span>
              </NavLink>
            </li>

            {/* 8. Communication (Expandable: Notices, Meetings) */}
            <li className="admin-nav-item">
              <button
                type="button"
                className={`admin-nav-link ${communicationOpen ? 'expanded' : ''}`}
                onClick={() => setCommunicationOpen(!communicationOpen)}
              >
                <MessageSquare size={18} className="admin-nav-icon" />
                <span className="admin-nav-label">Communication</span>
                <ChevronDown
                  size={15}
                  className={`admin-nav-chevron ${communicationOpen ? 'open' : ''}`}
                />
              </button>

              {communicationOpen && (
                <ul className="admin-nav-sublist">
                  <li>
                    <NavLink
                      to="/admin/communication/notices"
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `admin-nav-sublink ${isActive ? 'active' : ''}`
                      }
                    >
                      <Bell size={14} />
                      <span>Notices</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/admin/communication/meetings"
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `admin-nav-sublink ${isActive ? 'active' : ''}`
                      }
                    >
                      <Video size={14} />
                      <span>Meetings</span>
                    </NavLink>
                  </li>
                </ul>
              )}
            </li>

            {/* 9. Careers */}
            <li className="admin-nav-item">
              <NavLink
                to="/admin/careers"
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `admin-nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Briefcase size={18} className="admin-nav-icon" />
                <span className="admin-nav-label">Careers</span>
              </NavLink>
            </li>

            {/* 10. Settings */}
            <li className="admin-nav-item">
              <NavLink
                to="/admin/settings"
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `admin-nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Settings size={18} className="admin-nav-icon" />
                <span className="admin-nav-label">Settings</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Authenticated Admin User Bottom Footer */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-pill">
            <div className="admin-avatar-badge">{getAdminInitials()}</div>
            <div className="admin-user-info">
              <div className="admin-user-name" title={user?.name || 'Administrator'}>
                {user?.name || 'Administrator'}
              </div>
              <div className="admin-user-role-badge">School Management</div>
            </div>
            <button
              type="button"
              className="admin-sidebar-logout-btn"
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
