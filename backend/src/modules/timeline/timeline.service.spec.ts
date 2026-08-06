import { Test, TestingModule } from '@nestjs/testing';
import { TimelineService } from './timeline.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TimelineService', () => {
  let service: TimelineService;

  const mockIoc = { id: '1', type: 'IP_ADDRESS', value: '1.1.1.1', confidenceScore: 90, createdAt: new Date('2026-07-30T10:00:00Z') };
  const mockAlert = { id: '2', title: 'High Severity Alert', severity: 'HIGH', sourceType: 'RULE', status: 'NEW', createdAt: new Date('2026-07-30T11:00:00Z') };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimelineService,
        {
          provide: PrismaService,
          useValue: {
            ioc: { findMany: jest.fn().mockResolvedValue([mockIoc]) },
            alert: { findMany: jest.fn().mockResolvedValue([mockAlert]) },
            cve: { findMany: jest.fn().mockResolvedValue([]) },
            investigationCase: { findMany: jest.fn().mockResolvedValue([]) },
          },
        },
      ],
    }).compile();

    service = module.get<TimelineService>(TimelineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should aggregate events from multiple sources and sort chronologically', async () => {
    const res = await service.getTimeline(10);
    expect(res.events.length).toBe(2);
    // Newest event first (Alert at 11:00 before IOC at 10:00)
    expect(res.events[0].eventType).toBe('ALERT_TRIGGERED');
    expect(res.events[1].eventType).toBe('IOC_ADDED');
  });
});
