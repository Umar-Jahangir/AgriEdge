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
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useSystemStatus } from '../../hooks/useData';
import { useLanguage } from '../../context/LanguageContext';
import type { Translations } from '../../i18n/translations';

const navItems: { to: string; labelKey: keyof Translations; icon: LucideIcon }[] = [
  { to: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { to: '/farm-map', labelKey: 'farmMap', icon: Map },
  { to: '/soil-health', labelKey: 'soilHealth', icon: Droplets },
  { to: '/crop-health', labelKey: 'cropHealth', icon: Leaf },
  { to: '/ai-analysis', labelKey: 'aiAnalysis', icon: Brain },
  { to: '/recommendations', labelKey: 'recommendations', icon: Lightbulb },
  { to: '/environmental-risk', labelKey: 'environmentalRisk', icon: CloudSun },
  { to: '/rover', labelKey: 'rover', icon: Bot },
  { to: '/analytics', labelKey: 'analytics', icon: BarChart3 },
  { to: '/alerts', labelKey: 'alerts', icon: Bell },
  { to: '/settings', labelKey: 'settings', icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { data: systemStatus } = useSystemStatus();
  const { t } = useLanguage();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-earth-300 bg-[#fbfaf6] transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-earth-200 px-5 py-4 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center bg-farm-900 text-white">
              <Sprout className="h-4 w-4 text-farm-300" />
            </div>
            <div>
              <p className="font-display text-sm font-bold tracking-tight text-farm-950 leading-none">
                AGRIEDGE
              </p>
              <p className="mt-1 font-mono text-[10px] tracking-widest uppercase text-earth-500">
                FIELD // WORKSTATION
              </p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-earth-500 hover:text-earth-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <p className="px-3 pb-2 pt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-earth-500">
            // TELEMETRY & OPERATIONS
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 text-xs transition-colors',
                      isActive
                        ? 'bg-farm-900 text-white font-semibold border-l-2 border-farm-400'
                        : 'text-earth-800 hover:bg-earth-100/80 hover:text-earth-950 font-medium'
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0 opacity-80" />
                  <span className="font-display tracking-tight text-[13px]">{t(item.labelKey)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-earth-300 bg-earth-50/50 p-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-earth-600">
              [SYSTEM STATUS]
            </p>
            <span className="h-2 w-2 rounded-full bg-farm-500 animate-pulse" />
          </div>
          <div className="mt-2.5 space-y-1.5 font-mono text-[11px]">
            <StatusLine label="EDGE AI" status={systemStatus?.edgeAI ?? 'Connected'} />
            <StatusLine label="SENSORS" status={systemStatus?.sensors ?? 'Connected'} />
            <StatusLine label="BACKEND" status={systemStatus?.backend ?? 'Connected'} />
          </div>
        </div>
      </aside>
    </>
  );
}

function StatusLine({ label, status }: { label: string; status: string }) {
  const isOnline = status === 'Connected';
  return (
    <div className="flex items-center justify-between border-b border-earth-200/60 pb-1 text-xs">
      <span className="text-earth-600">{label}</span>
      <span
        className={cn(
          'px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
          isOnline ? 'bg-farm-100 text-farm-800' : 'bg-amber-100 text-amber-800'
        )}
      >
        {isOnline ? 'ONLINE' : status}
      </span>
    </div>
  );
}
