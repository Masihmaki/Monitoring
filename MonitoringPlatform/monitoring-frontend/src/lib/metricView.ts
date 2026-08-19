import { ACTIVE_ALERT_MS, AGENT_STALE_MS } from '../config/app';
import type { Alert, ChartPoint, DiskMetric, Metric } from '../types/monitoring';

export const emptyMetric: Metric = {
  id: '',
  machineName: 'نامشخص',
  cpuUsagePercent: 0,
  ramUsagePercent: 0,
  ramTotalMb: 0,
  ramUsedMb: 0,
  disks: [],
  createdAt: '',
};

export function isAgentOnline(metrics: Metric[]): boolean {
  const latest = metrics[0]?.createdAt;
  if (!latest) {
    return false;
  }
  return Date.now() - new Date(latest).getTime() < AGENT_STALE_MS;
}

export function activeAlerts(alerts: Alert[]): Alert[] {
  return alerts.filter(
    (alert) => Date.now() - new Date(alert.createdAt).getTime() < ACTIVE_ALERT_MS,
  );
}

export function fullestDisk(disks: DiskMetric[]): DiskMetric | undefined {
  return [...(disks ?? [])].sort(
    (a, b) => (b.usedPercent ?? 0) - (a.usedPercent ?? 0),
  )[0];
}

export function toChartData(metrics: Metric[]): ChartPoint[] {
  return [...metrics].reverse().map((metric) => ({
    time: new Date(metric.createdAt).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    CPU: parseFloat(metric.cpuUsagePercent.toFixed(1)),
    RAM: parseFloat(metric.ramUsagePercent.toFixed(1)),
  }));
}
