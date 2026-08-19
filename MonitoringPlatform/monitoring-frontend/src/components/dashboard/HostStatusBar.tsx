import { Server } from 'lucide-react';
import { ui } from '../../styles/ui';

type HostStatusBarProps = {
  machineName: string;
  isOnline: boolean;
};

export function HostStatusBar({ machineName, isOnline }: HostStatusBarProps) {
  return (
    <div style={ui.statusStrip}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Server size={18} color="#9ca3af" />
        <span style={{ color: '#9ca3af' }}>سرور هدف:</span>
        <strong style={{ color: '#fff', fontSize: '15px' }}>{machineName}</strong>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className={isOnline ? 'online-dot' : 'offline-dot'}></span>
        <span style={{ color: isOnline ? '#10b981' : '#ef4444', fontSize: '13px', fontWeight: 600 }}>
          {isOnline ? 'پایدار / در حال ارسال داده' : 'قطع ارتباط با ایجنت'}
        </span>
      </div>
    </div>
  );
}
