import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  RotateCw,
  Edit2,
  CheckCircle,
  XCircle,
  X,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { adminFeeApi } from '../../../api/adminFeeApi';
import {
  FeeConcession,
  ConcessionType,
  ConcessionStatus,
} from '../../../types/adminFee.types';

export const FeeConcessionsTab: React.FC = () => {
  const [concessions, setConcessions] = useState<FeeConcession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingConcession, setEditingConcession] = useState<FeeConcession | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    discountType: 'PERCENTAGE' as ConcessionType,
    value: 10,
    description: '',
    status: 'ACTIVE' as ConcessionStatus,
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchConcessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFeeApi.getConcessions(
        statusFilter !== 'ALL' ? statusFilter : undefined
      );
      if (res.success && res.data) {
        setConcessions(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load fee concessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConcessions();
  }, [statusFilter]);

  const handleOpenCreate = () => {
    setEditingConcession(null);
    setFormData({
      name: '',
      code: '',
      discountType: 'PERCENTAGE',
      value: 10,
      description: '',
      status: 'ACTIVE',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (conc: FeeConcession) => {
    setEditingConcession(conc);
    setFormData({
      name: conc.name,
      code: conc.code,
      discountType: conc.discountType,
      value: conc.value,
      description: conc.description || '',
      status: conc.status,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setModalError('Concession name and code are required.');
      return;
    }

    if (formData.value <= 0) {
      setModalError('Discount value must be greater than zero.');
      return;
    }

    if (formData.discountType === 'PERCENTAGE' && formData.value > 100) {
      setModalError('Percentage discount cannot exceed 100%.');
      return;
    }

    try {
      setSaving(true);
      setModalError(null);

      if (editingConcession) {
        await adminFeeApi.updateConcession(editingConcession.id, {
          name: formData.name.trim(),
          discountType: formData.discountType,
          value: Number(formData.value),
          description: formData.description.trim(),
          status: formData.status,
        });
      } else {
        await adminFeeApi.createConcession({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          discountType: formData.discountType,
          value: Number(formData.value),
          description: formData.description.trim(),
          status: formData.status,
        });
      }

      setIsModalOpen(false);
      fetchConcessions();
    } catch (err: any) {
      setModalError(err?.message || 'Failed to save fee concession.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (conc: FeeConcession) => {
    const newStatus: ConcessionStatus = conc.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminFeeApi.updateConcession(conc.id, { status: newStatus });
      fetchConcessions();
    } catch (err: any) {
      alert(err?.message || 'Failed to update concession status.');
    }
  };

  const filteredConcessions = concessions.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
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
              placeholder="Search concession name or code..."
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
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchConcessions}
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
            onClick={handleOpenCreate}
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
            }}
          >
            <Plus size={16} /> New Concession
          </button>
        </div>
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
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading fee concessions...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#DC2626' }}>{error}</div>
        ) : filteredConcessions.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <Tag size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>No fee concessions found.</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>
              Create discount rules like Sibling Discount, Staff Child, or Merit Scholarship.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Concession Name
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Code
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Discount Type
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Value
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Description
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
                {filteredConcessions.map((conc) => (
                  <tr key={conc.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: '#20354A',
                      }}
                    >
                      {conc.name}
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
                        }}
                      >
                        {conc.code}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#647F99' }}>
                      {conc.discountType}
                    </td>
                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: '#16A34A',
                      }}
                    >
                      {conc.discountType === 'PERCENTAGE' ? `${conc.value}%` : `₹${conc.value.toLocaleString('en-IN')}`}
                    </td>
                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: '0.82rem',
                        color: '#647F99',
                        maxWidth: '280px',
                      }}
                    >
                      {conc.description || '-'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          backgroundColor: conc.status === 'ACTIVE' ? '#DCFCE7' : '#F1F5F9',
                          color: conc.status === 'ACTIVE' ? '#16A34A' : '#647F99',
                        }}
                      >
                        {conc.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenEdit(conc)}
                          title="Edit Concession"
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
                        <button
                          onClick={() => handleToggleStatus(conc)}
                          title={conc.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          style={{
                            padding: '6px',
                            borderRadius: '4px',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#ffffff',
                            color: conc.status === 'ACTIVE' ? '#DC2626' : '#16A34A',
                            cursor: 'pointer',
                          }}
                        >
                          {conc.status === 'ACTIVE' ? <XCircle size={14} /> : <CheckCircle size={14} />}
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
                backgroundColor: '#F8FAFC',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#20354A' }}>
                {editingConcession ? 'Edit Fee Concession' : 'Create New Fee Concession'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#647F99' }}
              >
                <X size={18} />
              </button>
            </div>

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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                    Concession Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sibling Discount, Staff Child"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    Concession Code *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingConcession}
                    placeholder="e.g. SIBLING10, SCHOLAR25"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                      backgroundColor: editingConcession ? '#F1F5F9' : '#ffffff',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                      Discount Type
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) =>
                        setFormData({ ...formData, discountType: e.target.value as ConcessionType })
                      }
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.86rem',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                      {formData.discountType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'} *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={formData.discountType === 'PERCENTAGE' ? 100 : undefined}
                      value={formData.value || ''}
                      onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
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
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Details about eligibility and criteria..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as ConcessionStatus })
                    }
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.86rem',
                      boxSizing: 'border-box',
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
                  {editingConcession ? 'Update Concession' : 'Create Concession'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
