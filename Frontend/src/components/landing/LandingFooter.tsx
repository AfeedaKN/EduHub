import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, MapPin, Phone } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  const scrollToSection = (sectionId: string) => {
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="landing-footer" id="footer-contact">
      <div className="container">
        <div className="footer-top-grid">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <Link to="/" aria-label="EduHub Home">
              <img
                src="/EduHub-logoti.png"
                alt="EduHub Logo"
                className="footer-logo-img"
              />
            </Link>
            <p className="footer-brand-desc">
              A comprehensive School ERP platform dedicated to connecting school management,
              teachers, and parents in one unified learning ecosystem.
            </p>
          </div>

          {/* Platform Navigation */}
          <div>
            <h4 className="footer-col-title">Navigation</h4>
            <ul className="footer-links-list">
              <li>
                <a
                  href="#top"
                  onClick={(e) => {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('about');
                  }}
                >
                  About EduHub
                </a>
              </li>
              <li>
                <a
                  href="#benefits"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('benefits');
                  }}
                >
                  Platform Benefits
                </a>
              </li>
              <li>
                <a
                  href="#school-life"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('school-life');
                  }}
                >
                  School Life
                </a>
              </li>
            </ul>
          </div>

          {/* Community & Portals */}
          <div>
            <h4 className="footer-col-title">Portals & Community</h4>
            <ul className="footer-links-list">
              <li>
                <Link to="/login">Parent & Staff Portal</Link>
              </li>
              <li>
                <a
                  href="#registration"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('registration');
                  }}
                >
                  Student Registration
                </a>
              </li>
              <li>
                <a
                  href="#careers"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('careers');
                  }}
                >
                  Careers & Faculty
                </a>
              </li>
              <li>
                <Link to="/system-status" style={{ opacity: 0.75 }}>
                  System Diagnostics
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / Inquiries */}
          <div>
            <h4 className="footer-col-title">School Inquiries</h4>
            <ul className="footer-links-list" style={{ gap: '14px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} style={{ color: 'var(--color-sage)', flexShrink: 0 }} />
                <span>EduHub Campus Office</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} style={{ color: 'var(--color-sage)', flexShrink: 0 }} />
                <span>admissions@eduhub.school</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={16} style={{ color: 'var(--color-sage)', flexShrink: 0 }} />
                <span>+1 (800) EDU-HUB1</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <p>
            © {new Date().getFullYear()} EduHub Platform. All rights reserved. Dedicated to educational excellence.
          </p>
          <div className="footer-legal-links">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} /> Institutional Security
            </span>
            <span>•</span>
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <span>•</span>
            <a href="#terms" onClick={(e) => e.preventDefault()}>Terms & Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
