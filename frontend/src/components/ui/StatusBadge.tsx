import { cn } from '../../utils/cn';
import type { Severity, RiskLevel, HealthStatus } from '../../types';

interface StatusBadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  dot?: boolean;
  className?: string;
}

const variants = {
  default: 'bg-earth-100 text-earth-900 border border-earth-300',
  success: 'bg-farm-100/70 text-farm-900 border border-farm-500/60',
  warning: 'bg-amber-100/70 text-amber-950 border border-amber-500/60',
  danger: 'bg-red-100/70 text-red-950 border border-red-500/60',
  info: 'bg-sky-100/70 text-sky-950 border border-sky-500/60',
};

export function StatusBadge({ label, variant = 'default', dot, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
        variants[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5',
            variant === 'success' && 'bg-farm-600 animate-pulse',
            variant === 'warning' && 'bg-amber-600',
            variant === 'danger' && 'bg-red-600',
            variant === 'info' && 'bg-sky-600',
            variant === 'default' && 'bg-earth-600'
          )}
        />
      )}
      {label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const map: Record<Severity, 'info' | 'warning' | 'danger'> = {
    LOW: 'info',
    MEDIUM: 'warning',
    HIGH: 'danger',
    CRITICAL: 'danger',
  };
  return <StatusBadge label={severity} variant={map[severity]} />;
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const map: Record<RiskLevel, 'success' | 'warning' | 'danger'> = {
    LOW: 'success',
    MEDIUM: 'warning',
    HIGH: 'danger',
  };
  return <StatusBadge label={risk} variant={map[risk]} />;
}

export function HealthBadge({ status }: { status: HealthStatus }) {
  const map: Record<HealthStatus, 'success' | 'warning' | 'danger'> = {
    Healthy: 'success',
    Optimal: 'success',
    Moderate: 'warning',
    'Attention Required': 'warning',
    Critical: 'danger',
  };
  return <StatusBadge label={status} variant={map[status]} />;
}
