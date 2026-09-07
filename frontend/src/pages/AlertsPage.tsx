import { useState } from 'react';
import { AlertRow } from '../components/alerts/AlertRow';
import { SmsDispatcherModal } from '../components/alerts/SmsDispatcherModal';
import { TimeRangeSelector } from '../components/ui/TimeRangeSelector';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { useAlerts } from '../hooks/useData';
import { Radio, Smartphone } from 'lucide-react';
import type { Alert, AlertFilter } from '../types';

const filterOptions = [
  { value: 'all', label: 'ALL EVENTS' },
  { value: 'critical', label: 'CRITICAL' },
  { value: 'high', label: 'HIGH' },
  { value: 'medium', label: 'MEDIUM' },
  { value: 'low', label: 'LOW' },
  { value: 'resolved', label: 'RESOLVED' },
];

export function AlertsPage() {
  const [filter, setFilter] = useState<AlertFilter>('all');
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [selectedAlertForSms, setSelectedAlertForSms] = useState<Alert | null>(null);
  const { data: alerts, loading, error, refetch } = useAlerts(filter);

  if (loading) return <LoadingState message="Querying active incident bus..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const activeCount = alerts?.filter((a) => a.status === 'active').length || 0;

  const handleRowDispatch = (alert: Alert) => {
    setSelectedAlertForSms(alert);
    setIsSmsModalOpen(true);
  };

  const handleOpenGeneralModal = () => {
    setSelectedAlertForSms(null);
    setIsSmsModalOpen(true);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-earth-300 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-farm-800">
              // INCIDENT MANAGEMENT DISPATCH
            </span>
            <span className="border border-earth-300 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-earth-700">
              PRIORITY QUEUE
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-earth-900">
            Agronomic Alerts & Anomaly Ledger
          </h2>
          <p className="font-mono text-xs text-earth-600">
            Automated alerts dispatched when sensor telemetry crosses physiological crop thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TimeRangeSelector options={filterOptions} value={filter} onChange={(v) => setFilter(v as AlertFilter)} />
        </div>
      </div>

      {/* 2G Feature Phone Offline Broadcast Banner (PS §6) */}
      <div className="tactile-card border-l-4 border-l-farm-800 bg-linear-to-r from-farm-50/90 via-white to-farm-50/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-farm-900 text-farm-300">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold text-farm-950">
                2G Keypad & Feature Phone Offline Inclusion (PS §6)
              </span>
              <span className="border border-farm-700 bg-farm-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-farm-800">
                mKisan 51969
              </span>
            </div>
            <p className="text-xs text-earth-600 mt-0.5">
              Transmit live incident advisories directly to basic Nokia 105 & JioPhone handsets in Devanagari Hindi / Marathi without requiring active internet.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenGeneralModal}
          className="inline-flex items-center justify-center gap-2 border border-farm-800 bg-farm-800 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-farm-900 transition-colors shrink-0 cursor-pointer"
        >
          <Smartphone className="h-3.5 w-3.5 text-farm-300" />
          <span>Launch 2G Handset Dispatcher</span>
        </button>
      </div>

      {/* Incident Status Strip */}
      <div className="tactile-card bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="inline-flex items-center gap-1.5 border border-red-300 bg-red-50 px-2 py-0.5 font-bold text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
            {activeCount} UNRESOLVED INCIDENTS
          </span>
          <span className="text-earth-500">
            FILTER: [{filter.toUpperCase()}]
          </span>
        </div>
        <span className="font-mono text-[11px] text-earth-500">
          AUTO-REFRESH: REAL-TIME LORA/WEBSOCKET
        </span>
      </div>

      {/* Alert Feed */}
      <div className="space-y-3">
        {alerts && alerts.length > 0 ? (
          alerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              onDispatch={handleRowDispatch}
            />
          ))
        ) : (
          <EmptyState title="NO ALERTS RECORDED" description="All telemetry thresholds are currently within nominal limits." />
        )}
      </div>

      {/* 2G / Keypad SMS Dispatcher Modal */}
      <SmsDispatcherModal
        isOpen={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
        initialAlert={selectedAlertForSms}
      />
    </div>
  );
}

