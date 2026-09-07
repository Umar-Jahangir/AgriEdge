import { useState } from 'react';
import { ChartCard, TrendAreaChart } from '../components/ui/ChartCard';
import { TimeRangeSelector } from '../components/ui/TimeRangeSelector';
import { NPKGauges } from '../components/farm/NPKGauges';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { useSoilAnalysis, useLatestSensors, useSensorHistory } from '../hooks/useData';
import type { NutrientStatus } from '../types';

const timeOptions = [
  { value: 'today', label: 'TODAY' },
  { value: '7d', label: '7 DAYS' },
  { value: '30d', label: '30 DAYS' },
];

const statusStyles: Record<NutrientStatus, { text: string; bg: string; border: string }> = {
  Good: { text: 'text-farm-800', bg: 'bg-farm-100', border: 'border-farm-400' },
  Moderate: { text: 'text-amber-800', bg: 'bg-amber-100', border: 'border-amber-400' },
  Low: { text: 'text-orange-800', bg: 'bg-orange-100', border: 'border-orange-400' },
  Deficient: { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-400' },
};

export function SoilHealthPage() {
  const [range, setRange] = useState<'today' | '7d' | '30d'>('7d');
  const { data: analysis, loading: analysisLoading } = useSoilAnalysis();
  const { data: sensors, loading: sensorLoading } = useLatestSensors();
  const { data: history, loading: historyLoading } = useSensorHistory(range);

  if (analysisLoading || sensorLoading) return <LoadingState message="Querying subterranean sensor bus..." />;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-earth-300 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-farm-800">
              // SUBTERRANEAN SENSOR ARRAY
            </span>
            <span className="border border-earth-300 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-earth-700">
              CALIBRATED ESP32 SENSORS
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-earth-900">
            Soil Chemistry & Moisture Profile
          </h2>
          <p className="font-mono text-xs text-earth-600">
            In-situ subterranean probe measurements captured during rover waypoint stops.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TimeRangeSelector options={timeOptions} value={range} onChange={(v) => setRange(v as typeof range)} />
        </div>
      </div>

      {/* Primary Telemetry Ribbons */}
      {sensors && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReadingCard
            label="SOIL VOLUMETRIC MOISTURE"
            value={`${sensors.soilMoisture}%`}
            status={sensors.soilMoisture < 35 ? 'DRY' : 'OPTIMAL'}
            statusColor={sensors.soilMoisture < 35 ? 'text-amber-700' : 'text-farm-800'}
          />
          <ReadingCard
            label="PROBE TEMPERATURE"
            value={`${sensors.soilTemperature}°C`}
            status="NOMINAL"
            statusColor="text-farm-800"
          />
          <ReadingCard
            label="HYDROGEN POTENTIAL (pH)"
            value={String(sensors.soilPh)}
            status={sensors.soilPh >= 6.0 && sensors.soilPh <= 7.0 ? 'NEUTRAL' : 'SLIGHTLY ACIDIC'}
            statusColor="text-farm-800"
          />
          <ReadingCard
            label="ELECTRICAL CONDUCTIVITY"
            value={`${sensors.electricalConductivity} mS/cm`}
            status="STABLE SALINITY"
            statusColor="text-farm-800"
          />
        </div>
      )}

      {/* AI Soil Condition Index Slab */}
      {analysis && (
        <div className="tactile-card bg-white p-5">
          <div className="flex items-center justify-between border-b border-earth-200 pb-3 mb-4">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
                // COMPOSITE INDEX ANALYSIS
              </span>
              <h3 className="font-display text-sm font-bold uppercase tracking-tight text-earth-900">
                AI Subterranean Condition Assessment
              </h3>
            </div>
            <span className="font-mono text-[11px] text-earth-500">
              DERIVED FROM: {analysis.derivedFrom.toUpperCase()}
            </span>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            {/* Big Hero Rating */}
            <div className="flex items-baseline gap-3 border-b border-earth-200 pb-4 lg:border-b-0 lg:border-r lg:pr-8 lg:pb-0">
              <span className="font-mono text-5xl font-bold tracking-tighter text-farm-900">
                {analysis.overallScore}
              </span>
              <div>
                <span className="font-mono text-xs text-earth-500">/ 100 PTS</span>
                <p className="font-display text-xs font-bold uppercase tracking-wider text-farm-800">
                  HEALTH SCORE
                </p>
              </div>
            </div>

            {/* Component Status Tiles */}
            <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-5 font-mono">
              <AnalysisItem label="MOISTURE" status={analysis.moisture} />
              <AnalysisItem label="pH LEVEL" status={analysis.ph} />
              <AnalysisItem label="NPK BALANCE" status={analysis.npk} />
              <AnalysisItem label="SALINITY (EC)" status={analysis.ec} />
              <AnalysisItem label="TEMPERATURE" status={analysis.temperature} />
            </div>
          </div>
        </div>
      )}

      {/* Historical Telemetry Charts */}
      {historyLoading ? (
        <LoadingState message="Compiling historical sensor telemetry..." />
      ) : !history ? (
        <ErrorState message="Failed to load telemetry history" />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Soil Moisture Saturation" subtitle="Volumetric water content percentage">
              <TrendAreaChart data={history.soilMoisture} color="#1b6d33" unit="%" />
            </ChartCard>
            <ChartCard title="Soil Temperature Profile" subtitle="Sub-surface thermal measurements in Celsius">
              <TrendAreaChart data={history.soilTemperature} color="#d97706" unit="°C" />
            </ChartCard>
            <ChartCard title="Hydrogen Ion Activity (pH)" subtitle="Chemical acidity / alkalinity balance">
              <TrendAreaChart data={history.ph} color="#2563eb" />
            </ChartCard>
            <ChartCard title="Electrical Conductivity (EC)" subtitle="Soil salinity concentration index">
              <TrendAreaChart data={history.ec} color="#7c3aed" unit=" mS/cm" />
            </ChartCard>
          </div>

          {/* NPK Breakdown Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="tactile-card bg-white p-5">
              <div className="border-b border-earth-200 pb-3 mb-4">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
                  // MACRONUTRIENT BALANCE
                </span>
                <h3 className="font-display text-sm font-bold uppercase tracking-tight text-earth-900">
                  NPK Chemical Composition
                </h3>
              </div>
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

            <div className="space-y-4">
              <ChartCard title="Nitrogen (N) Trajectory" subtitle="Concentration in parts per million (ppm)">
                <TrendAreaChart data={history.nitrogen} color="#1b6d33" unit=" ppm" />
              </ChartCard>
              <ChartCard title="Phosphorus (P) Trajectory" subtitle="Available orthophosphate in ppm">
                <TrendAreaChart data={history.phosphorus} color="#ca8a04" unit=" ppm" />
              </ChartCard>
              <ChartCard title="Potassium (K) Trajectory" subtitle="Exchangeable potassium in ppm">
                <TrendAreaChart data={history.potassium} color="#b91c1c" unit=" ppm" />
              </ChartCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ReadingCard({
  label,
  value,
  status,
  statusColor,
}: {
  label: string;
  value: string;
  status: string;
  statusColor: string;
}) {
  return (
    <div className="tactile-card bg-white p-4">
      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-earth-500">
        {label}
      </span>
      <p className="mt-1 font-mono text-xl font-bold tracking-tight text-earth-900">{value}</p>
      <div className="mt-2 flex items-center justify-between border-t border-earth-200 pt-2 font-mono text-[10px]">
        <span className="text-earth-400">STATE:</span>
        <span className={statusColor}>{status}</span>
      </div>
    </div>
  );
}

function AnalysisItem({ label, status }: { label: string; status: NutrientStatus }) {
  const style = statusStyles[status] || statusStyles['Good'];
  return (
    <div className={`border p-2.5 ${style.border} ${style.bg}`}>
      <span className="text-[10px] uppercase text-earth-600">{label}</span>
      <p className={`mt-0.5 text-xs font-bold uppercase tracking-wide ${style.text}`}>
        {status}
      </p>
    </div>
  );
}
