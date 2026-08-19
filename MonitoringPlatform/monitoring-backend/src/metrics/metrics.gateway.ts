import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
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
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`[WebSocket] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WebSocket] Client disconnected: ${client.id}`);
  }

  sendNewMetric(metric: Metric) {
    this.server.emit('newMetric', metric);
  }

  sendNewAlert(alert: Alert) {
    this.server.emit('newAlert', alert);
  }
}
