import { HardDrive } from 'lucide-react';
import { sortDisksByUsage } from '../../lib/metricView';
import { ui } from '../../styles/ui';
import type { DiskMetric } from '../../types/monitoring';

type DisksPanelProps = {
  disks: DiskMetric[];
};

export function DisksPanel({ disks }: DisksPanelProps) {
  const rows = sortDisksByUsage(disks);

  return (
    <div style={ui.chartSection} className="panel-enter">
      <div style={{ marginBottom: '20px' }}>
        <h2 style={ui.sectionTitle}>وضعیت درایوها</h2>
        <p style={ui.sectionSubtitle}>
          لیست همه درایوهای ثبت‌شده از آخرین متریک ایجنت
        </p>
      </div>

      {rows.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
          هنوز اطلاعات دیسکی از این سرور دریافت نشده است.
        </p>
      ) : (
        <div style={ui.diskList}>
          {rows.map((disk) => {
            const usedGb = Math.max(disk.totalGb - disk.freeGb, 0);
            const isCritical = disk.usedPercent > 90;

            return (
              <div key={disk.driveName} style={ui.diskRow}>
                <div style={ui.diskRowTop}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        ...ui.iconBadge,
                        backgroundColor: 'rgba(183, 121, 31, 0.12)',
                      }}
                    >
                      <HardDrive size={18} color="var(--accent-disk)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {disk.driveName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {usedGb.toFixed(1)} / {disk.totalGb.toFixed(1)} GB ·{' '}
                        {disk.freeGb.toFixed(1)} GB آزاد
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '24px',
                      fontWeight: 800,
                      color: isCritical ? 'var(--danger)' : 'var(--text-main)',
                    }}
                  >
                    {disk.usedPercent.toFixed(1)}%
                  </span>
                </div>
                <div style={ui.progressBg}>
                  <div
                    style={{
                      ...ui.progressBar,
                      width: `${Math.min(disk.usedPercent, 100)}%`,
                      backgroundColor: isCritical ? 'var(--danger)' : 'var(--accent-disk)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
