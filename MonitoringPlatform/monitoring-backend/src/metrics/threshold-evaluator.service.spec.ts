import { ConfigService } from '@nestjs/config';
import { AlertSeverity } from '../alerts/entities/alert.entity';
import { ThresholdEvaluator } from './threshold-evaluator.service';

describe('ThresholdEvaluator', () => {
  const configService = {
    getOrThrow: jest.fn().mockReturnValue({
      cpuThreshold: 80,
      ramThreshold: 85,
      diskThreshold: 90,
      cooldownMinutes: 5,
    }),
  } as unknown as ConfigService;

  const evaluator = new ThresholdEvaluator(configService);

  it('returns no violations below thresholds', () => {
    const violations = evaluator.evaluate({
      machineName: 'web-1',
      cpuUsagePercent: 10,
      ramUsagePercent: 20,
      ramTotalMb: 8000,
      ramUsedMb: 1600,
      disks: [{ driveName: 'C:', totalGb: 100, freeGb: 50, usedPercent: 50 }],
    });
    expect(violations).toEqual([]);
  });

  it('detects CPU, RAM, and disk breaches', () => {
    const violations = evaluator.evaluate({
      machineName: 'web-1',
      cpuUsagePercent: 91.2,
      ramUsagePercent: 90,
      ramTotalMb: 8000,
      ramUsedMb: 7200,
      disks: [{ driveName: 'C:', totalGb: 100, freeGb: 5, usedPercent: 95 }],
    });

    expect(violations.map((item) => item.metricName)).toEqual([
      'CPU',
      'RAM',
      'DISK (C:)',
    ]);
    expect(violations[0].severity).toBe(AlertSeverity.CRITICAL);
    expect(violations[1].severity).toBe(AlertSeverity.WARNING);
  });
});
