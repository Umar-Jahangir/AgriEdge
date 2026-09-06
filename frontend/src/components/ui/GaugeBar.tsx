import { cn } from '../../utils/cn';

interface GaugeBarProps {
  label: string;
  value: number;
  unit?: string;
  max?: number;
  status?: string;
  statusColor?: string;
  showValue?: boolean;
}

export function GaugeBar({
  label,
  value,
  unit = 'ppm',
  max = 80,
  status,
  statusColor = 'text-farm-600',
  showValue = true,
}: GaugeBarProps) {
  const percent = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-farm-800">{label}</span>
        {showValue && (
          <span className="text-sm text-earth-600">
            {value} {unit}
          </span>
        )}
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-earth-100">
        <div
          className="h-full rounded-full bg-farm-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      {status && (
        <p className={cn('text-xs font-medium', statusColor)}>{status}</p>
      )}
    </div>
  );
}

interface CircularGaugeProps {
  value: number;
  max?: number;
  label: string;
  unit?: string;
  size?: number;
}

export function CircularGauge({ value, max = 100, label, unit = '%', size = 120 }: CircularGaugeProps) {
  const percent = Math.min(100, (value / max) * 100);
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e6f2e8"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#3d9140"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-bold text-farm-800">{value}</span>
        <span className="text-xs text-earth-500">{unit}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-earth-600">{label}</p>
    </div>
  );
}
