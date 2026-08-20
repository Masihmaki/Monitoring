import { useState, type FormEvent } from 'react';
import { Globe, Plus, Trash2 } from 'lucide-react';
import { ui } from '../../styles/ui';
import type { Monitor, UptimeStatus } from '../../types/monitoring';

type MonitorsSectionProps = {
  monitors: Monitor[];
  saving: boolean;
  error: string;
  onAdd: (input: { url: string; name?: string; intervalSeconds: number }) => Promise<boolean>;
  onRemove: (id: string) => Promise<void>;
};

const INTERVALS = [
  { value: 30, label: 'هر ۳۰ ثانیه' },
  { value: 60, label: 'هر ۱ دقیقه' },
  { value: 120, label: 'هر ۲ دقیقه' },
  { value: 300, label: 'هر ۵ دقیقه' },
];

const STATUS_LABEL: Record<UptimeStatus, string> = {
  UP: 'در دسترس',
  DOWN: 'قطع',
  UNKNOWN: 'نامشخص',
};

const STATUS_COLOR: Record<UptimeStatus, string> = {
  UP: '#10b981',
  DOWN: '#ef4444',
  UNKNOWN: '#9ca3af',
};

export function MonitorsSection({
  monitors,
  saving,
  error,
  onAdd,
  onRemove,
}: MonitorsSectionProps) {
  const [url, setUrl] = useState('https://');
  const [name, setName] = useState('');
  const [intervalSeconds, setIntervalSeconds] = useState(60);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const ok = await onAdd({
      url: url.trim(),
      name: name.trim() || undefined,
      intervalSeconds,
    });
    if (ok) {
      setUrl('https://');
      setName('');
      setIntervalSeconds(60);
    }
  };

  return (
    <section style={ui.chartSection}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ ...ui.sectionTitle, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} color="#6366f1" /> پایش دسترس‌پذیری سایت
          </h2>
          <p style={ui.sectionSubtitle}>
            آدرس عمومی http/https را اضافه کنید؛ سامانه در بازه انتخابی آن را بررسی می‌کند
          </p>
        </div>
      </div>

      <form onSubmit={(event) => void submit(event)} style={ui.monitorForm}>
        <label style={ui.monitorLabel}>
          آدرس سایت
          <input
            dir="ltr"
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            style={ui.monitorInput}
          />
        </label>
        <label style={ui.monitorLabel}>
          نام نمایشی (اختیاری)
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="فروشگاه"
            style={ui.monitorInput}
            maxLength={80}
          />
        </label>
        <label style={ui.monitorLabel}>
          فاصله بررسی
          <select
            value={intervalSeconds}
            onChange={(event) => setIntervalSeconds(Number(event.target.value))}
            style={ui.monitorInput}
          >
            {INTERVALS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={saving} style={ui.monitorSubmit}>
          <Plus size={16} />
          {saving ? 'در حال بررسی...' : 'افزودن سایت'}
        </button>
      </form>

      {error ? <p style={{ color: '#ef4444', fontSize: '13px', margin: '12px 0 0' }}>{error}</p> : null}

      {monitors.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: '13px', margin: '18px 0 0' }}>
          هنوز سایتی برای پایش ثبت نشده است.
        </p>
      ) : (
        <div style={ui.monitorList}>
          {monitors.map((monitor) => (
            <MonitorRow key={monitor.id} monitor={monitor} onRemove={onRemove} />
          ))}
        </div>
      )}
    </section>
  );
}

function MonitorRow({
  monitor,
  onRemove,
}: {
  monitor: Monitor;
  onRemove: (id: string) => Promise<void>;
}) {
  const color = STATUS_COLOR[monitor.lastStatus];

  return (
    <div style={ui.monitorRow}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
          <strong>{monitor.name}</strong>
          <span style={{ color, fontSize: '12px', fontWeight: 700 }}>
            {STATUS_LABEL[monitor.lastStatus]}
          </span>
        </div>
        <p style={{ margin: '6px 0 0', color: '#9ca3af', fontSize: '12px', direction: 'ltr', textAlign: 'right' }}>
          {monitor.url}
        </p>
        <p style={{ margin: '6px 0 0', color: '#9ca3af', fontSize: '12px' }}>
          {monitor.lastLatencyMs != null ? `${monitor.lastLatencyMs}ms` : '—'}
          {' · '}
          {monitor.lastStatusCode != null ? `HTTP ${monitor.lastStatusCode}` : 'بدون پاسخ'}
          {' · '}
          {monitor.lastCheckedAt
            ? new Date(monitor.lastCheckedAt).toLocaleTimeString('fa-IR')
            : 'هنوز بررسی نشده'}
          {monitor.lastError ? ` · ${monitor.lastError}` : ''}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void onRemove(monitor.id)}
        style={ui.monitorDelete}
        title="حذف"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
