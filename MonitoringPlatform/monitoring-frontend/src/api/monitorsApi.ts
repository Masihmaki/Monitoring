import type { CreateMonitorInput, Monitor } from '../types/monitoring';
import { requestJson } from './http';

export async function fetchMonitors(
  token: string,
  organizationId: string,
): Promise<Monitor[]> {
  const data = await requestJson<Monitor[]>('/monitors', { token, organizationId });
  return Array.isArray(data) ? data : [];
}

export async function createMonitor(
  token: string,
  organizationId: string,
  input: CreateMonitorInput,
): Promise<Monitor> {
  return await requestJson<Monitor>('/monitors', {
    token,
    organizationId,
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function deleteMonitor(
  token: string,
  organizationId: string,
  id: string,
): Promise<void> {
  await requestJson<{ status: string }>(`/monitors/${id}`, {
    token,
    organizationId,
    method: 'DELETE',
  });
}
