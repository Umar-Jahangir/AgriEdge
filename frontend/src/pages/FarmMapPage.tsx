import { useState } from 'react';
import { FarmMap } from '../components/farm/FarmMap';
import { ZoneCard, ZoneDetail } from '../components/farm/ZoneCard';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { useFarmMap, useFarmZones } from '../hooks/useData';
import type { FarmZone } from '../types';

export function FarmMapPage() {
  const { data: farmMap, loading, error, refetch } = useFarmMap();
  const { data: zones } = useFarmZones();
  const [selectedZone, setSelectedZone] = useState<FarmZone | null>(null);

  if (loading) return <LoadingState message="Mapping field spatial telemetry..." />;
  if (error || !farmMap) return <ErrorState message={error || 'Failed to load field map'} onRetry={refetch} />;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-earth-300 pb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-farm-800">
            // CARTOGRAPHIC & ROVER TRACKING ARRAY
          </span>
          <span className="border border-earth-300 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-earth-700">
            SYSTEM GRID: 4 QUADRANTS
          </span>
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-earth-900">
          Field Spatial Mapping & Autonomous Traverse
        </h2>
        <p className="font-mono text-xs text-earth-600">
          Real-time rover coordinates, waypoint sampling progress, and sector vulnerability mapping.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tactical Map */}
        <div className="lg:col-span-2">
          <FarmMap data={farmMap} />
        </div>

        {/* Rover Status & Workflow Ledger */}
        <div className="space-y-4">
          <div className="tactile-card bg-white p-5">
            <div className="border-b border-earth-200 pb-3 mb-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
                // ACTIVE HARDWARE TELEMETRY
              </span>
              <h3 className="font-display text-sm font-bold uppercase tracking-tight text-earth-900">
                Rover Status Readout
              </h3>
            </div>
            <div className="space-y-2.5 font-mono text-xs">
              <InfoRow label="OPERATIONAL STATE" value={farmMap.rover.state} highlight />
              <InfoRow label="ACTIVE POSITION" value={`${farmMap.rover.currentZone} // PT #${farmMap.rover.currentSamplingPoint}`} />
              <InfoRow label="DISTANCE COVERED" value={`${farmMap.rover.distanceCovered} km`} />
              <InfoRow label="WAYPOINTS PROBED" value={`${farmMap.rover.completedSamplingPoints} / ${farmMap.rover.totalSamplingPoints}`} />
              <InfoRow label="BATTERY CAPACITY" value={`${farmMap.rover.battery}%`} />
              <InfoRow label="OBSTACLE STATUS" value={farmMap.rover.obstacleStatus} />
            </div>
          </div>

          <div className="tactile-card bg-white p-5">
            <div className="border-b border-earth-200 pb-3 mb-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
                // SAMPLING PROTOCOL
              </span>
              <h3 className="font-display text-sm font-bold uppercase tracking-tight text-earth-900">
                Traverse Execution Cycle
              </h3>
            </div>
            <ol className="space-y-1.5 font-mono text-xs text-earth-700">
              <li className="flex gap-2">
                <span className="font-bold text-farm-800">01.</span> Autonomous GPS waypoint navigation
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-farm-800">02.</span> Actuate sub-surface sensor probe (10cm/20cm)
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-farm-800">03.</span> Capture soil moisture, temp, pH & NPK
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-farm-800">04.</span> Optical foliage frame capture (224×224)
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-farm-800">05.</span> On-device MobileNetV3 Edge inference
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-farm-800">06.</span> Broadcast telemetry & proceed to next point
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Farm Quadrants */}
      <div>
        <div className="border-b border-earth-300 pb-3 mb-4">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-farm-800">
            // SECTOR SPECIFICATIONS
          </span>
          <h3 className="font-display text-base font-bold uppercase tracking-tight text-earth-900">
            Field Quadrants & Spatial Analysis
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {zones?.map((zone) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              selected={selectedZone?.id === zone.id}
              onClick={() => setSelectedZone(zone)}
            />
          ))}
        </div>

        {selectedZone && (
          <div className="mt-4">
            <ZoneDetail zone={selectedZone} />
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-earth-200 pb-1.5 last:border-0 last:pb-0">
      <span className="text-earth-500">{label}</span>
      <span className={highlight ? 'font-bold text-farm-800' : 'font-bold text-earth-900'}>
        {value}
      </span>
    </div>
  );
}
