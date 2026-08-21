import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Inject, Logger, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { Metric } from './entities/metric.entity';
import { Alert } from '../alerts/entities/alert.entity';
import { Monitor } from '../monitors/entities/monitor.entity';
import { OrganizationsService } from '../organizations/organizations.service';

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

  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => OrganizationsService))
    private readonly organizationsService: OrganizationsService,
  ) {}

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      this.bearerFromHeader(client.handshake.headers.authorization);
    const organizationId = client.handshake.auth?.organizationId as
      | string
      | undefined;

    if (!token || !organizationId) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);
      await this.organizationsService.assertMembership(
        payload.sub,
        organizationId,
      );
      const room = `org:${organizationId}`;
      client.data.userId = payload.sub;
      client.data.organizationId = organizationId;
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
    if (!metric.organizationId) {
      return;
    }
    this.server.to(`org:${metric.organizationId}`).emit('newMetric', metric);
  }

  sendNewAlert(alert: Alert) {
    if (!alert.organizationId) {
      return;
    }
    this.server.to(`org:${alert.organizationId}`).emit('newAlert', alert);
  }

  sendAlertUpdate(alert: Alert) {
    if (!alert.organizationId) {
      return;
    }
    this.server.to(`org:${alert.organizationId}`).emit('alertUpdated', alert);
  }

  sendMonitorUpdate(monitor: Monitor | { organizationId: string | null }) {
    if (!monitor.organizationId) {
      return;
    }
    this.server
      .to(`org:${monitor.organizationId}`)
      .emit('monitorUpdated', monitor);
  }

  private bearerFromHeader(header?: string | string[]): string | undefined {
    const value = Array.isArray(header) ? header[0] : header;
    return value?.startsWith('Bearer ') ? value.slice(7) : undefined;
  }
}
