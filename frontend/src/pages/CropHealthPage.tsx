import { useState } from 'react';
import { Camera, Upload, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { useCropAnalyses } from '../hooks/useData';
import { api } from '../services/api';
import { formatTimestamp } from '../utils/format';
import { cn } from '../utils/cn';
import type { CropAnalysis, CropHealthStatus } from '../types';

const healthStyles: Record<CropHealthStatus, { color: string; icon: typeof CheckCircle }> = {
  Healthy: { color: 'text-farm-600 bg-farm-50', icon: CheckCircle },
  'Possible Disease Detected': { color: 'text-red-600 bg-red-50', icon: AlertTriangle },
  'Possible Nutrient Deficiency': { color: 'text-amber-600 bg-amber-50', icon: AlertTriangle },
  'Water Stress': { color: 'text-orange-600 bg-orange-50', icon: AlertTriangle },
};

export function CropHealthPage() {
  const { data: initialAnalyses, loading, error, refetch } = useCropAnalyses();
  const [localScans, setLocalScans] = useState<CropAnalysis[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (loading) return <LoadingState message="Loading crop analyses..." />;
  if (error || !initialAnalyses) return <ErrorState message={error || 'Failed to load'} onRetry={refetch} />;

  const allScans = [...localScans, ...initialAnalyses];
  const latest = allScans[0];
  const selected = selectedId ? allScans.find((a) => a.id === selectedId) || latest : latest;
  const style = healthStyles[selected.cropHealth] || healthStyles['Healthy'];
  const displayImage = selected.imageUrl || uploadPreview;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setUploadPreview(preview);
    setIsAnalyzing(true);
    setUploadError(null);

    try {
      const result = await api.uploadCropImage(file, 'ZONE_B');
      setLocalScans((prev) => [result, ...prev]);
      setSelectedId(result.id);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to analyze crop image');
    } finally {
      setIsAnalyzing(false);
      e.target.value = '';
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-xl font-bold text-farm-800">Crop Health</h2>
        <p className="mt-1 text-sm text-earth-400">
          Edge AI leaf disease & nutrient deficiency detection powered by MobileNetV3 ONNX
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Latest Scan */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-earth-200/60 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-earth-100 px-5 py-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-farm-800">
                  {selectedId ? `Scan: ${selected.id}` : 'Latest Scan'}
                </h3>
                <p className="text-xs text-earth-400">{selected.notes}</p>
              </div>
              <span className="rounded-full bg-farm-100 px-2.5 py-0.5 text-[11px] font-semibold text-farm-800">
                {selected.zoneId.toUpperCase()}
              </span>
            </div>

            <div className="relative flex h-64 items-center justify-center bg-gradient-to-br from-farm-50 to-earth-50 sm:h-80">
              {isAnalyzing && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-farm-600" />
                  <p className="mt-2 text-sm font-medium text-farm-800">Running Edge AI inference...</p>
                  <p className="text-xs text-earth-400">Analyzing plant leaf foliage</p>
                </div>
              )}

              {displayImage ? (
                <img src={displayImage} alt="Crop scan" className="h-full w-full object-cover" />
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
            <Upload className="mx-auto h-8 w-8 text-farm-600" />
            <p className="mt-2 text-sm font-medium text-farm-800">Upload Crop Image</p>
            <p className="mt-1 text-xs text-earth-400">
              Run instant on-device diagnosis with the trained ML model
            </p>

            {uploadError && (
              <p className="mt-2 text-xs text-red-600 font-medium">{uploadError}</p>
            )}

            <label
              className={cn(
                'mt-4 inline-flex items-center gap-1.5 cursor-pointer rounded-lg bg-farm-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-farm-700',
                isAnalyzing && 'pointer-events-none opacity-60'
              )}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Choose File'
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isAnalyzing}
                onChange={handleUpload}
              />
            </label>
          </div>

          <div className="rounded-xl border border-earth-200/60 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-farm-800">Previous Scans</h3>
            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
              {allScans.map((scan) => {
                const scanStyle = healthStyles[scan.cropHealth] || healthStyles['Healthy'];
                return (
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
                      <span className={cn('text-[10px] font-medium', scanStyle.color.split(' ')[0])}>
                        {scan.cropHealthPercent}%
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-earth-400">{formatTimestamp(scan.timestamp)}</p>
                    <p className="text-[11px] font-medium text-earth-600 truncate">{scan.diseaseDetection}</p>
                  </button>
                );
              })}
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
