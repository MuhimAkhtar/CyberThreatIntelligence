import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { TOPIC_CVE_UPDATES } from '../kafka/kafka.constants';
import { CveSeverity } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class NvdSyncService {
  private readonly logger = new Logger(NvdSyncService.name);
  private isSyncing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly elasticsearchService: ElasticsearchService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async syncFromNvd(since?: Date): Promise<{ created: number; updated: number }> {
    if (this.isSyncing) {
      throw new ConflictException('NVD sync already in progress');
    }
    this.isSyncing = true;

    try {
    const apiKey = this.configService.get<string>('nvd.apiKey');
    const baseUrl = this.configService.get<string>('nvd.baseUrl') || 'https://services.nvd.nist.gov/rest/json/cves/2.0';
    
    let startIndex = 0;
    const resultsPerPage = 100;
    let totalResults = 1;
    let created = 0;
    let updated = 0;

    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['apiKey'] = apiKey;
    }

    const delayMs = apiKey ? 600 : 6000;

    const params: any = { resultsPerPage };
    if (since) {
      params.lastModStartDate = since.toISOString();
      params.lastModEndDate = new Date().toISOString();
    }

    while (startIndex < totalResults) {
      params.startIndex = startIndex;
      try {
        const response = await axios.get(baseUrl, { params, headers });
        const data = response.data;
        totalResults = data.totalResults;

        for (const item of data.vulnerabilities || []) {
          const cve = item.cve;
          if (!cve) continue;

          const descriptions = cve.descriptions || [];
          const descEn = descriptions.find((d: any) => d.lang === 'en')?.value || '';

          const metrics = cve.metrics || {};
          let cvssV2: number | null = null;
          let cvssV3: number | null = null;
          let severity: CveSeverity = CveSeverity.NONE;

          if (metrics.cvssMetricV31?.length > 0) {
            const m = metrics.cvssMetricV31[0].cvssData;
            cvssV3 = m.baseScore;
            severity = this.mapSeverity(m.baseSeverity);
          } else if (metrics.cvssMetricV30?.length > 0) {
            const m = metrics.cvssMetricV30[0].cvssData;
            cvssV3 = m.baseScore;
            severity = this.mapSeverity(m.baseSeverity);
          }

          if (metrics.cvssMetricV2?.length > 0) {
            const m = metrics.cvssMetricV2[0].cvssData;
            cvssV2 = m.baseScore;
            if (severity === CveSeverity.NONE) {
              severity = this.mapSeverity(metrics.cvssMetricV2[0].baseSeverity);
            }
          }

          const existing = await this.prisma.cve.findUnique({ where: { cveId: cve.id } });

          const dbCve = await this.prisma.cve.upsert({
            where: { cveId: cve.id },
            update: {
              description: descEn,
              cvssV2Score: cvssV2,
              cvssV3Score: cvssV3,
              severity,
              modifiedAt: new Date(cve.lastModified),
              references: cve.references || [],
              cpeMatch: cve.configurations || [],
            },
            create: {
              cveId: cve.id,
              description: descEn,
              cvssV2Score: cvssV2,
              cvssV3Score: cvssV3,
              severity,
              publishedAt: new Date(cve.published),
              modifiedAt: new Date(cve.lastModified),
              references: cve.references || [],
              cpeMatch: cve.configurations || [],
            }
          });

          if (existing) updated++; else created++;

          await this.elasticsearchService.index('ctp-cves', dbCve.id, {
            cveId: dbCve.cveId,
            description: dbCve.description,
            severity: dbCve.severity,
            cvssV3Score: dbCve.cvssV3Score,
            publishedAt: dbCve.publishedAt,
          });

          await this.kafkaProducer.emit(TOPIC_CVE_UPDATES, dbCve.cveId, dbCve);
        }

        startIndex += resultsPerPage;
        if (startIndex < totalResults) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        this.logger.error('NVD sync error', error);
        break;
      }
    }

    return { created, updated };
    } finally {
      this.isSyncing = false;
    }
  }

  private mapSeverity(sev: string): CveSeverity {
    if (!sev) return CveSeverity.NONE;
    const s = sev.toUpperCase();
    if (s === 'LOW') return CveSeverity.LOW;
    if (s === 'MEDIUM') return CveSeverity.MEDIUM;
    if (s === 'HIGH') return CveSeverity.HIGH;
    if (s === 'CRITICAL') return CveSeverity.CRITICAL;
    return CveSeverity.NONE;
  }
}
