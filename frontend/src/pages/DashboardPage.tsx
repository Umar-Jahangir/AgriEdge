import {
  Droplets,
  Thermometer,
  FlaskConical,
  Zap,
  Leaf,
  Activity,
  Gauge,
} from 'lucide-react';
import { KPICard } from '../components/ui/KPICard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { FarmMap } from '../components/farm/FarmMap';
import { RecommendationCard } from '../components/recommendations/RecommendationCard';
import { useDashboard, useFarmMap, useRecommendations } from '../hooks/useData';
import { healthStatusColor } from '../utils/format';

export function DashboardPage() {
  const { data: dashboard, loading, error, refetch } = useDashboard();
  const { data: farmMap } = useFarmMap();
  const { data: recommendations } = useRecommendations();

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error || !dashboard) return <ErrorState message={error || 'Failed to load'} onRetry={refetch} />;

  const farmStatusVariant =
    dashboard.farmStatus === 'Healthy' ? 'success' : dashboard.farmStatus === 'Critical' ? 'danger' : 'warning';

  return (
    <div className="animate-fade-in space-y-6">
      {/* Hero Header */}
      <div className="rounded-xl border border-earth-200/60 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-farm-500">
              Smart Farming Assistant
            </p>
            <h2 className="mt-1 text-2xl font-bold text-farm-800">AI-Powered Field Intelligence</h2>
            <p className="mt-1 text-sm text-earth-400">
              Autonomous rover-based monitoring · Edge AI analysis · Actionable recommendations
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <StatusItem label="Farm Status" value={dashboard.farmStatus} variant={farmStatusVariant} />
            <StatusItem label="Last Scan" value={dashboard.lastScan} />
            <StatusItem label="Rover" value={dashboard.roverStatus} variant="success" />
            <StatusItem label="Connectivity" value={dashboard.connectivity} variant="success" />
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="AI Soil Condition Score"
          value={`${dashboard.soilConditionScore}/100`}
          status={dashboard.soilConditionStatus}
          statusColor={healthStatusColor(dashboard.soilConditionStatus)}
          subtitle="Derived from moisture, pH, EC, NPK & temperature"
          icon={Gauge}
        />
        <KPICard
          title="Soil Moisture"
          value={`${dashboard.soilMoisture}%`}
          status={dashboard.soilMoistureStatus}
          statusColor={healthStatusColor(dashboard.soilMoistureStatus)}
          icon={Droplets}
        />
        <KPICard
          title="Temperature"
          value={`${dashboard.temperature}°C`}
          icon={Thermometer}
        />
        <KPICard
          title="Soil pH"
          value={dashboard.soilPh}
          status={dashboard.soilPhStatus}
          statusColor={healthStatusColor(dashboard.soilPhStatus)}
          icon={FlaskConical}
        />
        <KPICard
          title="Electrical Conductivity"
          value={`${dashboard.electricalConductivity} mS/cm`}
          icon={Zap}
        />
        <KPICard
          title="NPK Status"
          value={`N:${dashboard.npk.nitrogen} P:${dashboard.npk.phosphorus} K:${dashboard.npk.potassium}`}
          subtitle="ppm"
          icon={Activity}
        />
        <KPICard
          title="Crop Health"
          value={`${dashboard.cropHealth}%`}
          statusColor="text-farm-600"
          icon={Leaf}
        />
        <KPICard
          title="Water Stress"
          value={dashboard.waterStress}
          statusColor={
            dashboard.waterStress === 'LOW' ? 'text-farm-600' : dashboard.waterStress === 'MEDIUM' ? 'text-amber-600' : 'text-red-600'
          }
          icon={Droplets}
        />
      </div>

      {/* Farm Map + Recommendations */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {farmMap && <FarmMap data={farmMap} />}
          {farmMap && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="Rover" value={farmMap.rover.state} />
              <MiniStat label="Location" value={`${farmMap.rover.currentZone} - Pt ${farmMap.rover.currentSamplingPoint}`} />
              <MiniStat label="Distance" value={`${farmMap.rover.distanceCovered} km`} />
              <MiniStat label="Battery" value={`${farmMap.rover.battery}%`} />
            </div>
          )}
        </div>
        <div className="lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-farm-800">Latest AI Recommendations</h3>
          <div className="space-y-3">
            {recommendations?.slice(0, 3).map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant?: 'success' | 'warning' | 'danger';
}) {
  return (
    <div className="text-center sm:text-left">
      <p className="text-[10px] uppercase tracking-wider text-earth-400">{label}</p>
      {variant ? (
        <StatusBadge label={value} variant={variant} dot className="mt-1" />
      ) : (
        <p className="mt-1 text-sm font-semibold text-farm-800">{value}</p>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-earth-200/60 bg-white px-3 py-2 text-center shadow-sm">
      <p className="text-[10px] text-earth-400">{label}</p>
      <p className="text-xs font-semibold text-farm-800">{value}</p>
    </div>
  );
}
