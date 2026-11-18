import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Search,
  RotateCw,
  Phone,
  Clock,
} from 'lucide-react';
import { adminFeeApi } from '../../../api/adminFeeApi';
import { adminApi } from '../../../api/adminApi';
import { DefaulterItem } from '../../../types/adminFee.types';

interface FeeDefaultersTabProps {
  academicYear: string;
}

export const FeeDefaultersTab: React.FC<FeeDefaultersTabProps> = ({ academicYear }) => {
  const [defaulters, setDefaulters] = useState<DefaulterItem[]>([]);
  const [classList, setClassList] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchClasses = async () => {
    try {
      const res = await adminApi.getClasses();
      if (res.success && res.data) {
        const uniqueClasses = Array.from(new Set(res.data.map((c: any) => c.name)));
        setClassList(uniqueClasses);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const fetchDefaulters = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFeeApi.getDefaulters({
        academicYear: academicYear !== 'ALL' ? academicYear : undefined,
        className: selectedClass !== 'ALL' ? selectedClass : undefined,
      });

      if (res.success && res.data) {
        setDefaulters(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load fee defaulters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchDefaulters();
  }, [academicYear, selectedClass]);

  const formatCurrency = (val: number = 0) => `₹${val.toLocaleString('en-IN')}`;

  const filteredDefaulters = defaulters.filter(
    (d) =>
      d.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalOverdueSum = filteredDefaulters.reduce(
    (sum, d) => sum + (d.outstandingAmount || 0),
    0
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Controls Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#ffffff',
          padding: '16px 20px',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              padding: '6px 12px',
              flex: 1,
              maxWidth: '320px',
            }}
          >
            <Search size={16} style={{ color: '#647F99' }} />
            <input
              type="text"
              placeholder="Search student or invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.86rem',
                width: '100%',
                color: '#20354A',
              }}
            />
          </div>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '0.84rem',
              color: '#20354A',
              backgroundColor: '#ffffff',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Classes</option>
            {classList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchDefaulters}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            backgroundColor: '#ffffff',
            fontSize: '0.84rem',
            color: '#20354A',
            cursor: 'pointer',
          }}
        >
          <RotateCw size={14} /> Refresh Defaulters
        </button>
      </div>

      {/* Summary KPI Cards for Defaulters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '18px 20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#647F99' }}>
              Identified Defaulters
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DC2626',
              }}
            >
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ marginTop: '10px', fontSize: '1.4rem', fontWeight: 700, color: '#DC2626' }}>
            {filteredDefaulters.length} students
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '18px 20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#647F99' }}>
              Total Overdue Fees Due
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D97706',
              }}
            >
              <Clock size={16} />
            </div>
          </div>
          <div style={{ marginTop: '10px', fontSize: '1.4rem', fontWeight: 700, color: '#D97706' }}>
            {formatCurrency(totalOverdueSum)}
          </div>
        </div>
      </div>

      {/* Defaulters Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#647F99' }}>
            <RotateCw className="animate-spin" size={28} style={{ margin: '0 auto 10px' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading fee defaulters...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#DC2626' }}>{error}</div>
        ) : filteredDefaulters.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: '#16A34A' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '24px',
                backgroundColor: '#DCFCE7',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              ✓
            </div>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#16A34A' }}>
              No Fee Defaulters Found!
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#647F99' }}>
              All students have settled their scheduled installment invoices on or before the due date.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Student Name
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Admission #
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Class / Sec
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Invoice #
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Installment
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Due Date
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Days Overdue
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Outstanding Due (₹)
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Parent Contact
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDefaulters.map((d, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: '#20354A',
                      }}
                    >
                      {d.studentName}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#647F99' }}>
                      {d.admissionNumber}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#20354A' }}>
                      {d.className} {d.section ? `(${d.section})` : ''}
                    </td>
                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        color: '#20354A',
                      }}
                    >
                      {d.invoiceNumber}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#647F99' }}>
                      {d.installmentName}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#DC2626' }}>
                      {d.dueDate}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626',
                        }}
                      >
                        {d.daysOverdue} day{d.daysOverdue !== 1 ? 's' : ''} overdue
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: '#DC2626',
                      }}
                    >
                      {formatCurrency(d.outstandingAmount)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#647F99' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={13} style={{ color: '#647F99' }} />
                        <span>{d.parentContact}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
