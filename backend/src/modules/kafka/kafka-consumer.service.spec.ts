import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KafkaConsumerService } from './kafka-consumer.service';

jest.mock('kafkajs', () => {
  const mockConsumer = {
    connect: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    run: jest.fn().mockImplementation(async ({ eachMessage }) => {
      // Simulate receiving a message
      await eachMessage({
        topic: 'test-topic',
        partition: 0,
        message: { value: Buffer.from(JSON.stringify({ test: 'data' })) },
      });
    }),
    disconnect: jest.fn().mockResolvedValue(undefined),
  };

  return {
    Kafka: jest.fn().mockImplementation(() => ({
      consumer: jest.fn().mockReturnValue(mockConsumer),
    })),
  };
});

describe('KafkaConsumerService', () => {
  let service: KafkaConsumerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaConsumerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(['localhost:9092']),
          },
        },
      ],
    }).compile();

    service = module.get<KafkaConsumerService>(KafkaConsumerService);
  });

  it('should subscribe to topic and process messages', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    await service.subscribe('test-topic', 'test-group', handler);

    expect(handler).toHaveBeenCalled();
  });

  it('should disconnect all consumers on module destroy', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    await service.subscribe('test-topic', 'test-group', handler);

    await expect(service.onModuleDestroy()).resolves.not.toThrow();
  });
});
