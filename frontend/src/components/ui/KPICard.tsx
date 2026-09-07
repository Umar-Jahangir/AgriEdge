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
  statusColor = 'text-farm-700',
  icon: Icon,
  className,
  children,
}: KPICardProps) {
  return (
    <div
      className={cn(
        'relative bg-white border border-earth-300 p-4 transition-colors hover:border-earth-500',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-earth-500">
            <span>//</span>
            <span className="truncate">{title}</span>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-earth-950 sm:text-3xl">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 font-mono text-[11px] text-earth-500 truncate">{subtitle}</p>
          )}
          {status && (
            <div className="mt-2.5 inline-block">
              <span className={cn('px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider border border-current', statusColor)}>
                {status}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="border border-earth-200 bg-earth-50 p-2 text-earth-700 shrink-0">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
