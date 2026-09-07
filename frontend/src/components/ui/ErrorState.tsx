import { AlertCircle, RotateCcw } from 'lucide-react';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="tactile-card bg-red-50/60 border-red-300 p-8 flex flex-col items-center justify-center text-center font-mono">
      <div className="flex h-10 w-10 items-center justify-center border border-red-400 bg-red-100">
        <AlertCircle className="h-5 w-5 text-red-700" />
      </div>
      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-red-900">[TELEMETRY BUS ERROR]</p>
      <p className="mt-1 text-xs text-red-700 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 border border-red-800 bg-red-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-800 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          RETRY BUS QUERY
        </button>
      )}
    </div>
  );
}
