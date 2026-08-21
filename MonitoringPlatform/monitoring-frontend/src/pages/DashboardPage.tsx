import { useCallback, useState } from 'react';
import { ActiveAlertsList } from '../components/dashboard/ActiveAlertsList';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { HostStatusBar } from '../components/dashboard/HostStatusBar';
import { MetricCards } from '../components/dashboard/MetricCards';
import { ResourceChart } from '../components/dashboard/ResourceChart';
import { MonitorsSection } from '../components/monitors/MonitorsSection';
import { TelegramSettingsCard } from '../components/notifications/TelegramSettingsCard';
import { useMonitoringFeed } from '../hooks/useMonitoringFeed';
import { useMonitors } from '../hooks/useMonitors';
import { useTelegramSettings } from '../hooks/useTelegramSettings';
import {
  activeAlerts,
  emptyMetric,
  fullestDisk,
  isAgentOnline,
  toChartData,
} from '../lib/metricView';
import { ui } from '../styles/ui';
import type { Session } from '../auth/session';

type DashboardPageProps = {
  session: Session;
  onLogout: () => void;
};

export function DashboardPage({ session, onLogout }: DashboardPageProps) {
  const { metrics, alerts, loading, refresh } = useMonitoringFeed(session, onLogout);
  const {
    monitors,
    saving,
    error,
    refresh: refreshMonitors,
    addMonitor,
    removeMonitor,
  } = useMonitors(session, onLogout);
  const telegram = useTelegramSettings(session, onLogout);
  const [copied, setCopied] = useState(false);

  const copyApiKey = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(session.user.apiKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [session.user.apiKey]);

  const latest = metrics[0] ?? emptyMetric;
  const liveAlerts = activeAlerts(alerts);

  return (
    <div style={ui.wrapper}>
      <DashboardHeader
        email={session.user.email}
        loading={loading}
        copied={copied}
        onCopyApiKey={copyApiKey}
        onRefresh={() => {
          void refresh();
          void refreshMonitors();
        }}
        onLogout={onLogout}
      />
      <HostStatusBar machineName={latest.machineName} isOnline={isAgentOnline(metrics)} />
      <MetricCards
        latest={latest}
        fullestDisk={fullestDisk(latest.disks)}
        activeAlertCount={liveAlerts.length}
      />
      <ResourceChart data={toChartData(metrics)} />
      <MonitorsSection
        monitors={monitors}
        saving={saving}
        error={error}
        onAdd={addMonitor}
        onRemove={removeMonitor}
      />
      <TelegramSettingsCard
        settings={telegram.settings}
        saving={telegram.saving}
        testing={telegram.testing}
        error={telegram.error}
        notice={telegram.notice}
        onSave={telegram.saveChatId}
        onTest={telegram.sendTest}
      />
      <ActiveAlertsList alerts={liveAlerts} />
    </div>
  );
}
