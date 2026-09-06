import { PipelineVisualization } from '../components/ai/PipelineVisualization';
import { RiskBadge } from '../components/ui/StatusBadge';
import { KPICard } from '../components/ui/KPICard';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { useAIAnalysis } from '../hooks/useData';
import { Brain, Droplets, Bug, Sprout, TrendingDown } from 'lucide-react';

export function AIAnalysisPage() {
  const { data: analysis, loading, error, refetch } = useAIAnalysis();

  if (loading) return <LoadingState message="Running AI analysis..." />;
  if (error || !analysis) return <ErrorState message={error || 'Failed to load'} onRetry={refetch} />;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-xl font-bold text-farm-800">AI Analysis</h2>
        <p className="mt-1 text-sm text-earth-400">
          Edge AI converts raw sensor and image data into actionable agricultural insights
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PipelineVisualization />

        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <p className="text-xs text-amber-700">
              <strong>Demo Values:</strong> These AI outputs are demonstration values generated from mock data.
              They are not scientifically validated until the trained Edge AI model is connected.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <KPICard
              title="AI Soil Condition Score"
              value={`${analysis.soilConditionScore}/100`}
              icon={Brain}
            />
            <KPICard
              title="Crop Health"
              value={`${analysis.cropHealth}%`}
              icon={Sprout}
            />
          </div>

          <div className="rounded-xl border border-earth-200/60 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-farm-800">Risk Assessment</h3>
            <div className="mt-4 space-y-4">
              <RiskRow icon={Droplets} label="Water Stress Risk" risk={analysis.waterStressRisk} />
              <RiskRow icon={Bug} label="Disease Risk" risk={analysis.diseaseRisk} />
              <RiskRow icon={TrendingDown} label="Yield Risk" risk={analysis.yieldRisk} />
            </div>
          </div>

          <div className="rounded-xl border border-earth-200/60 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-farm-800">Nutrient Deficiency Detection</h3>
            <p className="mt-2 text-sm text-earth-600">{analysis.nutrientDeficiency}</p>
            <p className="mt-2 text-xs text-earth-400">
              Based on NPK sensor readings and crop image analysis from latest rover scan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskRow({ icon: Icon, label, risk }: { icon: React.ComponentType<{ className?: string }>; label: string; risk: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-farm-500" />
        <span className="text-sm text-earth-600">{label}</span>
      </div>
      <RiskBadge risk={risk} />
    </div>
  );
}
