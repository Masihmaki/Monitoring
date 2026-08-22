import { Injectable } from '@nestjs/common';
import { AlertSeverity } from '../alerts/entities/alert.entity';
import { AlertThresholdValues } from '../organizations/alert-thresholds';
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
  evaluate(
    dto: CreateMetricDto,
    thresholds: AlertThresholdValues,
  ): ThresholdViolation[] {
    const violations: ThresholdViolation[] = [];

    if (dto.cpuUsagePercent > thresholds.cpuThreshold) {
      violations.push({
        metricName: 'CPU',
        currentValue: dto.cpuUsagePercent,
        thresholdValue: thresholds.cpuThreshold,
        severity: AlertSeverity.CRITICAL,
        message: `High CPU usage detected on ${dto.machineName}: ${dto.cpuUsagePercent.toFixed(1)}%`,
      });
    }

    if (dto.ramUsagePercent > thresholds.ramThreshold) {
      violations.push({
        metricName: 'RAM',
        currentValue: dto.ramUsagePercent,
        thresholdValue: thresholds.ramThreshold,
        severity: AlertSeverity.WARNING,
        message: `High RAM usage detected on ${dto.machineName}: ${dto.ramUsagePercent.toFixed(1)}%`,
      });
    }

    for (const disk of dto.disks ?? []) {
      if (disk.usedPercent > thresholds.diskThreshold) {
        violations.push({
          metricName: `DISK (${disk.driveName})`,
          currentValue: disk.usedPercent,
          thresholdValue: thresholds.diskThreshold,
          severity: AlertSeverity.CRITICAL,
          message: `Low disk space on drive ${disk.driveName} (${dto.machineName}): ${disk.usedPercent.toFixed(1)}% used`,
        });
      }
    }

    return violations;
  }
}
