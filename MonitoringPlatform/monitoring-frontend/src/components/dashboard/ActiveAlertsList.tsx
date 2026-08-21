import { AlertTriangle, Check, CheckCheck } from 'lucide-react';
import { ui } from '../../styles/ui';
import type { Alert } from '../../types/monitoring';

type ActiveAlertsListProps = {
  alerts: Alert[];
  onUpdateStatus: (alertId: string, status: Alert['status']) => Promise<void>;
};

export function ActiveAlertsList({ alerts, onUpdateStatus }: ActiveAlertsListProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div style={ui.alertSection}>
      <h2 style={{ ...ui.sectionTitle, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertTriangle size={20} /> هشدارهای فعال سیستم
      </h2>
      <div style={ui.alertGrid}>
        {alerts.slice(0, 6).map((alert) => (
          <div key={alert.id} style={ui.alertItem}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={ui.severityTag}>{alert.severity}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {alert.status === 'OPEN'
                    ? 'باز'
                    : alert.status === 'ACKNOWLEDGED'
                      ? 'مشاهده‌شده'
                      : 'بسته'}
                </span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontWeight: 500 }}>{alert.message}</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                {alert.status === 'OPEN' ? (
                  <button
                    type="button"
                    onClick={() => void onUpdateStatus(alert.id, 'ACKNOWLEDGED')}
                    style={ui.alertAction}
                  >
                    <Check size={14} /> تأیید مشاهده
                  </button>
                ) : null}
                {alert.status !== 'RESOLVED' ? (
                  <button
                    type="button"
                    onClick={() => void onUpdateStatus(alert.id, 'RESOLVED')}
                    style={ui.alertAction}
                  >
                    <CheckCheck size={14} /> حل شد
                  </button>
                ) : null}
              </div>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {new Date(alert.createdAt).toLocaleTimeString('fa-IR')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
