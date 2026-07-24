import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Metric } from './entities/metric.entity';
import { CreateMetricDto } from './dto/create-metric.dto';
import { AlertsService } from '../alerts/alerts.service';
import { AlertSeverity } from '../alerts/entities/alert.entity';
import { MetricsGateway } from './metrics.gateway';

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(Metric)
    private readonly metricRepository: Repository<Metric>,
    private readonly alertsService: AlertsService,
    private readonly metricsGateway: MetricsGateway, // تزریق Gateway
  ) {}

  async create(createMetricDto: CreateMetricDto): Promise<Metric> {
    const metric = this.metricRepository.create(createMetricDto);
    const savedMetric = await this.metricRepository.save(metric);

    // ۱. ارسال زنده داده جدید روی WebSocket
    this.metricsGateway.sendNewMetric(savedMetric);

    // ۲. ارزیابی آستانه‌ها برای ثبت هشدار
    await this.evaluateThresholds(createMetricDto);

    return savedMetric;
  }

  private async evaluateThresholds(dto: CreateMetricDto) {
    const CPU_THRESHOLD = 80;
    if (dto.cpuUsagePercent > CPU_THRESHOLD) {
      const alert = await this.alertsService.createAlert(
        dto.machineName,
        'CPU',
        dto.cpuUsagePercent,
        CPU_THRESHOLD,
        AlertSeverity.CRITICAL,
        `High CPU usage detected on ${dto.machineName}: ${dto.cpuUsagePercent.toFixed(1)}%`,
      );
      // ارسال زنده هشدار روی WebSocket
      this.metricsGateway.sendNewAlert(alert);
    }

    const RAM_THRESHOLD = 85;
    if (dto.ramUsagePercent > RAM_THRESHOLD) {
      const alert = await this.alertsService.createAlert(
        dto.machineName,
        'RAM',
        dto.ramUsagePercent,
        RAM_THRESHOLD,
        AlertSeverity.WARNING,
        `High RAM usage detected on ${dto.machineName}: ${dto.ramUsagePercent.toFixed(1)}%`,
      );
      this.metricsGateway.sendNewAlert(alert);
    }

    if (dto.disks && Array.isArray(dto.disks)) {
      for (const disk of dto.disks) {
        if (disk.UsedPercent > 90) {
          const alert = await this.alertsService.createAlert(
            dto.machineName,
            `DISK (${disk.DriveName})`,
            disk.UsedPercent,
            90,
            AlertSeverity.CRITICAL,
            `Low disk space on drive ${disk.DriveName} (${dto.machineName}): ${disk.UsedPercent.toFixed(1)}% used`,
          );
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