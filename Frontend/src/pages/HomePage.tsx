import React, { useEffect, useState, useCallback } from 'react';
import {
  Server,
  Database,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Users,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Lock,
  BookOpen,
  UserCheck
} from 'lucide-react';
import { healthApi } from '../api/healthApi';
import { SystemHealthData } from '../types/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';
import { useAppDispatch } from '../store/hooks';
import { setLastPing } from '../store/slices/appSlice';
//hi
export const HomePage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  const fetchHealthStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await healthApi.getSystemHealth();
      if (response.success && response.data) {
        setHealth(response.data);
        dispatch(setLastPing(response.timestamp));
      } else {
        setError(response.message || 'Received unexpected response structure');
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Failed to connect to backend server. Make sure the backend is running on port 5000.';
      setError(msg);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchHealthStatus();
  }, [fetchHealthStatus]);

  return (
    <div className="home-page-container">
      {/* Hero Section */}
      <section className="hero-banner">
        <div className="hero-badge">
          <Sparkles size={16} />
          <span>Foundation Stage 1 • Ready</span>
        </div>
        <h1 className="hero-title">
          EduHub <span className="gradient-text">School ERP</span> Platform
        </h1>
        <p className="hero-description">
          A modern, full-stack single-school management ecosystem designed with a clean Modular Monolith
          architecture in TypeScript, React, Redux Toolkit, Node.js, Express, and MongoDB.
        </p>
      </section>

      {/* System Diagnostic Grid */}
      <section className="status-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <Server className="section-icon" size={22} />
            <h2>Full-Stack System Diagnostic</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHealthStatus}
            isLoading={loading}
          >
            Re-test Connection
          </Button>
        </div>

        {loading && !health && !error ? (
          <div className="diagnostic-loading-card">
            <Spinner size="lg" />
            <p>Verifying API & Database Connectivity...</p>
          </div>
        ) : (
          <div className="diagnostic-grid">
            {/* Backend API Card */}
            <Card className="status-card" hoverable>
              <div className="card-top">
                <div className="card-icon-wrap api-icon">
                  <Server size={24} />
                </div>
                {health ? (
                  <Badge variant="success">Online</Badge>
                ) : (
                  <Badge variant="error">Offline</Badge>
                )}
              </div>
              <h3 className="card-title">Backend API Service</h3>
              <p className="card-desc">Express + TypeScript REST endpoint handler</p>

              <div className="status-metrics">
                <div className="metric-row">
                  <span className="metric-label">Status</span>
                  <span className="metric-value">
                    {health ? (
                      <span className="inline-success"><CheckCircle2 size={16} /> Operational</span>
                    ) : (
                      <span className="inline-error"><AlertTriangle size={16} /> Unreachable</span>
                    )}
                  </span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Base URL</span>
                  <span className="metric-value code-font">
                    {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}
                  </span>
                </div>
                {health && (
                  <div className="metric-row">
                    <span className="metric-label">Uptime</span>
                    <span className="metric-value">{health.uptime} seconds</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Database Card */}
            <Card className="status-card" hoverable>
              <div className="card-top">
                <div className="card-icon-wrap db-icon">
                  <Database size={24} />
                </div>
                {health?.database.status === 'connected' ? (
                  <Badge variant="success">Connected</Badge>
                ) : (
                  <Badge variant="warning">Disconnected</Badge>
                )}
              </div>
              <h3 className="card-title">MongoDB Database</h3>
              <p className="card-desc">Mongoose ODM connection & schemas</p>

              <div className="status-metrics">
                <div className="metric-row">
                  <span className="metric-label">Connection</span>
                  <span className="metric-value capitalize">
                    {health?.database.status || 'Offline / Standby'}
                  </span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Database Name</span>
                  <span className="metric-value code-font">
                    {health?.database.name || 'eduhub'}
                  </span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Node Memory</span>
                  <span className="metric-value">
                    {health ? `${health.server.memoryUsageMB} MB` : 'N/A'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Architecture Card */}
            <Card className="status-card" hoverable>
              <div className="card-top">
                <div className="card-icon-wrap arch-icon">
                  <Layers size={24} />
                </div>
                <Badge variant="info">Modular Monolith</Badge>
              </div>
              <h3 className="card-title">Architecture Pipeline</h3>
              <p className="card-desc">Controllers, Services, Routes, Middlewares, Redux</p>

              <div className="status-metrics">
                <div className="metric-row">
                  <span className="metric-label">Error Handling</span>
                  <span className="metric-value inline-success">
                    <CheckCircle2 size={16} /> Centralized
                  </span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">State Management</span>
                  <span className="metric-value inline-success">
                    <CheckCircle2 size={16} /> Redux Toolkit
                  </span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Response Envelope</span>
                  <span className="metric-value inline-success">
                    <CheckCircle2 size={16} /> Standardized
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <ShieldAlert size={20} className="error-icon" />
            <div className="error-text">
              <strong>Connection Warning:</strong> {error}
              <div className="error-tip">
                Run <code>npm run dev</code> in the <code>Backend</code> folder to spin up the API server.
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Role Architecture Foundation */}
      <section className="roles-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <Users className="section-icon" size={22} />
            <h2>3-Tier User Role Architecture</h2>
          </div>
        </div>

        <div className="roles-grid">
          {/* Management Role */}
          <Card className="role-card management-card">
            <div className="role-header">
              <div className="role-icon-box management-icon">
                <Lock size={22} />
              </div>
              <div>
                <h3>1. Management</h3>
                <span className="role-tag">Admin & Institutional Oversight</span>
              </div>
            </div>
            <p className="role-desc">
              Complete administrative authority over school operations, academic batches, teacher & parent
              onboarding, financial fee structures, and master student rosters.
            </p>
          </Card>

          {/* Teacher Role */}
          <Card className="role-card teacher-card">
            <div className="role-header">
              <div className="role-icon-box teacher-icon">
                <BookOpen size={22} />
              </div>
              <div>
                <h3>2. Teacher</h3>
                <span className="role-tag">Academic & Classroom Management</span>
              </div>
            </div>
            <p className="role-desc">
              Daily classroom workflows including attendance logging, grade book entry, exam records, syllabus
              tracking, and direct remarks on student performance.
            </p>
          </Card>

          {/* Parent Role */}
          <Card className="role-card parent-card">
            <div className="role-header">
              <div className="role-icon-box parent-icon">
                <UserCheck size={22} />
              </div>
              <div>
                <h3>3. Parent</h3>
                <span className="role-tag">Student Ward Monitoring</span>
              </div>
            </div>
            <p className="role-desc">
              Ward oversight portal. Students do not have standalone login accounts; parents view attendance,
              exam progress, fee dues, and teacher feedback for their linked children.
            </p>
          </Card>
        </div>
      </section>

      {/* Foundation Verification Summary */}
      <section className="next-steps-card">
        <div className="next-steps-content">
          <div>
            <h3>Foundation Layer Complete & Ready for Next Steps</h3>
            <p>
              The modular architecture, environment separation, Mongoose connection, standardized API envelopes,
              centralized error handlers, and Redux store are configured and verified.
            </p>
          </div>
          <div className="step-badge">
            <span>Next: Authentication Module</span>
            <ArrowRight size={18} />
          </div>
        </div>
      </section>
    </div>
  );
};
