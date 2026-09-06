import type { Alert } from '../../types';
import { SeverityBadge } from '../ui/StatusBadge';
import { formatTimestamp } from '../../utils/format';
import { cn } from '../../utils/cn';

interface AlertRowProps {
  alert: Alert;
}

export function AlertRow({ alert }: AlertRowProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border border-earth-200/60 bg-white p-4 sm:flex-row sm:items-center sm:justify-between',
        alert.status === 'resolved' && 'opacity-60'
      )}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={alert.severity} />
          <span className="text-xs font-medium text-earth-400">{alert.type}</span>
        </div>
        <p className="mt-1 text-sm font-medium text-farm-800">{alert.message}</p>
        <p className="mt-0.5 text-xs text-earth-400">
          {alert.location} · {formatTimestamp(alert.timestamp)}
        </p>
      </div>
      <span
        className={cn(
          'self-start rounded-md px-2 py-1 text-xs font-medium capitalize sm:self-center',
          alert.status === 'active' && 'bg-red-50 text-red-600',
          alert.status === 'acknowledged' && 'bg-amber-50 text-amber-600',
          alert.status === 'resolved' && 'bg-farm-50 text-farm-600'
        )}
      >
        {alert.status}
      </span>
    </div>
  );
}
