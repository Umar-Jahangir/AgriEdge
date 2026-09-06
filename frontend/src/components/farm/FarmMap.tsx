import type { FarmMapData } from '../../types';
import { cn } from '../../utils/cn';

interface FarmMapProps {
  data: FarmMapData;
  className?: string;
  compact?: boolean;
}

export function FarmMap({ data, className, compact }: FarmMapProps) {
  const { samplingPoints, rover, attentionAreas } = data;

  return (
    <div className={cn('rounded-xl border border-earth-200/60 bg-white shadow-sm', className)}>
      <div className="border-b border-earth-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-farm-800">Farm Field</h3>
        <p className="text-xs text-earth-400">Rover sampling coverage map</p>
      </div>

      <div className="p-4">
        <div
          className={cn(
            'relative rounded-lg border-2 border-dashed border-earth-200 bg-gradient-to-br from-farm-50 to-earth-50',
            compact ? 'h-48' : 'h-72'
          )}
        >
          {/* Zone labels */}
          <div className="absolute left-2 top-2 text-[10px] font-medium text-earth-400">Zone A</div>
          <div className="absolute right-2 top-2 text-[10px] font-medium text-earth-400">Zone B</div>
          <div className="absolute bottom-2 left-2 text-[10px] font-medium text-earth-400">Zone C</div>
          <div className="absolute bottom-2 right-2 text-[10px] font-medium text-earth-400">Zone D</div>

          {/* Grid lines */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            <div className="border-r border-b border-earth-200/40" />
            <div className="border-b border-earth-200/40" />
            <div className="border-r border-earth-200/40" />
            <div />
          </div>

          {/* Sampling points */}
          {samplingPoints.map((point) => (
            <div
              key={point.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              title={`Point ${point.pointNumber} — ${point.status}`}
            >
              {point.status === 'completed' && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-farm-500 text-[8px] text-white">
                  ✓
                </span>
              )}
              {point.status === 'current' && (
                <span className="relative flex h-5 w-5 items-center justify-center">
                  <span className="absolute h-5 w-5 animate-ping rounded-full bg-farm-400 opacity-40" />
                  <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-farm-600 text-[10px] text-white">
                    ●
                  </span>
                </span>
              )}
              {point.status === 'pending' && (
                <span className="flex h-3 w-3 items-center justify-center rounded-full border-2 border-earth-300 bg-white" />
              )}
              {point.status === 'attention' && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white">
                  ⚠
                </span>
              )}
            </div>
          ))}

          {/* Rover position */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000"
            style={{ left: `${rover.position.x}%`, top: `${rover.position.y}%` }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-farm-700 text-sm shadow-lg">
              🚜
            </div>
          </div>

          {/* Attention areas */}
          {attentionAreas.map((area, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${area.x}%`, top: `${area.y}%` }}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs ring-2 ring-amber-300">
                ⚠
              </span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-earth-500">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-farm-500" /> Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-farm-600 ring-2 ring-farm-300" /> Current
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-earth-300 bg-white" /> Pending
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Attention
          </span>
          <span className="flex items-center gap-1">🚜 Rover</span>
        </div>
      </div>
    </div>
  );
}
