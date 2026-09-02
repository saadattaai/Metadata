import React, { useState } from 'react';
import { 
  FileText, 
  Smartphone, 
  CheckCircle, 
  Info, 
  Layers, 
  Tag, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { ProcessResult } from '../types';

interface MetadataInspectorProps {
  result: ProcessResult;
}

export const MetadataInspector: React.FC<MetadataInspectorProps> = ({ result }) => {
  const [showRawTags, setShowRawTags] = useState(false);

  const tags = result.processedMetadata.tags || {};
  const changes = result.metadataChanges || [];

  return (
    <div className="w-full bg-[#111622]/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>iOS 17 Metadata & Container Inspector</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Verified
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Container atoms, export signatures, and media track descriptors written by FFmpeg
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Non-deceptive Media Profile</span>
        </div>
      </div>

      {/* Modified / Injected Metadata Table */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-indigo-400" />
          <span>Applied Metadata Fields & Atom Modifications</span>
        </h4>

        <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Metadata Key / Atom</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Previous Value</th>
                  <th className="py-3 px-4 text-indigo-300">Applied Export Value</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-[12px]">
                {changes.map((change, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      {change.key}
                      <span className="block font-sans font-normal text-[10px] text-slate-400 mt-0.5">
                        {change.description}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {change.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 truncate max-w-[140px]">
                      {change.originalValue || 'None'}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold truncate max-w-[200px]">
                      {change.newValue}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-2.5 h-2.5" />
                        <span>Injected</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Raw FFprobe Tag Dump Toggle */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowRawTags(!showRawTags)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span>{showRawTags ? 'Hide Raw FFprobe Container Tags' : 'View Full Raw Container Tag Tree'}</span>
          {showRawTags ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showRawTags && (
          <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
            <pre>{JSON.stringify(result.processedMetadata, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Compliance & Standards Note */}
      <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-300">Container Standard:</strong> ISO/IEC 14496-14 (MP4 File Format) with QuickTime file brand extensions (<code className="text-indigo-300">mp42</code>). Metadata helps media players, editing suites, and platforms recognize hardware profile configurations without altering cryptographic signatures or device integrity.
        </p>
      </div>
    </div>
  );
};
