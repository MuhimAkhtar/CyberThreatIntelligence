import React, { useState } from 'react';
import { ThreatGraphVisualizer } from '../../components/graph/threat-graph-visualizer';
import './threats-page.css';

interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  origin: string;
  category: 'APT' | 'Ransomware' | 'Financial' | 'Hacktivist';
  severity: 'Critical' | 'High' | 'Medium';
  confidenceScore: number;
  targetedSectors: string[];
  activeCampaign: string;
  lastActive: string;
}

const THREAT_ACTORS: ThreatActor[] = [
  {
    id: 'TA-01',
    name: 'APT29 (Cozy Bear)',
    aliases: ['NOBELIUM', 'Midnight Blizzard'],
    origin: 'Russia',
    category: 'APT',
    severity: 'Critical',
    confidenceScore: 98,
    targetedSectors: ['Government', 'Defense', 'Energy', 'Diplomatic'],
    activeCampaign: 'Cloud Infrastructure & Supply Chain Spearphishing',
    lastActive: '12 mins ago',
  },
  {
    id: 'TA-02',
    name: 'Lazarus Group',
    aliases: ['HIDDEN COBRA', 'APT38'],
    origin: 'North Korea',
    category: 'Financial',
    severity: 'Critical',
    confidenceScore: 95,
    targetedSectors: ['Cryptocurrency', 'Banking', 'Defense'],
    activeCampaign: 'DeFi Bridge Exploitation & Cross-Chain Heists',
    lastActive: '45 mins ago',
  },
  {
    id: 'TA-03',
    name: 'LockBit 3.0',
    aliases: ['LockBit Black'],
    origin: 'Eastern Europe',
    category: 'Ransomware',
    severity: 'Critical',
    confidenceScore: 94,
    targetedSectors: ['Healthcare', 'Manufacturing', 'Finance'],
    activeCampaign: 'Triple Extortion Data Exfiltration & NAS Encryption',
    lastActive: '2 hours ago',
  },
  {
    id: 'TA-04',
    name: 'APT41 (Double Dragon)',
    aliases: ['BARIUM', 'Wicked Panda'],
    origin: 'China',
    category: 'APT',
    severity: 'High',
    confidenceScore: 91,
    targetedSectors: ['Telecom', 'High-Tech', 'Pharmaceuticals'],
    activeCampaign: 'Zero-Day Vulnerability Exploitation & Web Shell Injections',
    lastActive: '3 hours ago',
  },
  {
    id: 'TA-05',
    name: 'BlackCat (ALPHV)',
    aliases: ['Noberus'],
    origin: 'Global / Underground',
    category: 'Ransomware',
    severity: 'High',
    confidenceScore: 88,
    targetedSectors: ['Retail', 'Hospitality', 'Logistics'],
    activeCampaign: 'Rust-Based Cloud Backup Destruction',
    lastActive: '5 hours ago',
  },
  {
    id: 'TA-06',
    name: 'FIN7 (Sangma)',
    aliases: ['Carbanak', 'Elbrus'],
    origin: 'Eastern Europe',
    category: 'Financial',
    severity: 'Medium',
    confidenceScore: 82,
    targetedSectors: ['Hospitality', 'Point of Sale (POS)', 'E-Commerce'],
    activeCampaign: 'Automated Credit Card Harvesting & Memory Scraping',
    lastActive: '8 hours ago',
  },
];

export const ThreatsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'GRAPH'>('CARDS');

  const filteredActors = THREAT_ACTORS.filter((actor) => {
    const matchesSearch =
      actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      actor.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      actor.activeCampaign.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || actor.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="threats-page">
      {/* Header */}
      <header className="page-header">
        <div className="page-header__title-container">
          <svg
            className="icon-large"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
          </svg>
          <div>
            <h1 className="page-header__title">Threat Intelligence Portal</h1>
            <p className="page-header__subtitle">
              Active adversary tracking, APT campaign mapping, and threat actor profiling.
            </p>
          </div>
        </div>
        <div className="view-toggle-btns">
          <button
            className={`toggle-btn ${viewMode === 'CARDS' ? 'active' : ''}`}
            onClick={() => setViewMode('CARDS')}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Actor Matrix</span>
          </button>
          <button
            className={`toggle-btn ${viewMode === 'GRAPH' ? 'active' : ''}`}
            onClick={() => setViewMode('GRAPH')}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>Adversary Graph</span>
          </button>
        </div>
      </header>

      {/* KPI Stats Bar */}
      <div className="threat-kpi-bar">
        <div className="threat-kpi-card critical">
          <div className="kpi-title">GLOBAL THREAT LEVEL</div>
          <div className="kpi-value text-red">DEFCON 2</div>
          <div className="kpi-sub">ELEVATED ADVERSARY ACTIVITY</div>
        </div>
        <div className="threat-kpi-card">
          <div className="kpi-title">TRACKED APT GROUPS</div>
          <div className="kpi-value">34</div>
          <div className="kpi-sub">+3 ACTIVE THIS WEEK</div>
        </div>
        <div className="threat-kpi-card amber">
          <div className="kpi-title">ACTIVE CAMPAIGNS</div>
          <div className="kpi-value text-amber">12</div>
          <div className="kpi-sub">SUPPLY CHAIN & ZERO-DAY</div>
        </div>
        <div className="threat-kpi-card">
          <div className="kpi-title">CONFIDENCE INDEX</div>
          <div className="kpi-value">93.4%</div>
          <div className="kpi-sub">MULTI-FEED ENRICHMENT</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-bar__input-group">
          <svg
            className="icon-small"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search threat actors, origins, campaigns..."
            className="filter-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="category-chips">
          {['ALL', 'APT', 'Ransomware', 'Financial', 'Hacktivist'].map((cat) => (
            <button
              key={cat}
              className={`chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content View */}
      {viewMode === 'GRAPH' ? (
        <div className="graph-container-wrapper">
          <ThreatGraphVisualizer />
        </div>
      ) : (
        <div className="threat-actors-grid">
          {filteredActors.map((actor) => (
            <div key={actor.id} className={`actor-card severity-${actor.severity.toLowerCase()}`}>
              <div className="actor-card__header">
                <div className="actor-header-left">
                  <span className="actor-id">{actor.id}</span>
                  <h3 className="actor-name">{actor.name}</h3>
                </div>
                <span className={`badge badge--${actor.severity.toLowerCase()}`}>
                  {actor.severity.toUpperCase()}
                </span>
              </div>

              <div className="actor-aliases">
                AKA: {actor.aliases.join(', ')}
              </div>

              <div className="actor-meta-row">
                <div className="meta-block">
                  <span className="meta-label">ORIGIN</span>
                  <span className="meta-val">{actor.origin}</span>
                </div>
                <div className="meta-block">
                  <span className="meta-label">CATEGORY</span>
                  <span className="meta-val">{actor.category}</span>
                </div>
                <div className="meta-block">
                  <span className="meta-label">CONFIDENCE</span>
                  <span className="meta-val text-red">{actor.confidenceScore}%</span>
                </div>
              </div>

              <div className="actor-campaign">
                <span className="campaign-label">ACTIVE CAMPAIGN:</span>
                <p className="campaign-name">{actor.activeCampaign}</p>
              </div>

              <div className="actor-sectors">
                <span className="sectors-label">TARGET SECTORS:</span>
                <div className="sector-tags">
                  {actor.targetedSectors.map((sector) => (
                    <span key={sector} className="sector-tag">
                      {sector}
                    </span>
                  ))}
                </div>
              </div>

              <div className="actor-card__footer">
                <span className="last-active">Active: {actor.lastActive}</span>
                <button className="btn-pivot">PIVOT IOCS →</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
