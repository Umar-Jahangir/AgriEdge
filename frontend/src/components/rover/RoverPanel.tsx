import { useEffect } from 'react';
import type { RoverStatus } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
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
  const stateVariant =
    rover.state === 'ACTIVE'
      ? 'success'
      : rover.state === 'OFFLINE' || rover.state === 'EMERGENCY_STOP'
      ? 'danger'
      : 'warning';

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat icon={Navigation} label="ROVER STATE" value={rover.state} variant={stateVariant} />
      <Stat icon={Battery} label="BATTERY LEVEL" value={`${rover.battery}%`} />
      <Stat icon={MapPin} label="OPERATING ZONE" value={rover.currentZone} />
      <Stat icon={Target} label="TARGET SAMPLING PT" value={`#${rover.currentSamplingPoint}`} />
      <Stat icon={Navigation} label="DISTANCE TRAVERSED" value={`${rover.distanceCovered} km`} />
      <Stat
        icon={Target}
        label="WAYPOINT COMPLETION"
        value={`${rover.completedSamplingPoints}/${rover.totalSamplingPoints}`}
      />
      <Stat icon={Shield} label="COLLISION SENSOR" value={rover.obstacleStatus} />
      <Stat icon={Radio} label="TELEMETRY LINK" value={rover.connection} />
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
    <div className="tactile-card bg-white p-4">
      <div className="flex items-center justify-between border-b border-earth-200 pb-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-earth-500">
          {label}
        </span>
        <Icon className="h-3.5 w-3.5 text-earth-400" />
      </div>
      <div className="mt-2.5">
        {variant ? (
          <StatusBadge label={value} variant={variant} dot />
        ) : (
          <p className="font-mono text-base font-bold text-earth-900">{value}</p>
        )}
      </div>
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
    <div className="tactile-card bg-white p-5">
      <div className="flex items-center justify-between border-b border-earth-200 pb-3 mb-4">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
            // OPERATOR ACTUATOR CONSOLE
          </span>
          <h3 className="font-display text-sm font-bold uppercase tracking-tight text-earth-900">
            Hardware Actuation & Mission Directives
          </h3>
        </div>
        {rover && (
          <span className="border border-earth-300 bg-earth-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-earth-800">
            STATE: {rover.state}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5">
        {buttons.map((btn) => (
          <button
            key={btn.action}
            disabled={btn.disabled || actionLoading === btn.action}
            onClick={() => onAction(btn.action)}
            className={cn(
              'border px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-30',
              btn.variant === 'primary' &&
                'border-farm-900 bg-farm-800 text-white hover:bg-farm-900 active:translate-y-0.5 shadow-xs',
              btn.variant === 'secondary' &&
                'border-earth-300 bg-earth-100 text-earth-900 hover:bg-earth-200/80 active:translate-y-0.5',
              btn.variant === 'danger' &&
                'border-red-800 bg-red-700 text-white hover:bg-red-800 active:translate-y-0.5 shadow-xs'
            )}
          >
            {actionLoading === btn.action ? 'TRANSMITTING...' : btn.label}
          </button>
        ))}
      </div>

      <div className="mt-4 border-t border-earth-200 pt-3">
        <p className="font-mono text-[11px] text-earth-500">
          COMMAND PROTOCOL: 868MHz LoRa Transceiver via Serial Gateway (FastAPI /api/rover/action)
        </p>
      </div>
    </div>
  );
}

export function RoverStatusLoader({ onLoad }: { onLoad: () => void }) {
  useEffect(() => {
    onLoad();
  }, [onLoad]);
  return null;
}
