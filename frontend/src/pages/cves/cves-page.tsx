import React from 'react';
import './cves-page.css';

interface CVE {
  id: string;
  score: number;
  description: string;
  products: string[];
  published: string;
  status: string;
}

const DUMMY_CVES: CVE[] = [
  { id: 'CVE-2024-3094', score: 10.0, description: 'Malicious code discovered in the upstream tarballs of xz, starting with version 5.6.0. The payload intercepts and modifies the RSA decryption in sshd.', products: ['xz', 'liblzma'], published: '2024-03-29', status: 'Analyzed' },
  { id: 'CVE-2023-4863', score: 8.8, description: 'Heap buffer overflow in WebP in Google Chrome prior to 116.0.5845.187 allowed a remote attacker to perform an out of bounds memory write via a crafted HTML page.', products: ['libwebp', 'Chrome'], published: '2023-09-12', status: 'Modified' },
  { id: 'CVE-2024-21412', score: 8.1, description: 'Internet Shortcut Files Security Feature Bypass Vulnerability. An attacker can craft a file to bypass Mark of the Web (MotW) warnings.', products: ['Windows 11', 'Windows Server'], published: '2024-02-13', status: 'Analyzed' },
  { id: 'CVE-2023-44487', score: 7.5, description: 'The HTTP/2 protocol allows a denial of service (server resource consumption) because request cancellation can reset many streams quickly (Rapid Reset).', products: ['HTTP/2', 'Nginx', 'Apache'], published: '2023-10-10', status: 'Analyzed' },
  { id: 'CVE-2024-1709', score: 9.8, description: 'Authentication Bypass vulnerability in ConnectWise ScreenConnect allows an attacker to create an administrative user account and execute arbitrary code.', products: ['ScreenConnect'], published: '2024-02-21', status: 'Under Review' },
  { id: 'CVE-2023-3519', score: 9.8, description: 'Unauthenticated remote code execution vulnerability in Citrix NetScaler ADC and NetScaler Gateway.', products: ['NetScaler ADC', 'Gateway'], published: '2023-07-18', status: 'Analyzed' },
];

const getSeverityClass = (score: number) => {
  if (score >= 9.0) return 'critical';
  if (score >= 7.0) return 'high';
  if (score >= 4.0) return 'medium';
  return 'low';
};

export const CvesPage: React.FC = () => {
  return (
    <div className="cves-page">
      <header className="page-header">
        <div className="page-header__title-container">
          <svg className="icon-large" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h1 className="page-header__title">CVE Database</h1>
        </div>
        <p className="page-header__subtitle">Vulnerability intelligence and common exposures registry.</p>
      </header>

      <div className="stats-bar">
        <div className="stat-card">
          <span className="stat-card__label">Total Tracked</span>
          <span className="stat-card__value">24,592</span>
        </div>
        <div className="stat-card stat-card--critical">
          <span className="stat-card__label">Critical (9.0+)</span>
          <span className="stat-card__value">1,402</span>
        </div>
        <div className="stat-card stat-card--high">
          <span className="stat-card__label">High (7.0-8.9)</span>
          <span className="stat-card__value">8,934</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Recent (7d)</span>
          <span className="stat-card__value">145</span>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-bar__input-group">
          <svg className="icon-small" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Search by CVE-ID or keyword..." className="filter-input" />
        </div>
        <select className="filter-select">
          <option value="">All Severities</option>
          <option value="critical">Critical (9.0 - 10.0)</option>
          <option value="high">High (7.0 - 8.9)</option>
        </select>
        <button className="btn btn--outline">
          <svg className="icon-micro" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Date Range
        </button>
      </div>

      <div className="cves-list">
        {DUMMY_CVES.map((cve, idx) => {
          const sev = getSeverityClass(cve.score);
          return (
            <div key={cve.id} className={`cve-card cve-card--${sev}`} style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="cve-card__left">
                <h3 className="cve-id">{cve.id}</h3>
                <div className={`cvss-badge cvss-badge--${sev}`}>
                  <span className="cvss-badge__label">CVSS</span>
                  <span className="cvss-badge__score">{cve.score.toFixed(1)}</span>
                </div>
              </div>
              <div className="cve-card__main">
                <p className="cve-desc">{cve.description}</p>
                <div className="cve-meta">
                  <div className="cve-tags">
                    {cve.products.map(prod => (
                      <span key={prod} className="cve-tag">{prod}</span>
                    ))}
                  </div>
                  <div className="cve-info">
                    <span>Published: {cve.published}</span>
                    <span className="cve-status">• {cve.status}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
