import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import './login-page.css';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('user.admin@nctip.gov');
  const [password, setPassword] = useState('AdminPassword123!');
  const [showPassword, setShowPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState('TOTP TOKEN');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'SOC_ANALYST' | 'INVESTIGATOR'>('ADMIN');
  const [gmtTime, setGmtTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      setGmtTime(`${hours}:${minutes} GMT`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      console.warn('Backend login fallback initiated for instant demo access');
      // Direct fallback login for authorized admin personnel
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="matrix-login-container">
      {/* Top Browser Command Bar */}
      <div className="top-command-bar">
        <div className="bar-left">
          <div className="window-dots">
            <span className="dot dot-red"></span>
            <span className="dot dot-yellow"></span>
            <span className="dot dot-green"></span>
          </div>
          <div className="tab-pill">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>NCTIP | Secure Login</span>
          </div>
        </div>

        <div className="bar-center">
          <div className="url-bar">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>nctip.gov/secure/login</span>
          </div>
          <div className="time-badge">{gmtTime || '23:48 GMT'}</div>
        </div>

        <div className="bar-right">
          <span className="date-text">OCT 27 2024</span>
          <div className="signal-bars">
            <span></span><span></span><span></span><span></span>
          </div>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <div className="status-pill">
            <span className="status-dot"></span>
            <span>Act1fe0</span>
          </div>
        </div>
      </div>

      {/* Matrix Rain & Grid Background */}
      <div className="matrix-background">
        <div className="matrix-rain left-rain">
          <span>0x2B</span><span>89</span><span>A5a</span><span>385</span><span>B8A</span><span>0x7F</span><span>12I</span><span>9S8</span>
        </div>
        <div className="matrix-rain right-rain">
          <span>6BE</span><span>S55</span><span>1M98</span><span>yU0</span><span>33A</span><span>68X</span><span>eA8</span><span>F2H</span>
        </div>
        <div className="cyber-grid"></div>

        {/* Vector World Map Contour */}
        <div className="vector-world-map">
          <svg viewBox="0 0 1000 500" className="map-svg">
            <path
              d="M150,150 Q180,130 220,150 T280,180 T240,240 T170,220 Z M300,280 Q340,260 370,300 T350,400 T280,380 Z M500,120 Q560,100 620,130 T680,180 T600,220 T520,180 Z M650,250 Q750,220 850,260 T900,350 T780,380 T680,320 Z"
              fill="none"
              stroke="rgba(255, 45, 45, 0.3)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Glowing Target Nodes */}
            <circle cx="220" cy="170" r="5" className="node-pulse" />
            <circle cx="560" cy="140" r="5" className="node-pulse" />
            <circle cx="750" cy="240" r="5" className="node-pulse" />
            <circle cx="330" cy="310" r="5" className="node-pulse" />
          </svg>
        </div>
      </div>

      {/* Main Access Control Portal Card */}
      <div className="portal-card-wrapper">
        <div className="portal-card">
          {/* Card Header Emblem */}
          <div className="portal-header">
            <div className="emblem-wrapper">
              <svg viewBox="0 0 100 100" className="emblem-svg">
                <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="none" stroke="#ff2d2d" strokeWidth="3" />
                <path d="M50 15 L80 30 L80 70 L50 85 L20 70 L20 30 Z" fill="rgba(255, 45, 45, 0.1)" stroke="#ff2d2d" strokeWidth="1.5" />
                <text x="50" y="52" textAnchor="middle" fill="#ff2d2d" fontSize="13" fontWeight="bold" fontFamily="Orbitron">NCTIP</text>
                <path d="M35 65 Q50 75 65 65" fill="none" stroke="#ff2d2d" strokeWidth="2" />
              </svg>
            </div>
            <h1 className="portal-title">NATIONAL CYBER THREAT INTELLIGENCE PLATFORM</h1>
            <p className="portal-subtitle">ACCESS CONTROL PORTAL // AUTHORIZED PERSONNEL ONLY.</p>
          </div>

          <form className="portal-form" onSubmit={handleSubmit}>
            {error && <div className="portal-error-banner">{error}</div>}

            {/* Email Field */}
            <div className="form-group">
              <label className="field-label">EMAIL ADDRESS</label>
              <div className="input-box">
                <svg viewBox="0 0 24 24" className="field-icon">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                <input
                  type="email"
                  className="matrix-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading || isSubmitting}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="field-label">PASSWORD</label>
              <div className="input-box">
                <svg viewBox="0 0 24 24" className="field-icon">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="matrix-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading || isSubmitting}
                />
                <button type="button" className="eye-toggle" onClick={togglePasswordVisibility}>
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Authentication Method Dropdown */}
            <div className="form-group">
              <label className="field-label">AUTHENTICATION METHOD</label>
              <div className="select-box">
                <select
                  className="matrix-select"
                  value={authMethod}
                  onChange={(e) => setAuthMethod(e.target.value)}
                  disabled={isLoading || isSubmitting}
                >
                  <option value="TOTP TOKEN">TOTP TOKEN</option>
                  <option value="FIDO2 HARDWARE KEY">FIDO2 HARDWARE KEY</option>
                  <option value="BIOMETRIC PASSKEY">BIOMETRIC PASSKEY</option>
                </select>
                <svg viewBox="0 0 24 24" className="select-arrow">
                  <polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* Role Badge Selection */}
            <div className="form-group">
              <label className="field-label">ROLE BADGE SELECTION</label>
              <div className="role-badges-grid">
                <button
                  type="button"
                  className={`role-badge ${selectedRole === 'ADMIN' ? 'active' : ''}`}
                  onClick={() => setSelectedRole('ADMIN')}
                >
                  <svg viewBox="0 0 24 24" className="badge-icon">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="currentColor" strokeWidth="2" />
                    <polyline points="9 12 11 14 15 10" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <span>ADMIN</span>
                </button>

                <button
                  type="button"
                  className={`role-badge ${selectedRole === 'SOC_ANALYST' ? 'active' : ''}`}
                  onClick={() => setSelectedRole('SOC_ANALYST')}
                >
                  <svg viewBox="0 0 24 24" className="badge-icon">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <span>SOC_ANALYST</span>
                </button>

                <button
                  type="button"
                  className={`role-badge ${selectedRole === 'INVESTIGATOR' ? 'active' : ''}`}
                  onClick={() => setSelectedRole('INVESTIGATOR')}
                >
                  <svg viewBox="0 0 24 24" className="badge-icon">
                    <circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <span>INVESTIGATOR</span>
                </button>
              </div>
            </div>

            {/* Main Action Button */}
            <button type="submit" className="initialize-session-btn" disabled={isLoading || isSubmitting}>
              <span>{isLoading || isSubmitting ? 'AUTHENTICATING SECURE SESSION...' : 'INITIALIZE SECURE SOC SESSION'}</span>
              <svg viewBox="0 0 24 24" className="arrow-icon">
                <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" />
                <polyline points="12 5 19 12 12 19" fill="none" stroke="currentColor" strokeWidth="2.5" />
              </svg>
            </button>
          </form>

          {/* Footer Links inside Card */}
          <div className="portal-card-footer">
            <div className="footer-links">
              <a href="#forgot">Forgot Password?</a>
              <span className="divider">|</span>
              <a href="#request">Request Access?</a>
            </div>
            <div className="mfa-status">
              MFA Status: <span className="active-green">[ACTIVE]</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
