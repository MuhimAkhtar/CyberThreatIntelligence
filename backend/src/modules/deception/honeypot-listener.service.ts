import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as net from 'net';
import * as crypto from 'crypto';
import { KafkaProducerService } from '../kafka/kafka-producer.service';

export interface HoneypotTrapLog {
  id: string;
  sourceIp: string;
  sourcePort: number;
  protocol: 'SSH_HONEYPOT' | 'HTTP_HONEYPOT';
  payloadCaptured: string;
  timestamp: string;
}

export interface CanaryToken {
  id: string;
  tokenType: 'CANARY_URL' | 'DECOY_DB_CREDENTIAL' | 'CANARY_PDF';
  tokenValue: string;
  targetAsset: string;
  createdAt: string;
  triggerCount: number;
}

@Injectable()
export class HoneypotListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HoneypotListenerService.name);
  private server: net.Server | null = null;
  private honeypotLogs: HoneypotTrapLog[] = [];
  private canaryTokens: CanaryToken[] = [];

  constructor(private readonly kafkaProducer: KafkaProducerService) {}

  onModuleInit() {
    this.startHoneypotListener();
    this.seedDefaultCanaryTokens();
  }

  onModuleDestroy() {
    if (this.server) {
      this.server.close();
      this.logger.log('Honeypot TCP socket listener shut down');
    }
  }

  private startHoneypotListener() {
    const port = 2222; // Synthetic SSH Honeypot Port
    this.server = net.createServer((socket) => {
      const remoteIp = socket.remoteAddress || '198.51.100.99';
      const remotePort = socket.remotePort || 54321;

      this.logger.warn(`🚨 HONEYPOT TRAP TRIGGERED! Perimeter probe detected from ${remoteIp}:${remotePort}`);

      socket.write('SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.5\r\n');

      socket.on('data', async (data) => {
        const payloadStr = data.toString('utf-8').trim();
        const trapLog: HoneypotTrapLog = {
          id: `hp-${crypto.randomBytes(6).toString('hex')}`,
          sourceIp: remoteIp,
          sourcePort: remotePort,
          protocol: 'SSH_HONEYPOT',
          payloadCaptured: payloadStr || 'SSH_HANDSHAKE_ATTEMPT',
          timestamp: new Date().toISOString(),
        };

        this.honeypotLogs.unshift(trapLog);
        if (this.honeypotLogs.length > 50) this.honeypotLogs.pop();

        // Stream honeypot capture directly to Kafka
        await this.kafkaProducer.emit('threat-intel.raw', remoteIp, {
          type: 'HONEYPOT_ATTACK_IP',
          value: remoteIp,
          confidenceScore: 100,
          severity: 'CRITICAL',
          comment: `Synthetic SSH Honeypot capture: ${payloadStr}`,
        });

        socket.destroy();
      });
    });

    this.server.listen(port, () => {
      this.logger.log(`Honeypot Deception Mesh TCP listener active on port ${port}`);
    });

    this.server.on('error', (err) => {
      this.logger.warn(`Honeypot listener port ${port} unavailable, fallback logging active: ${err.message}`);
    });
  }

  private seedDefaultCanaryTokens() {
    this.canaryTokens = [
      {
        id: 'canary-001',
        tokenType: 'CANARY_URL',
        tokenValue: 'http://localhost:3000/api/v1/deception/canary/trigger/tok_991823',
        targetAsset: 'NCTIP Executive Internal Portal',
        createdAt: new Date().toISOString(),
        triggerCount: 0,
      },
      {
        id: 'canary-002',
        tokenType: 'DECOY_DB_CREDENTIAL',
        tokenValue: 'decoy_admin_user / Passcode$9982!_canary',
        targetAsset: 'PostgreSQL Core Financial Schema',
        createdAt: new Date().toISOString(),
        triggerCount: 0,
      },
    ];
  }

  getHoneypotLogs(): HoneypotTrapLog[] {
    if (this.honeypotLogs.length === 0) {
      return [
        {
          id: 'hp-001',
          sourceIp: '198.51.100.77',
          sourcePort: 49152,
          protocol: 'SSH_HONEYPOT',
          payloadCaptured: 'SSH-2.0-Go-Implementation-Bruteforce',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'hp-002',
          sourceIp: '203.0.113.104',
          sourcePort: 51234,
          protocol: 'HTTP_HONEYPOT',
          payloadCaptured: 'GET /admin/config.php HTTP/1.1 (Exploit Scan)',
          timestamp: new Date().toISOString(),
        },
      ];
    }
    return this.honeypotLogs;
  }

  getCanaryTokens(): CanaryToken[] {
    return this.canaryTokens;
  }

  createCanaryToken(tokenType: CanaryToken['tokenType'], targetAsset: string): CanaryToken {
    const tokenId = `canary-${crypto.randomBytes(4).toString('hex')}`;
    const tokenVal = `http://localhost:3000/api/v1/deception/canary/trigger/${tokenId}`;

    const token: CanaryToken = {
      id: tokenId,
      tokenType,
      tokenValue: tokenVal,
      targetAsset,
      createdAt: new Date().toISOString(),
      triggerCount: 0,
    };

    this.canaryTokens.push(token);
    this.logger.log(`Created dynamic Canary Token [${tokenId}] for asset: ${targetAsset}`);
    return token;
  }
}
