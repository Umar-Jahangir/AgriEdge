import type { FarmZone } from '../../types';
import { RiskBadge } from '../ui/StatusBadge';
import { cn } from '../../utils/cn';

interface ZoneCardProps {
  zone: FarmZone;
  selected?: boolean;
  onClick?: () => void;
}

export function ZoneCard({ zone, selected, onClick }: ZoneCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left transition-all p-4 border bg-white',
        selected
          ? 'border-2 border-farm-800 bg-farm-50/50 shadow-xs'
          : 'border-earth-300 hover:border-earth-400 hover:bg-earth-50/50'
      )}
    >
      <div className="flex items-center justify-between border-b border-earth-200 pb-2">
        <div>
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-farm-800">
            // SECTOR
          </span>
          <h4 className="font-display text-sm font-bold uppercase tracking-tight text-earth-900">
            {zone.name}
          </h4>
        </div>
        <RiskBadge risk={zone.riskLevel} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 font-mono">
        <div className="border border-earth-200 bg-earth-50/80 p-2">
          <span className="text-[10px] uppercase text-earth-500">Soil Score</span>
          <p className="text-sm font-bold text-earth-900">{zone.soilConditionScore}/100</p>
        </div>
        <div className="border border-earth-200 bg-earth-50/80 p-2">
          <span className="text-[10px] uppercase text-earth-500">Moisture</span>
          <p className="text-sm font-bold text-earth-900">{zone.moisture}%</p>
        </div>
        <div className="border border-earth-200 bg-earth-50/80 p-2">
          <span className="text-[10px] uppercase text-earth-500">pH Level</span>
          <p className="text-sm font-bold text-earth-900">{zone.ph}</p>
        </div>
        <div className="border border-earth-200 bg-earth-50/80 p-2">
          <span className="text-[10px] uppercase text-earth-500">Crop Health</span>
          <p className="text-sm font-bold text-earth-900">{zone.cropHealth}%</p>
        </div>
      </div>

      <div className="mt-3 border-t border-earth-200 pt-2 font-mono">
        <div className="flex justify-between text-[10px] text-earth-600">
          <span className="uppercase">Sampling Coverage</span>
          <span className="font-bold text-earth-900">{zone.samplingCoverage}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full border border-earth-300 bg-earth-100">
          <div
            className="h-full bg-farm-800 transition-all duration-500"
            style={{ width: `${zone.samplingCoverage}%` }}
          />
        </div>
      </div>
    </button>
  );
}

interface ZoneDetailProps {
  zone: FarmZone;
}

export function ZoneDetail({ zone }: ZoneDetailProps) {
  return (
    <div className="tactile-card bg-white p-5">
      <div className="border-b border-earth-200 pb-3 mb-4">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
          // FIELD SECTOR TELEMETRY BREAKDOWN
        </span>
        <h3 className="font-display text-base font-bold uppercase tracking-tight text-earth-900">
          {zone.name} — Detailed Specifications
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="AI Soil Condition Score" value={`${zone.soilConditionScore}/100`} />
        <Metric label="Soil Moisture" value={`${zone.moisture}%`} />
        <Metric label="Soil pH" value={String(zone.ph)} />
        <Metric label="Nitrogen (N)" value={`${zone.npk.nitrogen} ppm`} />
        <Metric label="Phosphorus (P)" value={`${zone.npk.phosphorus} ppm`} />
        <Metric label="Potassium (K)" value={`${zone.npk.potassium} ppm`} />
        <Metric label="Crop Health Index" value={`${zone.cropHealth}%`} />
        <Metric label="Risk Level Assessment" value={zone.riskLevel} />
        <Metric label="Rover Coverage" value={`${zone.samplingCoverage}%`} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-earth-200 bg-earth-50/60 p-3 font-mono">
      <p className="text-[10px] uppercase tracking-wider text-earth-500">{label}</p>
      <p className="mt-1 text-sm font-bold tracking-tight text-earth-900">{value}</p>
    </div>
  );
}
