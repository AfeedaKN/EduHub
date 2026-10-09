import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LogIn } from 'lucide-react';

export const CtaSection: React.FC = () => {
  const scrollToAbout = () => {
    const elem = document.getElementById('about');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="closing-cta-section" aria-label="Join our school community">
      <div className="cta-bg-pattern" aria-hidden="true" />
      <div className="container closing-cta-content">
        <h2 className="closing-cta-title">
          Stay Connected to Every Part of School Life.
        </h2>
        <p className="closing-cta-desc">
          Discover a simpler, more unified way for parents, teachers, and school management
          to collaborate and foster student success.
        </p>

        <div className="closing-cta-actions">
          <Link to="/login" className="btn-hero-primary" style={{ textDecoration: 'none' }}>
            <LogIn size={18} />
            <span>Access Your Portal</span>
            <ArrowRight size={18} />
          </Link>

          <button onClick={scrollToAbout} className="btn-hero-secondary">
            <span>Learn About EduHub</span>
          </button>
        </div>
      </div>
    </section>
  );
};
