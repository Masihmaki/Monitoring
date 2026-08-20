import type { CreateMonitorInput, Monitor } from '../types/monitoring';
import { requestJson } from './http';

export async function fetchMonitors(token: string): Promise<Monitor[]> {
  const data = await requestJson<Monitor[]>('/monitors', { token });
  return Array.isArray(data) ? data : [];
}

export async function createMonitor(
  token: string,
  input: CreateMonitorInput,
): Promise<Monitor> {
  return await requestJson<Monitor>('/monitors', {
    token,
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function deleteMonitor(token: string, id: string): Promise<void> {
  await requestJson<{ status: string }>(`/monitors/${id}`, {
    token,
    method: 'DELETE',
  });
}
