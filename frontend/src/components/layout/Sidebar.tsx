import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Droplets,
  Leaf,
  Brain,
  Lightbulb,
  CloudSun,
  Bot,
  BarChart3,
  Bell,
  Settings,
  X,
  Sprout,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useSystemStatus } from '../../hooks/useData';
import { connectionColor } from '../../utils/format';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/farm-map', label: 'Farm Map', icon: Map },
  { to: '/soil-health', label: 'Soil Health', icon: Droplets },
  { to: '/crop-health', label: 'Crop Health', icon: Leaf },
  { to: '/ai-analysis', label: 'AI Analysis', icon: Brain },
  { to: '/recommendations', label: 'Recommendations', icon: Lightbulb },
  { to: '/environmental-risk', label: 'Environmental Risk', icon: CloudSun },
  { to: '/rover', label: 'Rover', icon: Bot },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { data: systemStatus } = useSystemStatus();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-earth-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-earth-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-farm-600 p-1.5">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide text-farm-800">AGRIEDGE</p>
              <p className="text-[10px] text-earth-400">Rover</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden">
            <X className="h-5 w-5 text-earth-400" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-farm-50 text-farm-700'
                        : 'text-earth-600 hover:bg-earth-50 hover:text-farm-700'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-earth-100 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-earth-400">
            System Status
          </p>
          <div className="mt-2 space-y-1.5">
            <StatusLine label="Edge AI" status={systemStatus?.edgeAI ?? 'Connected'} />
            <StatusLine label="Sensors" status={systemStatus?.sensors ?? 'Connected'} />
            <StatusLine label="Backend" status={systemStatus?.backend ?? 'Connected'} />
          </div>
        </div>
      </aside>
    </>
  );
}

function StatusLine({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={cn('h-1.5 w-1.5 rounded-full', connectionColor(status as 'Connected').replace('text-', 'bg-'))} />
      <span className="text-earth-500">{label}</span>
      <span className={cn('ml-auto font-medium', connectionColor(status as 'Connected'))}>
        {status === 'Connected' ? 'Online' : status}
      </span>
    </div>
  );
}
