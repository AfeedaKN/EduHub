import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck, Mail } from 'lucide-react';
import { UserRole } from './LoginRoleSelector';
import { authApi } from '../../api/authApi';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials } from '../../store/slices/authSlice';

interface LoginFormProps {
  selectedRole: UserRole;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ selectedRole, onSuccess }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Form interaction & validation states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formFeedback, setFormFeedback] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password Modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotFeedback, setForgotFeedback] = useState<string | null>(null);

  // Contextual Content per Role
  const roleContentMap: Record<
    UserRole,
    {
      title: string;
      subtitle: string;
      emailPlaceholder: string;
      footerNote: React.ReactNode;
    }
  > = {
    PARENT: {
      title: 'Parent Login',
      subtitle: "Stay connected with your child's school.",
      emailPlaceholder: 'parent@example.com',
      footerNote: (
        <div className="login-footer-role-note">
          <span>New to EduHub? </span>
          <Link to="/register" className="login-role-link">
            Register as a Parent
          </Link>
        </div>
      ),
    },
    TEACHER: {
      title: 'Teacher Login',
      subtitle: 'Access your classes and teaching activities.',
      emailPlaceholder: 'teacher@school.edu',
      footerNote: (
        <div className="login-footer-role-note text-muted">
          Need help accessing your account? <strong>Contact your school administrator.</strong>
        </div>
      ),
    },
    MANAGEMENT: {
      title: 'Management Login',
      subtitle: "Manage your school's daily operations.",
      emailPlaceholder: 'admin@school.edu',
      footerNote: (
        <div className="login-footer-role-note text-muted">
          <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
          Authorized school management accounts only.
        </div>
      ),
    },
  };

  const currentRoleContent = roleContentMap[selectedRole];

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setFormFeedback(null);

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email address is required.');
      isValid = false;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    // Password validation
    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setFormFeedback(null);

    try {
      const response = await authApi.login({
        email: email.trim().toLowerCase(),
        password,
        selectedRole,
      });

      if (response.data) {
        const { user, accessToken } = response.data;
        dispatch(
          setCredentials({
            user: {
              id: user.id,
              name: user.fullName,
              email: user.email,
              role: user.role,
            },
            token: accessToken,
          })
        );

        setFormFeedback({
          type: 'success',
          message: `Welcome back, ${user.fullName}! Login successful.`,
        });

        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else if (user.role === 'PARENT') {
            navigate('/parent/dashboard');
          } else {
            navigate('/system-status');
          }
        }, 1000);
      }
    } catch (err: any) {
      setFormFeedback({
        type: 'error',
        message: err.message || 'Invalid email, password, or selected role.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setForgotLoading(true);
    try {
      await authApi.forgotPassword({ email: forgotEmail.trim().toLowerCase() });
      setForgotFeedback('If an account exists with this email, password recovery instructions have been sent.');
    } catch (err: any) {
      setForgotFeedback(err.message || 'Unable to process password reset request.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-form-wrapper">
      {/* Contextual Header */}
      <div className="auth-form-header">
        <h3 className="auth-form-title">{currentRoleContent.title}</h3>
        <p className="auth-form-subtitle">{currentRoleContent.subtitle}</p>
      </div>

      {/* Inline Feedback Banner */}
      {formFeedback && (
        <div className={`auth-feedback-banner feedback-${formFeedback.type}`}>
          {formFeedback.type === 'error' && <AlertCircle size={18} className="feedback-icon" />}
          {formFeedback.type === 'success' && <CheckCircle2 size={18} className="feedback-icon" />}
          {formFeedback.type === 'info' && <ShieldCheck size={18} className="feedback-icon" />}
          <span className="feedback-text">{formFeedback.message}</span>
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} noValidate>
        {/* Email Field */}
        <div className="auth-field-group">
          <label htmlFor="login-email" className="auth-field-label">
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            placeholder={currentRoleContent.emailPlaceholder}
            className={`auth-field-input ${emailError ? 'input-error' : ''}`}
          />
          {emailError && <p className="auth-error-message">{emailError}</p>}
        </div>

        {/* Password Field */}
        <div className="auth-field-group">
          <div className="auth-field-header-row">
            <label htmlFor="login-password" className="auth-field-label" style={{ marginBottom: 0 }}>
              Password
            </label>
            <button
              type="button"
              className="auth-forgot-link"
              onClick={() => {
                setForgotEmail(email);
                setForgotFeedback(null);
                setShowForgotModal(true);
              }}
            >
              Forgot Password?
            </button>
          </div>

          <div className="auth-password-input-wrap">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(null);
              }}
              placeholder="Enter your password"
              className={`auth-field-input ${passwordError ? 'input-error' : ''}`}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {passwordError && <p className="auth-error-message">{passwordError}</p>}
        </div>

        {/* Remember Me Checkbox */}
        <div className="auth-remember-row">
          <label className="custom-checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="custom-checkbox-input"
            />
            <span className="checkbox-text">Remember this device</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-auth-submit"
        >
          {isLoading ? (
            <>
              <span className="auth-spinner" />
              <span>Verifying Credentials...</span>
            </>
          ) : (
            <>
              <span>Sign In as {selectedRole.charAt(0) + selectedRole.slice(1).toLowerCase()}</span>
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>

      {/* Role Contextual Footer Note */}
      <div className="auth-form-footer-note">
        {currentRoleContent.footerNote}
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="auth-modal-backdrop" onClick={() => setShowForgotModal(false)}>
          <div className="auth-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h4 className="auth-modal-title">Password Recovery</h4>
            <p className="auth-modal-desc">
              Enter your registered email address to receive a secure password reset link.
            </p>

            {forgotFeedback && (
              <div className="auth-feedback-banner feedback-info" style={{ marginTop: '12px', textAlign: 'left' }}>
                <Mail size={16} className="feedback-icon" />
                <span className="feedback-text">{forgotFeedback}</span>
              </div>
            )}

            {!forgotFeedback && (
              <form onSubmit={handleForgotPasswordSubmit} style={{ marginTop: '14px' }}>
                <div className="auth-field-group">
                  <label htmlFor="forgot-email" className="auth-field-label">
                    Registered Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@school.edu"
                    className="auth-field-input"
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button
                    type="button"
                    className="btn-nav-primary"
                    onClick={() => setShowForgotModal(false)}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="btn-auth-submit"
                    style={{ flex: 1 }}
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}

            {forgotFeedback && (
              <div className="auth-modal-actions" style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-nav-primary"
                  onClick={() => setShowForgotModal(false)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
