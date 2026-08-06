import React, { useState } from 'react';
import './ioc-search-page.css';

export const IocSearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setHasSearched(true);
    }
  };

  return (
    <div className="ioc-page">
      <header className="page-header">
        <div className="page-header__title-container">
          <svg className="icon-large" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="22" y1="12" x2="18" y2="12"></line>
            <line x1="6" y1="12" x2="2" y2="12"></line>
            <line x1="12" y1="6" x2="12" y2="2"></line>
            <line x1="12" y1="22" x2="12" y2="18"></line>
          </svg>
          <h1 className="page-header__title">IOC Search</h1>
        </div>
        <p className="page-header__subtitle">Global indicator lookup across intelligence feeds.</p>
      </header>

      <div className={`search-container ${hasSearched ? 'search-container--compact' : ''}`}>
        <form onSubmit={handleSearch} className="search-box">
          <select className="search-box__select">
            <option value="ip">IP Address</option>
            <option value="domain">Domain</option>
            <option value="hash">File Hash</option>
            <option value="url">URL</option>
            <option value="email">Email</option>
          </select>
          <input 
            type="text" 
            className="search-box__input" 
            placeholder="Enter indicator of compromise..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="search-box__btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Analyze
          </button>
        </form>
        
        {!hasSearched && (
          <div className="recent-searches">
            <span className="recent-searches__label">Recent:</span>
            <div className="pill-group">
              <span className="pill">192.168.1.45</span>
              <span className="pill">evil-corp-domain.xyz</span>
              <span className="pill">e3b0c44298fc1c149afbf4c8996fb924</span>
              <span className="pill">admin@suspicious.org</span>
            </div>
          </div>
        )}
      </div>

      {hasSearched && (
        <div className="results-container">
          <div className="verdict-card verdict-card--malicious">
            <div className="verdict-card__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div className="verdict-card__content">
              <h2 className="verdict-card__title">MALICIOUS</h2>
              <p className="verdict-card__desc">This indicator has been flagged by multiple intelligence sources as associated with malware distribution.</p>
            </div>
          </div>

          <div className="details-grid">
            <div className="detail-card">
              <span className="detail-card__label">Indicator</span>
              <span className="detail-card__value detail-card__value--mono">{searchTerm || 'evil-corp-domain.xyz'}</span>
            </div>
            <div className="detail-card">
              <span className="detail-card__label">Confidence Score</span>
              <div className="score-bar-container">
                <span className="detail-card__value">98/100</span>
                <div className="score-bar"><div className="score-bar__fill" style={{ width: '98%' }}></div></div>
              </div>
            </div>
            <div className="detail-card">
              <span className="detail-card__label">First Seen</span>
              <span className="detail-card__value">2023-10-14 08:22:15 UTC</span>
            </div>
            <div className="detail-card">
              <span className="detail-card__label">Last Seen</span>
              <span className="detail-card__value">2024-02-05 14:10:02 UTC</span>
            </div>
            <div className="detail-card detail-card--full">
              <span className="detail-card__label">Detection Sources</span>
              <div className="pill-group">
                <span className="pill pill--danger">VirusTotal (45/89)</span>
                <span className="pill pill--danger">CrowdStrike</span>
                <span className="pill pill--danger">X-Force Exchange</span>
                <span className="pill pill--warning">Alienvault OTX</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
