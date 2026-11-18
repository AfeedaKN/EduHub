import React, { useEffect, useState } from 'react';
import {
  RotateCcw,
  Search,
  RotateCw,
  AlertTriangle,
  X,
  Receipt,
} from 'lucide-react';
import { adminFeeApi } from '../../../api/adminFeeApi';
import { FeePayment } from '../../../types/adminFee.types';

interface FeeTransactionsTabProps {
  academicYear: string;
}

export const FeeTransactionsTab: React.FC<FeeTransactionsTabProps> = ({ academicYear }) => {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Reversal Modal
  const [reversingPayment, setReversingPayment] = useState<FeePayment | null>(null);
  const [reversalReason, setReversalReason] = useState<string>('');
  const [reversing, setReversing] = useState<boolean>(false);
  const [reversalError, setReversalError] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFeeApi.getPayments({
        academicYear: academicYear !== 'ALL' ? academicYear : undefined,
        paymentMethod: selectedMethod !== 'ALL' ? selectedMethod : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchTerm.trim() || undefined,
      });

      if (res.success && res.data) {
        setPayments(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load transaction ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [academicYear, selectedMethod, startDate, endDate]);

  const formatCurrency = (val: number = 0) => `₹${val.toLocaleString('en-IN')}`;

  const handleOpenReverseModal = (p: FeePayment) => {
    setReversingPayment(p);
    setReversalReason('');
    setReversalError(null);
  };

  const handleReverseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversingPayment) return;

    if (!reversalReason.trim()) {
      setReversalError('Auditable reversal reason is mandatory.');
      return;
    }

    try {
      setReversing(true);
      setReversalError(null);
      const res = await adminFeeApi.reversePayment(reversingPayment.id, {
        reason: reversalReason.trim(),
      });

      if (res.success) {
        setReversingPayment(null);
        fetchPayments();
      }
    } catch (err: any) {
      setReversalError(err?.message || 'Failed to reverse payment.');
    } finally {
      setReversing(false);
    }
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
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
              minWidth: '220px',
              maxWidth: '300px',
            }}
          >
            <Search size={16} style={{ color: '#647F99' }} />
            <input
              type="text"
              placeholder="Search receipt # or student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPayments()}
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
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
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
            <option value="ALL">All Payment Methods</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CHEQUE">Cheque</option>
            <option value="CARD">Card POS</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#647F99' }}>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#647F99' }}>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
              }}
            />
          </div>
        </div>

        <button
          onClick={fetchPayments}
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
          <RotateCw size={14} /> Refresh Ledger
        </button>
      </div>

      {/* Ledger Table */}
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
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading transaction ledger...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#DC2626' }}>{error}</div>
        ) : payments.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <Receipt size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>No transaction records found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Receipt #
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Date
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Student Name
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Class / Sec
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Amount (₹)
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Method
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Reference / Drawee
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Recorded By
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Status
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      fontSize: '0.78rem',
                      color: '#647F99',
                      textAlign: 'right',
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        color: '#20354A',
                      }}
                    >
                      {p.receiptNumber}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#647F99' }}>
                      {p.paymentDate}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.84rem' }}>
                      <div style={{ fontWeight: 600, color: '#20354A' }}>{p.studentName}</div>
                      <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>{p.studentAdmissionNumber}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#647F99' }}>
                      {p.className} {p.section ? `(${p.section})` : ''}
                    </td>
                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: p.status === 'REVERSED' ? '#DC2626' : '#16A34A',
                      }}
                    >
                      {formatCurrency(p.amount)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.84rem' }}>
                      <span
                        style={{
                          backgroundColor: '#EEF3F8',
                          color: '#20354A',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                        }}
                      >
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#647F99' }}>
                      {p.transactionReference || p.bankName || '-'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#647F99' }}>
                      {p.recordedByName}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          backgroundColor: p.status === 'SUCCESS' ? '#DCFCE7' : '#FEE2E2',
                          color: p.status === 'SUCCESS' ? '#16A34A' : '#DC2626',
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      {p.status === 'SUCCESS' ? (
                        <button
                          onClick={() => handleOpenReverseModal(p)}
                          title="Reverse Payment"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '4px',
                            border: '1px solid #FCA5A5',
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <RotateCcw size={13} /> Reverse
                        </button>
                      ) : (
                        <span
                          title={p.reversalReason || 'Reversed'}
                          style={{ fontSize: '0.76rem', color: '#DC2626', fontStyle: 'italic' }}
                        >
                          Reversed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reversal Confirmation Modal */}
      {reversingPayment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 24px',
                borderBottom: '1px solid #E2E8F0',
                backgroundColor: '#FEF2F2',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991B1B' }}>
                <AlertTriangle size={18} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                  Reverse Payment Receipt
                </h3>
              </div>
              <button
                onClick={() => setReversingPayment(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#647F99' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReverseSubmit} style={{ padding: '24px' }}>
              {reversalError && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '6px',
                    color: '#991B1B',
                    fontSize: '0.84rem',
                    marginBottom: '16px',
                  }}
                >
                  {reversalError}
                </div>
              )}

              <p style={{ margin: '0 0 16px', fontSize: '0.86rem', color: '#647F99', lineHeight: 1.5 }}>
                Are you sure you want to reverse receipt{' '}
                <strong>{reversingPayment.receiptNumber}</strong> of{' '}
                <strong>{formatCurrency(reversingPayment.amount)}</strong> for student{' '}
                <strong>{reversingPayment.studentName}</strong>?
                <br />
                <br />
                This action will restore the outstanding balance on invoice{' '}
                <strong>{reversingPayment.invoiceNumber}</strong> and mark this transaction as{' '}
                <span style={{ color: '#DC2626', fontWeight: 700 }}>REVERSED</span> in the permanent audit ledger.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                  Mandatory Auditable Reversal Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Cheque returned unpaid by bank / Duplicate counter entry error..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.86rem',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid #E2E8F0',
                }}
              >
                <button
                  type="button"
                  onClick={() => setReversingPayment(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#ffffff',
                    fontSize: '0.86rem',
                    color: '#647F99',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reversing}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#DC2626',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {reversing && <RotateCw className="animate-spin" size={14} />}
                  Confirm Reversal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
