import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  RotateCw,
  Edit2,
  CheckCircle,
  XCircle,
  X,
  Layers,
  AlertCircle,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { adminFeeApi } from '../../../api/adminFeeApi';
import {
  FeeCategory,
  FeeCategoryType,
  FeeNature,
  FeeCategoryStatus,
  CategoryUsageResult,
} from '../../../types/adminFee.types';

export const FeeCategoriesTab: React.FC = () => {
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<FeeCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    categoryType: 'ACADEMIC' as FeeCategoryType,
    feeNature: 'RECURRING' as FeeNature,
    isMandatory: true,
    isRefundable: false,
    status: 'ACTIVE' as FeeCategoryStatus,
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // View Details Modal State
  const [viewingCategory, setViewingCategory] = useState<FeeCategory | null>(null);
  const [categoryUsage, setCategoryUsage] = useState<CategoryUsageResult | null>(null);
  const [loadingUsage, setLoadingUsage] = useState<boolean>(false);

  // Deactivation Guard Warning
  const [deactivationWarning, setDeactivationWarning] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFeeApi.getCategories(
        statusFilter !== 'ALL' ? statusFilter : undefined
      );
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load fee categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [statusFilter]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      categoryType: 'ACADEMIC',
      feeNature: 'RECURRING',
      isMandatory: true,
      isRefundable: false,
      status: 'ACTIVE',
    });
    setModalError(null);
    setModalSuccess(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: FeeCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      code: cat.code,
      description: cat.description || '',
      categoryType: cat.categoryType,
      feeNature: cat.feeNature,
      isMandatory: cat.isMandatory !== undefined ? cat.isMandatory : true,
      isRefundable: cat.isRefundable !== undefined ? cat.isRefundable : false,
      status: cat.status,
    });
    setModalError(null);
    setModalSuccess(null);
    setIsModalOpen(true);
  };

  const handleOpenViewDetails = async (cat: FeeCategory) => {
    setViewingCategory(cat);
    setCategoryUsage(null);
    try {
      setLoadingUsage(true);
      const res = await adminFeeApi.getCategoryUsage(cat.id);
      if (res.success && res.data) {
        setCategoryUsage(res.data);
      }
    } catch (err) {
      console.error('Failed to load category usage:', err);
    } finally {
      setLoadingUsage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setModalError('Category name and code are required.');
      return;
    }

    try {
      setSaving(true);
      setModalError(null);

      if (editingCategory) {
        const res = await adminFeeApi.updateCategory(editingCategory.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          categoryType: formData.categoryType,
          feeNature: formData.feeNature,
          isMandatory: formData.isMandatory,
          isRefundable: formData.isRefundable,
          status: formData.status,
        });
        if (res.success) {
          setModalSuccess('Category updated successfully!');
          setTimeout(() => {
            setIsModalOpen(false);
            fetchCategories();
          }, 800);
        }
      } else {
        const res = await adminFeeApi.createCategory({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim(),
          categoryType: formData.categoryType,
          feeNature: formData.feeNature,
          isMandatory: formData.isMandatory,
          isRefundable: formData.isRefundable,
          status: formData.status,
        });
        if (res.success) {
          setModalSuccess('New category created successfully!');
          setTimeout(() => {
            setIsModalOpen(false);
            fetchCategories();
          }, 800);
        }
      }
    } catch (err: any) {
      setModalError(err?.message || 'Failed to save fee category.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (cat: FeeCategory) => {
    const newStatus: FeeCategoryStatus = cat.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setDeactivationWarning(null);

    try {
      await adminFeeApi.updateCategory(cat.id, { status: newStatus });
      fetchCategories();
    } catch (err: any) {
      // Catch safety check error explaining why deactivation is prevented
      setDeactivationWarning(
        err?.message ||
          `Cannot deactivate '${cat.name}'. It may be in use by active fee structures.`
      );
    }
  };

  const filteredCategories = categories.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr.slice(0, 10);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Heading & Short Description */}
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
              Master Fee Roster
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>•</span>
            <span style={{ fontSize: '0.8rem', color: '#647F99' }}>Financial Definitions</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#20354A' }}>
            Fee Categories
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#647F99', maxWidth: '850px' }}>
            Configure and manage reusable fee heads for academic tuition, examinations, transportation, facilities, and activities. Categories define school fees across fee structures without assigning direct balances.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
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
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          <Plus size={16} /> New Category
        </button>
      </div>

      {/* Safety / Deactivation Warning Banner */}
      {deactivationWarning && (
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            color: '#991B1B',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <strong>Action Prevented: </strong>
            <span>{deactivationWarning}</span>
          </div>
          <button
            onClick={() => setDeactivationWarning(null)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#991B1B',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#ffffff',
          padding: '14px 20px',
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
              maxWidth: '360px',
            }}
          >
            <Search size={16} style={{ color: '#647F99' }} />
            <input
              type="text"
              placeholder="Search category name or code..."
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#647F99' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
              <option value="ALL">All Categories</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchCategories}
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
          <RotateCw size={14} /> Refresh Roster
        </button>
      </div>

      {/* Table Card */}
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
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading fee categories...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#DC2626' }}>{error}</div>
        ) : filteredCategories.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <Layers size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>No fee categories found.</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>
              Create categories such as Tuition Fee, Admission Fee, Laboratory Fee, Transport Fee.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Category Name
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Category Code
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Description
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Fee Type
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Mandatory / Optional
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Status
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Created Date
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
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: '#20354A',
                      }}
                    >
                      {cat.name}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.84rem' }}>
                      <span
                        style={{
                          backgroundColor: '#EEF3F8',
                          color: '#20354A',
                          fontWeight: 700,
                          fontSize: '0.76rem',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {cat.code}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: '0.82rem',
                        color: '#647F99',
                        maxWidth: '240px',
                      }}
                    >
                      {cat.description ? (
                        cat.description.length > 55
                          ? `${cat.description.slice(0, 55)}...`
                          : cat.description
                      ) : (
                        <span style={{ color: '#CBD5E1' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.84rem' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          backgroundColor:
                            cat.feeNature === 'RECURRING' ? '#E0F2FE' : '#FEF3C7',
                          color: cat.feeNature === 'RECURRING' ? '#0284C7' : '#D97706',
                        }}
                      >
                        {cat.feeNature === 'RECURRING' ? 'Recurring' : 'One-time'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          backgroundColor: cat.isMandatory ? '#F0FDF4' : '#F8FAFC',
                          color: cat.isMandatory ? '#166534' : '#647F99',
                          border: cat.isMandatory ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                        }}
                      >
                        {cat.isMandatory ? 'Mandatory' : 'Optional'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          backgroundColor: cat.status === 'ACTIVE' ? '#DCFCE7' : '#F1F5F9',
                          color: cat.status === 'ACTIVE' ? '#16A34A' : '#647F99',
                        }}
                      >
                        {cat.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#647F99' }}>
                      {formatDate(cat.createdAt)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {/* View Details */}
                        <button
                          onClick={() => handleOpenViewDetails(cat)}
                          title="View Category Details"
                          style={{
                            padding: '6px',
                            borderRadius: '4px',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#ffffff',
                            color: '#20354A',
                            cursor: 'pointer',
                          }}
                        >
                          <Eye size={14} />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          title="Edit Category"
                          style={{
                            padding: '6px',
                            borderRadius: '4px',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#ffffff',
                            color: '#20354A',
                            cursor: 'pointer',
                          }}
                        >
                          <Edit2 size={14} />
                        </button>

                        {/* Toggle Status (Soft Deactivation) */}
                        <button
                          onClick={() => handleToggleStatus(cat)}
                          title={
                            cat.status === 'ACTIVE'
                              ? 'Deactivate Category (Soft)'
                              : 'Activate Category'
                          }
                          style={{
                            padding: '6px',
                            borderRadius: '4px',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#ffffff',
                            color: cat.status === 'ACTIVE' ? '#DC2626' : '#16A34A',
                            cursor: 'pointer',
                          }}
                        >
                          {cat.status === 'ACTIVE' ? (
                            <XCircle size={14} />
                          ) : (
                            <CheckCircle size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {viewingCategory && (
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
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
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
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#20354A' }}>
                  {viewingCategory.name}
                </h3>
                <span
                  style={{
                    backgroundColor: '#EEF3F8',
                    color: '#20354A',
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    marginTop: '4px',
                    display: 'inline-block',
                  }}
                >
                  Code: {viewingCategory.code}
                </span>
              </div>
              <button
                onClick={() => setViewingCategory(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#647F99' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Details Content */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '14px',
                  backgroundColor: '#F8FAFC',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <span style={{ color: '#647F99', display: 'block', fontSize: '0.78rem' }}>Fee Type</span>
                  <strong style={{ color: '#20354A' }}>
                    {viewingCategory.feeNature === 'RECURRING' ? 'Recurring Fee' : 'One-Time Charge'}
                  </strong>
                </div>

                <div>
                  <span style={{ color: '#647F99', display: 'block', fontSize: '0.78rem' }}>Category Classification</span>
                  <strong style={{ color: '#20354A' }}>{viewingCategory.categoryType}</strong>
                </div>

                <div>
                  <span style={{ color: '#647F99', display: 'block', fontSize: '0.78rem' }}>Requirement</span>
                  <strong style={{ color: viewingCategory.isMandatory ? '#166534' : '#647F99' }}>
                    {viewingCategory.isMandatory ? 'Mandatory for student' : 'Optional charge'}
                  </strong>
                </div>

                <div>
                  <span style={{ color: '#647F99', display: 'block', fontSize: '0.78rem' }}>Refund Policy</span>
                  <strong style={{ color: viewingCategory.isRefundable ? '#0284C7' : '#20354A' }}>
                    {viewingCategory.isRefundable ? 'Refundable' : 'Non-Refundable'}
                  </strong>
                </div>

                <div>
                  <span style={{ color: '#647F99', display: 'block', fontSize: '0.78rem' }}>Status</span>
                  <strong style={{ color: viewingCategory.status === 'ACTIVE' ? '#16A34A' : '#647F99' }}>
                    {viewingCategory.status}
                  </strong>
                </div>

                <div>
                  <span style={{ color: '#647F99', display: 'block', fontSize: '0.78rem' }}>Created Date</span>
                  <strong style={{ color: '#20354A' }}>{formatDate(viewingCategory.createdAt)}</strong>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.84rem', fontWeight: 700, color: '#20354A' }}>
                  Description / Purpose
                </h4>
                <p style={{ margin: 0, fontSize: '0.86rem', color: '#647F99', lineHeight: 1.5 }}>
                  {viewingCategory.description || 'No description entered for this category.'}
                </p>
              </div>

              {/* Fee Structures Usage Section */}
              <div
                style={{
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: '16px',
                }}
              >
                <h4 style={{ margin: '0 0 8px', fontSize: '0.86rem', fontWeight: 700, color: '#20354A' }}>
                  Fee Structures Usage
                </h4>

                {loadingUsage ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#647F99', fontSize: '0.82rem' }}>
                    <RotateCw className="animate-spin" size={14} />
                    Checking structure references...
                  </div>
                ) : categoryUsage && categoryUsage.structures.length > 0 ? (
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#647F99' }}>
                      This category is currently referenced in{' '}
                      <strong>{categoryUsage.structures.length}</strong> fee structure(s):
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {categoryUsage.structures.map((s) => (
                        <div
                          key={s.id}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#F8FAFC',
                            borderRadius: '6px',
                            border: '1px solid #E2E8F0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.82rem',
                          }}
                        >
                          <div>
                            <strong style={{ color: '#20354A' }}>{s.name}</strong>
                            <span style={{ color: '#647F99', marginLeft: '6px' }}>
                              ({s.className} • {s.academicYear})
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: s.status === 'ACTIVE' ? '#16A34A' : '#647F99',
                            }}
                          >
                            {s.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#647F99' }}>
                    This category is not currently attached to any active fee structures.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '14px 24px',
                borderTop: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
              }}
            >
              <button
                type="button"
                onClick={() => setViewingCategory(null)}
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
      )}

      {/* Create / Edit Modal */}
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
              maxWidth: '540px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
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
                  {editingCategory ? 'Edit Fee Category' : 'Create New Fee Category'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#647F99' }}>
                  Define reusable fee head characteristics and billing policies
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#647F99',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
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
                  <span>{modalSuccess}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tuition Fee, Admission Fee, Laboratory Fee"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      outline: 'none',
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
                    Category Code * (Unique Uppercase Code)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingCategory}
                    placeholder="e.g. TUITION, ADMISSION, LAB, TRANSPORT"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: editingCategory ? '#F1F5F9' : '#ffffff',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
                      Fee Type *
                    </label>
                    <select
                      value={formData.feeNature}
                      onChange={(e) =>
                        setFormData({ ...formData, feeNature: e.target.value as FeeNature })
                      }
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.86rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <option value="RECURRING">Recurring (Termly / Monthly)</option>
                      <option value="ONE_TIME">One-time Charge</option>
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
                      Classification
                    </label>
                    <select
                      value={formData.categoryType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          categoryType: e.target.value as FeeCategoryType,
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.86rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <option value="ACADEMIC">Academic</option>
                      <option value="TRANSPORT">Transport</option>
                      <option value="FACILITY">Facility / Lab</option>
                      <option value="ACTIVITY">Activity / Sports</option>
                      <option value="ADMINISTRATIVE">Administrative</option>
                      <option value="OTHER">Other Charges</option>
                    </select>
                  </div>
                </div>

                {/* Mandatory vs Optional & Refundable vs Non-refundable switches */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#20354A',
                        marginBottom: '6px',
                      }}
                    >
                      Requirement
                    </label>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="isMandatory"
                          checked={formData.isMandatory === true}
                          onChange={() => setFormData({ ...formData, isMandatory: true })}
                        />
                        Mandatory
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="isMandatory"
                          checked={formData.isMandatory === false}
                          onChange={() => setFormData({ ...formData, isMandatory: false })}
                        />
                        Optional
                      </label>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#20354A',
                        marginBottom: '6px',
                      }}
                    >
                      Refundability
                    </label>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="isRefundable"
                          checked={formData.isRefundable === false}
                          onChange={() => setFormData({ ...formData, isRefundable: false })}
                        />
                        Non-Refundable
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="isRefundable"
                          checked={formData.isRefundable === true}
                          onChange={() => setFormData({ ...formData, isRefundable: true })}
                        />
                        Refundable
                      </label>
                    </div>
                  </div>
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
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Details about what this fee covers..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.86rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical',
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
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as FeeCategoryStatus })
                    }
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.86rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
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
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
