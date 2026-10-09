import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="container footer-content">
        <p className="footer-copyright">
          © {new Date().getFullYear()} EduHub Platform. Single-School ERP Architecture.
        </p>
        <p className="footer-stack-info">
          Modular Monolith • React 19 • Redux Toolkit • Express • TypeScript • MongoDB
        </p>
      </div>
    </footer>
  );
};
