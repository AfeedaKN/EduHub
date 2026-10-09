import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LoginVisual } from '../components/auth/LoginVisual';
import { LoginRoleSelector, UserRole } from '../components/auth/LoginRoleSelector';
import { LoginForm } from '../components/auth/LoginForm';

export const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('PARENT');

  return (
    <div className="login-split-page-root">
      {/* LEFT COLUMN: Visual Brand & Campus Experience */}
      <LoginVisual />

      {/* RIGHT COLUMN: Authentication & Portal Access Area */}
      <div className="login-form-panel">
        <div className="login-form-inner-container">
          {/* Top Bar with Navigation Link */}
          <div className="login-panel-top-nav">
            <Link to="/" className="login-return-btn" aria-label="Return to EduHub Website">
              <ArrowLeft size={16} />
              <span>Return to Website</span>
            </Link>

            {/* Mobile-only logo */}
            <Link to="/" className="login-mobile-logo" aria-label="EduHub Home">
              <img
                src="/EduHub-logoti.png"
                alt="EduHub Logo"
                style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              />
            </Link>
          </div>

          {/* Main Welcome Heading */}
          <div className="login-welcome-block">
            <h1 className="login-main-title">Welcome to EduHub</h1>
            <p className="login-main-subtitle">
              Sign in to access your secure school portal.
            </p>
          </div>

          {/* Role Selector */}
          <LoginRoleSelector
            selectedRole={selectedRole}
            onSelectRole={(role) => setSelectedRole(role)}
          />

          {/* Contextual Login Form */}
          <LoginForm selectedRole={selectedRole} />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
