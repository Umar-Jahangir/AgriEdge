import type { FarmMapData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../utils/cn';

interface FarmMapProps {
  data: FarmMapData;
  className?: string;
  compact?: boolean;
}

export function FarmMap({ data, className, compact }: FarmMapProps) {
  const { samplingPoints, rover, attentionAreas } = data;
  const { t } = useLanguage();

  return (
    <div className={cn('tactile-card p-5 bg-white', className)}>
      <div className="flex items-center justify-between border-b border-earth-200 pb-3 mb-4">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
            // {t('coordinateGridTitle')}
          </span>
          <h3 className="font-display text-sm font-bold uppercase tracking-tight text-earth-900">
            {t('samplingArrayTitle')}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 border border-farm-300 bg-farm-50 px-2 py-0.5 font-mono text-[10px] font-bold text-farm-800">
            <span className="h-1.5 w-1.5 rounded-full bg-farm-600 animate-ping" />
            GRID 100m²
          </span>
          <span className="font-mono text-[11px] font-semibold text-earth-600">
            ROV-01: {rover.currentZone}
          </span>
        </div>
      </div>

      <div>
        <div
          className={cn(
            'relative border-2 border-earth-300 bg-earth-100/50 overflow-hidden select-none',
            compact ? 'h-52' : 'h-80'
          )}
        >
          {/* Subtle grid background pattern */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(to right, #d5cebf 1px, transparent 1px), linear-gradient(to bottom, #d5cebf 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Sector Crosshair Dividers */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
            <div className="border-r-2 border-b-2 border-dashed border-earth-300/80 relative">
              <span className="absolute left-2.5 top-2 font-mono text-[10px] font-bold tracking-wider text-earth-700 bg-earth-100/70 px-1">
                [{t('sectorNW')}]
              </span>
            </div>
            <div className="border-b-2 border-dashed border-earth-300/80 relative">
              <span className="absolute right-2.5 top-2 font-mono text-[10px] font-bold tracking-wider text-earth-700 bg-earth-100/70 px-1">
                [{t('sectorNE')}]
              </span>
            </div>
            <div className="border-r-2 border-dashed border-earth-300/80 relative">
              <span className="absolute left-2.5 bottom-2 font-mono text-[10px] font-bold tracking-wider text-earth-700 bg-earth-100/70 px-1">
                [{t('sectorSW')}]
              </span>
            </div>
            <div className="relative">
              <span className="absolute right-2.5 bottom-2 font-mono text-[10px] font-bold tracking-wider text-earth-700 bg-earth-100/70 px-1">
                [{t('sectorSE')}]
              </span>
            </div>
          </div>

          {/* Center Coordinates Reticle */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-earth-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="6" />
              <line x1="12" y1="2" x2="12" y2="7" />
              <line x1="12" y1="17" x2="12" y2="22" />
              <line x1="2" y1="12" x2="7" y2="12" />
              <line x1="17" y1="12" x2="22" y2="12" />
            </svg>
          </div>

          {/* Attention areas */}
          {attentionAreas.map((area, i) => (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: `${area.x}%`, top: `${area.y}%` }}
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute h-10 w-10 border border-amber-500/60 bg-amber-500/10 animate-pulse" />
                <span className="border border-amber-600 bg-amber-500 px-1 py-0.5 font-mono text-[9px] font-bold text-white shadow-sm">
                  ATTN
                </span>
              </div>
            </div>
          ))}

          {/* Sampling points */}
          {samplingPoints.map((point) => (
            <div
              key={point.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 z-10"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              title={`Point ${point.pointNumber} — ${point.status}`}
            >
              {point.status === 'completed' && (
                <span className="flex h-4 w-4 items-center justify-center border border-farm-700 bg-farm-600 text-[8px] font-bold text-white shadow-xs">
                  ✓
                </span>
              )}
              {point.status === 'current' && (
                <span className="relative flex h-5 w-5 items-center justify-center">
                  <span className="absolute h-5 w-5 border border-farm-600 bg-farm-500/30 animate-ping" />
                  <span className="relative flex h-4 w-4 items-center justify-center border border-farm-900 bg-farm-800 text-[9px] font-mono font-bold text-white">
                    {point.pointNumber}
                  </span>
                </span>
              )}
              {point.status === 'pending' && (
                <span className="flex h-3 w-3 items-center justify-center border border-earth-400 bg-white" />
              )}
              {point.status === 'attention' && (
                <span className="flex h-4 w-4 items-center justify-center border border-amber-700 bg-amber-500 text-[8px] font-bold text-white">
                  !
                </span>
              )}
            </div>
          ))}

          {/* Rover position */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 z-20"
            style={{ left: `${rover.position.x}%`, top: `${rover.position.y}%` }}
          >
            <div className="relative flex flex-col items-center">
              <div className="flex h-7 w-7 items-center justify-center border-2 border-earth-900 bg-farm-900 text-white shadow-md">
                <svg className="h-4 w-4 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M4 15h16v2H4zm2-7h12l-2 5H8zm-3 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm14 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                </svg>
              </div>
              <span className="mt-0.5 border border-earth-800 bg-earth-900 px-1 py-0.2 font-mono text-[8px] font-bold text-white uppercase tracking-tight">
                ROV-01
              </span>
            </div>
          </div>
        </div>

        {/* Tactical Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-earth-200 pt-3 text-[11px] font-mono text-earth-700">
          <div className="flex flex-wrap gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 border border-farm-700 bg-farm-600" />
              <span className="font-medium">{t('legendCompleted')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 border border-farm-900 bg-farm-800" />
              <span className="font-medium">{t('legendCurrent')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 border border-earth-400 bg-white" />
              <span className="font-medium">{t('legendPending')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 border border-amber-700 bg-amber-500" />
              <span className="font-medium">{t('legendAttention')}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-earth-500">
            <span>{t('coordinatesStamp')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
