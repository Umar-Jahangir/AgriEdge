import { useState } from 'react';
import { AlertRow } from '../components/alerts/AlertRow';
import { TimeRangeSelector } from '../components/ui/TimeRangeSelector';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { useAlerts } from '../hooks/useData';
import type { AlertFilter } from '../types';

const filterOptions = [
  { value: 'all', label: 'All' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'resolved', label: 'Resolved' },
];

export function AlertsPage() {
  const [filter, setFilter] = useState<AlertFilter>('all');
  const { data: alerts, loading, error, refetch } = useAlerts(filter);

  if (loading) return <LoadingState message="Loading alerts..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const activeCount = alerts?.filter((a) => a.status === 'active').length || 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-farm-800">Alerts & Events</h2>
          <p className="mt-1 text-sm text-earth-400">
            {activeCount} active alert{activeCount !== 1 ? 's' : ''} requiring attention
          </p>
        </div>
        <TimeRangeSelector options={filterOptions} value={filter} onChange={(v) => setFilter(v as AlertFilter)} />
      </div>

      <div className="space-y-3">
        {alerts && alerts.length > 0 ? (
          alerts.map((alert) => <AlertRow key={alert.id} alert={alert} />)
        ) : (
          <EmptyState title="No alerts found" description="No alerts match the selected filter." />
        )}
      </div>
    </div>
  );
}
