import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Metric } from './entities/metric.entity';
import { CreateMetricDto } from './dto/create-metric.dto';
import { AlertsService } from '../alerts/alerts.service';
import { AlertSeverity } from '../alerts/entities/alert.entity';
import { MetricsGateway } from './metrics.gateway';
import { AppConfiguration } from '../config/configuration';

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(Metric)
    private readonly metricRepository: Repository<Metric>,
    private readonly alertsService: AlertsService,
    private readonly metricsGateway: MetricsGateway,
    private readonly configService: ConfigService,
  ) {}

  async create(createMetricDto: CreateMetricDto): Promise<Metric> {
    const metric = this.metricRepository.create(createMetricDto);
    const savedMetric = await this.metricRepository.save(metric);

    this.metricsGateway.sendNewMetric(savedMetric);
    await this.evaluateThresholds(createMetricDto);

    return savedMetric;
  }

  private async evaluateThresholds(dto: CreateMetricDto) {
    const alerts =
      this.configService.getOrThrow<AppConfiguration['alerts']>('alerts');

    if (dto.cpuUsagePercent > alerts.cpuThreshold) {
      const alert = await this.alertsService.createAlert(
        dto.machineName,
        'CPU',
        dto.cpuUsagePercent,
        alerts.cpuThreshold,
        AlertSeverity.CRITICAL,
        `High CPU usage detected on ${dto.machineName}: ${dto.cpuUsagePercent.toFixed(1)}%`,
      );
      if (alert) {
        this.metricsGateway.sendNewAlert(alert);
      }
    }

    if (dto.ramUsagePercent > alerts.ramThreshold) {
      const alert = await this.alertsService.createAlert(
        dto.machineName,
        'RAM',
        dto.ramUsagePercent,
        alerts.ramThreshold,
        AlertSeverity.WARNING,
        `High RAM usage detected on ${dto.machineName}: ${dto.ramUsagePercent.toFixed(1)}%`,
      );
      if (alert) {
        this.metricsGateway.sendNewAlert(alert);
      }
    }

    for (const disk of dto.disks ?? []) {
      if (disk.usedPercent > alerts.diskThreshold) {
        const alert = await this.alertsService.createAlert(
          dto.machineName,
          `DISK (${disk.driveName})`,
          disk.usedPercent,
          alerts.diskThreshold,
          AlertSeverity.CRITICAL,
          `Low disk space on drive ${disk.driveName} (${dto.machineName}): ${disk.usedPercent.toFixed(1)}% used`,
        );
        if (alert) {
          this.metricsGateway.sendNewAlert(alert);
        }
      }
    }
  }

  async findAll(): Promise<Metric[]> {
    return await this.metricRepository.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
