import { Inbox } from 'lucide-react';

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="tactile-card bg-white p-12 flex flex-col items-center justify-center text-center font-mono">
      <div className="flex h-12 w-12 items-center justify-center border border-earth-300 bg-earth-100">
        <Inbox className="h-6 w-6 text-earth-500" />
      </div>
      <p className="mt-4 font-display text-sm font-bold uppercase tracking-wider text-earth-900">{title}</p>
      {description && <p className="mt-1 text-xs text-earth-500 max-w-sm">{description}</p>}
    </div>
  );
}
