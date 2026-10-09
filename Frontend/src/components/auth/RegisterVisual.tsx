import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, HeartHandshake } from 'lucide-react';

export const RegisterVisual: React.FC = () => {
  return (
    <div className="login-visual-panel" aria-label="EduHub Parent Community">
      {/* Background Image showing parent and child on school grounds */}
      <img
        src="/images/parent-life.jpg"
        alt="Mother and elementary child walking happily together on school walkway"
        className="login-visual-bg"
      />
      {/* Subtle Dark Gradient Overlay */}
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
            <HeartHandshake size={14} />
            <span>Parent Onboarding</span>
          </div>
        </div>

        <div className="login-visual-middle">
          <h2 className="login-visual-heading">
            Your School Connection Starts Here.
          </h2>
          <p className="login-visual-desc">
            Create your parent account and stay connected with your child&apos;s school journey, daily updates, and academic progress.
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
