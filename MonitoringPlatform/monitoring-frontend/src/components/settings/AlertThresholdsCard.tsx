import { useEffect, useState, type FormEvent } from 'react';
import { Gauge } from 'lucide-react';
import { ui } from '../../styles/ui';
import type { AlertThresholds } from '../../types/monitoring';

type AlertThresholdsCardProps = {
  thresholds: AlertThresholds | null;
  isOwner: boolean;
  saving: boolean;
  error: string;
  notice: string;
  onSave: (values: Pick<
    AlertThresholds,
    'cpuThreshold' | 'ramThreshold' | 'diskThreshold'
  >) => Promise<boolean>;
};

export function AlertThresholdsCard({
  thresholds,
  isOwner,
  saving,
  error,
  notice,
  onSave,
}: AlertThresholdsCardProps) {
  const [cpuThreshold, setCpuThreshold] = useState('80');
  const [ramThreshold, setRamThreshold] = useState('85');
  const [diskThreshold, setDiskThreshold] = useState('90');

  useEffect(() => {
    if (!thresholds) {
      return;
    }
    setCpuThreshold(String(thresholds.cpuThreshold));
    setRamThreshold(String(thresholds.ramThreshold));
    setDiskThreshold(String(thresholds.diskThreshold));
  }, [thresholds]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await onSave({
      cpuThreshold: Number(cpuThreshold),
      ramThreshold: Number(ramThreshold),
      diskThreshold: Number(diskThreshold),
    });
  };

  return (
    <section style={ui.chartSection}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            ...ui.iconBadge,
            backgroundColor: 'rgba(15, 122, 114, 0.12)',
          }}
        >
          <Gauge size={18} color="var(--primary)" />
        </div>
        <div>
          <h2 style={ui.sectionTitle}>آستانه‌های هشدار</h2>
          <p style={ui.sectionSubtitle}>
            محدودیت CPU، RAM و دیسک برای ایجاد هشدار در سطح سازمان فعال
          </p>
        </div>
      </div>

      {!isOwner ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '14px 0 0' }}>
          فقط مالک سازمان می‌تواند آستانه‌ها را تغییر دهد.
        </p>
      ) : null}

      <form onSubmit={(event) => void submit(event)} style={ui.monitorForm}>
        <label style={ui.monitorLabel}>
          CPU (%)
          <input
            type="number"
            min={1}
            max={100}
            step={1}
            dir="ltr"
            value={cpuThreshold}
            onChange={(event) => setCpuThreshold(event.target.value)}
            disabled={!isOwner || saving}
            style={ui.monitorInput}
          />
        </label>
        <label style={ui.monitorLabel}>
          RAM (%)
          <input
            type="number"
            min={1}
            max={100}
            step={1}
            dir="ltr"
            value={ramThreshold}
            onChange={(event) => setRamThreshold(event.target.value)}
            disabled={!isOwner || saving}
            style={ui.monitorInput}
          />
        </label>
        <label style={ui.monitorLabel}>
          Disk (%)
          <input
            type="number"
            min={1}
            max={100}
            step={1}
            dir="ltr"
            value={diskThreshold}
            onChange={(event) => setDiskThreshold(event.target.value)}
            disabled={!isOwner || saving}
            style={ui.monitorInput}
          />
        </label>
        <button
          type="submit"
          disabled={!isOwner || saving || !thresholds}
          style={ui.monitorSubmit}
        >
          {saving ? 'در حال ذخیره...' : 'ذخیره آستانه‌ها'}
        </button>
      </form>

      {thresholds && !thresholds.customized ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '12px 0 0' }}>
          مقادیر فعلی از پیش‌فرض سرور استفاده می‌کنند تا زمانی که ذخیره کنید.
        </p>
      ) : null}

      {notice ? (
        <p style={{ color: '#10b981', fontSize: '13px', margin: '12px 0 0' }}>{notice}</p>
      ) : null}
      {error ? (
        <p style={{ color: '#ef4444', fontSize: '13px', margin: '12px 0 0' }}>{error}</p>
      ) : null}
    </section>
  );
}
