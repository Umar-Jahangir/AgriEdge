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
    <div className={cn('rounded-xl border border-earth-200/60 bg-white p-5 shadow-sm', className)}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-farm-800">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-earth-400">{subtitle}</p>}
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
  color = '#3d9140',
  unit = '',
  height = 220,
}: TrendLineChartProps) {
  const chartData = data.map((d) => ({
    name: d.label || new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: d.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0d5c7" opacity={0.5} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7a6b58' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#7a6b58' }} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          contentStyle={{
            background: '#fff',
            border: '1px solid #e0d5c7',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value) => [`${value}${unit}`, '']}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TrendAreaChart({
  data,
  color = '#3d9140',
  unit = '',
  height = 220,
}: TrendLineChartProps) {
  const chartData = data.map((d) => ({
    name: d.label || new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: d.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0d5c7" opacity={0.5} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7a6b58' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#7a6b58' }} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          contentStyle={{
            background: '#fff',
            border: '1px solid #e0d5c7',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value) => [`${value}${unit}`, '']}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#gradient-${color})`}
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
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e0d5c7" opacity={0.5} horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#7a6b58' }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#7a6b58' }} tickLine={false} axisLine={false} width={60} />
        <Tooltip
          contentStyle={{
            background: '#fff',
            border: '1px solid #e0d5c7',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value) => [`${value}%`, 'Coverage']}
        />
        <Bar dataKey="value" fill="#3d9140" radius={[0, 4, 4, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
