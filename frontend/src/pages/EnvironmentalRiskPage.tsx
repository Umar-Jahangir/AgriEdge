import { useState } from 'react';
import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
  Thermometer,
  Droplets,
  Wind,
  Waves,
  AlertTriangle,
  Volume2,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { ChartCard, TrendAreaChart } from '../components/ui/ChartCard';
import { TimeRangeSelector } from '../components/ui/TimeRangeSelector';
import { RiskBadge } from '../components/ui/StatusBadge';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { useEnvironmentalRisk, useSensorHistory } from '../hooks/useData';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../utils/cn';

const timeOptions = [
  { value: 'today', label: 'TODAY' },
  { value: '7d', label: '7 DAYS' },
  { value: '30d', label: '30 DAYS' },
];

export function EnvironmentalRiskPage() {
  const [range, setRange] = useState<'today' | '7d' | '30d'>('7d');
  const { data: risk, loading, error, refetch } = useEnvironmentalRisk();
  const { data: history, loading: historyLoading } = useSensorHistory(range);
  const { t, language, speakText, isSpeaking } = useLanguage();

  if (loading) return <LoadingState message="Connecting to live satellite & GloFAS flood models..." />;
  if (error || !risk) return <ErrorState message={error || 'Failed to load telemetry'} onRetry={refetch} />;

  const cw = risk.currentWeather;
  const preds = risk.predictions;
  const forecast = risk.dailyForecast || [];
  const currentAdvisory = risk.advisories?.[language] || risk.advisories?.en;

  const handleSpeakAdvisory = () => {
    if (!currentAdvisory) return;
    const textToSpeak = `${currentAdvisory.title}. ${currentAdvisory.action} ${currentAdvisory.cause}`;
    speakText(textToSpeak, language);
  };

  const getWeatherIcon = (iconName?: string) => {
    switch (iconName) {
      case 'sun':
        return <Sun className="h-6 w-6 text-amber-500" />;
      case 'cloud-sun':
        return <CloudSun className="h-6 w-6 text-amber-600" />;
      case 'cloud':
        return <Cloud className="h-6 w-6 text-earth-500" />;
      case 'cloud-drizzle':
        return <CloudDrizzle className="h-6 w-6 text-sky-500" />;
      case 'cloud-rain':
      case 'cloud-rain-heavy':
        return <CloudRain className="h-6 w-6 text-blue-600" />;
      case 'cloud-lightning':
      case 'cloud-hail':
        return <CloudLightning className="h-6 w-6 text-indigo-600" />;
      case 'cloud-fog':
        return <CloudFog className="h-6 w-6 text-earth-400" />;
      default:
        return <CloudSun className="h-6 w-6 text-amber-500" />;
    }
  };

  const localizedCondition =
    language === 'hi'
      ? cw?.conditionHi || cw?.condition
      : language === 'mr'
      ? cw?.conditionMr || cw?.condition
      : cw?.condition;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-earth-300 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-farm-800">
              {t('liveWeatherTitle')}
            </span>
            <span className="rounded bg-earth-100 px-2 py-0.5 text-[10px] font-semibold text-earth-700">
              Open-Meteo & GloFAS
            </span>
          </div>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-earth-950 sm:text-3xl">
            {t('environmentalRisk')} & Weather Intelligence
          </h2>
          <p className="mt-0.5 text-xs text-earth-600">
            Open-source Copernicus GloFAS flood & FAO-56 SPEI drought models fused with in-situ rover sensors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TimeRangeSelector options={timeOptions} value={range} onChange={(v) => setRange(v as typeof range)} />
        </div>
      </div>

      {/* Live Atmospheric Ribbon */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Current Weather Pill */}
        <div className="border border-earth-300 bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-earth-200 pb-2">
            <span className="text-xs font-semibold text-earth-600">
              {localizedCondition || 'Current Weather'}
            </span>
            {getWeatherIcon(cw?.icon)}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-earth-950">
              {cw?.temperature ?? risk.airTemperature}°C
            </span>
            {cw?.apparentTemperature && (
              <span className="text-xs text-earth-500 font-medium">
                Feels {cw.apparentTemperature}°C
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-earth-500 flex justify-between">
            <span>{t('windSpeedLabel')}: {cw?.windSpeed ?? 8} km/h</span>
            <span>Rain: {cw?.precipitationRate ?? 0} mm/h</span>
          </div>
        </div>

        {/* Ambient Humidity */}
        <div className="border border-earth-300 bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-earth-200 pb-2">
            <span className="text-xs font-semibold text-earth-600">Relative Air Humidity</span>
            <Wind className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2 font-display text-3xl font-extrabold text-earth-950">
            {cw?.humidity ?? risk.humidity}%
          </p>
          <p className="mt-2 text-xs text-earth-500">
            {cw?.humidity && cw.humidity > 80 ? 'High — Fungal Spore Risk' : 'Normal Daytime Moisture'}
          </p>
        </div>

        {/* In-Situ Subterranean Temperature */}
        <div className="border border-earth-300 bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-earth-200 pb-2">
            <span className="text-xs font-semibold text-earth-600">Subterranean Soil Temp</span>
            <Thermometer className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 font-display text-3xl font-extrabold text-earth-950">
            {risk.soilTemperature}°C
          </p>
          <p className="mt-2 text-xs text-earth-500">
            Rover probe reading at 15cm root zone
          </p>
        </div>

        {/* In-Situ Soil Moisture */}
        <div className="border border-earth-300 bg-white p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-earth-200 pb-2">
            <span className="text-xs font-semibold text-earth-600">Soil Moisture Saturation</span>
            <Droplets className="h-4 w-4 text-farm-600" />
          </div>
          <p className="mt-2 font-display text-3xl font-extrabold text-earth-950">
            {risk.soilMoisture}%
          </p>
          <p className="mt-2 text-xs text-earth-500">
            {risk.soilMoisture < 30 ? 'Low — Irrigation Needed' : 'Adequate root hydration'}
          </p>
        </div>
      </div>

      {/* Actionable Agro-Climatic Advisory with ElevenLabs Read-Aloud */}
      {currentAdvisory && (
        <div className="border-2 border-farm-800 bg-farm-50/70 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-farm-900 text-farm-200 mt-0.5">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-farm-800">
                  {t('agroAdvisoryTitle')}
                </span>
                <h3 className="text-base font-bold text-earth-950 mt-0.5">
                  {currentAdvisory.title}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-earth-800 leading-relaxed font-medium">
                  {currentAdvisory.action}
                </p>
                <p className="mt-1 text-xs text-earth-600">
                  {currentAdvisory.cause}
                </p>
              </div>
            </div>

            <button
              onClick={handleSpeakAdvisory}
              disabled={isSpeaking}
              className={cn(
                'inline-flex items-center gap-1.5 rounded border border-farm-800 bg-white px-3 py-1.5 text-xs font-bold text-farm-900 shadow-2xs transition-all hover:bg-farm-100 shrink-0 self-start',
                isSpeaking && 'animate-pulse bg-farm-200'
              )}
            >
              <Volume2 className={cn('h-4 w-4 text-farm-800', isSpeaking && 'animate-bounce')} />
              <span>{isSpeaking ? t('readingOutLoud') : t('readAloud')}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4 Open-Source Agro-Meteorological Prediction Models */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-earth-900">
            Open-Source Risk Prediction Models
          </h3>
          <span className="text-xs text-earth-500 font-medium">
            Scientific Agro-Hydrological Models
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* 1. Flood & Waterlogging Prediction */}
          <div className="border border-earth-300 bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Waves className="h-4 w-4 text-blue-700" />
                  <h4 className="font-display text-sm font-bold text-earth-900">{t('floodRisk')}</h4>
                </div>
                <RiskBadge risk={preds?.flood.severity || risk.floodRisk} />
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold text-earth-950">
                  {preds?.flood.probability ?? 25}%
                </span>
                <span className="text-xs text-earth-500">Probability</span>
              </div>

              <div className="mt-3 space-y-1.5 border-t border-earth-100 pt-2.5 text-xs">
                <div className="flex justify-between text-earth-600">
                  <span>{t('rainForecast')}:</span>
                  <span className="font-bold text-earth-900">{preds?.flood.rain48hForecastMm ?? 0} mm</span>
                </div>
                <div className="flex justify-between text-earth-600">
                  <span>{t('riverDischarge')}:</span>
                  <span className="font-bold text-earth-900">{preds?.flood.peakRiverDischargeM3s ?? 35} m³/s</span>
                </div>
                <div className="flex justify-between text-earth-600">
                  <span>{t('soilSaturationRunoff')}:</span>
                  <span className="font-bold text-farm-800">{preds?.flood.surfaceRunoffRisk ?? 'LOW'}</span>
                </div>
              </div>
            </div>

            <p className="mt-3 border-t border-earth-100 pt-2 text-[10px] text-earth-500">
              {preds?.flood.model || t('floodModel')}
            </p>
          </div>

          {/* 2. Drought & Soil Water Deficit Prediction */}
          <div className="border border-earth-300 bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Droplets className="h-4 w-4 text-amber-700" />
                  <h4 className="font-display text-sm font-bold text-earth-900">{t('droughtRisk')}</h4>
                </div>
                <RiskBadge risk={preds?.drought.severity || risk.droughtRisk} />
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold text-earth-950">
                  {preds?.drought.probability ?? 45}%
                </span>
                <span className="text-xs text-earth-500">Probability</span>
              </div>

              <div className="mt-3 space-y-1.5 border-t border-earth-100 pt-2.5 text-xs">
                <div className="flex justify-between text-earth-600">
                  <span>{t('waterBalance')}:</span>
                  <span className={cn('font-bold', (preds?.drought.netWaterBalance7dMm ?? 0) < 0 ? 'text-amber-800' : 'text-farm-800')}>
                    {preds?.drought.netWaterBalance7dMm ?? -12} mm
                  </span>
                </div>
                <div className="flex justify-between text-earth-600">
                  <span>{t('daysWaterReserve')}:</span>
                  <span className="font-bold text-earth-900">{preds?.drought.daysOfWaterReserve ?? 4.5} days</span>
                </div>
                <div className="flex justify-between text-earth-600">
                  <span>{t('evapotranspiration')}:</span>
                  <span className="font-bold text-earth-900">{preds?.drought.totalEvapotranspiration7dMm ?? 28} mm</span>
                </div>
              </div>
            </div>

            <p className="mt-3 border-t border-earth-100 pt-2 text-[10px] text-earth-500">
              {preds?.drought.model || t('droughtModel')}
            </p>
          </div>

          {/* 3. Heat Wave Prediction (IMD Standards) */}
          <div className="border border-earth-300 bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="h-4 w-4 text-red-600" />
                  <h4 className="font-display text-sm font-bold text-earth-900">{t('heatStressRisk')}</h4>
                </div>
                <RiskBadge risk={preds?.heatStress.severity || risk.heatStressRisk} />
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold text-earth-950">
                  {preds?.heatStress.probability ?? 30}%
                </span>
                <span className="text-xs text-earth-500">Probability</span>
              </div>

              <div className="mt-3 space-y-1.5 border-t border-earth-100 pt-2.5 text-xs">
                <div className="flex justify-between text-earth-600">
                  <span>Peak Max Temp:</span>
                  <span className="font-bold text-earth-900">{preds?.heatStress.peakTempForecast ?? 33}°C</span>
                </div>
                <div className="flex justify-between text-earth-600">
                  <span>{t('apparentTemp')}:</span>
                  <span className="font-bold text-earth-900">{preds?.heatStress.apparentHeatIndex ?? 34}°C</span>
                </div>
                <div className="flex justify-between text-earth-600">
                  <span>IMD Status:</span>
                  <span className="font-bold text-farm-800">{preds?.heatStress.imdStatus ?? 'Normal'}</span>
                </div>
              </div>
            </div>

            <p className="mt-3 border-t border-earth-100 pt-2 text-[10px] text-earth-500">
              {preds?.heatStress.model || t('heatWaveModel')}
            </p>
          </div>

          {/* 4. Foliar Disease Epidemic Prediction */}
          <div className="border border-earth-300 bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <h4 className="font-display text-sm font-bold text-earth-900">{t('diseaseRisk')}</h4>
                </div>
                <RiskBadge risk={preds?.foliarDisease.severity || risk.cropDiseaseRisk} />
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold text-earth-950">
                  {preds?.foliarDisease.probability ?? 25}%
                </span>
                <span className="text-xs text-earth-500">Probability</span>
              </div>

              <div className="mt-3 space-y-1.5 border-t border-earth-100 pt-2.5 text-xs">
                <div className="flex justify-between text-earth-600">
                  <span>Relative Humidity:</span>
                  <span className="font-bold text-earth-900">{preds?.foliarDisease.relativeHumidity ?? 65}%</span>
                </div>
                <div className="flex justify-between text-earth-600">
                  <span>Infection Window:</span>
                  <span className={cn('font-bold', preds?.foliarDisease.infectionWindowActive ? 'text-amber-800' : 'text-farm-800')}>
                    {preds?.foliarDisease.infectionWindowActive ? 'Active Window' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between text-earth-600">
                  <span>Fungal Spore Risk:</span>
                  <span className="font-bold text-earth-900">{preds?.foliarDisease.severity ?? 'LOW'}</span>
                </div>
              </div>
            </div>

            <p className="mt-3 border-t border-earth-100 pt-2 text-[10px] text-earth-500">
              {preds?.foliarDisease.model || t('diseaseModel')}
            </p>
          </div>
        </div>
      </div>

      {/* 7-Day Weather & Precipitation Forecast */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-farm-800" />
            <h3 className="font-display text-base font-bold text-earth-900">
              {t('sevenDayForecast')}
            </h3>
          </div>
          <span className="text-xs text-earth-500 font-medium">Daily Agro-Meteorology</span>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
          {forecast.map((f, idx) => {
            const locCond = language === 'hi' ? f.conditionHi || f.condition : language === 'mr' ? f.conditionMr || f.condition : f.condition;
            const dayName = new Date(f.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US', { weekday: 'short' });

            return (
              <div
                key={f.date || idx}
                className={cn(
                  'border border-earth-200 bg-white p-3 rounded shadow-2xs flex flex-col justify-between text-center',
                  idx === 0 && 'border-farm-700 bg-farm-50/30'
                )}
              >
                <div>
                  <span className="text-xs font-bold text-earth-700 block uppercase">
                    {idx === 0 ? 'Today' : dayName}
                  </span>
                  <span className="text-[10px] text-earth-400 block">{f.date}</span>

                  <div className="my-2 flex justify-center">
                    {getWeatherIcon(f.icon)}
                  </div>

                  <span className="text-[11px] font-semibold text-earth-900 block truncate" title={locCond}>
                    {locCond}
                  </span>
                </div>

                <div className="mt-3 border-t border-earth-100 pt-2 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-earth-900">
                    <span>{f.tempMax}°</span>
                    <span className="text-earth-400 font-normal">{f.tempMin}°</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-blue-700 font-medium">
                    <span>Rain:</span>
                    <span>{f.precipitationMm} mm</span>
                  </div>
                  {f.riverDischargeM3s > 0 && (
                    <div className="flex justify-between text-[10px] text-earth-500">
                      <span>GloFAS:</span>
                      <span>{f.riverDischargeM3s} m³</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Subterranean Soil Charts */}
      {historyLoading ? (
        <LoadingState message="Compiling subterranean telemetry charts..." />
      ) : history ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Subterranean Moisture Dynamics" subtitle="7-day volumetric water saturation curve">
            <TrendAreaChart data={history.soilMoisture} color="#1b6d33" unit="%" />
          </ChartCard>
          <ChartCard title="Sub-Surface Thermal Gradient" subtitle="Soil probe temperature variations measured in Celsius">
            <TrendAreaChart data={history.soilTemperature} color="#d97706" unit="°C" />
          </ChartCard>
        </div>
      ) : null}
    </div>
  );
}
