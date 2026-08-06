import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaConsumerService } from '../kafka/kafka-consumer.service';
import { AlertRuleEngineService } from '../alerts/alert-rule-engine.service';
import { TOPIC_THREAT_INTEL_RAW, TOPIC_IOC_NORMALIZED } from '../kafka/kafka.constants';
import { AlertSeverity } from '@prisma/client';

interface FrequencyHistory {
  timestamps: number[];
}

@Injectable()
export class AnomalyScoringService implements OnModuleInit {
  private readonly logger = new Logger(AnomalyScoringService.name);
  private frequencyMap = new Map<string, FrequencyHistory>();

  constructor(
    private readonly kafkaConsumer: KafkaConsumerService,
    private readonly alertRuleEngine: AlertRuleEngineService,
  ) {}

  async onModuleInit() {
    await this.subscribeToKafkaStreams();
  }

  private async subscribeToKafkaStreams() {
    await this.kafkaConsumer.subscribe(
      TOPIC_THREAT_INTEL_RAW,
      'detection-anomaly-raw-group',
      async ({ message }) => {
        if (!message.value) return;
        try {
          const payload = JSON.parse(message.value.toString());
          await this.processEvent(payload);
        } catch (err) {
          this.logger.error('Error processing anomaly telemetry', err);
        }
      },
    );
  }

  async processEvent(event: any) {
    const key = event.value || event.indicator || event.ip || 'UNKNOWN';
    const now = Date.now();

    let history = this.frequencyMap.get(key);
    if (!history) {
      history = { timestamps: [] };
      this.frequencyMap.set(key, history);
    }

    history.timestamps.push(now);

    // Keep only last 10 minutes (600,000 ms) of history
    const cutoff = now - 10 * 60 * 1000;
    history.timestamps = history.timestamps.filter((ts) => ts >= cutoff);

    // Compute statistical anomaly metrics (z-score on event frequency)
    const count = history.timestamps.length;
    const stats = this.computeBaselineStats();

    if (stats.stdDev > 0) {
      const zScore = (count - stats.mean) / stats.stdDev;
      if (zScore >= 2.5) {
        this.logger.warn(`Anomaly detected for key "${key}": z-score ${zScore.toFixed(2)} (count: ${count})`);

        // Feed anomaly directly into Alert Pipeline as a PATTERN/Statistical rule match
        await this.alertRuleEngine.createAndEmitAlert({
          title: `Statistical Anomaly Detected: Key "${key}" (z-score: ${zScore.toFixed(1)})`,
          description: `Frequency spike detected for ${key}. Current window count (${count}) is ${zScore.toFixed(1)} standard deviations above baseline mean (${stats.mean.toFixed(1)}).`,
          severity: zScore >= 4 ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
          sourceType: 'ANOMALY_DETECTOR',
          sourceId: key,
          riskScore: Math.min(100, Math.round(zScore * 20)),
        });
      }
    }
  }

  computeBaselineStats(): { mean: number; stdDev: number } {
    const counts: number[] = [];
    for (const [, history] of this.frequencyMap) {
      counts.push(history.timestamps.length);
    }

    if (counts.length === 0) return { mean: 0, stdDev: 0 };

    const sum = counts.reduce((a, b) => a + b, 0);
    const mean = sum / counts.length;

    const variance = counts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev };
  }
}
