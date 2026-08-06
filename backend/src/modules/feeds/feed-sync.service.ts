import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConnectorFactory } from './connectors/connector-factory';
import { StixNormalizerService } from './normalizers/stix-normalizer.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { TOPIC_THREAT_INTEL_RAW } from '../kafka/kafka.constants';
import { SyncStatus, FeedSyncLog } from '@prisma/client';

@Injectable()
export class FeedSyncService {
  private readonly logger = new Logger(FeedSyncService.name);
  private readonly activeSyncs = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly connectorFactory: ConnectorFactory,
    private readonly normalizer: StixNormalizerService,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async syncFeed(feedId: string): Promise<FeedSyncLog> {
    // Synchronous check-and-set before any await — this is the concurrency guard
    if (this.activeSyncs.has(feedId)) {
      throw new ConflictException(`Sync already in progress for feed ${feedId}`);
    }
    this.activeSyncs.add(feedId);

    let log: FeedSyncLog | null = null;

    try {
      const feed = await this.prisma.threatFeed.findUnique({ where: { id: feedId } });
      if (!feed) {
        throw new Error(`Feed ${feedId} not found`);
      }

      log = await this.prisma.feedSyncLog.create({
        data: { feedId, status: SyncStatus.PENDING },
      });

      log = await this.prisma.feedSyncLog.update({
        where: { id: log.id },
        data: { status: SyncStatus.IN_PROGRESS },
      });

      const connector = this.connectorFactory.createConnector(feed);
      const rawIndicators = await connector.fetchIndicators(feed.lastSyncAt || undefined);

      let successCount = 0;
      const esDocuments: any[] = [];

      for (const raw of rawIndicators) {
        try {
          const { iocData } = this.normalizer.normalize(raw, feed.id);

          const upserted = await this.prisma.ioc.upsert({
            where: {
              type_value_feedId: {
                type: iocData.type as any,
                value: iocData.value,
                feedId,
              },
            },
            update: {
              stixData: iocData.stixData || undefined,
              confidenceScore: iocData.confidenceScore,
              tags: iocData.tags,
              lastSeenAt: new Date(),
            },
            create: iocData as any,
          });

          await this.kafkaProducer.emit(
            TOPIC_THREAT_INTEL_RAW,
            raw.type + ':' + raw.value,
            raw as unknown as Record<string, unknown>,
          );

          esDocuments.push({
            id: upserted.id,
            type: upserted.type,
            value: upserted.value,
            feedId: upserted.feedId,
            confidenceScore: upserted.confidenceScore,
            tags: upserted.tags,
            firstSeenAt: upserted.firstSeenAt,
          });

          successCount++;
        } catch (err) {
          this.logger.error(`Failed to process indicator ${raw.value}`, err);
        }
      }

      if (esDocuments.length > 0) {
        await this.elasticsearchService.bulk('ctp-iocs', esDocuments);
      }

      await this.prisma.threatFeed.update({
        where: { id: feed.id },
        data: { lastSyncAt: new Date() },
      });

      log = await this.prisma.feedSyncLog.update({
        where: { id: log.id },
        data: {
          status: SyncStatus.SUCCESS,
          recordsIngested: successCount,
          completedAt: new Date(),
        },
      });

      return log;
    } catch (error: any) {
      this.logger.error(`Sync failed for feed ${feedId}`, error);
      if (log) {
        log = await this.prisma.feedSyncLog.update({
          where: { id: log.id },
          data: {
            status: SyncStatus.FAILED,
            errorMessage: error.message,
            completedAt: new Date(),
          },
        });
      }
      throw error;
    } finally {
      // Always release the lock regardless of success or failure
      this.activeSyncs.delete(feedId);
    }
  }
}
