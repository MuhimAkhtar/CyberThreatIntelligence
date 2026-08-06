import { Injectable, Logger } from '@nestjs/common';

interface SlidingWindowEntry {
  timestamp: number;
  value: string;
}

@Injectable()
export class ThresholdRuleEvaluator {
  private readonly logger = new Logger(ThresholdRuleEvaluator.name);
  private eventsWindow: SlidingWindowEntry[] = [];

  /**
   * Evaluates if a given event value exceeds frequency threshold N within window T (in minutes).
   */
  evaluate(value: string, countThreshold: number, timeWindowMinutes: number): boolean {
    const now = Date.now();
    const windowMs = timeWindowMinutes * 60 * 1000;

    // Push new event
    this.eventsWindow.push({ timestamp: now, value });

    // Clean up old events outside the window
    const cutoff = now - windowMs;
    this.eventsWindow = this.eventsWindow.filter((e) => e.timestamp >= cutoff);

    // Count occurrences of this specific value in current window
    const matches = this.eventsWindow.filter((e) => e.value === value).length;

    return matches >= countThreshold;
  }
}
