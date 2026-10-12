import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';

interface AdminPlaceholderPageProps {
  title: string;
  description?: string;
}

export const AdminPlaceholderPage: React.FC<AdminPlaceholderPageProps> = ({
  title,
  description = 'This school management module is planned for subsequent rollout phases.',
}) => {
  const navigate = useNavigate();

  return (
    <AdminLayout breadcrumbTitle={title}>
      <div style={{ maxWidth: '640px', margin: '40px auto', textAlign: 'center' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#EBF0F5',
            color: '#20354A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Clock size={24} />
        </div>

        <h1
          style={{
            fontFamily: "var(--font-serif, 'Manrope', sans-serif)",
            fontSize: '1.4rem',
            fontWeight: 700,
            color: '#20354A',
            marginBottom: '8px',
          }}
        >
          {title}
        </h1>

        <p style={{ color: '#707781', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '24px' }}>
          {description}
        </p>

        <button
          type="button"
          className="admin-btn-action-primary"
          onClick={() => navigate('/admin/dashboard')}
          style={{ margin: '0 auto' }}
        >
          <ArrowLeft size={14} />
          <span>Return to Admin Dashboard</span>
        </button>
      </div>
    </AdminLayout>
  );
};

export default AdminPlaceholderPage;
