import { cn } from '../../utils/cn';

interface TimeRangeSelectorProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TimeRangeSelector({ options, value, onChange, className }: TimeRangeSelectorProps) {
  return (
    <div className={cn('inline-flex border border-earth-300 bg-earth-100 p-0.5', className)}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider transition-all',
              isSelected
                ? 'bg-earth-900 text-white shadow-xs'
                : 'text-earth-600 hover:text-earth-900 hover:bg-earth-200/60'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
