import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export const CareersSection: React.FC = () => {
  const scrollToContact = () => {
    const contactElem = document.getElementById('footer-contact');
    if (contactElem) {
      contactElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="section-padding-sm careers-section" id="careers">
      <div className="container">
        <div className="careers-card">
          <div className="careers-content">
            <span className="section-tagline">Faculty & Staff</span>
            <h2 className="section-heading-lg" style={{ fontSize: '2.1rem', marginBottom: '14px' }}>
              Grow With Our School Community.
            </h2>
            <p className="section-desc-lg" style={{ fontSize: '1.02rem', marginBottom: '28px' }}>
              Explore opportunities to contribute to a supportive, innovative, and inspiring learning environment where teachers and staff thrive together.
            </p>

            <div>
              <button
                onClick={scrollToContact}
                className="btn-nav-primary"
                style={{ display: 'inline-flex', padding: '12px 24px', fontSize: '0.94rem' }}
              >
                <Sparkles size={16} />
                <span>Explore Careers & Opportunities</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="careers-photo-wrap">
            <img
              src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=900&auto=format&fit=crop&q=80"
              alt="Faculty members collaborating on curriculum development in bright staff room"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
