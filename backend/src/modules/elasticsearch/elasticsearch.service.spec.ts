import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from './elasticsearch.service';
import { Client } from '@elastic/elasticsearch';

jest.mock('@elastic/elasticsearch', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      cluster: { health: jest.fn().mockResolvedValue({ status: 'green' }) },
      indices: {
        exists: jest.fn().mockResolvedValue(true),
        create: jest.fn(),
        delete: jest.fn(),
      },
      index: jest.fn(),
      bulk: jest.fn(),
      search: jest.fn(),
    })),
  };
});

describe('ElasticsearchService', () => {
  let service: ElasticsearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElasticsearchService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:9200'),
          },
        },
      ],
    }).compile();

    service = module.get<ElasticsearchService>(ElasticsearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
