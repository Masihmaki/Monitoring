import { AlertTriangle } from 'lucide-react';
import { ui } from '../../styles/ui';
import type { Alert } from '../../types/monitoring';

type ActiveAlertsListProps = {
  alerts: Alert[];
};

export function ActiveAlertsList({ alerts }: ActiveAlertsListProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div style={ui.alertSection}>
      <h2 style={{ ...ui.sectionTitle, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertTriangle size={20} /> هشدارهای بحرانی سیستم
      </h2>
      <div style={ui.alertGrid}>
        {alerts.slice(0, 4).map((alert) => (
          <div key={alert.id} style={ui.alertItem}>
            <div>
              <span style={ui.severityTag}>{alert.severity}</span>
              <p style={{ margin: '6px 0 0 0', fontWeight: 500 }}>{alert.message}</p>
            </div>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              {new Date(alert.createdAt).toLocaleTimeString('fa-IR')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
