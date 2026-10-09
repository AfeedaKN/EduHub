import React from 'react';
import { HeartHandshake, BookOpen, Building2 } from 'lucide-react';

export type UserRole = 'PARENT' | 'TEACHER' | 'MANAGEMENT';

interface LoginRoleSelectorProps {
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

export const LoginRoleSelector: React.FC<LoginRoleSelectorProps> = ({
  selectedRole,
  onSelectRole,
}) => {
  const roles: {
    id: UserRole;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'PARENT',
      label: 'Parent',
      description: "Your child's school life.",
      icon: <HeartHandshake size={18} />,
    },
    {
      id: 'TEACHER',
      label: 'Teacher',
      description: 'Your classes and students.',
      icon: <BookOpen size={18} />,
    },
    {
      id: 'MANAGEMENT',
      label: 'Management',
      description: 'School administration.',
      icon: <Building2 size={18} />,
    },
  ];

  return (
    <div className="role-selector-container">
      <span className="role-selector-label">How would you like to sign in?</span>
      <div className="role-selector-grid" role="tablist" aria-label="Select Account Role">
        {roles.map((role) => {
          const isSelected = selectedRole === role.id;
          return (
            <button
              key={role.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`role-option-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectRole(role.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectRole(role.id);
                }
              }}
            >
              <div className="role-option-icon-wrap" aria-hidden="true">
                {role.icon}
              </div>
              <div className="role-option-info">
                <span className="role-option-title">{role.label}</span>
                <span className="role-option-desc">{role.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
