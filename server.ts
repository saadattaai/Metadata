import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { spawn, execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Working directories
const BASE_TMP_DIR = path.join(process.cwd(), 'temp_storage');
const UPLOADS_DIR = path.join(BASE_TMP_DIR, 'uploads');
const OUTPUTS_DIR = path.join(BASE_TMP_DIR, 'outputs');
const SAMPLES_DIR = path.join(BASE_TMP_DIR, 'samples');

// Ensure storage directories exist
[BASE_TMP_DIR, UPLOADS_DIR, OUTPUTS_DIR, SAMPLES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// JSON body parser with limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 300 * 1024 * 1024, // 300 MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'video/mp4',
      'video/quicktime',
      'video/webm',
      'video/x-matroska',
      'video/x-msvideo',
      'video/avi',
      'video/mpeg',
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.mp4', '.mov', '.webm', '.mkv', '.avi', '.m4v'];

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported format. Please upload an MP4, MOV, WebM, MKV, or AVI video.'));
    }
  },
});

// In-memory active processing jobs state
interface JobState {
  jobId: string;
  videoId: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  percent: number;
  stage: string;
  currentTime?: string;
  fps?: string;
  speed?: string;
  error?: string;
  result?: any;
  createdAt: number;
}

const jobs = new Map<string, JobState>();

// Helper to run ffprobe and return parsed metadata
function probeVideo(filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath,
    ];

    const proc = spawn('ffprobe', args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`ffprobe failed with code ${code}: ${stderr}`));
      }
      try {
        const parsed = JSON.parse(stdout);
        const format = parsed.format || {};
        const streams = parsed.streams || [];
        const videoStream = streams.find((s: any) => s.codec_type === 'video');
        const audioStream = streams.find((s: any) => s.codec_type === 'audio');

        let fps = 30;
        if (videoStream?.r_frame_rate) {
          const parts = videoStream.r_frame_rate.split('/');
          if (parts.length === 2 && Number(parts[1]) > 0) {
            fps = Math.round(Number(parts[0]) / Number(parts[1]));
          } else if (!isNaN(Number(videoStream.r_frame_rate))) {
            fps = Math.round(Number(videoStream.r_frame_rate));
          }
        }

        const duration = Number(format.duration || videoStream?.duration || 0);
        const size = Number(format.size || 0);

        const metadata = {
          filename: path.basename(filePath),
          originalName: path.basename(filePath),
          size,
          duration,
          format: format.format_name || 'mp4',
          formatLongName: format.format_long_name,
          bitrate: Number(format.bit_rate || videoStream?.bit_rate || 0),
          video: videoStream
            ? {
                codec: videoStream.codec_name,
                codecLongName: videoStream.codec_long_name,
                width: videoStream.width || 1920,
                height: videoStream.height || 1080,
                aspectRatio: videoStream.display_aspect_ratio || `${videoStream.width}:${videoStream.height}`,
                fps,
                bitrate: Number(videoStream.bit_rate || 0),
                pixelFormat: videoStream.pix_fmt,
                colorSpace: videoStream.color_space,
                colorPrimaries: videoStream.color_primaries,
                profile: videoStream.profile,
              }
            : undefined,
          audio: audioStream
            ? {
                codec: audioStream.codec_name,
                codecLongName: audioStream.codec_long_name,
                sampleRate: Number(audioStream.sample_rate || 44100),
                channels: Number(audioStream.channels || 2),
                channelLayout: audioStream.channel_layout,
                bitrate: Number(audioStream.bit_rate || 0),
              }
            : undefined,
          tags: format.tags || {},
        };

        resolve(metadata);
      } catch (err: any) {
        reject(new Error(`Failed to parse ffprobe output: ${err.message}`));
      }
    });
  });
}

// Generate thumbnail
function generateThumbnail(videoPath: string, outputPath: string): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn('ffmpeg', [
      '-y',
      '-ss', '00:00:01.000',
      '-i', videoPath,
      '-vframes', '1',
      '-vf', 'scale=640:-1',
      '-q:v', '3',
      outputPath,
    ]);

    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve(outputPath);
      } else {
        // Try at 00:00:00
        const proc2 = spawn('ffmpeg', [
          '-y',
          '-ss', '00:00:00.000',
          '-i', videoPath,
          '-vframes', '1',
          '-vf', 'scale=640:-1',
          '-q:v', '3',
          outputPath,
        ]);
        proc2.on('close', () => resolve(outputPath));
      }
    });
  });
}

// Generate sample test video clips if not already present
function initSampleVideos() {
  const sample1 = path.join(SAMPLES_DIR, 'sample_landscape_4k_hdr.mp4');
  const sample2 = path.join(SAMPLES_DIR, 'sample_vertical_reel.mp4');

  if (!fs.existsSync(sample1)) {
    try {
      console.log('Generating built-in sample 1 (Landscape cinematic test)...');
      execSync(
        `ffmpeg -y -f lavfi -i testsrc=size=1920x1080:rate=30 -f lavfi -i "sine=frequency=440:beep_factor=4:sample_rate=48000" -t 5 -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k "${sample1}"`,
        { stdio: 'ignore' }
      );
    } catch (e) {
      console.error('Failed generating sample 1:', e);
    }
  }

  if (!fs.existsSync(sample2)) {
    try {
      console.log('Generating built-in sample 2 (Vertical Reel test)...');
      execSync(
        `ffmpeg -y -f lavfi -i smptebars=size=1080x1920:rate=30 -f lavfi -i "sine=frequency=523.25:sample_rate=48000" -t 5 -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k "${sample2}"`,
        { stdio: 'ignore' }
      );
    } catch (e) {
      console.error('Failed generating sample 2:', e);
    }
  }
}

// API Routes

// 1. Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    engine: 'FFmpeg + FFprobe Native',
    name: 'Saad Edits Core API',
  });
});

// 2. Upload video
app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const videoId = path.parse(req.file.filename).name;
    const uploadedPath = req.file.path;
    const thumbFilename = `${videoId}_thumb.jpg`;
    const thumbPath = path.join(BASE_TMP_DIR, thumbFilename);

    const metadata = await probeVideo(uploadedPath);
    metadata.originalName = req.file.originalname;

    await generateThumbnail(uploadedPath, thumbPath);

    res.json({
      success: true,
      videoId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      metadata,
      previewUrl: `/api/media/upload/${req.file.filename}`,
      thumbUrl: fs.existsSync(thumbPath) ? `/api/media/thumb/${thumbFilename}` : null,
    });
  } catch (err: any) {
    console.error('Upload processing error:', err);
    res.status(500).json({ error: err.message || 'Failed to process uploaded video' });
  }
});

// 3. Load Sample Video for quick instant testing
app.post('/api/load-sample', async (req, res) => {
  try {
    const type = req.body.type || 'landscape';
    const sampleFilename = type === 'vertical' ? 'sample_vertical_reel.mp4' : 'sample_landscape_4k_hdr.mp4';
    const sourcePath = path.join(SAMPLES_DIR, sampleFilename);

    if (!fs.existsSync(sourcePath)) {
      initSampleVideos();
    }

    const uniqueId = `sample_${Date.now()}_${type}`;
    const targetFilename = `${uniqueId}.mp4`;
    const targetPath = path.join(UPLOADS_DIR, targetFilename);

    fs.copyFileSync(sourcePath, targetPath);

    const stats = fs.statSync(targetPath);
    const metadata = await probeVideo(targetPath);
    metadata.originalName = type === 'vertical' ? 'Smartphone_Vertical_Reel_Original.mp4' : 'Cinematic_Landscape_Test_Clip.mp4';

    const thumbFilename = `${uniqueId}_thumb.jpg`;
    const thumbPath = path.join(BASE_TMP_DIR, thumbFilename);
    await generateThumbnail(targetPath, thumbPath);

    res.json({
      success: true,
      videoId: uniqueId,
      filename: targetFilename,
      originalName: metadata.originalName,
      size: stats.size,
      metadata,
      previewUrl: `/api/media/upload/${targetFilename}`,
      thumbUrl: fs.existsSync(thumbPath) ? `/api/media/thumb/${thumbFilename}` : null,
    });
  } catch (err: any) {
    console.error('Sample loading error:', err);
    res.status(500).json({ error: err.message || 'Failed to load sample clip' });
  }
});

// 4. Start processing
app.post('/api/process', async (req, res) => {
  const { videoId, filename, options } = req.body;

  if (!filename) {
    return res.status(400).json({ error: 'Missing filename parameter' });
  }

  const inputPath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(inputPath)) {
    return res.status(404).json({ error: 'Source video not found. Please upload again.' });
  }

  const jobId = `job_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
  const outputFilename = `saad-edits-processed-${Date.now()}.mp4`;
  const outputPath = path.join(OUTPUTS_DIR, outputFilename);

  const job: JobState = {
    jobId,
    videoId: videoId || filename,
    status: 'processing',
    percent: 5,
    stage: 'Analyzing input stream & audio track...',
    createdAt: Date.now(),
  };

  jobs.set(jobId, job);
  res.json({ success: true, jobId, message: 'Processing started' });

  // Execute processing asynchronously
  (async () => {
    const startTime = Date.now();
    try {
      const originalMetadata = await probeVideo(inputPath);
      const totalDuration = originalMetadata.duration || 10;

      job.percent = 15;
      job.stage = 'Building FFmpeg transformation graph & filters...';

      // Assemble FFmpeg arguments
      const ffmpegArgs: string[] = ['-y'];

      // Trimming
      const trimStart = Number(options.trimStart || 0);
      const trimEnd = Number(options.trimEnd || 0);
      if (trimStart > 0) {
        ffmpegArgs.push('-ss', trimStart.toString());
      }
      if (trimEnd > 0 && trimEnd > trimStart) {
        ffmpegArgs.push('-to', trimEnd.toString());
      }

      ffmpegArgs.push('-i', inputPath);

      // Video Filters
      const videoFilters: string[] = [];
      const audioFilters: string[] = [];

      // 1. Resolution / Aspect Ratio
      const resolution = options.resolution || 'original';
      if (resolution === '1080p' || resolution === 'landscape') {
        videoFilters.push('scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black');
      } else if (resolution === '720p') {
        videoFilters.push('scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black');
      } else if (resolution === '4k') {
        videoFilters.push('scale=3840:2160:force_original_aspect_ratio=decrease,pad=3840:2160:(ow-iw)/2:(oh-ih)/2:color=black');
      } else if (resolution === 'vertical_shorts') {
        videoFilters.push('scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black');
      } else if (resolution === 'square') {
        videoFilters.push('scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:color=black');
      }

      // 2. Color grading / LUT-like enhancement filter
      const colorFilter = options.colorFilter || 'crisp';
      if (colorFilter === 'crisp') {
        videoFilters.push('eq=contrast=1.06:brightness=0.01:saturation=1.12');
      } else if (colorFilter === 'cinematic_warm') {
        videoFilters.push('eq=contrast=1.08:saturation=1.15,colorbalance=rs=0.05:gs=0.02:bs=-0.04:rm=0.05:gm=0.02:bm=-0.03');
      } else if (colorFilter === 'cool_vivid') {
        videoFilters.push('eq=contrast=1.05:saturation=1.2,colorbalance=rs=-0.04:gs=0.01:bs=0.06:rm=-0.03:gm=0.01:bm=0.05');
      } else if (colorFilter === 'noir') {
        videoFilters.push('hue=s=0,eq=contrast=1.2:brightness=-0.02');
      }

      // 3. Playback speed
      const speed = Number(options.speed || 1.0);
      if (speed !== 1.0 && speed > 0.2 && speed <= 3.0) {
        const ptsFactor = 1 / speed;
        videoFilters.push(`setpts=${ptsFactor}*PTS`);
        if (speed >= 0.5 && speed <= 2.0) {
          audioFilters.push(`atempo=${speed}`);
        } else if (speed > 2.0) {
          audioFilters.push(`atempo=2.0,atempo=${speed / 2.0}`);
        } else if (speed < 0.5) {
          audioFilters.push(`atempo=0.5,atempo=${speed / 0.5}`);
        }
      }

      // 4. Audio Normalization & Volume
      if (options.normalizeAudio) {
        audioFilters.push('loudnorm=I=-16:TP=-1.5:LRA=11');
      }
      const audioVolume = Number(options.audioVolume ?? 1.0);
      if (audioVolume === 0) {
        // Mute video
        ffmpegArgs.push('-an');
      } else if (audioVolume !== 1.0) {
        audioFilters.push(`volume=${audioVolume}`);
      }

      // Frame rate conversion
      if (options.fps && options.fps !== 'original') {
        ffmpegArgs.push('-r', options.fps);
      }

      // Apply video filter chain if any
      if (videoFilters.length > 0) {
        ffmpegArgs.push('-vf', videoFilters.join(','));
      }

      // Apply audio filter chain if any and audio not muted
      if (audioFilters.length > 0 && audioVolume !== 0 && originalMetadata.audio) {
        ffmpegArgs.push('-af', audioFilters.join(','));
      }

      // Video encoding settings: Universal H.264 / AAC compatibility
      ffmpegArgs.push(
        '-c:v', 'libx264',
        '-profile:v', 'high',
        '-level:v', '4.2',
        '-preset', 'fast',
        '-crf', String(options.qualityCrf || 20),
        '-pix_fmt', 'yuv420p'
      );

      if (audioVolume !== 0 && originalMetadata.audio) {
        ffmpegArgs.push(
          '-c:a', 'aac',
          '-b:a', '192k',
          '-ar', '48000'
        );
      }

      // Web Faststart & Container branding
      ffmpegArgs.push('-movflags', '+faststart');

      // ISO 17 Device Profile Metadata (Container & atom tags)
      const nowIso = new Date().toISOString();
      const metadataChanges: any[] = [];

      if (options.ios17Profile) {
        ffmpegArgs.push(
          '-brand', 'mp42',
          '-metadata:g', 'major_brand=mp42',
          '-metadata:g', 'compatible_brands=isommp42',
          '-metadata:g', 'encoder=iOS 17.6.1 (21G93) QuickTime / AVFoundation Engine',
          '-metadata:g', 'software=iOS 17.6.1 Photo Library Export Pipeline',
          '-metadata:g', 'model=iPhone 15 Pro Max (iOS 17 Camera Profile)',
          '-metadata:g', 'make=Apple',
          '-metadata:g', `creation_time=${nowIso}`,
          '-metadata:g', 'comment=Exported via Saad Edits with iOS 17 Media Container Profile',
          '-metadata:s:v:0', 'handler_name=Apple Video Media Handler',
          '-metadata:s:a:0', 'handler_name=Apple Sound Media Handler'
        );

        metadataChanges.push(
          {
            key: 'encoder',
            originalValue: originalMetadata.tags?.encoder || originalMetadata.tags?.ENCODER || 'None / Unknown',
            newValue: 'iOS 17.6.1 (21G93) QuickTime / AVFoundation Engine',
            description: 'iOS 17 AVFoundation Export container signature',
            category: 'device',
          },
          {
            key: 'software',
            originalValue: originalMetadata.tags?.software || 'Unspecified',
            newValue: 'iOS 17.6.1 Photo Library Export Pipeline',
            description: 'Apple Photos Library ecosystem profile signature',
            category: 'device',
          },
          {
            key: 'model',
            originalValue: originalMetadata.tags?.model || 'Generic / None',
            newValue: 'iPhone 15 Pro Max (iOS 17 Camera Profile)',
            description: 'Apple Device Profile descriptor',
            category: 'device',
          },
          {
            key: 'major_brand',
            originalValue: originalMetadata.tags?.major_brand || 'isom / mp42',
            newValue: 'mp42 (QuickTime & Universal ISO-MP4)',
            description: 'ISO-compliant MP4 media container brand format',
            category: 'container',
          },
          {
            key: 'video_handler',
            originalValue: 'VideoHandler',
            newValue: 'Apple Video Media Handler',
            description: 'QuickTime Movie Atom track descriptor for video stream',
            category: 'video',
          },
          {
            key: 'audio_handler',
            originalValue: 'SoundHandler',
            newValue: 'Apple Sound Media Handler',
            description: 'CoreAudio Sound Media Handler track descriptor',
            category: 'audio',
          },
          {
            key: 'creation_time',
            originalValue: originalMetadata.tags?.creation_time || 'None',
            newValue: nowIso,
            description: 'ISO 8601 UTC timestamp',
            category: 'container',
          }
        );
      } else {
        ffmpegArgs.push(
          '-metadata:g', 'encoder=Saad Edits Pro Video Engine',
          '-metadata:g', `creation_time=${nowIso}`
        );
        metadataChanges.push({
          key: 'encoder',
          originalValue: originalMetadata.tags?.encoder || 'None',
          newValue: 'Saad Edits Pro Video Engine',
          description: 'Custom optimized encoding stamp',
          category: 'container',
        });
      }

      ffmpegArgs.push(outputPath);

      job.stage = 'Encoding video streams with FFmpeg...';
      job.percent = 25;

      console.log('Spawning FFmpeg with args:', ffmpegArgs.join(' '));
      const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

      let stderrOutput = '';

      ffmpegProcess.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        stderrOutput += text;

        // Parse progress e.g. time=00:00:04.56
        const timeMatch = text.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        const fpsMatch = text.match(/fps=\s*(\d+(?:\.\d+)?)/);
        const speedMatch = text.match(/speed=\s*(\d+(?:\.\d+)?x)/);

        if (timeMatch) {
          const hours = Number(timeMatch[1]);
          const minutes = Number(timeMatch[2]);
          const seconds = Number(timeMatch[3]);
          const currentSeconds = hours * 3600 + minutes * 60 + seconds;
          const calculatedDuration = trimEnd > trimStart ? trimEnd - trimStart : totalDuration;
          const ratio = Math.min(Math.max(currentSeconds / (calculatedDuration || 1), 0), 1);
          job.percent = Math.round(25 + ratio * 65);
          job.currentTime = `${timeMatch[1]}:${timeMatch[2]}:${timeMatch[3]}`;
        }
        if (fpsMatch) {
          job.fps = fpsMatch[1];
        }
        if (speedMatch) {
          job.speed = speedMatch[1];
        }
      });

      ffmpegProcess.on('close', async (code) => {
        if (code !== 0 || !fs.existsSync(outputPath)) {
          job.status = 'error';
          job.error = `FFmpeg process exited with code ${code}. Error details: ${stderrOutput.slice(-300)}`;
          console.error('FFmpeg failed:', stderrOutput);
          return;
        }

        job.percent = 95;
        job.stage = 'Inspecting output stream metadata & building comparison...';

        try {
          const processedMetadata = await probeVideo(outputPath);
          const processedStats = fs.statSync(outputPath);
          const originalStats = fs.statSync(inputPath);
          const processingTimeSeconds = Math.round((Date.now() - startTime) / 100) / 10;
          const sizeReductionPercent = Math.round(((originalStats.size - processedStats.size) / originalStats.size) * 100);

          job.percent = 100;
          job.status = 'completed';
          job.stage = 'Processing complete! Ready for preview and download.';
          job.result = {
            jobId,
            videoId,
            originalMetadata,
            processedMetadata,
            metadataChanges,
            originalUrl: `/api/media/upload/${filename}`,
            processedUrl: `/api/media/output/${outputFilename}`,
            downloadUrl: `/api/download/${outputFilename}`,
            outputFilename,
            processedSize: processedStats.size,
            originalSize: originalStats.size,
            sizeReductionPercent,
            processingTimeSeconds,
          };
        } catch (postErr: any) {
          job.status = 'error';
          job.error = `Output inspection failed: ${postErr.message}`;
        }
      });
    } catch (err: any) {
      job.status = 'error';
      job.error = err.message || 'Processing pipeline error';
      console.error('Pipeline error:', err);
    }
  })();
});

// 5. Check job progress
app.get('/api/progress/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

// 6. Media Streaming endpoint with HTTP Range support for smooth video player seeking
app.get('/api/media/:type/:filename', (req, res) => {
  const { type, filename } = req.params;
  const sanitized = path.basename(filename);

  let targetDir = UPLOADS_DIR;
  if (type === 'output') targetDir = OUTPUTS_DIR;
  if (type === 'thumb') targetDir = BASE_TMP_DIR;
  if (type === 'sample') targetDir = SAMPLES_DIR;

  const filePath = path.join(targetDir, sanitized);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  let contentType = 'video/mp4';
  if (sanitized.endsWith('.jpg') || sanitized.endsWith('.jpeg')) {
    contentType = 'image/jpeg';
  } else if (sanitized.endsWith('.webm')) {
    contentType = 'video/webm';
  }

  if (range && contentType.startsWith('video/')) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// 7. Direct Download endpoint
app.get('/api/download/:filename', (req, res) => {
  const sanitized = path.basename(req.params.filename);
  const filePath = path.join(OUTPUTS_DIR, sanitized);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found or expired' });
  }

  const customDownloadName = req.query.name
    ? `${String(req.query.name).replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`
    : 'saad-edits-processed-video.mp4';

  res.setHeader('Content-Disposition', `attachment; filename="${customDownloadName}"`);
  res.setHeader('Content-Type', 'video/mp4');
  fs.createReadStream(filePath).pipe(res);
});

// 8. Delete / Cleanup specific video
app.post('/api/cleanup', (req, res) => {
  try {
    const { videoId, filename, outputFilename } = req.body;
    if (filename) {
      const up = path.join(UPLOADS_DIR, path.basename(filename));
      if (fs.existsSync(up)) fs.unlinkSync(up);
    }
    if (outputFilename) {
      const out = path.join(OUTPUTS_DIR, path.basename(outputFilename));
      if (fs.existsSync(out)) fs.unlinkSync(out);
    }
    if (videoId) {
      const thumb = path.join(BASE_TMP_DIR, `${videoId}_thumb.jpg`);
      if (fs.existsSync(thumb)) fs.unlinkSync(thumb);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Background cleaner: remove temp files older than 30 mins
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000;

  [UPLOADS_DIR, OUTPUTS_DIR, BASE_TMP_DIR].forEach((dir) => {
    try {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file === 'samples') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isFile() && now - stat.mtimeMs > maxAge) {
          fs.unlinkSync(fullPath);
        }
      }
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  });

  // Clean old jobs
  for (const [key, job] of jobs.entries()) {
    if (now - job.createdAt > maxAge) {
      jobs.delete(key);
    }
  }
}, 10 * 60 * 1000);

// Initialize sample videos
initSampleVideos();

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Saad Edits Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
