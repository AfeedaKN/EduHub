import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  subtext?: string;
  indicatorText?: string;
  indicatorVariant?: 'admissions' | 'neutral' | 'muted';
  isClickable?: boolean;
  onClick?: () => void;
  isHighlight?: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  value,
  icon: Icon,
  subtext,
  indicatorText,
  indicatorVariant = 'neutral',
  isClickable = false,
  onClick,
  isHighlight = false,
}) => {
  const isUnavailable = typeof value === 'string' && value.toLowerCase().includes('pending');

  return (
    <div
      className={`admin-summary-card ${isClickable ? 'clickable' : ''} ${
        isHighlight ? 'card-admissions-highlight' : ''
      }`}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className="admin-card-top-row">
        <span className="admin-card-label">{label}</span>
        <div className={`admin-card-icon-wrap ${isHighlight ? 'icon-admissions' : ''}`}>
          <Icon size={17} />
        </div>
      </div>

      <div className="admin-card-value-row">
        <div className={`admin-card-value ${isUnavailable ? 'value-unavailable' : ''}`}>
          {value}
        </div>

        {indicatorText && (
          <span className={`admin-card-indicator indicator-${indicatorVariant}`}>
            {indicatorText}
          </span>
        )}
      </div>

      {subtext && <div className="admin-card-subtext">{subtext}</div>}
    </div>
  );
};
