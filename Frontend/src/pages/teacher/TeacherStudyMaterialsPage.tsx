import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  BookOpen,
  Plus,
  RotateCw,
  Search,
  FileText,
  Video,
  Link2,
  Download,
  ExternalLink,
  Edit,
  Trash2,
  X,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  Eye,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { TeacherLayout } from '../../components/teacher/TeacherLayout';
import { teacherStudyMaterialApi } from '../../api/studyMaterialApi';
import {
  TeacherStudyMaterial,
  CreateStudyMaterialPayload,
  StudyMaterialType,
  StudyMaterialStatus,
} from '../../types/studyMaterial.types';

export const TeacherStudyMaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<TeacherStudyMaterial[]>([]);
  const [summary, setSummary] = useState({ total: 0, published: 0, draft: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Teacher assigned classes & subjects
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMaterial, setEditingMaterial] = useState<TeacherStudyMaterial | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formClassSelection, setFormClassSelection] = useState<string>(''); // format: "className|section"
  const [formSubject, setFormSubject] = useState<string>('');
  const [formAcademicYear, setFormAcademicYear] = useState<string>('2026-2027');
  const [formType, setFormType] = useState<StudyMaterialType>('DOCUMENT');
  const [formStatus, setFormStatus] = useState<StudyMaterialStatus>('PUBLISHED');
  const [formExternalUrl, setFormExternalUrl] = useState<string>('');
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: number;
    type: string;
    dataUrl: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Modal State
  const [deletingMaterial, setDeletingMaterial] = useState<TeacherStudyMaterial | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Preview Modal
  const [previewMaterial, setPreviewMaterial] = useState<TeacherStudyMaterial | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [materialsRes, classesRes] = await Promise.all([
        teacherStudyMaterialApi.getStudyMaterials(),
        teacherStudyMaterialApi.getAssignedClasses(),
      ]);

      if (materialsRes.success && materialsRes.data) {
        setMaterials(materialsRes.data.materials || []);
        setSummary(
          materialsRes.data.summary || {
            total: materialsRes.data.materials.length,
            published: materialsRes.data.materials.filter((m) => m.status === 'PUBLISHED').length,
            draft: materialsRes.data.materials.filter((m) => m.status === 'DRAFT').length,
          }
        );
      }

      if (classesRes.success && classesRes.data) {
        setAssignedClasses(classesRes.data || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load study materials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Distinct subjects for filter
  const availableFilterSubjects = useMemo(() => {
    const subs = new Set<string>();
    assignedClasses.forEach((c) => {
      if (c.subject) subs.add(c.subject);
    });
    materials.forEach((m) => {
      if (m.subject) subs.add(m.subject);
    });
    return Array.from(subs).sort();
  }, [assignedClasses, materials]);

  // Distinct classes for filter
  const availableFilterClasses = useMemo(() => {
    const cls = new Set<string>();
    assignedClasses.forEach((c) => {
      if (c.className) cls.add(c.className);
    });
    materials.forEach((m) => {
      if (m.className) cls.add(m.className);
    });
    return Array.from(cls).sort();
  }, [assignedClasses, materials]);

  // Authorized subjects for form when a class is selected
  const availableFormSubjects = useMemo(() => {
    if (!formClassSelection) return [];
    const [cName, cSec] = formClassSelection.split('|');
    const matched = assignedClasses.filter(
      (c) =>
        c.className.toLowerCase() === (cName || '').toLowerCase() &&
        c.section.toLowerCase() === (cSec || '').toLowerCase()
    );
    const setOfSubs = new Set<string>();
    matched.forEach((m) => {
      if (m.subject) setOfSubs.add(m.subject);
    });
    return Array.from(setOfSubs);
  }, [formClassSelection, assignedClasses]);

  // Handle open Create Modal
  const handleOpenCreateModal = () => {
    setEditingMaterial(null);
    setFormTitle('');
    setFormDescription('');
    if (assignedClasses.length > 0) {
      const first = assignedClasses[0];
      setFormClassSelection(`${first.className}|${first.section}`);
      setFormSubject(first.subject || '');
      setFormAcademicYear(first.academicYear || '2026-2027');
    } else {
      setFormClassSelection('');
      setFormSubject('');
      setFormAcademicYear('2026-2027');
    }
    setFormType('DOCUMENT');
    setFormStatus('PUBLISHED');
    setFormExternalUrl('');
    setAttachedFile(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle open Edit Modal
  const handleOpenEditModal = (material: TeacherStudyMaterial) => {
    setEditingMaterial(material);
    setFormTitle(material.title);
    setFormDescription(material.description || '');
    setFormClassSelection(`${material.className}|${material.section}`);
    setFormSubject(material.subject);
    setFormAcademicYear(material.academicYear || '2026-2027');
    setFormType(material.materialType);
    setFormStatus(material.status);
    setFormExternalUrl(material.externalUrl || '');
    if (material.fileUrl && material.fileName) {
      setAttachedFile({
        name: material.fileName,
        size: material.fileSize || 0,
        type: material.fileType || 'application/octet-stream',
        dataUrl: material.fileUrl,
      });
    } else {
      setAttachedFile(null);
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  // File Upload Handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const allowedExtensions = [
      '.pdf',
      '.doc',
      '.docx',
      '.ppt',
      '.pptx',
      '.txt',
      '.png',
      '.jpg',
      '.jpeg',
    ];
    const nameLower = file.name.toLowerCase();
    const hasValidExt = allowedExtensions.some((ext) => nameLower.endsWith(ext));

    if (!hasValidExt) {
      setFormError('Invalid file format. Supported: PDF, DOC, DOCX, PPT, PPTX, TXT, PNG, JPG.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setFormError('File size exceeds the 8MB limit. Please upload a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl: reader.result as string,
      });
      setFormError(null);
    };
    reader.onerror = () => {
      setFormError('Failed to read the selected file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit Save
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle.trim()) {
      setFormError('Please enter a material title.');
      return;
    }

    if (!formClassSelection) {
      setFormError('Please select a class and section.');
      return;
    }

    const [className, section] = formClassSelection.split('|');
    if (!className || !section) {
      setFormError('Invalid class selection.');
      return;
    }

    if (!formSubject.trim()) {
      setFormError('Please select an authorized subject.');
      return;
    }

    if (formType === 'DOCUMENT' && !attachedFile && !formExternalUrl.trim()) {
      setFormError('Please upload a document or provide an educational resource link.');
      return;
    }

    if ((formType === 'LINK' || formType === 'VIDEO') && !formExternalUrl.trim()) {
      setFormError('Please provide the external resource URL.');
      return;
    }

    try {
      setIsSaving(true);
      const payload: CreateStudyMaterialPayload = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        className,
        section,
        subject: formSubject.trim(),
        academicYear: formAcademicYear,
        materialType: formType,
        status: formStatus,
        fileUrl: attachedFile ? attachedFile.dataUrl : formExternalUrl.trim() || undefined,
        fileName: attachedFile ? attachedFile.name : undefined,
        fileSize: attachedFile ? attachedFile.size : undefined,
        fileType: attachedFile ? attachedFile.type : undefined,
        externalUrl: formExternalUrl.trim() || undefined,
      };

      if (editingMaterial) {
        await teacherStudyMaterialApi.updateStudyMaterial(editingMaterial.id, payload);
        setSuccessMessage('Study material updated successfully.');
      } else {
        await teacherStudyMaterialApi.createStudyMaterial(payload);
        setSuccessMessage('Study material created and published successfully.');
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save study material.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deletingMaterial) return;
    try {
      setIsDeleting(true);
      await teacherStudyMaterialApi.deleteStudyMaterial(deletingMaterial.id);
      setSuccessMessage('Study material deleted successfully.');
      setDeletingMaterial(null);
      await fetchData();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete study material.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      if (selectedClass !== 'ALL' && item.className !== selectedClass) return false;
      if (selectedSubject !== 'ALL' && item.subject !== selectedSubject) return false;
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;
      if (selectedType !== 'ALL' && item.materialType !== selectedType) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        const matchesSubject = item.subject.toLowerCase().includes(q);
        const matchesFile = (item.fileName || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesSubject && !matchesFile) return false;
      }
      return true;
    });
  }, [materials, selectedClass, selectedSubject, selectedStatus, selectedType, searchTerm]);

  // Format bytes
  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return 'Resource link';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <TeacherLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '8px 16px 40px' }}>
        {/* Header */}
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
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
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
                  color: '#647F99',
                  backgroundColor: '#EEF3F8',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}
              >
                Academic Resources
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>•</span>
              <span style={{ fontSize: '0.8rem', color: '#647F99' }}>Faculty Desk</span>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#20354A', margin: 0 }}>
              Study Materials Management
            </h1>
            <p style={{ margin: '6px 0 0', color: '#647F99', fontSize: '0.92rem' }}>
              Upload documents, presentations, and educational links for your assigned classes.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 14px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                color: '#475569',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              title="Refresh materials list"
            >
              <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                backgroundColor: '#20354A',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(32,53,74,0.15)',
              }}
            >
              <Plus size={18} />
              <span>Upload Material</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
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

        {successMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              color: '#166534',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.9rem',
            }}
          >
            <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>{successMessage}</div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Summary KPI Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '18px 20px',
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
                width: '46px',
                height: '46px',
                borderRadius: '8px',
                backgroundColor: '#EEF3F8',
                color: '#20354A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#647F99', fontWeight: 600 }}>Total Uploads</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#20354A' }}>
                {summary.total}
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '18px 20px',
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
                width: '46px',
                height: '46px',
                borderRadius: '8px',
                backgroundColor: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#647F99', fontWeight: 600 }}>Published</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>
                {summary.published}
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '18px 20px',
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
                width: '46px',
                height: '46px',
                borderRadius: '8px',
                backgroundColor: '#FFFBEB',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#647F99', fontWeight: 600 }}>Drafts</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#D97706' }}>
                {summary.draft}
              </div>
            </div>
          </div>
        </div>

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
          {/* Search */}
          <div style={{ flex: '1 1 200px', minWidth: '180px', position: 'relative' }}>
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
              placeholder="Search by title, subject, file..."
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
          </div>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
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
            <option value="ALL">All Classes</option>
            {availableFilterClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

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
            {availableFilterSubjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
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
            <option value="ALL">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>

          {/* Resource Type Filter */}
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
            <option value="ALL">All Types</option>
            <option value="DOCUMENT">Documents / Files</option>
            <option value="VIDEO">Videos</option>
            <option value="LINK">Web Links</option>
          </select>

          {(searchTerm ||
            selectedClass !== 'ALL' ||
            selectedSubject !== 'ALL' ||
            selectedStatus !== 'ALL' ||
            selectedType !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedClass('ALL');
                setSelectedSubject('ALL');
                setSelectedStatus('ALL');
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
              Reset Filters
            </button>
          )}
        </div>

        {/* Content Table / Cards */}
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
            <div>Loading study materials...</div>
          </div>
        ) : filteredMaterials.length === 0 ? (
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
              No study materials found
            </h3>
            <p style={{ color: '#647F99', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 20px' }}>
              {materials.length === 0
                ? 'You have not uploaded any study materials yet. Click Upload Material above to add notes, worksheets or educational videos for your classes.'
                : 'No materials match your current filters. Try adjusting your search query or reset the filters.'}
            </p>
            {materials.length === 0 && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
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
                <Plus size={16} />
                <span>Upload First Material</span>
              </button>
            )}
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
                      CLASS & SECTION
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                      SUBJECT
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                      TYPE & RESOURCE
                    </th>
                    <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                      UPLOAD DATE
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
                  {filteredMaterials.map((item) => {
                    const isDraft = item.status === 'DRAFT';
                    const isVideo = item.materialType === 'VIDEO';
                    const isLink = item.materialType === 'LINK';

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        {/* Title & Description */}
                        <td style={{ padding: '14px 16px', maxWidth: '300px' }}>
                          <div style={{ fontWeight: 600, color: '#20354A', fontSize: '0.92rem' }}>
                            {item.title}
                          </div>
                          {item.description && (
                            <div
                              style={{
                                fontSize: '0.8rem',
                                color: '#647F99',
                                marginTop: '3px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.description}
                            </div>
                          )}
                        </td>

                        {/* Class & Section */}
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#EEF3F8',
                              color: '#20354A',
                              fontWeight: 600,
                              fontSize: '0.82rem',
                            }}
                          >
                            {item.className} - {item.section}
                          </span>
                        </td>

                        {/* Subject */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 500, color: '#334155' }}>
                            {item.subject}
                          </span>
                        </td>

                        {/* Type & Resource */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isVideo ? (
                              <Video size={16} style={{ color: '#DC2626' }} />
                            ) : isLink ? (
                              <Link2 size={16} style={{ color: '#2563EB' }} />
                            ) : (
                              <FileText size={16} style={{ color: '#059669' }} />
                            )}
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>
                                {item.fileName || (isVideo ? 'Video Lesson' : isLink ? 'Web Resource' : 'Document')}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                                {formatFileSize(item.fileSize)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Upload Date */}
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#647F99' }}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '0.78rem',
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
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {/* Preview / Open */}
                            <button
                              type="button"
                              onClick={() => setPreviewMaterial(item)}
                              title="Preview resource"
                              style={{
                                padding: '6px',
                                background: 'none',
                                border: '1px solid #E2E8F0',
                                borderRadius: '6px',
                                color: '#475569',
                                cursor: 'pointer',
                              }}
                            >
                              <Eye size={15} />
                            </button>

                            {/* Download or Link */}
                            {item.fileUrl && (
                              <a
                                href={item.fileUrl}
                                download={item.fileName || 'material'}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Download file"
                                style={{
                                  padding: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid #E2E8F0',
                                  borderRadius: '6px',
                                  color: '#059669',
                                  cursor: 'pointer',
                                  textDecoration: 'none',
                                }}
                              >
                                <Download size={15} />
                              </a>
                            )}

                            {item.externalUrl && !item.fileUrl && (
                              <a
                                href={item.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open resource link"
                                style={{
                                  padding: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid #E2E8F0',
                                  borderRadius: '6px',
                                  color: '#2563EB',
                                  cursor: 'pointer',
                                  textDecoration: 'none',
                                }}
                              >
                                <ExternalLink size={15} />
                              </a>
                            )}

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              title="Edit material"
                              style={{
                                padding: '6px',
                                background: 'none',
                                border: '1px solid #E2E8F0',
                                borderRadius: '6px',
                                color: '#334155',
                                cursor: 'pointer',
                              }}
                            >
                              <Edit size={15} />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeletingMaterial(item)}
                              title="Delete material"
                              style={{
                                padding: '6px',
                                background: 'none',
                                border: '1px solid #FEE2E2',
                                borderRadius: '6px',
                                color: '#DC2626',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={15} />
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

        {/* Modal: Create or Edit Material */}
        {isModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
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
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#20354A', fontWeight: 700 }}>
                    {editingMaterial ? 'Edit Study Material' : 'Upload Study Material'}
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#647F99' }}>
                    Provide resource details for student study and review.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveMaterial} style={{ padding: '24px' }}>
                {formError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: '6px',
                      color: '#991B1B',
                      fontSize: '0.85rem',
                      marginBottom: '16px',
                    }}
                  >
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <div>{formError}</div>
                  </div>
                )}

                {/* Title */}
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
                  >
                    Material Title <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    placeholder="e.g. Chapter 4 Motion & Energy Revision Notes"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Description */}
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
                  >
                    Instructions / Description
                  </label>
                  <textarea
                    rows={3}
                    maxLength={2000}
                    placeholder="Brief explanation, topics covered, or study instructions..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* Class & Section Selection */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '16px',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '6px',
                      }}
                    >
                      Assigned Class & Section <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <select
                      required
                      value={formClassSelection}
                      onChange={(e) => {
                        setFormClassSelection(e.target.value);
                        // Auto-select subject if available
                        const [cName, cSec] = e.target.value.split('|');
                        const matched = assignedClasses.find(
                          (c) =>
                            c.className.toLowerCase() === (cName || '').toLowerCase() &&
                            c.section.toLowerCase() === (cSec || '').toLowerCase()
                        );
                        if (matched && matched.subject) {
                          setFormSubject(matched.subject);
                        } else {
                          setFormSubject('');
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.9rem',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <option value="">Select Class & Section</option>
                      {assignedClasses.map((c, idx) => (
                        <option key={`${c.className}-${c.section}-${idx}`} value={`${c.className}|${c.section}`}>
                          {c.className} - Section {c.section} {c.subject ? `(${c.subject})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subject Selection */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '6px',
                      }}
                    >
                      Authorized Subject <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <select
                      required
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.9rem',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <option value="">Select Authorized Subject</option>
                      {availableFormSubjects.length > 0 ? (
                        availableFormSubjects.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))
                      ) : (
                        <option value={formSubject || 'General'}>{formSubject || 'General'}</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Resource Type Selection */}
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}
                  >
                    Resource Category
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: formType === 'DOCUMENT' ? '2px solid #20354A' : '1px solid #CBD5E1',
                        backgroundColor: formType === 'DOCUMENT' ? '#EEF3F8' : '#F8FAFC',
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                        fontWeight: 500,
                      }}
                    >
                      <input
                        type="radio"
                        name="resourceType"
                        checked={formType === 'DOCUMENT'}
                        onChange={() => setFormType('DOCUMENT')}
                        style={{ display: 'none' }}
                      />
                      <FileText size={18} style={{ color: '#20354A' }} />
                      <span>Document / File</span>
                    </label>

                    <label
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: formType === 'VIDEO' ? '2px solid #20354A' : '1px solid #CBD5E1',
                        backgroundColor: formType === 'VIDEO' ? '#EEF3F8' : '#F8FAFC',
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                        fontWeight: 500,
                      }}
                    >
                      <input
                        type="radio"
                        name="resourceType"
                        checked={formType === 'VIDEO'}
                        onChange={() => setFormType('VIDEO')}
                        style={{ display: 'none' }}
                      />
                      <Video size={18} style={{ color: '#DC2626' }} />
                      <span>Video Lesson</span>
                    </label>

                    <label
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: formType === 'LINK' ? '2px solid #20354A' : '1px solid #CBD5E1',
                        backgroundColor: formType === 'LINK' ? '#EEF3F8' : '#F8FAFC',
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                        fontWeight: 500,
                      }}
                    >
                      <input
                        type="radio"
                        name="resourceType"
                        checked={formType === 'LINK'}
                        onChange={() => setFormType('LINK')}
                        style={{ display: 'none' }}
                      />
                      <Link2 size={18} style={{ color: '#2563EB' }} />
                      <span>Web Link</span>
                    </label>
                  </div>
                </div>

                {/* File Upload Area (if Document) */}
                {formType === 'DOCUMENT' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '6px',
                      }}
                    >
                      File Attachment (PDF, DOC/DOCX, PPT/PPTX)
                    </label>

                    {attachedFile ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          backgroundColor: '#F0FDF4',
                          border: '1px solid #BBF7D0',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FileCheck size={20} style={{ color: '#16A34A' }} />
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#15803D' }}>
                              {attachedFile.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#65A30D' }}>
                              {formatFileSize(attachedFile.size)}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#DC2626',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          border: '2px dashed #CBD5E1',
                          borderRadius: '8px',
                          padding: '24px 16px',
                          textAlign: 'center',
                          backgroundColor: '#F8FAFC',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s',
                        }}
                      >
                        <UploadCloud size={32} style={{ color: '#647F99', margin: '0 auto 8px' }} />
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#20354A' }}>
                          Click to select a document to upload
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '4px' }}>
                          Supports PDF, DOC, DOCX, PPT, PPTX up to 8MB
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                          style={{ display: 'none' }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* External Link Input (for Video/Link or alternative document link) */}
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
                  >
                    {formType === 'VIDEO'
                      ? 'Video URL (YouTube, Vimeo, Google Drive) *'
                      : formType === 'LINK'
                      ? 'External Resource Link URL *'
                      : 'Or Direct Cloud / Resource URL (Optional)'}
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formExternalUrl}
                    onChange={(e) => setFormExternalUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Publication Status */}
                <div style={{ marginBottom: '24px' }}>
                  <label
                    style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
                  >
                    Publication Status
                  </label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="status"
                        checked={formStatus === 'PUBLISHED'}
                        onChange={() => setFormStatus('PUBLISHED')}
                      />
                      <span style={{ fontWeight: 600, color: '#059669' }}>Published</span>
                      <span style={{ fontSize: '0.78rem', color: '#647F99' }}>(Immediately visible to parents and students)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="status"
                        checked={formStatus === 'DRAFT'}
                        onChange={() => setFormStatus('DRAFT')}
                      />
                      <span style={{ fontWeight: 600, color: '#D97706' }}>Draft</span>
                      <span style={{ fontSize: '0.78rem', color: '#647F99' }}>(Private work-in-progress)</span>
                    </label>
                  </div>
                </div>

                {/* Modal Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                    style={{
                      padding: '9px 16px',
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
                    type="submit"
                    disabled={isSaving}
                    style={{
                      padding: '9px 20px',
                      backgroundColor: '#20354A',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#ffffff',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {isSaving && <RotateCw size={15} className="animate-spin" />}
                    <span>{editingMaterial ? 'Save Changes' : 'Upload & Save'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Delete Confirmation */}
        {deletingMaterial && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
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
                maxWidth: '440px',
                padding: '24px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <Trash2 size={22} />
              </div>

              <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', color: '#20354A', fontWeight: 700 }}>
                Delete Study Material?
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '0.88rem', color: '#647F99' }}>
                Are you sure you want to permanently delete <strong>{deletingMaterial.title}</strong>? Students will no
                longer be able to access this resource.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setDeletingMaterial(null)}
                  disabled={isDeleting}
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
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  style={{
                    padding: '8px 18px',
                    backgroundColor: '#DC2626',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {isDeleting && <RotateCw size={14} className="animate-spin" />}
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Preview Resource */}
        {previewMaterial && (
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
                maxWidth: '680px',
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
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#EEF3F8',
                      color: '#20354A',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      marginBottom: '6px',
                    }}
                  >
                    {previewMaterial.className} - {previewMaterial.section} • {previewMaterial.subject}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#20354A' }}>{previewMaterial.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewMaterial(null)}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {previewMaterial.description && (
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '0.88rem',
                    color: '#475569',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {previewMaterial.description}
                </div>
              )}

              {/* Resource action card */}
              <div
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  backgroundColor: '#FAFAFA',
                  marginBottom: '20px',
                }}
              >
                {previewMaterial.materialType === 'VIDEO' ? (
                  <div>
                    <Video size={40} style={{ color: '#DC2626', margin: '0 auto 12px' }} />
                    <div style={{ fontWeight: 600, color: '#20354A', marginBottom: '8px' }}>
                      External Educational Video
                    </div>
                    {previewMaterial.externalUrl && (
                      <a
                        href={previewMaterial.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          backgroundColor: '#20354A',
                          color: '#ffffff',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '0.88rem',
                        }}
                      >
                        <ExternalLink size={16} />
                        <span>Watch Video on External Site</span>
                      </a>
                    )}
                  </div>
                ) : previewMaterial.materialType === 'LINK' ? (
                  <div>
                    <Link2 size={40} style={{ color: '#2563EB', margin: '0 auto 12px' }} />
                    <div style={{ fontWeight: 600, color: '#20354A', marginBottom: '8px' }}>
                      External Learning Resource Link
                    </div>
                    {previewMaterial.externalUrl && (
                      <a
                        href={previewMaterial.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          backgroundColor: '#20354A',
                          color: '#ffffff',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '0.88rem',
                        }}
                      >
                        <ExternalLink size={16} />
                        <span>Open Resource in New Tab</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <div>
                    <FileText size={40} style={{ color: '#059669', margin: '0 auto 12px' }} />
                    <div style={{ fontWeight: 600, color: '#20354A', marginBottom: '4px' }}>
                      {previewMaterial.fileName || 'Attached Document'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#647F99', marginBottom: '16px' }}>
                      {formatFileSize(previewMaterial.fileSize)}
                    </div>
                    {previewMaterial.fileUrl && (
                      <a
                        href={previewMaterial.fileUrl}
                        download={previewMaterial.fileName || 'study-material'}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 18px',
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
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setPreviewMaterial(null)}
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
    </TeacherLayout>
  );
};
