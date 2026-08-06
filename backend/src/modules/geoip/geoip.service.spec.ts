import { Test, TestingModule } from '@nestjs/testing';
import { GeoIpService } from './geoip.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('GeoIpService', () => {
  let service: GeoIpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeoIpService,
        {
          provide: PrismaService,
          useValue: {
            ioc: {
              findMany: jest.fn().mockResolvedValue([
                { id: 'ioc-1', value: '198.51.100.1', confidenceScore: 80, tags: ['malicious'], firstSeenAt: new Date() },
              ]),
            },
          },
        },
      ],
    }).compile();

    service = module.get<GeoIpService>(GeoIpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should resolve IP on cache miss and return cached=false', () => {
    const res = service.lookupIp('198.51.100.1');
    expect(res.cached).toBe(false);
    expect(res.country).toBeDefined();
  });

  it('should return cached=true on subsequent lookup for same IP', () => {
    service.lookupIp('198.51.100.1');
    const second = service.lookupIp('198.51.100.1');
    expect(second.cached).toBe(true);
  });
});
