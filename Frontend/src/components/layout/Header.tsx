import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Server, RefreshCw } from 'lucide-react';

export interface HeaderProps {
  onRefreshHealth?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRefreshHealth, isRefreshing }) => {
  const location = useLocation();

  return (
    <header className="site-header">
      <div className="container header-content">
        <Link to="/" className="brand-logo" aria-label="EduHub Home">
          <img
            src="/EduHub-logoti.png"
            alt="EduHub Logo"
            className="brand-img-logo"
          />
        </Link>

        <nav className="main-nav">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <Server size={18} />
            <span>System Status</span>
          </Link>
        </nav>

        <div className="header-actions">
          {onRefreshHealth && (
            <button
              onClick={onRefreshHealth}
              disabled={isRefreshing}
              className="refresh-btn"
              title="Ping Backend API"
            >
              <RefreshCw size={16} className={isRefreshing ? 'spin-icon' : ''} />
              <span>Ping API</span>
            </button>
          )}

          <div className="role-tags-pill">
            <ShieldCheck size={16} className="role-pill-icon" />
            <span>Roles: Management • Teacher • Parent</span>
          </div>
        </div>
      </div>
    </header>
  );
};
