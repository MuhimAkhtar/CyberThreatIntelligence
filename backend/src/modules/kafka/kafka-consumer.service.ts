import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';

@Injectable()
export class KafkaConsumerService implements OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private consumers: Consumer[] = [];
  private kafka: Kafka;

  constructor(private readonly configService: ConfigService) {
    const brokers = this.configService.get<string[]>('kafka.brokers');
    this.kafka = new Kafka({
      clientId: 'ctp-consumer',
      brokers: brokers || ['localhost:9092'],
    });
  }

  async subscribe(
    topic: string,
    groupId: string,
    handler: (message: EachMessagePayload) => Promise<void>,
  ): Promise<void> {
    const consumer = this.kafka.consumer({ groupId });
    this.consumers.push(consumer);

    try {
      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });

      await consumer.run({
        eachMessage: async (payload) => {
          try {
            await handler(payload);
          } catch (error) {
            this.logger.error(`Error handling message from topic ${topic}`, error);
          }
        },
      });
      this.logger.log(`Kafka Consumer subscribed to topic ${topic} with group ${groupId}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe consumer to topic ${topic}`, error);
    }
  }

  async onModuleDestroy() {
    for (const consumer of this.consumers) {
      try {
        await consumer.disconnect();
      } catch (error) {
        this.logger.error('Failed to disconnect consumer', error);
      }
    }
    this.logger.log('Kafka Consumers disconnected');
  }
}
