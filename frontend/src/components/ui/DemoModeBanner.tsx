import { Beaker } from 'lucide-react';

export function DemoModeBanner() {
  return (
    <div className="inline-flex items-center gap-2 border border-amber-400 bg-amber-50 px-2.5 py-1 font-mono">
      <Beaker className="h-3.5 w-3.5 text-amber-700" />
      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
        [DEMO MODE: SIMULATED TELEMETRY]
      </span>
      <span className="hidden text-[10px] text-amber-700 sm:inline">
        // CONNECT FASTAPI FOR HARDWARE SENSORS
      </span>
    </div>
  );
}
