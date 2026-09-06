import { cn } from '../../utils/cn';
import type { Severity, RiskLevel, HealthStatus } from '../../types';

interface StatusBadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  dot?: boolean;
  className?: string;
}

const variants = {
  default: 'bg-earth-100 text-earth-700',
  success: 'bg-farm-50 text-farm-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
};

export function StatusBadge({ label, variant = 'default', dot, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-farm-500 animate-pulse-dot',
            variant === 'warning' && 'bg-amber-500',
            variant === 'danger' && 'bg-red-500',
            variant === 'info' && 'bg-blue-500',
            variant === 'default' && 'bg-earth-400'
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
