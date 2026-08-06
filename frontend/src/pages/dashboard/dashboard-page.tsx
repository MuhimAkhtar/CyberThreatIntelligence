import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { GlobalAttackMap } from '../../components/dashboard/global-attack-map';
import './dashboard-page.css';

const IconTriangleWarning = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);

const IconBell = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
);

const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);

const IconShieldCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
);

const IconTimeline = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const IconSatellite = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 7 9 3 5 7l4 4"/><path d="m17 11 4 4-4 4-4-4"/><path d="m8 12 4 4 6-6-4-4Z"/><path d="m16 8 3-3"/><path d="M9 21a6 6 0 0 0-6-6"/></svg>
);

const AnimatedCounter = ({ value, duration = 1500 }: { value: number, duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{count}</span>;
};

interface DashboardData {
  kpis: {
    activeThreats: number;
    openAlerts: number;
    investigations: number;
    healthScore: number;
  };
  severityDist: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  attacks: Array<{
    id: string;
    ip: string;
    location: string;
    countryCode: string;
    confidence: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }>;
  timeline: Array<{
    id: string;
    time: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    event: string;
    relTime: string;
  }>;
}

const defaultData: DashboardData = {
  kpis: {
    activeThreats: 142,
    openAlerts: 328,
    investigations: 17,
    healthScore: 98
  },
  severityDist: {
    critical: 12,
    high: 28,
    medium: 45,
    low: 10,
    info: 5
  },
  attacks: [
    { id: '1', ip: '192.168.1.105', location: 'Moscow, Russia', countryCode: 'RU', confidence: 94, severity: 'critical' },
    { id: '2', ip: '10.0.45.2', location: 'Beijing, China', countryCode: 'CN', confidence: 88, severity: 'high' },
    { id: '3', ip: '172.16.0.4', location: 'Tehran, Iran', countryCode: 'IR', confidence: 75, severity: 'medium' },
    { id: '4', ip: '8.8.8.8', location: 'Mountain View, US', countryCode: 'US', confidence: 40, severity: 'low' },
  ],
  timeline: [
    { id: 't1', time: '14:22:05', severity: 'critical', event: 'Multiple failed logins detected on Admin gateway', relTime: '2m ago' },
    { id: 't2', time: '14:18:30', severity: 'high', event: 'Unusual outbound traffic spike from DB-01', relTime: '6m ago' },
    { id: 't3', time: '14:10:12', severity: 'medium', event: 'Port scan detected on DMZ subnet', relTime: '14m ago' },
    { id: 't4', time: '13:55:00', severity: 'info', event: 'System backup completed successfully', relTime: '29m ago' },
    { id: 't5', time: '13:42:15', severity: 'low', event: 'New device registered on guest network', relTime: '42m ago' },
  ]
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fallback robust logic if fetch fails
        // const res = await fetch('http://localhost:3000/api/v1/dashboard');
        // if (!res.ok) throw new Error('API down');
        // const json = await res.json();
        
        setTimeout(() => {
          setData(defaultData);
          setLoading(false);
        }, 800);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setData(defaultData);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const totalDist = data ? Object.values(data.severityDist).reduce((a, b) => a + b, 0) : 1;

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div className="dashboard-header__welcome" style={{ width: '300px' }}>
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-text" style={{ width: '50%' }}></div>
          </div>
        </div>
        <div className="kpi-grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card"></div>)}
        </div>
        <div className="dashboard-content-grid">
          <div className="skeleton skeleton-block"></div>
          <div className="skeleton skeleton-block"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header__welcome">
          <h1 className="dashboard-header__title">
            Welcome back, <span className="dashboard-header__name">{user?.firstName || 'Operator'}</span>
            <span className="dashboard-header__role">{user?.role || 'SYSADMIN'}</span>
          </h1>
          <div className="dashboard-header__meta">
            Last Login: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
          </div>
        </div>
        <div className="dashboard-header__date">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </header>

      <section className="kpi-grid">
        <div className="kpi-card kpi-card--crimson" style={{ animationDelay: '0.1s' }}>
          <div className="kpi-card__header">
            <div className="kpi-card__icon-wrapper">
              <IconTriangleWarning />
            </div>
            <div className="kpi-card__trend kpi-card__trend--up negative">
              ↑ 12%
            </div>
          </div>
          <div className="kpi-card__content">
            <div className="kpi-card__value"><AnimatedCounter value={data.kpis.activeThreats} /></div>
            <div className="kpi-card__label">Active Threats</div>
          </div>
        </div>

        <div className="kpi-card kpi-card--amber" style={{ animationDelay: '0.2s' }}>
          <div className="kpi-card__header">
            <div className="kpi-card__icon-wrapper">
              <IconBell />
            </div>
            <div className="kpi-card__trend kpi-card__trend--down positive">
              ↓ 5%
            </div>
          </div>
          <div className="kpi-card__content">
            <div className="kpi-card__value"><AnimatedCounter value={data.kpis.openAlerts} /></div>
            <div className="kpi-card__label">Open Alerts</div>
          </div>
        </div>

        <div className="kpi-card kpi-card--cyan" style={{ animationDelay: '0.3s' }}>
          <div className="kpi-card__header">
            <div className="kpi-card__icon-wrapper">
              <IconSearch />
            </div>
            <div className="kpi-card__trend kpi-card__trend--up positive">
              ↑ 2
            </div>
          </div>
          <div className="kpi-card__content">
            <div className="kpi-card__value"><AnimatedCounter value={data.kpis.investigations} /></div>
            <div className="kpi-card__label">Active Investigations</div>
          </div>
        </div>

        <div className="kpi-card kpi-card--emerald" style={{ animationDelay: '0.4s' }}>
          <div className="kpi-card__header">
            <div className="kpi-card__icon-wrapper">
              <IconShieldCheck />
            </div>
            <div className="kpi-card__trend kpi-card__trend--up positive">
              ↑ 1%
            </div>
          </div>
          <div className="kpi-card__content">
            <div className="kpi-card__value"><AnimatedCounter value={data.kpis.healthScore} />%</div>
            <div className="kpi-card__label">System Health</div>
          </div>
        </div>
      </section>

      <section className="severity-dist">
        <h3 className="severity-dist__title">Threat Severity Distribution</h3>
        <div className="severity-dist__bar">
          <div className="severity-dist__segment" style={{ width: `${(data.severityDist.critical / totalDist) * 100}%`, backgroundColor: 'var(--color-danger, #ef4444)' }}></div>
          <div className="severity-dist__segment" style={{ width: `${(data.severityDist.high / totalDist) * 100}%`, backgroundColor: 'var(--color-warning, #f59e0b)' }}></div>
          <div className="severity-dist__segment" style={{ width: `${(data.severityDist.medium / totalDist) * 100}%`, backgroundColor: '#eab308' }}></div>
          <div className="severity-dist__segment" style={{ width: `${(data.severityDist.low / totalDist) * 100}%`, backgroundColor: 'var(--color-success, #10b981)' }}></div>
          <div className="severity-dist__segment" style={{ width: `${(data.severityDist.info / totalDist) * 100}%`, backgroundColor: '#3b82f6' }}></div>
        </div>
        <div className="severity-dist__legend">
          <div className="severity-dist__legend-item"><div className="severity-dist__dot" style={{ backgroundColor: 'var(--color-danger, #ef4444)' }}></div> Critical ({data.severityDist.critical})</div>
          <div className="severity-dist__legend-item"><div className="severity-dist__dot" style={{ backgroundColor: 'var(--color-warning, #f59e0b)' }}></div> High ({data.severityDist.high})</div>
          <div className="severity-dist__legend-item"><div className="severity-dist__dot" style={{ backgroundColor: '#eab308' }}></div> Medium ({data.severityDist.medium})</div>
          <div className="severity-dist__legend-item"><div className="severity-dist__dot" style={{ backgroundColor: 'var(--color-success, #10b981)' }}></div> Low ({data.severityDist.low})</div>
          <div className="severity-dist__legend-item"><div className="severity-dist__dot" style={{ backgroundColor: '#3b82f6' }}></div> Info ({data.severityDist.info})</div>
        </div>
      </section>

      <div className="dashboard-content-grid">
        <GlobalAttackMap attacks={data.attacks} />

        <section className="dashboard-section" style={{ animationDelay: '0.6s' }}>
          <div className="dashboard-section__header">
            <h2 className="dashboard-section__title"><IconTimeline /> Attack Timeline</h2>
          </div>
          <div className="dashboard-section__content" style={{ padding: '0 1.25rem' }}>
            {data.timeline.length === 0 ? (
              <div className="empty-state">
                <IconSatellite />
                <p>Awaiting timeline stream...</p>
              </div>
            ) : (
              <div className="timeline-list">
                {data.timeline.map(item => (
                  <div key={item.id} className="timeline-item">
                    <div className="timeline-item__time">{item.time}</div>
                    <div className={`timeline-item__badge timeline-item__badge--${item.severity}`}>
                      {item.severity}
                    </div>
                    <div className="timeline-item__content" title={item.event}>
                      {item.event}
                    </div>
                    <div className="timeline-item__rel">{item.relTime}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
