import { Settings, Database, Wifi, Cpu, Info } from 'lucide-react';
import { DemoModeBanner } from '../components/ui/DemoModeBanner';
import { API_CONFIG } from '../services/config';

export function SettingsPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-xl font-bold text-farm-800">Settings</h2>
        <p className="mt-1 text-sm text-earth-400">System configuration and integration status</p>
      </div>

      <div className="rounded-xl border border-earth-200/60 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Settings className="h-5 w-5 text-farm-600" />
          <h3 className="text-sm font-semibold text-farm-800">Application Mode</h3>
        </div>
        <div className="mt-4">
          <DemoModeBanner />
          <p className="mt-3 text-sm text-earth-600">
            The application is running in demo mode with simulated sensor data.
            To connect to the FastAPI backend, set <code className="rounded bg-earth-100 px-1.5 py-0.5 text-xs">VITE_USE_MOCK=false</code> in your <code className="rounded bg-earth-100 px-1.5 py-0.5 text-xs">.env</code> file.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SettingCard
          icon={Database}
          title="API Configuration"
          items={[
            { label: 'Base URL', value: API_CONFIG.BASE_URL },
            { label: 'Mock Mode', value: API_CONFIG.USE_MOCK ? 'Enabled' : 'Disabled' },
          ]}
        />
        <SettingCard
          icon={Cpu}
          title="Edge AI"
          items={[
            { label: 'Platform', value: 'Raspberry Pi' },
            { label: 'Status', value: 'Connected (Demo)' },
          ]}
        />
        <SettingCard
          icon={Wifi}
          title="Connectivity"
          items={[
            { label: 'ESP32 Sensors', value: 'Connected (Demo)' },
            { label: 'Rover Link', value: 'Connected (Demo)' },
          ]}
        />
        <SettingCard
          icon={Info}
          title="Project Info"
          items={[
            { label: 'Project', value: 'Smart Farming Assistant' },
            { label: 'Event', value: 'SIH 2026' },
          ]}
        />
      </div>

      <div className="rounded-xl border border-earth-200/60 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-farm-800">Planned API Endpoints</h3>
        <div className="mt-3 grid gap-1 text-xs font-mono text-earth-500 sm:grid-cols-2">
          {Object.entries(API_CONFIG.ENDPOINTS).map(([key, path]) => (
            <div key={key} className="rounded bg-earth-50 px-2 py-1">
              <span className="text-earth-400">{key}:</span> {path}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingCard({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-xl border border-earth-200/60 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-farm-500" />
        <h3 className="text-sm font-semibold text-farm-800">{title}</h3>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between text-sm">
            <span className="text-earth-400">{item.label}</span>
            <span className="font-medium text-farm-800">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
