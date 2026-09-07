import { useState } from 'react';
import { Camera, Upload, CheckCircle, AlertTriangle, Loader2, Bug, Sprout, Send, Layers } from 'lucide-react';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { SmsDispatcherModal } from '../components/alerts/SmsDispatcherModal';
import { useCropAnalyses } from '../hooks/useData';
import { api } from '../services/api';
import { formatTimestamp } from '../utils/format';
import { cn } from '../utils/cn';
import type { Alert, CropAnalysis, CropHealthStatus, Severity } from '../types';

const healthStyles: Record<CropHealthStatus, { color: string; border: string; icon: typeof CheckCircle }> = {
  Healthy: { color: 'text-farm-800 bg-farm-100', border: 'border-farm-400', icon: CheckCircle },
  'Possible Disease Detected': { color: 'text-red-700 bg-red-100', border: 'border-red-400', icon: AlertTriangle },
  'Possible Nutrient Deficiency': { color: 'text-amber-800 bg-amber-100', border: 'border-amber-400', icon: AlertTriangle },
  'Water Stress': { color: 'text-orange-800 bg-orange-100', border: 'border-orange-400', icon: AlertTriangle },
  'Pest Infestation Detected': { color: 'text-rose-800 bg-rose-100', border: 'border-rose-400', icon: Bug },
};

export function CropHealthPage() {
  const { data: initialAnalyses, loading, error, refetch } = useCropAnalyses();
  const [localScans, setLocalScans] = useState<CropAnalysis[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'auto' | 'disease' | 'pest'>('auto');
  const [isSmsOpen, setIsSmsOpen] = useState(false);

  if (loading) return <LoadingState message="Connecting to Edge AI inference ledger..." />;
  if (error || !initialAnalyses) return <ErrorState message={error || 'Failed to load telemetry'} onRetry={refetch} />;

  const allScans = [...localScans, ...initialAnalyses];
  const latest = allScans[0];
  const selected = selectedId ? allScans.find((a) => a.id === selectedId) || latest : latest;
  const style = healthStyles[selected.cropHealth] || healthStyles['Healthy'];
  const displayImage = selected.imageUrl || uploadPreview;
  const isPestScan = selected.modelType === 'pest' || selected.cropHealth === 'Pest Infestation Detected';

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setUploadPreview(preview);
    setIsAnalyzing(true);
    setUploadError(null);

    try {
      const result = await api.uploadCropImage(file, 'ZONE_B', scanMode);
      setLocalScans((prev) => [result, ...prev]);
      setSelectedId(result.id);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to analyze specimen');
    } finally {
      setIsAnalyzing(false);
      e.target.value = '';
    }
  };

  const currentAlertForModal: Alert = {
    id: `alert-specimen-${selected.id}`,
    type: isPestScan ? 'Pest Infestation' : 'Crop Disease',
    severity: (selected.severity as Severity) || (selected.confidence >= 85 ? 'HIGH' : 'MEDIUM'),
    location: `Sector ${selected.zoneId.toUpperCase()}`,
    message: isPestScan
      ? `[Kisan Alert] ${selected.hindiName ? `${selected.hindiName} / ` : ''}${selected.diseaseDetection} detected with ${selected.confidence}% confidence. Immediate IPM treatment: ${selected.treatment || selected.notes}`
      : `[Kisan Alert] ${selected.diseaseDetection} detected (${selected.confidence}% confidence). Countermeasure: ${selected.treatment || selected.notes}`,
    timestamp: selected.timestamp,
    status: 'active',
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 border-b border-earth-300 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-farm-800">
            // MULTI-MODEL EDGE AI VISION
          </span>
          <span className="border border-earth-300 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-earth-700">
            {scanMode === 'auto'
              ? 'SMART DUAL-MODEL FUSION (ONNX + ViT)'
              : scanMode === 'pest'
              ? 'VISION TRANSFORMER ViT-BASE (IP102)'
              : 'MOBILENETV3 ONNX QUANTIZED'}
          </span>
          <span className="border border-farm-300 bg-farm-50 px-2 py-0.5 font-mono text-[10px] font-bold text-farm-800">
            TRILINGUAL (ENG • HIN • MAR)
          </span>
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-earth-900">
          Crop Pathology & Insect Pest Inspection Station
        </h2>
        <p className="font-mono text-xs text-earth-600">
          Dual-model edge optical diagnosis combining a 42-class leaf pathogen network with a 102-class Vision Transformer insect pest recognition model.
        </p>
      </div>

      {/* Model Mode Selector Slab */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-2 border-earth-800 bg-earth-100/70 p-2">
        <div className="flex items-center gap-2 px-1">
          <Layers className="h-4 w-4 text-earth-700" />
          <span className="font-mono text-xs font-bold uppercase tracking-wide text-earth-800">
            ACTIVE AI DIAGNOSTIC MODEL:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setScanMode('auto')}
            className={cn(
              'flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold uppercase transition-all cursor-pointer',
              scanMode === 'auto'
                ? 'border-2 border-farm-900 bg-farm-800 text-white shadow-xs'
                : 'border border-earth-300 bg-white text-earth-700 hover:bg-earth-50'
            )}
          >
            ✨ Auto-Detect (Dual AI)
          </button>
          <button
            onClick={() => setScanMode('disease')}
            className={cn(
              'flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold uppercase transition-all cursor-pointer',
              scanMode === 'disease'
                ? 'border-2 border-farm-900 bg-farm-800 text-white shadow-xs'
                : 'border border-earth-300 bg-white text-earth-700 hover:bg-earth-50'
            )}
          >
            <Sprout className="h-3.5 w-3.5 text-farm-300" />
            🌿 Foliage Disease (42 Classes)
          </button>
          <button
            onClick={() => setScanMode('pest')}
            className={cn(
              'flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold uppercase transition-all cursor-pointer',
              scanMode === 'pest'
                ? 'border-2 border-earth-900 bg-earth-900 text-amber-300 shadow-xs'
                : 'border border-earth-300 bg-white text-earth-700 hover:bg-earth-50'
            )}
          >
            <Bug className="h-3.5 w-3.5 text-amber-400" />
            🐛 Insect & Pest (102 Classes ViT)
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Latest Scan Inspection Viewport */}
        <div className="lg:col-span-2 space-y-4">
          <div className="tactile-card bg-white p-5">
            <div className="flex items-center justify-between border-b border-earth-200 pb-3 mb-4">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
                  {isPestScan ? '// IP102 INSECT PEST SCAN' : '// OPTICAL PATHOLOGY SCAN'}
                </span>
                <h3 className="font-display text-sm font-bold uppercase tracking-tight text-earth-900">
                  {selectedId ? `SPECIMEN FRAME: ${selected.id}` : 'CURRENT ROVER SCAN'}
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
                ┌─ [EDGE_OPTICAL_CAM // 224×224 TENSOR]
              </div>
              <div className="absolute right-3 top-3 pointer-events-none z-10 font-mono text-[9px] font-bold text-white/80">
                [{isPestScan ? 'ViT_TRANSFORMER: ACTIVE' : 'MOBILENET_V3: ACTIVE'}] ─┐
              </div>
              <div className="absolute left-3 bottom-3 pointer-events-none z-10 font-mono text-[9px] font-bold text-white/80">
                └─ [CONFIDENCE: {selected.confidence}%]
              </div>
              <div className="absolute right-3 bottom-3 pointer-events-none z-10 font-mono text-[9px] font-bold text-white/80">
                [SECTOR: {selected.zoneId.toUpperCase()}] ─┘
              </div>

              {isAnalyzing && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-earth-900/90 text-white backdrop-blur-xs">
                  <Loader2 className="h-8 w-8 animate-spin text-farm-400" />
                  <p className="mt-3 font-mono text-xs font-bold uppercase tracking-widest text-farm-300">
                    {scanMode === 'pest' ? 'EXECUTING ViT-BASE 102-CLASS INSECT INFERENCE...' : 'EXECUTING TENSOR INFERENCE...'}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-earth-400">
                    {scanMode === 'pest' ? 'Evaluating 102 benchmark IP102 insect categories' : 'Evaluating 42 botanical disease & nutrient classes'}
                  </p>
                </div>
              )}

              {displayImage ? (
                <img src={displayImage} alt="Crop specimen" className="h-full w-full object-contain" />
              ) : (
                <div className="text-center p-6">
                  {isPestScan ? (
                    <Bug className="mx-auto h-12 w-12 text-amber-500" />
                  ) : (
                    <Camera className="mx-auto h-12 w-12 text-earth-600" />
                  )}
                  <p className="mt-3 font-mono text-xs font-bold text-earth-300 uppercase tracking-wider">
                    {isPestScan ? 'Insect & Pest Specimen Image' : 'Rover Optical Camera Frame'}
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
                  {isPestScan ? 'DETECTED INSECT SPECIES' : 'TOP AI CLASSIFICATION'}
                </span>
                <p className="mt-1 font-display text-sm font-bold text-earth-900 truncate">
                  {selected.diseaseDetection}
                </p>
                {selected.hindiName && (
                  <p className="font-sans text-xs font-semibold text-farm-800 mt-0.5 truncate">
                    {selected.hindiName}
                  </p>
                )}
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
                  CANOPY DIAGNOSIS
                </span>
                <div className="mt-1 flex items-center gap-1.5 font-display text-sm font-bold">
                  <style.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{selected.cropHealth}</span>
                </div>
              </div>
            </div>

            {/* Detailed Pest Dossier (When Pest Detected or Pest Model Selected) */}
            {isPestScan && (
              <div className="mt-4 border-2 border-amber-400 bg-amber-50/70 p-4">
                <div className="flex items-center justify-between border-b border-amber-300/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Bug className="h-4 w-4 text-amber-800" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-900">
                      IP102 INSECT PEST PROFILE & BIOLOGICAL CONTROLS
                    </span>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-0.5 font-mono text-[10px] font-bold uppercase border',
                      selected.severity === 'Critical'
                        ? 'bg-red-100 text-red-800 border-red-400'
                        : selected.severity === 'High'
                        ? 'bg-amber-100 text-amber-800 border-amber-400'
                        : 'bg-yellow-100 text-yellow-800 border-yellow-400'
                    )}
                  >
                    {selected.severity || 'HIGH'} THREAT
                  </span>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <span className="font-mono text-[10px] uppercase text-earth-500">HINDI TRANSLATION</span>
                    <p className="font-sans text-xs font-bold text-earth-900 mt-0.5">
                      {selected.hindiName || 'उपलब्ध नहीं'}
                    </p>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase text-earth-500">MARATHI TRANSLATION</span>
                    <p className="font-sans text-xs font-bold text-earth-900 mt-0.5">
                      {selected.marathiName || 'उपलब्ध नाही'}
                    </p>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase text-earth-500">PRIMARY CROP HOST</span>
                    <p className="font-display text-xs font-bold text-earth-900 mt-0.5">
                      {selected.diseaseDetection.split(':')[0] || 'General Crops'}
                    </p>
                  </div>
                </div>

                {/* Treatment / Countermeasure */}
                {(selected.treatment || selected.notes) && (
                  <div className="mt-3 border-t border-amber-200 pt-2.5">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-amber-900">
                      INTEGRATED PEST MANAGEMENT (IPM) COUNTERMEASURE:
                    </span>
                    <p className="mt-1 font-mono text-xs text-earth-800 leading-relaxed">
                      {selected.treatment || selected.notes}
                    </p>
                  </div>
                )}

                {/* Top Candidates Ranked Breakdown */}
                {selected.topK && selected.topK.length > 1 && (
                  <div className="mt-3 border-t border-amber-200 pt-2.5">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-earth-600 block mb-2">
                      RANKED CANDIDATE INSECT CLASSIFICATIONS (ViT-BASE 102-CLASS):
                    </span>
                    <div className="space-y-1.5">
                      {selected.topK.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="w-4 text-earth-400 text-[10px]">{idx + 1}.</span>
                          <span className="flex-1 truncate text-earth-800 font-medium">
                            {item.pretty || item.name}
                          </span>
                          <div className="w-24 bg-earth-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-600 h-full rounded-full"
                              style={{ width: `${Math.min(100, Math.round(item.confidence * 100))}%` }}
                            />
                          </div>
                          <span className="w-12 text-right font-bold text-earth-700">
                            {(item.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct Dispatch SMS/WhatsApp CTA */}
                <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-amber-300/70 pt-3">
                  <span className="font-mono text-[10px] text-earth-600">
                    Send immediate field broadcast to smallholder keypad/feature phones
                  </span>
                  <button
                    onClick={() => setIsSmsOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 border border-red-800 bg-red-700 px-3 py-1.5 font-mono text-xs font-bold uppercase text-white shadow-xs hover:bg-red-800 transition-all cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    DISPATCH KISAN ALERT (SMS / WA)
                  </button>
                </div>
              </div>
            )}

            {/* Regular Agronomic Assessment for disease scans */}
            {!isPestScan && selected.notes && (
              <div className="mt-3 border-t border-earth-200 pt-3 flex items-start justify-between gap-2">
                <p className="font-mono text-[11px] text-earth-600 flex-1">
                  <span className="font-bold text-earth-800">AGRONOMIC ASSESSMENT:</span> {selected.notes}
                </p>
                <button
                  onClick={() => setIsSmsOpen(true)}
                  className="inline-flex items-center gap-1 border border-earth-400 bg-earth-100 px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-earth-800 hover:bg-earth-200 transition-all shrink-0 cursor-pointer"
                >
                  <Send className="h-3 w-3" />
                  SMS ALERT
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upload + Previous Scans Ledger */}
        <div className="space-y-4">
          {/* Tactical Upload Box */}
          <div className="tactile-card bg-white p-5 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
                // ON-DEMAND EDGE INFERENCE
              </span>
            </div>
            {scanMode === 'pest' ? (
              <Bug className="mx-auto mt-2 h-7 w-7 text-amber-600" />
            ) : (
              <Upload className="mx-auto mt-2 h-7 w-7 text-farm-800" />
            )}
            <h4 className="mt-2 font-display text-sm font-bold text-earth-900">
              {scanMode === 'pest' ? 'Upload Insect / Pest Specimen' : 'Upload Leaf Foliage Specimen'}
            </h4>
            <p className="mt-1 font-mono text-[11px] text-earth-500">
              {scanMode === 'pest'
                ? 'Direct inference via 102-class Vision Transformer (IP102 Benchmark) model.'
                : 'Direct inference via 42-class MobileNetV3 ONNX botanical pathology engine.'}
            </p>

            {uploadError && (
              <div className="mt-3 border border-red-300 bg-red-50 p-2 text-left font-mono text-xs text-red-800">
                ERROR: {uploadError}
              </div>
            )}

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <label
                className={cn(
                  'flex-1 inline-flex items-center justify-center gap-2 border-2 border-farm-900 bg-farm-800 px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-farm-900 active:translate-y-0.5 cursor-pointer shadow-xs',
                  isAnalyzing && 'pointer-events-none opacity-50'
                )}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ANALYZING...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 text-farm-200" />
                    SNAP CAMERA
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  disabled={isAnalyzing}
                  onChange={handleUpload}
                />
              </label>

              <label
                className={cn(
                  'flex-1 inline-flex items-center justify-center gap-2 border-2 border-earth-800 bg-white px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-earth-900 transition-all hover:bg-earth-100 active:translate-y-0.5 cursor-pointer',
                  isAnalyzing && 'pointer-events-none opacity-50'
                )}
              >
                <Upload className="h-4 w-4 text-earth-700" />
                FILE / GALLERY
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isAnalyzing}
                  onChange={handleUpload}
                />
              </label>
            </div>
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
                const isItemPest = scan.modelType === 'pest' || scan.cropHealth === 'Pest Infestation Detected';

                return (
                  <button
                    key={scan.id}
                    onClick={() => setSelectedId(scan.id)}
                    className={cn(
                      'w-full text-left p-2.5 border transition-all cursor-pointer',
                      isSelected
                        ? 'border-2 border-earth-900 bg-earth-100/90 shadow-xs'
                        : 'border-earth-200 bg-white hover:border-earth-300 hover:bg-earth-50/50'
                    )}
                  >
                    <div className="flex items-center justify-between font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-earth-900">
                          [{scan.zoneId.toUpperCase()}]
                        </span>
                        {isItemPest && (
                          <span className="border border-amber-400 bg-amber-100 px-1 font-mono text-[9px] font-bold text-amber-800">
                            PEST
                          </span>
                        )}
                      </div>
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

      {/* Kisan SMS Alert Dispatcher Modal */}
      <SmsDispatcherModal
        isOpen={isSmsOpen}
        onClose={() => setIsSmsOpen(false)}
        initialAlert={currentAlertForModal}
      />
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
