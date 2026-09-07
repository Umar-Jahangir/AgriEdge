import { PipelineVisualization } from '../components/ai/PipelineVisualization';
import { RiskBadge } from '../components/ui/StatusBadge';
import { KPICard } from '../components/ui/KPICard';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { YieldProtectionCard } from '../components/yield/YieldProtectionCard';
import { useAIAnalysis } from '../hooks/useData';
import { Brain, Droplets, Bug, Sprout, TrendingDown } from 'lucide-react';

export function AIAnalysisPage() {
  const { data: analysis, loading, error, refetch } = useAIAnalysis();

  if (loading) return <LoadingState message="Executing Edge AI diagnostic models..." />;
  if (error || !analysis) return <ErrorState message={error || 'Failed to load AI analytics'} onRetry={refetch} />;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-earth-300 pb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-farm-800">
            // NEURAL DECISION ARCHITECTURE
          </span>
          <span className="border border-earth-300 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-earth-700">
            ON-DEVICE EDGE INFERENCE
          </span>
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-earth-900">
          Multimodal Edge AI Diagnostic Engine
        </h2>
        <p className="font-mono text-xs text-earth-600">
          Sensor fusion correlating in-situ subterranean chemistry with optical foliage pathology.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline Diagram */}
        <PipelineVisualization />

        {/* Diagnostics & Risk Matrix */}
        <div className="space-y-4">
          {/* Engineering Banner */}
          <div className="tactile-card bg-amber-50/80 p-4 border-amber-300">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-800">
              // TELEMETRY INTEGRATION NOTE
            </span>
            <p className="mt-1 font-mono text-xs text-amber-900 leading-relaxed">
              <strong>OFFLINE-FIRST EDGE STACK:</strong> Raw sensory inputs from rover probes and optical camera frames are evaluated locally on Raspberry Pi with MobileNetV3 ONNX before broadcasting alerts.
            </p>
          </div>

          {/* Primary Model Indices */}
          <div className="grid gap-3 sm:grid-cols-2">
            <KPICard
              title="AI SOIL HEALTH INDEX"
              value={`${analysis.soilConditionScore}/100`}
              icon={Brain}
              subtitle="Agronomic moisture & NPK balance"
            />
            <KPICard
              title="CANOPY VIGOR INDEX"
              value={`${analysis.cropHealth}%`}
              icon={Sprout}
              subtitle="Optical foliage pathology score"
            />
          </div>

          {/* Environmental Risk Vector */}
          <div className="tactile-card bg-white p-5">
            <div className="border-b border-earth-200 pb-3 mb-4">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
                // PREDICTIVE RISK VECTORS
              </span>
              <h3 className="font-display text-sm font-bold uppercase tracking-tight text-earth-900">
                Multi-Factor Vulnerability Assessment
              </h3>
            </div>
            <div className="space-y-3 font-mono">
              <RiskRow icon={Droplets} label="HYDRATION DEFICIT RISK" risk={analysis.waterStressRisk} />
              <RiskRow icon={Bug} label="PATHOGEN INFECTION RISK" risk={analysis.diseaseRisk} />
              <RiskRow icon={TrendingDown} label="PROJECTED YIELD RISK" risk={analysis.yieldRisk} />
            </div>
          </div>

          {/* Nutrient Deficiency Detection */}
          <div className="tactile-card bg-white p-5">
            <div className="border-b border-earth-200 pb-3 mb-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
                // PATHOLOGY CLASSIFICATION
              </span>
              <h3 className="font-display text-sm font-bold uppercase tracking-tight text-earth-900">
                Macronutrient Deficit Identification
              </h3>
            </div>
            <div className="border border-earth-300 bg-earth-50/80 p-3">
              <p className="font-mono text-xs font-bold uppercase tracking-wide text-earth-900">
                DETECTED CONDITION: {analysis.nutrientDeficiency}
              </p>
              <p className="mt-1.5 font-mono text-[11px] text-earth-600 leading-relaxed">
                Synthesis derived from subterranean NPK chemical concentration sensor probes combined with optical leaf chlorosis detection.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Yield-Risk Forecasting, Phenology & Economics */}
      <YieldProtectionCard />
    </div>
  );
}

function RiskRow({
  icon: Icon,
  label,
  risk,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}) {
  return (
    <div className="flex items-center justify-between border-b border-earth-200 pb-2 last:border-0 last:pb-0">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-earth-500" />
        <span className="text-xs text-earth-700">{label}</span>
      </div>
      <RiskBadge risk={risk} />
    </div>
  );
}
