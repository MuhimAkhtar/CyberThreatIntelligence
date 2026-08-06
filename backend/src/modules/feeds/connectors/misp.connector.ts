import { FeedConnector, RawIndicator } from './feed-connector.interface';
import axios from 'axios';
import { Logger } from '@nestjs/common';
import { IocType } from '@prisma/client';

export class MispConnector implements FeedConnector {
  private readonly logger = new Logger(MispConnector.name);

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async fetchIndicators(since?: Date): Promise<RawIndicator[]> {
    if (!this.baseUrl || !this.apiKey) {
      this.logger.warn('MISP Connector initialized without baseUrl or apiKey');
      return [];
    }

    try {
      const payload: any = {
        returnFormat: 'json',
        limit: 1000,
      };

      if (since) {
        payload.timestamp = Math.floor(since.getTime() / 1000);
      }

      const response = await axios.post(`${this.baseUrl}/attributes/restSearch`, payload, {
        headers: {
          Authorization: this.apiKey,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const attributes = response.data?.response?.Attribute || [];
      return attributes.map((attr: any) => ({
        type: attr.type,
        value: attr.value,
        category: attr.category,
        comment: attr.comment,
        tags: [],
        timestamp: attr.timestamp ? new Date(attr.timestamp * 1000).toISOString() : undefined,
        rawData: attr,
      }));
    } catch (error) {
      this.logger.error('Error fetching from MISP', error);
      return [];
    }
  }
}
