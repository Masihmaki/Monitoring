import type { Alert, Metric } from '../types/monitoring';
import { METRICS_HISTORY_LIMIT } from '../config/app';
import { requestJson } from './http';

type FetchMetricsOptions = {
  machineName?: string | null;
  limit?: number;
};

export async function fetchMetrics(
  token: string,
  organizationId: string,
  options: FetchMetricsOptions = {},
): Promise<Metric[]> {
  const params = new URLSearchParams();
  if (options.machineName) {
    params.set('machineName', options.machineName);
  }
  params.set('limit', String(options.limit ?? METRICS_HISTORY_LIMIT));
  const path = `/metrics?${params.toString()}`;
  const data = await requestJson<Metric[]>(path, { token, organizationId });
  return Array.isArray(data) ? data : [];
}

export async function fetchHosts(
  token: string,
  organizationId: string,
): Promise<string[]> {
  const data = await requestJson<string[]>('/metrics/hosts', {
    token,
    organizationId,
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchAlerts(
  token: string,
  organizationId: string,
): Promise<Alert[]> {
  const data = await requestJson<Alert[]>('/alerts', { token, organizationId });
  return Array.isArray(data) ? data : [];
}

export async function updateAlertStatus(
  token: string,
  organizationId: string,
  alertId: string,
  status: Alert['status'],
): Promise<Alert> {
  return await requestJson<Alert>(`/alerts/${alertId}`, {
    token,
    organizationId,
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
