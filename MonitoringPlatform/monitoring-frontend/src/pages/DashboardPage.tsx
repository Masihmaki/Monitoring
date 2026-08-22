import { useCallback, useState } from 'react';
import { ActiveAlertsList } from '../components/dashboard/ActiveAlertsList';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { HostStatusBar } from '../components/dashboard/HostStatusBar';
import { DisksPanel } from '../components/dashboard/DisksPanel';
import { MetricCards } from '../components/dashboard/MetricCards';
import { ResourceChart } from '../components/dashboard/ResourceChart';
import { AlertThresholdsCard } from '../components/settings/AlertThresholdsCard';
import { MonitorsSection } from '../components/monitors/MonitorsSection';
import { TelegramSettingsCard } from '../components/notifications/TelegramSettingsCard';
import { OrganizationsSection } from '../components/organizations/OrganizationsSection';
import { useAlertThresholds } from '../hooks/useAlertThresholds';
import { useMonitoringFeed } from '../hooks/useMonitoringFeed';
import { useMonitors } from '../hooks/useMonitors';
import { useOrganizations } from '../hooks/useOrganizations';
import { useSelectedHost } from '../hooks/useSelectedHost';
import { useTelegramSettings } from '../hooks/useTelegramSettings';
import {
  activeAlerts,
  emptyMetric,
  filterAlertsByHost,
  fullestDisk,
  isAgentOnline,
  toChartData,
} from '../lib/metricView';
import { ui } from '../styles/ui';
import { DEFAULT_ALERT_THRESHOLDS } from '../config/app';
import { switchActiveOrganization, type Session } from '../auth/session';

type DashboardPageProps = {
  session: Session;
  onSessionChange: (session: Session) => void;
  onLogout: () => void;
};

export function DashboardPage({
  session,
  onSessionChange,
  onLogout,
}: DashboardPageProps) {
  const { hosts, selectedHost, setSelectedHost } = useSelectedHost(
    session,
    onLogout,
  );
  const { metrics, alerts, loading, refresh, setAlertStatus } = useMonitoringFeed(
    session,
    onLogout,
    selectedHost,
  );
  const {
    monitors,
    saving,
    error,
    refresh: refreshMonitors,
    addMonitor,
    removeMonitor,
  } = useMonitors(session, onLogout);
  const telegram = useTelegramSettings(session, onLogout);
  const alertThresholds = useAlertThresholds(session, onLogout);
  const organizations = useOrganizations(session, onSessionChange, onLogout);
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
  const liveAlerts = activeAlerts(filterAlertsByHost(alerts, selectedHost));
  const activeOrg = session.organizations.find(
    (org) => org.id === session.activeOrganizationId,
  );
  const isOwner = activeOrg?.role === 'OWNER';
  const thresholds = alertThresholds.thresholds ?? DEFAULT_ALERT_THRESHOLDS;

  return (
    <div style={ui.wrapper}>
      <DashboardHeader
        email={session.user.email}
        organizations={session.organizations}
        activeOrganizationId={session.activeOrganizationId}
        loading={loading}
        copied={copied}
        onCopyApiKey={copyApiKey}
        onRefresh={() => {
          void refresh();
          void refreshMonitors();
          void organizations.refreshMembers();
          void alertThresholds.refresh();
        }}
        onLogout={onLogout}
        onOrganizationChange={(organizationId) => {
          onSessionChange(switchActiveOrganization(session, organizationId));
        }}
      />
      <HostStatusBar
        hosts={hosts}
        selectedHost={selectedHost}
        isOnline={isAgentOnline(metrics)}
        onHostChange={setSelectedHost}
      />
      <MetricCards
        latest={latest}
        fullestDisk={fullestDisk(latest.disks)}
        activeAlertCount={liveAlerts.length}
        thresholds={thresholds}
      />
      <ResourceChart data={toChartData(metrics)} />
      <DisksPanel disks={latest.disks ?? []} diskThreshold={thresholds.diskThreshold} />
      <AlertThresholdsCard
        thresholds={alertThresholds.thresholds}
        isOwner={Boolean(isOwner)}
        saving={alertThresholds.saving}
        error={alertThresholds.error}
        notice={alertThresholds.notice}
        onSave={alertThresholds.save}
      />
      <MonitorsSection
        monitors={monitors}
        saving={saving}
        error={error}
        onAdd={addMonitor}
        onRemove={removeMonitor}
      />
      <OrganizationsSection
        isOwner={Boolean(isOwner)}
        members={organizations.members}
        saving={organizations.saving}
        error={organizations.error}
        notice={organizations.notice}
        onCreateOrg={organizations.createOrg}
        onInvite={organizations.invite}
        onRemove={organizations.remove}
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
      <ActiveAlertsList alerts={liveAlerts} onUpdateStatus={setAlertStatus} />
    </div>
  );
}
