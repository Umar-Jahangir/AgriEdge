import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { cn } from '../../utils/cn';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function ChartCard({ title, subtitle, children, className, action }: ChartCardProps) {
  return (
    <div className={cn('tactile-card bg-white p-5', className)}>
      <div className="mb-4 flex items-start justify-between border-b border-earth-200 pb-3">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
            // TELEMETRY TREND
          </span>
          <h3 className="font-display text-sm font-bold uppercase tracking-tight text-earth-900">{title}</h3>
          {subtitle && <p className="mt-0.5 font-mono text-[11px] text-earth-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

interface LineChartData {
  timestamp: string;
  value: number;
  label?: string;
}

interface TrendLineChartProps {
  data: LineChartData[];
  color?: string;
  unit?: string;
  height?: number;
  dataKey?: string;
}

export function TrendLineChart({
  data,
  color = '#1b6d33',
  unit = '',
  height = 220,
}: TrendLineChartProps) {
  const chartData = data.map((d) => ({
    name: d.label || new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: d.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 2" stroke="#e3ded2" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: '#5c5243', fontFamily: 'JetBrains Mono, monospace' }}
          tickLine={false}
          axisLine={{ stroke: '#d5cebf' }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#5c5243', fontFamily: 'JetBrains Mono, monospace' }}
          tickLine={false}
          axisLine={{ stroke: '#d5cebf' }}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: '#161715',
            border: '1px solid #3c3b37',
            borderRadius: '0px',
            color: '#f3f2eb',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            boxShadow: 'none',
          }}
          itemStyle={{ color: '#f3f2eb' }}
          formatter={(value) => [`${value}${unit}`, 'VALUE']}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: '#161715', strokeWidth: 1 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TrendAreaChart({
  data,
  color = '#1b6d33',
  unit = '',
  height = 220,
}: TrendLineChartProps) {
  const chartData = data.map((d) => ({
    name: d.label || new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: d.value,
  }));

  const gradientId = `grad-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 2" stroke="#e3ded2" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: '#5c5243', fontFamily: 'JetBrains Mono, monospace' }}
          tickLine={false}
          axisLine={{ stroke: '#d5cebf' }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#5c5243', fontFamily: 'JetBrains Mono, monospace' }}
          tickLine={false}
          axisLine={{ stroke: '#d5cebf' }}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: '#161715',
            border: '1px solid #3c3b37',
            borderRadius: '0px',
            color: '#f3f2eb',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            boxShadow: 'none',
          }}
          itemStyle={{ color: '#f3f2eb' }}
          formatter={(value) => [`${value}${unit}`, 'READING']}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface BarChartItem {
  name: string;
  value: number;
}

export function CoverageBarChart({ data, height = 200 }: { data: BarChartItem[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 2" stroke="#e3ded2" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: '#5c5243', fontFamily: 'JetBrains Mono, monospace' }}
          tickLine={false}
          axisLine={{ stroke: '#d5cebf' }}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 10, fill: '#5c5243', fontFamily: 'JetBrains Mono, monospace' }}
          tickLine={false}
          axisLine={{ stroke: '#d5cebf' }}
          width={70}
        />
        <Tooltip
          contentStyle={{
            background: '#161715',
            border: '1px solid #3c3b37',
            borderRadius: '0px',
            color: '#f3f2eb',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            boxShadow: 'none',
          }}
          itemStyle={{ color: '#f3f2eb' }}
          formatter={(value) => [`${value}%`, 'COVERAGE']}
        />
        <Bar dataKey="value" fill="#1b6d33" barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}
