import { RecommendationCard } from '../components/recommendations/RecommendationCard';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { useRecommendations } from '../hooks/useData';
import { Lightbulb } from 'lucide-react';

export function RecommendationsPage() {
  const { data: recommendations, loading, error, refetch } = useRecommendations();

  if (loading) return <LoadingState message="Loading recommendations..." />;
  if (error || !recommendations) return <ErrorState message={error || 'Failed to load'} onRetry={refetch} />;

  const grouped = {
    IRRIGATION: recommendations.filter((r) => r.category === 'IRRIGATION'),
    NUTRIENTS: recommendations.filter((r) => r.category === 'NUTRIENTS'),
    HEAT_STRESS: recommendations.filter((r) => r.category === 'HEAT_STRESS'),
    DISEASE: recommendations.filter((r) => r.category === 'DISEASE'),
    GENERAL: recommendations.filter((r) => r.category === 'GENERAL'),
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="rounded-xl border border-earth-200/60 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-farm-100 p-2.5">
            <Lightbulb className="h-5 w-5 text-farm-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-farm-800">AI Recommendations</h2>
            <p className="text-sm text-earth-400">
              Actionable farmer advisory generated from rover sensor data and Edge AI analysis
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs text-earth-400">
          MONITOR → ANALYZE → PREDICT → RECOMMEND → ACT
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([category, recs]) =>
          recs.length > 0 ? (
            <div key={category}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-earth-500">
                {category.replace('_', ' ')}
              </h3>
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
