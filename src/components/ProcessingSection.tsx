import React from 'react';
import { Loader2, Zap, Clock, Activity, Cpu } from 'lucide-react';
import { ProcessingProgress } from '../types';

interface ProcessingSectionProps {
  progress: ProcessingProgress;
}

export const ProcessingSection: React.FC<ProcessingSectionProps> = ({ progress }) => {
  return (
    <div className="w-full bg-[#111622]/95 border border-indigo-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40 relative overflow-hidden">
      {/* Background glowing ambient light */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Processing Video Pipeline</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {progress.percent}%
                </span>
              </h3>
              <p className="text-xs text-indigo-300/80 font-medium">
                {progress.stage || 'Executing FFmpeg video filters and encoder...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 self-start sm:self-auto">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hardware Accelerated FFmpeg</span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-slate-900/90 rounded-full h-3.5 p-0.5 border border-slate-800 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 transition-all duration-300 relative overflow-hidden"
              style={{ width: `${Math.max(5, progress.percent)}%` }}
            >
              {/* Shimmer reflection */}
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
              <span>Stage: {progress.stage}</span>
            </span>
            <span className="text-indigo-300 font-semibold">{progress.percent}% Complete</span>
          </div>
        </div>

        {/* Real-time FFmpeg Telemetry Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          {progress.currentTime && (
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Processed Time</div>
                <div className="text-xs font-mono font-bold text-white">{progress.currentTime}</div>
              </div>
            </div>
          )}

          {progress.speed && (
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Encoding Speed</div>
                <div className="text-xs font-mono font-bold text-amber-300">{progress.speed}</div>
              </div>
            </div>
          )}

          {progress.fps && (
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Current Framerate</div>
                <div className="text-xs font-mono font-bold text-emerald-300">{progress.fps} FPS</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
