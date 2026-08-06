import { Test, TestingModule } from '@nestjs/testing';
import { IocSearchService } from './ioc-search.service';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';

describe('IocSearchService', () => {
  let service: IocSearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IocSearchService,
        { provide: ElasticsearchService, useValue: {} },
      ],
    }).compile();

    service = module.get<IocSearchService>(IocSearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
