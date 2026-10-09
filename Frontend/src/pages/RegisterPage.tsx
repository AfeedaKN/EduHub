import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { RegisterVisual } from '../components/auth/RegisterVisual';
import { RegisterForm } from '../components/auth/RegisterForm';

export const RegisterPage: React.FC = () => {
  return (
    <div className="login-split-page-root">
      {/* LEFT COLUMN: Visual Brand & Parent Community Experience */}
      <RegisterVisual />

      {/* RIGHT COLUMN: Parent Registration Form Area */}
      <div className="login-form-panel">
        <div className="login-form-inner-container" style={{ maxWidth: '460px' }}>
          {/* Top Bar Navigation */}
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

          {/* Registration Form Component */}
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
