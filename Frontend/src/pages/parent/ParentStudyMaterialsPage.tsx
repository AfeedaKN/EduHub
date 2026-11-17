import React, { useEffect, useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  RotateCw,
  FileText,
  Video,
  Link2,
  Download,
  ExternalLink,
  Eye,
  User,
  Calendar,
  AlertCircle,
  X,
  GraduationCap,
  ShieldAlert,
  FileCheck,
} from 'lucide-react';
import { ParentLayout } from '../../components/parent/ParentLayout';
import { parentStudyMaterialApi } from '../../api/studyMaterialApi';
import {
  ChildProfile,
  ParentStudyMaterialItem,
} from '../../types/studyMaterial.types';

export const ParentStudyMaterialsPage: React.FC = () => {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [materials, setMaterials] = useState<ParentStudyMaterialItem[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Preview Modal
  const [previewItem, setPreviewItem] = useState<ParentStudyMaterialItem | null>(null);

  // External Link Safety Modal
  const [externalLinkWarning, setExternalLinkWarning] = useState<string | null>(null);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await parentStudyMaterialApi.getStudyMaterials({
        studentId: selectedChildId || undefined,
        subject: selectedSubject !== 'ALL' ? selectedSubject : undefined,
        academicYear: selectedAcademicYear !== 'ALL' ? selectedAcademicYear : undefined,
        materialType: selectedType !== 'ALL' ? selectedType : undefined,
        search: searchTerm.trim() || undefined,
      });

      if (res.success && res.data) {
        setChildren(res.data.children || []);
        setMaterials(res.data.materials || []);
        setSubjects(res.data.subjects || []);
        setAcademicYears(res.data.academicYears || []);

        if (!selectedChildId && res.data.selectedChild) {
          setSelectedChildId(res.data.selectedChild.id);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load study materials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [selectedChildId, selectedSubject, selectedAcademicYear, selectedType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMaterials();
  };

  // Safe external link opener
  const handleOpenExternalLink = (url: string) => {
    setExternalLinkWarning(url);
  };

  const handleConfirmOpenExternal = () => {
    if (externalLinkWarning) {
      window.open(externalLinkWarning, '_blank', 'noopener,noreferrer');
      setExternalLinkWarning(null);
    }
  };

  // Helper to format bytes
  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return 'Resource';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Determine file badge label
  const getFileBadgeLabel = (item: ParentStudyMaterialItem) => {
    if (item.materialType === 'VIDEO') return 'Video Lesson';
    if (item.materialType === 'LINK') return 'Web Resource';
    if (item.fileName) {
      const ext = item.fileName.split('.').pop()?.toUpperCase();
      if (ext && ['PDF', 'DOC', 'DOCX', 'PPT', 'PPTX', 'TXT', 'PNG', 'JPG'].includes(ext)) {
        return ext;
      }
    }
    return 'Document';
  };

  // Selected child object
  const activeChild = useMemo(() => {
    return children.find((c) => c.id === selectedChildId) || null;
  }, [children, selectedChildId]);

  return (
    <ParentLayout pageTitle="Study Materials">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '8px 4px 40px' }}>
        {/* Header Banner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px',
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#20354A',
                  backgroundColor: '#EEF3F8',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}
              >
                Curriculum Resources
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>•</span>
              <span style={{ fontSize: '0.8rem', color: '#647F99' }}>Learning Portal</span>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#20354A', margin: 0 }}>
              Study Materials
            </h1>
            <p style={{ margin: '6px 0 0', color: '#647F99', fontSize: '0.92rem' }}>
              Access teacher-curated notes, worksheets, presentations, and educational links for your children.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchMaterials}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              color: '#334155',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#991B1B',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.9rem',
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>{error}</div>
            <button
              type="button"
              onClick={() => setError(null)}
              style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Child Selector Tabs */}
        {children.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              overflowX: 'auto',
              paddingBottom: '4px',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginRight: '4px' }}>
              Student:
            </div>
            {children.map((child) => {
              const isSelected = child.id === selectedChildId;
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setSelectedChildId(child.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #20354A' : '1px solid #CBD5E1',
                    backgroundColor: isSelected ? '#20354A' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#334155',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 2px 4px rgba(32,53,74,0.15)' : 'none',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <GraduationCap size={16} style={{ color: isSelected ? '#ffffff' : '#647F99' }} />
                  <span>{child.fullName}</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      opacity: isSelected ? 0.9 : 0.7,
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: isSelected ? '#ffffff' : '#475569',
                    }}
                  >
                    {child.grade} - {child.section}
                  </span>
                </button>
              );
            })}

            {children.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedChildId('ALL')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: selectedChildId === 'ALL' ? '2px solid #20354A' : '1px solid #CBD5E1',
                  backgroundColor: selectedChildId === 'ALL' ? '#20354A' : '#ffffff',
                  color: selectedChildId === 'ALL' ? '#ffffff' : '#334155',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>All Children</span>
              </button>
            )}
          </div>
        )}

        {/* Filter Controls Bar */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '16px 20px',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            marginBottom: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          {/* Search form */}
          <form
            onSubmit={handleSearchSubmit}
            style={{ flex: '1 1 220px', minWidth: '200px', position: 'relative' }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
              }}
            />
            <input
              type="text"
              placeholder="Search by topic, subject, teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
          </form>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '0.88rem',
              color: '#334155',
              backgroundColor: '#F8FAFC',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Academic Year Filter */}
          {academicYears.length > 0 && (
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.88rem',
                color: '#334155',
                backgroundColor: '#F8FAFC',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Academic Years</option>
              {academicYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          )}

          {/* Material Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '0.88rem',
              color: '#334155',
              backgroundColor: '#F8FAFC',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Resource Types</option>
            <option value="DOCUMENT">Documents / Notes</option>
            <option value="VIDEO">Videos</option>
            <option value="LINK">Web Links</option>
          </select>

          {(searchTerm || selectedSubject !== 'ALL' || selectedAcademicYear !== 'ALL' || selectedType !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedSubject('ALL');
                setSelectedAcademicYear('ALL');
                setSelectedType('ALL');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#647F99',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Reset
            </button>
          )}
        </div>

        {/* Content View */}
        {loading ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '60px 20px',
              textAlign: 'center',
              color: '#647F99',
            }}
          >
            <RotateCw size={32} className="animate-spin" style={{ margin: '0 auto 16px' }} />
            <div>Loading study materials for your student...</div>
          </div>
        ) : materials.length === 0 ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '60px 20px',
              textAlign: 'center',
            }}
          >
            <BookOpen size={48} style={{ color: '#94A3B8', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.15rem', color: '#20354A', margin: '0 0 8px' }}>
              No study materials available yet
            </h3>
            <p style={{ color: '#647F99', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto' }}>
              {activeChild
                ? `There are currently no published study materials for ${activeChild.fullName}'s class (${activeChild.grade} - ${activeChild.section}). When teachers publish notes or presentations, they will appear here.`
                : 'No study materials match your search or filter criteria.'}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '20px',
            }}
          >
            {materials.map((item) => {
              const isVideo = item.materialType === 'VIDEO';
              const isLink = item.materialType === 'LINK';
              const badgeLabel = getFileBadgeLabel(item);

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                  }}
                >
                  <div>
                    {/* Top Badges */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginBottom: '12px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: '6px',
                          backgroundColor: '#EEF3F8',
                          color: '#20354A',
                        }}
                      >
                        {item.subject}
                      </span>

                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: isVideo ? '#FEE2E2' : isLink ? '#DBEAFE' : '#DCFCE7',
                          color: isVideo ? '#B91C1C' : isLink ? '#1D4ED8' : '#15803D',
                        }}
                      >
                        {isVideo ? (
                          <Video size={13} />
                        ) : isLink ? (
                          <Link2 size={13} />
                        ) : (
                          <FileText size={13} />
                        )}
                        <span>{badgeLabel}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        margin: '0 0 8px',
                        fontSize: '1.08rem',
                        fontWeight: 700,
                        color: '#20354A',
                        lineHeight: 1.35,
                      }}
                    >
                      {item.title}
                    </h3>

                    {/* Description */}
                    {item.description && (
                      <p
                        style={{
                          margin: '0 0 14px',
                          fontSize: '0.85rem',
                          color: '#647F99',
                          lineHeight: 1.45,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.description}
                      </p>
                    )}

                    {/* Teacher & Date Metadata */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        padding: '10px 12px',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        fontSize: '0.8rem',
                        color: '#475569',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} style={{ color: '#647F99' }} />
                        <span>Teacher: <strong>{item.teacherName}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} style={{ color: '#647F99' }} />
                        <span>Uploaded: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                        {item.className} - {item.section} ({item.academicYear})
                      </div>
                    </div>
                  </div>

                  {/* Resource Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        backgroundColor: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        color: '#334155',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Eye size={15} />
                      <span>Details</span>
                    </button>

                    {/* Download or Open Link */}
                    {item.fileUrl ? (
                      <a
                        href={item.fileUrl}
                        download={item.fileName || 'study-material'}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          backgroundColor: '#20354A',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <Download size={15} />
                        <span>Download</span>
                      </a>
                    ) : item.externalUrl ? (
                      <button
                        type="button"
                        onClick={() => handleOpenExternalLink(item.externalUrl)}
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          backgroundColor: '#2563EB',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <ExternalLink size={15} />
                        <span>Open Link</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Details / Preview */}
        {previewItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '620px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#EEF3F8',
                      color: '#20354A',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      marginBottom: '6px',
                    }}
                  >
                    {previewItem.subject} • {previewItem.className} Section {previewItem.section}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#20354A', fontWeight: 700 }}>
                    {previewItem.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {previewItem.description && (
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    padding: '14px 16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '0.9rem',
                    color: '#334155',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5,
                  }}
                >
                  {previewItem.description}
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  backgroundColor: '#F1F5F9',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  color: '#475569',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <span style={{ color: '#647F99' }}>Faculty: </span>
                  <strong>{previewItem.teacherName}</strong>
                </div>
                <div>
                  <span style={{ color: '#647F99' }}>Uploaded On: </span>
                  <strong>{new Date(previewItem.createdAt).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span style={{ color: '#647F99' }}>Resource Type: </span>
                  <strong>{previewItem.materialType}</strong>
                </div>
                <div>
                  <span style={{ color: '#647F99' }}>Academic Year: </span>
                  <strong>{previewItem.academicYear}</strong>
                </div>
              </div>

              {/* Resource action */}
              <div
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '18px',
                  textAlign: 'center',
                  backgroundColor: '#FAFAFA',
                  marginBottom: '20px',
                }}
              >
                {previewItem.fileUrl ? (
                  <div>
                    <FileCheck size={36} style={{ color: '#059669', margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 600, color: '#20354A', fontSize: '0.92rem' }}>
                      {previewItem.fileName || 'Attached File'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#647F99', marginBottom: '14px' }}>
                      {formatFileSize(previewItem.fileSize)}
                    </div>
                    <a
                      href={previewItem.fileUrl}
                      download={previewItem.fileName || 'study-material'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '9px 20px',
                        backgroundColor: '#059669',
                        color: '#ffffff',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                      }}
                    >
                      <Download size={16} />
                      <span>Download File</span>
                    </a>
                  </div>
                ) : previewItem.externalUrl ? (
                  <div>
                    {previewItem.materialType === 'VIDEO' ? (
                      <Video size={36} style={{ color: '#DC2626', margin: '0 auto 8px' }} />
                    ) : (
                      <Link2 size={36} style={{ color: '#2563EB', margin: '0 auto 8px' }} />
                    )}
                    <div style={{ fontWeight: 600, color: '#20354A', fontSize: '0.92rem', marginBottom: '8px' }}>
                      External Learning Link
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenExternalLink(previewItem.externalUrl)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '9px 18px',
                        backgroundColor: '#20354A',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                      }}
                    >
                      <ExternalLink size={16} />
                      <span>Open Link Safely</span>
                    </button>
                  </div>
                ) : null}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Safe External Link Prompt */}
        {externalLinkWarning && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '460px',
                padding: '24px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <ShieldAlert size={22} />
              </div>

              <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', color: '#20354A', fontWeight: 700 }}>
                Open External Learning Link
              </h3>
              <p style={{ margin: '0 0 14px', fontSize: '0.88rem', color: '#647F99', lineHeight: 1.45 }}>
                You are about to visit an external educational link shared by the faculty member.
              </p>

              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.82rem',
                  color: '#1E293B',
                  wordBreak: 'break-all',
                  marginBottom: '20px',
                }}
              >
                {externalLinkWarning}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setExternalLinkWarning(null)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOpenExternal}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    backgroundColor: '#20354A',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <ExternalLink size={15} />
                  <span>Proceed to Link</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ParentLayout>
  );
};
