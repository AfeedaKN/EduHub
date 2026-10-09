import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  return (
    <div className={`spinner-container ${className}`.trim()}>
      <div className={`spinner spinner-${size}`} />
    </div>
  );
};
