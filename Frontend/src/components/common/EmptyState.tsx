import React, { ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-label={title}
      className={`empty-state-container flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20 ${className}`.trim()}
    >
      {icon && (
        <div className="mb-4 text-gray-400 dark:text-gray-500 text-4xl flex items-center justify-center" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
