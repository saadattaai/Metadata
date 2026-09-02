export interface VideoMetadata {
  filename: string;
  originalName: string;
  size: number;
  duration: number;
  format: string;
  formatLongName?: string;
  bitrate?: number;
  video?: {
    codec: string;
    codecLongName?: string;
    width: number;
    height: number;
    aspectRatio?: string;
    fps: number;
    bitrate?: number;
    pixelFormat?: string;
    colorSpace?: string;
    colorPrimaries?: string;
    profile?: string;
  };
  audio?: {
    codec: string;
    codecLongName?: string;
    sampleRate: number;
    channels: number;
    channelLayout?: string;
    bitrate?: number;
  };
  tags: Record<string, string>;
}

export type ResolutionPreset = 
  | 'original'
  | '1080p'
  | '720p'
  | '4k'
  | 'vertical_shorts' // 1080x1920 (9:16)
  | 'square' // 1080x1080 (1:1)
  | 'landscape'; // 1920x1080 (16:9)

export type FrameRatePreset = 'original' | '60' | '30' | '24';

export type ColorFilterPreset = 
  | 'none'
  | 'crisp'
  | 'cinematic_warm'
  | 'cool_vivid'
  | 'noir';

export interface ProcessOptions {
  preset: 'auto' | 'custom';
  ios17Profile: boolean;
  resolution: ResolutionPreset;
  fps: FrameRatePreset;
  normalizeAudio: boolean;
  audioVolume: number; // 0 (mute) to 2.0 (boost)
  colorFilter: ColorFilterPreset;
  trimStart: number;
  trimEnd: number;
  speed: number;
  qualityCrf: number; // 18-28
  reEncodeCompatibility: boolean;
}

export interface ProcessingProgress {
  jobId: string;
  status: 'idle' | 'uploading' | 'queued' | 'processing' | 'completed' | 'error';
  percent: number;
  stage: string;
  currentTime?: string;
  fps?: string;
  speed?: string;
  error?: string;
}

export interface MetadataChange {
  key: string;
  originalValue: string | null;
  newValue: string;
  description: string;
  category: 'container' | 'device' | 'audio' | 'video';
}

export interface ProcessResult {
  jobId: string;
  videoId: string;
  originalMetadata: VideoMetadata;
  processedMetadata: VideoMetadata;
  metadataChanges: MetadataChange[];
  originalUrl: string;
  processedUrl: string;
  downloadUrl: string;
  outputFilename: string;
  processedSize: number;
  originalSize: number;
  sizeReductionPercent: number;
  processingTimeSeconds: number;
}
