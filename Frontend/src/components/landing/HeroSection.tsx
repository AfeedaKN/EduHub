import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, ShieldCheck } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const scrollToAbout = () => {
    const aboutElem = document.getElementById('about');
    if (aboutElem) {
      aboutElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-section" id="top" aria-label="Welcome to EduHub">
      {/* Immersive Campus Photograph & Overlay */}
      <div className="hero-bg-media">
        <img
          src="/images/hero-campus.jpg"
          alt="Modern private school campus with green lawns and students walking on pathways"
          className="hero-photo"
          loading="eager"
        />
        <div className="hero-overlay" />
      </div>

      {/* Hero Content */}
      <div className="container hero-content">
        <div className="hero-text-block">
          <div className="hero-badge-pill">
            <ShieldCheck size={16} />
            <span>One School • Unified Community</span>
          </div>

          <h1 className="hero-title">
            A Better Connection to Your Child&apos;s School.
          </h1>

          <p className="hero-subtitle">
            Bringing parents, teachers, and school management together for a more connected,
            transparent, and supportive school experience.
          </p>

          <div className="hero-cta-group">
            <button onClick={scrollToAbout} className="btn-hero-primary">
              <span>Explore EduHub</span>
              <ArrowRight size={18} />
            </button>

            <Link to="/login" className="btn-hero-secondary">
              <span>Access Your Portal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Subtle Scroll Indicator */}
      <div
        className="hero-scroll-indicator"
        onClick={scrollToAbout}
        role="button"
        tabIndex={0}
        aria-label="Scroll down to learn more"
        onKeyDown={(e) => e.key === 'Enter' && scrollToAbout()}
      >
        <div className="scroll-mouse-icon">
          <div className="scroll-wheel-dot" />
        </div>
        <span>Scroll to explore</span>
        <ArrowDown size={14} />
      </div>
    </section>
  );
};
