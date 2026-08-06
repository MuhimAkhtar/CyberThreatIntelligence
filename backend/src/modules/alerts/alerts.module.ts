import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertRuleEngineService } from './alert-rule-engine.service';
import { ThresholdRuleEvaluator } from './rules/threshold-rule.evaluator';
import { PrismaModule } from '../../prisma/prisma.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [PrismaModule, KafkaModule],
  controllers: [AlertsController],
  providers: [
    AlertsService,
    AlertRuleEngineService,
    ThresholdRuleEvaluator,
  ],
  exports: [AlertsService, AlertRuleEngineService],
})
export class AlertsModule {}
