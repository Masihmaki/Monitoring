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
  message: string;
  createdAt: string;
};

export type ChartPoint = {
  time: string;
  CPU: number;
  RAM: number;
};
