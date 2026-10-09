import React from 'react';
import { ArrowRight } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const scrollToRoles = () => {
    const elem = document.getElementById('roles');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="section-padding about-section" id="about">
      <div className="container">
        <div className="about-grid">
          {/* Left Text Column */}
          <div className="about-text-column">
            <span className="section-tagline">Introducing EduHub</span>
            <h2 className="section-heading-lg">
              Everything Your School Needs, Connected.
            </h2>
            <p className="about-lead-para">
              EduHub brings everyday school activities into one connected platform, helping parents,
              teachers, and school management stay organized and informed.
            </p>
            <p className="about-secondary-para">
              By replacing fragmented paper notices, disconnected messaging channels, and isolated spreadsheets,
              EduHub provides a single, trusted environment where student progress, attendance records, academic
              timetables, and institutional notices remain accessible to those who need them.
            </p>

            <div className="about-link-wrap">
              <button
                onClick={scrollToRoles}
                className="editorial-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <span>Explore the three user perspectives</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Right Editorial Photo Arrangement */}
          <div className="about-photos-cluster" aria-label="School environment photo collage">
            <div className="photo-card-main">
              <img
                src="/images/classroom-learning.jpg"
                alt="Students actively engaged in classroom learning with teacher guiding them"
                loading="lazy"
              />
            </div>
            <div className="photo-card-sub1">
              <img
                src="https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=600&auto=format&fit=crop&q=80"
                alt="School administration and academic hall"
                loading="lazy"
              />
            </div>
            <div className="photo-card-sub2">
              <img
                src="https://images.unsplash.com/photo-1568667256549-094345857637?w=600&auto=format&fit=crop&q=80"
                alt="Students studying quietly in school library"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
