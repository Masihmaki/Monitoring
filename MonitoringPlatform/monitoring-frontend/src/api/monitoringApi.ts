import type { Alert, Metric } from '../types/monitoring';
import { requestJson } from './http';

export async function fetchMetrics(token: string): Promise<Metric[]> {
  const data = await requestJson<Metric[]>('/metrics', { token });
  return Array.isArray(data) ? data : [];
}

export async function fetchAlerts(token: string): Promise<Alert[]> {
  const data = await requestJson<Alert[]>('/alerts', { token });
  return Array.isArray(data) ? data : [];
}
