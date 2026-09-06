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
        'w-full rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md',
        selected ? 'border-farm-400 ring-2 ring-farm-100' : 'border-earth-200/60'
      )}
    >
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-farm-800">{zone.name}</h4>
        <RiskBadge risk={zone.riskLevel} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-earth-400">Soil Score</span>
          <p className="font-medium text-farm-700">{zone.soilConditionScore}/100</p>
        </div>
        <div>
          <span className="text-earth-400">Moisture</span>
          <p className="font-medium text-farm-700">{zone.moisture}%</p>
        </div>
        <div>
          <span className="text-earth-400">pH</span>
          <p className="font-medium text-farm-700">{zone.ph}</p>
        </div>
        <div>
          <span className="text-earth-400">Crop Health</span>
          <p className="font-medium text-farm-700">{zone.cropHealth}%</p>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-[10px] text-earth-400">
          <span>Sampling Coverage</span>
          <span>{zone.samplingCoverage}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-earth-100">
          <div
            className="h-full rounded-full bg-farm-500"
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
    <div className="rounded-xl border border-earth-200/60 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-farm-800">{zone.name} — Detailed View</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="AI Soil Condition Score" value={`${zone.soilConditionScore}/100`} />
        <Metric label="Soil Moisture" value={`${zone.moisture}%`} />
        <Metric label="Soil pH" value={String(zone.ph)} />
        <Metric label="Nitrogen" value={`${zone.npk.nitrogen} ppm`} />
        <Metric label="Phosphorus" value={`${zone.npk.phosphorus} ppm`} />
        <Metric label="Potassium" value={`${zone.npk.potassium} ppm`} />
        <Metric label="Crop Health" value={`${zone.cropHealth}%`} />
        <Metric label="Risk Level" value={zone.riskLevel} />
        <Metric label="Sampling Coverage" value={`${zone.samplingCoverage}%`} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-farm-50/50 p-3">
      <p className="text-xs text-earth-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-farm-800">{value}</p>
    </div>
  );
}
