import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  RotateCw,
  Eye,
  Edit2,
  Copy,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  AlertCircle,
  Layers,
  ShieldAlert,
  Lock,
  Unlock,
  Send,
} from 'lucide-react';
import { adminFeeApi } from '../../../api/adminFeeApi';
import { adminApi } from '../../../api/adminApi';
import {
  FeeStructure,
  FeeCategory,
  PaymentFrequency,
  LateFeeRule,
  FeeStructureStatus,
  FeeStructureUsage,
} from '../../../types/adminFee.types';

interface FeeStructuresTabProps {
  academicYear: string;
}

export const FeeStructuresTab: React.FC<FeeStructuresTabProps> = ({
  academicYear: initialAcademicYear,
}) => {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [availableCategories, setAvailableCategories] = useState<FeeCategory[]>([]);
  const [classList, setClassList] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(
    initialAcademicYear || '2026-2027'
  );
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // View Details Modal
  const [inspectingStructure, setInspectingStructure] = useState<FeeStructure | null>(null);
  const [inspectingUsage, setInspectingUsage] = useState<FeeStructureUsage | null>(null);
  const [loadingUsage, setLoadingUsage] = useState<boolean>(false);

  // Create & Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  const [editUsage, setEditUsage] = useState<FeeStructureUsage | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Duplicate Modal State
  const [duplicatingStructure, setDuplicatingStructure] = useState<FeeStructure | null>(null);
  const [duplicateYear, setDuplicateYear] = useState<string>('2027-2028');
  const [duplicateName, setDuplicateName] = useState<string>('');
  const [duplicating, setDuplicating] = useState<boolean>(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  // Delete Modal State
  const [deletingStructure, setDeletingStructure] = useState<FeeStructure | null>(null);
  const [deleteUsage, setDeleteUsage] = useState<FeeStructureUsage | null>(null);
  const [loadingDeleteUsage, setLoadingDeleteUsage] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Status Action Alert
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    academicYear: initialAcademicYear !== 'ALL' ? initialAcademicYear : '2026-2027',
    className: '',
    section: 'ALL',
    categories: [] as {
      categoryId: string;
      categoryName: string;
      amount: number;
      isMandatory: boolean;
    }[],
    paymentFrequency: 'TERM' as PaymentFrequency,
    installments: [] as {
      installmentNumber: number;
      name: string;
      amount: number;
      dueDate: string;
    }[],
    lateFeeRule: {
      enabled: false,
      gracePeriodDays: 7,
      feeType: 'DAILY' as 'FIXED' | 'DAILY',
      amount: 50,
    } as LateFeeRule,
    status: 'ACTIVE' as FeeStructureStatus,
  });

  // Sync prop changes
  useEffect(() => {
    if (initialAcademicYear) {
      setSelectedAcademicYear(initialAcademicYear);
    }
  }, [initialAcademicYear]);

  const fetchStructures = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFeeApi.getStructures({
        academicYear: selectedAcademicYear !== 'ALL' ? selectedAcademicYear : undefined,
        className: selectedClassFilter !== 'ALL' ? selectedClassFilter : undefined,
        status: selectedStatusFilter !== 'ALL' ? selectedStatusFilter : undefined,
      });
      if (res.success && res.data) {
        setStructures(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load fee structures.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [catRes, classRes] = await Promise.all([
        adminFeeApi.getCategories('ACTIVE'),
        adminApi.getClasses(),
      ]);

      if (catRes.success && catRes.data) {
        setAvailableCategories(catRes.data);
      }

      if (classRes.success && classRes.data) {
        const uniqueClasses = Array.from(new Set(classRes.data.map((c: any) => c.name)));
        setClassList(uniqueClasses);
      }
    } catch (err) {
      console.error('Failed to load classes or categories:', err);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchStructures();
  }, [selectedAcademicYear, selectedClassFilter, selectedStatusFilter]);

  const formatCurrency = (val: number = 0) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  // Live calculations for Category breakdown
  const calculatedMandatoryTotal = formData.categories
    .filter((c) => c.isMandatory !== false)
    .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  const calculatedOptionalTotal = formData.categories
    .filter((c) => c.isMandatory === false)
    .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  const calculatedGrandTotal = calculatedMandatoryTotal + calculatedOptionalTotal;

  const calculatedTotalInstallments = formData.installments.reduce(
    (sum, inst) => sum + (Number(inst.amount) || 0),
    0
  );

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingStructure(null);
    setEditUsage(null);
    const defaultClass = classList[0] || 'Class 1';
    const targetYear = selectedAcademicYear !== 'ALL' ? selectedAcademicYear : '2026-2027';

    const initialCats =
      availableCategories.length > 0
        ? [
            {
              categoryId: availableCategories[0].id,
              categoryName: availableCategories[0].name,
              amount: 15000,
              isMandatory: availableCategories[0].isMandatory !== false,
            },
          ]
        : [];

    const yearStart = parseInt(targetYear.split('-')[0]) || 2026;

    setFormData({
      name: `${defaultClass} Standard Fee ${targetYear}`,
      description: `Comprehensive fee schedule for ${defaultClass} academic session ${targetYear}.`,
      academicYear: targetYear,
      className: defaultClass,
      section: 'ALL',
      categories: initialCats,
      paymentFrequency: 'TERM',
      installments: [
        {
          installmentNumber: 1,
          name: 'Term 1 Fee',
          amount: 7500,
          dueDate: `${yearStart}-07-31`,
        },
        {
          installmentNumber: 2,
          name: 'Term 2 Fee',
          amount: 7500,
          dueDate: `${yearStart}-11-30`,
        },
      ],
      lateFeeRule: {
        enabled: true,
        gracePeriodDays: 7,
        feeType: 'DAILY',
        amount: 50,
      },
      status: 'ACTIVE',
    });

    setModalError(null);
    setModalSuccess(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = async (struct: FeeStructure) => {
    setEditingStructure(struct);
    setModalError(null);
    setModalSuccess(null);
    setIsModalOpen(true);

    // Fetch usage to check if invoices have been issued
    try {
      const usageRes = await adminFeeApi.getStructureUsage(struct.id);
      if (usageRes.success && usageRes.data) {
        setEditUsage(usageRes.data);
      }
    } catch {
      setEditUsage(null);
    }

    setFormData({
      name: struct.name,
      description: struct.description || '',
      academicYear: struct.academicYear,
      className: struct.className,
      section: struct.section || 'ALL',
      categories: (struct.categories || []).map((c) => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        amount: c.amount,
        isMandatory: c.isMandatory !== false,
      })),
      paymentFrequency: struct.paymentFrequency,
      installments: (struct.installments || []).map((inst) => ({
        installmentNumber: inst.installmentNumber,
        name: inst.name,
        amount: inst.amount,
        dueDate: inst.dueDate,
      })),
      lateFeeRule: struct.lateFeeRule || {
        enabled: false,
        gracePeriodDays: 7,
        feeType: 'DAILY',
        amount: 50,
      },
      status: struct.status,
    });
  };

  // View Details Modal
  const handleInspectStructure = async (st: FeeStructure) => {
    setInspectingStructure(st);
    setInspectingUsage(null);
    setLoadingUsage(true);
    try {
      const res = await adminFeeApi.getStructureUsage(st.id);
      if (res.success && res.data) {
        setInspectingUsage(res.data);
      }
    } catch (e) {
      console.error('Failed to get structure usage:', e);
    } finally {
      setLoadingUsage(false);
    }
  };

  // Category Row Handlers
  const handleAddCategoryRow = () => {
    const unselectedCat = availableCategories.find(
      (c) => !formData.categories.some((row) => row.categoryId === c.id)
    );
    if (!unselectedCat) return;

    setFormData({
      ...formData,
      categories: [
        ...formData.categories,
        {
          categoryId: unselectedCat.id,
          categoryName: unselectedCat.name,
          amount: 0,
          isMandatory: unselectedCat.isMandatory !== false,
        },
      ],
    });
  };

  const handleRemoveCategoryRow = (index: number) => {
    const updated = formData.categories.filter((_, idx) => idx !== index);
    setFormData({ ...formData, categories: updated });
  };

  const handleCategoryChange = (index: number, catId: string) => {
    const found = availableCategories.find((c) => c.id === catId);
    if (!found) return;
    const updated = [...formData.categories];
    updated[index] = {
      ...updated[index],
      categoryId: found.id,
      categoryName: found.name,
      isMandatory: found.isMandatory !== false,
    };
    setFormData({ ...formData, categories: updated });
  };

  const handleCategoryAmountChange = (index: number, amount: number) => {
    const updated = [...formData.categories];
    updated[index] = { ...updated[index], amount: Math.max(0, amount) };
    setFormData({ ...formData, categories: updated });
  };

  const handleCategoryMandatoryToggle = (index: number) => {
    const updated = [...formData.categories];
    updated[index] = { ...updated[index], isMandatory: !updated[index].isMandatory };
    setFormData({ ...formData, categories: updated });
  };

  // Auto-distribute Installment Schedules
  const handleAutoDistributeInstallments = (count: number, labelPrefix: string) => {
    if (calculatedGrandTotal <= 0) return;
    const basePerInst = Math.floor(calculatedGrandTotal / count);
    const remainder = calculatedGrandTotal - basePerInst * count;
    const yearStart = parseInt(formData.academicYear.split('-')[0]) || 2026;

    const newInsts = Array.from({ length: count }).map((_, idx) => {
      const monthOffset = idx * Math.floor(12 / count) + 6; // Starts around July
      const targetYear = monthOffset > 12 ? yearStart + 1 : yearStart;
      const targetMonth = monthOffset > 12 ? monthOffset - 12 : monthOffset;
      const padMonth = String(targetMonth).padStart(2, '0');
      const dueDate = `${targetYear}-${padMonth}-28`;

      return {
        installmentNumber: idx + 1,
        name: count === 1 ? 'Full Annual Fee' : `${labelPrefix} ${idx + 1} Fee`,
        amount: idx === count - 1 ? basePerInst + remainder : basePerInst,
        dueDate,
      };
    });

    setFormData({ ...formData, installments: newInsts });
  };

  const handleInstallmentChange = (
    index: number,
    field: 'name' | 'amount' | 'dueDate',
    val: any
  ) => {
    const updated = [...formData.installments];
    updated[index] = { ...updated[index], [field]: val };
    setFormData({ ...formData, installments: updated });
  };

  const handleAddInstallmentRow = () => {
    const nextNum = formData.installments.length + 1;
    const yearStart = parseInt(formData.academicYear.split('-')[0]) || 2026;
    setFormData({
      ...formData,
      installments: [
        ...formData.installments,
        {
          installmentNumber: nextNum,
          name: `Installment ${nextNum}`,
          amount: 0,
          dueDate: `${yearStart}-12-15`,
        },
      ],
    });
  };

  const handleRemoveInstallmentRow = (index: number) => {
    const updated = formData.installments
      .filter((_, idx) => idx !== index)
      .map((inst, idx) => ({ ...inst, installmentNumber: idx + 1 }));
    setFormData({ ...formData, installments: updated });
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.className.trim()) {
      setModalError('Structure name and class are required.');
      return;
    }

    if (formData.categories.length === 0) {
      setModalError('Please configure at least one fee category row.');
      return;
    }

    // Check duplicate categories
    const catIds = formData.categories.map((c) => c.categoryId);
    if (new Set(catIds).size !== catIds.length) {
      setModalError('Duplicate fee categories are not allowed in the same structure.');
      return;
    }

    // Check invalid category amounts
    if (formData.categories.some((c) => Number(c.amount) <= 0)) {
      setModalError('All fee category amounts must be greater than ₹0.');
      return;
    }

    if (calculatedGrandTotal <= 0) {
      setModalError('Total fee amount must be greater than zero.');
      return;
    }

    if (formData.installments.length === 0) {
      setModalError('Please configure at least one installment schedule.');
      return;
    }

    if (Math.abs(calculatedTotalInstallments - calculatedGrandTotal) > 0.01) {
      setModalError(
        `Installment allocation total (${formatCurrency(
          calculatedTotalInstallments
        )}) must equal the total fee amount (${formatCurrency(calculatedGrandTotal)}).`
      );
      return;
    }

    try {
      setSaving(true);
      setModalError(null);
      setModalSuccess(null);

      if (editingStructure) {
        // Updating existing structure
        const updatePayload: any = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          status: formData.status,
        };

        // If financials are allowed to be edited, include them
        if (editUsage?.canEditFinancials !== false) {
          updatePayload.className = formData.className.trim();
          updatePayload.section = formData.section.trim();
          updatePayload.categories = formData.categories;
          updatePayload.totalAmount = calculatedGrandTotal;
          updatePayload.paymentFrequency = formData.paymentFrequency;
          updatePayload.installments = formData.installments;
          updatePayload.lateFeeRule = formData.lateFeeRule;
        }

        const res = await adminFeeApi.updateStructure(editingStructure.id, updatePayload);
        if (res.success) {
          setModalSuccess('Fee structure updated successfully!');
          setTimeout(() => {
            setIsModalOpen(false);
            fetchStructures();
          }, 800);
        }
      } else {
        // Creating new structure
        const res = await adminFeeApi.createStructure({
          name: formData.name.trim(),
          description: formData.description.trim(),
          academicYear: formData.academicYear.trim(),
          className: formData.className.trim(),
          section: formData.section.trim(),
          categories: formData.categories,
          totalAmount: calculatedGrandTotal,
          paymentFrequency: formData.paymentFrequency,
          installments: formData.installments,
          lateFeeRule: formData.lateFeeRule,
          status: formData.status,
        });

        if (res.success) {
          setModalSuccess('Fee structure created successfully!');
          setTimeout(() => {
            setIsModalOpen(false);
            fetchStructures();
          }, 800);
        }
      }
    } catch (err: any) {
      setModalError(err?.message || 'Failed to save fee structure.');
    } finally {
      setSaving(false);
    }
  };

  // Open Duplicate Modal
  const handleOpenDuplicateModal = (st: FeeStructure) => {
    setDuplicatingStructure(st);
    const sourceYearStart = parseInt(st.academicYear.split('-')[0]) || 2026;
    const nextTarget = `${sourceYearStart + 1}-${sourceYearStart + 2}`;
    setDuplicateYear(nextTarget);
    setDuplicateName(`${st.className} Standard Fee ${nextTarget}`);
    setDuplicateError(null);
  };

  // Submit Duplicate
  const handleDuplicateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicatingStructure) return;

    if (!duplicateYear.trim() || !duplicateName.trim()) {
      setDuplicateError('Target academic year and structure name are required.');
      return;
    }

    try {
      setDuplicating(true);
      setDuplicateError(null);
      const res = await adminFeeApi.duplicateStructure(duplicatingStructure.id, {
        targetAcademicYear: duplicateYear.trim(),
        name: duplicateName.trim(),
      });

      if (res.success) {
        setActionAlert({
          type: 'success',
          message: `Successfully duplicated "${duplicatingStructure.name}" to academic year ${duplicateYear}!`,
        });
        setDuplicatingStructure(null);
        fetchStructures();
      }
    } catch (err: any) {
      setDuplicateError(err?.message || 'Failed to duplicate fee structure.');
    } finally {
      setDuplicating(false);
    }
  };

  // Publishing Structure State
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Toggle Structure Status (Active / Inactive)
  const handleToggleStatus = async (struct: FeeStructure) => {
    const newStatus: FeeStructureStatus = struct.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setActionAlert(null);
    try {
      if (newStatus === 'ACTIVE') {
        const res = await adminFeeApi.publishStructure(struct.id);
        setActionAlert({
          type: 'success',
          message: res.data?.message || `Structure "${struct.name}" published and activated for ${struct.className}.`,
        });
      } else {
        await adminFeeApi.updateStructure(struct.id, { status: newStatus });
        setActionAlert({
          type: 'success',
          message: `Structure "${struct.name}" is now marked as ${newStatus}.`,
        });
      }
      fetchStructures();
    } catch (err: any) {
      setActionAlert({
        type: 'error',
        message: err?.message || 'Failed to update structure status.',
      });
    }
  };

  // Explicit Publish Structure and generate invoices for enrolled students
  const handlePublishStructure = async (struct: FeeStructure) => {
    setActionAlert(null);
    try {
      setPublishingId(struct.id);
      const res = await adminFeeApi.publishStructure(struct.id);
      setActionAlert({
        type: 'success',
        message:
          res.data?.message ||
          `Fee structure "${struct.name}" published successfully for ${struct.className}! Invoices generated.`,
      });
      fetchStructures();
    } catch (err: any) {
      setActionAlert({
        type: 'error',
        message: err?.message || 'Failed to publish fee structure.',
      });
    } finally {
      setPublishingId(null);
    }
  };

  const handleOpenDeleteModal = async (struct: FeeStructure) => {
    setDeletingStructure(struct);
    setDeleteError(null);
    setLoadingDeleteUsage(true);
    try {
      const res = await adminFeeApi.getStructureUsage(struct.id);
      if (res.success && res.data) {
        setDeleteUsage(res.data);
      }
    } catch {
      setDeleteUsage(null);
    } finally {
      setLoadingDeleteUsage(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingStructure) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      const res = await adminFeeApi.deleteStructure(deletingStructure.id);
      if (res.success) {
        setActionAlert({
          type: 'success',
          message: res.message || `Fee structure '${deletingStructure.name}' deleted successfully.`,
        });
        setTimeout(() => setActionAlert(null), 4000);
        setDeletingStructure(null);
        setDeleteUsage(null);
        fetchStructures();
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete fee structure.');
    } finally {
      setDeleting(false);
    }
  };

  // Search & Filter
  const filteredStructures = structures.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchesName = s.name.toLowerCase().includes(q);
    const matchesClass = s.className.toLowerCase().includes(q);
    const matchesCategory = (s.categories || []).some((c) =>
      c.categoryName.toLowerCase().includes(q)
    );
    return matchesName || matchesClass || matchesCategory;
  });

  // Summary Metrics
  const totalStructuresCount = structures.length;
  const activeStructuresCount = structures.filter((s) => s.status === 'ACTIVE').length;
  const uniqueClassesCount = new Set(
    structures.filter((s) => s.status === 'ACTIVE').map((s) => s.className)
  ).size;
  const avgAnnualFee =
    structures.length > 0
      ? Math.round(
          structures.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0) / structures.length
        )
      : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          backgroundColor: '#ffffff',
          padding: '20px 24px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#20354A',
                backgroundColor: '#EEF3F8',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              Academic Plans
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>•</span>
            <span style={{ fontSize: '0.8rem', color: '#647F99' }}>Class Fee Matrix</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#20354A' }}>
            Fee Structures
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#647F99', maxWidth: '850px' }}>
            Configure class-wise fee plans for each academic year. Define multiple fee heads, installment schedules, and late payment rules without altering student records.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 18px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#20354A',
            fontSize: '0.86rem',
            fontWeight: 600,
            color: '#ffffff',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(32, 53, 74, 0.15)',
            transition: 'all 0.15s ease',
          }}
        >
          <Plus size={16} /> Create Fee Structure
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
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
          <div style={{ fontSize: '0.8rem', color: '#647F99', fontWeight: 600 }}>Total Structures</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#20354A', marginTop: '6px' }}>
            {totalStructuresCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '2px' }}>
            Configured plans across years
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
          <div style={{ fontSize: '0.8rem', color: '#647F99', fontWeight: 600 }}>Active Structures</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#16A34A', marginTop: '6px' }}>
            {activeStructuresCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '2px' }}>
            Ready for student assignment
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
          <div style={{ fontSize: '0.8rem', color: '#647F99', fontWeight: 600 }}>Classes Covered</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#2563EB', marginTop: '6px' }}>
            {uniqueClassesCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '2px' }}>
            Classes with active plans
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
          <div style={{ fontSize: '0.8rem', color: '#647F99', fontWeight: 600 }}>Average Annual Fee</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#20354A', marginTop: '6px' }}>
            {formatCurrency(avgAnnualFee)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '2px' }}>
            Mean structure total
          </div>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionAlert && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            backgroundColor: actionAlert.type === 'success' ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${actionAlert.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
            color: actionAlert.type === 'success' ? '#166534' : '#991B1B',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {actionAlert.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{actionAlert.message}</span>
          </div>
          <button
            onClick={() => setActionAlert(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Toolbar & Filters */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
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
              minWidth: '220px',
              maxWidth: '300px',
              flex: 1,
            }}
          >
            <Search size={15} style={{ color: '#647F99' }} />
            <input
              type="text"
              placeholder="Search by name, class, category..."
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

          {/* Academic Year Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#647F99', fontWeight: 600 }}>Year:</span>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
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
              <option value="ALL">All Academic Years</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
              <option value="2027-2028">2027-2028</option>
              <option value="2028-2029">2028-2029</option>
            </select>
          </div>

          {/* Class Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#647F99', fontWeight: 600 }}>Class:</span>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
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
              {classList.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#647F99', fontWeight: 600 }}>Status:</span>
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
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchStructures}
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
            transition: 'background-color 0.15s ease',
          }}
        >
          <RotateCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Structured Table */}
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
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading fee structures...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#DC2626' }}>{error}</div>
        ) : filteredStructures.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <Layers size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#20354A' }}>
              No fee structures found.
            </p>
            <p style={{ margin: '4px 0 16px', fontSize: '0.82rem' }}>
              Configure class tuition fees, category breakdowns, installments, and late fee policies.
            </p>
            <button
              onClick={handleOpenCreateModal}
              style={{
                padding: '7px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#20354A',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              + Create First Fee Structure
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Structure Name
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Academic Year
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Class
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Number of Fee Categories
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Total Fee Amount
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Payment Frequency
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStructures.map((st) => {
                  const mandatoryCount = (st.categories || []).filter(
                    (c) => c.isMandatory !== false
                  ).length;
                  const optionalCount = (st.categories || []).length - mandatoryCount;

                  return (
                    <tr
                      key={st.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background-color 0.1s ease',
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#20354A' }}>
                          {st.name}
                        </div>
                        {st.description && (
                          <div
                            style={{
                              fontSize: '0.76rem',
                              color: '#647F99',
                              marginTop: '2px',
                              maxWidth: '260px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {st.description}
                          </div>
                        )}
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
                          {st.academicYear}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#20354A' }}>
                        <span style={{ fontWeight: 600 }}>{st.className}</span>
                        <span style={{ color: '#94A3B8', marginLeft: '6px', fontSize: '0.78rem' }}>
                          ({st.section || 'ALL'})
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.84rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: '#20354A' }}>
                            {st.categories?.length || 0} Categories
                          </span>
                          {optionalCount > 0 && (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                color: '#2563EB',
                                backgroundColor: '#EFF6FF',
                                padding: '1px 6px',
                                borderRadius: '10px',
                                fontWeight: 500,
                              }}
                            >
                              {optionalCount} opt
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          color: '#20354A',
                        }}
                      >
                        {formatCurrency(st.totalAmount)}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.84rem' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            backgroundColor:
                              st.paymentFrequency === 'ANNUAL'
                                ? '#FEF3C7'
                                : st.paymentFrequency === 'TERM'
                                ? '#E0E7FF'
                                : '#F1F5F9',
                            color:
                              st.paymentFrequency === 'ANNUAL'
                                ? '#92400E'
                                : st.paymentFrequency === 'TERM'
                                ? '#3730A3'
                                : '#334155',
                          }}
                        >
                          {st.paymentFrequency}
                        </span>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            color: '#94A3B8',
                            marginLeft: '6px',
                          }}
                        >
                          ({st.installments?.length || 0} inst)
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            backgroundColor: st.status === 'ACTIVE' ? '#DCFCE7' : '#F1F5F9',
                            color: st.status === 'ACTIVE' ? '#16A34A' : '#647F99',
                          }}
                        >
                          {st.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <button
                            onClick={() => handleInspectStructure(st)}
                            title="View Structure Details"
                            style={{
                              padding: '6px',
                              borderRadius: '4px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#ffffff',
                              color: '#20354A',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(st)}
                            title="Edit Structure"
                            style={{
                              padding: '6px',
                              borderRadius: '4px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#ffffff',
                              color: '#20354A',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handlePublishStructure(st)}
                            disabled={publishingId === st.id}
                            title="Publish fee structure and generate invoices for enrolled students"
                            style={{
                              padding: '6px',
                              borderRadius: '4px',
                              border: '1px solid #BBF7D0',
                              backgroundColor: '#F0FDF4',
                              color: '#16A34A',
                              cursor: publishingId === st.id ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {publishingId === st.id ? (
                              <RotateCw className="animate-spin" size={14} />
                            ) : (
                              <Send size={14} />
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenDuplicateModal(st)}
                            title="Duplicate for Another Academic Year"
                            style={{
                              padding: '6px',
                              borderRadius: '4px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#ffffff',
                              color: '#2563EB',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(st)}
                            title={st.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            style={{
                              padding: '6px',
                              borderRadius: '4px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#ffffff',
                              color: st.status === 'ACTIVE' ? '#D97706' : '#16A34A',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {st.status === 'ACTIVE' ? <XCircle size={14} /> : <CheckCircle size={14} />}
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(st)}
                            title="Delete Structure"
                            style={{
                              padding: '6px',
                              borderRadius: '4px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#ffffff',
                              color: '#DC2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <Trash2 size={14} />
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

      {/* Inspect Structure Modal */}
      {inspectingStructure && (
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
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 700, color: '#20354A' }}>
                    {inspectingStructure.name}
                  </h3>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      backgroundColor:
                        inspectingStructure.status === 'ACTIVE' ? '#DCFCE7' : '#F1F5F9',
                      color: inspectingStructure.status === 'ACTIVE' ? '#16A34A' : '#647F99',
                    }}
                  >
                    {inspectingStructure.status}
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#647F99' }}>
                  {inspectingStructure.className} (Section: {inspectingStructure.section || 'ALL'}) •{' '}
                  {inspectingStructure.academicYear} • Frequency: {inspectingStructure.paymentFrequency}
                </span>
              </div>
              <button
                onClick={() => setInspectingStructure(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#647F99' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {inspectingStructure.description && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.84rem',
                    color: '#475569',
                  }}
                >
                  <strong>Description: </strong>
                  {inspectingStructure.description}
                </div>
              )}

              {/* Usage & Audit Stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  backgroundColor: '#F8FAFC',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#647F99', fontWeight: 600 }}>
                    Assigned Students
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#20354A', marginTop: '2px' }}>
                    {loadingUsage ? '...' : inspectingUsage?.assignmentsCount ?? 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#647F99', fontWeight: 600 }}>
                    Invoices Generated
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#2563EB', marginTop: '2px' }}>
                    {loadingUsage ? '...' : inspectingUsage?.invoicesCount ?? 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#647F99', fontWeight: 600 }}>
                    Financial Terms Lock
                  </div>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      marginTop: '4px',
                      color: inspectingUsage?.canEditFinancials === false ? '#DC2626' : '#16A34A',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {inspectingUsage?.canEditFinancials === false ? (
                      <>
                        <Lock size={12} /> Locked (Invoiced)
                      </>
                    ) : (
                      <>
                        <Unlock size={12} /> Unlocked
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.88rem', fontWeight: 700, color: '#20354A' }}>
                  Fee Categories Breakdown
                </h4>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '8px 12px', fontSize: '0.78rem', color: '#647F99' }}>
                          Category Name
                        </th>
                        <th style={{ padding: '8px 12px', fontSize: '0.78rem', color: '#647F99' }}>
                          Requirement
                        </th>
                        <th
                          style={{
                            padding: '8px 12px',
                            fontSize: '0.78rem',
                            color: '#647F99',
                            textAlign: 'right',
                          }}
                        >
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspectingStructure.categories.map((c, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 12px', fontSize: '0.84rem', color: '#20354A' }}>
                            {c.categoryName}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: '0.82rem' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                backgroundColor: c.isMandatory !== false ? '#DCFCE7' : '#EFF6FF',
                                color: c.isMandatory !== false ? '#166534' : '#1D4ED8',
                              }}
                            >
                              {c.isMandatory !== false ? 'Mandatory' : 'Optional'}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              fontSize: '0.84rem',
                              fontWeight: 600,
                              textAlign: 'right',
                              color: '#20354A',
                            }}
                          >
                            {formatCurrency(c.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: '#F8FAFC', fontWeight: 700 }}>
                        <td
                          colSpan={2}
                          style={{ padding: '10px 12px', fontSize: '0.86rem', color: '#20354A' }}
                        >
                          Total Configured Fee
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            fontSize: '0.92rem',
                            textAlign: 'right',
                            color: '#20354A',
                          }}
                        >
                          {formatCurrency(inspectingStructure.totalAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Installment Plan */}
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.88rem', fontWeight: 700, color: '#20354A' }}>
                  Installment Schedule ({inspectingStructure.installments?.length || 0} terms)
                </h4>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '8px 12px', fontSize: '0.78rem', color: '#647F99' }}>#</th>
                        <th style={{ padding: '8px 12px', fontSize: '0.78rem', color: '#647F99' }}>
                          Name
                        </th>
                        <th style={{ padding: '8px 12px', fontSize: '0.78rem', color: '#647F99' }}>
                          Due Date
                        </th>
                        <th
                          style={{
                            padding: '8px 12px',
                            fontSize: '0.78rem',
                            color: '#647F99',
                            textAlign: 'right',
                          }}
                        >
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspectingStructure.installments.map((inst, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 12px', fontSize: '0.82rem', color: '#647F99' }}>
                            {inst.installmentNumber}
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              fontSize: '0.84rem',
                              fontWeight: 600,
                              color: '#20354A',
                            }}
                          >
                            {inst.name}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: '0.82rem', color: '#647F99' }}>
                            {inst.dueDate}
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              fontSize: '0.84rem',
                              fontWeight: 600,
                              textAlign: 'right',
                              color: '#20354A',
                            }}
                          >
                            {formatCurrency(inst.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Late Fee Policy */}
              {inspectingStructure.lateFeeRule?.enabled && (
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#FEF3C7',
                    borderRadius: '8px',
                    border: '1px solid #FDE68A',
                    fontSize: '0.82rem',
                    color: '#92400E',
                  }}
                >
                  <strong>Late Fee Policy: </strong>₹{inspectingStructure.lateFeeRule.amount} (
                  {inspectingStructure.lateFeeRule.feeType}) applied after{' '}
                  {inspectingStructure.lateFeeRule.gracePeriodDays} days grace period.
                </div>
              )}
            </div>

            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <button
                onClick={() => {
                  const target = inspectingStructure;
                  setInspectingStructure(null);
                  handleOpenDuplicateModal(target);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.84rem',
                  color: '#2563EB',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <Copy size={14} /> Duplicate for Another Year
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    const target = inspectingStructure;
                    setInspectingStructure(null);
                    handleOpenDeleteModal(target);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '6px',
                    border: '1px solid #FECACA',
                    backgroundColor: '#FEF2F2',
                    fontSize: '0.84rem',
                    color: '#DC2626',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  <Trash2 size={14} /> Delete
                </button>
                <button
                  onClick={() => {
                    const target = inspectingStructure;
                    setInspectingStructure(null);
                    handleOpenEditModal(target);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 16px',
                    borderRadius: '6px',
                    border: '1px solid #20354A',
                    backgroundColor: '#20354A',
                    fontSize: '0.84rem',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  <Edit2 size={14} /> Edit Structure
                </button>
                <button
                  onClick={() => setInspectingStructure(null)}
                  style={{
                    padding: '7px 16px',
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

      {/* Duplicate Modal */}
      {duplicatingStructure && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
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
              borderRadius: '12px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
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
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#20354A' }}>
                  Duplicate Fee Structure
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#647F99' }}>
                  Clone fee plan and installment schedule to another session
                </span>
              </div>
              <button
                onClick={() => setDuplicatingStructure(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#647F99' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleDuplicateSubmit} style={{ padding: '20px' }}>
              {duplicateError && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '6px',
                    color: '#991B1B',
                    fontSize: '0.82rem',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={15} />
                  <span>{duplicateError}</span>
                </div>
              )}

              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '16px',
                  fontSize: '0.82rem',
                  color: '#475569',
                }}
              >
                Cloning <strong>{duplicatingStructure.name}</strong> ({duplicatingStructure.className}) with{' '}
                <strong>{duplicatingStructure.categories?.length || 0} categories</strong> totaling{' '}
                <strong>{formatCurrency(duplicatingStructure.totalAmount)}</strong>.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#20354A',
                      marginBottom: '6px',
                    }}
                  >
                    Target Academic Year *
                  </label>
                  <input
                    type="text"
                    required
                    value={duplicateYear}
                    onChange={(e) => {
                      const yr = e.target.value;
                      setDuplicateYear(yr);
                      setDuplicateName(`${duplicatingStructure.className} Standard Fee ${yr}`);
                    }}
                    placeholder="e.g. 2027-2028"
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
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#20354A',
                      marginBottom: '6px',
                    }}
                  >
                    New Structure Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={duplicateName}
                    onChange={(e) => setDuplicateName(e.target.value)}
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
                  marginTop: '20px',
                  paddingTop: '14px',
                  borderTop: '1px solid #E2E8F0',
                }}
              >
                <button
                  type="button"
                  onClick={() => setDuplicatingStructure(null)}
                  style={{
                    padding: '7px 14px',
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
                  disabled={duplicating}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#20354A',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  {duplicating && <RotateCw className="animate-spin" size={14} />} Duplicate Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Fee Structure Modal */}
      {isModalOpen && (
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
              maxWidth: '780px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Header */}
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
                <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 700, color: '#20354A' }}>
                  {editingStructure ? 'Edit Fee Structure' : 'Create Fee Structure'}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#647F99' }}>
                  Configure class fees, category breakdown, installment schedule and late penalties
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#647F99' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} style={{ padding: '24px' }}>
              {/* Financial edit locking banner */}
              {editingStructure && editUsage?.canEditFinancials === false && (
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    borderRadius: '8px',
                    color: '#92400E',
                    fontSize: '0.82rem',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Financial Terms Locked: </strong>
                    Invoices ({editUsage.invoicesCount}) have already been generated against this structure.
                    To preserve historical financial records, category amounts and installment schedules
                    cannot be modified. You may update the name, description, and active status.
                  </div>
                </div>
              )}

              {modalError && (
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
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #BBF7D0',
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
                  <span>{modalSuccess}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Meta details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#20354A',
                        marginBottom: '6px',
                      }}
                    >
                      Structure Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Class 10 Standard Fee 2026-2027"
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

                  <div style={{ gridColumn: 'span 2' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#20354A',
                        marginBottom: '6px',
                      }}
                    >
                      Description / Terms
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="e.g. Standard tuition and activity fee for senior secondary"
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
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#20354A',
                        marginBottom: '6px',
                      }}
                    >
                      Academic Year *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!editingStructure}
                      value={formData.academicYear}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.88rem',
                        backgroundColor: editingStructure ? '#F1F5F9' : '#ffffff',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#20354A',
                        marginBottom: '6px',
                      }}
                    >
                      Applicable Class *
                    </label>
                    <select
                      disabled={!!editingStructure && editUsage?.canEditFinancials === false}
                      value={formData.className}
                      onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.88rem',
                        boxSizing: 'border-box',
                        backgroundColor: editingStructure && editUsage?.canEditFinancials === false ? '#F1F5F9' : '#ffffff',
                      }}
                    >
                      {classList.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#20354A',
                        marginBottom: '6px',
                      }}
                    >
                      Section
                    </label>
                    <input
                      type="text"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      placeholder="ALL or specific section"
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
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#20354A',
                        marginBottom: '6px',
                      }}
                    >
                      Payment Frequency *
                    </label>
                    <select
                      disabled={editingStructure ? editUsage?.canEditFinancials === false : false}
                      value={formData.paymentFrequency}
                      onChange={(e) =>
                        setFormData({ ...formData, paymentFrequency: e.target.value as PaymentFrequency })
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.88rem',
                        boxSizing: 'border-box',
                        backgroundColor:
                          editingStructure && editUsage?.canEditFinancials === false
                            ? '#F1F5F9'
                            : '#ffffff',
                      }}
                    >
                      <option value="ANNUAL">Annual (Single Payment)</option>
                      <option value="TERM">Term-wise (e.g. 2 or 3 terms)</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="CUSTOM">Custom Schedule</option>
                    </select>
                  </div>
                </div>

                {/* Categories Row Builder */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <div>
                      <label style={{ fontSize: '0.86rem', fontWeight: 700, color: '#20354A' }}>
                        Fee Categories Breakdown *
                      </label>
                      <span style={{ fontSize: '0.74rem', color: '#647F99', marginLeft: '6px' }}>
                        Select from active categories
                      </span>
                    </div>

                    {(!editingStructure || editUsage?.canEditFinancials !== false) && (
                      <button
                        type="button"
                        onClick={handleAddCategoryRow}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          backgroundColor: '#EEF3F8',
                          color: '#20354A',
                          border: '1px solid #CBD5E1',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        + Add Category Row
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {formData.categories.map((catRow, idx) => {
                      const isLocked = Boolean(
                        editingStructure && editUsage?.canEditFinancials === false
                      );

                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1.3fr 1fr 36px',
                            gap: '10px',
                            alignItems: 'center',
                          }}
                        >
                          <select
                            disabled={isLocked}
                            value={catRow.categoryId}
                            onChange={(e) => handleCategoryChange(idx, e.target.value)}
                            style={{
                              padding: '7px 10px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.84rem',
                              backgroundColor: isLocked ? '#F1F5F9' : '#ffffff',
                            }}
                          >
                            {availableCategories.map((c) => {
                              const isAlreadyChosen = formData.categories.some(
                                (other, oIdx) => other.categoryId === c.id && oIdx !== idx
                              );
                              return (
                                <option key={c.id} value={c.id} disabled={isAlreadyChosen}>
                                  {c.name} ({c.code}) {isAlreadyChosen ? '(Added)' : ''}
                                </option>
                              );
                            })}
                          </select>

                          <div style={{ position: 'relative' }}>
                            <span
                              style={{
                                position: 'absolute',
                                left: '10px',
                                top: '7px',
                                fontSize: '0.84rem',
                                color: '#647F99',
                              }}
                            >
                              ₹
                            </span>
                            <input
                              type="number"
                              min="0"
                              disabled={isLocked}
                              placeholder="Amount"
                              value={catRow.amount || ''}
                              onChange={(e) =>
                                handleCategoryAmountChange(idx, Number(e.target.value))
                              }
                              style={{
                                width: '100%',
                                padding: '7px 10px 7px 24px',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.84rem',
                                boxSizing: 'border-box',
                                backgroundColor: isLocked ? '#F1F5F9' : '#ffffff',
                              }}
                            />
                          </div>

                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleCategoryMandatoryToggle(idx)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid',
                              borderColor: catRow.isMandatory ? '#BBF7D0' : '#BFDBFE',
                              backgroundColor: catRow.isMandatory ? '#F0FDF4' : '#EFF6FF',
                              color: catRow.isMandatory ? '#166534' : '#1D4ED8',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: isLocked ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                            }}
                          >
                            {catRow.isMandatory ? 'Mandatory' : 'Optional'}
                          </button>

                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleRemoveCategoryRow(idx)}
                            style={{
                              padding: '6px',
                              borderRadius: '4px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              cursor: isLocked ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Live calculations summary */}
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '12px 16px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem' }}>
                      <span style={{ color: '#166534' }}>
                        Mandatory: <strong>{formatCurrency(calculatedMandatoryTotal)}</strong>
                      </span>
                      {calculatedOptionalTotal > 0 && (
                        <span style={{ color: '#1D4ED8' }}>
                          Optional: <strong>{formatCurrency(calculatedOptionalTotal)}</strong>
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#20354A' }}>
                      Grand Total Fee: {formatCurrency(calculatedGrandTotal)}
                    </div>
                  </div>
                </div>

                {/* Installment Plan Builder */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <label style={{ fontSize: '0.86rem', fontWeight: 700, color: '#20354A', display: 'block' }}>
                        Installment Schedule *
                      </label>
                      <span style={{ fontSize: '0.74rem', color: '#647F99' }}>
                        Total installments must exactly equal {formatCurrency(calculatedGrandTotal)}
                      </span>
                    </div>

                    {(!editingStructure || editUsage?.canEditFinancials !== false) && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleAutoDistributeInstallments(1, 'Annual')}
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.74rem',
                            backgroundColor: '#ffffff',
                            border: '1px solid #CBD5E1',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          1 Annual
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAutoDistributeInstallments(2, 'Term')}
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.74rem',
                            backgroundColor: '#ffffff',
                            border: '1px solid #CBD5E1',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          2 Terms
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAutoDistributeInstallments(4, 'Quarter')}
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.74rem',
                            backgroundColor: '#ffffff',
                            border: '1px solid #CBD5E1',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          4 Quarters
                        </button>
                        <button
                          type="button"
                          onClick={handleAddInstallmentRow}
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            backgroundColor: '#EEF3F8',
                            color: '#20354A',
                            border: '1px solid #CBD5E1',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          + Add Row
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {formData.installments.map((instRow, idx) => {
                      const isLocked = Boolean(
                        editingStructure && editUsage?.canEditFinancials === false
                      );

                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1.5fr 1.2fr 1.3fr 36px',
                            gap: '10px',
                            alignItems: 'center',
                          }}
                        >
                          <input
                            type="text"
                            disabled={isLocked}
                            placeholder="e.g. Term 1 Fee"
                            value={instRow.name}
                            onChange={(e) => handleInstallmentChange(idx, 'name', e.target.value)}
                            style={{
                              padding: '7px 10px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.84rem',
                              backgroundColor: isLocked ? '#F1F5F9' : '#ffffff',
                            }}
                          />

                          <input
                            type="date"
                            disabled={isLocked}
                            value={instRow.dueDate}
                            onChange={(e) => handleInstallmentChange(idx, 'dueDate', e.target.value)}
                            style={{
                              padding: '7px 10px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.84rem',
                              backgroundColor: isLocked ? '#F1F5F9' : '#ffffff',
                            }}
                          />

                          <div style={{ position: 'relative' }}>
                            <span
                              style={{
                                position: 'absolute',
                                left: '10px',
                                top: '7px',
                                fontSize: '0.84rem',
                                color: '#647F99',
                              }}
                            >
                              ₹
                            </span>
                            <input
                              type="number"
                              min="0"
                              disabled={isLocked}
                              placeholder="Amount"
                              value={instRow.amount || ''}
                              onChange={(e) =>
                                handleInstallmentChange(idx, 'amount', Number(e.target.value))
                              }
                              style={{
                                width: '100%',
                                padding: '7px 10px 7px 24px',
                                borderRadius: '6px',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.84rem',
                                boxSizing: 'border-box',
                                backgroundColor: isLocked ? '#F1F5F9' : '#ffffff',
                              }}
                            />
                          </div>

                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleRemoveInstallmentRow(idx)}
                            style={{
                              padding: '6px',
                              borderRadius: '4px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              cursor: isLocked ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      marginTop: '10px',
                      padding: '10px 14px',
                      backgroundColor:
                        Math.abs(calculatedTotalInstallments - calculatedGrandTotal) < 0.01
                          ? '#DCFCE7'
                          : '#FEF2F2',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.84rem',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>
                      Allocated Installments: {formatCurrency(calculatedTotalInstallments)} /{' '}
                      {formatCurrency(calculatedGrandTotal)}
                    </span>
                    <span
                      style={{
                        fontWeight: 700,
                        color:
                          Math.abs(calculatedTotalInstallments - calculatedGrandTotal) < 0.01
                            ? '#16A34A'
                            : '#DC2626',
                      }}
                    >
                      {Math.abs(calculatedTotalInstallments - calculatedGrandTotal) < 0.01
                        ? '✓ Balanced'
                        : `Difference: ${formatCurrency(
                            Math.abs(calculatedTotalInstallments - calculatedGrandTotal)
                          )}`}
                    </span>
                  </div>
                </div>

                {/* Late Fee Rule */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="checkbox"
                      id="lateFeeToggle"
                      checked={formData.lateFeeRule.enabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lateFeeRule: { ...formData.lateFeeRule, enabled: e.target.checked },
                        })
                      }
                    />
                    <label
                      htmlFor="lateFeeToggle"
                      style={{ fontSize: '0.86rem', fontWeight: 600, color: '#20354A', cursor: 'pointer' }}
                    >
                      Enable Late Fee Rule
                    </label>
                  </div>

                  {formData.lateFeeRule.enabled && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.78rem',
                            color: '#647F99',
                            marginBottom: '4px',
                          }}
                        >
                          Grace Days
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.lateFeeRule.gracePeriodDays}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              lateFeeRule: {
                                ...formData.lateFeeRule,
                                gracePeriodDays: Number(e.target.value),
                              },
                            })
                          }
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.84rem',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.78rem',
                            color: '#647F99',
                            marginBottom: '4px',
                          }}
                        >
                          Charge Type
                        </label>
                        <select
                          value={formData.lateFeeRule.feeType}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              lateFeeRule: {
                                ...formData.lateFeeRule,
                                feeType: e.target.value as 'FIXED' | 'DAILY',
                              },
                            })
                          }
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.84rem',
                            backgroundColor: '#ffffff',
                            boxSizing: 'border-box',
                          }}
                        >
                          <option value="DAILY">Daily Charge</option>
                          <option value="FIXED">One-Time Fixed Charge</option>
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.78rem',
                            color: '#647F99',
                            marginBottom: '4px',
                          }}
                        >
                          Charge Amount (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.lateFeeRule.amount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              lateFeeRule: {
                                ...formData.lateFeeRule,
                                amount: Number(e.target.value),
                              },
                            })
                          }
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.84rem',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#20354A' }}>
                    Structure Status:
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as FeeStructureStatus })
                    }
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.84rem',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="ACTIVE">Active (Available for Assignment)</option>
                    <option value="INACTIVE">Inactive (Archived)</option>
                  </select>
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
                  onClick={() => setIsModalOpen(false)}
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
                  disabled={saving}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#20354A',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {saving && <RotateCw className="animate-spin" size={14} />}
                  {editingStructure ? 'Save Changes' : 'Create Fee Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Safe Deletion Modal */}
      {deletingStructure && (
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
              border: '1px solid #E2E8F0',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#20354A' }}>
                    Delete Fee Structure
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#647F99' }}>
                    {deletingStructure.name} • {deletingStructure.academicYear}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setDeletingStructure(null);
                  setDeleteUsage(null);
                  setDeleteError(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#647F99',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {deleteError && (
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '6px',
                    color: '#DC2626',
                    fontSize: '0.84rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{deleteError}</span>
                </div>
              )}

              {loadingDeleteUsage ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#647F99', fontSize: '0.86rem' }}>
                  <RotateCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  <span>Checking financial ledger dependencies...</span>
                </div>
              ) : deleteUsage && (deleteUsage.assignmentsCount > 0 || deleteUsage.invoicesCount > 0) ? (
                <div>
                  <div
                    style={{
                      padding: '14px 16px',
                      backgroundColor: '#FEF3C7',
                      border: '1px solid #FDE68A',
                      borderRadius: '8px',
                      color: '#92400E',
                      fontSize: '0.86rem',
                      lineHeight: 1.5,
                      marginBottom: '16px',
                      display: 'flex',
                      gap: '12px',
                    }}
                  >
                    <ShieldAlert size={22} style={{ flexShrink: 0, marginTop: '2px', color: '#D97706' }} />
                    <div>
                      <strong>Permanent Deletion Blocked:</strong>
                      <p style={{ margin: '6px 0 0' }}>
                        This fee structure is actively referenced by{' '}
                        <strong>{deleteUsage.assignmentsCount} student fee assignment(s)</strong> and{' '}
                        <strong>{deleteUsage.invoicesCount} generated invoice(s)</strong>.
                      </p>
                      <p style={{ margin: '6px 0 0' }}>
                        To protect audit integrity and preserve historical billing records, structures with active financial linkages cannot be permanently deleted. You can safely deactivate this structure instead so no new students can be assigned.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingStructure(null);
                        setDeleteUsage(null);
                        setDeleteError(null);
                      }}
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
                      Close
                    </button>
                    {deletingStructure.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const struct = deletingStructure;
                          setDeletingStructure(null);
                          setDeleteUsage(null);
                          await handleToggleStatus(struct);
                        }}
                        style={{
                          padding: '8px 18px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#D97706',
                          fontSize: '0.86rem',
                          fontWeight: 600,
                          color: '#ffffff',
                          cursor: 'pointer',
                        }}
                      >
                        Deactivate Structure Instead
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, margin: '0 0 16px' }}>
                    Are you sure you want to permanently delete{' '}
                    <strong>"{deletingStructure.name}"</strong>?
                  </p>
                  <div
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '0.82rem',
                      color: '#647F99',
                      marginBottom: '20px',
                    }}
                  >
                    <div>• <strong>Class:</strong> {deletingStructure.className} ({deletingStructure.section || 'ALL'})</div>
                    <div>• <strong>Academic Year:</strong> {deletingStructure.academicYear}</div>
                    <div>• <strong>Total Fee:</strong> {formatCurrency(deletingStructure.totalAmount)}</div>
                    <div>• <strong>Linked Records:</strong> 0 student assignments, 0 invoices</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => {
                        setDeletingStructure(null);
                        setDeleteUsage(null);
                        setDeleteError(null);
                      }}
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
                      type="button"
                      disabled={deleting}
                      onClick={handleConfirmDelete}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#DC2626',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: '#ffffff',
                        cursor: deleting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {deleting ? (
                        <>
                          <RotateCw size={14} className="animate-spin" /> Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 size={14} /> Confirm & Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
