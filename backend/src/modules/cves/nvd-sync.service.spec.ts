import { Test, TestingModule } from '@nestjs/testing';
import { NvdSyncService } from './nvd-sync.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';

describe('NvdSyncService', () => {
  let service: NvdSyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NvdSyncService,
        { provide: PrismaService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: ElasticsearchService, useValue: {} },
        { provide: KafkaProducerService, useValue: {} },
      ],
    }).compile();

    service = module.get<NvdSyncService>(NvdSyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
