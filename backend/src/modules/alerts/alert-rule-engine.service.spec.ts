import { Test, TestingModule } from '@nestjs/testing';
import { AlertRuleEngineService } from './alert-rule-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { KafkaConsumerService } from '../kafka/kafka-consumer.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { ThresholdRuleEvaluator } from './rules/threshold-rule.evaluator';
import { AlertSeverity } from '@prisma/client';

describe('AlertRuleEngineService', () => {
  let service: AlertRuleEngineService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertRuleEngineService,
        ThresholdRuleEvaluator,
        {
          provide: PrismaService,
          useValue: {
            alertRule: {
              findMany: jest.fn().mockResolvedValue([
                {
                  id: 'rule-001',
                  name: 'High Severity CVE Rule',
                  ruleType: 'CVE',
                  config: { minSeverity: 'HIGH' },
                  enabled: true,
                },
              ]),
            },
            alert: {
              create: jest.fn().mockResolvedValue({
                id: 'alert-100',
                title: 'Vulnerability Alert: CVE-2026-1234 (HIGH)',
                severity: AlertSeverity.HIGH,
                status: 'NEW',
              }),
            },
          },
        },
        {
          provide: KafkaConsumerService,
          useValue: {
            subscribe: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: KafkaProducerService,
          useValue: {
            emit: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AlertRuleEngineService>(AlertRuleEngineService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should evaluate CVE event and create alert', async () => {
    const alert = await service.createAndEmitAlert({
      title: 'Vulnerability Alert: CVE-2026-1234 (HIGH)',
      description: 'Test CVE description',
      severity: AlertSeverity.HIGH,
      sourceType: 'CVE',
      sourceId: 'CVE-2026-1234',
      riskScore: 75,
    });

    expect(alert).toBeDefined();
    expect(alert.id).toBe('alert-100');
  });
});
