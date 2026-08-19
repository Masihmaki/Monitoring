import React, { useEffect, useState } from 'react';
import { Cpu, HardDrive, CpuIcon as Memory, AlertTriangle, Activity, RefreshCw, Server, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { io } from 'socket.io-client';
import { ACTIVE_ALERT_MS, AGENT_STALE_MS, API_BASE_URL } from './config';

interface DiskMetric {
  driveName: string;
  totalGb: number;
  freeGb: number;
  usedPercent: number;
}

interface Metric {
  id: string;
  machineName: string;
  cpuUsagePercent: number;
  ramUsagePercent: number;
  ramTotalMb: number;
  ramUsedMb: number;
  disks: DiskMetric[];
  createdAt: string;
}

interface Alert {
  id: string;
  machineName: string;
  metricName: string;
  currentValue: number;
  thresholdValue: number;
  severity: string;
  message: string;
  createdAt: string;
}

export default function App() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resMetrics, resAlerts] = await Promise.all([
        fetch(`${API_BASE_URL}/metrics`),
        fetch(`${API_BASE_URL}/alerts`),
      ]);

      const dataMetrics = await resMetrics.json();
      const dataAlerts = await resAlerts.json();

      setMetrics(dataMetrics);
      setAlerts(dataAlerts);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ۱. دریافت اولیه تاریخچه داده‌ها
    fetchData();

    // ۲. ایجاد اتصال پایا روی WebSocket
    const socket = io(API_BASE_URL);

    socket.on('connect', () => {
      console.log('Connected to WebSocket server!');
    });

    // شنود زنده متریک‌های جدید
    socket.on('newMetric', (newMetric: Metric) => {
      setMetrics((prev) => [newMetric, ...prev.slice(0, 99)]);
    });

    // شنود زنده هشدارهای جدید
    socket.on('newAlert', (newAlert: Alert) => {
      setAlerts((prev) => [newAlert, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);
  
  const latest = metrics[0] || {
    machineName: 'نامشخص',
    cpuUsagePercent: 0,
    ramUsagePercent: 0,
    ramTotalMb: 0,
    ramUsedMb: 0,
    disks: [] as DiskMetric[],
    createdAt: '',
  };

  const isAgentOnline = Boolean(
    metrics[0]?.createdAt &&
      Date.now() - new Date(metrics[0].createdAt).getTime() < AGENT_STALE_MS,
  );

  const activeAlerts = alerts.filter(
    (alert) => Date.now() - new Date(alert.createdAt).getTime() < ACTIVE_ALERT_MS,
  );

  const fullestDisk = [...(latest.disks ?? [])].sort(
    (a, b) => (b.usedPercent ?? 0) - (a.usedPercent ?? 0),
  )[0];

  const chartData = [...metrics].reverse().map((m) => ({
    time: new Date(m.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    CPU: parseFloat(m.cpuUsagePercent.toFixed(1)),
    RAM: parseFloat(m.ramUsagePercent.toFixed(1)),
  }));

  return (
    <div style={ui.wrapper}>
      {/* هدر بالایی */}
      <header style={ui.header}>
        <div style={ui.brand}>
          <div style={ui.logoBox}>
            <Activity size={24} color="#6366f1" />
          </div>
          <div>
            <h1 style={ui.title}>داشبورد مرکز پایش سرور</h1>
            <p style={ui.subtitle}>زیرساخت نظارت بر منابع به‌صورت لحظه‌ای (Real-time)</p>
          </div>
        </div>

        <button onClick={fetchData} style={ui.refreshBtn}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          بروزرسانی داده‌ها
        </button>
      </header>

      {/* بار وضعیت سرور */}
      <div style={ui.statusStrip}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Server size={18} color="#9ca3af" />
          <span style={{ color: '#9ca3af' }}>سرور هدف:</span>
          <strong style={{ color: '#fff', fontSize: '15px' }}>{latest.machineName}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={isAgentOnline ? 'online-dot' : 'offline-dot'}></span>
          <span style={{ color: isAgentOnline ? '#10b981' : '#ef4444', fontSize: '13px', fontWeight: 600 }}>
            {isAgentOnline ? 'پایدار / در حال ارسال داده' : 'قطع ارتباط با ایجنت'}
          </span>
        </div>
      </div>

      {/* کارت‌های آماری */}
      <div style={ui.grid4}>
        {/* پردازنده */}
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
            <div style={{ ...ui.progressBar, width: `${Math.min(latest.cpuUsagePercent, 100)}%`, backgroundColor: latest.cpuUsagePercent > 80 ? '#ef4444' : '#6366f1' }} />
          </div>
        </div>

        {/* حافظه */}
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
            <div style={{ ...ui.progressBar, width: `${Math.min(latest.ramUsagePercent, 100)}%`, backgroundColor: latest.ramUsagePercent > 85 ? '#ef4444' : '#3b82f6' }} />
          </div>
        </div>

        {/* دیسک‌ها */}
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

        {/* سلامت سیستم */}
        <div style={ui.card}>
          <div style={ui.cardTop}>
            <span>وضعیت هشدارهای سیستم</span>
            <div style={{ ...ui.iconBadge, backgroundColor: activeAlerts.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }}>
              {activeAlerts.length > 0 ? <AlertTriangle size={20} color="#ef4444" /> : <ShieldCheck size={20} color="#10b981" />}
            </div>
          </div>
          <div style={ui.cardValGroup}>
            <span style={{ ...ui.cardNum, color: activeAlerts.length > 0 ? '#ef4444' : '#10b981' }}>
              {activeAlerts.length}
            </span>
            <span style={ui.subNum}>هشدار فعال</span>
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>
            {activeAlerts.length === 0 ? 'هیچ خطایی ثبت نشده است' : 'نیازمند بررسی اپراتور'}
          </div>
        </div>
      </div>

      {/* بخش نمودار زنده */}
      <div style={ui.chartSection}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={ui.sectionTitle}>نمودار لحظه‌ای مصرف منابع (CPU vs RAM)</h2>
          <p style={ui.sectionSubtitle}>تغییرات متریک‌ها بر حسب زمان ثبت در دیتابیس</p>
        </div>

        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#232d3f" vertical={false} />
              <XAxis dataKey="time" stroke="#6b7280" tickLine={false} style={{ fontSize: '12px' }} />
              <YAxis domain={[0, 100]} stroke="#6b7280" tickLine={false} style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#151c28', borderColor: '#232d3f', borderRadius: '8px', color: '#fff', fontFamily: 'Vazirmatn' }} 
              />
              <Area type="monotone" dataKey="CPU" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#cpuGrad)" />
              <Area type="monotone" dataKey="RAM" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#ramGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* بخش هشدارها */}
      {activeAlerts.length > 0 && (
        <div style={ui.alertSection}>
          <h2 style={{ ...ui.sectionTitle, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} /> هشدارهای بحرانی سیستم
          </h2>
          <div style={ui.alertGrid}>
            {activeAlerts.slice(0, 4).map((a) => (
              <div key={a.id} style={ui.alertItem}>
                <div>
                  <span style={ui.severityTag}>{a.severity}</span>
                  <p style={{ margin: '6px 0 0 0', fontWeight: 500 }}>{a.message}</p>
                </div>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {new Date(a.createdAt).toLocaleTimeString('fa-IR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// استایل‌های جدید
const ui: { [key: string]: React.CSSProperties } = {
  wrapper: {
    maxWidth: '1300px',
    margin: '0 auto',
    padding: '32px 20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logoBox: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#151c28',
    border: '1px solid #232d3f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#9ca3af',
    margin: '4px 0 0 0',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#151c28',
    color: '#f3f4f6',
    border: '1px solid #232d3f',
    padding: '10px 18px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'Vazirmatn',
    fontWeight: 500,
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  statusStrip: {
    backgroundColor: '#151c28',
    border: '1px solid #232d3f',
    borderRadius: '12px',
    padding: '12px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
  },
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '20px',
    marginBottom: '28px',
  },
  card: {
    backgroundColor: '#151c28',
    border: '1px solid #232d3f',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#9ca3af',
    fontSize: '14px',
    fontWeight: 500,
  },
  iconBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardValGroup: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    marginTop: '16px',
  },
  cardNum: {
    fontSize: '32px',
    fontWeight: 700,
  },
  subNum: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  progressBg: {
    height: '6px',
    backgroundColor: '#232d3f',
    borderRadius: '10px',
    marginTop: '16px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: '10px',
    transition: 'width 0.4s ease',
  },
  chartSection: {
    backgroundColor: '#151c28',
    border: '1px solid #232d3f',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '28px',
  },
  sectionTitle: {
    fontSize: '17px',
    fontWeight: 700,
    margin: 0,
  },
  sectionSubtitle: {
    fontSize: '13px',
    color: '#9ca3af',
    margin: '4px 0 0 0',
  },
  alertSection: {
    backgroundColor: '#151c28',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '16px',
    padding: '24px',
  },
  alertGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '12px',
    marginTop: '16px',
  },
  alertItem: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRight: '4px solid #ef4444',
    padding: '14px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  severityTag: {
    backgroundColor: '#ef4444',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '4px',
  },
};