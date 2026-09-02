import React, { useState } from 'react';
import { 
  Download, 
  Copy, 
  Check, 
  Share2, 
  RotateCcw, 
  Sparkles, 
  FileCheck, 
  ShieldCheck,
  Film
} from 'lucide-react';
import { ProcessResult } from '../types';

interface DownloadSectionProps {
  result: ProcessResult;
  onReset: () => void;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({ result, onReset }) => {
  const [copied, setCopied] = useState(false);
  const [customName, setCustomName] = useState('saad-edits-processed-video');

  const cleanName = customName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'saad-edits-processed-video';
  const downloadUrl = `${result.downloadUrl}?name=${encodeURIComponent(cleanName)}`;

  const handleCopyLink = () => {
    const fullUrl = window.location.origin + result.processedUrl;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerDownload = () => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${cleanName}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full bg-gradient-to-b from-[#121826] to-[#0d121c] border border-indigo-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white tracking-tight">Your Video is Ready</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PROCESSED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Optimized MP4 container with iOS 17 metadata profile and normalized audio
            </p>
          </div>
        </div>

        {/* Reuse Compliance Statement */}
        <div className="px-3.5 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Ready for reuse — only if you own the content or have the necessary rights/license.</span>
        </div>
      </div>

      {/* Main Download Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Filename Customizer */}
        <div className="lg:col-span-2 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Export File Name
          </label>
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 focus-within:border-indigo-500 transition-colors">
            <Film className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="saad-edits-processed-video"
              className="bg-transparent text-sm text-white font-mono flex-1 outline-none"
            />
            <span className="text-xs font-mono text-slate-500 ml-1">.mp4</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Universal MP4 format compatible with YouTube, TikTok, Instagram, Apple Photos, and Final Cut.
          </p>
        </div>

        {/* Big Download CTA */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleTriggerDownload}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all flex items-center justify-center gap-2.5 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Download className="w-5 h-5 animate-bounce" />
            <span>Download Video</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied' : 'Copy Direct Link'}</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
              title="Process another video"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Edit Another</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
