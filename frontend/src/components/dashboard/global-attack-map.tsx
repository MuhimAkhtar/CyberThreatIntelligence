import React, { useState } from 'react';
import './global-attack-map.css';

export interface AttackPoint {
  id: string;
  ip: string;
  location: string;
  countryCode: string;
  confidence: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  lat?: number;
  lng?: number;
}

interface GlobalAttackMapProps {
  attacks: AttackPoint[];
}

// Known coordinates for common threat locations mapped to SVG viewport (950x480)
const LOCATION_COORDS: Record<string, { lat: number; lng: number; x: number; y: number }> = {
  RU: { lat: 55.75, lng: 37.61, x: 575, y: 135 },    // Moscow
  CN: { lat: 39.90, lng: 116.40, x: 740, y: 195 },   // Beijing
  IR: { lat: 35.68, lng: 51.38, x: 610, y: 205 },    // Tehran
  US: { lat: 37.38, lng: -122.08, x: 205, y: 200 }, // Mountain View
  KP: { lat: 39.03, lng: 125.75, x: 765, y: 195 },  // Pyongyang
  RO: { lat: 44.43, lng: 26.10, x: 545, y: 175 },   // Bucharest
  BR: { lat: -23.55, lng: -46.63, x: 330, y: 350 }, // Sao Paulo
};

// Central Defense Command Center (SOC HQ)
const TARGET_HUB = { x: 670, y: 220, name: 'National CTP SOC HQ' };

export const GlobalAttackMap: React.FC<GlobalAttackMapProps> = ({ attacks }) => {
  const [activeTab, setActiveTab] = useState<'map' | 'grid'>('map');
  const [hoveredPoint, setHoveredPoint] = useState<AttackPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const getSeverityColor = (sev: AttackPoint['severity']) => {
    switch (sev) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#eab308';
      case 'low': return '#10b981';
      default: return '#00f0ff';
    }
  };

  return (
    <div className="cyber-attack-map-container">
      <div className="cyber-map-header">
        <div className="cyber-map-title">
          <svg className="cyber-map-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
          </svg>
          <span className="cyber-map-title-text">Global Live Attack Map</span>
          <span className="cyber-map-status-pill">
            <span className="cyber-status-pulse"></span> LIVE THREAT RADAR
          </span>
        </div>

        <div className="cyber-map-controls">
          <button 
            className={`cyber-map-tab-btn ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            Radar Map
          </button>
          <button 
            className={`cyber-map-tab-btn ${activeTab === 'grid' ? 'active' : ''}`}
            onClick={() => setActiveTab('grid')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Card Grid
          </button>
        </div>
      </div>

      {activeTab === 'map' ? (
        <div className="cyber-map-viewport">
          {/* SVG Map Canvas */}
          <svg className="cyber-map-svg" viewBox="0 0 950 480" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Grid Coordinates Overlay */}
            <g className="cyber-map-grid-lines">
              {Array.from({ length: 9 }).map((_, i) => (
                <line key={`h-${i}`} x1="0" y1={(i + 1) * 48} x2="950" y2={(i + 1) * 48} stroke="rgba(0, 240, 255, 0.06)" strokeDasharray="4 4" />
              ))}
              {Array.from({ length: 18 }).map((_, i) => (
                <line key={`v-${i}`} x1={(i + 1) * 50} y1="0" x2={(i + 1) * 50} y2="480" stroke="rgba(0, 240, 255, 0.06)" strokeDasharray="4 4" />
              ))}
            </g>

            {/* High-Tech Vector Continents Outline */}
            <g className="cyber-map-continents">
              {/* North America */}
              <path d="M 120 70 L 220 60 L 290 90 L 260 160 L 220 220 L 180 250 L 160 210 L 100 170 L 80 120 Z" fill="#0c1324" stroke="rgba(0, 240, 255, 0.25)" strokeWidth="1.2" />
              {/* South America */}
              <path d="M 230 270 L 310 280 L 350 330 L 310 420 L 260 410 L 240 330 Z" fill="#0c1324" stroke="rgba(0, 240, 255, 0.25)" strokeWidth="1.2" />
              {/* Europe */}
              <path d="M 460 80 L 580 70 L 600 130 L 540 160 L 480 140 L 450 110 Z" fill="#0c1324" stroke="rgba(0, 240, 255, 0.25)" strokeWidth="1.2" />
              {/* Africa */}
              <path d="M 450 170 L 560 170 L 590 250 L 540 360 L 480 340 L 440 250 Z" fill="#0c1324" stroke="rgba(0, 240, 255, 0.25)" strokeWidth="1.2" />
              {/* Asia / Eurasia */}
              <path d="M 600 60 L 870 70 L 890 180 L 820 250 L 730 250 L 660 200 L 600 140 Z" fill="#0c1324" stroke="rgba(0, 240, 255, 0.25)" strokeWidth="1.2" />
              {/* Australia */}
              <path d="M 760 310 L 860 310 L 880 380 L 780 400 Z" fill="#0c1324" stroke="rgba(0, 240, 255, 0.25)" strokeWidth="1.2" />
            </g>

            {/* Radar Scan Target Rings */}
            <g className="cyber-radar-scan">
              <circle cx="475" cy="240" r="210" fill="none" stroke="rgba(0, 240, 255, 0.1)" strokeWidth="1" />
              <circle cx="475" cy="240" r="140" fill="none" stroke="rgba(0, 240, 255, 0.1)" strokeWidth="1" />
              <circle cx="475" cy="240" r="70" fill="none" stroke="rgba(0, 240, 255, 0.1)" strokeWidth="1" />
            </g>

            {/* Attack Trajectory Arcs */}
            {attacks.map((attack) => {
              const coords = LOCATION_COORDS[attack.countryCode] || { x: 400, y: 200 };
              const midX = (coords.x + TARGET_HUB.x) / 2;
              const midY = (coords.y + TARGET_HUB.y) / 2 - 40;
              const color = getSeverityColor(attack.severity);

              return (
                <g key={`arc-${attack.id}`}>
                  <path
                    d={`M ${coords.x} ${coords.y} Q ${midX} ${midY} ${TARGET_HUB.x} ${TARGET_HUB.y}`}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeOpacity="0.6"
                    strokeDasharray="6 4"
                    className="cyber-attack-line"
                  />
                  <circle r="3.5" fill={color} filter="url(#glowCyan)">
                    <animateMotion
                      path={`M ${coords.x} ${coords.y} Q ${midX} ${midY} ${TARGET_HUB.x} ${TARGET_HUB.y}`}
                      dur="2.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}

            {/* Target Defense Hub */}
            <g transform={`translate(${TARGET_HUB.x}, ${TARGET_HUB.y})`}>
              <circle r="12" fill="none" stroke="#00f0ff" strokeWidth="1.5" className="cyber-pulse-ring" />
              <circle r="6" fill="#00f0ff" filter="url(#glowCyan)" />
              <text x="16" y="4" fill="#00f0ff" fontSize="11" fontFamily="JetBrains Mono" fontWeight="600">
                HQ DEFENSE HUB
              </text>
            </g>

            {/* Attack Nodes */}
            {attacks.map((attack) => {
              const coords = LOCATION_COORDS[attack.countryCode] || { x: 400, y: 200 };
              const color = getSeverityColor(attack.severity);

              return (
                <g
                  key={`node-${attack.id}`}
                  transform={`translate(${coords.x}, ${coords.y})`}
                  className="cyber-node-group"
                  onMouseEnter={() => {
                    setHoveredPoint(attack);
                    setTooltipPos({ x: coords.x, y: coords.y });
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle r="14" fill="none" stroke={color} strokeWidth="1.5" className="cyber-node-pulse" />
                  <circle r="5" fill={color} filter="url(#glowRed)" />
                  <text x="10" y="4" fill="#e2e8f0" fontSize="10" fontFamily="JetBrains Mono">
                    {attack.ip}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip */}
          {hoveredPoint && (
            <div
              className="cyber-map-tooltip glass-panel"
              style={{
                left: `${(tooltipPos.x / 950) * 100}%`,
                top: `${(tooltipPos.y / 480) * 100}%`,
              }}
            >
              <div className="cyber-tooltip-header">
                <span className="cyber-tooltip-flag">{hoveredPoint.countryCode}</span>
                <span className="cyber-tooltip-ip font-mono">{hoveredPoint.ip}</span>
                <span className={`cyber-badge badge-${hoveredPoint.severity}`}>{hoveredPoint.severity.toUpperCase()}</span>
              </div>
              <div className="cyber-tooltip-body">
                <div>Location: <strong>{hoveredPoint.location}</strong></div>
                <div>Confidence: <strong>{hoveredPoint.confidence}%</strong></div>
              </div>
            </div>
          )}

          {/* Map Footer Bar */}
          <div className="cyber-map-footer">
            <div className="cyber-map-footer-item">
              <span className="cyber-footer-dot critical"></span> Critical: <strong>{attacks.filter(a => a.severity === 'critical').length}</strong>
            </div>
            <div className="cyber-map-footer-item">
              <span className="cyber-footer-dot high"></span> High: <strong>{attacks.filter(a => a.severity === 'high').length}</strong>
            </div>
            <div className="cyber-map-footer-item font-mono">
              Trajectory Engine: Active
            </div>
          </div>
        </div>
      ) : (
        <div className="attack-grid p-4">
          {attacks.map(attack => {
            const severityColors = {
              critical: '#ef4444',
              high: '#f59e0b',
              medium: '#eab308',
              low: '#10b981'
            };
            return (
              <div key={attack.id} className="attack-card" style={{ borderLeftColor: severityColors[attack.severity] }}>
                <div className="attack-card__ip">{attack.ip}</div>
                <div className="attack-card__loc">
                  <span>{attack.countryCode}</span> {attack.location}
                </div>
                <div className="attack-card__conf">
                  Conf: {attack.confidence}%
                  <div className="attack-card__conf-bar-container">
                    <div className="attack-card__conf-bar" style={{ width: `${attack.confidence}%`, backgroundColor: severityColors[attack.severity] }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
