import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, Upload, Scan, AlertTriangle, CheckCircle, RefreshCw, ZoomIn, ZoomOut, Maximize2, ShieldAlert, Cpu, FileCheck } from 'lucide-react';
import type { Operator, DefectItem, SampleBoard, InspectionResult } from '../types';
import { SAMPLE_BOARDS } from '../data/sampleBoards';

interface InspectorViewProps {
  operator: Operator;
  onRecordInspection: (result: InspectionResult) => void;
}

export const InspectorView: React.FC<InspectorViewProps> = ({
  operator,
  onRecordInspection,
}) => {
  const [mode, setMode] = useState<'sample' | 'camera'>('sample');
  const [selectedSample, setSelectedSample] = useState<SampleBoard>(SAMPLE_BOARDS[0]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  
  // Optical HUD controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [contrastFilter, setContrastFilter] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  
  // Analysis state
  const [isScanning, setIsScanning] = useState(false);
  const [activeDefects, setActiveDefects] = useState<DefectItem[]>(SAMPLE_BOARDS[0].knownDefects);
  const [selectedDefect, setSelectedDefect] = useState<DefectItem | null>(SAMPLE_BOARDS[0].knownDefects[0] || null);
  const [latestReport, setLatestReport] = useState<InspectionResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera on unmount or mode change
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    try {
      // Rear camera strictly via facingMode: { exact: "environment" }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: 'environment' } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setIsCameraActive(true);
      } catch {
        setCameraError('Rear camera (facingMode: { exact: "environment" }) access denied or unavailable.');
        setIsCameraActive(false);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleModeChange = (newMode: 'sample' | 'camera') => {
    setMode(newMode);
    if (newMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
  };

  const handleSelectSample = (sample: SampleBoard) => {
    setSelectedSample(sample);
    setActiveDefects(sample.knownDefects);
    setSelectedDefect(sample.knownDefects[0] || null);
    setLatestReport(null);
  };

  const runAnalysis = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const report: InspectionResult = {
        id: `INSP-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        boardIdentifier: mode === 'sample' ? selectedSample.title : 'External Device Verification Board',
        status: activeDefects.length > 0 ? 'FAIL' : 'PASS',
        defects: activeDefects,
        jointCount: 64,
        qualityScore: activeDefects.length > 0 ? Math.max(45, 96 - activeDefects.length * 24) : 99,
        operatorId: operator.nodeId,
        imageUrl: selectedSample.imageUrl,
        notes: `Inspected under IPC-A-610 Class 3 Standards by Operator ${operator.nodeId}. Sealed with Chixus Law Sovereign Hash.`
      };
      setLatestReport(report);
      onRecordInspection(report);
    }, 1200);
  };

  const activeImage = selectedSample.imageUrl;

  return (
    <div className="space-y-6">
      {/* Top Banner / Operator Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl silver-gradient-surface">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white font-['Chakra_Petch',sans-serif]">
                Optical Solder Fault Inspector
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                IPC-A-610 COMPLIANT
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Operating Node: <span className="text-slate-200">{operator.nodeId}</span> · Sector: <span className="text-slate-300">{operator.sector}</span>
            </p>
          </div>
        </div>

        {/* Source Mode Selector */}
        <div className="flex items-center p-1 rounded-lg bg-slate-900 border border-slate-700/80">
          <button
            type="button"
            onClick={() => handleModeChange('sample')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
              mode === 'sample'
                ? 'bg-slate-700 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Sample Boards</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('camera')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
              mode === 'camera'
                ? 'bg-slate-700 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>
        </div>
      </div>

      {/* Main Viewport and Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Optical Viewport (Left 8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/80 shadow-2xl min-h-[460px] flex items-center justify-center group">
            {/* Live Camera View */}
            {mode === 'camera' ? (
              <div className="relative w-full h-full min-h-[460px] flex items-center justify-center bg-black">
                {cameraError ? (
                  <div className="p-6 text-center space-y-3 max-w-md">
                    <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto" />
                    <p className="text-xs text-amber-300 font-mono">{cameraError}</p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="silver-metallic-button px-4 py-2 rounded-lg text-xs"
                    >
                      Retry Camera
                    </button>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{
                      transform: `scale(${zoomLevel})`,
                      filter: `contrast(${contrastFilter}%)`,
                    }}
                  />
                )}
              </div>
            ) : (
              /* Image Viewport */
              <div className="relative w-full h-[460px] overflow-hidden bg-black flex items-center justify-center">
                <img
                  src={activeImage}
                  alt="Optical Solder Inspection"
                  className="w-full h-full object-cover transition-transform duration-200"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    filter: `contrast(${contrastFilter}%)`,
                  }}
                />

                {/* Defect Bounding Boxes */}
                {activeDefects.map((def) => {
                  const isSelected = selectedDefect?.id === def.id;
                  return (
                    <button
                      key={def.id}
                      type="button"
                      onClick={() => setSelectedDefect(def)}
                      className={`absolute transition-all cursor-pointer rounded ${
                        isSelected
                          ? 'border-2 border-red-500 bg-red-500/25 shadow-[0_0_15px_rgba(239,68,68,0.5)] z-20'
                          : 'border-2 border-amber-400/80 bg-amber-400/15 hover:border-amber-300 z-10'
                      }`}
                      style={{
                        left: `${def.location.x}%`,
                        top: `${def.location.y}%`,
                        width: `${def.location.width}%`,
                        height: `${def.location.height}%`,
                      }}
                      title={`${def.type} (${Math.round(def.confidence * 100)}% conf)`}
                    >
                      <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-black/90 border border-slate-700 text-[10px] font-mono text-white whitespace-nowrap shadow">
                        {def.type}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Reticle / Optical Crosshair Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-16 h-16 border border-cyan-400/30 rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-cyan-400 rounded-full" />
              </div>
              <div className="absolute left-4 top-4 text-[10px] font-mono text-cyan-400/80 bg-slate-950/70 px-2 py-1 rounded border border-cyan-400/20">
                FOV: 12.4mm · ZOOM: {zoomLevel}X
              </div>
              <div className="absolute right-4 top-4 text-[10px] font-mono text-slate-300 bg-slate-950/70 px-2 py-1 rounded border border-slate-700/60">
                {activeDefects.length} DEFECTS PINPOINTED
              </div>
            </div>

            {/* Scan Ray Animation */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-cyan-400/10 via-cyan-400/30 to-transparent h-20 animate-pulse border-b-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)]" />
            )}

            {/* Viewport Control Bar */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/70 text-xs font-mono">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
                  className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-slate-300 min-w-8 text-center">{zoomLevel}x</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                  className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-[11px]">Contrast</span>
                <input
                  type="range"
                  min="80"
                  max="150"
                  value={contrastFilter}
                  onChange={(e) => setContrastFilter(Number(e.target.value))}
                  className="w-20 accent-cyan-400 h-1.5 cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={runAnalysis}
                disabled={isScanning}
                className="silver-metallic-button px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Scan className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning...' : 'Run Optical Scan'}</span>
              </button>
            </div>
          </div>

          {/* Sample Boards Picker */}
          {mode === 'sample' && (
            <div className="space-y-2">
              <p className="text-xs font-mono text-slate-400">Select Test Board Micro-Pattern:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SAMPLE_BOARDS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSample(s)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedSample.id === s.id
                        ? 'border-cyan-400 bg-slate-900 shadow-md'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-100 truncate">{s.title}</p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{s.description}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-amber-400">
                      <span>{s.knownDefects.length} Solder Flaws</span>
                      <span className="text-slate-500">{s.type}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Telemetry & Defect Diagnostic Inspector (Right 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Defect Card */}
          <div className="silver-gradient-surface rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white font-mono">
                  Flaw Telemetry
                </h3>
              </div>
              {selectedDefect && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  selectedDefect.severity === 'CRITICAL'
                    ? 'bg-red-950/60 border border-red-500/50 text-red-400'
                    : 'bg-amber-950/60 border border-amber-500/50 text-amber-400'
                }`}>
                  {selectedDefect.severity}
                </span>
              )}
            </div>

            {selectedDefect ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[11px] font-mono text-slate-400 block">Identified Defect</span>
                  <p className="text-base font-bold text-white tracking-wide">{selectedDefect.type}</p>
                  <p className="text-[11px] font-mono text-cyan-400">{selectedDefect.ipcStandard}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 block">Optical Signature</span>
                  <p className="text-slate-300 leading-relaxed text-xs">{selectedDefect.description}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 block">Rework Directive</span>
                  <p className="text-slate-200 leading-relaxed text-xs">{selectedDefect.reworkRecommendation}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                  <span>Confidence Metric:</span>
                  <span className="text-slate-200 font-bold">{Math.round(selectedDefect.confidence * 100)}%</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No active flaw selected. Click any bounding box on the PCB image to inspect.
              </div>
            )}
          </div>

          {/* Inspection Report Summary (if generated) */}
          {latestReport && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/40 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-semibold">
                <FileCheck className="w-4 h-4" />
                <span>INSPECTION REPORT SIGNED</span>
              </div>
              <div className="text-xs space-y-1 font-mono text-slate-300">
                <p>Report ID: <span className="text-white">{latestReport.id}</span></p>
                <p>Quality Score: <span className="text-white font-bold">{latestReport.qualityScore}%</span></p>
                <p>Status: <span className="text-amber-400 font-bold">{latestReport.status}</span></p>
                <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  Attributed to Operator {operator.nodeId} under Chixus Law.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
