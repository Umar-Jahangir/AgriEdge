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

  if (loading) return <LoadingState message="Loading rover data..." />;

  const currentRover = rover || farmMap?.rover;

  return (
    <div className="animate-fade-in space-y-6">
      <RoverStatusLoader onLoad={fetchStatus} />

      <div>
        <h2 className="text-xl font-bold text-farm-800">Rover Control & Status</h2>
        <p className="mt-1 text-sm text-earth-400">
          Monitor and control the autonomous agricultural rover
        </p>
      </div>

      {currentRover && <RoverStatusPanel rover={currentRover} />}

      <RoverControls
        rover={currentRover || null}
        actionLoading={actionLoading}
        onAction={executeAction}
      />

      {farmMap && (
        <div className="grid gap-6 lg:grid-cols-2">
          <FarmMap data={{ ...farmMap, rover: currentRover || farmMap.rover }} compact />
          <div className="rounded-xl border border-earth-200/60 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-farm-800">Mission Progress</h3>
            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-earth-400">Sampling Progress</span>
                <span className="font-medium text-farm-700">
                  {currentRover?.completedSamplingPoints || 0} / {currentRover?.totalSamplingPoints || 30}
                </span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-earth-100">
                <div
                  className="h-full rounded-full bg-farm-500 transition-all duration-700"
                  style={{
                    width: `${((currentRover?.completedSamplingPoints || 0) / (currentRover?.totalSamplingPoints || 30)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="mt-6 space-y-3 text-sm">
              <p className="text-earth-600">
                The rover autonomously navigates through predefined sampling points,
                collecting soil sensor data and crop images at each location.
              </p>
              <p className="text-xs text-earth-400">
                Control buttons simulate state changes locally. Physical rover control
                will be available via FastAPI endpoints when hardware is connected.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
