import { useState } from 'react';
import { Camera, Upload, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { useCropAnalyses } from '../hooks/useData';
import { api } from '../services/api';
import { formatTimestamp } from '../utils/format';
import { cn } from '../utils/cn';
import type { CropAnalysis, CropHealthStatus } from '../types';

const healthStyles: Record<CropHealthStatus, { color: string; border: string; icon: typeof CheckCircle }> = {
  Healthy: { color: 'text-farm-800 bg-farm-100', border: 'border-farm-400', icon: CheckCircle },
  'Possible Disease Detected': { color: 'text-red-700 bg-red-100', border: 'border-red-400', icon: AlertTriangle },
  'Possible Nutrient Deficiency': { color: 'text-amber-800 bg-amber-100', border: 'border-amber-400', icon: AlertTriangle },
  'Water Stress': { color: 'text-orange-800 bg-orange-100', border: 'border-orange-400', icon: AlertTriangle },
};

export function CropHealthPage() {
  const { data: initialAnalyses, loading, error, refetch } = useCropAnalyses();
  const [localScans, setLocalScans] = useState<CropAnalysis[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (loading) return <LoadingState message="Connecting to Edge AI inference ledger..." />;
  if (error || !initialAnalyses) return <ErrorState message={error || 'Failed to load telemetry'} onRetry={refetch} />;

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
      {/* Page Header */}
      <div className="flex flex-col gap-1 border-b border-earth-300 pb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-farm-800">
            // EDGE AI VISION TELEMETRY
          </span>
          <span className="border border-earth-300 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-earth-700">
            MOBILENETV3 ONNX QUANTIZED
          </span>
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-earth-900">
          Crop Pathology & Leaf Inspection Station
        </h2>
        <p className="font-mono text-xs text-earth-600">
          Autonomous leaf canopy capture analyzed via on-device 42-class disease & nutrient diagnostic model.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Latest Scan Inspection Viewport */}
        <div className="lg:col-span-2">
          <div className="tactile-card bg-white p-5">
            <div className="flex items-center justify-between border-b border-earth-200 pb-3 mb-4">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
                  // OPTICAL DIAGNOSTIC SCAN
                </span>
                <h3 className="font-display text-sm font-bold uppercase tracking-tight text-earth-900">
                  {selectedId ? `SCAN FRAME: ${selected.id}` : 'LATEST ROVER CAPTURE'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="border border-earth-300 bg-earth-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-earth-800">
                  SECTOR {selected.zoneId.toUpperCase()}
                </span>
                <span className="font-mono text-[11px] text-earth-500">
                  {formatTimestamp(selected.timestamp)}
                </span>
              </div>
            </div>

            {/* Tactical Viewport Container */}
            <div className="relative flex h-72 items-center justify-center border-2 border-earth-300 bg-earth-900 sm:h-96 overflow-hidden">
              {/* Tactical Viewfinder Reticles */}
              <div className="absolute left-3 top-3 pointer-events-none z-10 font-mono text-[9px] font-bold text-white/80">
                ┌─ [CANOPY_CAM_01 // 224×224 TENSOR]
              </div>
              <div className="absolute right-3 top-3 pointer-events-none z-10 font-mono text-[9px] font-bold text-white/80">
                [EXPOSURE: AUTO] ─┐
              </div>
              <div className="absolute left-3 bottom-3 pointer-events-none z-10 font-mono text-[9px] font-bold text-white/80">
                └─ [FOCUS: LOCKED]
              </div>
              <div className="absolute right-3 bottom-3 pointer-events-none z-10 font-mono text-[9px] font-bold text-white/80">
                [ISO: 100] ─┘
              </div>

              {isAnalyzing && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-earth-900/90 text-white backdrop-blur-xs">
                  <Loader2 className="h-8 w-8 animate-spin text-farm-400" />
                  <p className="mt-3 font-mono text-xs font-bold uppercase tracking-widest text-farm-300">
                    EXECUTING TENSOR INFERENCE...
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-earth-400">
                    Evaluating 42 botanical disease & nutrient classes
                  </p>
                </div>
              )}

              {displayImage ? (
                <img src={displayImage} alt="Crop scan" className="h-full w-full object-contain" />
              ) : (
                <div className="text-center p-6">
                  <Camera className="mx-auto h-12 w-12 text-earth-600" />
                  <p className="mt-3 font-mono text-xs font-bold text-earth-300 uppercase tracking-wider">
                    Rover Optical Camera Frame
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-earth-500">
                    TIMESTAMP: {formatTimestamp(selected.timestamp)}
                  </p>
                  <div className="mx-auto mt-4 flex items-center justify-center border border-earth-700 bg-earth-800/60 p-4">
                    <LeafPlaceholder />
                  </div>
                </div>
              )}
            </div>

            {/* Diagnostic Readout Slab */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="border border-earth-300 bg-earth-50/80 p-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-earth-500">
                  TOP AI CLASSIFICATION
                </span>
                <p className="mt-1 font-display text-sm font-bold text-earth-900 truncate">
                  {selected.diseaseDetection}
                </p>
              </div>

              <div className="border border-earth-300 bg-earth-50/80 p-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-earth-500">
                  CONFIDENCE SCORE
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-xl font-bold text-earth-900">
                    {selected.confidence}%
                  </span>
                  <span className="font-mono text-[10px] text-earth-500">
                    {selected.confidence >= 80 ? '[HIGH CERTAINTY]' : '[MODERATE CERTAINTY]'}
                  </span>
                </div>
              </div>

              <div className={cn('border p-3', style.border, style.color)}>
                <span className="font-mono text-[10px] uppercase tracking-wider opacity-80">
                  CANOPY HEALTH STATUS
                </span>
                <div className="mt-1 flex items-center gap-1.5 font-display text-sm font-bold">
                  <style.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{selected.cropHealth}</span>
                </div>
              </div>
            </div>

            {selected.notes && (
              <div className="mt-3 border-t border-earth-200 pt-3">
                <p className="font-mono text-[11px] text-earth-600">
                  <span className="font-bold text-earth-800">AGRONOMIC ASSESSMENT:</span> {selected.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upload + Previous Scans Ledger */}
        <div className="space-y-4">
          {/* Tactical Upload Box */}
          <div className="tactile-card bg-white p-5 text-center">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
              // ON-DEMAND INFERENCE
            </span>
            <Upload className="mx-auto mt-2 h-7 w-7 text-farm-800" />
            <h4 className="mt-2 font-display text-sm font-bold text-earth-900">
              Upload Leaf Foliage Specimen
            </h4>
            <p className="mt-1 font-mono text-[11px] text-earth-500">
              Direct upload executes on-device MobileNetV3 ONNX diagnostic engine.
            </p>

            {uploadError && (
              <div className="mt-3 border border-red-300 bg-red-50 p-2 text-left font-mono text-xs text-red-800">
                ERROR: {uploadError}
              </div>
            )}

            <label
              className={cn(
                'mt-4 inline-flex w-full items-center justify-center gap-2 border-2 border-earth-900 bg-earth-900 px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-farm-900 active:translate-y-0.5 cursor-pointer',
                isAnalyzing && 'pointer-events-none opacity-50'
              )}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ANALYZING TENSOR...
                </>
              ) : (
                'SELECT LEAF IMAGE'
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

          {/* Historical Scans Ledger */}
          <div className="tactile-card bg-white p-4">
            <div className="flex items-center justify-between border-b border-earth-200 pb-2 mb-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
                // SCAN LOG LEDGER
              </span>
              <span className="font-mono text-[10px] text-earth-500">
                TOTAL: {allScans.length}
              </span>
            </div>

            <div className="max-h-84 space-y-2 overflow-y-auto pr-1">
              {allScans.map((scan) => {
                const scanStyle = healthStyles[scan.cropHealth] || healthStyles['Healthy'];
                const isSelected = (selectedId || latest.id) === scan.id;

                return (
                  <button
                    key={scan.id}
                    onClick={() => setSelectedId(scan.id)}
                    className={cn(
                      'w-full text-left p-2.5 border transition-all',
                      isSelected
                        ? 'border-2 border-earth-900 bg-earth-100/90 shadow-xs'
                        : 'border-earth-200 bg-white hover:border-earth-300 hover:bg-earth-50/50'
                    )}
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-xs font-bold text-earth-900">
                        [{scan.zoneId.toUpperCase()}]
                      </span>
                      <span className={cn('text-[11px] font-bold', scanStyle.color.split(' ')[0])}>
                        {scan.confidence}% CONF
                      </span>
                    </div>
                    <p className="mt-1 font-display text-xs font-bold text-earth-800 truncate">
                      {scan.diseaseDetection}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-earth-500">
                      {formatTimestamp(scan.timestamp)}
                    </p>
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

function LeafPlaceholder() {
  return (
    <svg viewBox="0 0 120 80" className="h-16 w-24 text-earth-500" fill="currentColor">
      <ellipse cx="60" cy="40" rx="50" ry="30" opacity="0.3" />
      <path d="M60 10 C30 20, 20 50, 60 70 C100 50, 90 20, 60 10" opacity="0.6" />
      <line x1="60" y1="10" x2="60" y2="70" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}
