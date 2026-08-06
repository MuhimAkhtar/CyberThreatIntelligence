import { FeedConnector, RawIndicator } from './feed-connector.interface';
import axios from 'axios';
import { Logger } from '@nestjs/common';

export class CustomJsonConnector implements FeedConnector {
  private readonly logger = new Logger(CustomJsonConnector.name);

  constructor(
    private readonly url: string,
    private readonly headers: Record<string, string>,
    private readonly mapping: { itemsPath: string; typeField: string; valueField: string },
  ) {}

  async fetchIndicators(since?: Date): Promise<RawIndicator[]> {
    try {
      const response = await axios.get(this.url, { headers: this.headers });
      
      let items = response.data;
      if (this.mapping.itemsPath) {
        items = this.mapping.itemsPath.split('.').reduce((obj: any, key: string) => obj?.[key], response.data);
      }

      if (!Array.isArray(items)) {
        this.logger.warn('Custom JSON feed did not return an array');
        return [];
      }

      return items.map((item: any) => ({
        type: item[this.mapping.typeField] || 'unknown',
        value: item[this.mapping.valueField],
        rawData: item,
      })).filter(ind => ind.value);
    } catch (error) {
      this.logger.error('Error fetching from custom JSON', error);
      return [];
    }
  }
}
