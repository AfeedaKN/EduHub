import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  Search,
  RotateCw,
  Plus,
  Eye,
  Printer,
  X,
  AlertCircle,
  CheckCircle,
  Receipt,
} from 'lucide-react';
import { adminFeeApi } from '../../../api/adminFeeApi';
import { adminApi } from '../../../api/adminApi';
import { FeeInvoice, InvoiceStatus, FeePayment } from '../../../types/adminFee.types';

interface FeeInvoicesTabProps {
  academicYear: string;
}

export const FeeInvoicesTab: React.FC<FeeInvoicesTabProps> = ({ academicYear }) => {
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [classList, setClassList] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [dueDateSort, setDueDateSort] = useState<'NONE' | 'OVERDUE_FIRST' | 'DUE_ASC' | 'DUE_DESC'>('NONE');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Invoice Details Modal
  const [viewingInvoice, setViewingInvoice] = useState<FeeInvoice | null>(null);

  // Payment History Modal
  const [historyInvoice, setHistoryInvoice] = useState<FeeInvoice | null>(null);
  const [historyPayments, setHistoryPayments] = useState<FeePayment[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Generate Invoices Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false);
  const [generateData, setGenerateData] = useState({
    academicYear: academicYear !== 'ALL' ? academicYear : '2026-2027',
    className: '',
    section: 'ALL',
    installmentNumber: 1,
    dueDate: '',
  });
  const [generating, setGenerating] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState<string | null>(null);

  const fetchClasses = async () => {
    try {
      const res = await adminApi.getClasses();
      if (res.success && res.data) {
        const uniqueClasses = Array.from(new Set(res.data.map((c: any) => c.name)));
        setClassList(uniqueClasses);
        if (uniqueClasses.length > 0 && !generateData.className) {
          setGenerateData((prev) => ({ ...prev, className: uniqueClasses[0] }));
        }
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFeeApi.getInvoices({
        academicYear: academicYear !== 'ALL' ? academicYear : undefined,
        className: selectedClass !== 'ALL' ? selectedClass : undefined,
        section: selectedSection !== 'ALL' ? selectedSection : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        search: searchTerm.trim() || undefined,
      });

      if (res.success && res.data) {
        setInvoices(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load fee invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [academicYear, selectedClass, selectedSection, selectedStatus]);

  const formatCurrency = (val: number = 0) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const getStatusBadgeStyle = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return { bg: '#DCFCE7', text: '#16A34A' };
      case 'PARTIAL':
        return { bg: '#FEF3C7', text: '#D97706' };
      case 'OVERDUE':
        return { bg: '#FEE2E2', text: '#DC2626' };
      case 'UNPAID':
        return { bg: '#EEF3F8', text: '#20354A' };
      case 'CANCELLED':
      default:
        return { bg: '#F1F5F9', text: '#647F99' };
    }
  };

  // Sorted and Filtered Invoices
  const displayedInvoices = useMemo(() => {
    let list = [...invoices];
    if (dueDateSort === 'OVERDUE_FIRST') {
      const today = new Date().toISOString().slice(0, 10);
      list.sort((a, b) => {
        const aOver = a.status === 'OVERDUE' || (a.status !== 'PAID' && a.dueDate < today);
        const bOver = b.status === 'OVERDUE' || (b.status !== 'PAID' && b.dueDate < today);
        if (aOver && !bOver) return -1;
        if (!aOver && bOver) return 1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    } else if (dueDateSort === 'DUE_ASC') {
      list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    } else if (dueDateSort === 'DUE_DESC') {
      list.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
    }
    return list;
  }, [invoices, dueDateSort]);

  const handleOpenGenerateModal = () => {
    const yr = academicYear !== 'ALL' ? academicYear : '2026-2027';
    const yearStart = parseInt(yr.split('-')[0]) || 2026;
    setGenerateData({
      academicYear: yr,
      className: classList[0] || 'Class 1',
      section: 'ALL',
      installmentNumber: 1,
      dueDate: `${yearStart}-07-31`,
    });
    setGenerateError(null);
    setGenerateSuccess(null);
    setIsGenerateModalOpen(true);
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateData.className.trim()) {
      setGenerateError('Please select a class.');
      return;
    }

    try {
      setGenerating(true);
      setGenerateError(null);
      const res = await adminFeeApi.generateInvoices({
        academicYear: generateData.academicYear,
        className: generateData.className,
        section: generateData.section !== 'ALL' ? generateData.section : undefined,
        installmentNumber: Number(generateData.installmentNumber),
        dueDate: generateData.dueDate || undefined,
      });

      if (res.success) {
        setGenerateSuccess(
          `Successfully generated ${res.data.generatedCount} invoice(s) for ${generateData.className} Installment #${generateData.installmentNumber}.`
        );
        setTimeout(() => {
          setIsGenerateModalOpen(false);
          fetchInvoices();
        }, 1300);
      }
    } catch (err: any) {
      setGenerateError(err?.message || 'Failed to generate fee invoices.');
    } finally {
      setGenerating(false);
    }
  };

  // Open Payment History Modal
  const handleOpenPaymentHistory = async (invoice: FeeInvoice) => {
    setHistoryInvoice(invoice);
    setHistoryPayments([]);
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await adminFeeApi.getInvoicePayments(invoice.id);
      if (res.success && res.data) {
        setHistoryPayments(res.data);
      }
    } catch (err: any) {
      setHistoryError(err?.message || 'Failed to load payment history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px', flexWrap: 'wrap' }}>
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
              maxWidth: '300px',
            }}
          >
            <Search size={16} style={{ color: '#647F99' }} />
            <input
              type="text"
              placeholder="Search invoice # or student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchInvoices()}
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

          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
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
            <option value="ALL">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
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
            <option value="ALL">All Statuses</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="PAID">Fully Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={dueDateSort}
            onChange={(e) => setDueDateSort(e.target.value as any)}
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
            <option value="NONE">Sort: Default</option>
            <option value="OVERDUE_FIRST">Sort: Overdue First</option>
            <option value="DUE_ASC">Sort: Due Date (Earliest)</option>
            <option value="DUE_DESC">Sort: Due Date (Latest)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchInvoices}
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
            <RotateCw size={14} /> Refresh
          </button>
          <button
            onClick={handleOpenGenerateModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#20354A',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(32, 53, 74, 0.2)',
            }}
          >
            <Plus size={16} /> Generate Invoices
          </button>
        </div>
      </div>

      {/* Invoices Roster Table */}
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
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading fee invoices...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#DC2626' }}>{error}</div>
        ) : displayedInvoices.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <FileText size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>No fee invoices found.</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>
              Click "Generate Invoices" to issue installment invoices for students with fee structures.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Invoice #
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Student Name
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Class / Sec
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Installment
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Issue Date
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Due Date
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Total Payable
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Paid Amount
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Balance
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Status
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#647F99',
                      textAlign: 'right',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedInvoices.map((inv) => {
                  const badge = getStatusBadgeStyle(inv.status);
                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          color: '#20354A',
                          fontFamily: 'monospace',
                        }}
                      >
                        {inv.invoiceNumber}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#20354A' }}>
                        <div style={{ fontWeight: 600 }}>{inv.studentName}</div>
                        <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                          {inv.studentAdmissionNumber}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#647F99' }}>
                        {inv.className} {inv.section ? `(${inv.section})` : ''}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#20354A' }}>
                        {inv.installmentName}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#647F99' }}>
                        {inv.issueDate}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: inv.status === 'OVERDUE' ? '#DC2626' : '#647F99', fontWeight: inv.status === 'OVERDUE' ? 700 : 400 }}>
                        {inv.dueDate}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: '#20354A',
                        }}
                      >
                        {formatCurrency(inv.totalPayable)}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: '#16A34A',
                        }}
                      >
                        {formatCurrency(inv.paidAmount)}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: inv.outstandingAmount > 0 ? '#DC2626' : '#647F99',
                        }}
                      >
                        {formatCurrency(inv.outstandingAmount)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            backgroundColor: badge.bg,
                            color: badge.text,
                          }}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => setViewingInvoice(inv)}
                            title="View Printable Voucher"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '4px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#ffffff',
                              color: '#20354A',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                            }}
                          >
                            <Eye size={13} /> View
                          </button>

                          <button
                            onClick={() => handleOpenPaymentHistory(inv)}
                            title="View Payment History"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '4px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#F8FAFC',
                              color: '#647F99',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                            }}
                          >
                            <Receipt size={13} /> Payments
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. VIEW & PRINT INVOICE MODAL                                             */}
      {/* ========================================================================= */}
      {viewingInvoice && (
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
              maxWidth: '680px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Top modal bar */}
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
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#647F99' }}>
                Official Fee Demand Voucher
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handlePrintInvoice}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#20354A',
                    cursor: 'pointer',
                  }}
                >
                  <Printer size={14} /> Print Invoice
                </button>
                <button
                  onClick={() => setViewingInvoice(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#647F99' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Voucher Paper */}
            <div id="printableInvoice" style={{ padding: '32px 36px', color: '#20354A' }}>
              {/* School Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '2px solid #20354A',
                  paddingBottom: '16px',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#20354A' }}>
                    EDUHUB INTERNATIONAL SCHOOL
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#647F99' }}>
                    Affiliated to CBSE • Excellence in Education
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#94A3B8' }}>
                    Official Fee Invoice & Demand Voucher
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#20354A', fontFamily: 'monospace' }}>
                    {viewingInvoice.invoiceNumber}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#647F99', marginTop: '4px' }}>
                    Issued: {viewingInvoice.issueDate}
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#DC2626' }}>
                    Due Date: {viewingInvoice.dueDate}
                  </div>
                </div>
              </div>

              {/* Student Metadata Card */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  backgroundColor: '#F8FAFC',
                  padding: '14px 18px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '20px',
                  fontSize: '0.84rem',
                }}
              >
                <div>
                  <span style={{ color: '#647F99' }}>Student Name: </span>
                  <strong>{viewingInvoice.studentName}</strong>
                </div>
                <div>
                  <span style={{ color: '#647F99' }}>Admission No: </span>
                  <strong style={{ fontFamily: 'monospace' }}>{viewingInvoice.studentAdmissionNumber}</strong>
                </div>
                <div>
                  <span style={{ color: '#647F99' }}>Class / Section: </span>
                  <strong>
                    {viewingInvoice.className} {viewingInvoice.section ? `(${viewingInvoice.section})` : ''}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#647F99' }}>Academic Year: </span>
                  <strong>{viewingInvoice.academicYear}</strong>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#647F99' }}>Installment: </span>
                  <strong>{viewingInvoice.installmentName}</strong>
                </div>
              </div>

              {/* Line Items Table */}
              {(() => {
                const itemsToRender = (viewingInvoice.lineItems && viewingInvoice.lineItems.length > 0)
                  ? viewingInvoice.lineItems
                  : (viewingInvoice.items || []).map((it: any) => ({
                      categoryName: it.categoryName,
                      baseAmount: it.amount || 0,
                      concessionAmount: 0,
                      netAmount: it.amount || 0,
                    }));

                return (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '20px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #CBD5E1', backgroundColor: '#EEF3F8' }}>
                        <th style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#20354A' }}>Fee Category</th>
                        <th style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#20354A', textAlign: 'right' }}>Base Amount</th>
                        <th style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#20354A', textAlign: 'right' }}>Concession</th>
                        <th style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#20354A', textAlign: 'right' }}>Net Payable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsToRender.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 12px', fontSize: '0.84rem' }}>{item.categoryName}</td>
                          <td style={{ padding: '10px 12px', fontSize: '0.84rem', textAlign: 'right', color: '#647F99' }}>
                            {formatCurrency(item.baseAmount)}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: '0.84rem', textAlign: 'right', color: (item.concessionAmount || 0) > 0 ? '#16A34A' : '#94A3B8' }}>
                            {(item.concessionAmount || 0) > 0 ? `-${formatCurrency(item.concessionAmount)}` : '-'}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: '0.84rem', fontWeight: 600, textAlign: 'right' }}>
                            {formatCurrency(item.netAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}

              {/* Financial Totals Calculation Box */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginBottom: '24px',
                }}
              >
                <div style={{ width: '280px', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#647F99' }}>
                    <span>Subtotal:</span>
                    <span>{formatCurrency(viewingInvoice.subtotal)}</span>
                  </div>
                  {viewingInvoice.concessionAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#16A34A' }}>
                      <span>Concession Applied:</span>
                      <span>-{formatCurrency(viewingInvoice.concessionAmount)}</span>
                    </div>
                  )}
                  {viewingInvoice.lateFeeAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#DC2626' }}>
                      <span>Late Fee Charges:</span>
                      <span>+{formatCurrency(viewingInvoice.lateFeeAmount)}</span>
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderTop: '1px solid #CBD5E1',
                      borderBottom: '1px solid #CBD5E1',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                    }}
                  >
                    <span>Total Payable:</span>
                    <span>{formatCurrency(viewingInvoice.totalPayable)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#16A34A' }}>
                    <span>Paid Amount:</span>
                    <span>{formatCurrency(viewingInvoice.paidAmount)}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      color: viewingInvoice.outstandingAmount > 0 ? '#DC2626' : '#16A34A',
                    }}
                  >
                    <span>Outstanding Due:</span>
                    <span>{formatCurrency(viewingInvoice.outstandingAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Note and Authorized Seal */}
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
                <div style={{ fontSize: '0.74rem', color: '#94A3B8', maxWidth: '320px' }}>
                  * This is a computer-generated school fee demand voucher. Payments can be submitted via cash, cheque, bank transfer, or UPI at the accounts counter.
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '120px',
                      borderBottom: '1px solid #20354A',
                      marginBottom: '4px',
                    }}
                  />
                  <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#20354A' }}>
                    Authorized Signatory
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PAYMENT HISTORY MODAL                                                  */}
      {/* ========================================================================= */}
      {historyInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
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
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
            }}
          >
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
                  Payment History: {historyInvoice.invoiceNumber}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#647F99' }}>
                  {historyInvoice.studentName} ({historyInvoice.studentAdmissionNumber}) • {historyInvoice.installmentName}
                </span>
              </div>
              <button
                onClick={() => setHistoryInvoice(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#647F99' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Payment Summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  backgroundColor: '#F8FAFC',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '16px',
                  fontSize: '0.84rem',
                }}
              >
                <div>
                  <span style={{ color: '#647F99', display: 'block', fontSize: '0.74rem' }}>Total Payable</span>
                  <strong style={{ fontSize: '0.92rem', color: '#20354A' }}>{formatCurrency(historyInvoice.totalPayable)}</strong>
                </div>
                <div>
                  <span style={{ color: '#647F99', display: 'block', fontSize: '0.74rem' }}>Amount Paid</span>
                  <strong style={{ fontSize: '0.92rem', color: '#16A34A' }}>{formatCurrency(historyInvoice.paidAmount)}</strong>
                </div>
                <div>
                  <span style={{ color: '#647F99', display: 'block', fontSize: '0.74rem' }}>Balance Due</span>
                  <strong style={{ fontSize: '0.92rem', color: historyInvoice.outstandingAmount > 0 ? '#DC2626' : '#16A34A' }}>
                    {formatCurrency(historyInvoice.outstandingAmount)}
                  </strong>
                </div>
              </div>

              {historyLoading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#647F99' }}>
                  <RotateCw className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontSize: '0.86rem' }}>Loading transaction records...</p>
                </div>
              ) : historyError ? (
                <div style={{ padding: '14px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '6px' }}>
                  {historyError}
                </div>
              ) : historyPayments.length === 0 ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', color: '#94A3B8' }}>
                  <Receipt size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>No payments recorded yet</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem' }}>
                    Payments collected against this voucher will appear here.
                  </p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#647F99' }}>
                      <th style={{ padding: '8px 12px' }}>Receipt #</th>
                      <th style={{ padding: '8px 12px' }}>Date</th>
                      <th style={{ padding: '8px 12px' }}>Method</th>
                      <th style={{ padding: '8px 12px' }}>Amount</th>
                      <th style={{ padding: '8px 12px' }}>Ref / Cheque</th>
                      <th style={{ padding: '8px 12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyPayments.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, fontFamily: 'monospace' }}>
                          {p.receiptNumber}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#647F99' }}>{p.paymentDate}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#EEF3F8',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: '#20354A',
                            }}
                          >
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#16A34A' }}>
                          {formatCurrency(p.amount)}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#647F99', fontSize: '0.76rem' }}>
                          {p.transactionReference || p.chequeDate || '-'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '8px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              backgroundColor: p.status === 'SUCCESS' ? '#DCFCE7' : '#FEE2E2',
                              color: p.status === 'SUCCESS' ? '#16A34A' : '#DC2626',
                            }}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  onClick={() => setHistoryInvoice(null)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#ffffff',
                    fontSize: '0.84rem',
                    color: '#20354A',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. GENERATE INVOICES MODAL                                                */}
      {/* ========================================================================= */}
      {isGenerateModalOpen && (
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
              maxWidth: '520px',
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
                backgroundColor: '#F8FAFC',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#20354A' }}>
                  Generate Class Invoices
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#647F99' }}>
                  Issue installment fee invoices in batch for students with assigned fee structures
                </span>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#647F99' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit} style={{ padding: '24px' }}>
              {generateError && (
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
                  <span>{generateError}</span>
                </div>
              )}

              {generateSuccess && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#DCFCE7',
                    border: '1px solid #86EFAC',
                    borderRadius: '6px',
                    color: '#166534',
                    fontSize: '0.84rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle size={16} />
                  <span>{generateSuccess}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                      Academic Year *
                    </label>
                    <input
                      type="text"
                      required
                      value={generateData.academicYear}
                      onChange={(e) => setGenerateData({ ...generateData, academicYear: e.target.value })}
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
                      Target Class *
                    </label>
                    <select
                      required
                      value={generateData.className}
                      onChange={(e) => setGenerateData({ ...generateData, className: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.88rem',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      {classList.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                      Section
                    </label>
                    <select
                      value={generateData.section}
                      onChange={(e) => setGenerateData({ ...generateData, section: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.88rem',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <option value="ALL">All Sections</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                      Installment Term *
                    </label>
                    <select
                      value={generateData.installmentNumber}
                      onChange={(e) => setGenerateData({ ...generateData, installmentNumber: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.88rem',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <option value={1}>Installment 1 (Term 1 / Admission)</option>
                      <option value={2}>Installment 2 (Term 2)</option>
                      <option value={3}>Installment 3 (Term 3)</option>
                      <option value={4}>Installment 4 (Term 4)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                    Payment Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={generateData.dueDate}
                    onChange={(e) => setGenerateData({ ...generateData, dueDate: e.target.value })}
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
                  onClick={() => setIsGenerateModalOpen(false)}
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
                  disabled={generating}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#20354A',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: generating ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {generating && <RotateCw className="animate-spin" size={14} />}
                  Generate Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
