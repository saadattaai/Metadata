import React, { useState } from 'react';
import { 
  Sparkles, 
  Smartphone, 
  Sliders, 
  Volume2, 
  VolumeX, 
  Scissors, 
  Gauge, 
  Palette, 
  Maximize2, 
  Check, 
  Info,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { VideoMetadata, ProcessOptions, ResolutionPreset, FrameRatePreset, ColorFilterPreset } from '../types';

interface EditingOptionsPanelProps {
  metadata: VideoMetadata;
  options: ProcessOptions;
  onChangeOptions: (opts: ProcessOptions) => void;
  onStartProcess: () => void;
  isProcessing: boolean;
}

export const EditingOptionsPanel: React.FC<EditingOptionsPanelProps> = ({
  metadata,
  options,
  onChangeOptions,
  onStartProcess,
  isProcessing,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'advanced'>('presets');
  const [showMetadataInfo, setShowMetadataInfo] = useState(false);

  const duration = metadata.duration || 10;

  const updateOption = <K extends keyof ProcessOptions>(key: K, value: ProcessOptions[K]) => {
    onChangeOptions({
      ...options,
      [key]: value,
    });
  };

  const applyAutoPreset = () => {
    onChangeOptions({
      preset: 'auto',
      ios17Profile: true,
      resolution: 'original',
      fps: 'original',
      normalizeAudio: true,
      audioVolume: 1.0,
      colorFilter: 'crisp',
      trimStart: 0,
      trimEnd: duration,
      speed: 1.0,
      qualityCrf: 20,
      reEncodeCompatibility: true,
    });
  };

  const applyShortsPreset = () => {
    onChangeOptions({
      preset: 'custom',
      ios17Profile: true,
      resolution: 'vertical_shorts',
      fps: '60',
      normalizeAudio: true,
      audioVolume: 1.1,
      colorFilter: 'cool_vivid',
      trimStart: 0,
      trimEnd: Math.min(duration, 60),
      speed: 1.0,
      qualityCrf: 19,
      reEncodeCompatibility: true,
    });
  };

  const applyCinematicPreset = () => {
    onChangeOptions({
      preset: 'custom',
      ios17Profile: true,
      resolution: '1080p',
      fps: '24',
      normalizeAudio: true,
      audioVolume: 1.0,
      colorFilter: 'cinematic_warm',
      trimStart: 0,
      trimEnd: duration,
      speed: 1.0,
      qualityCrf: 18,
      reEncodeCompatibility: true,
    });
  };

  // Helper formatting for timestamps
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="w-full bg-[#111622]/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
      {/* Top Bar: Tabs & Quick Mode */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">Edit & Processing Options</h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              FFmpeg Powered
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure automatic enhancements, container presets, audio leveling, and metadata
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Presets & Auto</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'advanced'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Fine-Tune Controls</span>
          </button>
        </div>
      </div>

      {/* Main Options Content */}
      <div className="py-6 space-y-6">
        {/* iOS 17 Device Profile Metadata Box (Prominent Requirement) */}
        <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-slate-900/90 via-indigo-950/20 to-slate-900/90 border border-indigo-500/30 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">iOS 17 Device Profile Metadata</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Applies iOS 17 QuickTime & AVFoundation container atoms (<code className="text-indigo-300 font-mono">mp42</code> brand, Apple Media Handlers, ISO 8601 timestamps, and hardware profile descriptors).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setShowMetadataInfo(!showMetadataInfo)}
                className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                title="View metadata explanation"
              >
                <Info className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Details</span>
              </button>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.ios17Profile}
                  onChange={(e) => updateOption('ios17Profile', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          {/* Collapsible Metadata Details */}
          {showMetadataInfo && (
            <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-lg">
              <div>
                <span className="text-indigo-300 font-semibold block mb-1">Container & Atoms Written:</span>
                <ul className="space-y-1 font-mono text-[11px] text-slate-300">
                  <li>• Brand: <span className="text-emerald-400">mp42 (isom/mp42)</span></li>
                  <li>• Video Track: <span className="text-emerald-400">Apple Video Media Handler</span></li>
                  <li>• Audio Track: <span className="text-emerald-400">Apple Sound Media Handler</span></li>
                </ul>
              </div>
              <div>
                <span className="text-indigo-300 font-semibold block mb-1">Profile & Tool Signatures:</span>
                <ul className="space-y-1 font-mono text-[11px] text-slate-300">
                  <li>• Encoder: <span className="text-emerald-400">iOS 17.6.1 AVFoundation Engine</span></li>
                  <li>• Software: <span className="text-emerald-400">iOS 17.6.1 Photo Library Pipeline</span></li>
                  <li>• Model: <span className="text-emerald-400">iPhone 15 Pro Max Profile</span></li>
                </ul>
              </div>
              <div className="md:col-span-2 text-[11px] text-slate-400 pt-1">
                * Note: Metadata tags are written to standard MP4/MOV container atoms for compatibility across social platforms and video players.
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Fast Presets */}
        {activeTab === 'presets' ? (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>1-Click Optimization Presets</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Preset 1: Auto Magic Edit */}
              <button
                type="button"
                onClick={applyAutoPreset}
                className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  options.preset === 'auto'
                    ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/10'
                    : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      RECOMMENDED
                    </span>
                    {options.preset === 'auto' && <Check className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <h5 className="text-sm font-bold text-white mb-1">⚡ Auto Magic Edit</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Auto-levels audio with EBU R128 loudnorm, enhances dynamic contrast, enables faststart, and injects iOS 17 profile.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-indigo-400 font-medium">
                  Best for all-round universal sharing
                </div>
              </button>

              {/* Preset 2: Vertical Reel / Shorts */}
              <button
                type="button"
                onClick={applyShortsPreset}
                className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  options.resolution === 'vertical_shorts'
                    ? 'border-purple-500 bg-purple-950/30 ring-2 ring-purple-500/20 shadow-lg shadow-purple-500/10'
                    : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      SOCIAL READY
                    </span>
                    {options.resolution === 'vertical_shorts' && <Check className="w-4 h-4 text-purple-400" />}
                  </div>
                  <h5 className="text-sm font-bold text-white mb-1">📱 9:16 Shorts & Reels</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Converts to 1080x1920 portrait format with 60 FPS smooth motion, boosted audio, and punchy vivid color.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-purple-400 font-medium">
                  Ideal for TikTok, Instagram & YouTube Shorts
                </div>
              </button>

              {/* Preset 3: Cinematic Master */}
              <button
                type="button"
                onClick={applyCinematicPreset}
                className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  options.colorFilter === 'cinematic_warm' && options.fps === '24'
                    ? 'border-amber-500 bg-amber-950/30 ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10'
                    : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      HIGH FIDELITY
                    </span>
                    {options.colorFilter === 'cinematic_warm' && options.fps === '24' && (
                      <Check className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <h5 className="text-sm font-bold text-white mb-1">🎬 24 FPS Cinematic Film</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Applies 24fps motion cadence, warm film color tone, and ultra-high bitrate mastering (CRF 18).
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-amber-400 font-medium">
                  Ideal for high-end video creators
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Tab 2: Advanced Fine-Tuning Controls */
          <div className="space-y-6">
            {/* 1. Resolution & Aspect Ratio */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Output Resolution & Aspect Ratio</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'original', label: 'Original Resolution', desc: `${metadata.video?.width || 1920}x${metadata.video?.height || 1080}` },
                  { id: '1080p', label: '1080p Full HD', desc: '1920x1080 (16:9)' },
                  { id: 'vertical_shorts', label: '9:16 Vertical Reel', desc: '1080x1920 (Shorts/TikTok)' },
                  { id: 'square', label: '1:1 Square', desc: '1080x1080 (Feed)' },
                  { id: '720p', label: '720p HD', desc: '1280x720 (Compact)' },
                  { id: '4k', label: '4K Ultra HD', desc: '3840x2160 (Master)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      updateOption('preset', 'custom');
                      updateOption('resolution', item.id as ResolutionPreset);
                    }}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      options.resolution === item.id
                        ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500/30'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{item.label}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Color Grading & Enhancement Filter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-purple-400" />
                <span>Visual Enhancements & Color Grading</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'crisp', label: 'Clean Crisp', desc: '+Contrast & Vibrance' },
                  { id: 'cinematic_warm', label: 'Cinematic Warm', desc: 'Golden Film Glow' },
                  { id: 'cool_vivid', label: 'Cool Vivid', desc: 'Punchy Blues & Greens' },
                  { id: 'noir', label: 'Noir B&W', desc: 'High Contrast Mono' },
                  { id: 'none', label: 'Neutral / Raw', desc: 'No Color Alteration' },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => {
                      updateOption('preset', 'custom');
                      updateOption('colorFilter', filter.id as ColorFilterPreset);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      options.colorFilter === filter.id
                        ? 'border-purple-500 bg-purple-950/40 text-white ring-1 ring-purple-500/30'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{filter.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{filter.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Frame Rate & Speed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Frame Rate */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>Frame Rate (FPS)</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'original', label: 'Original' },
                    { id: '60', label: '60 fps' },
                    { id: '30', label: '30 fps' },
                    { id: '24', label: '24 fps' },
                  ].map((fpsItem) => (
                    <button
                      key={fpsItem.id}
                      type="button"
                      onClick={() => {
                        updateOption('preset', 'custom');
                        updateOption('fps', fpsItem.id as FrameRatePreset);
                      }}
                      className={`py-2 px-2 text-center rounded-lg border text-xs font-mono font-semibold transition-all ${
                        options.fps === fpsItem.id
                          ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {fpsItem.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Playback Speed */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Playback Speed</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        updateOption('preset', 'custom');
                        updateOption('speed', s);
                      }}
                      className={`py-2 text-center rounded-lg border text-xs font-mono font-semibold transition-all ${
                        options.speed === s
                          ? 'border-blue-500 bg-blue-950/40 text-blue-300'
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Audio Controls */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Audio Engine & Normalization</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={options.normalizeAudio}
                    onChange={(e) => updateOption('normalizeAudio', e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span>EBU R128 Loudness Normalizer (-16 LUFS)</span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-24">
                  {options.audioVolume === 0 ? 'Muted (0%)' : `Volume: ${Math.round(options.audioVolume * 100)}%`}
                </span>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={options.audioVolume}
                  onChange={(e) => updateOption('audioVolume', parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => updateOption('audioVolume', options.audioVolume === 0 ? 1.0 : 0)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200"
                  title="Mute / Unmute"
                >
                  {options.audioVolume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>
            </div>

            {/* 5. Video Trimming Range */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Video Trimming</span>
                </div>
                <span className="text-xs font-mono text-indigo-300 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-500/30">
                  Cut Duration: {formatTime(Math.max(0, (options.trimEnd || duration) - (options.trimStart || 0)))}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                    <span>Start Time</span>
                    <span className="text-slate-200">{formatTime(options.trimStart || 0)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    step="0.1"
                    value={options.trimStart || 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val < (options.trimEnd || duration)) {
                        updateOption('trimStart', val);
                      }
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                    <span>End Time</span>
                    <span className="text-slate-200">{formatTime(options.trimEnd || duration)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    step="0.1"
                    value={options.trimEnd || duration}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val > (options.trimStart || 0)) {
                        updateOption('trimEnd', val);
                      }
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer: Auto Edit & Process CTA */}
      <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Ready to encode with genuine FFmpeg pipeline</span>
        </div>

        <button
          type="button"
          onClick={onStartProcess}
          disabled={isProcessing}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <Sparkles className="w-4 h-4 text-indigo-200 group-hover:rotate-12 transition-transform" />
          <span>Auto Edit & Process Video</span>
          <ArrowRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
