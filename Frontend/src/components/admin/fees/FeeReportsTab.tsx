import React, { useEffect, useState } from 'react';
import {
  Download,
  Filter,
  FileSpreadsheet,
  RotateCw,
  Table,
} from 'lucide-react';
import { adminFeeApi } from '../../../api/adminFeeApi';
import { adminApi } from '../../../api/adminApi';
import { FeeReport, FeeReportType } from '../../../types/adminFee.types';

interface FeeReportsTabProps {
  academicYear: string;
}

export const FeeReportsTab: React.FC<FeeReportsTabProps> = ({ academicYear }) => {
  const [reportType, setReportType] = useState<FeeReportType>('COLLECTION_SUMMARY');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [classList, setClassList] = useState<string[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<FeeReport | null>(null);

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

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFeeApi.getReports({
        type: reportType,
        academicYear: academicYear !== 'ALL' ? academicYear : undefined,
        className: selectedClass !== 'ALL' ? selectedClass : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (res.success && res.data) {
        setReportData(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate fee report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    handleGenerateReport();
  }, [academicYear]);

  const handleDownloadCSV = () => {
    if (!reportData || reportData.rows.length === 0) return;

    const headers = reportData.headers;
    const csvRows: string[] = [];

    // Header row
    csvRows.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));

    // Data rows
    reportData.rows.forEach((row) => {
      const values = Object.values(row).map((val) => {
        const strVal = val !== undefined && val !== null ? String(val) : '';
        return `"${strVal.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStamp = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `EduHub_Fee_Report_${reportType}_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number = 0) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Report Configuration Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#20354A' }}>
            Fee Accounting & Audit Reports
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#647F99' }}>
            Generate analytical fee rosters and export verified financial tables to CSV
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            alignItems: 'flex-end',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
              Report Type *
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as FeeReportType)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.86rem',
                backgroundColor: '#ffffff',
                color: '#20354A',
              }}
            >
              <option value="COLLECTION_SUMMARY">Daily / Monthly Collection Ledger</option>
              <option value="CLASS_WISE">Class-Wise Collection Progress</option>
              <option value="CATEGORY_WISE">Category-Wise Fee Structure Summary</option>
              <option value="DEFAULTERS">Fee Defaulters & Overdue Dues Report</option>
              <option value="PAYMENT_METHODS">Payment Channel Breakdown Report</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
              Filter Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.86rem',
                backgroundColor: '#ffffff',
                color: '#20354A',
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

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.84rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.84rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              style={{
                flex: 1,
                padding: '9px 16px',
                backgroundColor: '#20354A',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              {loading ? <RotateCw className="animate-spin" size={14} /> : <Filter size={14} />}
              Generate
            </button>

            {reportData && reportData.rows.length > 0 && (
              <button
                onClick={handleDownloadCSV}
                style={{
                  padding: '9px 16px',
                  backgroundColor: '#16A34A',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Download size={14} /> Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report Summary Cards */}
      {reportData?.summary && (
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          {Object.entries(reportData.summary).map(([key, val]) => (
            <div
              key={key}
              style={{
                padding: '12px 18px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '0.84rem',
                color: '#20354A',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              }}
            >
              <span style={{ color: '#647F99', textTransform: 'capitalize' }}>
                {key.replace(/([A-Z])/g, ' $1')}:{' '}
              </span>
              <strong>
                {typeof val === 'number' && key.toLowerCase().includes('amount')
                  ? formatCurrency(val)
                  : String(val)}
              </strong>
            </div>
          ))}
        </div>
      )}

      {/* Report Table Preview */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Table size={16} style={{ color: '#647F99' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#20354A' }}>
              Report Preview ({reportData?.rows.length || 0} records)
            </span>
          </div>

          {reportData && (
            <span style={{ fontSize: '0.76rem', color: '#647F99' }}>
              Generated: {new Date(reportData.generatedAt).toLocaleString()}
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#647F99' }}>
            <RotateCw className="animate-spin" size={28} style={{ margin: '0 auto 10px' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Compiling report data...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#DC2626' }}>{error}</div>
        ) : !reportData || reportData.rows.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <FileSpreadsheet size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>No records match the report criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {reportData.headers.map((h, idx) => (
                    <th key={idx} style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.rows.map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {Object.values(row).map((val: any, cIdx) => (
                      <td key={cIdx} style={{ padding: '12px 14px', fontSize: '0.84rem', color: '#20354A' }}>
                        {typeof val === 'number' && cIdx >= 4
                          ? formatCurrency(val)
                          : String(val !== undefined && val !== null ? val : '-')}
                      </td>
                    ))}
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
