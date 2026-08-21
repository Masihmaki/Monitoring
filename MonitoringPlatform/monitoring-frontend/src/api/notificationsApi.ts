import type { TelegramSettings } from '../types/monitoring';
import { requestJson } from './http';

export async function fetchTelegramSettings(token: string): Promise<TelegramSettings> {
  return await requestJson<TelegramSettings>('/notifications/telegram', { token });
}

export async function saveTelegramChatId(
  token: string,
  chatId: string | null,
): Promise<TelegramSettings> {
  return await requestJson<TelegramSettings>('/notifications/telegram', {
    token,
    method: 'PATCH',
    body: JSON.stringify({ chatId }),
  });
}

export async function sendTelegramTest(token: string): Promise<void> {
  await requestJson<{ status: string }>('/notifications/telegram/test', {
    token,
    method: 'POST',
    body: JSON.stringify({}),
  });
}
