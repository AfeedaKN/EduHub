import React from 'react';
import { useAppSelector } from '../../store/hooks';
import { Calendar } from 'lucide-react';

export const ParentWelcomeSection: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  const parentName = user?.name || 'Parent';

  // Format today's date nicely: e.g. Friday, October 9, 2026
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <section className="parent-welcome-section">
      <div className="parent-welcome-text-wrap">
        <div className="parent-welcome-top-row">
          <h2 className="parent-welcome-title">Welcome back, {parentName}</h2>
          <div className="parent-welcome-date-pill">
            <Calendar size={13} className="text-muted-blue" />
            <span>{todayFormatted}</span>
          </div>
        </div>
        <p className="parent-welcome-subtitle">
          Everything you need to stay connected with your child&apos;s school life.
        </p>
      </div>
    </section>
  );
};
