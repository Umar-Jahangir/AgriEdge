import { RecommendationCard } from '../components/recommendations/RecommendationCard';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { useRecommendations } from '../hooks/useData';
import { Lightbulb } from 'lucide-react';

export function RecommendationsPage() {
  const { data: recommendations, loading, error, refetch } = useRecommendations();

  if (loading) return <LoadingState message="Synthesizing agronomic recommendations..." />;
  if (error || !recommendations) return <ErrorState message={error || 'Failed to load recommendations'} onRetry={refetch} />;

  const grouped = {
    IRRIGATION: recommendations.filter((r) => r.category === 'IRRIGATION'),
    NUTRIENTS: recommendations.filter((r) => r.category === 'NUTRIENTS'),
    HEAT_STRESS: recommendations.filter((r) => r.category === 'HEAT_STRESS'),
    DISEASE: recommendations.filter((r) => r.category === 'DISEASE'),
    GENERAL: recommendations.filter((r) => r.category === 'GENERAL'),
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-earth-300 pb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-farm-800">
            // AGRONOMIC PRESCRIPTION PROTOCOLS
          </span>
          <span className="border border-earth-300 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-earth-700">
            DECISION ENGINE V2.1
          </span>
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-earth-900">
          Precision Treatment & Irrigation Directives
        </h2>
        <p className="font-mono text-xs text-earth-600">
          Targeted interventions synthesized directly from multimodal sensor fusion and leaf pathology models.
        </p>
      </div>

      {/* Philosophy Banner */}
      <div className="tactile-card bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center border border-earth-300 bg-farm-100">
            <Lightbulb className="h-4 w-4 text-farm-800" />
          </div>
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-wider text-earth-900">
              CLOSED-LOOP AGRONOMY PIPELINE
            </p>
            <p className="font-mono text-[11px] text-earth-500">
              MONITOR → ANALYZE → PREDICT → RECOMMEND → ACT
            </p>
          </div>
        </div>
        <span className="font-mono text-[10px] font-bold border border-farm-300 bg-farm-50 px-2 py-0.5 text-farm-800">
          STATUS: READY FOR FIELD DISPATCH
        </span>
      </div>

      {/* Grouped Recommendations */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([category, recs]) =>
          recs.length > 0 ? (
            <div key={category}>
              <div className="flex items-center gap-2 border-b border-earth-200 pb-2 mb-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
                  // CATEGORY
                </span>
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-earth-800">
                  {category.replace('_', ' ')}
                </h3>
                <span className="font-mono text-[10px] text-earth-400">
                  ({recs.length} ACTION{recs.length !== 1 ? 'S' : ''})
                </span>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {recs.map((rec) => (
                  <RecommendationCard key={rec.id} recommendation={rec} />
                ))}
              </div>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
