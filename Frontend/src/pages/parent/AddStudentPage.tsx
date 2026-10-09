import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UserPlus,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  UploadCloud,
  FileText,
  X,
  Sparkles,
  ShieldCheck,
  User,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { ParentLayout } from '../../components/parent/ParentLayout';
import { useAppSelector } from '../../store/hooks';
import { parentApi } from '../../api/parentApi';
import {
  StudentGender,
  ParentRelationship,
  AdmissionMetadata,
  StudentRegistrationRequest,
} from '../../types/parent.types';

interface FormData {
  studentFullName: string;
  dateOfBirth: string;
  gender: StudentGender;
  requestedGrade: string;
  academicYear: string;
  previousSchool: string;
  previousClass: string;
  parentRelationship: ParentRelationship;
  documents: Array<{ name: string; url: string; fileType: string; size?: string }>;
}

interface FormErrors {
  studentFullName?: string;
  dateOfBirth?: string;
  gender?: string;
  requestedGrade?: string;
  academicYear?: string;
  parentRelationship?: string;
  general?: string;
}

export const AddStudentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<StudentRegistrationRequest | null>(null);

  const [metadata, setMetadata] = useState<AdmissionMetadata>({
    classes: [
      'Pre-KG',
      'LKG',
      'UKG',
      'Grade 1',
      'Grade 2',
      'Grade 3',
      'Grade 4',
      'Grade 5',
      'Grade 6',
      'Grade 7',
      'Grade 8',
      'Grade 9',
      'Grade 10',
      'Grade 11',
      'Grade 12',
    ],
    academicYears: ['2026-2027', '2027-2028'],
    genders: [
      { label: 'Male', value: 'MALE' },
      { label: 'Female', value: 'FEMALE' },
      { label: 'Other', value: 'OTHER' },
      { label: 'Prefer not to say', value: 'PREFER_NOT_TO_SAY' },
    ],
    relationships: [
      { label: 'Father', value: 'FATHER' },
      { label: 'Mother', value: 'MOTHER' },
      { label: 'Guardian', value: 'GUARDIAN' },
      { label: 'Other', value: 'OTHER' },
    ],
  });

  const [formData, setFormData] = useState<FormData>({
    studentFullName: '',
    dateOfBirth: '',
    gender: 'MALE' as StudentGender,
    requestedGrade: '',
    academicYear: '2026-2027',
    previousSchool: '',
    previousClass: '',
    parentRelationship: 'FATHER' as ParentRelationship,
    documents: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Calculate max allowed date of birth (today)
  const todayDateString = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await parentApi.getAdmissionMetadata();
        if (res.data) {
          setMetadata(res.data);
          if (res.data.classes.length > 0 && !formData.requestedGrade) {
            setFormData((prev) => ({
              ...prev,
              requestedGrade: res.data.classes[0],
              academicYear: res.data.academicYears[0] || '2026-2027',
            }));
          }
        }
      } catch {
        // Fallback default meta is already set in state
      }
    };

    fetchMetadata();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.studentFullName.trim()) {
      newErrors.studentFullName = 'Please enter the student’s full name.';
    } else if (formData.studentFullName.trim().length < 2) {
      newErrors.studentFullName = 'Student name must be at least 2 characters.';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Please select your child’s date of birth.';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const now = new Date();
      if (dob >= now) {
        newErrors.dateOfBirth = 'Date of birth cannot be today or in the future.';
      } else {
        const ageYears = (now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        if (ageYears < 2 || ageYears > 25) {
          newErrors.dateOfBirth = 'Child must be between 2 and 25 years old for admission eligibility.';
        }
      }
    }

    if (!formData.requestedGrade) {
      newErrors.requestedGrade = 'Please select the class or grade you are applying for.';
    }

    if (!formData.academicYear) {
      newErrors.academicYear = 'Please select the academic year.';
    }

    if (!formData.parentRelationship) {
      newErrors.parentRelationship = 'Please select your relationship to the child.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEditDetails = () => {
    setCurrentStep(1);
    setErrors({});
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDocs = Array.from(files).map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      fileType: file.type || 'application/pdf',
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    }));

    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, ...newDocs],
    }));
  };

  const handleRemoveDoc = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrors({});

    try {
      const response = await parentApi.addStudent({
        studentFullName: formData.studentFullName.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        requestedGrade: formData.requestedGrade,
        academicYear: formData.academicYear,
        previousSchool: formData.previousSchool.trim() || undefined,
        previousClass: formData.previousClass.trim() || undefined,
        parentRelationship: formData.parentRelationship,
        documents: formData.documents.map((d) => ({
          name: d.name,
          url: 'https://storage.eduhub.local/docs/' + encodeURIComponent(d.name),
          fileType: d.fileType,
        })),
      });

      if (response.success && response.data) {
        setSubmissionSuccess(response.data);
      } else {
        setErrors({ general: response.message || 'Unable to submit registration request. Please try again.' });
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to submit registration request. Please verify details and try again.';
      setErrors({ general: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ParentLayout pageTitle="Add Student">
      <div className="add-student-page-container">
        {/* Breadcrumb Navigation */}
        <div className="add-student-breadcrumb-row">
          <nav className="parent-breadcrumb" aria-label="Breadcrumb">
            <Link to="/parent/dashboard" className="breadcrumb-item">
              Dashboard
            </Link>
            <span className="breadcrumb-separator">/</span>
            <Link to="/parent/children" className="breadcrumb-item">
              My Children
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item current">Add Student</span>
          </nav>

          <Link to="/parent/children" className="btn-back-link">
            <ArrowLeft size={15} />
            <span>Back to My Children</span>
          </Link>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SUCCESS VIEW (When request is successfully submitted) */}
        {/* ------------------------------------------------------------- */}
        {submissionSuccess ? (
          <div className="add-student-success-card">
            <div className="success-icon-badge">
              <CheckCircle2 size={36} className="text-sage" />
            </div>

            <div className="success-header">
              <span className="success-pill">
                <Sparkles size={13} />
                <span>Application Submitted</span>
              </span>
              <h2 className="success-title">Registration Request Submitted</h2>
              <p className="success-subtitle">
                Your child&apos;s registration request has been sent to the school management for review.
              </p>
            </div>

            <div className="success-summary-card">
              <div className="summary-item">
                <span className="summary-label">Student Name</span>
                <span className="summary-value highlight">{submissionSuccess.studentFullName}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Class Requested</span>
                <span className="summary-value">{submissionSuccess.requestedGrade}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Academic Year</span>
                <span className="summary-value">{submissionSuccess.academicYear || formData.academicYear}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Status</span>
                <span className="parent-request-badge badge-pending">
                  <Clock size={12} />
                  <span>Pending Review</span>
                </span>
              </div>
            </div>

            <div className="success-notice-box">
              <ShieldCheck size={16} className="text-primary" />
              <span>
                School management will review your child&apos;s admission details. You can track this request directly on your Parent Dashboard.
              </span>
            </div>

            <div className="success-actions-row">
              <button
                type="button"
                className="btn-add-student-primary"
                onClick={() => navigate('/parent/dashboard')}
              >
                <span>View Registration Status</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="btn-parent-outline-action"
                onClick={() => navigate('/parent/dashboard')}
              >
                <span>Return to Dashboard</span>
              </button>
            </div>
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* ACTIVE FORM / REVIEW FLOW */
          /* ------------------------------------------------------------- */
          <div className="add-student-card">
            {/* Page Heading & Stepper */}
            <div className="add-student-header">
              <div className="add-student-title-wrap">
                <div className="add-student-icon-circle">
                  <UserPlus size={22} className="text-primary" />
                </div>
                <div>
                  <h1 className="add-student-title">Add Your Child</h1>
                  <p className="add-student-subtitle">
                    Enter your child&apos;s details to submit a registration request to your school.
                  </p>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="add-student-stepper">
                <div className={`step-item ${currentStep === 1 ? 'active' : 'completed'}`}>
                  <span className="step-number">1</span>
                  <span className="step-label">Student Details</span>
                </div>
                <div className="step-divider" />
                <div className={`step-item ${currentStep === 2 ? 'active' : ''}`}>
                  <span className="step-number">2</span>
                  <span className="step-label">Review & Submit</span>
                </div>
              </div>
            </div>

            {/* General Error Banner */}
            {errors.general && (
              <div className="add-student-error-banner">
                <AlertCircle size={18} className="text-danger flex-shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            {/* STEP 1: STUDENT DETAILS FORM */}
            {currentStep === 1 && (
              <form onSubmit={handleContinueToReview} noValidate>
                {/* SECTION A: BASIC INFORMATION */}
                <div className="form-section-block">
                  <div className="form-section-header">
                    <div className="section-badge">
                      <User size={14} />
                      <span>Section A</span>
                    </div>
                    <h3 className="section-title">Basic Information</h3>
                    <p className="section-desc">Personal details and identification of your child.</p>
                  </div>

                  <div className="form-fields-grid">
                    {/* Student Full Name */}
                    <div className="form-field-group full-width">
                      <label htmlFor="studentFullName" className="form-label required">
                        Student Full Name
                      </label>
                      <input
                        id="studentFullName"
                        name="studentFullName"
                        type="text"
                        className={`form-input-clean ${errors.studentFullName ? 'has-error' : ''}`}
                        placeholder="Enter the student's full name"
                        value={formData.studentFullName}
                        onChange={handleChange}
                        autoFocus
                      />
                      {errors.studentFullName && (
                        <p className="field-error-msg">{errors.studentFullName}</p>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div className="form-field-group">
                      <label htmlFor="dateOfBirth" className="form-label required">
                        Date of Birth
                      </label>
                      <input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        max={todayDateString}
                        className={`form-input-clean ${errors.dateOfBirth ? 'has-error' : ''}`}
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                      />
                      {errors.dateOfBirth && (
                        <p className="field-error-msg">{errors.dateOfBirth}</p>
                      )}
                    </div>

                    {/* Gender */}
                    <div className="form-field-group">
                      <label htmlFor="gender" className="form-label required">
                        Gender
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        className="form-select-clean"
                        value={formData.gender}
                        onChange={handleChange}
                      >
                        {metadata.genders.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION B: SCHOOL INFORMATION */}
                <div className="form-section-block">
                  <div className="form-section-header">
                    <div className="section-badge">
                      <GraduationCap size={14} />
                      <span>Section B</span>
                    </div>
                    <h3 className="section-title">School Information</h3>
                    <p className="section-desc">
                      Class and academic session for which admission is being requested.
                    </p>
                  </div>

                  <div className="form-fields-grid">
                    {/* Class Applying For */}
                    <div className="form-field-group">
                      <label htmlFor="requestedGrade" className="form-label required">
                        Class Applying For
                      </label>
                      <select
                        id="requestedGrade"
                        name="requestedGrade"
                        className={`form-select-clean ${errors.requestedGrade ? 'has-error' : ''}`}
                        value={formData.requestedGrade}
                        onChange={handleChange}
                      >
                        <option value="" disabled>
                          Select Class / Grade
                        </option>
                        {metadata.classes.map((cls) => (
                          <option key={cls} value={cls}>
                            {cls}
                          </option>
                        ))}
                      </select>
                      {errors.requestedGrade && (
                        <p className="field-error-msg">{errors.requestedGrade}</p>
                      )}
                    </div>

                    {/* Academic Year */}
                    <div className="form-field-group">
                      <label htmlFor="academicYear" className="form-label required">
                        Academic Year
                      </label>
                      <select
                        id="academicYear"
                        name="academicYear"
                        className={`form-select-clean ${errors.academicYear ? 'has-error' : ''}`}
                        value={formData.academicYear}
                        onChange={handleChange}
                      >
                        {metadata.academicYears.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      {errors.academicYear && (
                        <p className="field-error-msg">{errors.academicYear}</p>
                      )}
                    </div>

                    {/* Previous School */}
                    <div className="form-field-group">
                      <label htmlFor="previousSchool" className="form-label">
                        Previous School <span className="label-optional">(Optional)</span>
                      </label>
                      <input
                        id="previousSchool"
                        name="previousSchool"
                        type="text"
                        className="form-input-clean"
                        placeholder="Enter previous school name, if any"
                        value={formData.previousSchool}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Previous Class */}
                    <div className="form-field-group">
                      <label htmlFor="previousClass" className="form-label">
                        Previous Class <span className="label-optional">(Optional)</span>
                      </label>
                      <input
                        id="previousClass"
                        name="previousClass"
                        type="text"
                        className="form-input-clean"
                        placeholder="e.g., Grade 2 or UKG"
                        value={formData.previousClass}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Admission Request Note */}
                  <div className="admission-notice-pill">
                    <ShieldCheck size={15} className="text-muted" />
                    <span>
                      This is an admission request. Admission numbers and section allocations are officially assigned upon school management approval.
                    </span>
                  </div>
                </div>

                {/* SECTION C: PARENT INFORMATION */}
                <div className="form-section-block">
                  <div className="form-section-header">
                    <div className="section-badge">
                      <Layers size={14} />
                      <span>Section C</span>
                    </div>
                    <h3 className="section-title">Parent Information</h3>
                    <p className="section-desc">
                      The student will be linked directly to your authenticated parent account.
                    </p>
                  </div>

                  {/* Read-Only Authenticated Parent Info Cards */}
                  <div className="parent-info-readonly-grid">
                    <div className="readonly-item">
                      <span className="readonly-label">Parent Name</span>
                      <span className="readonly-value">{user?.name || 'Authenticated Parent'}</span>
                    </div>
                    <div className="readonly-item">
                      <span className="readonly-label">Registered Email</span>
                      <span className="readonly-value">{user?.email || 'parent@eduhub.local'}</span>
                    </div>
                    <div className="readonly-item">
                      <span className="readonly-label">Phone Number</span>
                      <span className="readonly-value">{user?.phone || 'Linked via Account'}</span>
                    </div>
                  </div>

                  <p className="parent-link-note">
                    ✓ This student will be linked to your parent account ({user?.email}).
                  </p>

                  <div className="form-fields-grid" style={{ marginTop: '16px' }}>
                    {/* Relationship to Student */}
                    <div className="form-field-group">
                      <label htmlFor="parentRelationship" className="form-label required">
                        Your Relationship to Student
                      </label>
                      <select
                        id="parentRelationship"
                        name="parentRelationship"
                        className={`form-select-clean ${errors.parentRelationship ? 'has-error' : ''}`}
                        value={formData.parentRelationship}
                        onChange={handleChange}
                      >
                        {metadata.relationships.map((rel) => (
                          <option key={rel.value} value={rel.value}>
                            {rel.label}
                          </option>
                        ))}
                      </select>
                      {errors.parentRelationship && (
                        <p className="field-error-msg">{errors.parentRelationship}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION D: SUPPORTING DOCUMENTS */}
                <div className="form-section-block">
                  <div className="form-section-header">
                    <div className="section-badge">
                      <FileText size={14} />
                      <span>Section D</span>
                    </div>
                    <h3 className="section-title">Supporting Documents</h3>
                    <p className="section-desc">
                      Upload any documents required by the school (e.g. Birth Certificate, Transfer Certificate, ID).
                    </p>
                  </div>

                  <div className="file-upload-zone">
                    <input
                      id="doc-upload"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="visually-hidden"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="doc-upload" className="file-upload-label">
                      <UploadCloud size={30} className="upload-icon" />
                      <span className="upload-text-main">
                        <strong>Click to upload</strong> or drag and drop files here
                      </span>
                      <span className="upload-text-sub">PDF, PNG, JPG (up to 5MB each)</span>
                    </label>
                  </div>

                  {/* Attached Document Badges */}
                  {formData.documents.length > 0 && (
                    <div className="uploaded-docs-list">
                      {formData.documents.map((doc, idx) => (
                        <div key={idx} className="uploaded-doc-item">
                          <FileText size={16} className="text-primary" />
                          <div className="uploaded-doc-info">
                            <span className="doc-name">{doc.name}</span>
                            {doc.size && <span className="doc-size">{doc.size}</span>}
                          </div>
                          <button
                            type="button"
                            className="btn-remove-doc"
                            onClick={() => handleRemoveDoc(idx)}
                            aria-label={`Remove ${doc.name}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* FORM ACTIONS */}
                <div className="form-actions-bar">
                  <button
                    type="button"
                    className="btn-form-cancel"
                    onClick={() => navigate('/parent/dashboard')}
                  >
                    Cancel
                  </button>

                  <button type="submit" className="btn-form-continue">
                    <span>Continue to Review</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: REVIEW & SUBMIT */}
            {currentStep === 2 && (
              <div className="review-step-container">
                <div className="review-intro">
                  <h3 className="review-title">Review Student Registration Details</h3>
                  <p className="review-desc">
                    Please double-check all the information below before submitting the admission request to the school.
                  </p>
                </div>

                <div className="review-card-sections">
                  {/* Student Details Card */}
                  <div className="review-block">
                    <div className="review-block-header">
                      <User size={16} className="text-primary" />
                      <h4>Student Details</h4>
                    </div>
                    <div className="review-grid">
                      <div className="review-grid-item">
                        <span className="review-label">Full Name:</span>
                        <strong className="review-val">{formData.studentFullName}</strong>
                      </div>
                      <div className="review-grid-item">
                        <span className="review-label">Date of Birth:</span>
                        <span className="review-val">
                          {new Date(formData.dateOfBirth).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="review-grid-item">
                        <span className="review-label">Gender:</span>
                        <span className="review-val">
                          {metadata.genders.find((g) => g.value === formData.gender)?.label || formData.gender}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* School Information Card */}
                  <div className="review-block">
                    <div className="review-block-header">
                      <GraduationCap size={16} className="text-primary" />
                      <h4>School Application</h4>
                    </div>
                    <div className="review-grid">
                      <div className="review-grid-item">
                        <span className="review-label">Class Applying For:</span>
                        <strong className="review-val text-primary">{formData.requestedGrade}</strong>
                      </div>
                      <div className="review-grid-item">
                        <span className="review-label">Academic Year:</span>
                        <span className="review-val">{formData.academicYear}</span>
                      </div>
                      {formData.previousSchool && (
                        <div className="review-grid-item">
                          <span className="review-label">Previous School:</span>
                          <span className="review-val">{formData.previousSchool}</span>
                        </div>
                      )}
                      {formData.previousClass && (
                        <div className="review-grid-item">
                          <span className="review-label">Previous Class:</span>
                          <span className="review-val">{formData.previousClass}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Parent Information Card */}
                  <div className="review-block">
                    <div className="review-block-header">
                      <Layers size={16} className="text-primary" />
                      <h4>Parent / Guardian</h4>
                    </div>
                    <div className="review-grid">
                      <div className="review-grid-item">
                        <span className="review-label">Parent Name:</span>
                        <span className="review-val">{user?.name || 'Authenticated Parent'}</span>
                      </div>
                      <div className="review-grid-item">
                        <span className="review-label">Registered Email:</span>
                        <span className="review-val">{user?.email || 'parent@eduhub.local'}</span>
                      </div>
                      <div className="review-grid-item">
                        <span className="review-label">Relationship:</span>
                        <span className="review-val">
                          {metadata.relationships.find((r) => r.value === formData.parentRelationship)?.label ||
                            formData.parentRelationship}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attached Documents Card */}
                  {formData.documents.length > 0 && (
                    <div className="review-block">
                      <div className="review-block-header">
                        <FileText size={16} className="text-primary" />
                        <h4>Attached Documents ({formData.documents.length})</h4>
                      </div>
                      <ul className="review-docs-list">
                        {formData.documents.map((doc, idx) => (
                          <li key={idx} className="review-doc-item">
                            <FileText size={14} className="text-muted" />
                            <span>{doc.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Final Advisory */}
                  <div className="review-advisory-box">
                    <ShieldCheck size={18} className="text-primary flex-shrink-0" />
                    <div>
                      <strong>Official Review Note</strong>
                      <p>
                        Submitting this request does not constitute official admission. School management will review the submission, verify class availability, and update the status accordingly.
                      </p>
                    </div>
                  </div>
                </div>

                {/* STEP 2 ACTIONS */}
                <div className="form-actions-bar">
                  <button
                    type="button"
                    className="btn-form-cancel"
                    onClick={handleEditDetails}
                    disabled={submitting}
                  >
                    <ArrowLeft size={16} />
                    <span>Edit Details</span>
                  </button>

                  <button
                    type="button"
                    className="btn-form-submit"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="spinner-sm" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Registration Request</span>
                        <CheckCircle2 size={17} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ParentLayout>
  );
};

export default AddStudentPage;
