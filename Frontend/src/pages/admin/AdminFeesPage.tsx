import React, { useState } from 'react';
import {
  TrendingUp,
  Layers,
  FileText,
  Users,
  FileSpreadsheet,
  DollarSign,
  Receipt,
  Tag,
  AlertTriangle,
  Download,
  Calendar,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { FeeDashboardTab } from '../../components/admin/fees/FeeDashboardTab';
import { FeeCategoriesTab } from '../../components/admin/fees/FeeCategoriesTab';
import { FeeStructuresTab } from '../../components/admin/fees/FeeStructuresTab';
import { FeeAssignmentTab } from '../../components/admin/fees/FeeAssignmentTab';
import { FeeInvoicesTab } from '../../components/admin/fees/FeeInvoicesTab';
import { FeeCollectionTab } from '../../components/admin/fees/FeeCollectionTab';
import { FeeTransactionsTab } from '../../components/admin/fees/FeeTransactionsTab';
import { FeeConcessionsTab } from '../../components/admin/fees/FeeConcessionsTab';
import { FeeDefaultersTab } from '../../components/admin/fees/FeeDefaultersTab';
import { FeeReportsTab } from '../../components/admin/fees/FeeReportsTab';

type FeeTabKey =
  | 'DASHBOARD'
  | 'CATEGORIES'
  | 'STRUCTURES'
  | 'ASSIGNMENT'
  | 'INVOICES'
  | 'COLLECTION'
  | 'TRANSACTIONS'
  | 'CONCESSIONS'
  | 'DEFAULTERS'
  | 'REPORTS';

export const AdminFeesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FeeTabKey>('DASHBOARD');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2026-2027');

  const tabs: { key: FeeTabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'DASHBOARD', label: 'Dashboard', icon: <TrendingUp size={16} /> },
    { key: 'CATEGORIES', label: 'Categories', icon: <Layers size={16} /> },
    { key: 'STRUCTURES', label: 'Fee Structures', icon: <FileText size={16} /> },
    { key: 'ASSIGNMENT', label: 'Student Fees', icon: <Users size={16} /> },
    { key: 'INVOICES', label: 'Invoices', icon: <FileSpreadsheet size={16} /> },
    { key: 'COLLECTION', label: 'Collect Fees', icon: <DollarSign size={16} /> },
    { key: 'TRANSACTIONS', label: 'Ledger & Reversals', icon: <Receipt size={16} /> },
    { key: 'CONCESSIONS', label: 'Concessions', icon: <Tag size={16} /> },
    { key: 'DEFAULTERS', label: 'Defaulters', icon: <AlertTriangle size={16} /> },
    { key: 'REPORTS', label: 'Reports & Export', icon: <Download size={16} /> },
  ];

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1420px', margin: '0 auto', padding: '8px 4px 40px' }}>
        {/* Top Header Banner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#20354A',
                  backgroundColor: '#EEF3F8',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}
              >
                Finance & Accounting
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>•</span>
              <span style={{ fontSize: '0.8rem', color: '#647F99' }}>School Fee Operations</span>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#20354A', margin: 0 }}>
              Fees & Payments Management
            </h1>
            <p style={{ margin: '6px 0 0', color: '#647F99', fontSize: '0.92rem' }}>
              Configure fee structures, assign fees to enrolled students, issue invoices, collect counter payments, and audit ledgers.
            </p>
          </div>

          {/* Academic Year Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} style={{ color: '#647F99' }} />
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: '#20354A',
                backgroundColor: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="2026-2027">Academic Year: 2026-2027</option>
              <option value="2025-2026">Academic Year: 2025-2026</option>
              <option value="ALL">All Academic Years</option>
            </select>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '6px',
            marginBottom: '20px',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? '#20354A' : 'transparent',
                  color: isActive ? '#ffffff' : '#647F99',
                  fontSize: '0.86rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Viewport */}
        <div>
          {activeTab === 'DASHBOARD' && (
            <FeeDashboardTab academicYear={selectedAcademicYear} />
          )}
          {activeTab === 'CATEGORIES' && <FeeCategoriesTab />}
          {activeTab === 'STRUCTURES' && (
            <FeeStructuresTab academicYear={selectedAcademicYear} />
          )}
          {activeTab === 'ASSIGNMENT' && (
            <FeeAssignmentTab academicYear={selectedAcademicYear} />
          )}
          {activeTab === 'INVOICES' && (
            <FeeInvoicesTab academicYear={selectedAcademicYear} />
          )}
          {activeTab === 'COLLECTION' && <FeeCollectionTab />}
          {activeTab === 'TRANSACTIONS' && (
            <FeeTransactionsTab academicYear={selectedAcademicYear} />
          )}
          {activeTab === 'CONCESSIONS' && <FeeConcessionsTab />}
          {activeTab === 'DEFAULTERS' && (
            <FeeDefaultersTab academicYear={selectedAcademicYear} />
          )}
          {activeTab === 'REPORTS' && (
            <FeeReportsTab academicYear={selectedAcademicYear} />
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
