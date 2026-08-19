import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { Metric } from './entities/metric.entity';
import { Alert } from '../alerts/entities/alert.entity';

const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

@WebSocketGateway({
  cors: {
    origin: corsOrigins,
    credentials: true,
  },
})
export class MetricsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(MetricsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      this.bearerFromHeader(client.handshake.headers.authorization);

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);
      const room = `user:${payload.sub}`;
      client.data.userId = payload.sub;
      await client.join(room);
      this.logger.log(`Client ${client.id} joined ${room}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  sendNewMetric(metric: Metric) {
    if (!metric.userId) {
      return;
    }
    this.server.to(`user:${metric.userId}`).emit('newMetric', metric);
  }

  sendNewAlert(alert: Alert) {
    if (!alert.userId) {
      return;
    }
    this.server.to(`user:${alert.userId}`).emit('newAlert', alert);
  }

  private bearerFromHeader(header?: string | string[]): string | undefined {
    const value = Array.isArray(header) ? header[0] : header;
    return value?.startsWith('Bearer ') ? value.slice(7) : undefined;
  }
}
