import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // اجازه دسترسی از همه مبداها (از جمله فرانت‌اند)
  },
})
export class MetricsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`[WebSocket] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WebSocket] Client disconnected: ${client.id}`);
  }

  // متد اختصاصی برای ارسال داده‌های جدید به تمام کلاینت‌های متصل
  sendNewMetric(metric: any) {
    this.server.emit('newMetric', metric);
  }

  // متد اختصاصی برای ارسال هشدارهای جدید
  sendNewAlert(alert: any) {
    this.server.emit('newAlert', alert);
  }
}