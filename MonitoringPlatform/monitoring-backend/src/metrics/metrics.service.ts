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

  async create(
    createMetricDto: CreateMetricDto,
    organizationId: string,
    userId?: string,
  ): Promise<Metric> {
    const metric = this.metricRepository.create({
      ...createMetricDto,
      organizationId,
      userId: userId && userId !== 'agent' ? userId : null,
    });
    const savedMetric = await this.metricRepository.save(metric);

    this.metricsGateway.sendNewMetric(savedMetric);
    await this.raiseAlerts(createMetricDto, organizationId);

    return savedMetric;
  }

  async findAll(organizationId: string): Promise<Metric[]> {
    return await this.metricRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async listHosts(organizationId: string): Promise<string[]> {
    const rows = await this.metricRepository
      .createQueryBuilder('metric')
      .select('DISTINCT metric.machineName', 'machineName')
      .where('metric.organizationId = :organizationId', { organizationId })
      .orderBy('metric.machineName', 'ASC')
      .getRawMany<{ machineName: string }>();

    return rows
      .map((row) => row.machineName)
      .filter((name) => Boolean(name?.trim()));
  }

  private async raiseAlerts(dto: CreateMetricDto, organizationId: string) {
    for (const violation of this.thresholdEvaluator.evaluate(dto)) {
      const alert = await this.alertsService.createAlert(
        organizationId,
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
