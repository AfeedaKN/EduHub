import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  RotateCw,
  Plus,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { adminFeeApi } from '../../../api/adminFeeApi';
import { adminApi } from '../../../api/adminApi';
import {
  StudentFeeAssignment,
  FeeStructure,
  FeeConcession,
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
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Assign Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Assign Form
  const [selectedStructureId, setSelectedStructureId] = useState<string>('');
  const [selectedConcessionId, setSelectedConcessionId] = useState<string>('');
  const [concessionReason, setConcessionReason] = useState<string>('');
  const [targetStudentIds, setTargetStudentIds] = useState<string[]>([]);
  const [assignAllInClass, setAssignAllInClass] = useState<boolean>(true);

  const fetchDependencies = async () => {
    try {
      const [classRes, structRes, concRes] = await Promise.all([
        adminApi.getClasses(),
        adminFeeApi.getStructures({ academicYear: academicYear !== 'ALL' ? academicYear : undefined, status: 'ACTIVE' }),
        adminFeeApi.getConcessions('ACTIVE'),
      ]);

      if (classRes.success && classRes.data) {
        const uniqueClasses = Array.from(new Set(classRes.data.map((c: any) => c.name)));
        setClassList(uniqueClasses);
        if (uniqueClasses.length > 0 && selectedClass === 'ALL') {
          setSelectedClass(uniqueClasses[0]);
        }
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
  }, [academicYear, selectedClass, selectedSection]);

  const formatCurrency = (val: number = 0) => `₹${val.toLocaleString('en-IN')}`;

  const assignedStudentIds = new Set(assignments.map((a) => a.studentId));

  const handleOpenAssignModal = () => {
    const relevantStructures = structures.filter(
      (s) => selectedClass === 'ALL' || s.className === selectedClass
    );
    setSelectedStructureId(relevantStructures[0]?.id || '');
    setSelectedConcessionId('');
    setConcessionReason('');
    setTargetStudentIds([]);
    setAssignAllInClass(true);
    setModalError(null);
    setModalSuccess(null);
    setIsModalOpen(true);
  };

  const handleToggleStudentSelection = (id: string) => {
    if (targetStudentIds.includes(id)) {
      setTargetStudentIds(targetStudentIds.filter((sId) => sId !== id));
    } else {
      setTargetStudentIds([...targetStudentIds, id]);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStructureId) {
      setModalError('Please select a fee structure to assign.');
      return;
    }

    const structure = structures.find((s) => s.id === selectedStructureId);
    if (!structure) {
      setModalError('Selected fee structure not found.');
      return;
    }

    let finalStudentIds: string[] | undefined = undefined;
    if (!assignAllInClass) {
      if (targetStudentIds.length === 0) {
        setModalError('Please select at least one student or choose "Assign to all in class".');
        return;
      }
      finalStudentIds = targetStudentIds;
    }

    try {
      setSaving(true);
      setModalError(null);

      const res = await adminFeeApi.assignFees({
        feeStructureId: selectedStructureId,
        academicYear: academicYear !== 'ALL' ? academicYear : structure.academicYear,
        className: structure.className,
        studentIds: finalStudentIds,
        concessionId: selectedConcessionId || undefined,
        concessionReason: concessionReason.trim() || undefined,
      });

      if (res.success) {
        setModalSuccess(
          `Successfully assigned fee structure to ${res.data.assignedCount} student(s). (${res.data.skippedCount} already assigned/skipped)`
        );
        setTimeout(() => {
          setIsModalOpen(false);
          fetchAssignmentsAndStudents();
        }, 1200);
      }
    } catch (err: any) {
      setModalError(err?.message || 'Failed to assign fee structure.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filters Bar */}
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
              maxWidth: '300px',
            }}
          >
            <Search size={16} style={{ color: '#647F99' }} />
            <input
              type="text"
              placeholder="Search student or admission #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAssignmentsAndStudents()}
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
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchAssignmentsAndStudents}
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
            onClick={handleOpenAssignModal}
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
            <Plus size={16} /> Assign Fee Structure
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            fontSize: '0.84rem',
            color: '#20354A',
          }}
        >
          <strong>Total Enrolled Students:</strong> {enrolledStudents.length}
        </div>
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#DCFCE7',
            borderRadius: '8px',
            border: '1px solid #BBF7D0',
            fontSize: '0.84rem',
            color: '#16A34A',
          }}
        >
          <strong>Fees Assigned:</strong> {assignments.length}
        </div>
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#FEF3C7',
            borderRadius: '8px',
            border: '1px solid #FDE68A',
            fontSize: '0.84rem',
            color: '#D97706',
          }}
        >
          <strong>Pending Fee Assignment:</strong> {Math.max(0, enrolledStudents.length - assignments.length)}
        </div>
      </div>

      {/* Assignments Table */}
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
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading fee assignments...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#DC2626' }}>{error}</div>
        ) : assignments.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <Users size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>
              No fee assignments found for this class and year.
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>
              Click "Assign Fee Structure" to assign fees to enrolled students.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Student Name
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Admission #
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Class / Sec
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Assigned Structure
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Base Fee
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Concession
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Net Payable
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Installments
                  </th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#647F99' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((asgn) => {
                  const paidCount = asgn.installments.filter((i) => i.status === 'PAID').length;
                  return (
                    <tr key={asgn.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: '#20354A',
                        }}
                      >
                        {asgn.studentName}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#647F99' }}>
                        {asgn.admissionNumber}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#20354A' }}>
                        {asgn.className} {asgn.section ? `(${asgn.section})` : ''}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.84rem', color: '#20354A' }}>
                        {asgn.feeStructureName}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.88rem', color: '#647F99' }}>
                        {formatCurrency(asgn.baseAmount)}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.84rem' }}>
                        {asgn.concessionAmount > 0 ? (
                          <span style={{ color: '#16A34A', fontWeight: 600 }}>
                            -{formatCurrency(asgn.concessionAmount)}
                            {asgn.concessionName ? ` (${asgn.concessionName})` : ''}
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>None</span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#20354A',
                        }}
                      >
                        {formatCurrency(asgn.netPayable)}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '0.82rem' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: paidCount === asgn.installments.length ? '#DCFCE7' : '#EEF3F8',
                            color: paidCount === asgn.installments.length ? '#16A34A' : '#20354A',
                            fontWeight: 600,
                          }}
                        >
                          {paidCount} / {asgn.installments.length} paid
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            backgroundColor: asgn.status === 'ACTIVE' ? '#DCFCE7' : '#F1F5F9',
                            color: asgn.status === 'ACTIVE' ? '#16A34A' : '#647F99',
                          }}
                        >
                          {asgn.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
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
              maxWidth: '650px',
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
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#20354A' }}>
                  Assign Fee Structure to Students
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#647F99' }}>
                  Assign tuition and fee schedules to officially enrolled active students
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#647F99' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} style={{ padding: '24px' }}>
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
                {/* Select Structure */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                    Fee Structure *
                  </label>
                  <select
                    required
                    value={selectedStructureId}
                    onChange={(e) => setSelectedStructureId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option value="">-- Choose Structure --</option>
                    {structures.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.className} • {formatCurrency(s.totalAmount)} • {s.academicYear})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Concession Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#20354A', marginBottom: '6px' }}>
                      Apply Concession / Scholarship (Optional)
                    </label>
                    <select
                      value={selectedConcessionId}
                      onChange={(e) => setSelectedConcessionId(e.target.value)}
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
                      Concession Reason / Remark
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sibling discount approved"
                      value={concessionReason}
                      onChange={(e) => setConcessionReason(e.target.value)}
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

                {/* Assignment Target */}
                <div style={{ padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#20354A', marginBottom: '10px' }}>
                    Student Target Selection
                  </label>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="assignTarget"
                        checked={assignAllInClass}
                        onChange={() => setAssignAllInClass(true)}
                      />
                      Assign to all active enrolled students in this class ({enrolledStudents.length} students)
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
                        maxHeight: '180px',
                        overflowY: 'auto',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        padding: '8px 12px',
                      }}
                    >
                      {enrolledStudents.map((stu) => {
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
                              <span style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 600 }}>Already Assigned</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
