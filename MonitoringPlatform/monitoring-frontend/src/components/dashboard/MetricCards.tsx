import { AlertTriangle, Cpu, HardDrive, CpuIcon as Memory, ShieldCheck } from 'lucide-react';
import { ui } from '../../styles/ui';
import type { AlertThresholds, DiskMetric, Metric } from '../../types/monitoring';

type MetricCardsProps = {
  latest: Metric;
  fullestDisk?: DiskMetric;
  activeAlertCount: number;
  thresholds: AlertThresholds;
};

export function MetricCards({
  latest,
  fullestDisk,
  activeAlertCount,
  thresholds,
}: MetricCardsProps) {
  return (
    <div style={ui.grid4} className="panel-enter">
      <div style={ui.card}>
        <div style={ui.cardTop}>
          <span>بار پردازنده (CPU)</span>
          <div style={{ ...ui.iconBadge, backgroundColor: 'var(--primary-soft)' }}>
            <Cpu size={20} color="var(--accent-cpu)" />
          </div>
        </div>
        <div style={ui.cardValGroup}>
          <span
            style={{
              ...ui.cardNum,
              color: latest.cpuUsagePercent > thresholds.cpuThreshold ? 'var(--danger)' : 'var(--text-main)',
            }}
          >
            {latest.cpuUsagePercent.toFixed(1)}%
          </span>
        </div>
        <div style={ui.progressBg}>
          <div
            style={{
              ...ui.progressBar,
              width: `${Math.min(latest.cpuUsagePercent, 100)}%`,
              backgroundColor:
                latest.cpuUsagePercent > thresholds.cpuThreshold ? 'var(--danger)' : 'var(--accent-cpu)',
            }}
          />
        </div>
      </div>

      <div style={ui.card}>
        <div style={ui.cardTop}>
          <span>حافظه اصلی (RAM)</span>
          <div style={{ ...ui.iconBadge, backgroundColor: 'rgba(29, 111, 138, 0.12)' }}>
            <Memory size={20} color="var(--accent-ram)" />
          </div>
        </div>
        <div style={ui.cardValGroup}>
          <span
            style={{
              ...ui.cardNum,
              color: latest.ramUsagePercent > thresholds.ramThreshold ? 'var(--danger)' : 'var(--text-main)',
            }}
          >
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
              backgroundColor:
                latest.ramUsagePercent > thresholds.ramThreshold ? 'var(--danger)' : 'var(--accent-ram)',
            }}
          />
        </div>
      </div>

      <div style={ui.card}>
        <div style={ui.cardTop}>
          <span>فضای ذخیره‌سازی</span>
          <div style={{ ...ui.iconBadge, backgroundColor: 'rgba(183, 121, 31, 0.12)' }}>
            <HardDrive size={20} color="var(--accent-disk)" />
          </div>
        </div>
        <div style={ui.cardValGroup}>
          <span
            style={{
              ...ui.cardNum,
              color: (fullestDisk?.usedPercent ?? 0) > thresholds.diskThreshold ? 'var(--danger)' : 'var(--text-main)',
            }}
          >
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
              backgroundColor:
                (fullestDisk?.usedPercent ?? 0) > thresholds.diskThreshold ? 'var(--danger)' : 'var(--accent-disk)',
            }}
          />
        </div>
      </div>

      <div style={ui.card}>
        <div style={ui.cardTop}>
          <span>وضعیت هشدارهای سیستم</span>
          <div
            style={{
              ...ui.iconBadge,
              backgroundColor:
                activeAlertCount > 0 ? 'rgba(194, 59, 59, 0.12)' : 'rgba(31, 138, 91, 0.12)',
            }}
          >
            {activeAlertCount > 0 ? (
              <AlertTriangle size={20} color="var(--danger)" />
            ) : (
              <ShieldCheck size={20} color="var(--success)" />
            )}
          </div>
        </div>
        <div style={ui.cardValGroup}>
          <span
            style={{
              ...ui.cardNum,
              color: activeAlertCount > 0 ? 'var(--danger)' : 'var(--success)',
            }}
          >
            {activeAlertCount}
          </span>
          <span style={ui.subNum}>هشدار فعال</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
          {activeAlertCount === 0 ? 'همه‌چیز پایدار است' : 'نیازمند بررسی اپراتور'}
        </div>
      </div>
    </div>
  );
}
