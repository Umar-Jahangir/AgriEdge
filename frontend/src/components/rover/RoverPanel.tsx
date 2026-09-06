import { useEffect } from 'react';
import type { RoverStatus } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { roverStateColor } from '../../utils/format';
import { cn } from '../../utils/cn';
import {
  Battery,
  MapPin,
  Navigation,
  Radio,
  Shield,
  Target,
} from 'lucide-react';

interface RoverStatusPanelProps {
  rover: RoverStatus;
}

export function RoverStatusPanel({ rover }: RoverStatusPanelProps) {
  const stateVariant = rover.state === 'ACTIVE' ? 'success' : rover.state === 'OFFLINE' || rover.state === 'EMERGENCY_STOP' ? 'danger' : 'warning';

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Stat icon={Navigation} label="Rover Status" value={rover.state} variant={stateVariant} />
      <Stat icon={Battery} label="Battery" value={`${rover.battery}%`} />
      <Stat icon={MapPin} label="Current Zone" value={rover.currentZone} />
      <Stat icon={Target} label="Sampling Point" value={`${rover.currentSamplingPoint}`} />
      <Stat icon={Navigation} label="Distance Covered" value={`${rover.distanceCovered} km`} />
      <Stat icon={Target} label="Sampling Points" value={`${rover.completedSamplingPoints}/${rover.totalSamplingPoints}`} />
      <Stat icon={Shield} label="Obstacle Status" value={rover.obstacleStatus} />
      <Stat icon={Radio} label="Connection" value={rover.connection} />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  variant,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  variant?: 'success' | 'warning' | 'danger';
}) {
  return (
    <div className="rounded-xl border border-earth-200/60 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-farm-500" />
        <span className="text-xs text-earth-400">{label}</span>
      </div>
      {variant ? (
        <div className="mt-2">
          <StatusBadge label={value} variant={variant} dot />
        </div>
      ) : (
        <p className={cn('mt-2 text-lg font-semibold text-farm-800')}>{value}</p>
      )}
    </div>
  );
}

interface RoverControlsProps {
  rover: RoverStatus | null;
  actionLoading: string | null;
  onAction: (action: 'start' | 'pause' | 'resume' | 'return' | 'emergency-stop') => void;
}

export function RoverControls({ rover, actionLoading, onAction }: RoverControlsProps) {
  const isActive = rover?.state === 'ACTIVE';
  const isPaused = rover?.state === 'PAUSED';
  const isEmergency = rover?.state === 'EMERGENCY_STOP';

  const buttons = [
    { action: 'start' as const, label: 'START MISSION', variant: 'primary', disabled: isActive },
    { action: 'pause' as const, label: 'PAUSE', variant: 'secondary', disabled: !isActive },
    { action: 'resume' as const, label: 'RESUME', variant: 'secondary', disabled: !isPaused },
    { action: 'return' as const, label: 'RETURN TO BASE', variant: 'secondary', disabled: isEmergency },
    { action: 'emergency-stop' as const, label: 'EMERGENCY STOP', variant: 'danger', disabled: isEmergency },
  ];

  return (
    <div className="rounded-xl border border-earth-200/60 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-farm-800">Rover Controls</h3>
      <p className="mt-1 text-xs text-earth-400">
        Simulated controls — will connect to FastAPI rover endpoints
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {buttons.map((btn) => (
          <button
            key={btn.action}
            disabled={btn.disabled || actionLoading === btn.action}
            onClick={() => onAction(btn.action)}
            className={cn(
              'rounded-lg px-4 py-2.5 text-xs font-semibold tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-40',
              btn.variant === 'primary' && 'bg-farm-600 text-white hover:bg-farm-700',
              btn.variant === 'secondary' && 'border border-earth-300 bg-white text-farm-700 hover:bg-farm-50',
              btn.variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700'
            )}
          >
            {actionLoading === btn.action ? 'Processing...' : btn.label}
          </button>
        ))}
      </div>
      {rover && (
        <p className={cn('mt-3 text-xs font-medium', roverStateColor(rover.state))}>
          Current state: {rover.state}
        </p>
      )}
    </div>
  );
}

export function RoverStatusLoader({ onLoad }: { onLoad: () => void }) {
  useEffect(() => {
    onLoad();
  }, [onLoad]);
  return null;
}
