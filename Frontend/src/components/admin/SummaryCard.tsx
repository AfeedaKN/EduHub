import React from 'react';
import { LucideIcon, ArrowUpRight } from 'lucide-react';

interface SummaryCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  subtext?: string;
  indicatorText?: string;
  indicatorVariant?: 'admissions' | 'neutral' | 'muted' | 'warning';
  isClickable?: boolean;
  onClick?: () => void;
  isHighlight?: boolean;
  shortcutLabel?: string;
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
  shortcutLabel,
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
      aria-label={`${label}: ${value}`}
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

      <div className="admin-card-footer-row">
        {subtext && <div className="admin-card-subtext">{subtext}</div>}
        {isClickable && shortcutLabel && (
          <span className="admin-card-shortcut-hint">
            <span>{shortcutLabel}</span>
            <ArrowUpRight size={13} />
          </span>
        )}
      </div>
    </div>
  );
};

