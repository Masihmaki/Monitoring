import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsModule } from '../alerts/alerts.module';
import { AuthModule } from '../auth/auth.module';
import { MetricsModule } from '../metrics/metrics.module';
import { MonitorCheck } from './entities/monitor-check.entity';
import { Monitor } from './entities/monitor.entity';
import { HttpChecker } from './http-checker.service';
import { MonitorsController } from './monitors.controller';
import { MonitorsScheduler } from './monitors.scheduler';
import { MonitorsService } from './monitors.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Monitor, MonitorCheck]),
    AuthModule,
    AlertsModule,
    MetricsModule,
  ],
  controllers: [MonitorsController],
  providers: [MonitorsService, HttpChecker, MonitorsScheduler],
})
export class MonitorsModule {}
