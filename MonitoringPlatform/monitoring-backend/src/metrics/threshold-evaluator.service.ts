import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AlertSeverity } from '../alerts/entities/alert.entity';
import { AppConfiguration } from '../config/configuration';
import { CreateMetricDto } from './dto/create-metric.dto';

export type ThresholdViolation = {
  metricName: string;
  currentValue: number;
  thresholdValue: number;
  severity: AlertSeverity;
  message: string;
};

@Injectable()
export class ThresholdEvaluator {
  constructor(private readonly configService: ConfigService) {}

  evaluate(dto: CreateMetricDto): ThresholdViolation[] {
    const alerts =
      this.configService.getOrThrow<AppConfiguration['alerts']>('alerts');
    const violations: ThresholdViolation[] = [];

    if (dto.cpuUsagePercent > alerts.cpuThreshold) {
      violations.push({
        metricName: 'CPU',
        currentValue: dto.cpuUsagePercent,
        thresholdValue: alerts.cpuThreshold,
        severity: AlertSeverity.CRITICAL,
        message: `High CPU usage detected on ${dto.machineName}: ${dto.cpuUsagePercent.toFixed(1)}%`,
      });
    }

    if (dto.ramUsagePercent > alerts.ramThreshold) {
      violations.push({
        metricName: 'RAM',
        currentValue: dto.ramUsagePercent,
        thresholdValue: alerts.ramThreshold,
        severity: AlertSeverity.WARNING,
        message: `High RAM usage detected on ${dto.machineName}: ${dto.ramUsagePercent.toFixed(1)}%`,
      });
    }

    for (const disk of dto.disks ?? []) {
      if (disk.usedPercent > alerts.diskThreshold) {
        violations.push({
          metricName: `DISK (${disk.driveName})`,
          currentValue: disk.usedPercent,
          thresholdValue: alerts.diskThreshold,
          severity: AlertSeverity.CRITICAL,
          message: `Low disk space on drive ${disk.driveName} (${dto.machineName}): ${disk.usedPercent.toFixed(1)}% used`,
        });
      }
    }

    return violations;
  }
}
