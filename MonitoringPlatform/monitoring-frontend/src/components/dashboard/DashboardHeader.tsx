import { Activity, Copy, LogOut, RefreshCw } from 'lucide-react';
import { ui } from '../../styles/ui';
import type { OrganizationSummary } from '../../auth/session';

type DashboardHeaderProps = {
  email: string;
  organizations: OrganizationSummary[];
  activeOrganizationId: string;
  loading: boolean;
  copied: boolean;
  onCopyApiKey: () => void;
  onRefresh: () => void;
  onLogout: () => void;
  onOrganizationChange: (organizationId: string) => void;
};

export function DashboardHeader({
  email,
  organizations,
  activeOrganizationId,
  loading,
  copied,
  onCopyApiKey,
  onRefresh,
  onLogout,
  onOrganizationChange,
}: DashboardHeaderProps) {
  const active = organizations.find((org) => org.id === activeOrganizationId);

  return (
    <header style={ui.header}>
      <div style={ui.brand}>
        <div style={ui.logoBox}>
          <Activity size={24} color="#6366f1" />
        </div>
        <div>
          <h1 style={ui.title}>داشبورد مرکز پایش سرور</h1>
          <p style={ui.subtitle}>
            {email} · {active?.name ?? 'سازمان'} · نظارت لحظه‌ای منابع
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <select
          value={activeOrganizationId}
          onChange={(event) => onOrganizationChange(event.target.value)}
          style={{ ...ui.monitorInput, width: 'auto', minWidth: '160px' }}
          title="سازمان فعال"
        >
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
        <button onClick={onCopyApiKey} style={ui.refreshBtn} title="کلید ایجنت را در appsettings.json قرار دهید">
          <Copy size={16} />
          {copied ? 'کپی شد' : 'کلید ایجنت'}
        </button>
        <button onClick={onRefresh} style={ui.refreshBtn}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          بروزرسانی داده‌ها
        </button>
        <button onClick={onLogout} style={ui.refreshBtn}>
          <LogOut size={16} />
          خروج
        </button>
      </div>
    </header>
  );
}
