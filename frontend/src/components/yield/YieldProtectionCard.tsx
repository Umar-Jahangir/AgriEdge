import { useState } from 'react';
import {
  Sprout,
  TrendingUp,
  Coins,
  Calendar,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useYieldRisk } from '../../hooks/useData';
import { RiskBadge } from '../ui/StatusBadge';
import { cn } from '../../utils/cn';

export function YieldProtectionCard() {
  const { language, t, speakText, stopSpeaking, isSpeaking } = useLanguage();
  const { data: forecast, loading, error } = useYieldRisk();
  const [playingAudio, setPlayingAudio] = useState(false);

  if (loading && !forecast) {
    return (
      <div className="border border-earth-300 bg-white p-5 shadow-2xs animate-pulse">
        <div className="h-5 w-56 bg-earth-200 rounded mb-3" />
        <div className="h-4 w-72 bg-earth-100 rounded" />
      </div>
    );
  }

  if (error || !forecast) {
    return null;
  }

  const handleAudioReadout = async () => {
    if (playingAudio && isSpeaking) {
      stopSpeaking();
      setPlayingAudio(false);
      return;
    }

    setPlayingAudio(true);
    const insight =
      language === 'hi'
        ? forecast.decisionInsights.hi
        : language === 'mr'
        ? forecast.decisionInsights.mr
        : forecast.decisionInsights.en;

    const speechText = `${t('yieldProtectionTitle')}। ${t('projectedYieldRisk')}: ${forecast.overallYieldRisk}। ${t('yieldSavedLabel')}: +${forecast.yieldSavedQuintalsPerAcre} ${t('quintalsPerAcre')}। ${t('pesticideSavingsLabel')}: ₹${forecast.pesticideSavingsInrPerHa.toLocaleString()} ${t('rupeesPerHectare')}। ${insight}`;

    await speakText(speechText, language);
    setPlayingAudio(false);
  };

  const localizedInsight =
    language === 'hi'
      ? forecast.decisionInsights.hi
      : language === 'mr'
      ? forecast.decisionInsights.mr
      : forecast.decisionInsights.en;

  return (
    <div className="border border-earth-300 bg-white shadow-2xs transition-all">
      {/* Top Header */}
      <div className="border-b border-earth-200 bg-earth-50/70 p-4 sm:px-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-farm-700 text-white shadow-xs">
              <Sprout className="h-4 w-4" />
            </span>
            <h3 className="font-display text-base font-bold text-earth-950">
              {t('yieldProtectionTitle')}
            </h3>
            <RiskBadge risk={forecast.overallYieldRisk} />
          </div>
          <p className="mt-1 text-xs text-earth-600">
            {t('yieldProtectionSubtitle')} • <span className="font-semibold text-earth-800">{forecast.cropType}</span>
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
        {/* 4 Precision Economic & Yield Protection Tiles */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* Tile 1: Yield Preserved */}
          <div className="border border-farm-300 bg-farm-50/50 p-4 rounded flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-farm-900">
                <span className="font-bold uppercase tracking-wider">{t('yieldSavedLabel')}</span>
                <TrendingUp className="h-4 w-4 text-farm-700" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold text-farm-800">
                  +{forecast.yieldSavedQuintalsPerAcre}
                </span>
                <span className="text-xs font-bold text-farm-700">Q / Acre</span>
              </div>
            </div>
            <span className="mt-2 inline-block text-[11px] font-semibold text-farm-800 bg-farm-100/80 px-2 py-0.5 rounded border border-farm-200">
              {t('earlyInterventionBadge')}
            </span>
          </div>

          {/* Tile 2: Pesticide Input Cost Saved */}
          <div className="border border-blue-200 bg-blue-50/40 p-4 rounded flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-blue-900">
                <span className="font-bold uppercase tracking-wider">{t('pesticideSavingsLabel')}</span>
                <Coins className="h-4 w-4 text-blue-700" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold text-blue-950">
                  ₹{forecast.pesticideSavingsInrPerHa.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-blue-800">/ Ha</span>
              </div>
            </div>
            <span className="mt-2 inline-block text-[11px] font-semibold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded border border-blue-200">
              {t('spotSprayingSavingsBadge')}
            </span>
          </div>

          {/* Tile 3: Market Revenue Preserved */}
          <div className="border border-amber-200 bg-amber-50/40 p-4 rounded flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-amber-900">
                <span className="font-bold uppercase tracking-wider">{t('revenuePreservedLabel')}</span>
                <ArrowUpRight className="h-4 w-4 text-amber-700" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold text-amber-950">
                  ₹{forecast.revenuePreservedInrPerAcre.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-amber-800">/ Acre</span>
              </div>
            </div>
            <span className="mt-2 inline-block text-[11px] font-medium text-amber-900">
              Based on modal mandi price
            </span>
          </div>

          {/* Tile 4: Overall Farm Yield Risk Penalty */}
          <div className="border border-earth-200 bg-earth-50/60 p-4 rounded flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-earth-700">
                <span className="font-bold uppercase tracking-wider">{t('projectedYieldRisk')}</span>
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold text-earth-950">
                  {forecast.projectedYieldRiskPct}%
                </span>
                <span className="text-xs font-semibold text-earth-500">stress risk</span>
              </div>
            </div>
            <span className="mt-2 inline-block text-[11px] text-earth-600">
              Max potential: {forecast.potentialYieldQuintalsPerAcre} Q/Acre
            </span>
          </div>
        </div>

        {/* Zone Phenology & Growth Stage Timeline */}
        <div className="border border-earth-200 rounded-lg p-4 bg-earth-50/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-farm-800" />
              <h4 className="font-display text-sm font-bold text-earth-950">
                {t('growthStageTimelineTitle')}
              </h4>
            </div>
            <span className="text-xs text-earth-500 font-medium">GDD Thermal Accumulator</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {forecast.zones.map((z) => {
              const localizedStage =
                language === 'hi'
                  ? z.growthStageHi || z.growthStage
                  : language === 'mr'
                  ? z.growthStageMr || z.growthStage
                  : z.growthStage;

              const isHighRisk = z.yieldRiskLevel === 'HIGH';
              const isSensitive = z.criticalSensitivity;

              return (
                <div
                  key={z.zoneId}
                  className={cn(
                    'border bg-white p-3.5 rounded shadow-2xs flex flex-col justify-between transition-colors',
                    isHighRisk
                      ? 'border-red-300 bg-red-50/20'
                      : isSensitive
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-earth-200'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-earth-900">{z.zoneName}</span>
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.2 rounded border uppercase',
                        z.yieldRiskLevel === 'LOW'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : z.yieldRiskLevel === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      )}>
                        {z.yieldRiskLevel} ({z.yieldRiskPct}%)
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <span className="font-display text-sm font-bold text-earth-950 block">
                        {localizedStage}
                      </span>
                      <span className="text-[11px] text-earth-500 block mt-0.5">
                        {t('dayLabel')} {z.stageDay} • {z.gddAccumulated} GDD Units
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-earth-100 flex items-center justify-between text-xs">
                    <span className="text-earth-600 font-medium">Expected Yield:</span>
                    <span className="font-bold text-earth-900">{z.expectedYieldQuintalsPerAcre} Q/Ac</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fused Decision-Support Insight Banner */}
        <div className="p-3.5 rounded-lg bg-farm-900 text-white text-xs sm:text-sm font-medium flex items-start sm:items-center gap-3">
          <Sparkles className="h-5 w-5 text-farm-300 shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed text-farm-50">
            {localizedInsight}
          </p>
        </div>
      </div>
    </div>
  );
}
