import React from 'react';
import { MessageSquareText, UserPlus, Eye, LayoutGrid } from 'lucide-react';

export const BenefitsSection: React.FC = () => {
  const benefits = [
    {
      icon: <MessageSquareText size={24} />,
      title: 'Connected Communication',
      description: 'Keep important school updates, circulars, and notices organized in one place without message fatigue.',
    },
    {
      icon: <UserPlus size={24} />,
      title: 'Simple Admissions',
      description: 'Allow parents to submit registration requests online and follow their approval status transparently.',
    },
    {
      icon: <Eye size={24} />,
      title: 'Academic Visibility',
      description: 'Help parents access relevant attendance, timetable, assignment, and examination information effortlessly.',
    },
    {
      icon: <LayoutGrid size={24} />,
      title: 'Organized School Operations',
      description: 'Help management coordinate school activities, classes, and personnel through one connected system.',
    },
  ];

  return (
    <section className="section-padding benefits-section" id="benefits">
      <div className="container">
        <div className="benefits-header">
          <span className="section-tagline">Why EduHub</span>
          <h2 className="section-heading-lg">
            Less Confusion. Better School Communication.
          </h2>
          <p className="section-desc-lg" style={{ margin: '0 auto' }}>
            Built around the daily realities of school life to bring clarity and ease to every interaction.
          </p>
        </div>

        <div className="benefits-grid">
          {benefits.map((item, idx) => (
            <div key={idx} className="benefit-item">
              <div className="benefit-icon-wrapper" aria-hidden="true">
                {item.icon}
              </div>
              <div>
                <h3 className="benefit-title">{item.title}</h3>
                <p className="benefit-text">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
