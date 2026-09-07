import type { Alert } from '../../types';
import { SeverityBadge } from '../ui/StatusBadge';
import { formatTimestamp } from '../../utils/format';
import { cn } from '../../utils/cn';

interface AlertRowProps {
  alert: Alert;
}

export function AlertRow({ alert }: AlertRowProps) {
  const isCritical = alert.severity === 'CRITICAL';
  const isHigh = alert.severity === 'HIGH';

  return (
    <div
      className={cn(
        'tactile-card bg-white p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between transition-all border-l-4',
        isCritical ? 'border-l-red-700' : isHigh ? 'border-l-amber-600' : 'border-l-earth-400',
        alert.status === 'resolved' && 'opacity-60 bg-earth-50/50'
      )}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={alert.severity} />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-earth-500">
            TYPE: {alert.type}
          </span>
          <span className="font-mono text-[10px] text-earth-400">
            ID: #{alert.id}
          </span>
        </div>
        <p className="mt-1.5 font-display text-sm font-bold text-earth-900">{alert.message}</p>
        <div className="mt-1 flex items-center gap-3 font-mono text-[11px] text-earth-500">
          <span className="font-bold text-farm-800">LOC: {alert.location}</span>
          <span>•</span>
          <span>TIMESTAMP: {formatTimestamp(alert.timestamp)}</span>
        </div>
      </div>

      <div className="self-start sm:self-center">
        <span
          className={cn(
            'inline-flex border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
            alert.status === 'active' && 'border-red-700 bg-red-50 text-red-700',
            alert.status === 'acknowledged' && 'border-amber-600 bg-amber-50 text-amber-800',
            alert.status === 'resolved' && 'border-earth-300 bg-earth-100 text-earth-600'
          )}
        >
          [{alert.status}]
        </span>
      </div>
    </div>
  );
}
