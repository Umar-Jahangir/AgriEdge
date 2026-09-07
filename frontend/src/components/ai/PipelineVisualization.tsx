import { ArrowDown, Brain, Database, LineChart, ShieldAlert, Sprout } from 'lucide-react';

const pipelineSteps = [
  { step: '01', label: 'EDGE SENSOR HARVEST', icon: Database, description: 'Soil probe, ambient moisture & camera frame inputs' },
  { step: '02', label: 'ON-DEVICE PREPROCESSING', icon: LineChart, description: 'Normalization, 224×224 tensor resize & telemetry calibration' },
  { step: '03', label: 'MOBILENETV3 ONNX ENGINE', icon: Brain, description: 'Quantized INT8/FP32 neural network inference on Raspberry Pi' },
  { step: '04', label: 'MULTIMODAL FUSION', icon: Sprout, description: 'Agronomic scoring combining NPK chemistry and leaf pathology' },
  { step: '05', label: 'RISK VECTOR ESTIMATION', icon: ShieldAlert, description: 'Drought, disease transmission & yield degradation risks' },
  { step: '06', label: 'AGRONOMIC PRESCRIPTION', icon: Sprout, description: 'Direct farmer actionables & precision spray directives' },
];

export function PipelineVisualization() {
  return (
    <div className="tactile-card bg-white p-5">
      <div className="border-b border-earth-200 pb-3 mb-4 flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
            // ARCHITECTURE & INFERENCE FLOW
          </span>
          <h3 className="font-display text-sm font-bold uppercase tracking-tight text-earth-900">
            Edge AI Processing Pipeline
          </h3>
        </div>
        <span className="border border-farm-300 bg-farm-50 px-2 py-0.5 font-mono text-[10px] font-bold text-farm-800">
          STATUS: ACTIVE
        </span>
      </div>

      <div className="flex flex-col items-center gap-1.5 pt-2">
        {pipelineSteps.map((item, i) => (
          <div key={item.label} className="flex w-full flex-col items-center">
            <div className="flex w-full items-center gap-3 border border-earth-300 bg-earth-50/70 p-3 hover:bg-earth-100 transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-earth-300 bg-white">
                <item.icon className="h-4 w-4 text-farm-800" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-farm-800">
                    [{item.step}]
                  </span>
                  <p className="font-display text-xs font-bold uppercase tracking-tight text-earth-900">
                    {item.label}
                  </p>
                </div>
                <p className="font-mono text-[11px] text-earth-500">{item.description}</p>
              </div>
            </div>
            {i < pipelineSteps.length - 1 && (
              <div className="my-0.5 flex flex-col items-center text-earth-400">
                <ArrowDown className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
