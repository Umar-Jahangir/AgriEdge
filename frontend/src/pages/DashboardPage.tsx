import {
  Droplets,
  Thermometer,
  FlaskConical,
  Leaf,
} from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { FarmMap } from '../components/farm/FarmMap';
import { RecommendationCard } from '../components/recommendations/RecommendationCard';
import { useDashboard, useFarmMap, useRecommendations } from '../hooks/useData';
import { useLanguage } from '../context/LanguageContext';
import { healthStatusColor } from '../utils/format';
import { cn } from '../utils/cn';

export function DashboardPage() {
  const { data: dashboard, loading, error, refetch } = useDashboard();
  const { data: farmMap } = useFarmMap();
  const { data: recommendations } = useRecommendations();
  const { t } = useLanguage();

  if (loading) return <LoadingState message="Connecting to rover telemetry..." />;
  if (error || !dashboard) return <ErrorState message={error || 'Failed to load'} onRetry={refetch} />;

  const farmStatusVariant =
    dashboard.farmStatus === 'Healthy' ? 'success' : dashboard.farmStatus === 'Critical' ? 'danger' : 'warning';

  return (
    <div className="animate-fade-in space-y-6">
      {/* Field Workstation Hero Header */}
      <div className="border border-earth-300 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-earth-500">
              <span className="h-2 w-2 bg-farm-600" />
              <span>FIELD INTELLIGENCE STATION // SECTOR OVERVIEW</span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-earth-950 sm:text-3xl">
              {t('dashboard')} — Autonomous Crop & Soil Telemetry
            </h2>
            <p className="mt-0.5 text-xs text-earth-600 font-medium">
              Real-time in-situ sampling by AgriEdge Rover · On-device Edge AI inference
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 border border-earth-200 bg-earth-50/70 p-2 font-mono text-[11px]">
            <div className="px-2 py-1 border-r border-earth-200">
              <span className="text-earth-500 block text-[9px] font-bold">FARM STATUS</span>
              <StatusBadge label={dashboard.farmStatus} variant={farmStatusVariant} dot />
            </div>
            <div className="px-2 py-1 border-r border-earth-200">
              <span className="text-earth-500 block text-[9px] font-bold">{t('roverStatus')}</span>
              <span className="font-bold text-earth-900">{dashboard.roverStatus}</span>
            </div>
            <div className="px-2 py-1 border-r border-earth-200">
              <span className="text-earth-500 block text-[9px] font-bold">LINK STATUS</span>
              <span className="font-bold text-farm-700">100% {t('connected')}</span>
            </div>
            <div className="px-2 py-1">
              <span className="text-earth-500 block text-[9px] font-bold">LAST TELEMETRY</span>
              <span className="font-bold text-earth-800">{dashboard.lastScan}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Asymmetric Bento Grid */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Tile 1: Primary Hero Telemetry (Spans 2 cols) */}
        <div className="border border-earth-300 bg-white p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between font-mono text-[11px] font-bold uppercase tracking-wider text-earth-500">
              <span>// {t('soilConditionScore').toUpperCase()}</span>
              <span className="text-[10px] bg-farm-100 px-2 py-0.5 text-farm-800 font-mono">
                [IN-SITU PROBE]
              </span>
            </div>
            
            <div className="mt-4 flex items-baseline gap-3">
              <p className="font-mono text-5xl font-bold tracking-tight text-earth-950 sm:text-6xl">
                {dashboard.soilConditionScore}
              </p>
              <span className="font-mono text-lg text-earth-400">/ 100</span>
              <span className={cn('ml-auto px-2.5 py-1 font-mono text-xs font-bold uppercase border border-current', healthStatusColor(dashboard.soilConditionStatus))}>
                {dashboard.soilConditionStatus}
              </span>
            </div>

            <p className="mt-3 text-xs text-earth-600 font-medium">
              Multi-sensor index synthesized from volumetric moisture, pH probe, electrical conductivity, NPK spectroscopy, and thermal probes.
            </p>
          </div>

          <div className="mt-6 border-t border-earth-200 pt-4">
            <div className="h-3 w-full bg-earth-100 overflow-hidden flex border border-earth-300">
              <div
                className="h-full bg-farm-600 transition-all duration-700"
                style={{ width: `${dashboard.soilConditionScore}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-earth-500">
              <span>0 (CRITICAL)</span>
              <span>50 (MODERATE)</span>
              <span>100 (OPTIMAL)</span>
            </div>
          </div>
        </div>

        {/* Tile 2: Soil Moisture */}
        <div className="border border-earth-300 bg-white p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between font-mono text-[11px] font-bold uppercase tracking-wider text-earth-500">
              <span>// {t('soilMoisture').toUpperCase()}</span>
              <Droplets className="h-4 w-4 text-farm-600" />
            </div>
            <p className="mt-3 font-mono text-3xl font-bold text-earth-950">
              {dashboard.soilMoisture}%
            </p>
            <p className="mt-1 text-xs text-earth-600 font-medium">
              Status: <span className="font-bold text-amber-700">{dashboard.soilMoistureStatus}</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-earth-100 font-mono text-[10px] text-earth-500">
            TARGET RANGE: 38% - 50%
          </div>
        </div>

        {/* Tile 3: Ambient & Soil Temperature */}
        <div className="border border-earth-300 bg-white p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between font-mono text-[11px] font-bold uppercase tracking-wider text-earth-500">
              <span>// {t('soilTemperature').toUpperCase()}</span>
              <Thermometer className="h-4 w-4 text-farm-600" />
            </div>
            <p className="mt-3 font-mono text-3xl font-bold text-earth-950">
              {dashboard.temperature}°C
            </p>
            <p className="mt-1 text-xs text-earth-600 font-medium">
              Probe: <span className="font-mono text-earth-900 font-bold">24.1°C SOIL / 25.6°C AIR</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-earth-100 font-mono text-[10px] text-earth-500">
            DIURNAL SWING: NORMAL
          </div>
        </div>

        {/* Tile 4: NPK Soil Chemistry (Spans 2 cols) */}
        <div className="border border-earth-300 bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between font-mono text-[11px] font-bold uppercase tracking-wider text-earth-500">
            <span>// SOIL NUTRIENT PROFILE (NPK RATIO)</span>
            <span className="font-mono text-[10px] text-earth-500">VALUES IN PPM</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="border border-earth-200 bg-earth-50/50 p-3">
              <span className="font-mono text-[10px] text-earth-500 block">{t('nitrogen').toUpperCase()}</span>
              <p className="mt-1 font-mono text-2xl font-bold text-earth-950">{dashboard.npk.nitrogen}</p>
              <span className="mt-1 inline-block text-[10px] font-mono font-bold text-farm-700">
                [{dashboard.npk.nitrogenStatus.toUpperCase()}]
              </span>
            </div>
            <div className="border border-earth-200 bg-earth-50/50 p-3">
              <span className="font-mono text-[10px] text-earth-500 block">{t('phosphorus').toUpperCase()}</span>
              <p className="mt-1 font-mono text-2xl font-bold text-earth-950">{dashboard.npk.phosphorus}</p>
              <span className="mt-1 inline-block text-[10px] font-mono font-bold text-farm-700">
                [{dashboard.npk.phosphorusStatus.toUpperCase()}]
              </span>
            </div>
            <div className="border border-earth-200 bg-earth-50/50 p-3">
              <span className="font-mono text-[10px] text-earth-500 block">{t('potassium').toUpperCase()}</span>
              <p className="mt-1 font-mono text-2xl font-bold text-earth-950">{dashboard.npk.potassium}</p>
              <span className="mt-1 inline-block text-[10px] font-mono font-bold text-farm-700">
                [{dashboard.npk.potassiumStatus.toUpperCase()}]
              </span>
            </div>
          </div>
        </div>

        {/* Tile 5: Soil Chemistry pH & EC */}
        <div className="border border-earth-300 bg-white p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between font-mono text-[11px] font-bold uppercase tracking-wider text-earth-500">
              <span>// {t('soilPh').toUpperCase()} & {t('electricalConductivity').toUpperCase()}</span>
              <FlaskConical className="h-4 w-4 text-farm-600" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] font-mono text-earth-400">pH LEVEL</span>
                <p className="font-mono text-2xl font-bold text-earth-950">{dashboard.soilPh}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-earth-400">EC</span>
                <p className="font-mono text-xl font-bold text-earth-950">{dashboard.electricalConductivity} <span className="text-xs">mS</span></p>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-earth-100 font-mono text-[10px] text-earth-600">
            ROOT ZONE ACIDITY: OPTIMAL
          </div>
        </div>

        {/* Tile 6: Crop Health & Water Stress */}
        <div className="border border-earth-300 bg-white p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between font-mono text-[11px] font-bold uppercase tracking-wider text-earth-500">
              <span>// {t('cropVigor').toUpperCase()}</span>
              <Leaf className="h-4 w-4 text-farm-600" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] font-mono text-earth-400">{t('cropHealthPercent').toUpperCase()}</span>
                <p className="font-mono text-2xl font-bold text-farm-700">{dashboard.cropHealth}%</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-earth-400">{t('waterStressRisk').toUpperCase()}</span>
                <p className="font-mono text-lg font-bold text-amber-700">[{dashboard.waterStress}]</p>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-earth-100 font-mono text-[10px] text-earth-600">
            EDGE AI VISION: NOMINAL
          </div>
        </div>
      </div>

      {/* Field Map + Priority Advisories */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Field Map Section (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between font-mono text-xs font-bold uppercase text-earth-600">
            <span>// {t('fieldTopography')}</span>
            <span className="text-[10px] text-earth-400">[{t('coordinateGridTitle')}]</span>
          </div>
          {farmMap && <FarmMap data={farmMap} />}
          {farmMap && (
            <div className="grid grid-cols-2 gap-2 font-mono text-xs sm:grid-cols-4">
              <div className="border border-earth-300 bg-white p-2 text-center">
                <span className="text-[10px] text-earth-500 block">{t('roverStatus')}</span>
                <span className="font-bold text-earth-950">{farmMap.rover.state}</span>
              </div>
              <div className="border border-earth-300 bg-white p-2 text-center">
                <span className="text-[10px] text-earth-500 block">{t('waypoints')}</span>
                <span className="font-bold text-earth-950">Pt {farmMap.rover.currentSamplingPoint} of {farmMap.rover.totalSamplingPoints}</span>
              </div>
              <div className="border border-earth-300 bg-white p-2 text-center">
                <span className="text-[10px] text-earth-500 block">{t('distanceCovered')}</span>
                <span className="font-bold text-earth-950">{farmMap.rover.distanceCovered} km</span>
              </div>
              <div className="border border-earth-300 bg-white p-2 text-center">
                <span className="text-[10px] text-earth-500 block">{t('battery')}</span>
                <span className="font-bold text-farm-700">{farmMap.rover.battery}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Actionable Field Advisories (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between font-mono text-xs font-bold uppercase text-earth-600">
            <span>// {t('actionablePrescriptions')}</span>
            <span className="text-[10px] text-earth-400">[{t('aiFused')}]</span>
          </div>
          <div className="space-y-3">
            {recommendations?.slice(0, 3).map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
