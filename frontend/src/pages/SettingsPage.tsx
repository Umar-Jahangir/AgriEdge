import { Settings, Database, Wifi, Cpu, Info } from 'lucide-react';
import { DemoModeBanner } from '../components/ui/DemoModeBanner';
import { API_CONFIG } from '../services/config';

export function SettingsPage() {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-earth-300 pb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-farm-800">
            // HARDWARE & NETWORK CONFIGURATION
          </span>
          <span className="border border-earth-300 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-earth-700">
            SYSTEM DIAGNOSTICS
          </span>
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-earth-900">
          Edge Architecture & Gateway Settings
        </h2>
        <p className="font-mono text-xs text-earth-600">
          Hardware telemetry baud rates, API gateways, on-device ONNX runtime environment, and LoRa radios.
        </p>
      </div>

      {/* Application Mode Slab */}
      <div className="tactile-card bg-white p-5">
        <div className="flex items-center gap-3 border-b border-earth-200 pb-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center border border-earth-300 bg-earth-100">
            <Settings className="h-4 w-4 text-earth-800" />
          </div>
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
              // RUNTIME MODE
            </span>
            <h3 className="font-display text-sm font-bold uppercase tracking-tight text-earth-900">
              Application Operating Mode
            </h3>
          </div>
        </div>

        <DemoModeBanner />

        <p className="mt-3 font-mono text-xs text-earth-700 leading-relaxed">
          The workstation currently queries simulated sensor telemetry. To bind directly to live FastAPI hardware telemetry, configure{' '}
          <code className="border border-earth-300 bg-earth-100 px-1.5 py-0.5 text-xs text-earth-900">
            VITE_USE_MOCK=false
          </code>{' '}
          in your local <code className="border border-earth-300 bg-earth-100 px-1.5 py-0.5 text-xs text-earth-900">.env</code> file.
        </p>
      </div>

      {/* System Diagnostic Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SettingCard
          icon={Database}
          title="API Gateway Configuration"
          tag="FASTAPI BACKEND"
          items={[
            { label: 'BASE URL', value: API_CONFIG.BASE_URL },
            { label: 'SIMULATION MODE', value: API_CONFIG.USE_MOCK ? 'ACTIVE (MOCK)' : 'LIVE (FASTAPI)' },
            { label: 'AUTHENTICATION', value: 'BEARER TOKEN (OFFLINE FALLBACK)' },
          ]}
        />
        <SettingCard
          icon={Cpu}
          title="Edge AI Diagnostic Core"
          tag="RASPBERRY PI 5"
          items={[
            { label: 'TARGET HARDWARE', value: 'Raspberry Pi 5 (4GB) / ARM Cortex-A76' },
            { label: 'NEURAL RUNTIME', value: 'ONNX Runtime 1.20 (Quantized INT8)' },
            { label: 'MODEL PROFILE', value: 'MobileNetV3 (42 Botanical Classes)' },
          ]}
        />
        <SettingCard
          icon={Wifi}
          title="Telemetry Bus & Radios"
          tag="868MHZ LORA"
          items={[
            { label: 'SOIL SENSOR LINK', value: 'ESP32 RS485 Subterranean Bus' },
            { label: 'ROVER TELEMETRY', value: 'SX1262 LoRa 868MHz (14dBm)' },
            { label: 'OPTICAL CAMERA', value: 'CSI Ribbon 5MP Omnivision OV5647' },
          ]}
        />
        <SettingCard
          icon={Info}
          title="Smart Farming Initiative"
          tag="SIH 2026"
          items={[
            { label: 'PROJECT TITLE', value: 'AgriEdge Autonomous Agricultural Rover' },
            { label: 'DEVELOPMENT STAGE', value: 'Functional Prototype / Field Testing' },
            { label: 'ARCHITECTURE', value: 'Offline-First Edge Computing' },
          ]}
        />
      </div>

      {/* Active Endpoints Ledger */}
      <div className="tactile-card bg-white p-5">
        <div className="border-b border-earth-200 pb-3 mb-3 flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
              // TELEMETRY ROUTE REGISTRY
            </span>
            <h3 className="font-display text-sm font-bold uppercase tracking-tight text-earth-900">
              Backend REST & Telemetry Endpoints
            </h3>
          </div>
          <span className="font-mono text-[10px] text-earth-500">
            TOTAL ROUTES: {Object.keys(API_CONFIG.ENDPOINTS).length}
          </span>
        </div>

        <div className="grid gap-2 font-mono text-xs sm:grid-cols-2">
          {Object.entries(API_CONFIG.ENDPOINTS).map(([key, path]) => (
            <div key={key} className="border border-earth-200 bg-earth-50/80 p-2 flex items-center justify-between">
              <span className="font-bold text-farm-800">{key}:</span>
              <span className="text-earth-600">{path}</span>
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
  tag,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tag: string;
  items: { label: string; value: string }[];
}) {
  return (
    <div className="tactile-card bg-white p-5">
      <div className="flex items-center justify-between border-b border-earth-200 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-earth-700" />
          <h3 className="font-display text-xs font-bold uppercase tracking-tight text-earth-900">{title}</h3>
        </div>
        <span className="border border-earth-300 bg-earth-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-earth-800">
          {tag}
        </span>
      </div>
      <div className="space-y-2 font-mono text-xs">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between border-b border-earth-100 pb-1.5 last:border-0 last:pb-0">
            <span className="text-earth-500">{item.label}</span>
            <span className="font-bold text-earth-900 text-right">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
