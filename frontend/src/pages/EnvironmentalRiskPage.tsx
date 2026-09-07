import { useState } from 'react';
import { ChartCard, TrendAreaChart } from '../components/ui/ChartCard';
import { TimeRangeSelector } from '../components/ui/TimeRangeSelector';
import { RiskBadge } from '../components/ui/StatusBadge';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { useEnvironmentalRisk, useSensorHistory } from '../hooks/useData';
import { CloudOff, Thermometer, Droplets, Wind } from 'lucide-react';

const timeOptions = [
  { value: 'today', label: 'TODAY' },
  { value: '7d', label: '7 DAYS' },
  { value: '30d', label: '30 DAYS' },
];

export function EnvironmentalRiskPage() {
  const [range, setRange] = useState<'today' | '7d' | '30d'>('7d');
  const { data: risk, loading, error, refetch } = useEnvironmentalRisk();
  const { data: history, loading: historyLoading } = useSensorHistory(range);

  if (loading) return <LoadingState message="Polling atmospheric telemetry..." />;
  if (error || !risk) return <ErrorState message={error || 'Failed to load telemetry'} onRetry={refetch} />;

  const risks = [
    { label: 'DROUGHT RISK', value: risk.droughtRisk },
    { label: 'FLOOD / RUNOFF RISK', value: risk.floodRisk },
    { label: 'HEAT STRESS RISK', value: risk.heatStressRisk },
    { label: 'FUNGAL / DISEASE RISK', value: risk.cropDiseaseRisk },
    { label: 'HYDRATION STRESS RISK', value: risk.waterStressRisk },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-earth-300 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-farm-800">
              // CLIMATOLOGICAL & EDAPHIC SURVEILLANCE
            </span>
            <span className="border border-earth-300 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-earth-700">
              ROVER MICROCLIMATE POD
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-earth-900">
            Environmental Stress & Microclimate Monitoring
          </h2>
          <p className="font-mono text-xs text-earth-600">
            Real-time ambient and subterranean sensor readings correlating weather patterns with crop vulnerability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TimeRangeSelector options={timeOptions} value={range} onChange={(v) => setRange(v as typeof range)} />
        </div>
      </div>

      {/* Current Readings Telemetry Ribbon */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <EnvCard icon={Thermometer} label="AMBIENT AIR TEMPERATURE" value={`${risk.airTemperature}°C`} />
        <EnvCard icon={Wind} label="RELATIVE HUMIDITY" value={`${risk.humidity}%`} />
        <EnvCard icon={Thermometer} label="SUBTERRANEAN TEMP" value={`${risk.soilTemperature}°C`} />
        <EnvCard icon={Droplets} label="SOIL MOISTURE SATURATION" value={`${risk.soilMoisture}%`} />
      </div>

      {/* Technical Integration Notice */}
      {risk.weatherIntegrationPending && (
        <div className="tactile-card bg-earth-100/60 p-4 flex items-start gap-3 border-earth-300">
          <CloudOff className="h-5 w-5 text-earth-500 shrink-0 mt-0.5" />
          <div className="font-mono text-xs">
            <p className="font-bold uppercase tracking-wider text-earth-900">
              [TELEMETRY NOTE] EXTERNAL SATELLITE WEATHER FEED — STANDBY
            </p>
            <p className="mt-1 text-[11px] text-earth-600">
              Precipitation forecasts and macro-meteorological data require external weather radar API. Currently utilizing in-situ rover microclimate telemetry.
            </p>
          </div>
        </div>
      )}

      {/* Risk Assessment Matrix */}
      <div className="tactile-card bg-white p-5">
        <div className="border-b border-earth-200 pb-3 mb-4">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
            // RISK VECTOR MATRIX
          </span>
          <h3 className="font-display text-sm font-bold uppercase tracking-tight text-earth-900">
            Automated Environmental Risk Indicators
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {risks.map((r) => (
            <div key={r.label} className="border border-earth-300 bg-earth-50/80 p-3 flex flex-col justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-earth-600">
                {r.label}
              </span>
              <div className="mt-3">
                <RiskBadge risk={r.value} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Charts */}
      {historyLoading ? (
        <LoadingState message="Compiling environmental telemetry charts..." />
      ) : history ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Subterranean Moisture Dynamics" subtitle="7-day volumetric water saturation curve">
            <TrendAreaChart data={history.soilMoisture} color="#1b6d33" unit="%" />
          </ChartCard>
          <ChartCard title="Sub-Surface Thermal Gradient" subtitle="Temperature variations measured in Celsius">
            <TrendAreaChart data={history.soilTemperature} color="#d97706" unit="°C" />
          </ChartCard>
        </div>
      ) : null}
    </div>
  );
}

function EnvCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="tactile-card bg-white p-4">
      <div className="flex items-center justify-between border-b border-earth-200 pb-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-earth-500">
          {label}
        </span>
        <Icon className="h-3.5 w-3.5 text-earth-400" />
      </div>
      <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-earth-900">{value}</p>
    </div>
  );
}
