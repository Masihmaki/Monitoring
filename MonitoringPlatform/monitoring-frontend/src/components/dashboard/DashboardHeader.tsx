import { Activity, Copy, LogOut, RefreshCw } from 'lucide-react';
import { ui } from '../../styles/ui';

type DashboardHeaderProps = {
  email: string;
  loading: boolean;
  copied: boolean;
  onCopyApiKey: () => void;
  onRefresh: () => void;
  onLogout: () => void;
};

export function DashboardHeader({
  email,
  loading,
  copied,
  onCopyApiKey,
  onRefresh,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <header style={ui.header}>
      <div style={ui.brand}>
        <div style={ui.logoBox}>
          <Activity size={24} color="#6366f1" />
        </div>
        <div>
          <h1 style={ui.title}>داشبورد مرکز پایش سرور</h1>
          <p style={ui.subtitle}>{email} · نظارت لحظه‌ای منابع</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
