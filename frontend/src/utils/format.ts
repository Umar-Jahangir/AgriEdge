import type { RiskLevel, RoverState, Severity, HealthStatus, ConnectionStatus } from '../types';

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function severityColor(severity: Severity): string {
  const map: Record<Severity, string> = {
    LOW: 'bg-blue-50 text-blue-700 border-blue-200',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
    CRITICAL: 'bg-red-50 text-red-700 border-red-200',
  };
  return map[severity];
}

export function riskColor(risk: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    LOW: 'text-farm-600 bg-farm-50',
    MEDIUM: 'text-amber-700 bg-amber-50',
    HIGH: 'text-red-700 bg-red-50',
  };
  return map[risk];
}

export function roverStateColor(state: RoverState): string {
  const map: Record<RoverState, string> = {
    ACTIVE: 'text-farm-600',
    IDLE: 'text-earth-500',
    OFFLINE: 'text-red-600',
    PAUSED: 'text-amber-600',
    RETURNING: 'text-blue-600',
    EMERGENCY_STOP: 'text-red-700',
  };
  return map[state];
}

export function healthStatusColor(status: HealthStatus): string {
  const map: Record<HealthStatus, string> = {
    Healthy: 'text-farm-600',
    Optimal: 'text-farm-600',
    Moderate: 'text-amber-600',
    'Attention Required': 'text-orange-600',
    Critical: 'text-red-600',
  };
  return map[status];
}

export function connectionColor(status: ConnectionStatus): string {
  return status === 'Connected' ? 'text-farm-500' : status === 'Degraded' ? 'text-amber-500' : 'text-red-500';
}

export function nutrientBarPercent(value: number, max = 80): number {
  return Math.min(100, Math.round((value / max) * 100));
}

export function chartDateLabel(iso: string, range: string): string {
  const d = new Date(iso);
  if (range === 'today') {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
