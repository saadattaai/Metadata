import React, { useState, useRef } from 'react';
import { Upload, FileVideo, Sparkles, AlertCircle, PlayCircle, CheckCircle2, Film } from 'lucide-react';
import { VideoMetadata } from '../types';

interface UploadCardProps {
  onVideoLoaded: (data: {
    videoId: string;
    filename: string;
    originalName: string;
    size: number;
    metadata: VideoMetadata;
    previewUrl: string;
    thumbUrl: string | null;
  }) => void;
  onError: (msg: string) => void;
}

export const UploadCard: React.FC<UploadCardProps> = ({ onVideoLoaded, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    // Validate file type
    const validExtensions = ['.mp4', '.mov', '.webm', '.mkv', '.avi', '.m4v'];
    const fileName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext));
    const isVideoMime = file.type.startsWith('video/') || hasValidExt;

    if (!isVideoMime) {
      onError('Unsupported file format. Please upload an MP4, MOV, WebM, MKV, or AVI video.');
      return;
    }

    // Validate size (300 MB limit)
    const maxSizeBytes = 300 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      onError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 300 MB maximum limit.`);
      return;
    }

    setIsUploading(true);
    setUploadPercent(10);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 90);
          setUploadPercent(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadPercent(100);
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success) {
              setTimeout(() => {
                setIsUploading(false);
                onVideoLoaded(data);
              }, 400);
            } else {
              setIsUploading(false);
              onError(data.error || 'Failed to analyze uploaded video.');
            }
          } catch (e) {
            setIsUploading(false);
            onError('Invalid response from video server.');
          }
        } else {
          setIsUploading(false);
          try {
            const errData = JSON.parse(xhr.responseText);
            onError(errData.error || `Upload failed with status code ${xhr.status}`);
          } catch {
            onError(`Upload failed with status code ${xhr.status}`);
          }
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        onError('Network error occurred during video upload.');
      };

      xhr.send(formData);
    } catch (err: any) {
      setIsUploading(false);
      onError(err.message || 'Error occurred during upload.');
    }
  };

  const loadSample = async (type: 'landscape' | 'vertical') => {
    setLoadingSample(type);
    try {
      const res = await fetch('/api/load-sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.success) {
        onVideoLoaded(data);
      } else {
        onError(data.error || 'Failed to load sample clip');
      }
    } catch (err: any) {
      onError('Failed to connect to sample video generator.');
    } finally {
      setLoadingSample(null);
    }
  };

  return (
    <div className="w-full">
      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative group rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden p-8 sm:p-12 text-center flex flex-col items-center justify-center ${
          isDragging
            ? 'border-indigo-500 bg-indigo-950/20 scale-[1.01] shadow-2xl shadow-indigo-500/10 ring-4 ring-indigo-500/20'
            : 'border-slate-800 hover:border-slate-700 bg-gradient-to-b from-[#111622]/80 to-[#0c1017]/90 hover:bg-[#131926]/90'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/mp4,video/quicktime,video/webm,video/x-matroska,video/avi,.mp4,.mov,.webm,.mkv,.avi,.m4v"
          className="hidden"
          disabled={isUploading}
        />

        {/* Ambient background glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />

        {isUploading ? (
          <div className="w-full max-w-md py-4 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-4 animate-bounce">
              <Upload className="w-7 h-7 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Uploading & Analyzing Video...</h3>
            <p className="text-xs text-slate-400 mb-4">Extracting video streams, color profile, and audio channels</p>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-200"
                style={{ width: `${uploadPercent}%` }}
              />
            </div>
            <div className="flex justify-between w-full mt-2 text-[11px] text-slate-400 font-mono">
              <span>{uploadPercent}% uploaded</span>
              <span>Running FFprobe analyzer...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Upload Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800/80 border border-slate-700 group-hover:border-indigo-500/50 group-hover:bg-indigo-950/30 group-hover:scale-105 transition-all duration-300 flex items-center justify-center mb-6 shadow-xl text-slate-300 group-hover:text-indigo-400">
              <Upload className="w-8 h-8 sm:w-10 sm:h-10 transition-transform group-hover:-translate-y-0.5" />
            </div>

            {/* Primary Headline */}
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
              Drag and drop your video here
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-lg mb-6">
              Or click to browse from your device. Fast, private processing without requiring an account.
            </p>

            {/* Choose button */}
            <button
              type="button"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center gap-2"
            >
              <FileVideo className="w-4 h-4" />
              <span>Browse Video File</span>
            </button>

            {/* Format pill badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
              <span className="px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/60 font-mono">MP4</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/60 font-mono">MOV (QuickTime)</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/60 font-mono">WebM</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/60 font-mono">MKV</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/60 font-mono">Max 300 MB</span>
            </div>
          </>
        )}
      </div>

      {/* Quick Test with Sample Clips */}
      <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Don't have a video file ready? Test the full pipeline instantly:</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            disabled={isUploading || !!loadingSample}
            onClick={(e) => {
              e.stopPropagation();
              loadSample('landscape');
            }}
            className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Film className="w-3.5 h-3.5 text-indigo-400" />
            <span>{loadingSample === 'landscape' ? 'Loading clip...' : '16:9 Landscape Clip'}</span>
          </button>
          <button
            type="button"
            disabled={isUploading || !!loadingSample}
            onClick={(e) => {
              e.stopPropagation();
              loadSample('vertical');
            }}
            className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <PlayCircle className="w-3.5 h-3.5 text-purple-400" />
            <span>{loadingSample === 'vertical' ? 'Loading clip...' : '9:16 Vertical Reel'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
