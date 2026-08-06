import { Test, TestingModule } from '@nestjs/testing';
import { FeedSyncService } from './feed-sync.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConnectorFactory } from './connectors/connector-factory';
import { StixNormalizerService } from './normalizers/stix-normalizer.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';

describe('FeedSyncService', () => {
  let service: FeedSyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedSyncService,
        { provide: PrismaService, useValue: {} },
        { provide: ConnectorFactory, useValue: {} },
        { provide: StixNormalizerService, useValue: {} },
        { provide: KafkaProducerService, useValue: {} },
        { provide: ElasticsearchService, useValue: {} },
      ],
    }).compile();

    service = module.get<FeedSyncService>(FeedSyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
