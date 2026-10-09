import React from 'react';
import { Quote } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const stories = [
    {
      quote:
        'EduHub has made communicating with teachers and keeping track of my son’s weekly assignments so effortless. We never miss an important school update now.',
      name: 'Eleanor Vance',
      grade: 'Parent of Grade 6 Student',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    },
    {
      quote:
        'The admission tracking was transparent from day one. Being able to check attendance and exam schedules in one clean portal gives our family peace of mind.',
      name: 'Marcus Sterling',
      grade: 'Parent of Grade 9 Student',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    },
    {
      quote:
        'Having direct visibility into the academic timetable and school notices without sorting through endless email chains has truly brought our family closer to the school.',
      name: 'Priya Nair',
      grade: 'Parent of Grade 4 Student',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <section className="section-padding testimonials-section">
      <div className="container">
        <div className="testimonials-header">
          <span className="section-tagline">Community Voices</span>
          <h2 className="section-heading-lg">Building Stronger School Connections.</h2>
          <p className="section-desc-lg" style={{ margin: '0 auto' }}>
            Hear how a single, cohesive platform supports parents and students throughout the school year.
          </p>
        </div>

        <div className="testimonials-grid">
          {stories.map((story, index) => (
            <div key={index} className="testimonial-card">
              <div>
                <Quote size={32} className="testimonial-quote-icon" />
                <p className="testimonial-body">
                  &ldquo;{story.quote}&rdquo;
                </p>
              </div>

              <div className="testimonial-author-row">
                <img
                  src={story.avatar}
                  alt={story.name}
                  className="author-avatar"
                  loading="lazy"
                />
                <div>
                  <div className="author-name">{story.name}</div>
                  <div className="author-grade">{story.grade}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
