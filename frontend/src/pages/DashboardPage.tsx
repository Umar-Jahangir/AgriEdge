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
import { SmartIrrigationCard } from '../components/irrigation/SmartIrrigationCard';
import { YieldProtectionCard } from '../components/yield/YieldProtectionCard';
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
      {/* Farmer Greeting & Quick Status */}
      <div className="border border-earth-300 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-farm-800">
              <span className="h-2.5 w-2.5 rounded-full bg-farm-600" />
              <span>{t('farmOverview')}</span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-earth-950 sm:text-3xl">
              {dashboard.farmStatus === 'Healthy' ? 'All Crops & Soil Healthy' : 'Action Required on Field'}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-earth-600">
              {t('farmOverviewSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-earth-200 bg-earth-50/60 p-3">
            <div>
              <span className="text-[11px] font-medium text-earth-500 block">{t('farmCondition')}</span>
              <div className="mt-0.5">
                <StatusBadge label={dashboard.farmStatus} variant={farmStatusVariant} dot />
              </div>
            </div>
            <div className="border-l border-earth-200 pl-4">
              <span className="text-[11px] font-medium text-earth-500 block">Last Update</span>
              <span className="text-xs font-bold text-earth-900">{dashboard.lastSynchronized || dashboard.lastScan}</span>
            </div>
          </div>
        </div>
      </div>

      {/* High-Readability Metric Grid */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Tile 1: Primary Soil Health Score */}
        <div className="border border-earth-300 bg-white p-6 lg:col-span-2 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-farm-700" />
                <h3 className="font-display text-base font-bold text-earth-900">
                  {t('soilHealthIndexTitle')}
                </h3>
              </div>
              <span className={cn('px-2.5 py-1 text-xs font-bold border rounded', healthStatusColor(dashboard.soilConditionStatus))}>
                {dashboard.soilConditionStatus}
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-earth-950">
                {dashboard.soilConditionScore}
              </span>
              <span className="text-lg font-medium text-earth-400">/ 100</span>
            </div>

            <p className="mt-2 text-xs sm:text-sm text-earth-600 leading-relaxed">
              {t('soilHealthExplanation')}
            </p>
          </div>

          <div className="mt-6 border-t border-earth-200 pt-4">
            <div className="h-3 w-full rounded-full bg-earth-100 overflow-hidden flex border border-earth-200">
              <div
                className="h-full bg-farm-600 transition-all duration-700 rounded-full"
                style={{ width: `${dashboard.soilConditionScore}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] font-medium text-earth-500">
              <span>Low (0-40)</span>
              <span>Moderate (41-70)</span>
              <span>Optimal (71-100)</span>
            </div>
          </div>
        </div>

        {/* Tile 2: Soil Moisture */}
        <div className="border border-earth-300 bg-white p-5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-earth-900">{t('soilMoisture')}</h3>
              <Droplets className="h-5 w-5 text-sky-600" />
            </div>
            <p className="mt-3 font-display text-3xl font-extrabold text-earth-950">
              {dashboard.soilMoisture}%
            </p>
            <p className="mt-1 text-xs text-earth-600 font-medium">
              Status: <span className="font-bold text-amber-800">{dashboard.soilMoistureStatus}</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-earth-100 text-xs text-earth-500 font-medium">
            {t('healthyTarget')}: 38% – 50%
          </div>
        </div>

        {/* Tile 3: Field Temperature */}
        <div className="border border-earth-300 bg-white p-5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-earth-900">{t('fieldTemperature')}</h3>
              <Thermometer className="h-5 w-5 text-amber-600" />
            </div>
            <p className="mt-3 font-display text-3xl font-extrabold text-earth-950">
              {dashboard.temperature}°C
            </p>
            <p className="mt-1 text-xs text-earth-600 font-medium">
              Soil:{' '}
              <span className="font-semibold text-earth-900">
                {dashboard.soilTemperature != null ? `${dashboard.soilTemperature}°C` : '—'}
              </span>
              {' '}· Air:{' '}
              <span className="font-semibold text-earth-900">{dashboard.temperature}°C</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-earth-100 text-xs text-earth-500 font-medium">
            Normal daytime field climate
          </div>
        </div>

        {/* Tile 4: Soil Nutrients (NPK) */}
        <div className="border border-earth-300 bg-white p-5 lg:col-span-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-earth-900">{t('nutrientsTitle')}</h3>
            <span className="text-xs text-earth-500">Values in ppm</span>
          </div>

          <div className="mt-3.5 grid grid-cols-3 gap-3">
            <div className="border border-earth-200 bg-earth-50/60 p-3 rounded">
              <span className="text-xs font-semibold text-earth-600 block">{t('nitrogen')}</span>
              <p className="mt-1 font-display text-2xl font-bold text-earth-950">{dashboard.npk.nitrogen}</p>
              <span className="mt-1 inline-block text-[11px] font-semibold text-farm-800">
                {dashboard.npk.nitrogenStatus}
              </span>
            </div>
            <div className="border border-earth-200 bg-earth-50/60 p-3 rounded">
              <span className="text-xs font-semibold text-earth-600 block">{t('phosphorus')}</span>
              <p className="mt-1 font-display text-2xl font-bold text-earth-950">{dashboard.npk.phosphorus}</p>
              <span className="mt-1 inline-block text-[11px] font-semibold text-farm-800">
                {dashboard.npk.phosphorusStatus}
              </span>
            </div>
            <div className="border border-earth-200 bg-earth-50/60 p-3 rounded">
              <span className="text-xs font-semibold text-earth-600 block">{t('potassium')}</span>
              <p className="mt-1 font-display text-2xl font-bold text-earth-950">{dashboard.npk.potassium}</p>
              <span className="mt-1 inline-block text-[11px] font-semibold text-farm-800">
                {dashboard.npk.potassiumStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Tile 5: Soil pH & Salinity */}
        <div className="border border-earth-300 bg-white p-5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-earth-900">{t('soilAcidity')}</h3>
              <FlaskConical className="h-5 w-7 text-farm-700" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-earth-500 block">pH Level</span>
                <p className="font-display text-2xl font-bold text-earth-950">{dashboard.soilPh}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-earth-500 block">{t('salinityEC')}</span>
                <p className="font-display text-xl font-bold text-earth-950">{dashboard.electricalConductivity} <span className="text-xs font-normal">mS</span></p>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-earth-100 text-xs text-farm-800 font-medium">
            Optimal for crop root growth
          </div>
        </div>

        {/* Tile 6: Crop Health & Water Stress */}
        <div className="border border-earth-300 bg-white p-5 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-earth-900">{t('cropVigor')}</h3>
              <Leaf className="h-5 w-5 text-farm-600" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-earth-500 block">{t('cropHealthPercent')}</span>
                <p className="font-display text-2xl font-bold text-farm-700">{dashboard.cropHealth}%</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-earth-500 block">{t('waterStressRisk')}</span>
                <p className="font-display text-lg font-bold text-amber-800">{dashboard.waterStress}</p>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-earth-100 text-xs text-earth-600 font-medium">
            Scanned by on-device camera
          </div>
        </div>
      </div>

      {/* Smart Precision Irrigation & Solenoid Control */}
      <SmartIrrigationCard />

      {/* Yield-Risk Forecasting & Crop Phenology */}
      <YieldProtectionCard />

      {/* Field Map + Priority Advisories */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Field Map Section (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-earth-900">{t('farmMapAndPath')}</h3>
            <span className="text-xs text-earth-500">Sector View</span>
          </div>
          {farmMap && <FarmMap data={farmMap} />}
          {farmMap && (
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <div className="border border-earth-300 bg-white p-2.5 text-center">
                <span className="text-[11px] text-earth-500 block">{t('roverStatus')}</span>
                <span className="font-bold text-earth-950">{farmMap.rover.state}</span>
              </div>
              <div className="border border-earth-300 bg-white p-2.5 text-center">
                <span className="text-[11px] text-earth-500 block">{t('waypoints')}</span>
                <span className="font-bold text-earth-950">Pt {farmMap.rover.currentSamplingPoint} of {farmMap.rover.totalSamplingPoints}</span>
              </div>
              <div className="border border-earth-300 bg-white p-2.5 text-center">
                <span className="text-[11px] text-earth-500 block">{t('distanceCovered')}</span>
                <span className="font-bold text-earth-950">{farmMap.rover.distanceCovered} km</span>
              </div>
              <div className="border border-earth-300 bg-white p-2.5 text-center">
                <span className="text-[11px] text-earth-500 block">{t('battery')}</span>
                <span className="font-bold text-farm-700">{farmMap.rover.battery}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Actionable Field Advisories (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-earth-900">{t('todayActionPlan')}</h3>
            <span className="text-xs font-semibold text-farm-800">Voice Enabled</span>
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
