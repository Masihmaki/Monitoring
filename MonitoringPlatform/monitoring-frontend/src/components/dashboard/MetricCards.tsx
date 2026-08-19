import { AlertTriangle, Cpu, HardDrive, CpuIcon as Memory, ShieldCheck } from 'lucide-react';
import { ui } from '../../styles/ui';
import type { DiskMetric, Metric } from '../../types/monitoring';

type MetricCardsProps = {
  latest: Metric;
  fullestDisk?: DiskMetric;
  activeAlertCount: number;
};

export function MetricCards({ latest, fullestDisk, activeAlertCount }: MetricCardsProps) {
  return (
    <div style={ui.grid4}>
      <div style={ui.card}>
        <div style={ui.cardTop}>
          <span>بار پردازنده (CPU)</span>
          <div style={{ ...ui.iconBadge, backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
            <Cpu size={20} color="#6366f1" />
          </div>
        </div>
        <div style={ui.cardValGroup}>
          <span style={{ ...ui.cardNum, color: latest.cpuUsagePercent > 80 ? '#ef4444' : '#f3f4f6' }}>
            {latest.cpuUsagePercent.toFixed(1)}%
          </span>
        </div>
        <div style={ui.progressBg}>
          <div
            style={{
              ...ui.progressBar,
              width: `${Math.min(latest.cpuUsagePercent, 100)}%`,
              backgroundColor: latest.cpuUsagePercent > 80 ? '#ef4444' : '#6366f1',
            }}
          />
        </div>
      </div>

      <div style={ui.card}>
        <div style={ui.cardTop}>
          <span>حافظه اصلی (RAM)</span>
          <div style={{ ...ui.iconBadge, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <Memory size={20} color="#3b82f6" />
          </div>
        </div>
        <div style={ui.cardValGroup}>
          <span style={{ ...ui.cardNum, color: latest.ramUsagePercent > 85 ? '#ef4444' : '#f3f4f6' }}>
            {latest.ramUsagePercent.toFixed(1)}%
          </span>
          <span style={ui.subNum}>
            ({(latest.ramUsedMb / 1024).toFixed(1)} / {(latest.ramTotalMb / 1024).toFixed(1)} GB)
          </span>
        </div>
        <div style={ui.progressBg}>
          <div
            style={{
              ...ui.progressBar,
              width: `${Math.min(latest.ramUsagePercent, 100)}%`,
              backgroundColor: latest.ramUsagePercent > 85 ? '#ef4444' : '#3b82f6',
            }}
          />
        </div>
      </div>

      <div style={ui.card}>
        <div style={ui.cardTop}>
          <span>فضای ذخیره‌سازی</span>
          <div style={{ ...ui.iconBadge, backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
            <HardDrive size={20} color="#f59e0b" />
          </div>
        </div>
        <div style={ui.cardValGroup}>
          <span style={{ ...ui.cardNum, color: (fullestDisk?.usedPercent ?? 0) > 90 ? '#ef4444' : '#f3f4f6' }}>
            {fullestDisk ? `${fullestDisk.usedPercent.toFixed(1)}%` : '—'}
          </span>
          <span style={ui.subNum}>
            {fullestDisk ? fullestDisk.driveName : `${latest.disks?.length ?? 0} درایو`}
          </span>
        </div>
        <div style={ui.progressBg}>
          <div
            style={{
              ...ui.progressBar,
              width: `${Math.min(fullestDisk?.usedPercent ?? 0, 100)}%`,
              backgroundColor: (fullestDisk?.usedPercent ?? 0) > 90 ? '#ef4444' : '#f59e0b',
            }}
          />
        </div>
      </div>

      <div style={ui.card}>
        <div style={ui.cardTop}>
          <span>وضعیت هشدارهای سیستم</span>
          <div style={{ ...ui.iconBadge, backgroundColor: activeAlertCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }}>
            {activeAlertCount > 0 ? <AlertTriangle size={20} color="#ef4444" /> : <ShieldCheck size={20} color="#10b981" />}
          </div>
        </div>
        <div style={ui.cardValGroup}>
          <span style={{ ...ui.cardNum, color: activeAlertCount > 0 ? '#ef4444' : '#10b981' }}>
            {activeAlertCount}
          </span>
          <span style={ui.subNum}>هشدار فعال</span>
        </div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>
          {activeAlertCount === 0 ? 'هیچ خطایی ثبت نشده است' : 'نیازمند بررسی اپراتور'}
        </div>
      </div>
    </div>
  );
}
