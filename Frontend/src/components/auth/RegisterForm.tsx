import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck, Mail, RotateCw } from 'lucide-react';
import { authApi } from '../../api/authApi';

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Field toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation & Server Errors
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // OTP Verification Step
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessStep, setIsSuccessStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSentMessage, setOtpSentMessage] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);

  const validateForm = (): boolean => {
    let isValid = true;
    setFullNameError(null);
    setEmailError(null);
    setPhoneError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setTermsError(null);
    setServerError(null);

    // Full Name
    if (!fullName.trim() || fullName.trim().length < 2) {
      setFullNameError('Please enter your full name (at least 2 characters).');
      isValid = false;
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Please enter your email address.');
      isValid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    // Phone Number
    const cleanPhone = phone.replace(/\D/g, '');
    if (!phone.trim()) {
      setPhoneError('Please enter your phone number.');
      isValid = false;
    } else if (cleanPhone.length < 7) {
      setPhoneError('Please enter a valid phone number (at least 7 digits).');
      isValid = false;
    }

    // Password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      isValid = false;
    } else if (!passwordRegex.test(password)) {
      setPasswordError('Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number.');
      isValid = false;
    }

    // Confirm Password
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      isValid = false;
    }

    // Terms & Conditions
    if (!agreeTerms) {
      setTermsError('You must agree to the Terms & Conditions and Privacy Policy.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setServerError(null);

    try {
      await authApi.registerParent({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        acceptedTerms: true,
      });

      setIsSuccessStep(true);
      setOtpSentMessage('A 6-digit verification code has been dispatched to your email.');
    } catch (err: any) {
      setServerError(err.message || 'Failed to create parent account. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Please enter a valid 6-digit verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      await authApi.verifyEmail({
        email: email.trim().toLowerCase(),
        code: otpCode.trim(),
      });

      setIsVerifiedSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setOtpError(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError(null);
    try {
      await authApi.resendVerification({ email: email.trim().toLowerCase() });
      setOtpSentMessage('A fresh verification code has been dispatched to your email.');
      setTimeout(() => setOtpSentMessage(null), 5000);
    } catch (err: any) {
      setOtpError(err.message || 'Unable to resend verification code right now.');
    }
  };

  // SUCCESS / VERIFICATION SCREEN STEP
  if (isSuccessStep) {
    return (
      <div className="auth-form-wrapper" style={{ textAlign: 'center', padding: '28px 24px' }}>
        <div className="register-success-icon-box">
          <Mail size={32} className="register-mail-icon" />
        </div>

        <div className="auth-form-header" style={{ borderBottom: 'none', paddingBottom: '4px' }}>
          <h3 className="auth-form-title" style={{ fontSize: '1.35rem' }}>
            Verify Your Parent Email
          </h3>
          <p className="auth-form-subtitle" style={{ marginTop: '6px' }}>
            We have sent a 6-digit activation code to <strong>{email}</strong>.
          </p>
        </div>

        {otpSentMessage && (
          <div className="auth-feedback-banner feedback-info" style={{ marginTop: '8px', textAlign: 'left' }}>
            <CheckCircle2 size={16} className="feedback-icon" />
            <span className="feedback-text">{otpSentMessage}</span>
          </div>
        )}

        {otpError && (
          <div className="auth-feedback-banner feedback-error" style={{ marginTop: '8px', textAlign: 'left' }}>
            <AlertCircle size={16} className="feedback-icon" />
            <span className="feedback-text">{otpError}</span>
          </div>
        )}

        {isVerifiedSuccess && (
          <div className="auth-feedback-banner feedback-success" style={{ marginTop: '8px', textAlign: 'left' }}>
            <CheckCircle2 size={16} className="feedback-icon" />
            <span className="feedback-text">Email verified successfully! Redirecting to login...</span>
          </div>
        )}

        {!isVerifiedSuccess && (
          <form onSubmit={handleVerifyOtp} className="otp-verification-block" style={{ marginTop: '16px' }}>
            <label htmlFor="otp-input" className="auth-field-label" style={{ textAlign: 'left', display: 'block' }}>
              Enter 6-Digit Verification Code
            </label>
            <input
              id="otp-input"
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => {
                setOtpCode(e.target.value.replace(/\D/g, ''));
                if (otpError) setOtpError(null);
              }}
              placeholder="123456"
              className="auth-field-input"
              style={{
                textAlign: 'center',
                letterSpacing: '6px',
                fontSize: '1.25rem',
                fontWeight: '700',
                fontFamily: 'var(--font-mono)',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Didn&apos;t receive code?
              </span>
              <button
                type="button"
                onClick={handleResendOtp}
                className="auth-forgot-link"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
              >
                <RotateCw size={13} />
                <span>Resend Code</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isVerifyingOtp || otpCode.length !== 6}
              className="btn-auth-submit"
              style={{ marginTop: '18px' }}
            >
              {isVerifyingOtp ? (
                <>
                  <span className="auth-spinner" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify Email & Activate Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            className="btn-nav-primary"
            onClick={() => navigate('/login')}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <span>Back to Login</span>
          </button>
        </div>
      </div>
    );
  }

  // MAIN REGISTRATION FORM
  return (
    <div className="auth-form-wrapper">
      <div className="auth-form-header">
        <h3 className="auth-form-title">Create Your Parent Account</h3>
        <p className="auth-form-subtitle">Join EduHub to connect with your child&apos;s school.</p>
      </div>

      {serverError && (
        <div className="auth-feedback-banner feedback-error" style={{ marginBottom: '16px' }}>
          <AlertCircle size={16} className="feedback-icon" />
          <span className="feedback-text">{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Full Name */}
        <div className="auth-field-group">
          <label htmlFor="reg-fullname" className="auth-field-label">
            Full Name
          </label>
          <input
            id="reg-fullname"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fullNameError) setFullNameError(null);
            }}
            placeholder="Enter your full name"
            className={`auth-field-input ${fullNameError ? 'input-error' : ''}`}
          />
          {fullNameError && <p className="auth-error-message">{fullNameError}</p>}
        </div>

        {/* Email Address */}
        <div className="auth-field-group">
          <label htmlFor="reg-email" className="auth-field-label">
            Email Address
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            placeholder="Enter your email address"
            className={`auth-field-input ${emailError ? 'input-error' : ''}`}
          />
          {emailError && <p className="auth-error-message">{emailError}</p>}
        </div>

        {/* Phone Number */}
        <div className="auth-field-group">
          <label htmlFor="reg-phone" className="auth-field-label">
            Phone Number
          </label>
          <input
            id="reg-phone"
            type="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (phoneError) setPhoneError(null);
            }}
            placeholder="Enter your phone number"
            className={`auth-field-input ${phoneError ? 'input-error' : ''}`}
          />
          {phoneError && <p className="auth-error-message">{phoneError}</p>}
        </div>

        {/* Password Fields Row on Desktop */}
        <div className="reg-passwords-row">
          {/* Password */}
          <div className="auth-field-group" style={{ flex: 1, marginBottom: 0 }}>
            <label htmlFor="reg-password" className="auth-field-label">
              Password
            </label>
            <div className="auth-password-input-wrap">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                className={`auth-field-input ${passwordError ? 'input-error' : ''}`}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordError && <p className="auth-error-message">{passwordError}</p>}
          </div>

          {/* Confirm Password */}
          <div className="auth-field-group" style={{ flex: 1, marginBottom: 0 }}>
            <label htmlFor="reg-confirm-password" className="auth-field-label">
              Confirm Password
            </label>
            <div className="auth-password-input-wrap">
              <input
                id="reg-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) setConfirmPasswordError(null);
                }}
                placeholder="Re-enter password"
                className={`auth-field-input ${confirmPasswordError ? 'input-error' : ''}`}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPasswordError && <p className="auth-error-message">{confirmPasswordError}</p>}
          </div>
        </div>

        {/* Terms & Privacy Checkbox */}
        <div className="auth-remember-row" style={{ marginTop: '8px', marginBottom: '8px' }}>
          <label className="custom-checkbox-label" style={{ alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (termsError) setTermsError(null);
              }}
              className="custom-checkbox-input"
              style={{ marginTop: '3px' }}
            />
            <span className="checkbox-text" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
              I agree to the{' '}
              <a href="#terms" onClick={(e) => e.preventDefault()} style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
                Terms & Conditions
              </a>{' '}
              and{' '}
              <a href="#privacy" onClick={(e) => e.preventDefault()} style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
                Privacy Policy
              </a>.
            </span>
          </label>
        </div>
        {termsError && <p className="auth-error-message" style={{ marginTop: '-4px', marginBottom: '6px' }}>{termsError}</p>}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-auth-submit"
          style={{ marginTop: '4px' }}
        >
          {isLoading ? (
            <>
              <span className="auth-spinner" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <span>Create Parent Account</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Footer Navigation Link to Login */}
      <div className="auth-form-footer-note" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <span>Already have an account?</span>
        <Link to="/login" className="login-role-link">
          Log In
        </Link>
      </div>

      {/* Advisory Note */}
      <div style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
        <ShieldCheck size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
        <span>Parent registration only. Student admission details are submitted post-login.</span>
      </div>
    </div>
  );
};
