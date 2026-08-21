import { useEffect, useState, type FormEvent } from 'react';
import { Send, Unplug } from 'lucide-react';
import { ui } from '../../styles/ui';
import type { TelegramSettings } from '../../types/monitoring';

type TelegramSettingsCardProps = {
  settings: TelegramSettings | null;
  saving: boolean;
  testing: boolean;
  error: string;
  notice: string;
  onSave: (chatId: string | null) => Promise<boolean>;
  onTest: () => Promise<void>;
};

export function TelegramSettingsCard({
  settings,
  saving,
  testing,
  error,
  notice,
  onSave,
  onTest,
}: TelegramSettingsCardProps) {
  const [chatId, setChatId] = useState('');

  useEffect(() => {
    setChatId(settings?.chatId ?? '');
  }, [settings?.chatId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onSave(chatId.trim() || null);
  };

  return (
    <section style={ui.chartSection}>
      <h2 style={ui.sectionTitle}>اعلان تلگرام</h2>
      <p style={ui.sectionSubtitle}>
        هشدارهای CPU، رم، دیسک و قطع سایت به چت تلگرام شما فرستاده می‌شود
      </p>

      <ol style={{ margin: '14px 0 0', paddingRight: '18px', color: '#9ca3af', fontSize: '13px', lineHeight: 1.8 }}>
        <li>در @BotFather یک ربات بسازید و توکن را در TELEGRAM_BOT_TOKEN سرور قرار دهید.</li>
        <li>با همان ربات یک گفتگو را Start کنید.</li>
        <li>شناسه عددی چت را از @userinfobot بگیرید و ذخیره کنید.</li>
      </ol>

      {settings && !settings.botConfigured ? (
        <p style={{ color: '#f59e0b', fontSize: '13px', margin: '12px 0 0' }}>
          توکن ربات روی سرور تنظیم نشده؛ تا وقتی TELEGRAM_BOT_TOKEN خالی باشد پیامی ارسال نمی‌شود.
        </p>
      ) : null}

      <form onSubmit={(event) => void submit(event)} style={ui.monitorForm}>
        <label style={ui.monitorLabel}>
          Chat ID
          <input
            dir="ltr"
            value={chatId}
            onChange={(event) => setChatId(event.target.value)}
            placeholder="123456789"
            style={ui.monitorInput}
          />
        </label>
        <button type="submit" disabled={saving} style={ui.monitorSubmit}>
          {saving ? 'در حال ذخیره...' : 'ذخیره شناسه'}
        </button>
        <button
          type="button"
          disabled={testing || !settings?.chatId}
          onClick={() => void onTest()}
          style={ui.monitorSubmit}
        >
          <Send size={16} />
          {testing ? 'در حال ارسال...' : 'پیام آزمایشی'}
        </button>
        {settings?.chatId ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => void onSave(null)}
            style={{ ...ui.monitorSubmit, backgroundColor: 'transparent', color: '#9ca3af', border: '1px solid #232d3f' }}
          >
            <Unplug size={16} />
            قطع اتصال
          </button>
        ) : null}
      </form>

      {notice ? <p style={{ color: '#10b981', fontSize: '13px', margin: '12px 0 0' }}>{notice}</p> : null}
      {error ? <p style={{ color: '#ef4444', fontSize: '13px', margin: '12px 0 0' }}>{error}</p> : null}
    </section>
  );
}
