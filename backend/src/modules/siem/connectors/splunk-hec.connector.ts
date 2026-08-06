import { Injectable, Logger } from '@nestjs/common';
import * as http from 'http';
import * as https from 'https';

@Injectable()
export class SplunkHecConnector {
  private readonly logger = new Logger(SplunkHecConnector.name);

  private requestHttpOrHttps(urlStr: string, method: string, headers: any, body?: any): Promise<{ status: number; data: any }> {
    return new Promise((resolve, reject) => {
      const url = new URL(urlStr);
      const isHttps = url.protocol === 'https:';
      const lib = isHttps ? https : http;
      const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
      if (postData) {
        headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const reqOptions: any = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 8088 : 8088),
        path: url.pathname + url.search,
        method: method,
        headers: headers,
      };

      if (isHttps) {
        reqOptions.rejectUnauthorized = false;
      }

      const req = lib.request(reqOptions, (res) => {
        let respData = '';
        res.on('data', chunk => respData += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 500, data: JSON.parse(respData) });
          } catch (e) {
            resolve({ status: res.statusCode || 500, data: respData });
          }
        });
      });

      req.on('error', reject);
      if (postData) req.write(postData);
      req.end();
    });
  }

  async testConnection(config: any): Promise<{ success: boolean; message: string }> {
    const host = config.host || 'localhost';
    const port = config.port || 8088;
    const token = config.token;
    const protocol = config.useHttps === true ? 'https' : 'http';
    const url = `${protocol}://${host}:${port}/services/collector/health`;

    try {
      const response = await this.requestHttpOrHttps(url, 'GET', {
        'Authorization': `Splunk ${token}`,
      });

      if (response.status === 200) {
        return { success: true, message: 'Connection to Splunk HEC successful' };
      }
      return { success: false, message: `Splunk HEC returned HTTP status ${response.status}: ${JSON.stringify(response.data)}` };
    } catch (error: any) {
      return { success: false, message: `Splunk HEC error: ${error.message}` };
    }
  }

  async forwardEvents(config: any, events: any[]): Promise<{ forwarded: number; errors: string[] }> {
    const host = config.host || 'localhost';
    const port = config.port || 8088;
    const token = config.token;
    const index = config.index || 'main';
    const protocol = config.useHttps === true ? 'https' : 'http';
    const url = `${protocol}://${host}:${port}/services/collector/event`;

    let forwarded = 0;
    const errors: string[] = [];

    // Send events formatted as standard Splunk HEC JSON
    for (const event of events) {
      const payload = {
        event: event,
        sourcetype: '_json',
        index: index,
        time: Math.floor(Date.now() / 1000),
      };

      try {
        const response = await this.requestHttpOrHttps(url, 'POST', {
          'Authorization': `Splunk ${token}`,
          'Content-Type': 'application/json',
        }, payload);

        if (response.status === 200 && response.data?.code === 0) {
          forwarded++;
        } else {
          errors.push(`Splunk HEC error ${response.status}: ${JSON.stringify(response.data)}`);
        }
      } catch (error: any) {
        errors.push(error.message);
      }
    }

    return { forwarded, errors };
  }
}
