import React, { useEffect, useState, useMemo } from 'react';
import {
  DollarSign,
  Search,
  RotateCw,
  Plus,
  Receipt,
  RotateCcw,
  Printer,
  X,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Clock,
  ArrowRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { adminFeeApi } from '../../../api/adminFeeApi';
import { adminApi } from '../../../api/adminApi';
import {
  FeePayment,
  FeeInvoice,
  PaymentMethod,
} from '../../../types/adminFee.types';

interface FeeCollectionTabProps {
  academicYear: string;
}

export const FeeCollectionTab: React.FC<FeeCollectionTabProps> = ({ academicYear }) => {
  // Collection Transactions State
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Summary Metrics
  const [metrics, setMetrics] = useState({
    totalCollected: 0,
    todayCollected: 0,
    pendingPaymentsCount: 0,
    totalOutstanding: 0,
  });

  // Dependencies
  const [classList, setClassList] = useState<string[]>([]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(academicYear);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // ---------------------------------------------------------------------------
  // Collect Payment Modal State
  // ---------------------------------------------------------------------------
  const [isCollectModalOpen, setIsCollectModalOpen] = useState<boolean>(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [searchingStudents, setSearchingStudents] = useState<boolean>(false);
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentInvoices, setStudentInvoices] = useState<FeeInvoice[]>([]);
  const [loadingStudentInvoices, setLoadingStudentInvoices] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoice | null>(null);

  // Payment form inputs
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [chequeDate, setChequeDate] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);
  const [collectModalError, setCollectModalError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Receipt View/Print Modal State
  // ---------------------------------------------------------------------------
  const [viewingReceipt, setViewingReceipt] = useState<FeePayment | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<FeeInvoice | null>(null);

  // ---------------------------------------------------------------------------
  // Reversal Modal State
  // ---------------------------------------------------------------------------
  const [reversingPayment, setReversingPayment] = useState<FeePayment | null>(null);
  const [reversalReason, setReversalReason] = useState<string>('');
  const [submittingReversal, setSubmittingReversal] = useState<boolean>(false);
  const [reversalError, setReversalError] = useState<string | null>(null);

  const formatCurrency = (val: number = 0) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  // Fetch initial classes and summary
  const fetchClasses = async () => {
    try {
      const res = await adminApi.getClasses();
      if (res.success && res.data) {
        const unique = Array.from(new Set(res.data.map((c: any) => c.name)));
        setClassList(unique);
      }
    } catch (err) {
      console.error('Failed to load class list:', err);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await adminFeeApi.getCollectionSummary(
        selectedYear !== 'ALL' ? selectedYear : undefined
      );
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Failed to load collection summary:', err);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFeeApi.getPayments({
        academicYear: selectedYear !== 'ALL' ? selectedYear : undefined,
        className: selectedClass !== 'ALL' ? selectedClass : undefined,
        section: selectedSection !== 'ALL' ? selectedSection : undefined,
        paymentMethod: selectedMethod !== 'ALL' ? selectedMethod : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        startDate: selectedDate || undefined,
        endDate: selectedDate || undefined,
        search: searchTerm.trim() || undefined,
      });

      if (res.success && res.data) {
        setPayments(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load fee collection transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    setSelectedYear(academicYear);
  }, [academicYear]);

  useEffect(() => {
    fetchSummary();
    fetchPayments();
  }, [selectedYear, selectedClass, selectedSection, selectedMethod, selectedStatus, selectedDate]);

  // Handle Enter on search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedClass('ALL');
    setSelectedSection('ALL');
    setSelectedMethod('ALL');
    setSelectedStatus('ALL');
    setSelectedDate('');
  };

  // ---------------------------------------------------------------------------
  // Collect Payment Modal Logic
  // ---------------------------------------------------------------------------
  const handleOpenCollectModal = () => {
    setSelectedStudent(null);
    setSelectedInvoice(null);
    setStudentInvoices([]);
    setStudentSearchQuery('');
    setStudentSearchResults([]);
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('CASH');
    setTransactionRef('');
    setBankName('');
    setChequeDate('');
    setRemarks('');
    setCollectModalError(null);
    setIsCollectModalOpen(true);
  };

  // Search enrolled students for payment modal
  const handleStudentSearch = async () => {
    if (!studentSearchQuery.trim()) return;
    try {
      setSearchingStudents(true);
      const res = await adminApi.getStudents({
        academicYear: selectedYear !== 'ALL' ? selectedYear : undefined,
        search: studentSearchQuery.trim(),
        status: 'ACTIVE',
      });
      if (res.success && res.data) {
        setStudentSearchResults(res.data.students || []);
      }
    } catch (err) {
      console.error('Failed to search students:', err);
    } finally {
      setSearchingStudents(false);
    }
  };

  // Select student and load their outstanding invoices
  const handleSelectStudent = async (student: any) => {
    setSelectedStudent(student);
    setSelectedInvoice(null);
    setPaymentAmount('');
    setCollectModalError(null);

    try {
      setLoadingStudentInvoices(true);
      const sId = (student.id || student._id)?.toString();
      const res = await adminFeeApi.getInvoices({
        studentId: sId,
        academicYear: selectedYear !== 'ALL' ? selectedYear : undefined,
      });

      if (res.success && res.data) {
        // Filter invoices that are payable
        const payable = res.data.filter(
          (inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.outstandingAmount > 0
        );
        setStudentInvoices(payable);
        if (payable.length > 0) {
          handleSelectInvoice(payable[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load student invoices:', err);
    } finally {
      setLoadingStudentInvoices(false);
    }
  };

  // Select an invoice from student's invoices
  const handleSelectInvoice = (inv: FeeInvoice) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.outstandingAmount);
    setCollectModalError(null);
  };

  // Live financial preview for collection form
  const paymentPreview = useMemo(() => {
    if (!selectedInvoice) {
      return { due: 0, paying: 0, remaining: 0, nextStatus: 'UNPAID' };
    }
    const due = selectedInvoice.outstandingAmount || 0;
    const paying = typeof paymentAmount === 'number' ? Math.max(0, paymentAmount) : 0;
    const remaining = Math.max(0, due - paying);
    const nextStatus = remaining === 0 ? 'PAID' : 'PARTIAL';
    return { due, paying, remaining, nextStatus };
  }, [selectedInvoice, paymentAmount]);

  // Submit Collect Fee
  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) {
      setCollectModalError('Please select an outstanding invoice to collect payment for.');
      return;
    }

    const numAmount = Number(paymentAmount);
    if (!numAmount || numAmount <= 0) {
      setCollectModalError('Payment amount must be greater than zero.');
      return;
    }

    if (numAmount > selectedInvoice.outstandingAmount) {
      setCollectModalError(
        `Payment amount (${formatCurrency(numAmount)}) cannot exceed outstanding balance (${formatCurrency(
          selectedInvoice.outstandingAmount
        )}).`
      );
      return;
    }

    if (
      (paymentMethod === 'UPI' || paymentMethod === 'BANK_TRANSFER') &&
      !transactionRef.trim()
    ) {
      setCollectModalError(
        `Please provide the bank / UPI transaction reference ID for ${paymentMethod}.`
      );
      return;
    }

    if (paymentMethod === 'CHEQUE' && !transactionRef.trim()) {
      setCollectModalError('Please enter the cheque number in the reference field.');
      return;
    }

    try {
      setSubmittingPayment(true);
      setCollectModalError(null);

      const res = await adminFeeApi.collectFee({
        invoiceId: selectedInvoice.id,
        amount: numAmount,
        paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        paymentMethod,
        transactionReference: transactionRef.trim() || undefined,
        bankName: bankName.trim() || undefined,
        chequeDate: chequeDate || undefined,
        remarks: remarks.trim() || undefined,
      });

      if (res.success && res.data) {
        const newlyIssued = res.data;
        setIsCollectModalOpen(false);
        // Refresh table & metrics
        fetchPayments();
        fetchSummary();
        // Open receipt modal directly
        handleOpenReceipt(newlyIssued);
      }
    } catch (err: any) {
      setCollectModalError(err?.message || 'Failed to record fee payment.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Receipt View & Print
  // ---------------------------------------------------------------------------
  const handleOpenReceipt = async (p: FeePayment) => {
    setViewingReceipt(p);
    setViewingInvoice(null);
    try {
      if (p.invoiceId) {
        const res = await adminFeeApi.getInvoiceById(p.invoiceId);
        if (res.success && res.data) {
          setViewingInvoice(res.data);
        }
      }
    } catch (err) {
      console.error('Failed to load invoice for receipt:', err);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // ---------------------------------------------------------------------------
  // Payment Reversal
  // ---------------------------------------------------------------------------
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
      setSubmittingReversal(true);
      setReversalError(null);
      const res = await adminFeeApi.reversePayment(reversingPayment.id, {
        reason: reversalReason.trim(),
      });

      if (res.success) {
        setReversingPayment(null);
        fetchPayments();
        fetchSummary();
      }
    } catch (err: any) {
      setReversalError(err?.message || 'Failed to reverse payment transaction.');
    } finally {
      setSubmittingReversal(false);
    }
  };

  const getMethodBadgeStyle = (method: PaymentMethod) => {
    switch (method) {
      case 'CASH':
        return { bg: '#ECFDF5', text: '#059669', label: 'CASH' };
      case 'UPI':
        return { bg: '#EFF6FF', text: '#2563EB', label: 'UPI' };
      case 'BANK_TRANSFER':
        return { bg: '#F5F3FF', text: '#7C3AED', label: 'NET BANKING' };
      case 'CHEQUE':
        return { bg: '#FFFBEB', text: '#D97706', label: 'CHEQUE' };
      case 'CARD':
        return { bg: '#FDF2F8', text: '#DB2777', label: 'CARD' };
      default:
        return { bg: '#F1F5F9', text: '#475569', label: method };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner and Action Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          backgroundColor: '#ffffff',
          padding: '20px 24px',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#20354A' }}>
            Fee Collection Desk
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#647F99' }}>
            Record counter tuition receipts, apply partial or full payments, and maintain the audit ledger.
          </p>
        </div>

        <button
          onClick={handleOpenCollectModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#16A34A',
            color: '#ffffff',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)',
          }}
        >
          <Plus size={18} /> Collect Payment
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Total Fees Collected */}
        <div
          style={{
            borderRadius: '10px',
            padding: '18px 20px',
            border: '1px solid #BBF7D0',
            backgroundColor: '#F0FDF4',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16A34A', textTransform: 'uppercase' }}>
              Total Fees Collected
            </span>
            <DollarSign size={18} style={{ color: '#16A34A' }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#16A34A', marginTop: '6px' }}>
            {formatCurrency(metrics.totalCollected)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#15803D', marginTop: '4px' }}>
            Verified financial receipts
          </div>
        </div>

        {/* Today's Collection */}
        <div
          style={{
            borderRadius: '10px',
            padding: '18px 20px',
            border: '1px solid #BAE6FD',
            backgroundColor: '#F0F9FF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0284C7', textTransform: 'uppercase' }}>
              Today's Collection
            </span>
            <Clock size={18} style={{ color: '#0284C7' }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0284C7', marginTop: '6px' }}>
            {formatCurrency(metrics.todayCollected)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#0369A1', marginTop: '4px' }}>
            Receipts issued today
          </div>
        </div>

        {/* Pending Payments */}
        <div
          style={{
            borderRadius: '10px',
            padding: '18px 20px',
            border: '1px solid #FED7AA',
            backgroundColor: '#FFFBEB',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>
              Pending Invoices
            </span>
            <AlertCircle size={18} style={{ color: '#D97706' }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#D97706', marginTop: '6px' }}>
            {metrics.pendingPaymentsCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#B45309', marginTop: '4px' }}>
            Unpaid or partial vouchers
          </div>
        </div>

        {/* Total Outstanding */}
        <div
          style={{
            borderRadius: '10px',
            padding: '18px 20px',
            border: '1px solid #FECACA',
            backgroundColor: '#FEF2F2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>
              Total Outstanding
            </span>
            <CreditCard size={18} style={{ color: '#DC2626' }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#DC2626', marginTop: '6px' }}>
            {formatCurrency(metrics.totalOutstanding)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#B91C1C', marginTop: '4px' }}>
            Across all enrolled classes
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#ffffff',
          padding: '14px 20px',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
        }}
      >
        {/* Search Input */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            padding: '6px 12px',
            minWidth: '260px',
            flex: 1,
            maxWidth: '360px',
          }}
        >
          <Search size={16} style={{ color: '#647F99' }} />
          <input
            type="text"
            placeholder="Search student, receipt, or invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.85rem',
              width: '100%',
              color: '#20354A',
            }}
          />
        </form>

        {/* Academic Year Filter */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
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
          <option value="ALL">All Years</option>
          <option value="2026-2027">2026-2027</option>
          <option value="2025-2026">2025-2026</option>
        </select>

        {/* Class Filter */}
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

        {/* Section Filter */}
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

        {/* Payment Method Filter */}
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
          <option value="BANK_TRANSFER">Bank Transfer / Net Banking</option>
          <option value="CHEQUE">Cheque</option>
          <option value="CARD">Card</option>
        </select>

        {/* Status Filter */}
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
          <option value="SUCCESS">Success / Posted</option>
          <option value="REVERSED">Reversed</option>
        </select>

        {/* Date Filter */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            fontSize: '0.84rem',
            color: '#20354A',
            outline: 'none',
            backgroundColor: '#ffffff',
          }}
        />

        {(searchTerm || selectedClass !== 'ALL' || selectedSection !== 'ALL' || selectedMethod !== 'ALL' || selectedStatus !== 'ALL' || selectedDate) && (
          <button
            onClick={handleResetFilters}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              color: '#647F99',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Collection Transactions Table */}
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
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading fee collection records...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#DC2626' }}>{error}</div>
        ) : payments.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <Receipt size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>
              No payment transactions found matching criteria.
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>
              Click "Collect Payment" to record a student fee payment.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Receipt #
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Student Details
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Invoice #
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Payment Date
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Amount Paid
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Payment Method
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Recorded By
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Transaction Status
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99', textAlign: 'right' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const isReversed = p.status === 'REVERSED';
                  const methodBadge = getMethodBadgeStyle(p.paymentMethod);

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        opacity: isReversed ? 0.65 : 1,
                        backgroundColor: isReversed ? '#FAFAFA' : '#ffffff',
                      }}
                    >
                      {/* Receipt Number */}
                      <td style={{ padding: '14px 16px' }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            fontSize: '0.88rem',
                            color: '#20354A',
                          }}
                        >
                          {p.receiptNumber}
                        </div>
                      </td>

                      {/* Student Details */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#20354A' }}>
                          {p.studentName}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#647F99', marginTop: '2px' }}>
                          {p.studentAdmissionNumber} • {p.className} ({p.section || 'A'})
                        </div>
                      </td>

                      {/* Invoice Number */}
                      <td style={{ padding: '14px 16px', fontSize: '0.84rem', fontFamily: 'monospace', color: '#20354A' }}>
                        {p.invoiceNumber}
                      </td>

                      {/* Payment Date */}
                      <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#647F99' }}>
                        {p.paymentDate}
                      </td>

                      {/* Amount Paid */}
                      <td style={{ padding: '14px 16px', fontSize: '0.92rem', fontWeight: 800, color: isReversed ? '#94A3B8' : '#16A34A' }}>
                        {formatCurrency(p.amount)}
                      </td>

                      {/* Payment Method */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            backgroundColor: methodBadge.bg,
                            color: methodBadge.text,
                          }}
                        >
                          {methodBadge.label}
                        </span>
                        {p.transactionReference && (
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: '#647F99',
                              fontFamily: 'monospace',
                              marginTop: '2px',
                            }}
                          >
                            Ref: {p.transactionReference}
                          </div>
                        )}
                      </td>

                      {/* Recorded By */}
                      <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#20354A' }}>
                        {p.recordedByName || 'School Admin'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: isReversed ? '#FEE2E2' : '#DCFCE7',
                            color: isReversed ? '#DC2626' : '#16A34A',
                            letterSpacing: '0.3px',
                          }}
                        >
                          {p.status}
                        </span>
                        {isReversed && p.reversalReason && (
                          <div style={{ fontSize: '0.7rem', color: '#DC2626', marginTop: '2px' }}>
                            {p.reversalReason}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          {/* View Receipt */}
                          <button
                            title="View / Print Receipt"
                            onClick={() => handleOpenReceipt(p)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#ffffff',
                              color: '#20354A',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <Receipt size={14} /> Receipt
                          </button>

                          {/* Reverse Payment Action */}
                          {!isReversed && (
                            <button
                              title="Reverse Payment"
                              onClick={() => handleOpenReverseModal(p)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                border: '1px solid #FCA5A5',
                                backgroundColor: '#FEF2F2',
                                color: '#DC2626',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <RotateCcw size={13} />
                            </button>
                          )}
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
      {/* 1. COLLECT PAYMENT MODAL                                                  */}
      {/* ========================================================================= */}
      {isCollectModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
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
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#F8FAFC',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#20354A' }}>
                  Collect Fee Payment
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#647F99' }}>
                  Receive student payment, update balance, and issue official financial receipt.
                </p>
              </div>
              <button
                onClick={() => setIsCollectModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#647F99',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCollectSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {collectModalError && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#DC2626',
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{collectModalError}</span>
                </div>
              )}

              {/* Step 1: Select Student */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                  1. Search & Select Student *
                </label>

                {!selectedStudent ? (
                  <div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Search student by name or admission number (e.g. Azna, STU-2026-0003)..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleStudentSearch())}
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.85rem',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleStudentSearch}
                        disabled={searchingStudents}
                        style={{
                          padding: '9px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#20354A',
                          color: '#ffffff',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {searchingStudents ? <RotateCw className="animate-spin" size={14} /> : <Search size={14} />}
                        Search
                      </button>
                    </div>

                    {studentSearchResults.length > 0 && (
                      <div
                        style={{
                          marginTop: '8px',
                          maxHeight: '160px',
                          overflowY: 'auto',
                          border: '1px solid #E2E8F0',
                          borderRadius: '6px',
                          backgroundColor: '#F8FAFC',
                        }}
                      >
                        {studentSearchResults.map((st) => (
                          <div
                            key={st.id || st._id}
                            onClick={() => handleSelectStudent(st)}
                            style={{
                              padding: '10px 14px',
                              borderBottom: '1px solid #E2E8F0',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EEF2F6')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#20354A' }}>
                                {st.fullName}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: '#647F99' }}>
                                {st.studentId} • {st.grade || st.className}-{st.section}
                              </div>
                            </div>
                            <span style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: 600 }}>
                              Select Student →
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#F0F9FF',
                      border: '1px solid #BAE6FD',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0369A1' }}>
                        {selectedStudent.fullName} ({selectedStudent.studentId})
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#0284C7', marginTop: '2px' }}>
                        Class: {selectedStudent.grade || selectedStudent.className}-{selectedStudent.section} • Academic Year: {selectedStudent.academicYear || selectedYear}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(null)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: '1px solid #BAE6FD',
                        backgroundColor: '#ffffff',
                        color: '#0284C7',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Change Student
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Select Outstanding Invoice */}
              {selectedStudent && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                    2. Select Outstanding Invoice *
                  </label>

                  {loadingStudentInvoices ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#647F99', fontSize: '0.85rem' }}>
                      <RotateCw className="animate-spin" size={18} style={{ margin: '0 auto 6px' }} />
                      Loading outstanding invoices...
                    </div>
                  ) : studentInvoices.length === 0 ? (
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '8px',
                        backgroundColor: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        color: '#15803D',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <CheckCircle size={18} />
                      <span>This student has no outstanding invoices pending payment. All fees are fully paid!</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {studentInvoices.map((inv) => {
                        const isSelected = selectedInvoice?.id === inv.id;
                        return (
                          <div
                            key={inv.id}
                            onClick={() => handleSelectInvoice(inv)}
                            style={{
                              padding: '12px 16px',
                              borderRadius: '8px',
                              border: isSelected ? '2px solid #16A34A' : '1px solid #E2E8F0',
                              backgroundColor: isSelected ? '#F0FDF4' : '#ffffff',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#20354A' }}>
                                {inv.invoiceNumber} — {inv.installmentName || 'Annual Tuition Fee'}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#647F99', marginTop: '2px' }}>
                                Total Invoiced: {formatCurrency(inv.totalPayable)} • Paid: {formatCurrency(inv.paidAmount)} • Due Date: {inv.dueDate}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#DC2626' }}>
                                {formatCurrency(inv.outstandingAmount)} Due
                              </div>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  color: isSelected ? '#16A34A' : '#647F99',
                                }}
                              >
                                {isSelected ? '✓ Selected' : 'Click to Select'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Payment Details Entry */}
              {selectedInvoice && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    {/* Payment Amount */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#20354A' }}>
                          Payment Amount (₹) *
                        </label>
                        <button
                          type="button"
                          onClick={() => setPaymentAmount(selectedInvoice.outstandingAmount)}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: '#2563EB',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Full ({formatCurrency(selectedInvoice.outstandingAmount)})
                        </button>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max={selectedInvoice.outstandingAmount}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Enter payment amount"
                        required
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#20354A',
                          outline: 'none',
                        }}
                      />
                    </div>

                    {/* Payment Date */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '4px' }}>
                        Payment Date *
                      </label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.85rem',
                          color: '#20354A',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '8px' }}>
                      Payment Method *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      {[
                        { key: 'CASH', label: 'Cash' },
                        { key: 'UPI', label: 'UPI / QR' },
                        { key: 'BANK_TRANSFER', label: 'Bank Transfer' },
                        { key: 'CHEQUE', label: 'Cheque' },
                      ].map((m) => {
                        const isSelected = paymentMethod === m.key;
                        return (
                          <button
                            type="button"
                            key={m.key}
                            onClick={() => setPaymentMethod(m.key as PaymentMethod)}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: isSelected ? '2px solid #20354A' : '1px solid #CBD5E1',
                              backgroundColor: isSelected ? '#20354A' : '#ffffff',
                              color: isSelected ? '#ffffff' : '#20354A',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              textAlign: 'center',
                            }}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Method Fields */}
                  {paymentMethod !== 'CASH' && (
                    <div
                      style={{
                        padding: '14px',
                        borderRadius: '8px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#647F99' }}>
                        <Info size={14} />
                        <span>
                          Manual Counter Record: Enter reference details from physical receipt / bank voucher.
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#20354A', marginBottom: '4px' }}>
                            {paymentMethod === 'UPI' ? 'UPI Transaction / UTR Ref *' : paymentMethod === 'CHEQUE' ? 'Cheque Number *' : 'Bank UTR / Transaction Ref *'}
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 123456789012"
                            value={transactionRef}
                            onChange={(e) => setTransactionRef(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.84rem',
                              outline: 'none',
                            }}
                          />
                        </div>

                        {(paymentMethod === 'CHEQUE' || paymentMethod === 'BANK_TRANSFER') && (
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#20354A', marginBottom: '4px' }}>
                              Drawee Bank Name
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. State Bank of India"
                              value={bankName}
                              onChange={(e) => setBankName(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.84rem',
                                outline: 'none',
                              }}
                            />
                          </div>
                        )}

                        {paymentMethod === 'CHEQUE' && (
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#20354A', marginBottom: '4px' }}>
                              Cheque Date
                            </label>
                            <input
                              type="date"
                              value={chequeDate}
                              onChange={(e) => setChequeDate(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.84rem',
                                outline: 'none',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Remarks */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '4px' }}>
                      Cashier Remarks (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Received at Accounts Counter Desk #1"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.84rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Payment Summary Preview Card */}
                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: '8px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.76rem', color: '#647F99' }}>Outstanding Due</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#20354A' }}>
                        {formatCurrency(paymentPreview.due)}
                      </div>
                    </div>

                    <ArrowRight size={18} style={{ color: '#94A3B8' }} />

                    <div>
                      <div style={{ fontSize: '0.76rem', color: '#16A34A', fontWeight: 600 }}>Amount Collecting</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#16A34A' }}>
                        {formatCurrency(paymentPreview.paying)}
                      </div>
                    </div>

                    <ArrowRight size={18} style={{ color: '#94A3B8' }} />

                    <div>
                      <div style={{ fontSize: '0.76rem', color: '#647F99' }}>Remaining Balance</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: paymentPreview.remaining > 0 ? '#DC2626' : '#16A34A' }}>
                        {formatCurrency(paymentPreview.remaining)} ({paymentPreview.nextStatus})
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: '16px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#ffffff',
                    color: '#647F99',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!selectedInvoice || submittingPayment || !paymentAmount}
                  style={{
                    padding: '9px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: submittingPayment || !selectedInvoice ? '#94A3B8' : '#16A34A',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: submittingPayment || !selectedInvoice ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {submittingPayment ? <RotateCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                  Confirm & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PAYMENT RECEIPT MODAL                                                  */}
      {/* ========================================================================= */}
      {viewingReceipt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
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
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Top Modal Controls (Hidden in Print) */}
            <div
              className="no-print"
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#F8FAFC',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} style={{ color: '#16A34A' }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#20354A' }}>
                  Official Payment Voucher & Receipt
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid #20354A',
                    backgroundColor: '#20354A',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Printer size={14} /> Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setViewingReceipt(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#647F99',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Receipt Layout */}
            <div
              id="printable-receipt"
              style={{
                padding: '36px 40px',
                backgroundColor: '#ffffff',
                color: '#20354A',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {/* Institution Header */}
              <div
                style={{
                  textAlign: 'center',
                  borderBottom: '2px solid #20354A',
                  paddingBottom: '16px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', color: '#647F99', textTransform: 'uppercase' }}>
                  School Education Department
                </div>
                <h1 style={{ margin: '4px 0 2px', fontSize: '1.5rem', fontWeight: 900, color: '#20354A' }}>
                  EDUHUB INTERNATIONAL ACADEMY
                </h1>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#647F99' }}>
                  CBSE Affiliation No. 930123 • School Code: 75432 • accounts@eduhub.edu • +91 98765 43210
                </p>
                <div
                  style={{
                    display: 'inline-block',
                    marginTop: '10px',
                    padding: '3px 16px',
                    borderRadius: '20px',
                    backgroundColor: '#20354A',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  FEE PAYMENT RECEIPT
                </div>
              </div>

              {/* Receipt Metadata Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px',
                  padding: '14px 18px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '20px',
                  fontSize: '0.84rem',
                }}
              >
                <div>
                  <div style={{ color: '#647F99', fontSize: '0.74rem' }}>RECEIPT NUMBER</div>
                  <div style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.95rem', color: '#20354A' }}>
                    {viewingReceipt.receiptNumber}
                  </div>
                  <div style={{ color: '#647F99', fontSize: '0.74rem', marginTop: '6px' }}>PAYMENT DATE</div>
                  <div style={{ fontWeight: 600 }}>{viewingReceipt.paymentDate}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#647F99', fontSize: '0.74rem' }}>INVOICE REFERENCE</div>
                  <div style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.95rem', color: '#20354A' }}>
                    {viewingReceipt.invoiceNumber}
                  </div>
                  <div style={{ color: '#647F99', fontSize: '0.74rem', marginTop: '6px' }}>COLLECTED BY</div>
                  <div style={{ fontWeight: 600 }}>{viewingReceipt.recordedByName || 'School Accounts Counter'}</div>
                </div>
              </div>

              {/* Student Identification */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  padding: '14px 18px',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '0.84rem',
                }}
              >
                <div>
                  <span style={{ color: '#647F99' }}>Student Name: </span>
                  <span style={{ fontWeight: 700 }}>{viewingReceipt.studentName}</span>
                </div>
                <div>
                  <span style={{ color: '#647F99' }}>Admission ID: </span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{viewingReceipt.studentAdmissionNumber}</span>
                </div>
                <div>
                  <span style={{ color: '#647F99' }}>Class / Section: </span>
                  <span style={{ fontWeight: 600 }}>{viewingReceipt.className} ({viewingReceipt.section || 'A'})</span>
                </div>
                <div>
                  <span style={{ color: '#647F99' }}>Academic Year: </span>
                  <span style={{ fontWeight: 600 }}>{viewingReceipt.academicYear}</span>
                </div>
              </div>

              {/* Payment Details Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '20px', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                    <th style={{ padding: '10px 14px', color: '#475569' }}>Fee Head / Description</th>
                    <th style={{ padding: '10px 14px', color: '#475569' }}>Payment Mode</th>
                    <th style={{ padding: '10px 14px', color: '#475569' }}>Transaction Reference</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '14px', fontWeight: 600 }}>
                      Tuition & Instructional Term Fee
                      {viewingInvoice && (
                        <div style={{ fontSize: '0.74rem', color: '#647F99', fontWeight: 400 }}>
                          Installment: {viewingInvoice.installmentName || 'Annual'}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          backgroundColor: '#F1F5F9',
                        }}
                      >
                        {viewingReceipt.paymentMethod}
                      </span>
                    </td>
                    <td style={{ padding: '14px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#647F99' }}>
                      {viewingReceipt.transactionReference || 'N/A (Cash Counter)'}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right', fontWeight: 800, fontSize: '1rem', color: '#16A34A' }}>
                      {formatCurrency(viewingReceipt.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Balance Summary Box */}
              {viewingInvoice && (
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    padding: '14px 18px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    fontSize: '0.84rem',
                  }}
                >
                  <div>
                    <span style={{ color: '#647F99' }}>Total Invoice Amount: </span>
                    <span style={{ fontWeight: 700 }}>{formatCurrency(viewingInvoice.totalPayable)}</span>
                  </div>
                  <div>
                    <span style={{ color: '#647F99' }}>Total Paid To Date: </span>
                    <span style={{ fontWeight: 700, color: '#16A34A' }}>{formatCurrency(viewingInvoice.paidAmount)}</span>
                  </div>
                  <div>
                    <span style={{ color: '#647F99' }}>Outstanding Due: </span>
                    <span style={{ fontWeight: 800, color: viewingInvoice.outstandingAmount > 0 ? '#DC2626' : '#16A34A' }}>
                      {formatCurrency(viewingInvoice.outstandingAmount)} ({viewingInvoice.status})
                    </span>
                  </div>
                </div>
              )}

              {/* Status and Signatures Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  marginTop: '40px',
                  paddingTop: '20px',
                  borderTop: '1px dashed #CBD5E1',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#647F99' }}>
                    * This is a system-authenticated digital fee receipt.
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#647F99', marginTop: '2px' }}>
                    Retain this receipt for tax deduction and school administration records.
                  </div>
                  {viewingReceipt.remarks && (
                    <div style={{ fontSize: '0.74rem', color: '#20354A', marginTop: '4px', fontStyle: 'italic' }}>
                      Note: {viewingReceipt.remarks}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '140px', borderBottom: '1px solid #20354A', marginBottom: '6px' }} />
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#20354A' }}>
                    Accounts Officer
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#647F99' }}>Cashier Desk</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PAYMENT REVERSAL MODAL                                                 */}
      {/* ========================================================================= */}
      {reversingPayment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
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
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#DC2626', marginBottom: '14px' }}>
              <RotateCcw size={22} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#20354A' }}>
                Reverse Fee Payment Transaction
              </h3>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '0.86rem', color: '#647F99', lineHeight: 1.5 }}>
              You are about to reverse receipt{' '}
              <strong style={{ fontFamily: 'monospace', color: '#20354A' }}>{reversingPayment.receiptNumber}</strong>{' '}
              ({formatCurrency(reversingPayment.amount)}) paid by <strong>{reversingPayment.studentName}</strong>.
            </p>

            <div
              style={{
                backgroundColor: '#FFFBEB',
                border: '1px solid #FCD34D',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
                fontSize: '0.8rem',
                color: '#B45309',
                display: 'flex',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                Reversing this payment will restore the student's invoice balance to{' '}
                <strong>{reversingPayment.invoiceNumber}</strong> and post an auditable contra entry to the financial ledger.
              </div>
            </div>

            {reversalError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#DC2626',
                  fontSize: '0.82rem',
                  marginBottom: '14px',
                }}
              >
                {reversalError}
              </div>
            )}

            <form onSubmit={handleReverseSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                  Auditable Reversal Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Bounced cheque #123456, Entered wrong student admission ID, Duplicate counter collection..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.84rem',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setReversingPayment(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#ffffff',
                    color: '#647F99',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReversal || !reversalReason.trim()}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#DC2626',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: submittingReversal || !reversalReason.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {submittingReversal && <RotateCw className="animate-spin" size={14} />}
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
