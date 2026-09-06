import { ArrowDown, Brain, Database, LineChart, ShieldAlert, Sprout } from 'lucide-react';

const pipelineSteps = [
  { label: 'Sensor Data', icon: Database, description: 'Soil, environmental & image inputs' },
  { label: 'Data Preprocessing', icon: LineChart, description: 'Normalization & feature extraction' },
  { label: 'AI/ML Model', icon: Brain, description: 'Edge inference on Raspberry Pi' },
  { label: 'Soil & Crop Analysis', icon: Sprout, description: 'Condition scoring & classification' },
  { label: 'Risk Prediction', icon: ShieldAlert, description: 'Multi-factor risk assessment' },
  { label: 'Recommendation', icon: ArrowDown, description: 'Actionable farmer advisory' },
];

export function PipelineVisualization() {
  return (
    <div className="rounded-xl border border-earth-200/60 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-farm-800">AI Processing Pipeline</h3>
      <p className="mt-1 text-xs text-earth-400">
        MONITOR → ANALYZE → PREDICT → RECOMMEND → ACT
      </p>

      <div className="mt-6 flex flex-col items-center gap-1">
        {pipelineSteps.map((step, i) => (
          <div key={step.label} className="flex w-full max-w-md flex-col items-center">
            <div className="flex w-full items-center gap-3 rounded-lg border border-earth-200 bg-farm-50/30 px-4 py-3 transition-colors hover:bg-farm-50/60">
              <div className="rounded-lg bg-farm-100 p-2">
                <step.icon className="h-4 w-4 text-farm-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-farm-800">{step.label}</p>
                <p className="text-xs text-earth-400">{step.description}</p>
              </div>
            </div>
            {i < pipelineSteps.length - 1 && (
              <ArrowDown className="my-1 h-4 w-4 text-earth-300" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
