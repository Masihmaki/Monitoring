import type { TelegramSettings } from '../types/monitoring';
import { requestJson } from './http';

export async function fetchTelegramSettings(
  token: string,
  organizationId: string,
): Promise<TelegramSettings> {
  return await requestJson<TelegramSettings>('/notifications/telegram', {
    token,
    organizationId,
  });
}

export async function saveTelegramChatId(
  token: string,
  organizationId: string,
  chatId: string | null,
): Promise<TelegramSettings> {
  return await requestJson<TelegramSettings>('/notifications/telegram', {
    token,
    organizationId,
    method: 'PATCH',
    body: JSON.stringify({ chatId }),
  });
}

export async function sendTelegramTest(
  token: string,
  organizationId: string,
): Promise<void> {
  await requestJson<{ status: string }>('/notifications/telegram/test', {
    token,
    organizationId,
    method: 'POST',
    body: JSON.stringify({}),
  });
}
