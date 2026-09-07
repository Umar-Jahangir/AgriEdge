import { useEffect } from 'react';
import { FarmMap } from '../components/farm/FarmMap';
import { RoverStatusPanel, RoverControls, RoverStatusLoader } from '../components/rover/RoverPanel';
import { LoadingState } from '../components/ui/LoadingState';
import { useFarmMap } from '../hooks/useData';
import { useRoverControl } from '../hooks/useRover';

export function RoverPage() {
  const { data: farmMap, loading } = useFarmMap();
  const { rover, actionLoading, fetchStatus, executeAction } = useRoverControl();

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (loading) return <LoadingState message="Synchronizing with rover telemetry bus..." />;

  const currentRover = rover || farmMap?.rover;
  const completed = currentRover?.completedSamplingPoints || 0;
  const total = currentRover?.totalSamplingPoints || 30;
  const progressPercent = Math.round((completed / total) * 100);

  return (
    <div className="animate-fade-in space-y-6">
      <RoverStatusLoader onLoad={fetchStatus} />

      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-earth-300 pb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-farm-800">
            // AUTONOMOUS MISSION CONTROL
          </span>
          <span className="border border-earth-300 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-earth-700">
            ROVER UNIT: AGRI-01
          </span>
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-earth-900">
          Rover Telemetry & Actuation Command
        </h2>
        <p className="font-mono text-xs text-earth-600">
          Supervise waypoint navigation, sub-surface sampling cycle, and camera actuation protocols.
        </p>
      </div>

      {/* Primary Hardware Status Panel */}
      {currentRover && <RoverStatusPanel rover={currentRover} />}

      {/* Rover Physical Controls */}
      <RoverControls
        rover={currentRover || null}
        actionLoading={actionLoading}
        onAction={executeAction}
      />

      {/* Tactical Map & Mission Progress Bento */}
      {farmMap && (
        <div className="grid gap-6 lg:grid-cols-2">
          <FarmMap data={{ ...farmMap, rover: currentRover || farmMap.rover }} compact />

          <div className="tactile-card bg-white p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-earth-200 pb-3 mb-4">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
                    // SAMPLING MISSION METRICS
                  </span>
                  <h3 className="font-display text-sm font-bold uppercase tracking-tight text-earth-900">
                    Field Survey Progress
                  </h3>
                </div>
                <span className="border border-earth-300 bg-earth-100 px-2 py-0.5 font-mono text-[11px] font-bold text-earth-800">
                  {progressPercent}% COMPLETE
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-xs text-earth-700">
                  <span>WAYPOINT PROBES</span>
                  <span className="font-bold text-earth-900">
                    {completed} OF {total} SAMPLES
                  </span>
                </div>
                <div className="h-3 w-full border border-earth-300 bg-earth-100 p-0.5">
                  <div
                    className="h-full bg-farm-800 transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="mt-6 space-y-3 font-mono text-xs text-earth-700">
                <div className="border border-earth-200 bg-earth-50/80 p-3">
                  <span className="font-bold text-earth-900 uppercase">// WAYPOINT EXECUTION CYCLE:</span>
                  <ol className="mt-2 space-y-1 text-[11px] text-earth-600 list-decimal list-inside">
                    <li>Navigate to designated GPS coordinate</li>
                    <li>Lower dual-depth soil sensor probe (10cm / 20cm)</li>
                    <li>Acquire moisture, temp, pH & NPK impedance metrics</li>
                    <li>Trigger optical leaf camera at 45° incident angle</li>
                    <li>Execute on-device Edge AI inference & broadcast payload</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-earth-200 pt-3 font-mono text-[10px] text-earth-500">
              FAILSAFE PROTOCOL: Auto-return engaged when battery &lt; 15% or obstacle detected within 0.5m.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
