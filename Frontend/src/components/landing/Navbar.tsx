import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight, UserCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className={`landing-nav ${isScrolled ? 'nav-solid' : 'nav-transparent'}`}>
        <div className="container nav-inner">
          {/* Brand Logo */}
          <Link to="/" className="nav-brand-logo" aria-label="EduHub Home">
            <img
              src="/EduHub-logoti.png"
              alt="EduHub Logo"
              className="nav-logo-img"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav aria-label="Main Navigation">
            <ul className="nav-menu-links">
              <li>
                <span
                  role="button"
                  tabIndex={0}
                  className="nav-link-item"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  onKeyDown={(e) => e.key === 'Enter' && window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Home
                </span>
              </li>
              <li>
                <span
                  role="button"
                  tabIndex={0}
                  className="nav-link-item"
                  onClick={() => scrollToSection('about')}
                  onKeyDown={(e) => e.key === 'Enter' && scrollToSection('about')}
                >
                  About
                </span>
              </li>
              <li>
                <span
                  role="button"
                  tabIndex={0}
                  className="nav-link-item"
                  onClick={() => scrollToSection('benefits')}
                  onKeyDown={(e) => e.key === 'Enter' && scrollToSection('benefits')}
                >
                  Benefits
                </span>
              </li>
              <li>
                <span
                  role="button"
                  tabIndex={0}
                  className="nav-link-item"
                  onClick={() => scrollToSection('school-life')}
                  onKeyDown={(e) => e.key === 'Enter' && scrollToSection('school-life')}
                >
                  School Life
                </span>
              </li>
              <li>
                <span
                  role="button"
                  tabIndex={0}
                  className="nav-link-item"
                  onClick={() => scrollToSection('careers')}
                  onKeyDown={(e) => e.key === 'Enter' && scrollToSection('careers')}
                >
                  Careers
                </span>
              </li>
              <li>
                <span
                  role="button"
                  tabIndex={0}
                  className="nav-link-item"
                  onClick={() => scrollToSection('footer-contact')}
                  onKeyDown={(e) => e.key === 'Enter' && scrollToSection('footer-contact')}
                >
                  Contact
                </span>
              </li>
            </ul>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="nav-actions">
            <Link to="/login" className="btn-nav-outline">
              <UserCheck size={16} />
              <span>Parent / Portal Login</span>
            </Link>
            <button
              onClick={() => scrollToSection('registration')}
              className="btn-nav-primary"
            >
              <span>Register Your Child</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <ul className="mobile-menu-links">
          <li>
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setMobileMenuOpen(false);
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
              About
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
              Benefits
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
          <li>
            <a
              href="#careers"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('careers');
              }}
            >
              Careers
            </a>
          </li>
          <li>
            <a
              href="#footer-contact"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('footer-contact');
              }}
            >
              Contact
            </a>
          </li>
        </ul>

        <div className="mobile-nav-actions">
          <Link
            to="/login"
            className="btn-nav-outline"
            onClick={() => setMobileMenuOpen(false)}
            style={{ justifyContent: 'center' }}
          >
            <UserCheck size={16} />
            <span>Parent / Portal Login</span>
          </Link>
          <button
            onClick={() => scrollToSection('registration')}
            className="btn-nav-primary"
            style={{ justifyContent: 'center' }}
          >
            <span>Register Your Child</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </>
  );
};
