import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Search,
  RotateCw,
  Plus,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  FileText,
  Ban,
  Receipt,
} from 'lucide-react';
import { adminFeeApi } from '../../../api/adminFeeApi';
import { adminApi } from '../../../api/adminApi';
import {
  StudentFeeAssignment,
  FeeStructure,
  FeeConcession,
  AssignmentInstallmentStatus,
} from '../../../types/adminFee.types';

interface FeeAssignmentTabProps {
  academicYear: string;
}

export const FeeAssignmentTab: React.FC<FeeAssignmentTabProps> = ({ academicYear }) => {
  const [assignments, setAssignments] = useState<StudentFeeAssignment[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [concessions, setConcessions] = useState<FeeConcession[]>([]);
  const [classList, setClassList] = useState<string[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedStructureFilter, setSelectedStructureFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [viewingAssignment, setViewingAssignment] = useState<StudentFeeAssignment | null>(null);
  const [cancellingAssignment, setCancellingAssignment] = useState<StudentFeeAssignment | null>(null);
  const [quickInvoiceAssignment, setQuickInvoiceAssignment] = useState<StudentFeeAssignment | null>(null);

  // Assign Form state
  const [assignFormClass, setAssignFormClass] = useState<string>('');
  const [assignFormStructureId, setAssignFormStructureId] = useState<string>('');
  const [assignFormConcessionId, setAssignFormConcessionId] = useState<string>('');
  const [assignFormConcessionReason, setAssignFormConcessionReason] = useState<string>('');
  const [assignAllInClass, setAssignAllInClass] = useState<boolean>(true);
  const [targetStudentIds, setTargetStudentIds] = useState<string[]>([]);
  const [savingAssign, setSavingAssign] = useState<boolean>(false);
  const [assignModalError, setAssignModalError] = useState<string | null>(null);
  const [assignModalSuccess, setAssignModalSuccess] = useState<string | null>(null);

  // Quick Invoice Form State
  const [quickInvoiceInstallment, setQuickInvoiceInstallment] = useState<number>(1);
  const [quickInvoiceDueDate, setQuickInvoiceDueDate] = useState<string>('');
  const [generatingInvoice, setGeneratingInvoice] = useState<boolean>(false);
  const [quickInvoiceError, setQuickInvoiceError] = useState<string | null>(null);
  const [quickInvoiceSuccess, setQuickInvoiceSuccess] = useState<string | null>(null);

  // Cancel Assignment State
  const [cancellingLoading, setCancellingLoading] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchDependencies = async () => {
    try {
      const [classRes, structRes, concRes] = await Promise.all([
        adminApi.getClasses(),
        adminFeeApi.getStructures({
          academicYear: academicYear !== 'ALL' ? academicYear : undefined,
          status: 'ACTIVE',
        }),
        adminFeeApi.getConcessions('ACTIVE'),
      ]);

      if (classRes.success && classRes.data) {
        const uniqueClasses = Array.from(new Set(classRes.data.map((c: any) => c.name)));
        setClassList(uniqueClasses);
      }

      if (structRes.success && structRes.data) {
        setStructures(structRes.data);
      }

      if (concRes.success && concRes.data) {
        setConcessions(concRes.data);
      }
    } catch (err) {
      console.error('Failed to load classes or structures:', err);
    }
  };

  const fetchAssignmentsAndStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const [assignRes, stuRes] = await Promise.all([
        adminFeeApi.getAssignments({
          academicYear: academicYear !== 'ALL' ? academicYear : undefined,
          className: selectedClass !== 'ALL' ? selectedClass : undefined,
          section: selectedSection !== 'ALL' ? selectedSection : undefined,
          feeStructureId: selectedStructureFilter !== 'ALL' ? selectedStructureFilter : undefined,
          status: selectedStatusFilter !== 'ALL' ? selectedStatusFilter : undefined,
          search: searchTerm.trim() || undefined,
        }),
        adminApi.getStudents({
          academicYear: academicYear !== 'ALL' ? academicYear : undefined,
          grade: selectedClass !== 'ALL' ? selectedClass : undefined,
          section: selectedSection !== 'ALL' ? selectedSection : undefined,
          status: 'ACTIVE',
        }),
      ]);

      if (assignRes.success && assignRes.data) {
        setAssignments(assignRes.data);
      }

      if (stuRes.success && stuRes.data) {
        setEnrolledStudents(stuRes.data.students || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load student fee assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, [academicYear]);

  useEffect(() => {
    fetchAssignmentsAndStudents();
  }, [academicYear, selectedClass, selectedSection, selectedStructureFilter, selectedStatusFilter]);

  const formatCurrency = (val: number = 0) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const assignedStudentIds = useMemo(() => {
    return new Set(
      assignments.filter((a) => a.status === 'ACTIVE').map((a) => a.studentId)
    );
  }, [assignments]);

  // Open Assign Modal
  const handleOpenAssignModal = () => {
    const defaultClass = selectedClass !== 'ALL' ? selectedClass : (classList[0] || '');
    setAssignFormClass(defaultClass);

    const relevantStructures = structures.filter(
      (s) => !defaultClass || s.className?.toLowerCase() === defaultClass.toLowerCase()
    );
    setAssignFormStructureId(relevantStructures[0]?.id || '');
    setAssignFormConcessionId('');
    setAssignFormConcessionReason('');
    setTargetStudentIds([]);
    setAssignAllInClass(true);
    setAssignModalError(null);
    setAssignModalSuccess(null);
    setIsAssignModalOpen(true);
  };

  // Open Assign Modal for specific student
  const handleOpenAssignModalForStudent = (student: any) => {
    if (!student) return;
    const studentClass = student.grade || student.className || '';
    setAssignFormClass(studentClass);
    const relevantStructures = structures.filter(
      (s) => !studentClass || s.className?.toLowerCase() === studentClass.toLowerCase()
    );
    setAssignFormStructureId(relevantStructures[0]?.id || '');
    setAssignFormConcessionId('');
    setAssignFormConcessionReason('');
    const sId = (student.id || student._id)?.toString();
    setTargetStudentIds(sId ? [sId] : []);
    setAssignAllInClass(false);
    setAssignModalError(null);
    setAssignModalSuccess(null);
    setIsAssignModalOpen(true);
  };

  // When class changes inside the modal
  const handleAssignClassChange = (newClass: string) => {
    setAssignFormClass(newClass);
    const relevant = structures.filter((s) => s.className?.toLowerCase() === newClass.toLowerCase());
    setAssignFormStructureId(relevant[0]?.id || '');
    setTargetStudentIds([]);
  };

  // Toggle student selection checkbox
  const handleToggleStudentSelection = (id: string) => {
    if (targetStudentIds.includes(id)) {
      setTargetStudentIds(targetStudentIds.filter((sId) => sId !== id));
    } else {
      setTargetStudentIds([...targetStudentIds, id]);
    }
  };

  // Selected structure in modal
  const modalSelectedStructure = useMemo(() => {
    return structures.find((s) => s.id === assignFormStructureId) || null;
  }, [structures, assignFormStructureId]);

  // Selected concession in modal
  const modalSelectedConcession = useMemo(() => {
    return concessions.find((c) => c.id === assignFormConcessionId) || null;
  }, [concessions, assignFormConcessionId]);

  // Students eligible for modal assignment
  const modalEligibleStudents = useMemo(() => {
    if (!assignFormClass) return enrolledStudents;
    return enrolledStudents.filter(
      (s) => (s.grade || s.className)?.toLowerCase() === assignFormClass.toLowerCase()
    );
  }, [enrolledStudents, assignFormClass]);

  // Modal Live Preview Calculations
  const previewFinancials = useMemo(() => {
    if (!modalSelectedStructure) {
      return { base: 0, concession: 0, net: 0, count: 0, totalPayableBatch: 0, installments: [] };
    }

    const base = modalSelectedStructure.totalAmount || 0;
    let concessionAmount = 0;
    if (modalSelectedConcession) {
      if (modalSelectedConcession.discountType === 'PERCENTAGE') {
        concessionAmount = Math.round((base * modalSelectedConcession.value) / 100);
      } else {
        concessionAmount = Math.min(base, modalSelectedConcession.value);
      }
    }
    const net = Math.max(0, base - concessionAmount);

    let count = 0;
    if (assignAllInClass) {
      count = modalEligibleStudents.filter((s) => !assignedStudentIds.has(s.id || s._id)).length;
    } else {
      count = targetStudentIds.length;
    }

    const totalPayableBatch = net * count;

    // Breakdown installments
    const installments = (modalSelectedStructure.installments || []).map((inst, index) => {
      const instRatio = base > 0 ? inst.amount / base : 1 / (modalSelectedStructure.installments?.length || 1);
      const instConcession = Math.round(concessionAmount * instRatio);
      const instNet = Math.max(0, inst.amount - instConcession);
      return {
        number: inst.installmentNumber || index + 1,
        name: inst.name,
        dueDate: inst.dueDate,
        base: inst.amount,
        concession: instConcession,
        net: instNet,
      };
    });

    return { base, concession: concessionAmount, net, count, totalPayableBatch, installments };
  }, [modalSelectedStructure, modalSelectedConcession, assignAllInClass, modalEligibleStudents, targetStudentIds, assignedStudentIds]);

  // Submit Assign Form
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignFormStructureId) {
      setAssignModalError('Please select a fee structure to assign.');
      return;
    }

    const structure = structures.find((s) => s.id === assignFormStructureId);
    if (!structure) {
      setAssignModalError('Selected fee structure not found.');
      return;
    }

    let finalStudentIds: string[] | undefined = undefined;
    if (!assignAllInClass) {
      if (targetStudentIds.length === 0) {
        setAssignModalError('Please select at least one student or choose "Assign to all in class".');
        return;
      }
      finalStudentIds = targetStudentIds;
    }

    try {
      setSavingAssign(true);
      setAssignModalError(null);

      const res = await adminFeeApi.assignFees({
        feeStructureId: assignFormStructureId,
        academicYear: academicYear !== 'ALL' ? academicYear : structure.academicYear,
        className: structure.className,
        studentIds: finalStudentIds,
        concessionId: assignFormConcessionId || undefined,
        concessionReason: assignFormConcessionReason.trim() || undefined,
        generateInvoices: true,
      });

      if (res.success) {
        setAssignModalSuccess(
          `Successfully assigned fee plan and generated invoices for ${res.data.assignedCount} student(s). (${res.data.skippedCount} already assigned or skipped)`
        );
        setTimeout(() => {
          setIsAssignModalOpen(false);
          fetchAssignmentsAndStudents();
        }, 1400);
      }
    } catch (err: any) {
      setAssignModalError(err?.message || 'Failed to assign fee structure.');
    } finally {
      setSavingAssign(false);
    }
  };

  // Open Quick Invoice Modal
  const handleOpenQuickInvoice = (asgn: StudentFeeAssignment) => {
    setQuickInvoiceAssignment(asgn);
    // Find next unpaid installment
    const unpaid = asgn.installments.find((i) => i.status !== 'PAID');
    const nextInstNumber = unpaid ? unpaid.installmentNumber : 1;
    setQuickInvoiceInstallment(nextInstNumber);
    setQuickInvoiceDueDate(unpaid?.dueDate || new Date().toISOString().slice(0, 10));
    setQuickInvoiceError(null);
    setQuickInvoiceSuccess(null);
  };

  // Submit Quick Invoice Generation
  const handleQuickInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInvoiceAssignment) return;

    try {
      setGeneratingInvoice(true);
      setQuickInvoiceError(null);

      const res = await adminFeeApi.generateInvoices({
        academicYear: quickInvoiceAssignment.academicYear,
        className: quickInvoiceAssignment.className,
        section: quickInvoiceAssignment.section || undefined,
        installmentNumber: Number(quickInvoiceInstallment),
        studentId: quickInvoiceAssignment.studentId,
        dueDate: quickInvoiceDueDate || undefined,
      });

      if (res.success) {
        setQuickInvoiceSuccess(`Invoice generated successfully! (${res.data.generatedCount} invoice issued)`);
        setTimeout(() => {
          setQuickInvoiceAssignment(null);
          fetchAssignmentsAndStudents();
        }, 1200);
      }
    } catch (err: any) {
      setQuickInvoiceError(err?.message || 'Failed to generate invoice for student.');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  // Confirm Cancel Assignment
  const handleConfirmCancelAssignment = async () => {
    if (!cancellingAssignment) return;
    try {
      setCancellingLoading(true);
      setCancelError(null);
      const res = await adminFeeApi.cancelAssignment(cancellingAssignment.id);
      if (res.success) {
        setCancellingAssignment(null);
        fetchAssignmentsAndStudents();
      }
    } catch (err: any) {
      setCancelError(err?.message || 'Failed to cancel fee assignment.');
    } finally {
      setCancellingLoading(false);
    }
  };

  // Payment Status Badge Styling
  const getPaymentStatusBadge = (status?: AssignmentInstallmentStatus | 'UNASSIGNED', isCancelled?: boolean) => {
    if (isCancelled) {
      return { bg: '#F1F5F9', text: '#647F99', label: 'CANCELLED' };
    }
    switch (status) {
      case 'PAID':
        return { bg: '#DCFCE7', text: '#16A34A', label: 'PAID' };
      case 'PARTIAL':
        return { bg: '#FEF3C7', text: '#D97706', label: 'PARTIAL' };
      case 'OVERDUE':
        return { bg: '#FEE2E2', text: '#DC2626', label: 'OVERDUE' };
      case 'UNASSIGNED':
        return { bg: '#F1F5F9', text: '#64748B', label: 'UNASSIGNED' };
      case 'UNPAID':
      default:
        return { bg: '#EEF3F8', text: '#20354A', label: 'UNPAID' };
    }
  };

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const activeAssignments = assignments.filter((a) => a.status === 'ACTIVE');
    const totalAssignedPayable = activeAssignments.reduce((acc, a) => acc + (a.netPayable || 0), 0);
    const totalCollected = activeAssignments.reduce((acc, a) => acc + (a.paidAmount || 0), 0);
    const totalOutstanding = Math.max(0, totalAssignedPayable - totalCollected);
    const fullyPaidCount = activeAssignments.filter((a) => a.paymentStatus === 'PAID').length;
    const unassignedCount = enrolledStudents.filter((s) => !assignedStudentIds.has(s.id || s._id)).length;

    return {
      totalAssignedCount: activeAssignments.length,
      totalAssignedPayable,
      totalCollected,
      totalOutstanding,
      fullyPaidCount,
      unassignedCount,
    };
  }, [assignments, enrolledStudents, assignedStudentIds]);

  // Combined Display Rows (Assignments + Unassigned Enrolled Students)
  const displayRows = useMemo(() => {
    const assignmentByStudentId = new Map<string, StudentFeeAssignment>();
    assignments.forEach((a) => {
      assignmentByStudentId.set(a.studentId, a);
    });

    const rows: Array<{
      type: 'ASSIGNMENT' | 'UNASSIGNED';
      id: string;
      studentId: string;
      studentName: string;
      admissionNumber: string;
      className: string;
      section: string;
      assignment?: StudentFeeAssignment;
      rawStudent?: any;
    }> = [];

    // 1. Add all assignments
    assignments.forEach((asgn) => {
      rows.push({
        type: 'ASSIGNMENT',
        id: asgn.id,
        studentId: asgn.studentId,
        studentName: asgn.studentName,
        admissionNumber: asgn.admissionNumber,
        className: asgn.className,
        section: asgn.section,
        assignment: asgn,
      });
    });

    // 2. Add unassigned enrolled students if structureFilter is ALL
    if (selectedStructureFilter === 'ALL') {
      enrolledStudents.forEach((st) => {
        const sId = (st.id || st._id)?.toString();
        if (!assignmentByStudentId.has(sId)) {
          const sClass = st.grade || st.className || '';
          const sSec = st.section || '';
          if (selectedClass !== 'ALL' && sClass.toLowerCase() !== selectedClass.toLowerCase()) return;
          if (selectedSection !== 'ALL' && sSec.toLowerCase() !== selectedSection.toLowerCase()) return;
          if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const matchName = (st.fullName || '').toLowerCase().includes(term);
            const matchId = (st.studentId || '').toLowerCase().includes(term);
            if (!matchName && !matchId) return;
          }

          rows.push({
            type: 'UNASSIGNED',
            id: `unassigned-${sId}`,
            studentId: sId,
            studentName: st.fullName,
            admissionNumber: st.studentId || '—',
            className: sClass,
            section: sSec,
            rawStudent: st,
          });
        }
      });
    }

    // Filter by selectedStatusFilter
    if (selectedStatusFilter === 'ASSIGNED') {
      return rows.filter((r) => r.type === 'ASSIGNMENT');
    }
    if (selectedStatusFilter === 'UNASSIGNED') {
      return rows.filter((r) => r.type === 'UNASSIGNED');
    }
    if (selectedStatusFilter === 'ACTIVE') {
      return rows.filter((r) => r.type === 'ASSIGNMENT' && r.assignment?.status === 'ACTIVE');
    }
    if (selectedStatusFilter === 'CANCELLED') {
      return rows.filter((r) => r.type === 'ASSIGNMENT' && r.assignment?.status === 'CANCELLED');
    }

    return rows;
  }, [assignments, enrolledStudents, selectedStructureFilter, selectedClass, selectedSection, searchTerm, selectedStatusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header and Filter Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          backgroundColor: '#ffffff',
          padding: '18px 24px',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#20354A' }}>
            Student Fee Assignment
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#647F99' }}>
            Assign class-wise fee schedules, configure scholarships, and track student fee balances.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={fetchAssignmentsAndStudents}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#ffffff',
              fontSize: '0.84rem',
              fontWeight: 500,
              color: '#20354A',
              cursor: 'pointer',
            }}
          >
            <RotateCw size={14} /> Refresh
          </button>
          <button
            onClick={handleOpenAssignModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
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
            <Plus size={16} /> Assign Fees
          </button>
        </div>
      </div>

      {/* Filter Bar */}
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
        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            padding: '6px 12px',
            minWidth: '240px',
            flex: 1,
            maxWidth: '320px',
          }}
        >
          <Search size={16} style={{ color: '#647F99' }} />
          <input
            type="text"
            placeholder="Search student or admission ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAssignmentsAndStudents()}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.85rem',
              width: '100%',
              color: '#20354A',
            }}
          />
        </div>

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

        {/* Structure Filter */}
        <select
          value={selectedStructureFilter}
          onChange={(e) => setSelectedStructureFilter(e.target.value)}
          style={{
            padding: '7px 12px',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            fontSize: '0.84rem',
            color: '#20354A',
            backgroundColor: '#ffffff',
            outline: 'none',
            cursor: 'pointer',
            maxWidth: '220px',
          }}
        >
          <option value="ALL">All Fee Structures</option>
          {structures.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.className})
            </option>
          ))}
        </select>

        {/* Assignment Status Filter */}
        <select
          value={selectedStatusFilter}
          onChange={(e) => setSelectedStatusFilter(e.target.value)}
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
          <option value="ALL">All Assignment Statuses</option>
          <option value="ASSIGNED">Assigned Students</option>
          <option value="UNASSIGNED">Unassigned Students</option>
          <option value="ACTIVE">Active Assignments</option>
          <option value="CANCELLED">Cancelled Assignments</option>
        </select>
      </div>

      {/* Financial Overview KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '16px 20px',
            border: '1px solid #E2E8F0',
          }}
        >
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#647F99', textTransform: 'uppercase' }}>
            Fee Assignments
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#20354A' }}>
              {summaryMetrics.totalAssignedCount}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#647F99' }}>
              assigned ({summaryMetrics.unassignedCount} pending)
            </span>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '16px 20px',
            border: '1px solid #E2E8F0',
          }}
        >
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#647F99', textTransform: 'uppercase' }}>
            Total Net Assigned
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#20354A', marginTop: '6px' }}>
            {formatCurrency(summaryMetrics.totalAssignedPayable)}
          </div>
        </div>

        <div
          style={{
            borderRadius: '10px',
            padding: '16px 20px',
            border: '1px solid #BBF7D0',
            backgroundColor: '#F0FDF4',
          }}
        >
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#16A34A', textTransform: 'uppercase' }}>
            Total Fees Collected
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#16A34A', marginTop: '6px' }}>
            {formatCurrency(summaryMetrics.totalCollected)}
          </div>
        </div>

        <div
          style={{
            borderRadius: '10px',
            padding: '16px 20px',
            border: '1px solid #FECACA',
            backgroundColor: '#FEF2F2',
          }}
        >
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#DC2626', textTransform: 'uppercase' }}>
            Outstanding Balance
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#DC2626', marginTop: '6px' }}>
            {formatCurrency(summaryMetrics.totalOutstanding)}
          </div>
        </div>
      </div>

      {/* Main Assignments Table */}
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
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading student fee assignments...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#DC2626' }}>{error}</div>
        ) : displayRows.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <Users size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>
              No student records found matching criteria.
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>
              Click "Assign Fees" to link active enrolled students to a fee structure.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Student Name
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Admission ID
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Class / Sec
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Assigned Fee Structure
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Total Fee
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Paid Amount
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Outstanding Balance
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99' }}>
                    Payment Status
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#647F99', textAlign: 'right' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => {
                  if (row.type === 'UNASSIGNED') {
                    return (
                      <tr
                        key={row.id}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          backgroundColor: '#FAFBFD',
                        }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#20354A' }}>
                            {row.studentName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                            No fee structure assigned yet
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#647F99', fontFamily: 'monospace' }}>
                          {row.admissionNumber}
                        </td>

                        <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#20354A' }}>
                          <span style={{ fontWeight: 600 }}>{row.className}</span>
                          {row.section && (
                            <span style={{ color: '#647F99', marginLeft: '4px' }}>({row.section})</span>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#94A3B8', fontStyle: 'italic' }}>
                          Not Assigned
                        </td>

                        <td style={{ padding: '14px 16px', fontSize: '0.88rem', color: '#94A3B8' }}>—</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.88rem', color: '#94A3B8' }}>—</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.88rem', color: '#94A3B8' }}>—</td>

                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: '#F1F5F9',
                              color: '#64748B',
                              letterSpacing: '0.3px',
                            }}
                          >
                            UNASSIGNED
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleOpenAssignModalForStudent(row.rawStudent)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid #20354A',
                              backgroundColor: '#20354A',
                              color: '#ffffff',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <Plus size={13} /> Assign Fee
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  const asgn = row.assignment!;
                  const paid = asgn.paidAmount || 0;
                  const balance = asgn.outstandingAmount !== undefined ? asgn.outstandingAmount : Math.max(0, asgn.netPayable - paid);
                  const isCancelled = asgn.status === 'CANCELLED';
                  const badge = getPaymentStatusBadge(asgn.paymentStatus, isCancelled);
                  const canCancel = !isCancelled && paid === 0;

                  return (
                    <tr
                      key={asgn.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        opacity: isCancelled ? 0.65 : 1,
                        backgroundColor: isCancelled ? '#FAFAFA' : '#ffffff',
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#20354A' }}>
                          {asgn.studentName}
                        </div>
                        {asgn.concessionName && (
                          <div style={{ fontSize: '0.72rem', color: '#16A34A', marginTop: '2px' }}>
                            ★ {asgn.concessionName} (-{formatCurrency(asgn.concessionAmount)})
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#647F99', fontFamily: 'monospace' }}>
                        {asgn.admissionNumber}
                      </td>

                      <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#20354A' }}>
                        <span style={{ fontWeight: 600 }}>{asgn.className}</span>
                        {asgn.section && (
                          <span style={{ color: '#647F99', marginLeft: '4px' }}>({asgn.section})</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#20354A' }}>
                        {asgn.feeStructureName}
                      </td>

                      <td style={{ padding: '14px 16px', fontSize: '0.88rem', fontWeight: 600, color: '#20354A' }}>
                        {formatCurrency(asgn.netPayable)}
                      </td>

                      <td style={{ padding: '14px 16px', fontSize: '0.88rem', fontWeight: 600, color: '#16A34A' }}>
                        {formatCurrency(paid)}
                      </td>

                      <td style={{ padding: '14px 16px', fontSize: '0.88rem', fontWeight: 700, color: balance > 0 ? '#DC2626' : '#647F99' }}>
                        {formatCurrency(balance)}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: badge.bg,
                            color: badge.text,
                            letterSpacing: '0.3px',
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          {/* View Installments */}
                          <button
                            title="View Installment Schedule"
                            onClick={() => setViewingAssignment(asgn)}
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid #E2E8F0',
                              backgroundColor: '#ffffff',
                              color: '#20354A',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <Eye size={15} />
                          </button>

                          {/* Quick Generate Invoice */}
                          {!isCancelled && balance > 0 && (
                            <button
                              title="Generate Next Invoice"
                              onClick={() => handleOpenQuickInvoice(asgn)}
                              style={{
                                padding: '6px',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                backgroundColor: '#F8FAFC',
                                color: '#16A34A',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <FileText size={15} />
                            </button>
                          )}

                          {/* Cancel Assignment */}
                          {!isCancelled && (
                            <button
                              title={canCancel ? 'Cancel Fee Assignment' : 'Cannot cancel after payments recorded'}
                              disabled={!canCancel}
                              onClick={() => setCancellingAssignment(asgn)}
                              style={{
                                padding: '6px',
                                borderRadius: '6px',
                                border: '1px solid #FCA5A5',
                                backgroundColor: canCancel ? '#FEF2F2' : '#F1F5F9',
                                color: canCancel ? '#DC2626' : '#94A3B8',
                                cursor: canCancel ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: canCancel ? 1 : 0.5,
                              }}
                            >
                              <Ban size={15} />
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
      {/* 1. ASSIGN FEES MODAL WITH LIVE PREVIEW                                     */}
      {/* ========================================================================= */}
      {isAssignModalOpen && (
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
              maxWidth: '720px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
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
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#20354A' }}>
                  Assign Fee Structure to Students
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#647F99' }}>
                  Configure class-wise fee schedules, apply scholarships, and preview installment schedules.
                </span>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#647F99' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} style={{ padding: '24px' }}>
              {assignModalError && (
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
                  <span>{assignModalError}</span>
                </div>
              )}

              {assignModalSuccess && (
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
                  <span>{assignModalSuccess}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Class & Academic Year */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                      Target Class *
                    </label>
                    <select
                      required
                      value={assignFormClass}
                      onChange={(e) => handleAssignClassChange(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.88rem',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <option value="">-- Choose Class --</option>
                      {classList.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                      Academic Year
                    </label>
                    <input
                      type="text"
                      disabled
                      value={academicYear !== 'ALL' ? academicYear : '2026-2027'}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.88rem',
                        backgroundColor: '#F8FAFC',
                        color: '#647F99',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Structure Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                    Fee Structure *
                  </label>
                  <select
                    required
                    value={assignFormStructureId}
                    onChange={(e) => setAssignFormStructureId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="">-- Choose Fee Structure --</option>
                    {structures
                      .filter((s) => !assignFormClass || s.className === assignFormClass)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.className} • {formatCurrency(s.totalAmount)} • {s.paymentFrequency})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Concession Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                      Concession / Scholarship (Optional)
                    </label>
                    <select
                      value={assignFormConcessionId}
                      onChange={(e) => setAssignFormConcessionId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.88rem',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <option value="">-- No Concession --</option>
                      {concessions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.discountType === 'PERCENTAGE' ? `${c.value}%` : `₹${c.value}`})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                      Concession Reason / Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Merit scholarship approval"
                      value={assignFormConcessionReason}
                      onChange={(e) => setAssignFormConcessionReason(e.target.value)}
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

                {/* Target Student Selection */}
                <div
                  style={{
                    padding: '14px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#20354A', marginBottom: '10px' }}>
                    Student Target Selection
                  </label>

                  <div style={{ display: 'flex', gap: '20px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="assignTarget"
                        checked={assignAllInClass}
                        onChange={() => setAssignAllInClass(true)}
                      />
                      Assign to all active enrolled students in {assignFormClass || 'this class'} ({modalEligibleStudents.length} students)
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="assignTarget"
                        checked={!assignAllInClass}
                        onChange={() => setAssignAllInClass(false)}
                      />
                      Select specific students manually
                    </label>
                  </div>

                  {!assignAllInClass && (
                    <div
                      style={{
                        maxHeight: '160px',
                        overflowY: 'auto',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        padding: '8px 12px',
                      }}
                    >
                      {modalEligibleStudents.length === 0 ? (
                        <div style={{ fontSize: '0.82rem', color: '#647F99', padding: '10px 0' }}>
                          No active students found in this class.
                        </div>
                      ) : (
                        modalEligibleStudents.map((stu) => {
                          const sId = stu.id || stu._id;
                          const isAlreadyAssigned = assignedStudentIds.has(sId);
                          return (
                            <div
                              key={sId}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 0',
                                borderBottom: '1px solid #F1F5F9',
                                opacity: isAlreadyAssigned ? 0.6 : 1,
                              }}
                            >
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', cursor: isAlreadyAssigned ? 'default' : 'pointer' }}>
                                <input
                                  type="checkbox"
                                  disabled={isAlreadyAssigned}
                                  checked={targetStudentIds.includes(sId)}
                                  onChange={() => handleToggleStudentSelection(sId)}
                                />
                                <span style={{ fontWeight: 600 }}>{stu.fullName}</span>
                                <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>({stu.studentId})</span>
                              </label>
                              {isAlreadyAssigned && (
                                <span style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 600 }}>
                                  Already Assigned
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* LIVE FINANCIAL PREVIEW STEP */}
                {modalSelectedStructure && (
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: '#EEF3F8',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <Receipt size={16} style={{ color: '#20354A' }} />
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#20354A' }}>
                        Assignment Preview & Installment Breakdown
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '10px',
                        backgroundColor: '#ffffff',
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        marginBottom: '12px',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#647F99', display: 'block' }}>Base Structure Fee</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#20354A' }}>
                          {formatCurrency(previewFinancials.base)}
                        </span>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#647F99', display: 'block' }}>Concession</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: previewFinancials.concession > 0 ? '#16A34A' : '#647F99' }}>
                          -{formatCurrency(previewFinancials.concession)}
                        </span>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#647F99', display: 'block' }}>Net Per Student</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#20354A' }}>
                          {formatCurrency(previewFinancials.net)}
                        </span>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#647F99', display: 'block' }}>Target Batch ({previewFinancials.count} st.)</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#20354A' }}>
                          {formatCurrency(previewFinancials.totalPayableBatch)}
                        </span>
                      </div>
                    </div>

                    {/* Installments Table */}
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#647F99', marginBottom: '6px' }}>
                      Installment Schedule ({previewFinancials.installments.length} terms):
                    </div>
                    <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #CBD5E1', color: '#647F99', textAlign: 'left' }}>
                            <th style={{ padding: '4px 6px' }}>#</th>
                            <th style={{ padding: '4px 6px' }}>Installment Name</th>
                            <th style={{ padding: '4px 6px' }}>Due Date</th>
                            <th style={{ padding: '4px 6px', textAlign: 'right' }}>Net Payable</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewFinancials.installments.map((inst: any) => (
                            <tr key={inst.number} style={{ borderBottom: '1px solid #E2E8F0' }}>
                              <td style={{ padding: '4px 6px', fontWeight: 600 }}>{inst.number}</td>
                              <td style={{ padding: '4px 6px' }}>{inst.name}</td>
                              <td style={{ padding: '4px 6px', color: '#647F99' }}>{inst.dueDate}</td>
                              <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700, color: '#20354A' }}>
                                {formatCurrency(inst.net)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
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
                  onClick={() => setIsAssignModalOpen(false)}
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
                  disabled={savingAssign || !assignFormStructureId}
                  style={{
                    padding: '8px 22px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#20354A',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: savingAssign || !assignFormStructureId ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 4px rgba(32, 53, 74, 0.2)',
                  }}
                >
                  {savingAssign && <RotateCw className="animate-spin" size={14} />}
                  Confirm & Assign Fees
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW INSTALLMENTS MODAL                                                */}
      {/* ========================================================================= */}
      {viewingAssignment && (
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
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#20354A' }}>
                  Installment Schedule: {viewingAssignment.studentName}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#647F99' }}>
                  {viewingAssignment.className} {viewingAssignment.section ? `(${viewingAssignment.section})` : ''} • Admission ID: {viewingAssignment.admissionNumber}
                </span>
              </div>
              <button
                onClick={() => setViewingAssignment(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#647F99' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Assignment Meta */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  backgroundColor: '#F8FAFC',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.74rem', color: '#647F99', display: 'block' }}>Fee Structure</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#20354A' }}>
                    {viewingAssignment.feeStructureName}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', color: '#647F99', display: 'block' }}>Net Payable</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#20354A' }}>
                    {formatCurrency(viewingAssignment.netPayable)}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', color: '#647F99', display: 'block' }}>Paid Amount</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#16A34A' }}>
                    {formatCurrency(viewingAssignment.paidAmount || 0)}
                  </span>
                </div>
              </div>

              {/* Installments Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#647F99' }}>
                    <th style={{ padding: '10px 12px' }}>#</th>
                    <th style={{ padding: '10px 12px' }}>Installment Name</th>
                    <th style={{ padding: '10px 12px' }}>Due Date</th>
                    <th style={{ padding: '10px 12px' }}>Net Amount</th>
                    <th style={{ padding: '10px 12px' }}>Paid</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingAssignment.installments.map((inst) => {
                    const badge = getPaymentStatusBadge(inst.status);
                    return (
                      <tr key={inst.installmentNumber} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{inst.installmentNumber}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#20354A' }}>{inst.name}</td>
                        <td style={{ padding: '10px 12px', color: '#647F99' }}>{inst.dueDate}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#20354A' }}>
                          {formatCurrency(inst.netAmount)}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#16A34A' }}>
                          {formatCurrency(inst.paidAmount)}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              backgroundColor: badge.bg,
                              color: badge.text,
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  onClick={() => setViewingAssignment(null)}
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
      {/* 3. QUICK INVOICE GENERATION MODAL                                         */}
      {/* ========================================================================= */}
      {quickInvoiceAssignment && (
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
              maxWidth: '520px',
              width: '100%',
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
                  Generate Invoice
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#647F99' }}>
                  Issue fee invoice voucher for {quickInvoiceAssignment.studentName}
                </span>
              </div>
              <button
                onClick={() => setQuickInvoiceAssignment(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#647F99' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickInvoiceSubmit} style={{ padding: '24px' }}>
              {quickInvoiceError && (
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
                  {quickInvoiceError}
                </div>
              )}

              {quickInvoiceSuccess && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#DCFCE7',
                    border: '1px solid #86EFAC',
                    borderRadius: '6px',
                    color: '#166534',
                    fontSize: '0.84rem',
                    marginBottom: '16px',
                  }}
                >
                  {quickInvoiceSuccess}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                    Select Installment Term *
                  </label>
                  <select
                    value={quickInvoiceInstallment}
                    onChange={(e) => setQuickInvoiceInstallment(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                    }}
                  >
                    {quickInvoiceAssignment.installments.map((inst) => (
                      <option key={inst.installmentNumber} value={inst.installmentNumber}>
                        Installment #{inst.installmentNumber}: {inst.name} ({formatCurrency(inst.netAmount)} • Due: {inst.dueDate}) [{inst.status}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                    Invoice Due Date
                  </label>
                  <input
                    type="date"
                    value={quickInvoiceDueDate}
                    onChange={(e) => setQuickInvoiceDueDate(e.target.value)}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
                <button
                  type="button"
                  onClick={() => setQuickInvoiceAssignment(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#ffffff',
                    fontSize: '0.84rem',
                    color: '#647F99',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingInvoice}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#20354A',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: generatingInvoice ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {generatingInvoice && <RotateCw className="animate-spin" size={14} />}
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CANCEL ASSIGNMENT CONFIRMATION MODAL                                    */}
      {/* ========================================================================= */}
      {cancellingAssignment && (
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
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#DC2626', marginBottom: '14px' }}>
              <Ban size={24} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#20354A' }}>
                Cancel Fee Assignment?
              </h3>
            </div>

            {cancelError && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '6px',
                  color: '#991B1B',
                  fontSize: '0.84rem',
                  marginBottom: '14px',
                }}
              >
                {cancelError}
              </div>
            )}

            <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
              Are you sure you want to cancel the fee assignment for{' '}
              <strong>{cancellingAssignment.studentName}</strong> ({cancellingAssignment.admissionNumber})?
              Existing unpaid invoices will be cancelled.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setCancellingAssignment(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.84rem',
                  color: '#647F99',
                  cursor: 'pointer',
                }}
              >
                Keep Assignment
              </button>
              <button
                type="button"
                disabled={cancellingLoading}
                onClick={handleConfirmCancelAssignment}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#DC2626',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  cursor: cancellingLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {cancellingLoading && <RotateCw className="animate-spin" size={14} />}
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
