import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Film, 
  CheckCircle2, 
  TrendingDown, 
  SlidersHorizontal,
  Layers,
  Sparkles
} from 'lucide-react';
import { ProcessResult } from '../types';

interface PreviewSectionProps {
  result: ProcessResult;
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({ result }) => {
  const [activeView, setActiveView] = useState<'processed' | 'original' | 'split'>('processed');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const processedVideoRef = useRef<HTMLVideoElement>(null);
  const originalVideoRef = useRef<HTMLVideoElement>(null);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (processedVideoRef.current) {
      if (isPlaying) {
        processedVideoRef.current.pause();
        if (originalVideoRef.current) originalVideoRef.current.pause();
        setIsPlaying(false);
      } else {
        processedVideoRef.current.play();
        if (originalVideoRef.current) originalVideoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (processedVideoRef.current) {
      setCurrentTime(processedVideoRef.current.currentTime);
      setDuration(processedVideoRef.current.duration || 0);

      // Sync original video in split view
      if (originalVideoRef.current && Math.abs(originalVideoRef.current.currentTime - processedVideoRef.current.currentTime) > 0.3) {
        originalVideoRef.current.currentTime = processedVideoRef.current.currentTime;
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (processedVideoRef.current) {
      processedVideoRef.current.currentTime = time;
      setCurrentTime(time);
    }
    if (originalVideoRef.current) {
      originalVideoRef.current.currentTime = time;
    }
  };

  const handleRestart = () => {
    if (processedVideoRef.current) {
      processedVideoRef.current.currentTime = 0;
      processedVideoRef.current.play();
      setIsPlaying(true);
    }
    if (originalVideoRef.current) {
      originalVideoRef.current.currentTime = 0;
      originalVideoRef.current.play();
    }
  };

  return (
    <div className="w-full bg-[#111622]/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">Interactive Video Preview</h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Rendered & Optimized</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare source vs processed playback, review codec optimization, and verify sound levels
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveView('processed')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'processed'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Processed Video
          </button>
          <button
            type="button"
            onClick={() => setActiveView('original')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'original'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Original Source
          </button>
          <button
            type="button"
            onClick={() => setActiveView('split')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'split'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Side-by-Side
          </button>
        </div>
      </div>

      {/* Video Player Display Area */}
      <div className="relative rounded-2xl bg-black/90 overflow-hidden border border-slate-800 shadow-2xl">
        {activeView === 'split' ? (
          /* Side by side comparison */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 bg-slate-900">
            {/* Original Video */}
            <div className="relative flex flex-col items-center justify-center bg-black min-h-[280px]">
              <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-bold text-slate-300">
                Original Source
              </div>
              <video
                ref={originalVideoRef}
                src={result.originalUrl}
                muted={true}
                playsInline
                className="w-full max-h-[420px] object-contain"
              />
            </div>

            {/* Processed Video */}
            <div className="relative flex flex-col items-center justify-center bg-black min-h-[280px]">
              <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-md bg-indigo-600/90 backdrop-blur-md border border-indigo-400/30 text-[11px] font-bold text-white shadow-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Saad Edits (iOS 17 Profile)</span>
              </div>
              <video
                ref={processedVideoRef}
                src={result.processedUrl}
                muted={isMuted}
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                className="w-full max-h-[420px] object-contain"
              />
            </div>
          </div>
        ) : (
          /* Single Main Player (Processed or Original) */
          <div className="relative flex flex-col items-center justify-center bg-black min-h-[340px]">
            <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[11px] font-bold text-slate-200">
              {activeView === 'processed' ? '✨ Processed Output (Ready for Reuse)' : '📹 Original Uploaded Source'}
            </div>

            <video
              ref={processedVideoRef}
              src={activeView === 'processed' ? result.processedUrl : result.originalUrl}
              muted={isMuted}
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              className="w-full max-h-[460px] object-contain"
            />
          </div>
        )}

        {/* Video Controls Bar */}
        <div className="p-3.5 bg-gradient-to-t from-[#0c1017] via-[#0c1017]/90 to-transparent border-t border-slate-800/80 flex flex-col gap-2">
          {/* Progress Timeline Slider */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
              {formatSeconds(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 1}
              step="0.05"
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-indigo-500"
            />
            <span className="text-[11px] font-mono text-slate-400 w-10">
              {formatSeconds(duration || result.processedMetadata?.duration || 0)}
            </span>
          </div>

          {/* Player Buttons */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Restart from beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span className="hidden sm:inline-block">
                {result.processedMetadata?.video?.width}x{result.processedMetadata?.video?.height} @ {result.processedMetadata?.video?.fps || 30} FPS
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 text-[11px] font-semibold border border-slate-700">
                {result.processedMetadata?.video?.codec?.toUpperCase() || 'H264'} / AAC
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Metric 1: File Size */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
            <span>File Size</span>
            {result.sizeReductionPercent > 0 && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" />
                {result.sizeReductionPercent}%
              </span>
            )}
          </div>
          <div className="text-base font-extrabold text-white font-mono">
            {formatBytes(result.processedSize)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Original: {formatBytes(result.originalSize)}
          </div>
        </div>

        {/* Metric 2: Resolution & Ratio */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] text-slate-400 mb-1">Resolution & Frame Rate</div>
          <div className="text-base font-extrabold text-white font-mono">
            {result.processedMetadata.video?.width}x{result.processedMetadata.video?.height}
          </div>
          <div className="text-[10px] text-indigo-300 font-mono mt-0.5">
            {result.processedMetadata.video?.fps || 30} FPS • {result.processedMetadata.video?.pixelFormat || 'yuv420p'}
          </div>
        </div>

        {/* Metric 3: Container Format */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] text-slate-400 mb-1">Container Profile</div>
          <div className="text-base font-extrabold text-white font-mono truncate">
            mp42 / QuickTime
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
            Faststart Web Streaming Enabled
          </div>
        </div>

        {/* Metric 4: Render Time */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] text-slate-400 mb-1">FFmpeg Transcode Time</div>
          <div className="text-base font-extrabold text-amber-300 font-mono">
            {result.processingTimeSeconds}s
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            EBU R128 Audio Normalized
          </div>
        </div>
      </div>
    </div>
  );
};
