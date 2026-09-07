import { useState } from 'react';
import {
  Droplets,
  Clock,
  Volume2,
  VolumeX,
  Power,
  CloudRain,
  CheckCircle2,
  TrendingDown,
  Waves,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useIrrigationSchedule } from '../../hooks/useData';
import { api } from '../../services/api';
import type { RelayState } from '../../types';
import { cn } from '../../utils/cn';

interface SmartIrrigationCardProps {
  lat?: number;
  lon?: number;
}

export function SmartIrrigationCard({ lat, lon }: SmartIrrigationCardProps) {
  const { language, t, speakText, stopSpeaking, isSpeaking } = useLanguage();
  const { data: schedule, loading, error } = useIrrigationSchedule(lat, lon);

  const [controlling, setControlling] = useState(false);
  const [localRelay, setLocalRelay] = useState<RelayState | null>(null);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const relay = localRelay || schedule?.relayState || {
    mode: 'AUTO',
    state: 'STANDBY',
    pumpActive: false,
  };

  const handleRelayChange = async (mode: 'AUTO' | 'MANUAL', state: 'STANDBY' | 'ACTIVE' | 'OFF') => {
    try {
      setControlling(true);
      const res = await api.setIrrigationValve(mode, state);
      setLocalRelay(res.relayState);
      setStatusFeedback(res.message);
      setTimeout(() => setStatusFeedback(null), 3500);
    } catch {
      setStatusFeedback('Failed to communicate with pump relay');
      setTimeout(() => setStatusFeedback(null), 3000);
    } finally {
      setControlling(false);
    }
  };

  const handleAudioReadout = async () => {
    if (!schedule) return;
    if (playingAudio && isSpeaking) {
      stopSpeaking();
      setPlayingAudio(false);
      return;
    }

    setPlayingAudio(true);
    const windowText =
      language === 'hi'
        ? schedule.nextWindowHi || schedule.nextWindow
        : language === 'mr'
        ? schedule.nextWindowMr || schedule.nextWindow
        : schedule.nextWindow;

    const rationaleText =
      language === 'hi'
        ? schedule.rationaleHi || schedule.rationale
        : language === 'mr'
        ? schedule.rationaleMr || schedule.rationale
        : schedule.rationale;

    const speechText = `${t('smartIrrigationTitle')}। ${t('nextScheduledSlot')}: ${windowText}। ${rationaleText}। ${t('waterRequired')}: ${schedule.waterVolumeLiters} ${t('litersUnit')}। ${t('waterSaved')}: ${schedule.waterSavedLiters} ${t('litersUnit')}।`;

    await speakText(speechText, language);
    setPlayingAudio(false);
  };

  if (loading && !schedule) {
    return (
      <div className="border border-earth-300 bg-white p-5 shadow-2xs animate-pulse">
        <div className="h-5 w-48 bg-earth-200 rounded mb-3" />
        <div className="h-4 w-72 bg-earth-100 rounded" />
      </div>
    );
  }

  if (error || !schedule) {
    return null;
  }

  // Localized texts
  const displayWindow =
    language === 'hi'
      ? schedule.nextWindowHi || schedule.nextWindow
      : language === 'mr'
      ? schedule.nextWindowMr || schedule.nextWindow
      : schedule.nextWindow;

  const displayRationale =
    language === 'hi'
      ? schedule.rationaleHi || schedule.rationale
      : language === 'mr'
      ? schedule.rationaleMr || schedule.rationale
      : schedule.rationale;

  const isDelayed = schedule.status === 'DELAYED_FOR_RAIN';
  const isRecommended = schedule.status === 'IRRIGATION_RECOMMENDED';

  const statusBadgeColor = isDelayed
    ? 'bg-blue-100 text-blue-900 border-blue-300'
    : isRecommended
    ? 'bg-amber-100 text-amber-950 border-amber-300'
    : 'bg-emerald-100 text-emerald-950 border-emerald-300';

  const statusTitle = isDelayed
    ? t('delayedForRainTitle')
    : isRecommended
    ? t('irrigationRecommendedTitle')
    : t('hydratedTitle');

  return (
    <div className="border border-earth-300 bg-white shadow-2xs transition-all">
      {/* Top Header */}
      <div className="border-b border-earth-200 bg-earth-50/70 p-4 sm:px-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white shadow-xs">
              <Droplets className="h-4 w-4" />
            </span>
            <h3 className="font-display text-base font-bold text-earth-950">
              {t('smartIrrigationTitle')}
            </h3>
            <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide', statusBadgeColor)}>
              {statusTitle}
            </span>
          </div>
          <p className="mt-1 text-xs text-earth-600">
            {t('smartIrrigationSubtitle')}
          </p>
        </div>

        {/* Audio Listen Button */}
        <button
          onClick={handleAudioReadout}
          className={cn(
            'inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 text-xs font-semibold rounded border transition-colors cursor-pointer',
            playingAudio && isSpeaking
              ? 'bg-farm-700 text-white border-farm-800 animate-pulse'
              : 'bg-white text-earth-800 border-earth-300 hover:bg-earth-100'
          )}
        >
          {playingAudio && isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-farm-700" />}
          <span>{playingAudio && isSpeaking ? t('readingOutLoud') : t('readAloud')}</span>
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Next Scheduled Slot Highlight Card */}
        <div className={cn(
          'p-4 rounded border flex flex-col sm:flex-row sm:items-center justify-between gap-4',
          isDelayed ? 'bg-blue-50/60 border-blue-200' : 'bg-farm-50/50 border-farm-200'
        )}>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-earth-600">
              <Clock className="h-3.5 w-3.5 text-farm-700" />
              <span>{t('nextScheduledSlot')}</span>
            </div>
            <div className="font-display text-xl sm:text-2xl font-extrabold text-earth-950 tracking-tight">
              {displayWindow}
            </div>
            <p className="text-xs sm:text-sm text-earth-700 leading-relaxed max-w-2xl">
              {displayRationale}
            </p>
          </div>

          <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-earth-200/80 pt-3 sm:pt-0 sm:pl-6 shrink-0">
            <span className="text-[11px] font-bold text-earth-500 uppercase tracking-wider">
              {t('durationLabel')}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-display text-3xl font-extrabold text-earth-950">
                {schedule.durationMinutes}
              </span>
              <span className="text-xs font-semibold text-earth-600">{t('minutesUnit')}</span>
            </div>
            <span className="text-[11px] text-farm-700 font-medium mt-0.5">
              {t('methodDrip')}
            </span>
          </div>
        </div>

        {/* 4 Precision Agro-Telemetry KPI Tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Water Required */}
          <div className="border border-earth-200 bg-earth-50/50 p-3.5 rounded">
            <div className="flex items-center justify-between text-xs text-earth-600">
              <span className="font-semibold">{t('waterRequired')}</span>
              <Droplets className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold text-earth-950">
                {schedule.waterVolumeLiters.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-earth-600">{t('litersUnit')}</span>
            </div>
            <span className="mt-1 block text-[11px] text-earth-500">
              Root-zone deficit: {Math.round(schedule.targetSoilMoisture - schedule.currentSoilMoisture)}%
            </span>
          </div>

          {/* Water Conserved */}
          <div className="border border-farm-200 bg-farm-50/40 p-3.5 rounded">
            <div className="flex items-center justify-between text-xs text-farm-900">
              <span className="font-semibold">{t('waterSaved')}</span>
              <TrendingDown className="h-3.5 w-3.5 text-farm-700" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold text-farm-800">
                +{schedule.waterSavedLiters.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-farm-700">{t('litersUnit')}</span>
            </div>
            <span className="mt-1 block text-[11px] font-medium text-farm-700">
              {isDelayed ? 'Delayed for rain forecast' : 'Morning 35% evaporative save'}
            </span>
          </div>

          {/* In-Situ Root Moisture */}
          <div className="border border-earth-200 bg-earth-50/50 p-3.5 rounded">
            <div className="flex items-center justify-between text-xs text-earth-600">
              <span className="font-semibold">{t('soilMoisture')}</span>
              <Waves className="h-3.5 w-3.5 text-farm-700" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold text-earth-950">
                {schedule.currentSoilMoisture}%
              </span>
              <span className="text-xs text-earth-500 font-medium">/ {schedule.targetSoilMoisture}% cap</span>
            </div>
            <span className="mt-1 block text-[11px] text-earth-500">
              Rover 15cm probe in-situ
            </span>
          </div>

          {/* 48h Rain Forecast / ET0 */}
          <div className="border border-earth-200 bg-earth-50/50 p-3.5 rounded">
            <div className="flex items-center justify-between text-xs text-earth-600">
              <span className="font-semibold">48h Rain Forecast</span>
              <CloudRain className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold text-earth-950">
                {schedule.rain48hForecastMm}
              </span>
              <span className="text-xs font-semibold text-earth-600">mm</span>
            </div>
            <span className="mt-1 block text-[11px] text-earth-500">
              ET₀: {schedule.evapotranspirationRateMm} mm/day
            </span>
          </div>
        </div>

        {/* Solenoid Valve Relay Control Box */}
        <div className="border border-earth-200 bg-earth-50/70 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Power className={cn('h-4 w-4', relay.pumpActive ? 'text-green-600 animate-pulse' : 'text-earth-500')} />
              <h4 className="font-display text-sm font-bold text-earth-950">
                {t('solenoidRelayTitle')}
              </h4>
              <span className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded border uppercase',
                relay.pumpActive
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : relay.state === 'STANDBY'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-earth-100 text-earth-600 border-earth-300'
              )}>
                {relay.pumpActive ? t('pumpRelayActive') : relay.state === 'STANDBY' ? t('pumpRelayStandby') : t('pumpRelayOff')}
              </span>
            </div>
            <p className="text-xs text-earth-600">
              Connected to farm borehole pump / drip manifold relay switch. Rover telemetry guides switching.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Mode Switch: Auto vs Manual */}
            <button
              disabled={controlling}
              onClick={() => handleRelayChange(relay.mode === 'AUTO' ? 'MANUAL' : 'AUTO', relay.state)}
              className={cn(
                'px-3 py-1.5 text-xs font-bold rounded border transition-colors cursor-pointer',
                relay.mode === 'AUTO'
                  ? 'bg-earth-100 text-earth-800 border-earth-300 hover:bg-earth-200'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              )}
            >
              {relay.mode === 'AUTO' ? t('solenoidModeAuto') : t('solenoidModeManual')}
            </button>

            {/* Trigger / Stop Pump Relay */}
            {relay.pumpActive ? (
              <button
                disabled={controlling}
                onClick={() => handleRelayChange('MANUAL', 'STANDBY')}
                className="px-3 py-1.5 text-xs font-bold rounded bg-red-600 text-white hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
              >
                {t('stopManualPump')}
              </button>
            ) : (
              <button
                disabled={controlling}
                onClick={() => handleRelayChange('MANUAL', 'ACTIVE')}
                className="px-3 py-1.5 text-xs font-bold rounded bg-farm-700 text-white hover:bg-farm-800 transition-colors shadow-xs cursor-pointer"
              >
                {t('triggerManualPump')}
              </button>
            )}
          </div>
        </div>

        {/* Feedback message banner if any */}
        {statusFeedback && (
          <div className="p-2.5 rounded bg-earth-900 text-white text-xs font-medium flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="h-3.5 w-3.5 text-farm-400" />
            <span>{statusFeedback}</span>
          </div>
        )}
      </div>
    </div>
  );
}
