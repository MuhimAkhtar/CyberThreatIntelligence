import React from 'react';
import { ThreatGraphVisualizer } from '../../components/graph/threat-graph-visualizer';
import './investigations-page.css';

interface Investigation {
  id: string;
  title: string;
  assignee: string;
  status: 'Open' | 'In Progress' | 'Closed';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  created: string;
  updated: string;
  iocCount: number;
  progress: number;
}

const DUMMY_INVESTIGATIONS: Investigation[] = [
  { id: 'INV-2024-0042', title: 'Suspicious C2 Communication in Sales Dept', assignee: 'Alex Chen', status: 'In Progress', priority: 'P1', created: '2024-03-29', updated: '10 mins ago', iocCount: 14, progress: 65 },
  { id: 'INV-2024-0041', title: 'Ransomware precursor: Cobalt Strike detection', assignee: 'Sarah Jenkins', status: 'Open', priority: 'P1', created: '2024-03-28', updated: '2 hours ago', iocCount: 5, progress: 0 },
  { id: 'INV-2024-0040', title: 'Excessive API usage from external IP', assignee: 'Mike Ross', status: 'In Progress', priority: 'P2', created: '2024-03-27', updated: '1 day ago', iocCount: 2, progress: 30 },
  { id: 'INV-2024-0039', title: 'Phishing campaign targeting executives', assignee: 'Alex Chen', status: 'Closed', priority: 'P3', created: '2024-03-25', updated: '3 days ago', iocCount: 8, progress: 100 },
  { id: 'INV-2024-0038', title: 'Unauthorized access to staging environment', assignee: 'Unassigned', status: 'Open', priority: 'P2', created: '2024-03-24', updated: '4 days ago', iocCount: 1, progress: 0 },
];

const getInitials = (name: string) => {
  if (name === 'Unassigned') return '?';
  return name.split(' ').map(n => n[0]).join('');
};

export const InvestigationsPage: React.FC = () => {
  return (
    <div className="investigations-page">
      <header className="page-header">
        <div className="page-header__title-container">
          <svg className="icon-large" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            <path d="M9 14h6"></path>
            <path d="M9 10h6"></path>
            <path d="M9 18h6"></path>
          </svg>
          <h1 className="page-header__title">Investigations &amp; Threat Knowledge Graph</h1>
        </div>
        <p className="page-header__subtitle">Manage active cases, incident response, and threat actor knowledge graphs.</p>
      </header>

      {/* Interactive Threat Actor Knowledge Graph Visualizer */}
      <ThreatGraphVisualizer />

      <div className="inv-toolbar" style={{ marginTop: '2rem' }}>
        <div className="stats-bar stats-bar--compact">
          <div className="stat-card">
            <span className="stat-card__label">Open</span>
            <span className="stat-card__value">4</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">In Progress</span>
            <span className="stat-card__value">8</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Closed (30d)</span>
            <span className="stat-card__value">23</span>
          </div>
        </div>
        
        <button className="btn btn--gradient">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          New Investigation
        </button>
      </div>

      <div className="investigations-grid">
        {DUMMY_INVESTIGATIONS.map((inv, idx) => (
          <div key={inv.id} className={`inv-card inv-card--${inv.priority.toLowerCase()}`} style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className="inv-card__header">
              <span className="inv-id">{inv.id}</span>
              <div className="inv-badges">
                <span className={`badge badge--priority-${inv.priority.toLowerCase()}`}>{inv.priority}</span>
                <span className={`badge badge--status-${inv.status.replace(' ', '-').toLowerCase()}`}>{inv.status}</span>
              </div>
            </div>
            
            <h3 className="inv-title">{inv.title}</h3>
            
            <div className="inv-meta">
              <div className="inv-assignee">
                <div className="avatar">{getInitials(inv.assignee)}</div>
                <span>{inv.assignee}</span>
              </div>
              <div className="inv-ioc-count">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                {inv.iocCount} IOCs
              </div>
            </div>
            
            <div className="inv-progress-section">
              <div className="inv-progress-label">
                <span>Progress</span>
                <span>{inv.progress}%</span>
              </div>
              <div className="inv-progress-bar">
                <div className="inv-progress-fill" style={{ width: `${inv.progress}%` }}></div>
              </div>
            </div>
            
            <div className="inv-footer">
              <span>Created: {inv.created}</span>
              <span>Updated: {inv.updated}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
