import React from 'react';
import { Sparkles, ShieldCheck, Film, Zap } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  hasActiveVideo: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, hasActiveVideo }) => {
  return (
    <header className="border-b border-slate-800/80 bg-[#0c1017]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={hasActiveVideo ? onReset : undefined}
          className={`flex items-center gap-3 ${hasActiveVideo ? 'cursor-pointer group' : ''}`}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white font-sans">
                Saad <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Edits</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PRO ENGINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Automatic Video Transcoder & iOS 17 Metadata Studio
            </p>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-3">
          {/* No Sign In Required Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>No Sign-In Required</span>
          </div>

          {/* Engine indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/60 text-slate-300 text-xs font-mono">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>FFmpeg 4.4 Engine</span>
          </div>

          {/* Reset / New project button if video loaded */}
          {hasActiveVideo && (
            <button
              onClick={onReset}
              className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              New Video
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
