import React from 'react';
import { Info } from 'lucide-react';

export const RegistrationSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Create Your Parent Account',
      description: 'Register using your primary contact details to establish your secure parent portal access.',
    },
    {
      number: '02',
      title: 'Add Your Child',
      description: "Enter your child's information and select the appropriate grade or class for admission request.",
    },
    {
      number: '03',
      title: 'School Review',
      description: 'School management reviews the request based on available classroom capacity and admission criteria.',
    },
    {
      number: '04',
      title: 'Stay Connected',
      description: "Once approved, access your child's complete school attendance, timetable, and academic reports.",
    },
  ];

  return (
    <section className="section-padding registration-section" id="registration">
      <div className="container">
        <div className="registration-header">
          <span className="section-tagline">Admission Journey</span>
          <h2 className="section-heading-lg">Getting Started Is Simple.</h2>
          <p className="section-desc-lg" style={{ margin: '0 auto' }}>
            Follow our straightforward four-step process to submit your child&apos;s registration and stay connected with the school.
          </p>
        </div>

        <div className="process-steps-row">
          {steps.map((step, idx) => (
            <div key={idx} className="step-card">
              <div className="step-number-badge">{step.number}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Clear Policy Disclaimer */}
        <div className="registration-disclaimer-box">
          <Info size={20} className="disclaimer-icon" />
          <p className="disclaimer-text">
            <strong>Important Note:</strong> Submitting a registration request initiates the administrative review process and does not automatically guarantee admission. Final enrollment is subject to seat availability and institutional verification.
          </p>
        </div>
      </div>
    </section>
  );
};
