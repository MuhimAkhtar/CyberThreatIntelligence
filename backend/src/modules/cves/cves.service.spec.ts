import { Test, TestingModule } from '@nestjs/testing';
import { CvesService } from './cves.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';

describe('CvesService', () => {
  let service: CvesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CvesService,
        { provide: PrismaService, useValue: { cve: { findMany: jest.fn(), count: jest.fn(), groupBy: jest.fn() } } },
        { provide: ElasticsearchService, useValue: {} },
      ],
    }).compile();

    service = module.get<CvesService>(CvesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
