import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  RotateCw,
  Printer,
  X,
  FileText,
  User,
  AlertTriangle,
  GraduationCap,
  UserPlus,
  ArrowRight,
  Info,
  Receipt,
  Layers,
  Clock,
  ShieldCheck,
  Lock,
  AlertCircle,
  Smartphone,
  Landmark,
} from 'lucide-react';
import { ParentLayout } from '../../components/parent/ParentLayout';
import { parentApi } from '../../api/parentApi';
import {
  ChildProfile,
  ParentInvoice,
  ParentFeeAssignment,
  ParentPaymentHistory,
  ParentPaymentRecord,
} from '../../types/parent.types';

export const ParentFeesPage: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('ALL');
  const [academicYears, setAcademicYears] = useState<string[]>([]);

  // State data from backend
  const [hasEnrolledChildren, setHasEnrolledChildren] = useState<boolean>(true);
  const [registrationRequestsCount, setRegistrationRequestsCount] = useState<number>(0);
  const [assignment, setAssignment] = useState<ParentFeeAssignment | null>(null);
  const [assignments, setAssignments] = useState<ParentFeeAssignment[]>([]);
  const [invoices, setInvoices] = useState<ParentInvoice[]>([]);

  const [summary, setSummary] = useState({
    totalFees: 0,
    amountPaid: 0,
    outstandingBalance: 0,
    overdueAmount: 0,
    overdueInvoicesCount: 0,
  });

  // Modals
  const [viewingInvoice, setViewingInvoice] = useState<ParentInvoice | null>(null);
  const [viewingPaymentHistoryInvoice, setViewingPaymentHistoryInvoice] = useState<ParentInvoice | null>(null);
  const [viewingReceiptPayment, setViewingReceiptPayment] = useState<{
    payment: ParentPaymentHistory;
    invoice: ParentInvoice;
  } | null>(null);

  // Tab & Payment History State
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'PAYMENTS'>('INVOICES');
  const [parentPayments, setParentPayments] = useState<ParentPaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false);

  // Online Payment Checkout State (Razorpay)
  const [payingInvoice, setPayingInvoice] = useState<ParentInvoice | null>(null);
  const [paymentMode, setPaymentMode] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [customPaymentAmount, setCustomPaymentAmount] = useState<string>('');
  const [selectedGatewayMethod, setSelectedGatewayMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING'>('UPI');
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fetchFeeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await parentApi.getFeeInvoices({
        studentId: selectedChildId !== 'ALL' ? selectedChildId : undefined,
        academicYear: selectedAcademicYear !== 'ALL' ? selectedAcademicYear : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      });

      if (res.success && res.data) {
        setChildren(res.data.children || []);
        setHasEnrolledChildren(res.data.hasEnrolledChildren !== false);
        setRegistrationRequestsCount(res.data.registrationRequestsCount || 0);
        setAssignment(res.data.assignment || null);
        setAssignments(res.data.assignments || []);
        setInvoices(res.data.invoices || []);
        setSummary(res.data.summary || {
          totalFees: 0,
          amountPaid: 0,
          outstandingBalance: 0,
          overdueAmount: 0,
          overdueInvoicesCount: 0,
        });
        setAcademicYears(res.data.academicYears || ['2026-2027']);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load fee information. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      setLoadingPayments(true);
      const res = await parentApi.getParentPayments({
        studentId: selectedChildId !== 'ALL' ? selectedChildId : undefined,
        academicYear: selectedAcademicYear !== 'ALL' ? selectedAcademicYear : undefined,
      });
      if (res.success && res.data) {
        setParentPayments(res.data.payments || []);
      }
    } catch (err) {
      console.error('Failed to load payment history:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchFeeData();
    fetchPaymentHistory();
  }, [selectedChildId, selectedStatus, selectedAcademicYear]);

  // Payment Calculation & Live Validation
  const effectivePaymentAmount = useMemo(() => {
    if (!payingInvoice) return 0;
    if (paymentMode === 'FULL') {
      return payingInvoice.outstandingAmount;
    }
    const parsed = Number(customPaymentAmount);
    return isNaN(parsed) ? 0 : parsed;
  }, [payingInvoice, paymentMode, customPaymentAmount]);

  const paymentValidationError = useMemo(() => {
    if (!payingInvoice) return null;
    if (effectivePaymentAmount <= 0) {
      return 'Payment amount must be greater than ₹0.';
    }
    if (effectivePaymentAmount > payingInvoice.outstandingAmount) {
      return `Payment amount (₹${effectivePaymentAmount.toLocaleString('en-IN')}) cannot exceed the outstanding balance (₹${payingInvoice.outstandingAmount.toLocaleString('en-IN')}).`;
    }
    return null;
  }, [payingInvoice, effectivePaymentAmount]);

  const handleOpenPayModal = (invoice: ParentInvoice) => {
    setPayingInvoice(invoice);
    setPaymentMode('FULL');
    setCustomPaymentAmount(String(invoice.outstandingAmount));
    setSelectedGatewayMethod('UPI');
    setPaymentError(null);
    setProcessingPayment(false);
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleInitiateOnlinePayment = async () => {
    if (!payingInvoice || paymentValidationError) return;

    try {
      setProcessingPayment(true);
      setPaymentError(null);

      // 1. Request Payment Order from Backend
      const orderRes = await parentApi.createPaymentOrder({
        invoiceId: payingInvoice.id,
        amount: effectivePaymentAmount,
      });

      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.message || 'Failed to initialize payment gateway order.');
      }

      const order = orderRes.data;

      // 2. Load Razorpay Checkout SDK
      const scriptLoaded = await loadRazorpayScript();

      if (scriptLoaded && (window as any).Razorpay) {
        // Open official Razorpay modal
        const options = {
          key: order.keyId,
          amount: order.amountInPaise,
          currency: order.currency,
          name: 'EDUHUB INTERNATIONAL SCHOOL',
          description: `Fee Payment: ${order.studentName} (${order.invoiceNumber})`,
          order_id: order.gatewayOrderId,
          prefill: {
            name: order.studentName,
          },
          theme: {
            color: '#16A34A',
          },
          handler: async function (response: any) {
            await handleCompleteVerification({
              invoiceId: order.invoiceId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentMethod: selectedGatewayMethod,
            });
          },
          modal: {
            ondismiss: function () {
              setProcessingPayment(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setPaymentError(
            resp?.error?.description || 'Payment was declined or cancelled on the gateway.'
          );
          setProcessingPayment(false);
        });
        rzp.open();
      }
    } catch (err: any) {
      setPaymentError(err?.message || 'Payment initiation failed. Please try again.');
      setProcessingPayment(false);
    }
  };

  const handleCompleteVerification = async (payload: {
    invoiceId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    paymentMethod?: string;
  }) => {
    try {
      setProcessingPayment(true);
      setPaymentError(null);

      const verifyRes = await parentApi.verifyPayment(payload);

      if (!verifyRes.success || !verifyRes.data) {
        throw new Error(verifyRes.message || 'Payment verification failed on the server.');
      }

      const { payment, invoice } = verifyRes.data;

      // Close Checkout Modal
      setPayingInvoice(null);
      setProcessingPayment(false);

      // Refresh Data
      await fetchFeeData();
      await fetchPaymentHistory();

      // Directly open official receipt modal
      setViewingReceiptPayment({
        payment: {
          receiptNumber: payment.receiptNumber,
          paymentDate: payment.paymentDate,
          paymentMethod: payment.paymentMethod,
          amount: payment.amount,
          transactionReference: payment.transactionReference,
          status: payment.status,
          recordedByName: payment.recordedByName,
          remarks: payment.remarks,
          balanceAfter: payment.balanceAfter,
          invoiceNumber: payment.invoiceNumber,
          installmentName: invoice.installmentName,
          studentName: payment.studentName,
          studentAdmissionNumber: payment.studentAdmissionNumber,
          className: payment.className,
          section: payment.section,
          academicYear: payment.academicYear,
        },
        invoice,
      });
    } catch (err: any) {
      setPaymentError(err?.message || 'Server verification failed.');
      setProcessingPayment(false);
    }
  };

  const formatCurrency = (val: number = 0) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return { bg: '#DCFCE7', text: '#16A34A', label: 'PAID' };
      case 'PARTIAL':
        return { bg: '#FEF3C7', text: '#D97706', label: 'PARTIAL' };
      case 'OVERDUE':
        return { bg: '#FEE2E2', text: '#DC2626', label: 'OVERDUE' };
      case 'UNPAID':
      default:
        return { bg: '#EEF3F8', text: '#20354A', label: 'UNPAID' };
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Find currently selected child profile object
  const currentChildProfile = useMemo(() => {
    if (selectedChildId === 'ALL') return null;
    return children.find((c) => c.id === selectedChildId) || null;
  }, [children, selectedChildId]);

  // Assignments matching current view
  const displayAssignments = useMemo(() => {
    if (selectedChildId !== 'ALL') {
      const match = assignments.find((a) => a.studentId === selectedChildId);
      if (match) return [match];
      return assignment ? [assignment] : [];
    }
    if (assignments.length > 0) return assignments;
    return assignment ? [assignment] : [];
  }, [assignments, assignment, selectedChildId]);

  // Flattened fee categories breakdown from all invoices
  const flattenedFeeBreakdown = useMemo(() => {
    const list: Array<{
      categoryName: string;
      description: string;
      amount: number;
      dueDate: string;
      paidAmount: number;
      balance: number;
      status: string;
      invoiceNumber: string;
      feeStructureName: string;
      academicYear: string;
      className: string;
      section: string;
      studentName: string;
      studentAdmissionNumber: string;
      parentInvoice: ParentInvoice;
    }> = [];

    invoices.forEach((inv) => {
      const invTotal = inv.totalPayable || 1;
      const invPaid = inv.paidAmount || 0;

      const itemsToUse =
        inv.items && inv.items.length > 0
          ? inv.items
          : [
              {
                categoryName: inv.installmentName || 'Tuition Fee',
                amount: inv.totalPayable,
                description: 'Academic Tuition & Curriculum Fee',
              },
            ];

      itemsToUse.forEach((item) => {
        // Apportion paid amount proportionately to item share of invoice
        const itemShare = item.amount / invTotal;
        const itemPaid = Math.min(item.amount, Math.round(invPaid * itemShare));
        const itemBalance = Math.max(0, item.amount - itemPaid);

        let itemStatus = inv.status;
        if (itemBalance === 0 && item.amount > 0) {
          itemStatus = 'PAID';
        } else if (itemPaid > 0 && itemBalance > 0) {
          itemStatus = 'PARTIAL';
        }

        list.push({
          categoryName: item.categoryName,
          description: item.description || 'Core instructional and curriculum fee',
          amount: item.amount,
          dueDate: inv.dueDate,
          paidAmount: itemPaid,
          balance: itemBalance,
          status: itemStatus,
          invoiceNumber: inv.invoiceNumber,
          feeStructureName: inv.feeStructureName || assignment?.feeStructureName || 'Standard Tuition Fee Plan',
          academicYear: inv.academicYear,
          className: inv.className,
          section: inv.section,
          studentName: inv.studentName,
          studentAdmissionNumber: inv.studentAdmissionNumber,
          parentInvoice: inv,
        });
      });
    });

    return list;
  }, [invoices, assignment]);

  return (
    <ParentLayout pageTitle="Tuition & School Fees">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Top Header Card */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            backgroundColor: '#ffffff',
            padding: '20px 24px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#20354A' }}>
              Tuition & School Fees
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#647F99' }}>
              Review allocated fee structures, track installment due dates, and view verified payment receipts.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={fetchFeeData}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
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
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CASE 1: CHILD NOT OFFICIALLY ENROLLED RESTRICTION STATE                   */}
        {/* ========================================================================= */}
        {!loading && !hasEnrolledChildren && (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '44px 32px',
              textAlign: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            }}
          >
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: '#EEF3F8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
                color: '#20354A',
              }}
            >
              <GraduationCap size={36} />
            </div>

            <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 700, color: '#20354A' }}>
              Student Admission & Enrollment Required
            </h2>
            <p style={{ margin: '0 auto 20px', maxWidth: '580px', fontSize: '0.9rem', color: '#647F99', lineHeight: 1.6 }}>
              School fee schedules, tuition demand vouchers, and installment breakdowns become accessible once your child's registration request is officially verified, approved, and enrolled into classes by school administration.
            </p>

            {registrationRequestsCount > 0 ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  color: '#92400E',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  marginBottom: '24px',
                }}
              >
                <Clock size={16} />
                <span>You currently have {registrationRequestsCount} admission application(s) pending review with school management.</span>
              </div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/parent/children')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#20354A',
                  cursor: 'pointer',
                }}
              >
                View Admission Status
              </button>
              <button
                onClick={() => navigate('/parent/students/add')}
                style={{
                  padding: '10px 22px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#20354A',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <UserPlus size={16} />
                <span>Register Child for Admission</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Multi-Child Selector (when parent has enrolled children) */}
        {!loading && hasEnrolledChildren && children.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              backgroundColor: '#ffffff',
              padding: '12px 18px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
            }}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#647F99' }}>Student:</span>

            {children.length > 1 && (
              <button
                onClick={() => setSelectedChildId('ALL')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: selectedChildId === 'ALL' ? '2px solid #20354A' : '1px solid #CBD5E1',
                  backgroundColor: selectedChildId === 'ALL' ? '#20354A' : '#ffffff',
                  color: selectedChildId === 'ALL' ? '#ffffff' : '#20354A',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                All Children ({children.length})
              </button>
            )}

            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedChildId(c.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: selectedChildId === c.id ? '2px solid #20354A' : '1px solid #CBD5E1',
                  backgroundColor: selectedChildId === c.id ? '#20354A' : '#ffffff',
                  color: selectedChildId === c.id ? '#ffffff' : '#20354A',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <User size={13} />
                <span>{c.fullName}</span>
                <span style={{ opacity: 0.75, fontSize: '0.74rem' }}>({c.grade}-{c.section})</span>
              </button>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CASE 2: ENROLLED BUT NO FEE ASSIGNED STATE                                */}
        {/* ========================================================================= */}
        {!loading && hasEnrolledChildren && displayAssignments.length === 0 && invoices.length === 0 && (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '48px 24px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#647F99',
              }}
            >
              <CreditCard size={30} />
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 700, color: '#20354A' }}>
              No Fees Assigned Yet
            </h3>
            <p style={{ margin: '0 auto 16px', maxWidth: '520px', fontSize: '0.88rem', color: '#647F99', lineHeight: 1.5 }}>
              School administration has not yet configured or allocated a fee structure for{' '}
              <strong>{currentChildProfile ? currentChildProfile.fullName : 'your enrolled student(s)'}</strong>{' '}
              {currentChildProfile ? `(${currentChildProfile.grade}-${currentChildProfile.section}) ` : ''}for the academic year.
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#F8FAFC',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                fontSize: '0.8rem',
                color: '#647F99',
              }}
            >
              <Info size={14} />
              <span>Tuition and fee demand notices will appear here once allocated by the school accounts office.</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FINANCIAL SUMMARY CARDS (Available when assignment or invoices exist)     */}
        {/* ========================================================================= */}
        {!loading && hasEnrolledChildren && (displayAssignments.length > 0 || invoices.length > 0) && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
            }}
          >
            {/* Total Fees */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                padding: '18px 20px',
                border: '1px solid #E2E8F0',
              }}
            >
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#647F99', textTransform: 'uppercase' }}>
                Total Fees
              </span>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#20354A', marginTop: '6px' }}>
                {formatCurrency(summary.totalFees)}
              </div>
              <span style={{ fontSize: '0.76rem', color: '#647F99', marginTop: '2px', display: 'block' }}>
                {invoices.length > 0 ? `Across ${invoices.length} billing installment(s)` : 'Scheduled fee allocation'}
              </span>
            </div>

            {/* Amount Paid */}
            <div
              style={{
                backgroundColor: '#F0FDF4',
                borderRadius: '10px',
                padding: '18px 20px',
                border: '1px solid #BBF7D0',
              }}
            >
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#16A34A', textTransform: 'uppercase' }}>
                Amount Paid
              </span>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#16A34A', marginTop: '6px' }}>
                {formatCurrency(summary.amountPaid)}
              </div>
              <span style={{ fontSize: '0.76rem', color: '#16A34A', marginTop: '2px', display: 'block' }}>
                Verified payment receipts
              </span>
            </div>

            {/* Outstanding Balance */}
            <div
              style={{
                backgroundColor: '#FEF2F2',
                borderRadius: '10px',
                padding: '18px 20px',
                border: '1px solid #FECACA',
              }}
            >
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>
                Outstanding Balance
              </span>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#DC2626', marginTop: '6px' }}>
                {formatCurrency(summary.outstandingBalance)}
              </div>
              <span style={{ fontSize: '0.76rem', color: '#DC2626', marginTop: '2px', display: 'block' }}>
                {summary.outstandingBalance === 0 ? 'All fees settled' : 'Payable to accounts office'}
              </span>
            </div>

            {/* Overdue Amount */}
            <div
              style={{
                backgroundColor: summary.overdueAmount > 0 ? '#FEF2F2' : '#ffffff',
                borderRadius: '10px',
                padding: '18px 20px',
                border: summary.overdueAmount > 0 ? '1px solid #FCA5A5' : '1px solid #E2E8F0',
              }}
            >
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: summary.overdueAmount > 0 ? '#DC2626' : '#647F99', textTransform: 'uppercase' }}>
                Overdue Amount
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span style={{ fontSize: '1.45rem', fontWeight: 800, color: summary.overdueAmount > 0 ? '#DC2626' : '#20354A' }}>
                  {formatCurrency(summary.overdueAmount)}
                </span>
                {summary.overdueAmount > 0 && <AlertTriangle size={18} style={{ color: '#DC2626' }} />}
              </div>
              <span style={{ fontSize: '0.76rem', color: summary.overdueAmount > 0 ? '#DC2626' : '#647F99', marginTop: '2px', display: 'block' }}>
                {summary.overdueAmount > 0 ? `${summary.overdueInvoicesCount} installment(s) past due date` : 'No overdue payments'}
              </span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ASSIGNED FEE STRUCTURE INFO CARD                                          */}
        {/* ========================================================================= */}
        {!loading && hasEnrolledChildren && displayAssignments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displayAssignments.map((asg) => (
              <div
                key={asg.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  padding: '18px 22px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={16} style={{ color: '#20354A' }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#20354A' }}>
                      {asg.studentName ? `${asg.studentName} • ` : ''}Assigned Fee Structure: {asg.feeStructureName}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#647F99', marginTop: '4px' }}>
                    <span>Academic Year: <strong>{asg.academicYear}</strong></span>
                    <span style={{ margin: '0 8px' }}>•</span>
                    <span>Class: <strong>{asg.className} {asg.section ? `(${asg.section})` : ''}</strong></span>
                    {asg.concessionName && (
                      <>
                        <span style={{ margin: '0 8px' }}>•</span>
                        <span style={{ color: '#16A34A', fontWeight: 600 }}>
                          Scholarship: {asg.concessionName} (-{formatCurrency(asg.concessionAmount)})
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.74rem', color: '#647F99', display: 'block' }}>Net Annual Fee Plan</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#20354A' }}>
                    {formatCurrency(asg.netPayable)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CASE 3: FEE ASSIGNED BUT INVOICE NOT GENERATED YET                        */}
        {/* ========================================================================= */}
        {!loading && hasEnrolledChildren && displayAssignments.length > 0 && invoices.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {displayAssignments.map((asg) => (
              <div
                key={asg.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    borderRadius: '8px',
                    color: '#92400E',
                    fontSize: '0.86rem',
                    marginBottom: '20px',
                  }}
                >
                  <Clock size={18} />
                  <div>
                    <strong>Official Invoices Pending Generation:</strong> The fee structure has been allocated for <strong>{asg.studentName || asg.className}</strong>. Term demand vouchers will be released by school accounts prior to each payment term.
                  </div>
                </div>

                <h4 style={{ margin: '0 0 12px', fontSize: '0.92rem', fontWeight: 700, color: '#20354A' }}>
                  Scheduled Installment Terms — {asg.studentName} ({asg.className})
                </h4>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#647F99' }}>
                      <th style={{ padding: '10px 14px' }}>Term #</th>
                      <th style={{ padding: '10px 14px' }}>Installment Name</th>
                      <th style={{ padding: '10px 14px' }}>Payment Due Date</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Scheduled Amount</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(asg.installments || []).map((inst) => (
                      <tr key={inst.installmentNumber} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{inst.installmentNumber}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#20354A' }}>{inst.name}</td>
                        <td style={{ padding: '12px 14px', color: '#647F99' }}>{inst.dueDate}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#20354A' }}>
                          {formatCurrency(inst.netAmount)}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              backgroundColor: '#EEF3F8',
                              color: '#647F99',
                            }}
                          >
                            SCHEDULED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-NAVIGATION TABS: INVOICES & DUES vs PAYMENT HISTORY & RECEIPTS        */}
        {/* ========================================================================= */}
        {!loading && hasEnrolledChildren && (
          <div
            style={{
              display: 'flex',
              gap: '10px',
              borderBottom: '2px solid #E2E8F0',
              paddingBottom: '2px',
              marginBottom: '16px',
            }}
          >
            <button
              onClick={() => setActiveTab('INVOICES')}
              style={{
                padding: '9px 18px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                backgroundColor: activeTab === 'INVOICES' ? '#20354A' : '#F1F5F9',
                color: activeTab === 'INVOICES' ? '#ffffff' : '#647F99',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: activeTab === 'INVOICES' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <FileText size={15} /> Fee Invoices & Dues ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('PAYMENTS')}
              style={{
                padding: '9px 18px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                backgroundColor: activeTab === 'PAYMENTS' ? '#20354A' : '#F1F5F9',
                color: activeTab === 'PAYMENTS' ? '#ffffff' : '#647F99',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: activeTab === 'PAYMENTS' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Receipt size={15} /> Payment History & Receipts ({parentPayments.length})
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: INVOICES AVAILABLE — DETAILED FEE BREAKDOWN TABLE                  */}
        {/* ========================================================================= */}
        {!loading && hasEnrolledChildren && activeTab === 'INVOICES' && invoices.length > 0 && (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            {/* Table Section Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#20354A' }}>
                  Fee Breakdown & Invoices
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#647F99' }}>
                  Itemized categories, billing dates, and payment status for official vouchers
                </span>
              </div>

              {/* Status and Year Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8rem',
                    backgroundColor: '#ffffff',
                    color: '#20354A',
                  }}
                >
                  <option value="ALL">All Payment Statuses</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="PARTIAL">Partially Paid</option>
                  <option value="PAID">Fully Paid</option>
                  <option value="OVERDUE">Overdue</option>
                </select>

                <select
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8rem',
                    backgroundColor: '#ffffff',
                    color: '#20354A',
                  }}
                >
                  <option value="ALL">All Academic Years</option>
                  {academicYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comprehensive Fee Breakdown Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#647F99' }}>
                    {selectedChildId === 'ALL' && (
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Student</th>
                    )}
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Fee Category</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Description</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Invoice #</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Due Date</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Amount</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Paid Amount</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Balance</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600 }}>Payment Status</th>
                    <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flattenedFeeBreakdown.map((row, idx) => {
                    const badge = getStatusBadge(row.status);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        {selectedChildId === 'ALL' && (
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: '#20354A' }}>
                            {row.studentName}{' '}
                            <span style={{ fontSize: '0.74rem', color: '#647F99' }}>
                              ({row.className}-{row.section})
                            </span>
                          </td>
                        )}
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#20354A' }}>
                          {row.categoryName}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#647F99', fontSize: '0.8rem', maxWidth: '240px' }}>
                          {row.description}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 600, color: '#20354A' }}>
                          {row.invoiceNumber}
                        </td>
                        <td style={{ padding: '12px 14px', color: row.status === 'OVERDUE' ? '#DC2626' : '#647F99', fontWeight: row.status === 'OVERDUE' ? 700 : 400 }}>
                          {row.dueDate}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#20354A' }}>
                          {formatCurrency(row.amount)}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#16A34A' }}>
                          {formatCurrency(row.paidAmount)}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: row.balance > 0 ? '#DC2626' : '#16A34A' }}>
                          {formatCurrency(row.balance)}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: badge.bg,
                              color: badge.text,
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                            {row.parentInvoice.outstandingAmount > 0 && (
                              <button
                                onClick={() => handleOpenPayModal(row.parentInvoice)}
                                title="Pay Fees Online with Razorpay"
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: '4px',
                                  border: 'none',
                                  backgroundColor: '#16A34A',
                                  color: '#ffffff',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  boxShadow: '0 1px 2px rgba(22, 163, 74, 0.25)',
                                }}
                              >
                                <CreditCard size={12} /> Pay Now
                              </button>
                            )}

                            <button
                              onClick={() => setViewingInvoice(row.parentInvoice)}
                              title="View & Print Voucher"
                              style={{
                                padding: '5px 10px',
                                borderRadius: '4px',
                                border: '1px solid #CBD5E1',
                                backgroundColor: '#ffffff',
                                color: '#20354A',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                              }}
                            >
                              <FileText size={12} /> View
                            </button>

                            <button
                              onClick={() => setViewingPaymentHistoryInvoice(row.parentInvoice)}
                              title="Payment History"
                              style={{
                                padding: '5px 10px',
                                borderRadius: '4px',
                                border: '1px solid #CBD5E1',
                                backgroundColor: '#F8FAFC',
                                color: '#647F99',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                              }}
                            >
                              <Receipt size={12} /> History
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PARENT PAYMENT HISTORY & OFFICIAL RECEIPTS SECTION                 */}
        {/* ========================================================================= */}
        {!loading && hasEnrolledChildren && activeTab === 'PAYMENTS' && (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#20354A' }}>
                  Payment History & Official Receipts
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#647F99' }}>
                  Verified digital receipts for all payments made online or at the accounts counter
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8rem',
                    backgroundColor: '#ffffff',
                    color: '#20354A',
                  }}
                >
                  <option value="ALL">All Academic Years</option>
                  {academicYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingPayments ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#647F99' }}>
                <RotateCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                <div>Loading payment history...</div>
              </div>
            ) : parentPayments.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94A3B8' }}>
                <Receipt size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: '#20354A' }}>
                  No Payment Records Found
                </h4>
                <p style={{ margin: 0, fontSize: '0.84rem' }}>
                  Successful tuition fees and payments made for your children will appear here with official printable receipts.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#647F99' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Receipt #</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Invoice #</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Student</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Payment Date</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Method</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Reference #</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Amount Paid</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'center' }}>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parentPayments.map((p) => {
                      const isSuccess = p.status === 'SUCCESS';
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#20354A' }}>
                            {p.receiptNumber}
                          </td>
                          <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#647F99' }}>
                            {p.invoiceNumber}
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: '#20354A' }}>
                            {p.studentName}{' '}
                            <span style={{ fontSize: '0.74rem', color: '#647F99' }}>
                              ({p.className}-{p.section || 'A'})
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#647F99' }}>{p.paymentDate}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                backgroundColor: p.isOnline ? '#DCFCE7' : '#EEF3F8',
                                color: p.isOnline ? '#15803D' : '#20354A',
                              }}
                            >
                              {p.isOnline ? `ONLINE (${p.paymentMethod})` : p.paymentMethod}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#647F99' }}>
                            {p.transactionReference || 'Counter Record'}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#16A34A', fontSize: '0.92rem' }}>
                            {formatCurrency(p.amount)}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '8px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                backgroundColor: isSuccess ? '#DCFCE7' : '#FEE2E2',
                                color: isSuccess ? '#16A34A' : '#DC2626',
                              }}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            {isSuccess ? (
                              <button
                                onClick={() => {
                                  const matchingInvoice = invoices.find((inv) => inv.id === p.invoiceId);
                                  setViewingReceiptPayment({
                                    payment: {
                                      receiptNumber: p.receiptNumber,
                                      paymentDate: p.paymentDate,
                                      paymentMethod: p.paymentMethod,
                                      amount: p.amount,
                                      transactionReference: p.transactionReference,
                                      status: p.status,
                                      recordedByName: p.recordedByName,
                                      remarks: p.remarks,
                                      balanceAfter: p.balanceAfter,
                                      invoiceNumber: p.invoiceNumber,
                                      installmentName: matchingInvoice?.installmentName || 'Tuition Fee Installment',
                                      studentName: p.studentName,
                                      studentAdmissionNumber: p.studentAdmissionNumber,
                                      className: p.className,
                                      section: p.section,
                                      academicYear: p.academicYear,
                                    },
                                    invoice: matchingInvoice || {
                                      id: p.invoiceId,
                                      invoiceNumber: p.invoiceNumber,
                                      studentId: p.studentId,
                                      studentName: p.studentName,
                                      studentAdmissionNumber: p.studentAdmissionNumber,
                                      className: p.className,
                                      section: p.section,
                                      academicYear: p.academicYear,
                                      installmentNumber: 1,
                                      installmentName: 'Fee Installment',
                                      items: [],
                                      subtotal: p.amount,
                                      concessionAmount: 0,
                                      lateFeeAmount: 0,
                                      totalPayable: p.amount,
                                      paidAmount: p.amount,
                                      outstandingAmount: 0,
                                      issueDate: p.paymentDate,
                                      dueDate: p.paymentDate,
                                      status: 'PAID',
                                    },
                                  });
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  border: '1px solid #CBD5E1',
                                  backgroundColor: '#ffffff',
                                  fontSize: '0.76rem',
                                  fontWeight: 600,
                                  color: '#20354A',
                                  cursor: 'pointer',
                                }}
                                title="View official printable receipt"
                              >
                                <Receipt size={12} /> Receipt
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>N/A (Reversed)</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Loading Spinner State */}
        {loading && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#647F99' }}>
            <RotateCw className="animate-spin" size={28} style={{ margin: '0 auto 10px' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading verified fee accounts data...</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              color: '#991B1B',
              fontSize: '0.88rem',
            }}
          >
            {error}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW INVOICE VOUCHER MODAL (Printable Demand Voucher)                     */}
        {/* ========================================================================= */}
        {viewingInvoice && (
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
                maxWidth: '680px',
                width: '100%',
                maxHeight: '92vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
              }}
            >
              {/* Top Modal Controls */}
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
                  Official School Fee Demand Voucher
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handlePrint}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#ffffff',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#20354A',
                      cursor: 'pointer',
                    }}
                  >
                    <Printer size={14} /> Print Voucher
                  </button>
                  <button
                    onClick={() => setViewingInvoice(null)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#647F99' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Printable Voucher Body */}
              <div id="parentPrintableVoucher" style={{ padding: '32px 36px', color: '#20354A' }}>
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
                    <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#20354A' }}>
                      EDUHUB INTERNATIONAL SCHOOL
                    </h2>
                    <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#647F99' }}>
                      Affiliated to CBSE • Excellence in Education
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#94A3B8' }}>
                      Fee Voucher & Statement of Account
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

                {/* Student Info Card */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
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
                    {viewingInvoice.feeStructureName && (
                      <span style={{ color: '#647F99', marginLeft: '6px' }}>({viewingInvoice.feeStructureName})</span>
                    )}
                  </div>
                </div>

                {/* Line Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #CBD5E1', backgroundColor: '#EEF3F8' }}>
                      <th style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#20354A' }}>Fee Category</th>
                      <th style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#20354A' }}>Description</th>
                      <th style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#20354A', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewingInvoice.items || []).map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 12px', fontSize: '0.84rem', fontWeight: 600 }}>{item.categoryName}</td>
                        <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#647F99' }}>
                          {item.description || 'Instructional and facility fee'}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '0.84rem', fontWeight: 600, textAlign: 'right' }}>
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Breakdown */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                  <div style={{ width: '280px', fontSize: '0.84rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#647F99' }}>
                      <span>Subtotal:</span>
                      <span>{formatCurrency(viewingInvoice.subtotal)}</span>
                    </div>
                    {viewingInvoice.concessionAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#16A34A' }}>
                        <span>Concession / Scholarship:</span>
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
                      <span>Outstanding Balance:</span>
                      <span>{formatCurrency(viewingInvoice.outstandingAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Note */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    borderTop: '1px dashed #CBD5E1',
                    paddingTop: '20px',
                  }}
                >
                  <div style={{ fontSize: '0.74rem', color: '#94A3B8', maxWidth: '340px' }}>
                    * Payments can be remitted in school accounts counter via cash, cheque, bank transfer, or UPI. Keep this demand voucher for personal records.
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '120px', borderBottom: '1px solid #20354A', marginBottom: '4px' }} />
                    <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#20354A' }}>
                      Accounts Office
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PAYMENT HISTORY MODAL                                                     */}
        {/* ========================================================================= */}
        {viewingPaymentHistoryInvoice && (
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
                maxWidth: '620px',
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
                    Payment History: {viewingPaymentHistoryInvoice.invoiceNumber}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#647F99' }}>
                    {viewingPaymentHistoryInvoice.studentName} • {viewingPaymentHistoryInvoice.installmentName}
                  </span>
                </div>
                <button
                  onClick={() => setViewingPaymentHistoryInvoice(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#647F99' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: '24px' }}>
                {/* Financial Summary */}
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
                    <strong style={{ fontSize: '0.92rem', color: '#20354A' }}>
                      {formatCurrency(viewingPaymentHistoryInvoice.totalPayable)}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#647F99', display: 'block', fontSize: '0.74rem' }}>Paid Amount</span>
                    <strong style={{ fontSize: '0.92rem', color: '#16A34A' }}>
                      {formatCurrency(viewingPaymentHistoryInvoice.paidAmount)}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#647F99', display: 'block', fontSize: '0.74rem' }}>Balance Due</span>
                    <strong style={{ fontSize: '0.92rem', color: viewingPaymentHistoryInvoice.outstandingAmount > 0 ? '#DC2626' : '#16A34A' }}>
                      {formatCurrency(viewingPaymentHistoryInvoice.outstandingAmount)}
                    </strong>
                  </div>
                </div>

                {!viewingPaymentHistoryInvoice.payments || viewingPaymentHistoryInvoice.payments.length === 0 ? (
                  <div style={{ padding: '36px 16px', textAlign: 'center', color: '#94A3B8' }}>
                    <Receipt size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>No payments recorded yet</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem' }}>
                      Payments processed against this voucher will appear with official receipt details.
                    </p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#647F99' }}>
                        <th style={{ padding: '8px 12px' }}>Receipt #</th>
                        <th style={{ padding: '8px 12px' }}>Payment Date</th>
                        <th style={{ padding: '8px 12px' }}>Method</th>
                        <th style={{ padding: '8px 12px' }}>Reference #</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Amount Paid</th>
                        <th style={{ padding: '8px 12px' }}>Status</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingPaymentHistoryInvoice.payments.map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
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
                          <td style={{ padding: '10px 12px', color: '#647F99', fontSize: '0.76rem' }}>
                            {p.transactionReference || '-'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#16A34A' }}>
                            {formatCurrency(p.amount)}
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
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <button
                              onClick={() => setViewingReceiptPayment({ payment: p, invoice: viewingPaymentHistoryInvoice })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid #CBD5E1',
                                backgroundColor: '#ffffff',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                color: '#20354A',
                                cursor: 'pointer',
                              }}
                              title="View and print official fee receipt"
                            >
                              <Receipt size={12} /> Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button
                    onClick={() => setViewingPaymentHistoryInvoice(null)}
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
        {/* PAY ONLINE MODAL (RAZORPAY GATEWAY CHECKOUT)                              */}
        {/* ========================================================================= */}
        {payingInvoice && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1050,
              padding: '16px',
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                maxWidth: '560px',
                width: '100%',
                maxHeight: '92vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#DCFCE7',
                      color: '#16A34A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#20354A' }}>
                      Online Fee Payment
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: '#647F99' }}>
                      Secure checkout powered by Razorpay
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setPayingInvoice(null);
                    setPaymentError(null);
                  }}
                  disabled={processingPayment}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#647F99' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px' }}>
                {/* Error Banner */}
                {paymentError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 16px',
                      backgroundColor: '#FEF2F2',
                      borderRadius: '8px',
                      border: '1px solid #FECACA',
                      color: '#DC2626',
                      fontSize: '0.84rem',
                      marginBottom: '16px',
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* Student & Invoice Summary Card */}
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    border: '1px solid #E2E8F0',
                    marginBottom: '18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#647F99', textTransform: 'uppercase' }}>
                        Student
                      </span>
                      <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#20354A' }}>
                        {payingInvoice.studentName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#647F99' }}>
                        Class: {payingInvoice.className} ({payingInvoice.section || 'A'}) • Adm: {payingInvoice.studentAdmissionNumber}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#647F99', textTransform: 'uppercase' }}>
                        Voucher
                      </span>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, fontFamily: 'monospace', color: '#20354A' }}>
                        {payingInvoice.invoiceNumber}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#647F99' }}>
                        {payingInvoice.installmentName}
                      </div>
                    </div>
                  </div>

                  {/* Balance Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      borderTop: '1px solid #E2E8F0',
                      paddingTop: '10px',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#647F99', display: 'block' }}>Total Fee</span>
                      <strong style={{ fontSize: '0.88rem', color: '#20354A' }}>
                        {formatCurrency(payingInvoice.totalPayable)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#647F99', display: 'block' }}>Paid Amount</span>
                      <strong style={{ fontSize: '0.88rem', color: '#16A34A' }}>
                        {formatCurrency(payingInvoice.paidAmount)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#647F99', display: 'block' }}>Outstanding Due</span>
                      <strong style={{ fontSize: '0.92rem', color: '#DC2626' }}>
                        {formatCurrency(payingInvoice.outstandingAmount)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Amount Selection */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#20354A', marginBottom: '8px' }}>
                    Select Payment Amount:
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
                    {/* Option A: Full Payment */}
                    <div
                      onClick={() => {
                        setPaymentMode('FULL');
                        setCustomPaymentAmount(String(payingInvoice.outstandingAmount));
                      }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: paymentMode === 'FULL' ? '2px solid #16A34A' : '1px solid #CBD5E1',
                        backgroundColor: paymentMode === 'FULL' ? '#F0FDF4' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="radio"
                          name="paymentMode"
                          checked={paymentMode === 'FULL'}
                          onChange={() => {}}
                        />
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#20354A' }}>
                          Full Outstanding
                        </span>
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16A34A', marginTop: '6px', marginLeft: '24px' }}>
                        {formatCurrency(payingInvoice.outstandingAmount)}
                      </div>
                    </div>

                    {/* Option B: Partial Payment */}
                    <div
                      onClick={() => setPaymentMode('PARTIAL')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: paymentMode === 'PARTIAL' ? '2px solid #0284C7' : '1px solid #CBD5E1',
                        backgroundColor: paymentMode === 'PARTIAL' ? '#F0F9FF' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="radio"
                          name="paymentMode"
                          checked={paymentMode === 'PARTIAL'}
                          onChange={() => {}}
                        />
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#20354A' }}>
                          Custom Partial
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#647F99', marginTop: '6px', marginLeft: '24px' }}>
                        Pay partial installment
                      </div>
                    </div>
                  </div>

                  {paymentMode === 'PARTIAL' && (
                    <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#647F99', marginBottom: '6px' }}>
                        Enter Amount to Pay (₹):
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#647F99' }}>
                          ₹
                        </span>
                        <input
                          type="number"
                          min="1"
                          max={payingInvoice.outstandingAmount}
                          value={customPaymentAmount}
                          onChange={(e) => setCustomPaymentAmount(e.target.value)}
                          placeholder="e.g. 2000"
                          style={{
                            width: '100%',
                            padding: '10px 12px 10px 28px',
                            borderRadius: '6px',
                            border: paymentValidationError ? '1px solid #DC2626' : '1px solid #CBD5E1',
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            color: '#20354A',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      {paymentValidationError && (
                        <div style={{ color: '#DC2626', fontSize: '0.76rem', marginTop: '6px', fontWeight: 600 }}>
                          {paymentValidationError}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Gateway Payment Methods Selection */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#20354A', marginBottom: '8px' }}>
                    Select Payment Method:
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {/* UPI */}
                    <div
                      onClick={() => setSelectedGatewayMethod('UPI')}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: selectedGatewayMethod === 'UPI' ? '2px solid #16A34A' : '1px solid #E2E8F0',
                        backgroundColor: selectedGatewayMethod === 'UPI' ? '#F0FDF4' : '#ffffff',
                        textAlign: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Smartphone size={20} color={selectedGatewayMethod === 'UPI' ? '#16A34A' : '#647F99'} style={{ margin: '0 auto 4px' }} />
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#20354A' }}>UPI / QR</div>
                      <div style={{ fontSize: '0.68rem', color: '#647F99' }}>GPay, PhonePe, Paytm</div>
                    </div>

                    {/* Cards */}
                    <div
                      onClick={() => setSelectedGatewayMethod('CARD')}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: selectedGatewayMethod === 'CARD' ? '2px solid #16A34A' : '1px solid #E2E8F0',
                        backgroundColor: selectedGatewayMethod === 'CARD' ? '#F0FDF4' : '#ffffff',
                        textAlign: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <CreditCard size={20} color={selectedGatewayMethod === 'CARD' ? '#16A34A' : '#647F99'} style={{ margin: '0 auto 4px' }} />
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#20354A' }}>Cards</div>
                      <div style={{ fontSize: '0.68rem', color: '#647F99' }}>Visa, MasterCard, RuPay</div>
                    </div>

                    {/* Net Banking */}
                    <div
                      onClick={() => setSelectedGatewayMethod('NET_BANKING')}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: selectedGatewayMethod === 'NET_BANKING' ? '2px solid #16A34A' : '1px solid #E2E8F0',
                        backgroundColor: selectedGatewayMethod === 'NET_BANKING' ? '#F0FDF4' : '#ffffff',
                        textAlign: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Landmark size={20} color={selectedGatewayMethod === 'NET_BANKING' ? '#16A34A' : '#647F99'} style={{ margin: '0 auto 4px' }} />
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#20354A' }}>Net Banking</div>
                      <div style={{ fontSize: '0.68rem', color: '#647F99' }}>All Major Banks</div>
                    </div>
                  </div>
                </div>

                {/* Security Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.74rem',
                    color: '#647F99',
                    marginBottom: '20px',
                  }}
                >
                  <ShieldCheck size={16} color="#16A34A" />
                  <span>256-bit encrypted checkout via Razorpay. Offline cash payments are not accepted online.</span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    onClick={() => {
                      setPayingInvoice(null);
                      setPaymentError(null);
                    }}
                    disabled={processingPayment}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#ffffff',
                      color: '#20354A',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleInitiateOnlinePayment}
                    disabled={processingPayment || !!paymentValidationError}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: paymentValidationError ? '#94A3B8' : '#16A34A',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      cursor: paymentValidationError ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)',
                    }}
                  >
                    {processingPayment ? (
                      <>
                        <RotateCw size={16} className="animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        <Lock size={15} /> Pay {formatCurrency(effectivePaymentAmount)}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PAYMENT RECEIPT MODAL                                                     */}
        {/* ========================================================================= */}
        {viewingReceiptPayment && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1100,
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
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 24px',
                  borderBottom: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={18} color="#16A34A" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#20354A' }}>
                    Official Fee Payment Receipt
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handlePrint}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#ffffff',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#20354A',
                      cursor: 'pointer',
                    }}
                  >
                    <Printer size={14} /> Print Receipt
                  </button>
                  <button
                    onClick={() => setViewingReceiptPayment(null)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#647F99' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Printable Receipt Content */}
              <div id="parentPrintableReceipt" style={{ padding: '32px 36px', color: '#20354A' }}>
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
                    <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#20354A' }}>
                      EDUHUB INTERNATIONAL SCHOOL
                    </h2>
                    <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#647F99' }}>
                      Affiliated to CBSE • Excellence in Education
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#94A3B8' }}>
                      Official Fee Payment Receipt • Student Copy
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        color: '#16A34A',
                        fontFamily: 'monospace',
                      }}
                    >
                      {viewingReceiptPayment.payment.receiptNumber}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#647F99', marginTop: '4px' }}>
                      Date: {viewingReceiptPayment.payment.paymentDate}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#647F99' }}>
                      Invoice: {viewingReceiptPayment.invoice.invoiceNumber}
                    </div>
                  </div>
                </div>

                {/* Student Info Card */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
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
                    <strong>{viewingReceiptPayment.payment.studentName || viewingReceiptPayment.invoice.studentName}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#647F99' }}>Admission No: </span>
                    <strong style={{ fontFamily: 'monospace' }}>
                      {viewingReceiptPayment.payment.studentAdmissionNumber || viewingReceiptPayment.invoice.studentAdmissionNumber}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#647F99' }}>Class / Section: </span>
                    <strong>
                      {viewingReceiptPayment.payment.className || viewingReceiptPayment.invoice.className}{' '}
                      {(viewingReceiptPayment.payment.section || viewingReceiptPayment.invoice.section)
                        ? `(${viewingReceiptPayment.payment.section || viewingReceiptPayment.invoice.section})`
                        : ''}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#647F99' }}>Academic Year: </span>
                    <strong>
                      {viewingReceiptPayment.payment.academicYear || viewingReceiptPayment.invoice.academicYear}
                    </strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#647F99' }}>Installment: </span>
                    <strong>{viewingReceiptPayment.invoice.installmentName}</strong>
                    {viewingReceiptPayment.invoice.feeStructureName && (
                      <span style={{ color: '#647F99', marginLeft: '6px' }}>
                        ({viewingReceiptPayment.invoice.feeStructureName})
                      </span>
                    )}
                  </div>
                </div>

                {/* Payment Breakdown Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '20px', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#EEF3F8', borderBottom: '1px solid #CBD5E1' }}>
                      <th style={{ padding: '10px 14px' }}>Description / Particulars</th>
                      <th style={{ padding: '10px 14px' }}>Payment Mode</th>
                      <th style={{ padding: '10px 14px' }}>Ref / Cheque #</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '14px', fontWeight: 600 }}>
                        Tuition & Educational Fee Installment
                        <span style={{ display: 'block', fontSize: '0.74rem', color: '#647F99', fontWeight: 'normal' }}>
                          Ref: {viewingReceiptPayment.invoice.invoiceNumber}
                        </span>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#EEF3F8',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: '#20354A',
                          }}
                        >
                          {viewingReceiptPayment.payment.paymentMethod}
                        </span>
                      </td>
                      <td style={{ padding: '14px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#647F99' }}>
                        {viewingReceiptPayment.payment.transactionReference || 'Counter Payment'}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: 800, fontSize: '1rem', color: '#16A34A' }}>
                        {formatCurrency(viewingReceiptPayment.payment.amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Financial Summary */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                  <div style={{ width: '300px', fontSize: '0.84rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#647F99' }}>
                      <span>Invoice Total:</span>
                      <span>{formatCurrency(viewingReceiptPayment.invoice.totalPayable)}</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderTop: '1px solid #CBD5E1',
                        borderBottom: '1px solid #CBD5E1',
                        fontWeight: 800,
                        fontSize: '0.96rem',
                        color: '#16A34A',
                      }}
                    >
                      <span>Amount Received:</span>
                      <span>{formatCurrency(viewingReceiptPayment.payment.amount)}</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        color:
                          (viewingReceiptPayment.payment.balanceAfter ?? viewingReceiptPayment.invoice.outstandingAmount) > 0
                            ? '#DC2626'
                            : '#16A34A',
                      }}
                    >
                      <span>Balance Outstanding:</span>
                      <span>
                        {formatCurrency(
                          viewingReceiptPayment.payment.balanceAfter ?? viewingReceiptPayment.invoice.outstandingAmount
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Notes & Signatures */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    borderTop: '1px dashed #CBD5E1',
                    paddingTop: '20px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.74rem', color: '#16A34A', fontWeight: 700 }}>
                      ✓ System-authenticated digital fee receipt.
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#647F99', marginTop: '2px' }}>
                      Cashier: {viewingReceiptPayment.payment.recordedByName || 'School Accounts Counter'}
                    </div>
                    {viewingReceiptPayment.payment.remarks && (
                      <div style={{ fontSize: '0.74rem', color: '#20354A', marginTop: '3px', fontStyle: 'italic' }}>
                        Remarks: {viewingReceiptPayment.payment.remarks}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '130px', borderBottom: '1px solid #20354A', marginBottom: '4px' }} />
                    <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#20354A' }}>
                      Accounts Officer
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ParentLayout>
  );
};
