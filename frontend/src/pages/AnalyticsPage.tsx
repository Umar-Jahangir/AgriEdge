import { useState } from 'react';
import { ChartCard, TrendAreaChart, TrendLineChart, CoverageBarChart } from '../components/ui/ChartCard';
import { TimeRangeSelector } from '../components/ui/TimeRangeSelector';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { useAnalytics } from '../hooks/useData';

const timeOptions = [
  { value: '7d', label: '7 DAYS' },
  { value: '30d', label: '30 DAYS' },
  { value: '90d', label: '90 DAYS' },
];

export function AnalyticsPage() {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d');
  const { data, loading, error, refetch } = useAnalytics(range);

  if (loading) return <LoadingState message="Aggregating multi-zone longitudinal telemetry..." />;
  if (error || !data) return <ErrorState message={error || 'Failed to load telemetry archives'} onRetry={refetch} />;

  const coverageData = data.samplingCoverage.map((z) => ({
    name: z.zoneName,
    value: z.coverage,
  }));

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-earth-300 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-farm-800">
              // LONGITUDINAL AGRONOMIC ARCHIVES
            </span>
            <span className="border border-earth-300 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-earth-700">
              MULTI-CYCLE LOGS
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-earth-900">
            Historical Trends & Long-Term Field Dynamics
          </h2>
          <p className="font-mono text-xs text-earth-600">
            Time-series telemetry synthesized from autonomous rover spatial traverses across all four farm sectors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TimeRangeSelector options={timeOptions} value={range} onChange={(v) => setRange(v as typeof range)} />
        </div>
      </div>

      {/* Primary Analytics Bento */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Subterranean Moisture Dynamics" subtitle="Volumetric moisture percentage trajectory">
          <TrendAreaChart data={data.soilMoisture} color="#1b6d33" unit="%" />
        </ChartCard>
        <ChartCard title="Hydrogen Ion Activity (pH)" subtitle="Chemical acidity / alkalinity balance">
          <TrendLineChart data={data.ph} color="#2563eb" />
        </ChartCard>
        <ChartCard title="Nitrogen (N) Chemical Concentration" subtitle="Parts per million (ppm) availability">
          <TrendAreaChart data={data.nitrogen} color="#1b6d33" unit=" ppm" />
        </ChartCard>
        <ChartCard title="Phosphorus (P) Nutrient Availability" subtitle="Orthophosphate concentration (ppm)">
          <TrendAreaChart data={data.phosphorus} color="#ca8a04" unit=" ppm" />
        </ChartCard>
        <ChartCard title="Potassium (K) Availability" subtitle="Exchangeable potassium concentration (ppm)">
          <TrendAreaChart data={data.potassium} color="#b91c1c" unit=" ppm" />
        </ChartCard>
        <ChartCard title="Canopy Foliage Health Index" subtitle="Optical ML classification vigor rating (%)">
          <TrendLineChart data={data.cropHealth} color="#1b6d33" unit="%" />
        </ChartCard>
        <ChartCard title="Composite Soil Quality Score" subtitle="Derived from NPK, EC, pH and moisture">
          <TrendLineChart data={data.soilConditionScore} color="#1b6d33" />
        </ChartCard>
        <ChartCard title="Environmental Stress Index" subtitle="Composite vulnerability to heat/drought">
          <TrendAreaChart data={data.environmentalRisk} color="#d97706" />
        </ChartCard>
      </div>

      {/* Spatial Sampling Coverage Breakdown */}
      <ChartCard
        title="Spatial Sampling Coverage by Sector"
        subtitle="Cumulative rover coverage percentage across all designated quadrants"
      >
        <CoverageBarChart data={coverageData} height={220} />
        <div className="mt-4 grid gap-3 sm:grid-cols-4 font-mono">
          {data.samplingCoverage.map((z) => (
            <div key={z.zoneId} className="border border-earth-300 bg-earth-50/80 p-3 text-center">
              <span className="text-[10px] uppercase text-earth-500">{z.zoneName}</span>
              <p className="mt-1 text-2xl font-bold tracking-tight text-earth-900">{z.coverage}%</p>
              <div className="mt-1 h-1 w-full border border-earth-300 bg-earth-100">
                <div className="h-full bg-farm-800" style={{ width: `${z.coverage}%` }} />
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
