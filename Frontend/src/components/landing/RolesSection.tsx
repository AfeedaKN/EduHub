import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, HeartHandshake, BookOpen, Building2 } from 'lucide-react';

export const RolesSection: React.FC = () => {
  return (
    <section className="section-padding roles-section" id="roles">
      <div className="container">
        <div className="roles-header">
          <span className="section-tagline">Tailored Experiences</span>
          <h2 className="section-heading-lg">
            One School. Three Connected Experiences.
          </h2>
          <p className="section-desc-lg" style={{ margin: '0 auto' }}>
            EduHub creates purposeful, focused digital environments for each member of the school community
            while maintaining a unified central record.
          </p>
        </div>

        <div className="roles-horizontal-grid">
          {/* For Parents */}
          <div className="role-visual-block">
            <div className="role-block-image-wrap">
              <img
                src="/images/parent-life.jpg"
                alt="Mother walking with daughter on school pathway"
                loading="lazy"
              />
              <div className="role-badge-overlay">
                <HeartHandshake size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                <span>Parents</span>
              </div>
            </div>
            <div className="role-block-body">
              <h3 className="role-block-title">For Parents</h3>
              <p className="role-block-desc">
                Stay informed about your child&apos;s school life, academic progress, attendance, and important updates in real time.
              </p>
              <Link to="/login" className="role-block-cta">
                <span>Explore Parent Experience</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* For Teachers */}
          <div className="role-visual-block">
            <div className="role-block-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80"
                alt="Teacher explaining educational material to students"
                loading="lazy"
              />
              <div className="role-badge-overlay">
                <BookOpen size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                <span>Teachers</span>
              </div>
            </div>
            <div className="role-block-body">
              <h3 className="role-block-title">For Teachers</h3>
              <p className="role-block-desc">
                Manage classes, record attendance, organize assignments, and maintain student results with clear, intuitive tools.
              </p>
              <Link to="/login" className="role-block-cta">
                <span>Explore Teacher Experience</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* For School Management */}
          <div className="role-visual-block">
            <div className="role-block-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&auto=format&fit=crop&q=80"
                alt="School leadership and administrative campus"
                loading="lazy"
              />
              <div className="role-badge-overlay">
                <Building2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                <span>Management</span>
              </div>
            </div>
            <div className="role-block-body">
              <h3 className="role-block-title">For School Management</h3>
              <p className="role-block-desc">
                Manage admissions, staff, school operations, and important administrative activities with institutional oversight.
              </p>
              <Link to="/login" className="role-block-cta">
                <span>Explore Management Experience</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
