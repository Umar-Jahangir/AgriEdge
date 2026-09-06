import type { Recommendation } from '../../types';
import { SeverityBadge } from '../ui/StatusBadge';
import { formatTimestamp } from '../../utils/format';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  return (
    <div className="rounded-xl border border-earth-200/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{recommendation.icon}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-farm-800">{recommendation.issue}</h4>
            <SeverityBadge severity={recommendation.severity} />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-earth-600">{recommendation.action}</p>
          <p className="mt-2 text-xs text-earth-400">
            <span className="font-medium">Reason:</span> {recommendation.reason}
          </p>
          <p className="mt-1 text-xs text-earth-300">{formatTimestamp(recommendation.timestamp)}</p>
        </div>
      </div>
    </div>
  );
}
