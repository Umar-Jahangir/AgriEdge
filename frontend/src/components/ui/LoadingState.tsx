import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Acquiring telemetry bus signals...' }: { message?: string }) {
  return (
    <div className="tactile-card bg-white p-12 flex flex-col items-center justify-center text-center font-mono">
      <Loader2 className="h-7 w-7 animate-spin text-farm-800" />
      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-earth-800">{message}</p>
      <span className="mt-1 text-[10px] text-earth-400">// PROTOCOL: FASTAPI REST + WEBSOCKET BUS</span>
    </div>
  );
}
