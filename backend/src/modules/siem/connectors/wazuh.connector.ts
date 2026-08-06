import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';

@Injectable()
export class WazuhConnector {
  private readonly logger = new Logger(WazuhConnector.name);

  private requestHttps(urlStr: string, method: string, headers: any, body?: any): Promise<{ status: number; data: any }> {
    return new Promise((resolve, reject) => {
      const url = new URL(urlStr);
      const postData = body ? JSON.stringify(body) : null;
      if (postData) {
        headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = https.request({
        hostname: url.hostname,
        port: url.port || 55000,
        path: url.pathname + url.search,
        method: method,
        headers: headers,
        rejectUnauthorized: false, // Allow self-signed certs in local/dev deployment
      }, (res) => {
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

  async authenticate(config: any): Promise<string> {
    const host = config.host || 'localhost';
    const port = config.port || 55000;
    const username = config.username;
    const password = config.password;
    const url = `https://${host}:${port}/security/user/authenticate`;

    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    
    const response = await this.requestHttps(url, 'POST', {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    });

    if (response.status !== 200 || !response.data?.data?.token) {
      throw new Error(`Authentication failed with status ${response.status}: ${JSON.stringify(response.data)}`);
    }

    return response.data.data.token;
  }

  async testConnection(config: any): Promise<{ success: boolean; message: string }> {
    try {
      const token = await this.authenticate(config);
      const host = config.host || 'localhost';
      const port = config.port || 55000;
      const url = `https://${host}:${port}/manager/status`;

      const response = await this.requestHttps(url, 'GET', {
        'Authorization': `Bearer ${token}`,
      });

      if (response.status === 200) {
        return { success: true, message: 'Connection to Real Wazuh Manager successful' };
      }
      return { success: false, message: `Manager status returned HTTP ${response.status}` };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async forwardEvents(config: any, events: any[]): Promise<{ forwarded: number; errors: string[] }> {
    let token: string;
    try {
      token = await this.authenticate(config);
    } catch (error: any) {
      return { forwarded: 0, errors: [error.message] };
    }

    const host = config.host || 'localhost';
    const port = config.port || 55000;
    const url = `https://${host}:${port}/events`;
    let forwarded = 0;
    const errors: string[] = [];

    for (const event of events) {
      try {
        const response = await this.requestHttps(url, 'POST', {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }, event);

        if (response.status >= 200 && response.status < 300) {
          forwarded++;
        } else {
          errors.push(`Event forwarding status ${response.status}: ${JSON.stringify(response.data)}`);
        }
      } catch (error: any) {
        errors.push(error.message);
      }
    }

    return { forwarded, errors };
  }
}
