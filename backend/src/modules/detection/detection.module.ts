import { Module } from '@nestjs/common';
import { AnomalyScoringService } from './anomaly-scoring.service';
import { AlertsModule } from '../alerts/alerts.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [AlertsModule, KafkaModule],
  providers: [AnomalyScoringService],
  exports: [AnomalyScoringService],
})
export class DetectionModule {}
