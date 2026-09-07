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
  statusColor = 'text-farm-800',
  showValue = true,
}: GaugeBarProps) {
  const percent = Math.min(100, Math.round((value / max) * 100));

  return (
    <div className="space-y-1.5 border-b border-earth-200 pb-3 last:border-0 last:pb-0">
      <div className="flex items-center justify-between">
        <span className="font-display text-xs font-bold uppercase tracking-wider text-earth-800">
          {label}
        </span>
        {showValue && (
          <span className="font-mono text-xs font-bold text-earth-900">
            {value} <span className="font-normal text-earth-500">{unit}</span>
          </span>
        )}
      </div>
      <div className="h-2 w-full border border-earth-300 bg-earth-100 p-0.5">
        <div
          className="h-full bg-farm-800 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      {status && (
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span className="text-earth-400">STATUS:</span>
          <span className={cn('font-bold uppercase tracking-wider', statusColor)}>{status}</span>
        </div>
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
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#d5cebf"
            strokeWidth="8"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1b6d33"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold tracking-tight text-earth-900">{value}</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-earth-500">{unit}</span>
        </div>
      </div>
      <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-wider text-earth-700">{label}</p>
    </div>
  );
}
