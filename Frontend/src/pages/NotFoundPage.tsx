import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Home } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-card">
        <HelpCircle size={64} className="not-found-icon" />
        <h1>404 - Page Not Found</h1>
        <p>The requested page or route does not exist in EduHub.</p>
        <Link to="/">
          <Button variant="primary" leftIcon={<Home size={18} />}>
            Return to System Diagnostic
          </Button>
        </Link>
      </div>
    </div>
  );
};
