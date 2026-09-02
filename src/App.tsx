import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { UploadCard } from './components/UploadCard';
import { EditingOptionsPanel } from './components/EditingOptionsPanel';
import { ProcessingSection } from './components/ProcessingSection';
import { PreviewSection } from './components/PreviewSection';
import { MetadataInspector } from './components/MetadataInspector';
import { DownloadSection } from './components/DownloadSection';
import { NoticeFooter } from './components/NoticeFooter';
import { 
  VideoMetadata, 
  ProcessOptions, 
  ProcessingProgress, 
  ProcessResult 
} from './types';
import { 
  AlertCircle, 
  CheckCircle2, 
  Film, 
  Layers, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Cpu,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [videoData, setVideoData] = useState<{
    videoId: string;
    filename: string;
    originalName: string;
    size: number;
    metadata: VideoMetadata;
    previewUrl: string;
    thumbUrl: string | null;
  } | null>(null);

  const [options, setOptions] = useState<ProcessOptions>({
    preset: 'auto',
    ios17Profile: true,
    resolution: 'original',
    fps: 'original',
    normalizeAudio: true,
    audioVolume: 1.0,
    colorFilter: 'crisp',
    trimStart: 0,
    trimEnd: 0,
    speed: 1.0,
    qualityCrf: 20,
    reEncodeCompatibility: true,
  });

  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'edit' | 'processing' | 'preview'>('upload');

  const pollIntervalRef = useRef<any>(null);

  // Clear polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleVideoLoaded = (data: typeof videoData) => {
    if (!data) return;
    setVideoData(data);
    setOptions((prev) => ({
      ...prev,
      trimStart: 0,
      trimEnd: data.metadata.duration || 10,
    }));
    setErrorMessage(null);
    setResult(null);
    setProgress(null);
    setStep('edit');
  };

  const handleStartProcess = async () => {
    if (!videoData) return;

    setErrorMessage(null);
    setStep('processing');
    setProgress({
      jobId: '',
      status: 'queued',
      percent: 5,
      stage: 'Initializing FFmpeg process pipeline...',
    });

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: videoData.videoId,
          filename: videoData.filename,
          options,
        }),
      });

      const data = await response.json();
      if (!data.success || !data.jobId) {
        throw new Error(data.error || 'Failed to start video processing job');
      }

      const jobId = data.jobId;
      setProgress((prev) => (prev ? { ...prev, jobId, status: 'processing' } : null));

      // Poll progress every 400ms
      pollIntervalRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/progress/${jobId}`);
          if (!pollRes.ok) return;

          const jobData = await pollRes.json();
          setProgress({
            jobId: jobData.jobId,
            status: jobData.status,
            percent: jobData.percent,
            stage: jobData.stage,
            currentTime: jobData.currentTime,
            fps: jobData.fps,
            speed: jobData.speed,
            error: jobData.error,
          });

          if (jobData.status === 'completed' && jobData.result) {
            clearInterval(pollIntervalRef.current);
            setResult(jobData.result);
            setStep('preview');
          } else if (jobData.status === 'error') {
            clearInterval(pollIntervalRef.current);
            setErrorMessage(jobData.error || 'Processing error occurred in FFmpeg engine');
            setStep('edit');
          }
        } catch (err: any) {
          console.error('Polling error:', err);
        }
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initiate video processing');
      setStep('edit');
    }
  };

  const handleReset = async () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    if (videoData) {
      try {
        await fetch('/api/cleanup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: videoData.videoId,
            filename: videoData.filename,
            outputFilename: result?.outputFilename,
          }),
        });
      } catch (e) {
        // ignore cleanup error
      }
    }

    setVideoData(null);
    setProgress(null);
    setResult(null);
    setErrorMessage(null);
    setStep('upload');
  };

  const stepsList = [
    { id: 'upload', name: '1. Upload', active: step === 'upload', done: !!videoData },
    { id: 'edit', name: '2. Edit & Metadata', active: step === 'edit', done: step === 'processing' || step === 'preview' },
    { id: 'processing', name: '3. Transcode', active: step === 'processing', done: step === 'preview' },
    { id: 'preview', name: '4. Preview & Download', active: step === 'preview', done: false },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#090b10] text-[#e2e8f0]">
      {/* App Header */}
      <Header onReset={handleReset} hasActiveVideo={!!videoData} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Hero / Workflow Steps Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Automatic Video Editor & iOS 17 Studio
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Transform video files with real-time FFmpeg processing, EBU R128 audio normalization, and iOS 17 QuickTime container profile metadata.
            </p>
          </div>

          {/* Workflow steps stepper */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#111622] border border-slate-800 self-start md:self-auto overflow-x-auto max-w-full">
            {stepsList.map((s, idx) => (
              <React.Fragment key={s.id}>
                <div
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    s.active
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                      : s.done
                      ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-500/20'
                      : 'text-slate-400'
                  }`}
                >
                  {s.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{s.name}</span>
                </div>
                {idx < stepsList.length - 1 && (
                  <span className="text-slate-700 text-xs px-0.5">›</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-lg animate-shake">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-white mb-0.5">Processing Error</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 font-mono text-xs px-2 py-1 rounded bg-rose-900/50"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Reusable Content Top Indicator */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/40 border border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Ready for reuse</strong> — only if you own the content or have the necessary rights/license.
            </span>
          </div>
          <span className="hidden sm:inline-flex text-[11px] font-mono text-slate-400">
            Zero sign-in • 100% Client Privacy
          </span>
        </div>

        {/* STEP 1: UPLOAD STATE */}
        {!videoData && (
          <UploadCard
            onVideoLoaded={handleVideoLoaded}
            onError={(msg) => setErrorMessage(msg)}
          />
        )}

        {/* STEP 2: EDITING OPTIONS & VIDEO INFO */}
        {videoData && step === 'edit' && (
          <div className="space-y-8">
            {/* Uploaded Video Summary Pill */}
            <div className="p-4 rounded-xl bg-[#111622] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                  {videoData.thumbUrl ? (
                    <img src={videoData.thumbUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <Film className="w-6 h-6 text-indigo-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white truncate max-w-md font-mono">
                    {videoData.originalName}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                    <span>{(videoData.size / (1024 * 1024)).toFixed(2)} MB</span>
                    <span>•</span>
                    <span>{videoData.metadata.video?.width}x{videoData.metadata.video?.height}</span>
                    <span>•</span>
                    <span>{videoData.metadata.duration?.toFixed(1)}s</span>
                    <span>•</span>
                    <span className="text-indigo-400">{videoData.metadata.video?.codec?.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 self-start sm:self-center transition-colors font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace Video</span>
              </button>
            </div>

            {/* Options Panel */}
            <EditingOptionsPanel
              metadata={videoData.metadata}
              options={options}
              onChangeOptions={setOptions}
              onStartProcess={handleStartProcess}
              isProcessing={false}
            />
          </div>
        )}

        {/* STEP 3: LIVE PROCESSING STATE */}
        {progress && step === 'processing' && (
          <div className="py-6 space-y-6">
            <ProcessingSection progress={progress} />
          </div>
        )}

        {/* STEP 4: PREVIEW, METADATA INSPECTOR & DOWNLOAD */}
        {result && step === 'preview' && (
          <div className="space-y-8">
            {/* Download Section (Placed prominently for immediate action) */}
            <DownloadSection result={result} onReset={handleReset} />

            {/* Video Player Preview Section */}
            <PreviewSection result={result} />

            {/* iOS 17 Metadata Inspector */}
            <MetadataInspector result={result} />

            {/* Action Bottom Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-[#111622] border border-slate-800">
              <div className="text-xs text-slate-400">
                Want to change resolutions, filters, or audio settings?
              </div>
              <button
                type="button"
                onClick={() => setStep('edit')}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Re-configure Edit Settings</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Notice & Legal Declarations */}
      <NoticeFooter />
    </div>
  );
}
