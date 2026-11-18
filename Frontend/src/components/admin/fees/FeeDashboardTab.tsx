import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Receipt,
  PieChart,
  Calendar,
  RotateCw,
  Clock,
} from 'lucide-react';
import { adminFeeApi } from '../../../api/adminFeeApi';
import { FeeDashboardSummary } from '../../../types/adminFee.types';

interface FeeDashboardTabProps {
  academicYear: string;
}

export const FeeDashboardTab: React.FC<FeeDashboardTabProps> = ({ academicYear }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<FeeDashboardSummary | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFeeApi.getDashboardSummary(
        academicYear !== 'ALL' ? academicYear : undefined
      );
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load fee dashboard summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [academicYear]);

  const formatCurrency = (val: number = 0) => `₹${val.toLocaleString('en-IN')}`;

  if (loading && !metrics) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#647F99' }}>
        <RotateCw className="animate-spin" size={32} style={{ margin: '0 auto 12px' }} />
        <p style={{ margin: 0, fontSize: '0.95rem' }}>Loading fee analytics and metrics...</p>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div
        style={{
          padding: '24px',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: '8px',
          color: '#991B1B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>{error}</span>
        <button
          onClick={fetchMetrics}
          style={{
            padding: '6px 14px',
            backgroundColor: '#DC2626',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const m = metrics || {
    totalExpected: 0,
    totalCollected: 0,
    outstandingFees: 0,
    overdueFees: 0,
    totalTransactions: 0,
    collectionPercentage: 0,
    monthlyCollection: [],
    classWiseCollection: [],
    paymentMethodBreakdown: [],
    recentTransactions: [],
  };

  const maxMonthAmount = Math.max(
    1,
    ...m.monthlyCollection.map((mc) => mc.amount)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 6 KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Total Expected */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#647F99' }}>
              Total Expected Fees
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#EEF3F8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#20354A',
              }}
            >
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#20354A' }}>
              {formatCurrency(m.totalExpected)}
            </div>
            <span style={{ fontSize: '0.76rem', color: '#647F99' }}>
              Configured student fee total
            </span>
          </div>
        </div>

        {/* Total Collected */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#647F99' }}>
              Total Fees Collected
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16A34A',
              }}
            >
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16A34A' }}>
              {formatCurrency(m.totalCollected)}
            </div>
            <span style={{ fontSize: '0.76rem', color: '#16A34A', fontWeight: 500 }}>
              {m.collectionPercentage}% of expected
            </span>
          </div>
        </div>

        {/* Outstanding */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#647F99' }}>
              Outstanding Balance
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D97706',
              }}
            >
              <Clock size={18} />
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#D97706' }}>
              {formatCurrency(m.outstandingFees)}
            </div>
            <span style={{ fontSize: '0.76rem', color: '#647F99' }}>
              Pending student invoices
            </span>
          </div>
        </div>

        {/* Overdue */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#647F99' }}>
              Overdue Fees
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DC2626',
              }}
            >
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#DC2626' }}>
              {formatCurrency(m.overdueFees)}
            </div>
            <span style={{ fontSize: '0.76rem', color: '#DC2626' }}>
              Past scheduled due date
            </span>
          </div>
        </div>

        {/* Total Transactions */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#647F99' }}>
              Total Transactions
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#F3E8FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7E22CE',
              }}
            >
              <Receipt size={18} />
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#20354A' }}>
              {m.totalTransactions}
            </div>
            <span style={{ fontSize: '0.76rem', color: '#647F99' }}>
              Valid payment receipts issued
            </span>
          </div>
        </div>

        {/* Collection Percentage */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#647F99' }}>
              Collection Rate
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#EEF3F8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#20354A',
              }}
            >
              <PieChart size={18} />
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#20354A' }}>
              {m.collectionPercentage}%
            </div>
            {/* Progress bar */}
            <div
              style={{
                height: '6px',
                backgroundColor: '#E2E8F0',
                borderRadius: '3px',
                marginTop: '6px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, m.collectionPercentage)}%`,
                  backgroundColor: '#20354A',
                  borderRadius: '3px',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row: Monthly Collection Chart & Payment Methods Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Monthly Collection Trend */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#20354A' }}>
                Monthly Collection Trend
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#647F99' }}>
                Total collections recorded per month
              </p>
            </div>
            <Calendar size={18} style={{ color: '#647F99' }} />
          </div>

          {m.monthlyCollection.length === 0 ? (
            <div
              style={{
                padding: '40px 0',
                textAlign: 'center',
                color: '#94A3B8',
                fontSize: '0.9rem',
              }}
            >
              No monthly collection data recorded yet for this academic year.
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: '12px',
                height: '180px',
                paddingTop: '20px',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              {m.monthlyCollection.map((mc, idx) => {
                const heightPct = Math.max(12, Math.round((mc.amount / maxMonthAmount) * 100));
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: '#20354A',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {mc.amount > 0 ? `₹${(mc.amount / 1000).toFixed(0)}k` : '₹0'}
                    </span>
                    <div
                      title={`${mc.month}: ${formatCurrency(mc.amount)} (${mc.count} txns)`}
                      style={{
                        width: '100%',
                        maxWidth: '42px',
                        height: `${heightPct}%`,
                        backgroundColor: '#20354A',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: '#647F99',
                        marginTop: '4px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {mc.month}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Methods Breakdown */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#20354A' }}>
                Payment Method Breakdown
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#647F99' }}>
                Collection split by channel
              </p>
            </div>
            <Receipt size={18} style={{ color: '#647F99' }} />
          </div>

          {m.paymentMethodBreakdown.length === 0 ? (
            <div
              style={{
                padding: '40px 0',
                textAlign: 'center',
                color: '#94A3B8',
                fontSize: '0.9rem',
              }}
            >
              No payment transactions recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {m.paymentMethodBreakdown.map((pm, idx) => {
                const methodPercent =
                  m.totalCollected > 0
                    ? Math.round((pm.amount / m.totalCollected) * 100)
                    : 0;
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '6px',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#20354A' }}>
                        {pm.method}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#20354A' }}>
                          {formatCurrency(pm.amount)}
                        </span>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            padding: '2px 6px',
                            backgroundColor: '#E2E8F0',
                            borderRadius: '4px',
                            color: '#647F99',
                          }}
                        >
                          {pm.count} txns
                        </span>
                      </div>
                    </div>
                    {/* mini progress */}
                    <div
                      style={{
                        height: '4px',
                        backgroundColor: '#E2E8F0',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${methodPercent}%`,
                          backgroundColor: '#647F99',
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Class-wise Collection Comparison */}
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
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#20354A' }}>
            Class-Wise Fee Collection Comparison
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#647F99' }}>
            Collection performance and outstanding balances across enrolled grades
          </p>
        </div>

        {m.classWiseCollection.length === 0 ? (
          <div
            style={{
              padding: '40px 0',
              textAlign: 'center',
              color: '#94A3B8',
              fontSize: '0.9rem',
            }}
          >
            No student fee assignments configured for this academic year yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                    Class
                  </th>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                    Expected (₹)
                  </th>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                    Collected (₹)
                  </th>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                    Outstanding (₹)
                  </th>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                    Progress (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {m.classWiseCollection.map((cw, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td
                      style={{
                        padding: '12px 14px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: '#20354A',
                      }}
                    >
                      {cw.className}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.88rem', color: '#647F99' }}>
                      {formatCurrency(cw.expected)}
                    </td>
                    <td
                      style={{
                        padding: '12px 14px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: '#16A34A',
                      }}
                    >
                      {formatCurrency(cw.collected)}
                    </td>
                    <td
                      style={{
                        padding: '12px 14px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: cw.outstanding > 0 ? '#DC2626' : '#647F99',
                      }}
                    >
                      {formatCurrency(cw.outstanding)}
                    </td>
                    <td style={{ padding: '12px 14px', width: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '6px',
                            backgroundColor: '#E2E8F0',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(100, cw.percentage)}%`,
                              backgroundColor: cw.percentage >= 80 ? '#16A34A' : '#20354A',
                              borderRadius: '3px',
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            color: '#20354A',
                            minWidth: '36px',
                          }}
                        >
                          {cw.percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Transactions Ledger */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#20354A' }}>
              Recent Fee Collection Transactions
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#647F99' }}>
              Latest payment receipts recorded by school finance
            </p>
          </div>
          <button
            onClick={fetchMetrics}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#ffffff',
              fontSize: '0.8rem',
              color: '#20354A',
              cursor: 'pointer',
            }}
          >
            <RotateCw size={14} /> Refresh
          </button>
        </div>

        {m.recentTransactions.length === 0 ? (
          <div
            style={{
              padding: '40px 0',
              textAlign: 'center',
              color: '#94A3B8',
              fontSize: '0.9rem',
            }}
          >
            No payment transactions recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                    Receipt #
                  </th>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                    Date
                  </th>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                    Student
                  </th>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                    Class
                  </th>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                    Amount (₹)
                  </th>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                    Method
                  </th>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {m.recentTransactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td
                      style={{
                        padding: '12px 14px',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        color: '#20354A',
                      }}
                    >
                      {tx.receiptNumber}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.84rem', color: '#647F99' }}>
                      {tx.paymentDate}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.84rem', color: '#20354A' }}>
                      <div style={{ fontWeight: 600 }}>{tx.studentName}</div>
                      <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                        {tx.studentAdmissionNumber}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.84rem', color: '#647F99' }}>
                      {tx.className} {tx.section ? `(${tx.section})` : ''}
                    </td>
                    <td
                      style={{
                        padding: '12px 14px',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: tx.status === 'REVERSED' ? '#DC2626' : '#16A34A',
                      }}
                    >
                      {formatCurrency(tx.amount)}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.84rem', color: '#647F99' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#F1F5F9',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          color: '#20354A',
                        }}
                      >
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          backgroundColor: tx.status === 'SUCCESS' ? '#DCFCE7' : '#FEE2E2',
                          color: tx.status === 'SUCCESS' ? '#16A34A' : '#DC2626',
                        }}
                      >
                        {tx.status}
                      </span>
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
