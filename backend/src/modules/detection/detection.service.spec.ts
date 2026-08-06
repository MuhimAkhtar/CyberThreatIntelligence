import { Test, TestingModule } from '@nestjs/testing';
import { AnomalyScoringService } from './anomaly-scoring.service';
import { AlertRuleEngineService } from '../alerts/alert-rule-engine.service';
import { KafkaConsumerService } from '../kafka/kafka-consumer.service';

describe('AnomalyScoringService', () => {
  let service: AnomalyScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnomalyScoringService,
        {
          provide: AlertRuleEngineService,
          useValue: {
            createAndEmitAlert: jest.fn().mockResolvedValue({ id: 'alert-anomaly-1' }),
          },
        },
        {
          provide: KafkaConsumerService,
          useValue: {
            subscribe: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AnomalyScoringService>(AnomalyScoringService);
  });

  it('should compute baseline stats for time-series events', async () => {
    await service.processEvent({ value: '1.1.1.1' });
    await service.processEvent({ value: '2.2.2.2' });

    const stats = service.computeBaselineStats();
    expect(stats.mean).toBeGreaterThan(0);
  });
});
