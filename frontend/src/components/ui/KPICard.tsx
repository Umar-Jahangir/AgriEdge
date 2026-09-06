import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  status?: string;
  statusColor?: string;
  icon?: LucideIcon;
  className?: string;
  children?: React.ReactNode;
}

export function KPICard({
  title,
  value,
  subtitle,
  status,
  statusColor = 'text-farm-600',
  icon: Icon,
  className,
  children,
}: KPICardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-earth-200/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-earth-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-farm-800">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-earth-400">{subtitle}</p>}
          {status && (
            <p className={cn('mt-2 text-xs font-medium', statusColor)}>{status}</p>
          )}
        </div>
        {Icon && (
          <div className="rounded-lg bg-farm-50 p-2.5">
            <Icon className="h-5 w-5 text-farm-600" />
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
