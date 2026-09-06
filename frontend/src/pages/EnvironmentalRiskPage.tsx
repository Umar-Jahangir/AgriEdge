import { useState } from 'react';
import { ChartCard, TrendAreaChart } from '../components/ui/ChartCard';
import { TimeRangeSelector } from '../components/ui/TimeRangeSelector';
import { RiskBadge } from '../components/ui/StatusBadge';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { useEnvironmentalRisk, useSensorHistory } from '../hooks/useData';
import { CloudOff, Thermometer, Droplets, Wind } from 'lucide-react';

const timeOptions = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
];

export function EnvironmentalRiskPage() {
  const [range, setRange] = useState<'today' | '7d' | '30d'>('7d');
  const { data: risk, loading, error, refetch } = useEnvironmentalRisk();
  const { data: history, loading: historyLoading } = useSensorHistory(range);

  if (loading) return <LoadingState message="Loading environmental data..." />;
  if (error || !risk) return <ErrorState message={error || 'Failed to load'} onRetry={refetch} />;

  const risks = [
    { label: 'Drought Risk', value: risk.droughtRisk },
    { label: 'Flood Risk', value: risk.floodRisk },
    { label: 'Heat Stress Risk', value: risk.heatStressRisk },
    { label: 'Crop Disease Risk', value: risk.cropDiseaseRisk },
    { label: 'Water Stress Risk', value: risk.waterStressRisk },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-xl font-bold text-farm-800">Environmental Risk Monitoring</h2>
        <p className="mt-1 text-sm text-earth-400">
          Air and soil environmental conditions from rover-mounted sensors
        </p>
      </div>

      {/* Current Readings */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <EnvCard icon={Thermometer} label="Air Temperature" value={`${risk.airTemperature}°C`} />
        <EnvCard icon={Wind} label="Humidity" value={`${risk.humidity}%`} />
        <EnvCard icon={Thermometer} label="Soil Temperature" value={`${risk.soilTemperature}°C`} />
        <EnvCard icon={Droplets} label="Soil Moisture" value={`${risk.soilMoisture}%`} />
      </div>

      {/* Weather Integration Pending */}
      {risk.weatherIntegrationPending && (
        <div className="flex items-center gap-3 rounded-xl border border-earth-200 bg-earth-50/50 p-4">
          <CloudOff className="h-5 w-5 text-earth-400" />
          <div>
            <p className="text-sm font-medium text-earth-600">External Weather Data — Integration Pending</p>
            <p className="text-xs text-earth-400">
              Rainfall and weather conditions require external API integration. The rover does not measure rainfall directly.
            </p>
          </div>
        </div>
      )}

      {/* Risk Indicators */}
      <div className="rounded-xl border border-earth-200/60 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-farm-800">Risk Indicators</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {risks.map((r) => (
            <div key={r.label} className="flex items-center justify-between rounded-lg bg-earth-50/50 p-3">
              <span className="text-xs text-earth-600">{r.label}</span>
              <RiskBadge risk={r.value} />
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-farm-800">Historical Trends</h3>
        <TimeRangeSelector options={timeOptions} value={range} onChange={(v) => setRange(v as typeof range)} />
      </div>

      {historyLoading ? (
        <LoadingState message="Loading charts..." />
      ) : history ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Soil Moisture Trend">
            <TrendAreaChart data={history.soilMoisture} color="#3d9140" unit="%" />
          </ChartCard>
          <ChartCard title="Soil Temperature Trend">
            <TrendAreaChart data={history.soilTemperature} color="#d97706" unit="°C" />
          </ChartCard>
        </div>
      ) : null}
    </div>
  );
}

function EnvCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-earth-200/60 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-farm-500" />
        <span className="text-xs text-earth-400">{label}</span>
      </div>
      <p className="mt-2 text-xl font-semibold text-farm-800">{value}</p>
    </div>
  );
}
