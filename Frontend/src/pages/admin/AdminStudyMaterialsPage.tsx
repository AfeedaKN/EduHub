import React, { useEffect, useState, useMemo } from 'react';
import {
  BookOpen,
  FileCheck,
  Clock,
  Users,
  Search,
  RotateCw,
  Eye,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Calendar,
  Video,
  Link2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminStudyMaterialApi } from '../../api/studyMaterialApi';
import {
  AdminStudyMaterialSummary,
  AdminStudyMaterialListItem,
  AdminStudyMaterialMetadata,
} from '../../types/studyMaterial.types';

export const AdminStudyMaterialsPage: React.FC = () => {
  // Academic Year State
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2026-2027');

  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Data States
  const [summary, setSummary] = useState<AdminStudyMaterialSummary>({
    totalMaterials: 0,
    publishedMaterials: 0,
    draftMaterials: 0,
    totalTeachersUploading: 0,
  });
  const [materials, setMaterials] = useState<AdminStudyMaterialListItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [metadata, setMetadata] = useState<AdminStudyMaterialMetadata>({
    academicYears: ['2026-2027'],
    teachers: [],
    classes: [],
    sections: [],
    subjects: [],
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Inspection Modal
  const [inspectingMaterial, setInspectingMaterial] = useState<AdminStudyMaterialListItem | null>(null);

  // Fetch Summary
  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      const res = await adminStudyMaterialApi.getSummary(
        selectedAcademicYear !== 'ALL' ? selectedAcademicYear : undefined
      );
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load summary stats:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Fetch Metadata
  const fetchMetadata = async () => {
    try {
      const res = await adminStudyMaterialApi.getMetadata(
        selectedAcademicYear !== 'ALL' ? selectedAcademicYear : undefined
      );
      if (res.success && res.data) {
        setMetadata(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load filters metadata:', err);
    }
  };

  // Fetch Materials List
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminStudyMaterialApi.getStudyMaterials({
        academicYear: selectedAcademicYear !== 'ALL' ? selectedAcademicYear : undefined,
        teacherId: selectedTeacherId !== 'ALL' ? selectedTeacherId : undefined,
        className: selectedClass !== 'ALL' ? selectedClass : undefined,
        section: selectedSection !== 'ALL' ? selectedSection : undefined,
        subject: selectedSubject !== 'ALL' ? selectedSubject : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        materialType: selectedType !== 'ALL' ? selectedType : undefined,
        search: searchTerm.trim() || undefined,
        page: currentPage,
        limit: pageSize,
      });

      if (res.success && res.data) {
        setMaterials(res.data.materials || []);
        setTotalCount(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load study materials.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [selectedAcademicYear]);

  useEffect(() => {
    fetchMaterials();
  }, [
    selectedAcademicYear,
    selectedTeacherId,
    selectedClass,
    selectedSection,
    selectedSubject,
    selectedStatus,
    selectedType,
    currentPage,
    pageSize,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMaterials();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedTeacherId('ALL');
    setSelectedClass('ALL');
    setSelectedSection('ALL');
    setSelectedSubject('ALL');
    setSelectedStatus('ALL');
    setSelectedType('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm.trim() !== '' ||
      selectedTeacherId !== 'ALL' ||
      selectedClass !== 'ALL' ||
      selectedSection !== 'ALL' ||
      selectedSubject !== 'ALL' ||
      selectedStatus !== 'ALL' ||
      selectedType !== 'ALL'
    );
  }, [searchTerm, selectedTeacherId, selectedClass, selectedSection, selectedSubject, selectedStatus, selectedType]);

  // Format bytes
  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return 'Resource Link';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Determine file badge label
  const getFileBadgeLabel = (item: AdminStudyMaterialListItem) => {
    if (item.materialType === 'VIDEO') return 'Video';
    if (item.materialType === 'LINK') return 'Web Link';
    if (item.fileName) {
      const ext = item.fileName.split('.').pop()?.toUpperCase();
      if (ext && ['PDF', 'DOC', 'DOCX', 'PPT', 'PPTX', 'TXT', 'PNG', 'JPG'].includes(ext)) {
        return ext;
      }
    }
    return 'Document';
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '8px 4px 40px' }}>
        {/* Top Header */}
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
                Academic Operations
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>•</span>
              <span style={{ fontSize: '0.8rem', color: '#647F99' }}>School-Wide Monitoring</span>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#20354A', margin: 0 }}>
              Study Materials Management
            </h1>
            <p style={{ margin: '6px 0 0', color: '#647F99', fontSize: '0.92rem' }}>
              Inspect and monitor uploaded notes, presentations, worksheets, and faculty resources.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Academic Year Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} style={{ color: '#647F99' }} />
              <select
                value={selectedAcademicYear}
                onChange={(e) => {
                  setSelectedAcademicYear(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#20354A',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">All Academic Years</option>
                {metadata.academicYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => {
                fetchSummary();
                fetchMaterials();
              }}
              disabled={loading || summaryLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                color: '#334155',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: loading || summaryLoading ? 'not-allowed' : 'pointer',
              }}
            >
              <RotateCw size={15} className={loading || summaryLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
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

        {/* 4 Summary KPI Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {/* 1. Total Materials */}
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                backgroundColor: '#EEF3F8',
                color: '#20354A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', color: '#647F99', fontWeight: 600 }}>Total Materials</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#20354A' }}>
                {summary.totalMaterials}
              </div>
            </div>
          </div>

          {/* 2. Published Materials */}
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileCheck size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', color: '#647F99', fontWeight: 600 }}>Published Materials</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#15803D' }}>
                {summary.publishedMaterials}
              </div>
            </div>
          </div>

          {/* 3. Draft Materials */}
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                backgroundColor: '#FEF3C7',
                color: '#B45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', color: '#647F99', fontWeight: 600 }}>Draft Materials</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#B45309' }}>
                {summary.draftMaterials}
              </div>
            </div>
          </div>

          {/* 4. Total Teachers Uploading */}
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                backgroundColor: '#DBEAFE',
                color: '#1D4ED8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', color: '#647F99', fontWeight: 600 }}>Active Faculty Uploading</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1D4ED8' }}>
                {summary.totalTeachersUploading}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '18px 20px',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
            <Filter size={15} />
            <span>Search & Filter Materials</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            {/* Search */}
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                }}
              />
              <input
                type="text"
                placeholder="Search title, teacher, file..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 32px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </form>

            {/* Teacher Filter */}
            <select
              value={selectedTeacherId}
              onChange={(e) => {
                setSelectedTeacherId(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                color: '#334155',
                backgroundColor: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Teachers</option>
              {metadata.teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                color: '#334155',
                backgroundColor: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Classes</option>
              {metadata.classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Section Filter */}
            <select
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                color: '#334155',
                backgroundColor: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Sections</option>
              {metadata.sections.map((s) => (
                <option key={s} value={s}>
                  Section {s}
                </option>
              ))}
            </select>

            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                color: '#334155',
                backgroundColor: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Subjects</option>
              {metadata.subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Publication Status */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                color: '#334155',
                backgroundColor: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>

            {/* Material Type */}
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                color: '#334155',
                backgroundColor: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Types</option>
              <option value="DOCUMENT">Documents / Notes</option>
              <option value="VIDEO">Videos</option>
              <option value="LINK">Web Links</option>
            </select>
          </div>

          {hasActiveFilters && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#647F99',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Data Table */}
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
            <div>Loading school-wide study materials...</div>
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
              No study materials match the query
            </h3>
            <p style={{ color: '#647F99', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto' }}>
              Try adjusting the filters, selecting another academic year, or clearing the search text.
            </p>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                      MATERIAL TITLE
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                      TEACHER
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                      CLASS
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                      SECTION
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                      SUBJECT
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                      ACADEMIC YEAR
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                      UPLOAD DATE
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                      FILE TYPE
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                      STATUS
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#475569',
                        textAlign: 'right',
                      }}
                    >
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((item) => {
                    const isDraft = item.status === 'DRAFT';
                    const isVideo = item.materialType === 'VIDEO';
                    const isLink = item.materialType === 'LINK';
                    const badgeLabel = getFileBadgeLabel(item);

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        {/* Title */}
                        <td style={{ padding: '14px 16px', maxWidth: '280px' }}>
                          <div style={{ fontWeight: 600, color: '#20354A', fontSize: '0.92rem' }}>
                            {item.title}
                          </div>
                          {item.description && (
                            <div
                              style={{
                                fontSize: '0.78rem',
                                color: '#647F99',
                                marginTop: '2px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.description}
                            </div>
                          )}
                        </td>

                        {/* Teacher */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                            {item.teacherName}
                          </span>
                        </td>

                        {/* Class */}
                        <td style={{ padding: '14px 16px', fontSize: '0.88rem', color: '#334155' }}>
                          {item.className}
                        </td>

                        {/* Section */}
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              backgroundColor: '#F1F5F9',
                              color: '#334155',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                            }}
                          >
                            {item.section}
                          </span>
                        </td>

                        {/* Subject */}
                        <td style={{ padding: '14px 16px', fontSize: '0.88rem', fontWeight: 500, color: '#334155' }}>
                          {item.subject}
                        </td>

                        {/* Academic Year */}
                        <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#647F99' }}>
                          {item.academicYear}
                        </td>

                        {/* Upload Date */}
                        <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#647F99' }}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                        </td>

                        {/* File Type */}
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: isVideo ? '#FEE2E2' : isLink ? '#DBEAFE' : '#DCFCE7',
                              color: isVideo ? '#B91C1C' : isLink ? '#1D4ED8' : '#15803D',
                            }}
                          >
                            {isVideo ? <Video size={12} /> : isLink ? <Link2 size={12} /> : <FileText size={12} />}
                            <span>{badgeLabel}</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: isDraft ? '#FEF3C7' : '#DCFCE7',
                              color: isDraft ? '#B45309' : '#15803D',
                            }}
                          >
                            {item.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setInspectingMaterial(item)}
                              title="Inspect resource details"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #CBD5E1',
                                borderRadius: '6px',
                                color: '#334155',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <Eye size={14} />
                              <span>Inspect</span>
                            </button>

                            {item.fileUrl && (
                              <a
                                href={item.fileUrl}
                                download={item.fileName || 'material'}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Download resource"
                                style={{
                                  padding: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid #E2E8F0',
                                  borderRadius: '6px',
                                  color: '#059669',
                                  textDecoration: 'none',
                                }}
                              >
                                <Download size={14} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderTop: '1px solid #E2E8F0',
                backgroundColor: '#FAFAFA',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#647F99' }}>
                Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                <strong>{Math.min(currentPage * pageSize, totalCount)}</strong> of <strong>{totalCount}</strong> study materials
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.82rem',
                    color: '#475569',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                  }}
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    backgroundColor: currentPage <= 1 ? '#F1F5F9' : '#ffffff',
                    color: currentPage <= 1 ? '#94A3B8' : '#334155',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ChevronLeft size={16} />
                </button>

                <span style={{ fontSize: '0.85rem', color: '#475569', padding: '0 4px' }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    backgroundColor: currentPage >= totalPages ? '#F1F5F9' : '#ffffff',
                    color: currentPage >= totalPages ? '#94A3B8' : '#334155',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Admin Inspection Details (Read-only Monitoring Mode) */}
        {inspectingMaterial && (
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
                maxWidth: '660px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '24px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#EEF3F8',
                        color: '#20354A',
                      }}
                    >
                      {inspectingMaterial.className} - {inspectingMaterial.section} • {inspectingMaterial.subject}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor: inspectingMaterial.status === 'PUBLISHED' ? '#DCFCE7' : '#FEF3C7',
                        color: inspectingMaterial.status === 'PUBLISHED' ? '#15803D' : '#B45309',
                      }}
                    >
                      {inspectingMaterial.status}
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#20354A', fontWeight: 700 }}>
                    {inspectingMaterial.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingMaterial(null)}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {inspectingMaterial.description && (
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
                  {inspectingMaterial.description}
                </div>
              )}

              {/* Grid Metadata */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  backgroundColor: '#F1F5F9',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  color: '#475569',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <span style={{ color: '#647F99' }}>Faculty In-Charge: </span>
                  <strong>{inspectingMaterial.teacherName}</strong>
                </div>
                <div>
                  <span style={{ color: '#647F99' }}>Academic Year: </span>
                  <strong>{inspectingMaterial.academicYear}</strong>
                </div>
                <div>
                  <span style={{ color: '#647F99' }}>Resource Type: </span>
                  <strong>{inspectingMaterial.materialType}</strong>
                </div>
                <div>
                  <span style={{ color: '#647F99' }}>Upload Date: </span>
                  <strong>{new Date(inspectingMaterial.createdAt).toLocaleString()}</strong>
                </div>
                <div>
                  <span style={{ color: '#647F99' }}>File Name: </span>
                  <strong>{inspectingMaterial.fileName || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: '#647F99' }}>File Size: </span>
                  <strong>{formatFileSize(inspectingMaterial.fileSize)}</strong>
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
                {inspectingMaterial.fileUrl ? (
                  <div>
                    <FileCheck size={36} style={{ color: '#059669', margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 600, color: '#20354A', fontSize: '0.92rem' }}>
                      {inspectingMaterial.fileName || 'Resource Document'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#647F99', marginBottom: '14px' }}>
                      {formatFileSize(inspectingMaterial.fileSize)}
                    </div>
                    <a
                      href={inspectingMaterial.fileUrl}
                      download={inspectingMaterial.fileName || 'study-material'}
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
                      <span>Download Resource</span>
                    </a>
                  </div>
                ) : inspectingMaterial.externalUrl ? (
                  <div>
                    {inspectingMaterial.materialType === 'VIDEO' ? (
                      <Video size={36} style={{ color: '#DC2626', margin: '0 auto 8px' }} />
                    ) : (
                      <Link2 size={36} style={{ color: '#2563EB', margin: '0 auto 8px' }} />
                    )}
                    <div style={{ fontWeight: 600, color: '#20354A', fontSize: '0.92rem', marginBottom: '8px' }}>
                      External Learning Link
                    </div>
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: '#2563EB',
                        wordBreak: 'break-all',
                        marginBottom: '14px',
                      }}
                    >
                      {inspectingMaterial.externalUrl}
                    </div>
                    <a
                      href={inspectingMaterial.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '9px 18px',
                        backgroundColor: '#20354A',
                        color: '#ffffff',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                      }}
                    >
                      <ExternalLink size={16} />
                      <span>Visit Resource URL</span>
                    </a>
                  </div>
                ) : (
                  <div style={{ color: '#647F99', fontSize: '0.88rem' }}>No direct file or external link attached.</div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: '16px',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                  Monitoring mode: Read-only management view.
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingMaterial(null)}
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
      </div>
    </AdminLayout>
  );
};
