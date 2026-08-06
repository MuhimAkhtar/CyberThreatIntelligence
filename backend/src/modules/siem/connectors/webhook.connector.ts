import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class WebhookConnector {
  private readonly logger = new Logger(WebhookConnector.name);

  async testConnection(config: any): Promise<{ success: boolean; message: string }> {
    const url = config.url;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: config.headers || {}
      });

      if (response.ok) {
        return { success: true, message: 'Connection successful' };
      }
      return { success: false, message: `Status: ${response.statusText}` };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async forwardEvents(config: any, events: any[]): Promise<{ forwarded: number; errors: string[] }> {
    const url = config.url;
    const secret = config.secret;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config.headers || {})
    };

    const payload = JSON.stringify({
      events,
      timestamp: new Date().toISOString(),
      source: 'CyberThreatPlatform'
    });

    if (secret) {
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      headers['X-CTP-Signature'] = hmac.digest('hex');
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: payload
      });

      if (response.ok) {
        return { forwarded: events.length, errors: [] };
      } else {
        const err = await response.text();
        return { forwarded: 0, errors: [err] };
      }
    } catch (error: any) {
      return { forwarded: 0, errors: [error.message] };
    }
  }
}
