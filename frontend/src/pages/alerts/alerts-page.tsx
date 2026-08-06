import React from 'react';
import './alerts-page.css';

interface Alert {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  source: string;
  timestamp: string;
  description: string;
  status: 'Open' | 'Acknowledged' | 'Resolved';
}

const DUMMY_ALERTS: Alert[] = [
  { id: 'ALT-101', title: 'Suspicious Lateral Movement', severity: 'Critical', source: 'Endpoint-DB1', timestamp: '2 mins ago', description: 'Multiple failed login attempts followed by successful RDP connection from an unknown IP address.', status: 'Open' },
  { id: 'ALT-102', title: 'Malware Payload Detected', severity: 'High', source: 'Network-Gateway', timestamp: '15 mins ago', description: 'Download of known malicious payload blocked at gateway. Signature matches Emotet variant.', status: 'Open' },
  { id: 'ALT-103', title: 'Unusual Data Exfiltration', severity: 'Critical', source: 'Cloud-Storage', timestamp: '1 hour ago', description: 'Large volume of data (50GB+) transferred to external cloud service (Mega) during off-hours.', status: 'Acknowledged' },
  { id: 'ALT-104', title: 'Privilege Escalation Attempt', severity: 'Medium', source: 'Active-Directory', timestamp: '2 hours ago', description: 'User account attempting to add itself to Domain Admins group via script.', status: 'Resolved' },
  { id: 'ALT-105', title: 'C2 Beaconing Activity', severity: 'High', source: 'Firewall-Perimeter', timestamp: '3 hours ago', description: 'Internal host communicating with known Command & Control IP address on port 443.', status: 'Open' },
  { id: 'ALT-106', title: 'Multiple Failed Authentications', severity: 'Low', source: 'VPN-Gateway', timestamp: '4 hours ago', description: 'Consecutive failed login attempts for multiple user accounts originating from a single foreign IP.', status: 'Open' }
];

export const AlertsPage: React.FC = () => {
  return (
    <div className="alerts-page">
      <header className="page-header">
        <div className="page-header__title-container">
          <svg className="icon-large" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <h1 className="page-header__title">Alerts Center</h1>
        </div>
        <p className="page-header__subtitle">Real-time threat monitoring and active incident alerts.</p>
      </header>

      <div className="stats-bar">
        <div className="stat-card stat-card--critical">
          <span className="stat-card__label">Critical</span>
          <span className="stat-card__value">7</span>
        </div>
        <div className="stat-card stat-card--high">
          <span className="stat-card__label">High</span>
          <span className="stat-card__value">23</span>
        </div>
        <div className="stat-card stat-card--medium">
          <span className="stat-card__label">Medium</span>
          <span className="stat-card__value">45</span>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-bar__input-group">
          <svg className="icon-small" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" placeholder="Search alerts..." className="filter-input" />
        </div>
        <select className="filter-select">
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
        </select>
        <select className="filter-select">
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="alerts-list">
        {DUMMY_ALERTS.map(alert => (
          <div key={alert.id} className={`alert-card alert-card--${alert.severity.toLowerCase()}`}>
            <div className="alert-card__header">
              <div className="alert-card__title-group">
                <span className={`badge badge--${alert.severity.toLowerCase()}`}>{alert.severity}</span>
                <h3 className="alert-card__title">{alert.title}</h3>
              </div>
              <span className="alert-card__time">{alert.timestamp}</span>
            </div>
            
            <div className="alert-card__meta">
              <span className="meta-item">
                <svg className="icon-micro" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
                {alert.source}
              </span>
              <span className="meta-item">
                <svg className="icon-micro" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                {alert.id}
              </span>
              <span className="meta-item">Status: {alert.status}</span>
            </div>
            
            <p className="alert-card__desc">{alert.description}</p>
            
            <div className="alert-card__actions">
              <button className="btn btn--outline">Acknowledge</button>
              <button className="btn btn--primary">Investigate</button>
              <button className="btn btn--ghost">Dismiss</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
