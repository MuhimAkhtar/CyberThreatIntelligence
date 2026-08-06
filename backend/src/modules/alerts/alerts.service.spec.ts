import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from './alerts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertStatus, AlertSeverity } from '@prisma/client';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('AlertsService', () => {
  let service: AlertsService;
  let prisma: PrismaService;

  const mockAlert = {
    id: 'alert-001',
    title: 'Test Alert',
    description: 'Test Description',
    severity: AlertSeverity.HIGH,
    status: AlertStatus.NEW,
    sourceType: 'IOC',
    sourceId: '1.2.3.4',
    createdAt: new Date(),
    resolvedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        {
          provide: PrismaService,
          useValue: {
            alert: {
              findMany: jest.fn().mockResolvedValue([mockAlert]),
              count: jest.fn().mockResolvedValue(1),
              findUnique: jest.fn().mockResolvedValue(mockAlert),
              update: jest.fn().mockImplementation(({ data }) =>
                Promise.resolve({ ...mockAlert, ...data }),
              ),
              groupBy: jest.fn().mockResolvedValue([]),
            },
            alertRule: {
              findMany: jest.fn().mockResolvedValue([]),
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should allow valid status transition (NEW -> TRIAGED)', async () => {
    const updated = await service.updateStatus('alert-001', AlertStatus.TRIAGED);
    expect(updated.status).toBe(AlertStatus.TRIAGED);
  });

  it('should reject invalid status transition (NEW -> RESOLVED) with 409 ConflictException', async () => {
    await expect(service.updateStatus('alert-001', AlertStatus.RESOLVED)).rejects.toThrow(
      ConflictException,
    );
  });

  it('should return paginated list of alerts', async () => {
    const res = await service.findAll({});
    expect(res.data).toHaveLength(1);
    expect(res.total).toBe(1);
  });
});
