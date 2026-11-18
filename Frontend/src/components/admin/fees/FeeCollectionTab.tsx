import React, { useState } from 'react';
import {
  Search,
  DollarSign,
  Printer,
  CheckCircle,
  AlertCircle,
  RotateCw,
  X,
} from 'lucide-react';
import { adminFeeApi } from '../../../api/adminFeeApi';
import {
  FeeInvoice,
  FeePayment,
  PaymentMethod,
} from '../../../types/adminFee.types';

export const FeeCollectionTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Collect Payment Modal
  const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [chequeDate, setChequeDate] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [collectError, setCollectError] = useState<string | null>(null);

  // Receipt Modal State
  const [issuedReceipt, setIssuedReceipt] = useState<FeePayment | null>(null);

  const formatCurrency = (val: number = 0) => `₹${val.toLocaleString('en-IN')}`;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setHasSearched(true);
      const res = await adminFeeApi.getInvoices({
        search: searchTerm.trim(),
      });
      if (res.success && res.data) {
        setInvoices(res.data);
      }
    } catch (err: any) {
      console.error('Failed to search invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCollectModal = (inv: FeeInvoice) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.outstandingAmount);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('CASH');
    setTransactionRef('');
    setBankName('');
    setChequeDate('');
    setRemarks('');
    setCollectError(null);
  };

  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    if (paymentAmount <= 0) {
      setCollectError('Payment amount must be greater than zero.');
      return;
    }

    if (paymentAmount > selectedInvoice.outstandingAmount) {
      setCollectError(
        `Payment amount cannot exceed outstanding balance of ${formatCurrency(
          selectedInvoice.outstandingAmount
        )}.`
      );
      return;
    }

    try {
      setSubmitting(true);
      setCollectError(null);

      const res = await adminFeeApi.collectFee({
        invoiceId: selectedInvoice.id,
        amount: Number(paymentAmount),
        paymentDate,
        paymentMethod,
        transactionReference: transactionRef.trim() || undefined,
        bankName: bankName.trim() || undefined,
        chequeDate: chequeDate || undefined,
        remarks: remarks.trim() || undefined,
      });

      if (res.success && res.data) {
        setIssuedReceipt(res.data);
        setSelectedInvoice(null);
        // Refresh invoice list
        handleSearch();
      }
    } catch (err: any) {
      setCollectError(err?.message || 'Failed to collect payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Search Header */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700, color: '#20354A' }}>
          Fee Collection & Cashier Desk
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: '0.86rem', color: '#647F99' }}>
          Search student by full name or admission number to collect fees and generate payment receipts
        </p>

        <form
          onSubmit={handleSearch}
          style={{ display: 'flex', gap: '12px', maxWidth: '600px' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '8px 14px',
              flex: 1,
            }}
          >
            <Search size={18} style={{ color: '#647F99' }} />
            <input
              type="text"
              placeholder="Enter student name or admission number (e.g. Aarav, FEE-STU-001)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.9rem',
                width: '100%',
                color: '#20354A',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 22px',
              backgroundColor: '#20354A',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {loading ? <RotateCw className="animate-spin" size={16} /> : <Search size={16} />}
            Search
          </button>
        </form>
      </div>

      {/* Search Results */}
      {hasSearched && (
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
              padding: '16px 20px',
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#20354A' }}>
              Student Invoices & Dues ({invoices.length} found)
            </h4>
          </div>

          {invoices.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
              No invoices found matching "{searchTerm}". Please verify the student name or admission ID.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                    <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                      Invoice #
                    </th>
                    <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                      Student Name
                    </th>
                    <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                      Class / Sec
                    </th>
                    <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                      Installment
                    </th>
                    <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                      Total Payable
                    </th>
                    <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                      Paid Amount
                    </th>
                    <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                      Outstanding
                    </th>
                    <th style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#647F99' }}>
                      Status
                    </th>
                    <th
                      style={{
                        padding: '10px 14px',
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
                  {invoices.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px', fontSize: '0.84rem', fontWeight: 700, color: '#20354A' }}>
                        {inv.invoiceNumber}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.84rem' }}>
                        <div style={{ fontWeight: 600, color: '#20354A' }}>{inv.studentName}</div>
                        <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>{inv.studentAdmissionNumber}</div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.84rem', color: '#647F99' }}>
                        {inv.className} {inv.section ? `(${inv.section})` : ''}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.84rem', color: '#20354A' }}>
                        {inv.installmentName}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.88rem', color: '#647F99' }}>
                        {formatCurrency(inv.totalPayable)}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.88rem', fontWeight: 600, color: '#16A34A' }}>
                        {formatCurrency(inv.paidAmount)}
                      </td>
                      <td
                        style={{
                          padding: '12px 14px',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: inv.outstandingAmount > 0 ? '#DC2626' : '#16A34A',
                        }}
                      >
                        {formatCurrency(inv.outstandingAmount)}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            backgroundColor: inv.status === 'PAID' ? '#DCFCE7' : inv.status === 'OVERDUE' ? '#FEE2E2' : '#FEF3C7',
                            color: inv.status === 'PAID' ? '#16A34A' : inv.status === 'OVERDUE' ? '#DC2626' : '#D97706',
                          }}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        {inv.outstandingAmount > 0 ? (
                          <button
                            onClick={() => handleOpenCollectModal(inv)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: '#16A34A',
                              color: '#ffffff',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <DollarSign size={14} /> Collect Fee
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#16A34A', fontWeight: 600 }}>
                            Fully Paid
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
      )}

      {/* Collect Fee Modal */}
      {selectedInvoice && (
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
              maxWidth: '540px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 24px',
                borderBottom: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#20354A' }}>
                  Record Fee Payment
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#647F99' }}>
                  {selectedInvoice.invoiceNumber} • {selectedInvoice.studentName} ({selectedInvoice.className})
                </span>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#647F99' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCollectSubmit} style={{ padding: '24px' }}>
              {collectError && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '6px',
                    color: '#991B1B',
                    fontSize: '0.84rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{collectError}</span>
                </div>
              )}

              {/* Outstanding Balance Banner */}
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#FEF3C7',
                  borderRadius: '8px',
                  border: '1px solid #FDE68A',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#92400E' }}>Outstanding Balance:</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#B45309' }}>
                    {formatCurrency(selectedInvoice.outstandingAmount)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentAmount(selectedInvoice.outstandingAmount)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    backgroundColor: '#ffffff',
                    border: '1px solid #F59E0B',
                    borderRadius: '4px',
                    color: '#B45309',
                    cursor: 'pointer',
                  }}
                >
                  Pay Full
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                      Payment Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={selectedInvoice.outstandingAmount}
                      value={paymentAmount || ''}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.88rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.88rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                    Payment Channel / Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="CASH">Cash (Counter Deposit)</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="BANK_TRANSFER">Direct Bank Transfer / NEFT / IMPS</option>
                    <option value="CHEQUE">Cheque / Demand Draft</option>
                    <option value="CARD">Debit / Credit Card POS</option>
                  </select>
                </div>

                {paymentMethod !== 'CASH' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                      Transaction / Reference Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UTR / UPI Ref / Cheque No"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.88rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}

                {paymentMethod === 'CHEQUE' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                        Drawee Bank Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. State Bank of India"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.88rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                        Cheque Date
                      </label>
                      <input
                        type="date"
                        value={chequeDate}
                        onChange={(e) => setChequeDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.88rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                    Remarks / Cashier Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. First partial installment paid by parent"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '24px',
                  paddingTop: '16px',
                  borderTop: '1px solid #E2E8F0',
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
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
                  disabled={submitting}
                  style={{
                    padding: '8px 22px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#16A34A',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {submitting && <RotateCw className="animate-spin" size={14} />}
                  Confirm Payment & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Receipt Modal */}
      {issuedReceipt && (
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
              maxWidth: '640px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 24px',
                borderBottom: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontWeight: 700 }}>
                <CheckCircle size={18} /> Payment Recorded Successfully
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handlePrintReceipt}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#20354A',
                    cursor: 'pointer',
                  }}
                >
                  <Printer size={14} /> Print Receipt
                </button>
                <button
                  onClick={() => setIssuedReceipt(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#647F99' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Official Printable Receipt Sheet */}
            <div id="printableReceipt" style={{ padding: '32px 36px', color: '#20354A' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '2px solid #16A34A',
                  paddingBottom: '16px',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#20354A' }}>
                    EDUHUB INTERNATIONAL SCHOOL
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#647F99' }}>
                    CBSE Affiliation No: 930123 • Accounts & Finance Wing
                  </p>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      backgroundColor: '#DCFCE7',
                      color: '#16A34A',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                    }}
                  >
                    OFFICIAL FEE PAYMENT RECEIPT
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16A34A' }}>
                    {issuedReceipt.receiptNumber}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#647F99', marginTop: '4px' }}>
                    Date: {issuedReceipt.paymentDate}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#94A3B8' }}>
                    Invoice Ref: {issuedReceipt.invoiceNumber}
                  </div>
                </div>
              </div>

              {/* Receipt Details Box */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  backgroundColor: '#F8FAFC',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '24px',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <span style={{ color: '#647F99' }}>Received From: </span>
                  <strong>{issuedReceipt.studentName}</strong>
                </div>
                <div>
                  <span style={{ color: '#647F99' }}>Admission No: </span>
                  <strong>{issuedReceipt.studentAdmissionNumber}</strong>
                </div>
                <div>
                  <span style={{ color: '#647F99' }}>Class & Section: </span>
                  <strong>
                    {issuedReceipt.className} {issuedReceipt.section ? `(${issuedReceipt.section})` : ''}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#647F99' }}>Academic Year: </span>
                  <strong>{issuedReceipt.academicYear}</strong>
                </div>
                <div>
                  <span style={{ color: '#647F99' }}>Payment Mode: </span>
                  <strong>{issuedReceipt.paymentMethod}</strong>
                </div>
                <div>
                  <span style={{ color: '#647F99' }}>Reference ID: </span>
                  <strong>{issuedReceipt.transactionReference || 'N/A (Cash)'}</strong>
                </div>
              </div>

              {/* Amount Highlight */}
              <div
                style={{
                  padding: '18px 24px',
                  backgroundColor: '#F0FDF4',
                  borderRadius: '8px',
                  border: '1px solid #BBF7D0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>
                    TOTAL AMOUNT RECEIVED:
                  </span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16A34A' }}>
                    {formatCurrency(issuedReceipt.amount)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#166534' }}>
                  <span>Status: </span>
                  <strong>SUCCESS (Verified)</strong>
                </div>
              </div>

              {/* Signatures and Stamp */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  borderTop: '1px dashed #CBD5E1',
                  paddingTop: '20px',
                  marginTop: '10px',
                }}
              >
                <div style={{ fontSize: '0.74rem', color: '#94A3B8', maxWidth: '300px' }}>
                  Recorded by: {issuedReceipt.recordedByName}
                  <br />
                  * This receipt is an official acknowledgment of payment received by EduHub School Finance.
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '130px',
                      borderBottom: '1px solid #20354A',
                      marginBottom: '4px',
                    }}
                  />
                  <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#20354A' }}>
                    Cashier / Accounts Officer
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
