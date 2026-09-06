import { Beaker } from 'lucide-react';

export function DemoModeBanner() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5">
      <Beaker className="h-3.5 w-3.5 text-amber-600" />
      <span className="text-xs font-semibold tracking-wide text-amber-700">DEMO MODE</span>
      <span className="hidden text-xs text-amber-600 sm:inline">
        — Simulated sensor data
      </span>
    </div>
  );
}
