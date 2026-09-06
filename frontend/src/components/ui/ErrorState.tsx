import { AlertCircle } from 'lucide-react';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-earth-500">
      <AlertCircle className="h-8 w-8 text-red-400" />
      <p className="mt-3 text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-farm-600 px-4 py-2 text-sm font-medium text-white hover:bg-farm-700"
        >
          Retry
        </button>
      )}
    </div>
  );
}
