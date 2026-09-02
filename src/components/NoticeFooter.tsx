import React from 'react';
import { Shield, Lock, Scale, Sparkles, Heart } from 'lucide-react';

export const NoticeFooter: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-[#090b10] py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Compliance & Policy Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
          {/* Rights & Licensing */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
              <Scale className="w-4 h-4 text-indigo-400" />
              <span>Content Ownership Notice</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              <strong>Only use videos you own or have permission/license to reuse.</strong> Technical re-encoding or metadata adjustments do not alter original copyright ownership.
            </p>
          </div>

          {/* Privacy & Auto Cleanup */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Privacy & Ephemeral Storage</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              No sign-in or account required. Uploaded videos and rendered outputs are processed on-the-fly and automatically deleted from temporary storage.
            </p>
          </div>

          {/* Genuine Engine */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Verified Processing Engine</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Powered by genuine FFmpeg transcoding, EBU R128 loudness leveling, and ISO/IEC 14496 MP4 container profile presets.
            </p>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/60 text-slate-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} <strong className="text-slate-400">Saad Edits</strong>. Professional Web Video Processing Suite.
          </div>
          <div className="flex items-center gap-4">
            <span>Fast Native Transcoding</span>
            <span>•</span>
            <span>iOS 17 Media Atom Presets</span>
            <span>•</span>
            <span>Instant Zero-Auth Export</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
