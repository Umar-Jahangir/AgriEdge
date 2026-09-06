import { Inbox } from 'lucide-react';

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-earth-400">
      <Inbox className="h-10 w-10" />
      <p className="mt-3 text-sm font-medium text-earth-600">{title}</p>
      {description && <p className="mt-1 text-xs">{description}</p>}
    </div>
  );
}
