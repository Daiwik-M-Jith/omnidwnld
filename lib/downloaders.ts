import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import { spawn, spawnSync } from 'child_process';
import { EventEmitter } from 'events';
import { addDownload, updateStats } from '@/lib/database';
import { randomUUID } from 'crypto';

// Try to use ffmpeg-static if available
let ffmpegStaticPath: string | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ffmpegStaticPath = require('ffmpeg-static');
} catch (e) {
  ffmpegStaticPath = null;
}

export interface DownloadResult {
  success: boolean;
  stream?: Readable;
  filename?: string;
  title?: string;
  fileSize?: number;
  error?: string;
}

export interface DownloadJobInfo {
  id: string;
  status: 'queued' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  filename?: string;
  filePath?: string;
  fileSize?: number;
  error?: string;
  logs?: string[];
  speed?: string;
  eta?: string;
}

// Global job store
const globalForJobs = globalThis as unknown as {
  downloadJobs: Map<string, { info: DownloadJobInfo; emitter: EventEmitter; proc?: any }> | undefined;
};
const jobs = globalForJobs.downloadJobs ?? new Map<string, { info: DownloadJobInfo; emitter: EventEmitter; proc?: any }>();
globalForJobs.downloadJobs = jobs;

/**
 * Helper to build yt-dlp arguments
 */
function buildYtDlpArgs(url: string, platform: string, format: string, outputTemplate: string): { args: string[], options: any } {
  const options: any = {
    output: outputTemplate,
    noPlaylist: true,
    noContinue: true,
    noWarnings: false,
  };

  // Platform & Format Logic
  if (platform === 'youtube') {
    // Prefer MP4 containers directly to avoid reliance on ffmpeg merging if possible, 
    // but still allow merging if that's the only way to get high quality.
    const mp4Video = `bestvideo[height<=${format.replace('mp4-', '').replace('p', '')}][ext=mp4]`;
    const anyVideo = `bestvideo[height<=${format.replace('mp4-', '').replace('p', '')}]`;
    const mp4Audio = 'bestaudio[ext=m4a]';
    const anyAudio = 'bestaudio';
    const bestMp4 = `best[height<=${format.replace('mp4-', '').replace('p', '')}][ext=mp4]`;
    const bestAny = `best[height<=${format.replace('mp4-', '').replace('p', '')}]`;

    if (format.startsWith('mp4-')) {
      // Try: 1. Best MP4 video + M4A audio (needs merge)
      //      2. Best Any video + Any audio (needs merge + recode)
      //      3. Best single MP4 file
      //      4. Best single file (needs recode)
      options.format = `${mp4Video}+${mp4Audio}/${anyVideo}+${anyAudio}/${bestMp4}/${bestAny}`;
      options.mergeOutput = 'mp4';
      options.recodeVideo = 'mp4'; // Force final container to be MP4
    } else if (format.includes('mp3')) {
      options.format = 'bestaudio/best';
      options.extractAudio = true;
      options.audioFormat = 'mp3';
      options.audioQuality = 0;
    } else {
      options.format = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
      options.mergeOutput = 'mp4';
      options.recodeVideo = 'mp4';
    }
  } else if (platform === 'instagram' || platform === 'twitter' || platform === 'x' || platform === 'tiktok') {
    options.format = 'best';
    options.recodeVideo = 'mp4';
    if (platform === 'tiktok' && format === 'mp4-nowm') {
      options.noWatermark = true;
    }
  } else if (platform === 'soundcloud') {
    options.format = 'bestaudio/best';
    options.extractAudio = true;
    options.audioFormat = 'mp3';
  } else {
    // Default fallback
    options.format = 'best';
    options.recodeVideo = 'mp4';
  }

  // Build Args Array
  const args: string[] = [
    url,
    '-o', outputTemplate,
    '--no-playlist',
    '--no-warnings',
  ];

  if (options.format) args.push('-f', options.format);

  if (options.extractAudio) {
    args.push('-x');
    args.push('--audio-format', 'mp3');
    if (options.audioQuality !== undefined) args.push('--audio-quality', String(options.audioQuality));
  } else {
    if (options.mergeOutput) {
      args.push('--merge-output-format', options.mergeOutput);
    }

    // Always add recode-video if we want MP4, to handle cases where merge didn't happen 
    // or we downloaded a single WebM file. 
    // yt-dlp is smart enough to skip recode if it's already the right format.
    if (options.recodeVideo) {
      args.push('--recode-video', options.recodeVideo);
    }
  }

  // Check FFmpeg availability
  let validFfmpegPath: string | null = null;
  if (ffmpegStaticPath) {
    // Verify the file actually exists
    if (fs.existsSync(ffmpegStaticPath)) {
      validFfmpegPath = ffmpegStaticPath;
    } else {
      console.warn(`[Warning] ffmpeg-static path not found: ${ffmpegStaticPath}`);
      // Fallback: try to find it in node_modules manually if we are in dev
      const devPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
      if (fs.existsSync(devPath)) {
        validFfmpegPath = devPath;
        console.log(`[Info] Found ffmpeg in node_modules: ${validFfmpegPath}`);
      }
    }
  }

  if (validFfmpegPath) {
    args.push('--ffmpeg-location', validFfmpegPath);
  } else {
    // Check if system ffmpeg is available
    try {
      const r = spawnSync('ffmpeg', ['-version'], { windowsHide: true });
      if (r.status !== 0) {
        console.warn('[Warning] No ffmpeg found (static or system). Conversions/Merges will fail.');
      }
    } catch (e) {
      console.warn('[Warning] No ffmpeg found (static or system). Conversions/Merges will fail.');
    }
  }

  return { args, options };
}

/**
 * Ensure yt-dlp binary exists
 */
function getYtDlpBinary(): string {
  const localBinary = path.join(process.cwd(), 'public', 'yt-dlp.exe');
  if (fs.existsSync(localBinary)) return localBinary;
  throw new Error(`yt-dlp binary not found at ${localBinary}. Please ensure yt-dlp.exe is in the public folder.`);
}

/**
 * Start a background download job
 */
export function startDownloadJob(url: string, platform: string, format: string, converterId?: string): string {
  const jobId = randomUUID();
  const emitter = new EventEmitter();

  // Prevent crash if no listener is attached when error is emitted
  emitter.on('error', (err) => {
    console.log(`[Job ${jobId}] Error emitted (caught by default listener):`, err);
  });

  const jobInfo: DownloadJobInfo = {
    id: jobId,
    status: 'queued',
    progress: 0,
    logs: [],
  };

  jobs.set(jobId, { info: jobInfo, emitter });
  console.log(`[Job ${jobId}] Started: ${platform} ${url}`);

  (async () => {
    try {
      jobInfo.status = 'downloading';
      emitter.emit('status', jobInfo);

      const tempDir = path.join(process.cwd(), 'temp_downloads');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const timestamp = Date.now();
      const outputTemplate = path.join(tempDir, `${platform}_${timestamp}_%(title)s.%(ext)s`);

      const { args, options } = buildYtDlpArgs(url, platform, format, outputTemplate);
      const binary = getYtDlpBinary();

      console.log(`[Job ${jobId}] Executing: ${binary} ${args.join(' ')}`);

      const proc = spawn(binary, args, { windowsHide: true, cwd: process.cwd() });
      const job = jobs.get(jobId);
      if (job) job.proc = proc;

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        // Parse progress
        const matches = Array.from(text.matchAll(/(\d{1,3}(?:\.\d+)?)%/g)) as RegExpMatchArray[];
        if (matches.length > 0) {
          const lastMatch = matches[matches.length - 1];
          if (lastMatch && lastMatch[1]) {
            const perc = Math.min(100, Math.max(0, parseFloat(lastMatch[1])));
            jobInfo.progress = perc;

            const speedMatch = text.match(/at\s+([\d.]+\s*[KMG]iB\/s)/i);
            if (speedMatch) jobInfo.speed = speedMatch[1];

            const etaMatch = text.match(/ETA\s+(\d{2}:\d{2})/i);
            if (etaMatch) jobInfo.eta = etaMatch[1];

            emitter.emit('progress', { jobId, progress: perc, speed: jobInfo.speed, eta: jobInfo.eta });
          }
        }
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        // Sometimes progress is in stderr
        const matches = Array.from(data.toString().matchAll(/(\d{1,3}(?:\.\d+)?)%/g)) as RegExpMatchArray[];
        if (matches.length > 0) {
          const lastMatch = matches[matches.length - 1];
          if (lastMatch && lastMatch[1]) {
            const perc = Math.min(100, Math.max(0, parseFloat(lastMatch[1])));
            jobInfo.progress = perc;
            emitter.emit('progress', { jobId, progress: perc });
          }
        }
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          jobInfo.status = 'failed';
          jobInfo.error = `Process exited with code ${code}`;
          emitter.emit('error', { jobId, error: jobInfo.error });
          console.error(`[Job ${jobId}] Failed: ${stderr}`);
          return;
        }

        // Find file
        const allowedExts = ['.mp4', '.mp3', '.m4a', '.webm', '.opus', '.aac', '.flv', '.mkv'];
        const files = fs.readdirSync(tempDir).filter(f =>
          f.startsWith(`${platform}_${timestamp}_`) && allowedExts.some(ext => f.endsWith(ext))
        );

        if (files.length === 0) {
          jobInfo.status = 'failed';
          jobInfo.error = 'Download completed but file not found';
          emitter.emit('error', { jobId, error: jobInfo.error });
          return;
        }

        const filename = files[0];
        const filepath = path.join(tempDir, filename);
        jobInfo.filePath = filepath;
        jobInfo.filename = filename.replace(`${platform}_${timestamp}_`, '');
        jobInfo.fileSize = (fs.statSync(filepath) || { size: 0 }).size;
        jobInfo.status = 'completed';
        jobInfo.progress = 100;

        emitter.emit('completed', { jobId, filename: jobInfo.filename });
        console.log(`[Job ${jobId}] Completed: ${jobInfo.filename}`);

        // DB Update
        try {
          addDownload({
            platform,
            url,
            title: jobInfo.filename,
            format,
            file_size: jobInfo.fileSize,
            status: 'completed',
          });
          updateStats(platform, format);
        } catch (e) {
          console.error('DB Update failed', e);
        }
      });

    } catch (e: any) {
      jobInfo.status = 'failed';
      jobInfo.error = e.message;
      emitter.emit('error', { jobId, error: e.message });
    }
  })();

  return jobId;
}

export function getJobInfo(jobId: string): DownloadJobInfo | null {
  const job = jobs.get(jobId);
  return job ? job.info : null;
}

export function getJobEmitter(jobId: string): EventEmitter | null {
  const job = jobs.get(jobId);
  return job ? job.emitter : null;
}

export function getJobFilePath(jobId: string): string | null {
  const job = jobs.get(jobId);
  return job && job.info.filePath ? job.info.filePath : null;
}

export function cancelJob(jobId: string): boolean {
  const job = jobs.get(jobId);
  if (!job || !job.proc) return false;
  try {
    job.proc.kill('SIGTERM');
    job.info.status = 'cancelled';
    job.emitter.emit('cancelled', { jobId });
    return true;
  } catch (e) {
    return false;
  }
}

export function isFfmpegAvailable(): boolean {
  if (ffmpegStaticPath && fs.existsSync(ffmpegStaticPath)) return true;
  try {
    const r = spawnSync('ffmpeg', ['-version'], { windowsHide: true });
    return !(r.error || r.status !== 0);
  } catch (e) {
    return false;
  }
}

// Legacy/Direct wrapper (optional, but good for simple calls)
export async function downloadMedia(url: string, platform: string, format: string, converterId: string): Promise<DownloadResult> {
  return new Promise((resolve) => {
    const jobId = startDownloadJob(url, platform, format, converterId);
    const emitter = getJobEmitter(jobId);
    if (!emitter) {
      resolve({ success: false, error: 'Failed to start job' });
      return;
    }
    emitter.on('completed', () => {
      const info = getJobInfo(jobId);
      if (info && info.filePath) {
        const stream = fs.createReadStream(info.filePath);
        stream.on('close', () => {
          try { fs.unlinkSync(info.filePath!); } catch (e) { }
        });
        resolve({
          success: true,
          stream,
          filename: info.filename,
          fileSize: info.fileSize
        });
      } else {
        resolve({ success: false, error: 'File not found' });
      }
    });
    emitter.on('error', (data) => {
      resolve({ success: false, error: data.error });
    });
  });
}
