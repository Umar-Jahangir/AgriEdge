import { useState } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import type { Recommendation } from '../../types';
import { SeverityBadge } from '../ui/StatusBadge';
import { formatTimestamp } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';
import { translateDynamicContent } from '../../i18n/translations';
import { cn } from '../../utils/cn';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const { language, t, speakText, stopSpeaking, isSpeaking, audioEngine } = useLanguage();
  const [playingThis, setPlayingThis] = useState(false);

  const severityBorder =
    recommendation.severity === 'CRITICAL' || recommendation.severity === 'HIGH'
      ? 'border-l-red-600'
      : recommendation.severity === 'MEDIUM'
      ? 'border-l-amber-600'
      : 'border-l-farm-600';

  // Translate dynamic content based on selected language
  const localizedIssue = translateDynamicContent(recommendation.issue, language);
  const localizedAction = translateDynamicContent(recommendation.action, language);
  const localizedReason = translateDynamicContent(recommendation.reason, language);

  const categoryLabel =
    recommendation.category === 'IRRIGATION'
      ? t('catIrrigation')
      : recommendation.category === 'DISEASE'
      ? t('catDisease')
      : recommendation.category === 'PEST'
      ? t('catPest')
      : recommendation.category === 'NUTRIENTS'
      ? t('catNutrients')
      : recommendation.category === 'HEAT_STRESS'
      ? t('catHeatStress')
      : t('catGeneral');

  const handleAudioToggle = async () => {
    if (playingThis && isSpeaking) {
      stopSpeaking();
      setPlayingThis(false);
    } else {
      setPlayingThis(true);
      const speechContent = `${localizedIssue}। ${localizedAction}। ${localizedReason}`;
      await speakText(speechContent, language);
      setPlayingThis(false);
    }
  };

  return (
    <div className={cn('bg-white border border-earth-300 border-l-4 p-4 transition-colors hover:border-earth-400 tactile-card', severityBorder)}>
      <div className="flex items-start justify-between gap-2 border-b border-earth-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-earth-600 border border-earth-200 bg-earth-50 px-1.5 py-0.2">
            [{categoryLabel}]
          </span>
          <h4 className="font-display text-sm font-bold text-earth-950">{localizedIssue}</h4>
        </div>
        <SeverityBadge severity={recommendation.severity} />
      </div>

      <p className="mt-2.5 text-xs leading-relaxed text-earth-900 font-medium">{localizedAction}</p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-earth-100 pt-2 font-mono text-[11px]">
        <span className="text-earth-500 text-[10px]">
          {t('cause')}: <strong className="text-earth-700">{localizedReason}</strong>
        </span>

        <button
          onClick={handleAudioToggle}
          className={cn(
            'inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[10px] font-bold tracking-wider transition-all uppercase',
            playingThis && isSpeaking
              ? 'border-farm-700 bg-farm-800 text-white animate-pulse'
              : 'border-earth-300 bg-earth-50 text-earth-800 hover:bg-earth-100'
          )}
          title="Listen in natural voice"
        >
          {playingThis && isSpeaking ? (
            <VolumeX className="h-3 w-3" />
          ) : (
            <Volume2 className="h-3 w-3 text-farm-700" />
          )}
          {playingThis && isSpeaking ? t('readingOutLoud') : t('readAloud')}
          {audioEngine === 'elevenlabs' && (
            <span title="Powered by ElevenLabs">
              <Sparkles className="h-2.5 w-2.5 text-amber-500" />
            </span>
          )}
        </button>
      </div>

      <div className="mt-1 flex justify-end font-mono text-[10px] text-earth-400">
        <span>{formatTimestamp(recommendation.timestamp)}</span>
      </div>
    </div>
  );
}
