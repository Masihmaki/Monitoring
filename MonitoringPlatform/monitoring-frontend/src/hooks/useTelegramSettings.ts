import { useCallback, useEffect, useState } from 'react';
import { UnauthorizedError } from '../api/http';
import {
  fetchTelegramSettings,
  saveTelegramChatId,
  sendTelegramTest,
} from '../api/notificationsApi';
import type { Session } from '../auth/session';
import type { TelegramSettings } from '../types/monitoring';

type TelegramFeed = {
  settings: TelegramSettings | null;
  saving: boolean;
  testing: boolean;
  error: string;
  notice: string;
  saveChatId: (chatId: string | null) => Promise<boolean>;
  sendTest: () => Promise<void>;
};

export function useTelegramSettings(
  session: Session,
  onUnauthorized: () => void,
): TelegramFeed {
  const [settings, setSettings] = useState<TelegramSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      setSettings(await fetchTelegramSettings(session.accessToken));
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        onUnauthorized();
        return;
      }
      console.error('Error fetching Telegram settings:', err);
    }
  }, [session.accessToken, onUnauthorized]);

  const saveChatId = useCallback(
    async (chatId: string | null): Promise<boolean> => {
      setError('');
      setNotice('');
      setSaving(true);
      try {
        const next = await saveTelegramChatId(session.accessToken, chatId);
        setSettings(next);
        setNotice(chatId ? 'شناسه تلگرام ذخیره شد' : 'اتصال تلگرام قطع شد');
        return true;
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          onUnauthorized();
          return false;
        }
        setError(err instanceof Error ? err.message : 'ذخیره ناموفق بود');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [session.accessToken, onUnauthorized],
  );

  const sendTest = useCallback(async () => {
    setError('');
    setNotice('');
    setTesting(true);
    try {
      await sendTelegramTest(session.accessToken);
      setNotice('پیام آزمایشی ارسال شد');
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        onUnauthorized();
        return;
      }
      setError(err instanceof Error ? err.message : 'ارسال آزمایشی ناموفق بود');
    } finally {
      setTesting(false);
    }
  }, [session.accessToken, onUnauthorized]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    settings,
    saving,
    testing,
    error,
    notice,
    saveChatId,
    sendTest,
  };
}
