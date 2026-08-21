import type { Alert, Metric } from '../types/monitoring';
import { requestJson } from './http';

export async function fetchMetrics(
  token: string,
  organizationId: string,
): Promise<Metric[]> {
  const data = await requestJson<Metric[]>('/metrics', { token, organizationId });
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
