import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Loading data...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-earth-500">
      <Loader2 className="h-8 w-8 animate-spin text-farm-500" />
      <p className="mt-3 text-sm">{message}</p>
    </div>
  );
}
