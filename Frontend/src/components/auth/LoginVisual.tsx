import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles } from 'lucide-react';

export const LoginVisual: React.FC = () => {
  return (
    <div className="login-visual-panel" aria-label="EduHub School Community">
      {/* Background Image */}
      <img
        src="/images/hero-campus.jpg"
        alt="EduHub campus with students and lush lawns"
        className="login-visual-bg"
      />
      {/* Subtle Dark Gradient Overlay for text legibility */}
      <div className="login-visual-overlay" />

      {/* Visual Content */}
      <div className="login-visual-content">
        <div className="login-visual-top">
          <Link to="/" className="login-visual-brand" aria-label="EduHub Home">
            <img
              src="/EduHub-logoti.png"
              alt="EduHub Logo"
              className="login-visual-logo-img"
            />
          </Link>
          <div className="login-visual-badge">
            <Sparkles size={14} />
            <span>School ERP Platform</span>
          </div>
        </div>

        <div className="login-visual-middle">
          <h2 className="login-visual-heading">
            A Better Connection to Your Child&apos;s School.
          </h2>
          <p className="login-visual-desc">
            One connected space for parents, teachers, and school management to stay informed, aligned, and organized.
          </p>
        </div>

        <div className="login-visual-bottom">
          <div className="login-visual-tagline">
            <ShieldCheck size={16} />
            <span>One school. One community. One connected experience.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
