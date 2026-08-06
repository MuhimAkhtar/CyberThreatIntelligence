import { Test, TestingModule } from '@nestjs/testing';
import { StixNormalizerService } from './stix-normalizer.service';

describe('StixNormalizerService', () => {
  let service: StixNormalizerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StixNormalizerService],
    }).compile();

    service = module.get<StixNormalizerService>(StixNormalizerService);
  });

  it('should normalize correctly', () => {
    const result = service.normalize({ type: 'ip-src', value: '1.1.1.1' }, 'feed-1');
    expect(result.iocData.type).toBe('IP_ADDRESS');
  });
});
