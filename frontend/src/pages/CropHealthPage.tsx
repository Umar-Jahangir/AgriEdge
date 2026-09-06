import { useState } from 'react';
import { Camera, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { useCropAnalyses } from '../hooks/useData';
import { formatTimestamp } from '../utils/format';
import { cn } from '../utils/cn';
import type { CropHealthStatus } from '../types';

const healthStyles: Record<CropHealthStatus, { color: string; icon: typeof CheckCircle }> = {
  Healthy: { color: 'text-farm-600 bg-farm-50', icon: CheckCircle },
  'Possible Disease Detected': { color: 'text-red-600 bg-red-50', icon: AlertTriangle },
  'Possible Nutrient Deficiency': { color: 'text-amber-600 bg-amber-50', icon: AlertTriangle },
  'Water Stress': { color: 'text-orange-600 bg-orange-50', icon: AlertTriangle },
};

export function CropHealthPage() {
  const { data: analyses, loading, error, refetch } = useCropAnalyses();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  if (loading) return <LoadingState message="Loading crop analyses..." />;
  if (error || !analyses) return <ErrorState message={error || 'Failed to load'} onRetry={refetch} />;

  const latest = analyses[0];
  const selected = selectedId ? analyses.find((a) => a.id === selectedId) || latest : latest;
  const style = healthStyles[selected.cropHealth];

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadPreview(url);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-xl font-bold text-farm-800">Crop Health</h2>
        <p className="mt-1 text-sm text-earth-400">
          Images captured by rover camera — ready for AI disease & deficiency detection
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Latest Scan */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-earth-200/60 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-earth-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-farm-800">Latest Scan</h3>
              <p className="text-xs text-earth-400">{selected.notes}</p>
            </div>

            <div className="relative flex h-64 items-center justify-center bg-gradient-to-br from-farm-50 to-earth-50 sm:h-80">
              {uploadPreview ? (
                <img src={uploadPreview} alt="Uploaded crop" className="h-full w-full object-cover" />
              ) : (
                <div className="text-center">
                  <Camera className="mx-auto h-12 w-12 text-farm-300" />
                  <p className="mt-2 text-sm text-earth-400">Rover Camera Capture</p>
                  <p className="text-xs text-earth-300">{formatTimestamp(selected.timestamp)}</p>
                  <div className="mx-auto mt-4 h-32 w-48 rounded-lg bg-farm-100/50 flex items-center justify-center">
                    <LeafPlaceholder />
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <ResultCard label="Disease Detection" value={selected.diseaseDetection} />
              <ResultCard label="Confidence" value={`${selected.confidence}%`} />
              <div className={cn('rounded-lg p-3', style.color)}>
                <p className="text-xs opacity-70">Crop Health</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <style.icon className="h-4 w-4" />
                  <p className="text-sm font-semibold">{selected.cropHealth}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload + Previous Scans */}
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-dashed border-earth-200 bg-white p-6 text-center shadow-sm">
            <Upload className="mx-auto h-8 w-8 text-earth-300" />
            <p className="mt-2 text-sm font-medium text-farm-800">Upload Crop Image</p>
            <p className="mt-1 text-xs text-earth-400">
              For manual image analysis — will connect to AI model
            </p>
            <label className="mt-4 inline-block cursor-pointer rounded-lg bg-farm-600 px-4 py-2 text-xs font-semibold text-white hover:bg-farm-700">
              Choose File
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          </div>

          <div className="rounded-xl border border-earth-200/60 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-farm-800">Previous Scans</h3>
            <div className="mt-3 space-y-2">
              {analyses.map((scan) => (
                <button
                  key={scan.id}
                  onClick={() => setSelectedId(scan.id)}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left transition-colors',
                    (selectedId || latest.id) === scan.id
                      ? 'border-farm-300 bg-farm-50'
                      : 'border-earth-100 hover:bg-earth-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-farm-800">{scan.zoneId.toUpperCase()}</span>
                    <span className={cn('text-[10px] font-medium', healthStyles[scan.cropHealth].color.split(' ')[0])}>
                      {scan.cropHealthPercent}%
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-earth-400">{formatTimestamp(scan.timestamp)}</p>
                  <p className="text-[11px] text-earth-500">{scan.diseaseDetection}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-earth-50/50 p-3">
      <p className="text-xs text-earth-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-farm-800">{value}</p>
    </div>
  );
}

function LeafPlaceholder() {
  return (
    <svg viewBox="0 0 120 80" className="h-20 w-28 text-farm-400" fill="currentColor">
      <ellipse cx="60" cy="40" rx="50" ry="30" opacity="0.3" />
      <path d="M60 10 C30 20, 20 50, 60 70 C100 50, 90 20, 60 10" opacity="0.6" />
      <line x1="60" y1="10" x2="60" y2="70" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}
