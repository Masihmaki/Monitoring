import { AlertSeverity } from '../alerts/entities/alert.entity';
import { ThresholdEvaluator } from './threshold-evaluator.service';

describe('ThresholdEvaluator', () => {
  const thresholds = {
    cpuThreshold: 80,
    ramThreshold: 85,
    diskThreshold: 90,
  };

  const evaluator = new ThresholdEvaluator();

  it('returns no violations below thresholds', () => {
    const violations = evaluator.evaluate(
      {
        machineName: 'web-1',
        cpuUsagePercent: 10,
        ramUsagePercent: 20,
        ramTotalMb: 8000,
        ramUsedMb: 1600,
        disks: [{ driveName: 'C:', totalGb: 100, freeGb: 50, usedPercent: 50 }],
      },
      thresholds,
    );
    expect(violations).toEqual([]);
  });

  it('detects CPU, RAM, and disk breaches', () => {
    const violations = evaluator.evaluate(
      {
        machineName: 'web-1',
        cpuUsagePercent: 91.2,
        ramUsagePercent: 90,
        ramTotalMb: 8000,
        ramUsedMb: 7200,
        disks: [{ driveName: 'C:', totalGb: 100, freeGb: 5, usedPercent: 95 }],
      },
      thresholds,
    );

    expect(violations.map((item) => item.metricName)).toEqual([
      'CPU',
      'RAM',
      'DISK (C:)',
    ]);
    expect(violations[0].severity).toBe(AlertSeverity.CRITICAL);
    expect(violations[1].severity).toBe(AlertSeverity.WARNING);
  });
});
