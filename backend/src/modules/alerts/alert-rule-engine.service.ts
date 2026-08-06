import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KafkaConsumerService } from '../kafka/kafka-consumer.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { ThresholdRuleEvaluator } from './rules/threshold-rule.evaluator';
import { mapCveSeverityToAlertSeverity, mapConfidenceScoreToAlertSeverity } from './rules/severity-mapper';
import {
  TOPIC_THREAT_INTEL_RAW,
  TOPIC_IOC_NORMALIZED,
  TOPIC_CVE_UPDATES,
  TOPIC_ALERTS_CREATED,
} from '../kafka/kafka.constants';
import { AlertSeverity, AlertStatus } from '@prisma/client';

@Injectable()
export class AlertRuleEngineService implements OnModuleInit {
  private readonly logger = new Logger(AlertRuleEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaConsumer: KafkaConsumerService,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly thresholdEvaluator: ThresholdRuleEvaluator,
  ) {}

  async onModuleInit() {
    // Subscribe to incoming telemetry & intelligence Kafka streams
    await this.subscribeToEvents();
  }

  private async subscribeToEvents() {
    // 1. Raw Threat Intel / IOC events
    await this.kafkaConsumer.subscribe(
      TOPIC_THREAT_INTEL_RAW,
      'alert-engine-raw-group',
      async ({ message }) => {
        if (!message.value) return;
        try {
          const payload = JSON.parse(message.value.toString());
          await this.evaluateIocEvent(payload);
        } catch (err) {
          this.logger.error('Failed to evaluate raw threat intel message', err);
        }
      },
    );

    // 2. Normalized IOC events
    await this.kafkaConsumer.subscribe(
      TOPIC_IOC_NORMALIZED,
      'alert-engine-ioc-group',
      async ({ message }) => {
        if (!message.value) return;
        try {
          const payload = JSON.parse(message.value.toString());
          await this.evaluateIocEvent(payload);
        } catch (err) {
          this.logger.error('Failed to evaluate normalized IOC message', err);
        }
      },
    );

    // 3. CVE updates
    await this.kafkaConsumer.subscribe(
      TOPIC_CVE_UPDATES,
      'alert-engine-cve-group',
      async ({ message }) => {
        if (!message.value) return;
        try {
          const payload = JSON.parse(message.value.toString());
          await this.evaluateCveEvent(payload);
        } catch (err) {
          this.logger.error('Failed to evaluate CVE update message', err);
        }
      },
    );

    this.logger.log('AlertRuleEngineService successfully subscribed to Kafka topics');
  }

  async evaluateIocEvent(event: any) {
    const rules = await this.prisma.alertRule.findMany({ where: { enabled: true } });
    const value = event.value || event.indicator || '';
    const type = event.type || 'IOC';
    const confidence = event.confidenceScore ?? event.confidence ?? 50;

    for (const rule of rules) {
      const config: any = rule.config || {};

      if (rule.ruleType === 'THRESHOLD') {
        const threshold = config.countThreshold || 3;
        const windowMinutes = config.timeWindowMinutes || 5;

        if (this.thresholdEvaluator.evaluate(value, threshold, windowMinutes)) {
          await this.createAndEmitAlert({
            title: `Threshold Exceeded: ${type} "${value}" seen ${threshold}+ times`,
            description: `IOC ${value} matched threshold rule "${rule.name}" within ${windowMinutes} minutes.`,
            severity: mapConfidenceScoreToAlertSeverity(confidence),
            sourceType: 'IOC',
            sourceId: value,
            ruleId: rule.id,
            riskScore: Math.min(100, confidence + 20),
          });
        }
      } else if (rule.ruleType === 'PATTERN' || rule.ruleType === 'CORRELATION') {
        // Pattern / Tag / High Confidence matching
        const minConfidence = config.minConfidence || 70;
        if (confidence >= minConfidence) {
          await this.createAndEmitAlert({
            title: `High Confidence Indicator Detected: ${type} ${value}`,
            description: `IOC ${value} triggered rule "${rule.name}" with confidence score ${confidence}.`,
            severity: mapConfidenceScoreToAlertSeverity(confidence),
            sourceType: 'IOC',
            sourceId: value,
            ruleId: rule.id,
            riskScore: confidence,
          });
        }
      }
    }
  }

  async evaluateCveEvent(event: any) {
    const rules = await this.prisma.alertRule.findMany({ where: { enabled: true } });
    const cveId = event.cveId || event.id || 'CVE-UNKNOWN';
    const rawSeverity = event.severity || 'NONE';
    const mappedSeverity = mapCveSeverityToAlertSeverity(rawSeverity);

    for (const rule of rules) {
      const config: any = rule.config || {};
      const targetSeverity = (config.minSeverity || 'HIGH').toUpperCase();

      const severities = ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const eventSevRank = severities.indexOf(rawSeverity.toUpperCase());
      const minSevRank = severities.indexOf(targetSeverity);

      if (eventSevRank >= minSevRank && eventSevRank > 0) {
        await this.createAndEmitAlert({
          title: `Vulnerability Alert: ${cveId} (${rawSeverity})`,
          description: event.description || `New or updated ${rawSeverity} severity vulnerability ${cveId}.`,
          severity: mappedSeverity,
          sourceType: 'CVE',
          sourceId: cveId,
          ruleId: rule.id,
          riskScore: (eventSevRank / 4) * 100,
        });
      }
    }
  }

  async createAndEmitAlert(alertData: {
    title: string;
    description: string;
    severity: AlertSeverity;
    sourceType: string;
    sourceId: string;
    ruleId?: string;
    riskScore: number;
  }) {
    // 1. Create Alert in Postgres
    const alert = await this.prisma.alert.create({
      data: {
        title: alertData.title,
        description: alertData.description,
        severity: alertData.severity,
        status: AlertStatus.NEW,
        sourceType: alertData.sourceType,
        sourceId: alertData.sourceId,
        ruleId: alertData.ruleId || null,
        riskScore: Math.round(alertData.riskScore),
      },
      include: { rule: true },
    });

    this.logger.log(`Created Alert ${alert.id}: ${alert.title} [${alert.severity}]`);

    // 2. Emit to alerts.created topic
    await this.kafkaProducer.emit(TOPIC_ALERTS_CREATED, alert.id, alert as unknown as Record<string, unknown>);

    return alert;
  }
}
