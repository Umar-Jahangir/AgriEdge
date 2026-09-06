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

  if (loading) return <LoadingState message="Loading farm map..." />;
  if (error || !farmMap) return <ErrorState message={error || 'Failed to load'} onRetry={refetch} />;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-xl font-bold text-farm-800">Farm Map & Rover Tracking</h2>
        <p className="mt-1 text-sm text-earth-400">
          Autonomous rover systematically covers sampling points across the field
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FarmMap data={farmMap} />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-earth-200/60 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-farm-800">Rover Status</h3>
            <div className="mt-4 space-y-3">
              <InfoRow label="Status" value={farmMap.rover.state} highlight />
              <InfoRow label="Current Location" value={`${farmMap.rover.currentZone} - Point ${farmMap.rover.currentSamplingPoint}`} />
              <InfoRow label="Distance Covered" value={`${farmMap.rover.distanceCovered} km`} />
              <InfoRow label="Sampling Points" value={`${farmMap.rover.completedSamplingPoints} / ${farmMap.rover.totalSamplingPoints}`} />
              <InfoRow label="Battery" value={`${farmMap.rover.battery}%`} />
              <InfoRow label="Obstacle Status" value={farmMap.rover.obstacleStatus} />
            </div>
          </div>

          <div className="rounded-xl border border-earth-200/60 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-farm-800">Rover Workflow</h3>
            <ol className="mt-3 space-y-2 text-xs text-earth-600">
              <li className="flex gap-2"><span className="font-bold text-farm-600">1.</span> Move to sampling location</li>
              <li className="flex gap-2"><span className="font-bold text-farm-600">2.</span> Position soil sensors</li>
              <li className="flex gap-2"><span className="font-bold text-farm-600">3.</span> Collect soil measurements</li>
              <li className="flex gap-2"><span className="font-bold text-farm-600">4.</span> Capture crop images</li>
              <li className="flex gap-2"><span className="font-bold text-farm-600">5.</span> Process via Edge AI</li>
              <li className="flex gap-2"><span className="font-bold text-farm-600">6.</span> Assign zone & generate recommendations</li>
              <li className="flex gap-2"><span className="font-bold text-farm-600">7.</span> Move to next point</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Farm Zones */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-farm-800">Farm Zones</h3>
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
    <div className="flex items-center justify-between text-sm">
      <span className="text-earth-400">{label}</span>
      <span className={highlight ? 'font-semibold text-farm-600' : 'font-medium text-farm-800'}>{value}</span>
    </div>
  );
}
