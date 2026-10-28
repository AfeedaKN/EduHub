import React from 'react';
import { useAppSelector } from '../../store/hooks';
import { Calendar, GraduationCap } from 'lucide-react';

interface ParentWelcomeSectionProps {
  academicYear?: string;
}

export const ParentWelcomeSection: React.FC<ParentWelcomeSectionProps> = ({ academicYear }) => {
  const { user } = useAppSelector((state) => state.auth);

  const parentName = user?.name || 'Parent';

  // Format today's date nicely: e.g. Monday, October 27, 2026
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const displayYear = academicYear || '2026-2027';

  return (
    <section className="parent-welcome-section">
      <div className="parent-welcome-text-wrap">
        <div className="parent-welcome-top-row">
          <div className="parent-welcome-title-group">
            <h2 className="parent-welcome-title">Welcome back, {parentName}</h2>
            <p className="parent-welcome-subtitle">
              Overview of your children&apos;s academic life, activities, and school updates.
            </p>
          </div>

          <div className="parent-welcome-badges-row">
            <div className="parent-welcome-academic-pill">
              <GraduationCap size={13} className="text-primary" />
              <span>AY {displayYear}</span>
            </div>
            <div className="parent-welcome-date-pill">
              <Calendar size={13} className="text-muted-blue" />
              <span>{todayFormatted}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
