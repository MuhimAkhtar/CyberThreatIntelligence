import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface TimelineEvent {
  id: string;
  eventType: 'IOC_ADDED' | 'ALERT_TRIGGERED' | 'CVE_SYNCED' | 'CASE_CREATED';
  timestamp: Date;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: Record<string, any>;
}

@Injectable()
export class TimelineService {
  private readonly logger = new Logger(TimelineService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTimeline(limit = 50): Promise<{ total: number; events: TimelineEvent[] }> {
    const takeEach = Math.ceil(limit / 2);

    const [iocs, alerts, cves, cases] = await Promise.all([
      this.prisma.ioc.findMany({
        take: takeEach,
        orderBy: { createdAt: 'desc' },
        include: { feed: true },
      }),
      this.prisma.alert.findMany({
        take: takeEach,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.cve.findMany({
        take: takeEach,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.investigationCase.findMany({
        take: takeEach,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const events: TimelineEvent[] = [];

    // 1. Normalize IOCs
    iocs.forEach((ioc) => {
      events.push({
        id: `ioc-${ioc.id}`,
        eventType: 'IOC_ADDED',
        timestamp: ioc.createdAt,
        title: `IOC Ingested: ${ioc.type} [${ioc.value}]`,
        severity: ioc.confidenceScore >= 80 ? 'HIGH' : ioc.confidenceScore >= 50 ? 'MEDIUM' : 'LOW',
        details: { type: ioc.type, value: ioc.value, feed: ioc.feed?.name, confidence: ioc.confidenceScore },
      });
    });

    // 2. Normalize Alerts
    alerts.forEach((alert) => {
      events.push({
        id: `alert-${alert.id}`,
        eventType: 'ALERT_TRIGGERED',
        timestamp: alert.createdAt,
        title: alert.title,
        severity: alert.severity as any,
        details: { sourceType: alert.sourceType, status: alert.status, riskScore: alert.riskScore },
      });
    });

    // 3. Normalize CVEs
    cves.forEach((cve) => {
      events.push({
        id: `cve-${cve.id}`,
        eventType: 'CVE_SYNCED',
        timestamp: cve.createdAt,
        title: `Vulnerability Ingested: ${cve.cveId}`,
        severity: (cve.severity || 'MEDIUM') as any,
        details: {
          cveId: cve.cveId,
          cvssScore: cve.cvssV3Score || cve.cvssV2Score || 0,
          description: cve.description ? cve.description.substring(0, 100) : '',
        },
      });
    });

    // 4. Normalize Investigation Cases
    cases.forEach((c) => {
      events.push({
        id: `case-${c.id}`,
        eventType: 'CASE_CREATED',
        timestamp: c.createdAt,
        title: `Investigation Case Opened: ${c.title}`,
        severity: c.priority as any,
        details: { priority: c.priority, status: c.status, description: c.description },
      });
    });

    // Sort chronologically descending
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const resultEvents = events.slice(0, limit);

    return {
      total: resultEvents.length,
      events: resultEvents,
    };
  }
}
