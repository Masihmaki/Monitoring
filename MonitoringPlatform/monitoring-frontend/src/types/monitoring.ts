export type DiskMetric = {
  driveName: string;
  totalGb: number;
  freeGb: number;
  usedPercent: number;
};

export type Metric = {
  id: string;
  machineName: string;
  cpuUsagePercent: number;
  ramUsagePercent: number;
  ramTotalMb: number;
  ramUsedMb: number;
  disks: DiskMetric[];
  createdAt: string;
};

export type Alert = {
  id: string;
  machineName: string;
  metricName: string;
  currentValue: number;
  thresholdValue: number;
  severity: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  message: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

export type ChartPoint = {
  time: string;
  CPU: number;
  RAM: number;
  Disk: number;
};

export type UptimeStatus = 'UNKNOWN' | 'UP' | 'DOWN';

export type Monitor = {
  id: string;
  name: string;
  url: string;
  intervalSeconds: number;
  isEnabled: boolean;
  lastStatus: UptimeStatus;
  lastStatusCode: number | null;
  lastLatencyMs: number | null;
  lastCheckedAt: string | null;
  lastError: string | null;
  createdAt: string;
  uptimePercent: number | null;
  checkCount: number;
};

export type CreateMonitorInput = {
  url: string;
  name?: string;
  intervalSeconds?: number;
};

export type TelegramSettings = {
  botConfigured: boolean;
  chatId: string | null;
};
