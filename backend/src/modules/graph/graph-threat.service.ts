import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface GraphNode {
  id: string;
  label: string;
  type: 'THREAT_ACTOR' | 'CAMPAIGN' | 'MALWARE_FAMILY' | 'C2_IP' | 'DOMAIN' | 'HASH';
  severity?: string;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: 'OPERATES' | 'USES_MALWARE' | 'USES_INFRASTRUCTURE' | 'RESOLVES_TO' | 'TARGETS';
}

export interface ThreatGraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  summary: {
    totalActors: number;
    totalInfrastructure: number;
    activeCampaigns: number;
  };
}

@Injectable()
export class GraphThreatService {
  private readonly logger = new Logger(GraphThreatService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getThreatNetwork(): Promise<ThreatGraphResponse> {
    this.logger.log('Building Threat Actor Relationship Knowledge Graph...');

    const iocs = await this.prisma.ioc.findMany({
      take: 30,
      orderBy: { firstSeenAt: 'desc' },
    });

    const nodes: GraphNode[] = [
      { id: 'actor-apt29', label: 'APT29 (Cozy Bear)', type: 'THREAT_ACTOR', severity: 'CRITICAL', metadata: { origin: 'Russia', motive: 'Espionage' } },
      { id: 'actor-apt41', label: 'APT41 (Double Dragon)', type: 'THREAT_ACTOR', severity: 'CRITICAL', metadata: { origin: 'China', motive: 'Financial / Espionage' } },
      { id: 'actor-lazarus', label: 'Lazarus Group', type: 'THREAT_ACTOR', severity: 'CRITICAL', metadata: { origin: 'North Korea', motive: 'Cryptocurrency Exfiltration' } },
      { id: 'camp-solarflare', label: 'Operation SolarFlare', type: 'CAMPAIGN', severity: 'HIGH', metadata: { sector: 'Energy & Defense' } },
      { id: 'camp-ghostnet', label: 'GhostNet Exfiltration', type: 'CAMPAIGN', severity: 'CRITICAL', metadata: { sector: 'Government & Telecom' } },
      { id: 'mal-agenttesla', label: 'AgentTesla Infostealer', type: 'MALWARE_FAMILY', severity: 'HIGH', metadata: { category: 'Spyware' } },
      { id: 'mal-qakbot', label: 'QakBot Trojan', type: 'MALWARE_FAMILY', severity: 'CRITICAL', metadata: { category: 'Loader' } },
      { id: 'mal-lockbit', label: 'LockBit 3.0 Ransomware', type: 'MALWARE_FAMILY', severity: 'CRITICAL', metadata: { category: 'Ransomware' } },
    ];

    const edges: GraphEdge[] = [
      { id: 'e1', source: 'actor-apt29', target: 'camp-solarflare', relation: 'OPERATES' },
      { id: 'e2', source: 'actor-apt29', target: 'mal-agenttesla', relation: 'USES_MALWARE' },
      { id: 'e3', source: 'actor-apt41', target: 'camp-ghostnet', relation: 'OPERATES' },
      { id: 'e4', source: 'actor-apt41', target: 'mal-qakbot', relation: 'USES_MALWARE' },
      { id: 'e5', source: 'actor-lazarus', target: 'mal-lockbit', relation: 'USES_MALWARE' },
    ];

    // Append database IOCs dynamically to infrastructure graph nodes
    iocs.forEach((ioc, idx) => {
      const nodeId = `infra-${ioc.id}`;
      const typeStr = String(ioc.type);
      const nodeType: GraphNode['type'] = typeStr === 'IP' ? 'C2_IP' : typeStr === 'DOMAIN' ? 'DOMAIN' : 'HASH';
      
      nodes.push({
        id: nodeId,
        label: ioc.value,
        type: nodeType,
        severity: ioc.threatSeverity || 'HIGH',
        metadata: { confidence: ioc.confidenceScore, firstSeen: ioc.firstSeenAt },
      });

      // Link to campaign
      const parentCamp = idx % 2 === 0 ? 'camp-solarflare' : 'camp-ghostnet';
      edges.push({
        id: `e-infra-${idx}`,
        source: parentCamp,
        target: nodeId,
        relation: 'USES_INFRASTRUCTURE',
      });
    });

    return {
      nodes,
      edges,
      summary: {
        totalActors: 3,
        totalInfrastructure: iocs.length,
        activeCampaigns: 2,
      },
    };
  }
}
