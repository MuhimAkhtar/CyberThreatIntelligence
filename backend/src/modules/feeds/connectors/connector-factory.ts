import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThreatFeed, FeedType } from '@prisma/client';
import { FeedConnector } from './feed-connector.interface';
import { MispConnector } from './misp.connector';
import { OtxConnector } from './otx.connector';
import { CustomJsonConnector } from './custom-json.connector';
import { FeodoTrackerConnector } from './feodotracker.connector';
import { MalwareBazaarConnector } from './malwarebazaar.connector';

@Injectable()
export class ConnectorFactory {
  constructor(private readonly configService: ConfigService) {}

  createConnector(feed: ThreatFeed): FeedConnector {
    switch (feed.type) {
      case FeedType.MISP: {
        const baseUrl = feed.baseUrl || this.configService.get<string>('misp.baseUrl') || '';
        let apiKey = '';
        if (feed.apiKeyEnvVar) {
          apiKey = process.env[feed.apiKeyEnvVar] || '';
        }
        if (!apiKey) {
          apiKey = this.configService.get<string>('misp.apiKey') || '';
        }
        return new MispConnector(baseUrl, apiKey);
      }
      case FeedType.OTX: {
        let apiKey = '';
        if (feed.apiKeyEnvVar) {
          apiKey = process.env[feed.apiKeyEnvVar] || '';
        }
        if (!apiKey) {
          apiKey = this.configService.get<string>('otx.apiKey') || '';
        }
        return new OtxConnector(apiKey);
      }
      case FeedType.CUSTOM: {
        const config: any = feed.config || {};
        return new CustomJsonConnector(
          feed.baseUrl || '',
          config.headers || {},
          config.mapping || { itemsPath: '', typeField: 'type', valueField: 'value' }
        );
      }
      case 'FEODOTRACKER' as any: {
        return new FeodoTrackerConnector();
      }
      case 'MALWAREBAZAAR' as any: {
        return new MalwareBazaarConnector();
      }
      default:
        throw new Error(`Unsupported feed type: ${feed.type}`);
    }
  }
}
