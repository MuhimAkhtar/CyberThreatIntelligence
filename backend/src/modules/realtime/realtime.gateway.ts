import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { KafkaConsumerService } from '../kafka/kafka-consumer.service';
import { TOPIC_ALERTS_CREATED } from '../kafka/kafka.constants';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly kafkaConsumer: KafkaConsumerService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Realtime WebSocket Gateway initialized');
  }

  async onModuleInit() {
    // Subscribe to Kafka alerts.created topic and broadcast to connected socket clients
    await this.kafkaConsumer.subscribe(
      TOPIC_ALERTS_CREATED,
      'websocket-realtime-group',
      async ({ message }) => {
        if (!message.value) return;
        try {
          const alertPayload = JSON.parse(message.value.toString());
          this.logger.log(`Broadcasting alert:new for Alert ${alertPayload.id}`);
          this.server.emit('alert:new', alertPayload);
        } catch (err) {
          this.logger.error('Failed to broadcast alert:new event', err);
        }
      },
    );
  }

  async handleConnection(client: Socket) {
    try {
      // Validate JWT on connection handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`WebSocket connection rejected (missing token) for client ${client.id}`);
        client.emit('error', { message: 'Unauthorized: missing authentication token' });
        client.disconnect(true);
        return;
      }

      const jwtSecret = this.configService.get<string>('jwt.secret') || 'super-secret-key-change-in-production';
      const payload = await this.jwtService.verifyAsync(token, { secret: jwtSecret });

      // Attach authenticated user profile to socket instance
      (client as any).user = payload;
      this.logger.log(`WebSocket client connected & authenticated: ${client.id} (user: ${payload.email})`);
    } catch (err: any) {
      this.logger.warn(`WebSocket authentication failed for client ${client.id}: ${err.message}`);
      client.emit('error', { message: 'Unauthorized: invalid or expired token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WebSocket client disconnected: ${client.id}`);
  }
}
