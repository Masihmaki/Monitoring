import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { Metric } from './entities/metric.entity';
import { AlertsModule } from '../alerts/alerts.module';
import { MetricsGateway } from './metrics.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Metric]), AlertsModule],
  controllers: [MetricsController],
  providers: [MetricsService, MetricsGateway],
  exports: [MetricsGateway]
})
export class MetricsModule {}