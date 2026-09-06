import { useState } from 'react';
import { ChartCard, TrendAreaChart } from '../components/ui/ChartCard';
import { TimeRangeSelector } from '../components/ui/TimeRangeSelector';
import { NPKGauges } from '../components/farm/NPKGauges';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { useSoilAnalysis, useLatestSensors, useSensorHistory } from '../hooks/useData';
import type { NutrientStatus } from '../types';

const timeOptions = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
];

const statusColors: Record<NutrientStatus, string> = {
  Good: 'text-farm-600',
  Moderate: 'text-amber-600',
  Low: 'text-orange-600',
  Deficient: 'text-red-600',
};

export function SoilHealthPage() {
  const [range, setRange] = useState<'today' | '7d' | '30d'>('7d');
  const { data: analysis, loading: analysisLoading } = useSoilAnalysis();
  const { data: sensors, loading: sensorLoading } = useLatestSensors();
  const { data: history, loading: historyLoading } = useSensorHistory(range);

  if (analysisLoading || sensorLoading) return <LoadingState message="Loading soil health data..." />;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-xl font-bold text-farm-800">Soil Health</h2>
        <p className="mt-1 text-sm text-earth-400">
          Detailed sensor readings from rover soil probes at sampling points
        </p>
      </div>

      {/* Current Readings */}
      {sensors && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ReadingCard label="Soil Moisture" value={`${sensors.soilMoisture}%`} />
          <ReadingCard label="Soil Temperature" value={`${sensors.soilTemperature}°C`} />
          <ReadingCard label="Soil pH" value={String(sensors.soilPh)} />
          <ReadingCard label="Electrical Conductivity" value={`${sensors.electricalConductivity} mS/cm`} />
        </div>
      )}

      {/* Soil Condition Analysis */}
      {analysis && (
        <div className="rounded-xl border border-earth-200/60 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-farm-800">Soil Condition Analysis</h3>
          <p className="mt-1 text-xs text-earth-400">{analysis.derivedFrom}</p>
          <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="text-center">
              <p className="text-4xl font-bold text-farm-700">{analysis.overallScore}</p>
              <p className="text-sm text-earth-400">/100</p>
              <p className="mt-1 text-xs font-medium text-farm-600">AI Soil Condition Score</p>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-5">
              <AnalysisItem label="Moisture" status={analysis.moisture} />
              <AnalysisItem label="pH" status={analysis.ph} />
              <AnalysisItem label="NPK" status={analysis.npk} />
              <AnalysisItem label="EC" status={analysis.ec} />
              <AnalysisItem label="Temperature" status={analysis.temperature} />
            </div>
          </div>
        </div>
      )}

      {/* Time Range */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-farm-800">Historical Trends</h3>
        <TimeRangeSelector options={timeOptions} value={range} onChange={(v) => setRange(v as typeof range)} />
      </div>

      {historyLoading ? (
        <LoadingState message="Loading charts..." />
      ) : !history ? (
        <ErrorState message="Failed to load history" />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Soil Moisture" subtitle="Over time">
              <TrendAreaChart data={history.soilMoisture} color="#3d9140" unit="%" />
            </ChartCard>
            <ChartCard title="Soil Temperature" subtitle="Over time">
              <TrendAreaChart data={history.soilTemperature} color="#d97706" unit="°C" />
            </ChartCard>
            <ChartCard title="pH Level" subtitle="Over time">
              <TrendAreaChart data={history.ph} color="#2563eb" />
            </ChartCard>
            <ChartCard title="Electrical Conductivity" subtitle="Over time">
              <TrendAreaChart data={history.ec} color="#7c3aed" unit=" mS/cm" />
            </ChartCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-earth-200/60 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-farm-800">NPK Analysis</h3>
              <div className="mt-4">
                {sensors && (
                  <NPKGauges
                    npk={{
                      nitrogen: sensors.nitrogen,
                      phosphorus: sensors.phosphorus,
                      potassium: sensors.potassium,
                      nitrogenStatus: sensors.nitrogen < 50 ? 'Moderate' : 'Good',
                      phosphorusStatus: sensors.phosphorus < 30 ? 'Moderate' : 'Good',
                      potassiumStatus: 'Good',
                      timestamp: sensors.timestamp,
                    }}
                    showInterpretation
                  />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <ChartCard title="Nitrogen Trend" subtitle="ppm">
                <TrendAreaChart data={history.nitrogen} color="#16a34a" unit=" ppm" />
              </ChartCard>
              <ChartCard title="Phosphorus Trend" subtitle="ppm">
                <TrendAreaChart data={history.phosphorus} color="#ca8a04" unit=" ppm" />
              </ChartCard>
              <ChartCard title="Potassium Trend" subtitle="ppm">
                <TrendAreaChart data={history.potassium} color="#dc2626" unit=" ppm" />
              </ChartCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ReadingCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-earth-200/60 bg-white p-4 shadow-sm">
      <p className="text-xs text-earth-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-farm-800">{value}</p>
    </div>
  );
}

function AnalysisItem({ label, status }: { label: string; status: NutrientStatus }) {
  return (
    <div className="rounded-lg bg-farm-50/50 p-3 text-center">
      <p className="text-xs text-earth-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${statusColors[status]}`}>{status}</p>
    </div>
  );
}
