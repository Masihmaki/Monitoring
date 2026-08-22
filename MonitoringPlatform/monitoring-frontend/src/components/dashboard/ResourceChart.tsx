import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ui } from '../../styles/ui';
import type { ChartPoint } from '../../types/monitoring';

type ResourceChartProps = {
  data: ChartPoint[];
};

export function ResourceChart({ data }: ResourceChartProps) {
  return (
    <div style={ui.chartSection} className="panel-enter">
      <div style={{ marginBottom: '20px' }}>
        <h2 style={ui.sectionTitle}>نمودار لحظه‌ای مصرف منابع</h2>
        <p style={ui.sectionSubtitle}>
          CPU، RAM و بیشترین مصرف دیسک (درایو پر) بر حسب زمان دریافت متریک
        </p>
      </div>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f7a72" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0f7a72" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1d6f8a" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1d6f8a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="diskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#b7791f" stopOpacity={0.32} />
                <stop offset="95%" stopColor="#b7791f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,45,40,0.08)" vertical={false} />
            <XAxis dataKey="time" stroke="#5c7069" tickLine={false} style={{ fontSize: '12px' }} />
            <YAxis domain={[0, 100]} stroke="#5c7069" tickLine={false} style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: 'rgba(21,45,40,0.12)',
                borderRadius: '12px',
                color: '#15231f',
                fontFamily: 'Vazirmatn',
                boxShadow: '0 12px 30px rgba(21,45,40,0.12)',
              }}
            />
            <Area
              type="monotone"
              dataKey="CPU"
              stroke="#0f7a72"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#cpuGrad)"
            />
            <Area
              type="monotone"
              dataKey="RAM"
              stroke="#1d6f8a"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#ramGrad)"
            />
            <Area
              type="monotone"
              dataKey="Disk"
              stroke="#b7791f"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#diskGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
