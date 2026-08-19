import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ui } from '../../styles/ui';
import type { ChartPoint } from '../../types/monitoring';

type ResourceChartProps = {
  data: ChartPoint[];
};

export function ResourceChart({ data }: ResourceChartProps) {
  return (
    <div style={ui.chartSection}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={ui.sectionTitle}>نمودار لحظه‌ای مصرف منابع (CPU vs RAM)</h2>
        <p style={ui.sectionSubtitle}>تغییرات متریک‌ها بر حسب زمان ثبت در دیتابیس</p>
      </div>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#232d3f" vertical={false} />
            <XAxis dataKey="time" stroke="#6b7280" tickLine={false} style={{ fontSize: '12px' }} />
            <YAxis domain={[0, 100]} stroke="#6b7280" tickLine={false} style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#151c28',
                borderColor: '#232d3f',
                borderRadius: '8px',
                color: '#fff',
                fontFamily: 'Vazirmatn',
              }}
            />
            <Area type="monotone" dataKey="CPU" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#cpuGrad)" />
            <Area type="monotone" dataKey="RAM" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#ramGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
