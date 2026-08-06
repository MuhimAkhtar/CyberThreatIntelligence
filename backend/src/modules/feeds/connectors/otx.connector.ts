import { FeedConnector, RawIndicator } from './feed-connector.interface';
import axios from 'axios';
import { Logger } from '@nestjs/common';

export class OtxConnector implements FeedConnector {
  private readonly logger = new Logger(OtxConnector.name);
  private readonly baseUrl = 'https://otx.alienvault.com/api/v1';

  constructor(private readonly apiKey: string) {}

  async fetchIndicators(since?: Date): Promise<RawIndicator[]> {
    if (!this.apiKey) {
      this.logger.warn('OTX Connector initialized without apiKey');
      return [];
    }

    try {
      let url = `${this.baseUrl}/pulses/subscribed`;
      if (since) {
        url += `?modified_since=${since.toISOString()}`;
      }

      const response = await axios.get(url, {
        headers: {
          'X-OTX-API-KEY': this.apiKey,
        },
      });

      const pulses = response.data?.results || [];
      const indicators: RawIndicator[] = [];

      for (const pulse of pulses) {
        for (const ind of pulse.indicators || []) {
          indicators.push({
            type: ind.type,
            value: ind.indicator,
            comment: pulse.description,
            tags: pulse.tags,
            timestamp: ind.created,
            rawData: ind,
          });
        }
      }

      return indicators;
    } catch (error) {
      this.logger.error('Error fetching from OTX', error);
      return [];
    }
  }
}
