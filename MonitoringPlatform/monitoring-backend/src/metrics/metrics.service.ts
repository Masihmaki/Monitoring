import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Metric } from './entities/metric.entity';
import { CreateMetricDto } from './dto/create-metric.dto';
import { AlertsService } from '../alerts/alerts.service';
import { MetricsGateway } from './metrics.gateway';
import { ThresholdEvaluator } from './threshold-evaluator.service';

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(Metric)
    private readonly metricRepository: Repository<Metric>,
    private readonly alertsService: AlertsService,
    private readonly metricsGateway: MetricsGateway,
    private readonly thresholdEvaluator: ThresholdEvaluator,
  ) {}

  async create(createMetricDto: CreateMetricDto, userId: string): Promise<Metric> {
    const metric = this.metricRepository.create({
      ...createMetricDto,
      userId,
    });
    const savedMetric = await this.metricRepository.save(metric);

    this.metricsGateway.sendNewMetric(savedMetric);
    await this.raiseAlerts(createMetricDto, userId);

    return savedMetric;
  }

  async findAll(userId: string): Promise<Metric[]> {
    return await this.metricRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  private async raiseAlerts(dto: CreateMetricDto, userId: string) {
    for (const violation of this.thresholdEvaluator.evaluate(dto)) {
      const alert = await this.alertsService.createAlert(
        userId,
        dto.machineName,
        violation.metricName,
        violation.currentValue,
        violation.thresholdValue,
        violation.severity,
        violation.message,
      );
      if (alert) {
        this.metricsGateway.sendNewAlert(alert);
      }
    }
  }
}
