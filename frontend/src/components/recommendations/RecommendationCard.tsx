import type { Recommendation } from '../../types';
import { SeverityBadge } from '../ui/StatusBadge';
import { formatTimestamp } from '../../utils/format';
import { cn } from '../../utils/cn';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const severityBorder =
    recommendation.severity === 'CRITICAL' || recommendation.severity === 'HIGH'
      ? 'border-l-red-600'
      : recommendation.severity === 'MEDIUM'
      ? 'border-l-amber-600'
      : 'border-l-farm-600';

  return (
    <div className={cn('bg-white border border-earth-300 border-l-4 p-4 transition-colors hover:border-earth-400', severityBorder)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-earth-500">
            [{recommendation.category}]
          </span>
          <h4 className="font-display text-sm font-bold text-earth-950">{recommendation.issue}</h4>
        </div>
        <SeverityBadge severity={recommendation.severity} />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-earth-700 font-medium">{recommendation.action}</p>
      <div className="mt-2.5 flex items-center justify-between border-t border-earth-100 pt-2 font-mono text-[10px] text-earth-500">
        <span>TRIGGER: {recommendation.reason}</span>
        <span>{formatTimestamp(recommendation.timestamp)}</span>
      </div>
    </div>
  );
}
