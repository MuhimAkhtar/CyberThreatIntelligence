import React, { useState, useEffect } from 'react';
import './threat-graph-visualizer.css';

export interface GraphNode {
  id: string;
  label: string;
  type: 'THREAT_ACTOR' | 'CAMPAIGN' | 'MALWARE_FAMILY' | 'C2_IP' | 'DOMAIN' | 'HASH';
  severity?: string;
  metadata?: Record<string, any>;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
}

export const ThreatGraphVisualizer: React.FC = () => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/v1/graph/threat-network', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch graph data');
      const data = await res.json();

      // Layout nodes in force-directed circle pattern
      const nodeCount = data.nodes.length;
      const centerX = 380;
      const centerY = 240;
      const radius = 170;

      const layoutNodes = data.nodes.map((node: GraphNode, i: number) => {
        const angle = (i / nodeCount) * 2 * Math.PI;
        const offset = node.type === 'THREAT_ACTOR' ? 0 : node.type === 'CAMPAIGN' ? 80 : radius;
        return {
          ...node,
          x: centerX + Math.cos(angle) * offset,
          y: centerY + Math.sin(angle) * offset,
        };
      });

      setNodes(layoutNodes);
      setEdges(data.edges);
      if (layoutNodes.length > 0) setSelectedNode(layoutNodes[0]);
    } catch (err) {
      console.warn('Using fallback local threat actor graph dataset', err);
      const fallbackNodes: GraphNode[] = [
        { id: 'actor-apt29', label: 'APT29 (Cozy Bear)', type: 'THREAT_ACTOR', severity: 'CRITICAL', x: 380, y: 140, metadata: { origin: 'Russia', motive: 'Espionage' } },
        { id: 'camp-solarflare', label: 'Operation SolarFlare', type: 'CAMPAIGN', severity: 'HIGH', x: 250, y: 260, metadata: { sector: 'Defense' } },
        { id: 'mal-agenttesla', label: 'AgentTesla Infostealer', type: 'MALWARE_FAMILY', severity: 'HIGH', x: 510, y: 260, metadata: { category: 'Spyware' } },
        { id: 'infra-ip-1', label: '198.51.100.45 (C2 IP)', type: 'C2_IP', severity: 'CRITICAL', x: 180, y: 360, metadata: { confidence: 95 } },
        { id: 'infra-domain-1', label: 'c2-exfil-node.net', type: 'DOMAIN', severity: 'HIGH', x: 580, y: 360, metadata: { confidence: 90 } },
      ];
      const fallbackEdges: GraphEdge[] = [
        { id: 'e1', source: 'actor-apt29', target: 'camp-solarflare', relation: 'OPERATES' },
        { id: 'e2', source: 'actor-apt29', target: 'mal-agenttesla', relation: 'USES_MALWARE' },
        { id: 'e3', source: 'camp-solarflare', target: 'infra-ip-1', relation: 'USES_INFRASTRUCTURE' },
        { id: 'e4', source: 'mal-agenttesla', target: 'infra-domain-1', relation: 'RESOLVES_TO' },
      ];
      setNodes(fallbackNodes);
      setEdges(fallbackEdges);
      setSelectedNode(fallbackNodes[0]);
    } finally {
      setLoading(false);
    }
  };

  const getNodeColor = (type: GraphNode['type']) => {
    switch (type) {
      case 'THREAT_ACTOR': return '#ef4444';
      case 'CAMPAIGN': return '#f59e0b';
      case 'MALWARE_FAMILY': return '#a855f7';
      case 'C2_IP': return '#00ff9d';
      case 'DOMAIN': return '#38bdf8';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="threat-graph-wrapper">
      <div className="graph-header">
        <div className="title-group">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#00ff9d" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
          <h3>APT Threat Actor Relationship Knowledge Graph</h3>
        </div>
        <div className="graph-badges">
          <span className="badge-pill pill-actor">● Threat Actor</span>
          <span className="badge-pill pill-campaign">● Campaign</span>
          <span className="badge-pill pill-malware">● Malware</span>
          <span className="badge-pill pill-infra">● C2 Infra</span>
        </div>
      </div>

      <div className="graph-body">
        {/* Interactive Canvas / SVG Graph Rendering */}
        <div className="canvas-container">
          {loading ? (
            <div className="graph-loading">LOADING THREAT KNOWLEDGE GRAPH...</div>
          ) : (
            <svg viewBox="0 0 760 480" className="graph-svg">
              {/* Render Edges */}
              {edges.map((edge) => {
                const sourceNode = nodes.find((n) => n.id === edge.source);
                const targetNode = nodes.find((n) => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                return (
                  <g key={edge.id}>
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke="rgba(0, 255, 157, 0.3)"
                      strokeWidth="1.5"
                      strokeDasharray={edge.relation === 'USES_INFRASTRUCTURE' ? '4 4' : undefined}
                    />
                    <text
                      x={(sourceNode.x! + targetNode.x!) / 2}
                      y={(sourceNode.y! + targetNode.y!) / 2 - 4}
                      fill="#6ee7b7"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="JetBrains Mono"
                    >
                      {edge.relation}
                    </text>
                  </g>
                );
              })}

              {/* Render Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const nodeColor = getNodeColor(node.type);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedNode(node)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      r={node.type === 'THREAT_ACTOR' ? 22 : 16}
                      fill="rgba(4, 21, 14, 0.9)"
                      stroke={nodeColor}
                      strokeWidth={isSelected ? 3 : 1.5}
                      className={isSelected ? 'node-selected-glow' : ''}
                    />
                    <circle
                      r={node.type === 'THREAT_ACTOR' ? 8 : 5}
                      fill={nodeColor}
                    />
                    <text
                      y={node.type === 'THREAT_ACTOR' ? 36 : 28}
                      fill="#e2e8f0"
                      fontSize="10"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      textAnchor="middle"
                      fontFamily="JetBrains Mono"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Selected Node Inspection Card */}
        {selectedNode && (
          <div className="node-detail-panel">
            <div className="panel-header">
              <span className="node-type-badge" style={{ backgroundColor: `${getNodeColor(selectedNode.type)}20`, color: getNodeColor(selectedNode.type), borderColor: getNodeColor(selectedNode.type) }}>
                {selectedNode.type}
              </span>
              <h4>{selectedNode.label}</h4>
            </div>

            <div className="panel-attributes">
              <div className="attr-row">
                <span className="attr-key">Node ID:</span>
                <span className="attr-val">{selectedNode.id}</span>
              </div>
              <div className="attr-row">
                <span className="attr-key">Severity Level:</span>
                <span className="attr-val severity-tag">{selectedNode.severity || 'HIGH'}</span>
              </div>
              {selectedNode.metadata && Object.entries(selectedNode.metadata).map(([k, v]) => (
                <div className="attr-row" key={k}>
                  <span className="attr-key">{k}:</span>
                  <span className="attr-val">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
