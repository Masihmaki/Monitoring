import { Server } from 'lucide-react';
import { ui } from '../../styles/ui';

type HostStatusBarProps = {
  hosts: string[];
  selectedHost: string | null;
  isOnline: boolean;
  onHostChange: (host: string | null) => void;
};

export function HostStatusBar({
  hosts,
  selectedHost,
  isOnline,
  onHostChange,
}: HostStatusBarProps) {
  return (
    <div style={ui.statusStrip} className="panel-enter">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <Server size={18} color="var(--text-muted)" />
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>سرور هدف:</span>
        {hosts.length === 0 ? (
          <strong style={{ color: 'var(--text-main)', fontSize: '15px' }}>نامشخص</strong>
        ) : hosts.length === 1 ? (
          <strong style={{ color: 'var(--text-main)', fontSize: '15px' }}>{hosts[0]}</strong>
        ) : (
          <select
            value={selectedHost ?? ''}
            onChange={(event) => onHostChange(event.target.value || null)}
            style={{ ...ui.monitorInput, width: 'auto', minWidth: '180px', borderRadius: '999px' }}
            title="انتخاب سرور"
          >
            {hosts.map((host) => (
              <option key={host} value={host}>
                {host}
              </option>
            ))}
          </select>
        )}
        {hosts.length > 1 ? (
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
            {hosts.length} سرور
          </span>
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className={isOnline ? 'online-dot' : 'offline-dot'}></span>
        <span
          style={{
            color: isOnline ? 'var(--success)' : 'var(--danger)',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          {isOnline ? 'پایدار / در حال ارسال داده' : 'قطع ارتباط با ایجنت'}
        </span>
      </div>
    </div>
  );
}
