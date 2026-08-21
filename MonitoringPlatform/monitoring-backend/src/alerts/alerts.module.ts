import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { Alert } from './entities/alert.entity';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Alert]), AuthModule, NotificationsModule],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService], // برای استفاده در MetricsModule
})
export class AlertsModule {}