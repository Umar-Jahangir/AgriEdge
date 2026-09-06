import { useState } from 'react';
import { ChartCard, TrendAreaChart, TrendLineChart, CoverageBarChart } from '../components/ui/ChartCard';
import { TimeRangeSelector } from '../components/ui/TimeRangeSelector';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { useAnalytics } from '../hooks/useData';

const timeOptions = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

export function AnalyticsPage() {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d');
  const { data, loading, error, refetch } = useAnalytics(range);

  if (loading) return <LoadingState message="Loading analytics..." />;
  if (error || !data) return <ErrorState message={error || 'Failed to load'} onRetry={refetch} />;

  const coverageData = data.samplingCoverage.map((z) => ({
    name: z.zoneName,
    value: z.coverage,
  }));

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-farm-800">Historical Analytics</h2>
          <p className="mt-1 text-sm text-earth-400">
            Trends built from repeated rover scans across the farm
          </p>
        </div>
        <TimeRangeSelector options={timeOptions} value={range} onChange={(v) => setRange(v as typeof range)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Soil Moisture Trends">
          <TrendAreaChart data={data.soilMoisture} color="#3d9140" unit="%" />
        </ChartCard>
        <ChartCard title="pH Trends">
          <TrendLineChart data={data.ph} color="#2563eb" />
        </ChartCard>
        <ChartCard title="Nitrogen Trends" subtitle="ppm">
          <TrendAreaChart data={data.nitrogen} color="#16a34a" unit=" ppm" />
        </ChartCard>
        <ChartCard title="Phosphorus Trends" subtitle="ppm">
          <TrendAreaChart data={data.phosphorus} color="#ca8a04" unit=" ppm" />
        </ChartCard>
        <ChartCard title="Potassium Trends" subtitle="ppm">
          <TrendAreaChart data={data.potassium} color="#dc2626" unit=" ppm" />
        </ChartCard>
        <ChartCard title="Crop Health Trends">
          <TrendLineChart data={data.cropHealth} color="#059669" unit="%" />
        </ChartCard>
        <ChartCard title="AI Soil Condition Score">
          <TrendLineChart data={data.soilConditionScore} color="#3d9140" />
        </ChartCard>
        <ChartCard title="Environmental Risk Index">
          <TrendAreaChart data={data.environmentalRisk} color="#d97706" />
        </ChartCard>
      </div>

      <ChartCard title="Sampling Coverage by Zone" subtitle="Spatial understanding built from rover scans">
        <CoverageBarChart data={coverageData} height={240} />
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {data.samplingCoverage.map((z) => (
            <div key={z.zoneId} className="rounded-lg bg-farm-50/50 p-3 text-center">
              <p className="text-xs text-earth-400">{z.zoneName}</p>
              <p className="text-lg font-bold text-farm-700">{z.coverage}%</p>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
