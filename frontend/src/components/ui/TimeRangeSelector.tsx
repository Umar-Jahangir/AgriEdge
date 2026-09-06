import { cn } from '../../utils/cn';

interface TimeRangeSelectorProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TimeRangeSelector({ options, value, onChange, className }: TimeRangeSelectorProps) {
  return (
    <div className={cn('inline-flex rounded-lg border border-earth-200 bg-earth-50 p-0.5', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            value === opt.value
              ? 'bg-white text-farm-700 shadow-sm'
              : 'text-earth-500 hover:text-earth-700'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
