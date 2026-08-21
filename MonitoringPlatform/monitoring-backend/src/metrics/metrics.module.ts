import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { Metric } from './entities/metric.entity';
import { AlertsModule } from '../alerts/alerts.module';
import { MetricsGateway } from './metrics.gateway';
import { ThresholdEvaluator } from './threshold-evaluator.service';
import { AuthModule } from '../auth/auth.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Metric]),
    AlertsModule,
    AuthModule,
    forwardRef(() => OrganizationsModule),
  ],
  controllers: [MetricsController],
  providers: [MetricsService, MetricsGateway, ThresholdEvaluator],
  exports: [MetricsGateway],
})
export class MetricsModule {}
