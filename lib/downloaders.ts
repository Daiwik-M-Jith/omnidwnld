import ytdl from '@distube/ytdl-core';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import { spawn } from 'child_process';
import { spawnSync } from 'child_process';
import { EventEmitter } from 'events';
// Try to use ffmpeg-static if available (bundled), otherwise fallback to system ffmpeg
let ffmpegStaticPath: string | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ffmpegStaticPath = require('ffmpeg-static');
} catch (e) {
  ffmpegStaticPath = null;
}
console.log('ffmpegStaticPath (from ffmpeg-static):', ffmpegStaticPath);
import { addDownload, updateStats } from '@/lib/database';
import { randomUUID } from 'crypto';

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
  progress: number; // 0-100
  filename?: string;
  filePath?: string;
  fileSize?: number;
  error?: string;
  logs?: string[];
  speed?: string; // e.g., "1.5MiB/s"
  eta?: string; // e.g., "00:05"
}

// Use globalThis to persist jobs across hot reloads in development
const globalForJobs = globalThis as unknown as {
  downloadJobs: Map<string, { info: DownloadJobInfo; emitter: EventEmitter; proc?: any }> | undefined;
};

const jobs = globalForJobs.downloadJobs ?? new Map<string, { info: DownloadJobInfo; emitter: EventEmitter; proc?: any }>();
globalForJobs.downloadJobs = jobs;

// YouTube downloader using ytdl-core with fallback to yt-dlp
export async function downloadYouTubeVideo(url: string, quality: string): Promise<DownloadResult> {
  try {
    if (!ytdl.validateURL(url)) {
      return { success: false, error: 'Invalid YouTube URL' };
    }

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Map quality to itag or filter strategy
    let formatOptions: any = { quality: 'highestvideo' };
    
    if (quality === 'mp4-1080p') {
      formatOptions = { quality: 'highestvideo', filter: (format: any) => 
        format.qualityLabel === '1080p' && format.hasVideo && format.hasAudio 
      };
    } else if (quality === 'mp4-720p') {
      formatOptions = { quality: 'highestvideo', filter: (format: any) => 
        format.qualityLabel === '720p' && format.hasVideo && format.hasAudio 
      };
    } else if (quality === 'mp4-480p') {
      formatOptions = { quality: 'highestvideo', filter: (format: any) => 
        format.qualityLabel === '480p' && format.hasVideo && format.hasAudio 
      };
    } else if (quality === 'mp4-360p') {
      formatOptions = { quality: 'highestvideo', filter: (format: any) => 
        format.qualityLabel === '360p' && format.hasVideo && format.hasAudio 
      };
    }

    let format;
    try {
      format = ytdl.chooseFormat(info.formats, formatOptions);
    } catch (e) {
      // Fallback to highest quality with video and audio
      format = ytdl.chooseFormat(info.formats, { quality: 'highest' });
    }

    const stream = ytdl(url, { format });
    const filename = `${title}.mp4`;

    return {
      success: true,
      stream,
      filename,
      title: info.videoDetails.title,
      fileSize: parseInt(format?.contentLength || '0'),
    };
  } catch (error: any) {
    console.error('YouTube ytdl-core error, falling back to yt-dlp:', error.message);
    // Fallback to yt-dlp
    return await downloadWithYtDlp(url, 'youtube', quality);
  }
}

// YouTube audio downloader with fallback
export async function downloadYouTubeAudio(url: string, quality: string): Promise<DownloadResult> {
  try {
    if (!ytdl.validateURL(url)) {
      return { success: false, error: 'Invalid YouTube URL' };
    }

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    const stream = ytdl(url, {
      quality: 'highestaudio',
      filter: 'audioonly',
    });

    const filename = `${title}.mp3`;

    return {
      success: true,
      stream,
      filename,
      title: info.videoDetails.title,
    };
  } catch (error: any) {
    console.error('YouTube audio ytdl-core error, falling back to yt-dlp:', error.message);
    // Fallback to yt-dlp
    return await downloadWithYtDlp(url, 'youtube', quality);
  }
}

// Generic yt-dlp downloader for other platforms
export async function downloadWithYtDlp(url: string, platform: string, format: string): Promise<DownloadResult> {
  try {
    const tempDir = path.join(process.cwd(), 'temp_downloads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    const outputTemplate = path.join(tempDir, `${platform}_${timestamp}_%(title)s.%(ext)s`);

    let ytDlpOptions: any = {
      output: outputTemplate,
      noPlaylist: true,
      noContinue: true,
      noWarnings: false,
    };

    // Platform-specific options - FORCE MP4 for videos, MP3 for audio ONLY
      if (platform === 'youtube') {
        // YouTube via yt-dlp with quality selection
        // Prefer explicit video+audio selection and let ffmpeg remux to MP4 when available.
        // Avoid forcing ext=mp4 in the selector so we still pick a combined stream if mp4 isn't available.
        if (format === 'mp4-1080p') {
          ytDlpOptions.format = 'bestvideo[height<=1080]+bestaudio/best';
          ytDlpOptions.recodeVideo = 'mp4';
        } else if (format === 'mp4-720p') {
          ytDlpOptions.format = 'bestvideo[height<=720]+bestaudio/best';
          ytDlpOptions.recodeVideo = 'mp4';
        } else if (format === 'mp4-480p') {
          ytDlpOptions.format = 'bestvideo[height<=480]+bestaudio/best';
          ytDlpOptions.recodeVideo = 'mp4';
        } else if (format === 'mp4-360p') {
          ytDlpOptions.format = 'bestvideo[height<=360]+bestaudio/best';
          ytDlpOptions.recodeVideo = 'mp4';
        } else if (format.includes('mp3')) {
          ytDlpOptions.format = 'bestaudio/best';
          ytDlpOptions.extractAudio = true;
          ytDlpOptions.audioFormat = 'mp3';
          ytDlpOptions.audioQuality = 0; // Best quality
        } else {
          ytDlpOptions.format = 'bestvideo+bestaudio/best';
          ytDlpOptions.recodeVideo = 'mp4';
        }
      } else if (platform === 'instagram') {
      ytDlpOptions.format = 'best';
      ytDlpOptions.recodeVideo = 'mp4';
    } else if (platform === 'twitter' || platform === 'x') {
      ytDlpOptions.format = 'best';
      ytDlpOptions.recodeVideo = 'mp4';
    } else if (platform === 'tiktok') {
      ytDlpOptions.format = 'best';
      ytDlpOptions.recodeVideo = 'mp4';
      if (format === 'mp4-nowm') {
        ytDlpOptions.noWatermark = true;
      }
    } else if (platform === 'facebook') {
      ytDlpOptions.format = format === 'mp4-hd' ? 'best' : 'worst';
      ytDlpOptions.recodeVideo = 'mp4';
    } else if (platform === 'soundcloud') {
      ytDlpOptions.format = 'bestaudio/best';
      ytDlpOptions.extractAudio = true;
      ytDlpOptions.audioFormat = 'mp3';
    } else {
      ytDlpOptions.format = 'best';
      ytDlpOptions.recodeVideo = 'mp4';
    }

    // Execute yt-dlp using binary from public folder
    const ytDlpBinary = path.join(process.cwd(), 'public', 'yt-dlp.exe');
    
    // Check if binary exists
    if (!fs.existsSync(ytDlpBinary)) {
      throw new Error(`yt-dlp binary not found at ${ytDlpBinary}. Please run: Copy-Item "node_modules\\yt-dlp-exec\\bin\\yt-dlp.exe" "public\\yt-dlp.exe"`);
    }
    
    console.log(`Using yt-dlp binary: ${ytDlpBinary}`);
    console.log(`Downloading from ${platform}...`);
    console.log('yt-dlp options:', JSON.stringify(ytDlpOptions));
    
    // Determine ffmpeg availability (prefer bundled static path)
    const ffmpegAvailable = !!ffmpegStaticPath || (() => {
      try {
        const ff = spawnSync('ffmpeg', ['-version'], { windowsHide: true });
        return !(ff.error || ff.status !== 0);
      } catch (e) {
        return false;
      }
    })();
    if (!ffmpegAvailable && (ytDlpOptions.extractAudio || ytDlpOptions.recodeVideo)) {
      console.warn('ffmpeg not available - falling back to original containers and skipping extract/recode where necessary.');
      if (ytDlpOptions.extractAudio && !ffmpegAvailable) {
        ytDlpOptions.extractAudio = false;
        ytDlpOptions.format = 'bestaudio/best';
      }
      if (ytDlpOptions.recodeVideo && !ffmpegAvailable) {
        delete ytDlpOptions.recodeVideo;
      }
    }

    // Build command args - FORCE MP4/MP3 output with proper merging
    const args: string[] = [
      url,
      '-o', outputTemplate,
      '--no-playlist',
      '--no-warnings'
    ];
    
    if (ytDlpOptions.format) {
      args.push('-f', ytDlpOptions.format);
    }
    
    // For audio extraction (MP3 only)
    if (ytDlpOptions.extractAudio) {
      args.push('-x');  // Extract audio
      args.push('--audio-format', 'mp3');
      if (ytDlpOptions.audioQuality !== undefined) {
        args.push('--audio-quality', String(ytDlpOptions.audioQuality));
      }
    } else {
      // For videos: FORCE merge to MP4 container
      args.push('--merge-output-format', 'mp4');
      args.push('--remux-video', 'mp4');
      // Add format preference for mp4 codec
      args.push('--prefer-free-formats');
    }
    
    if (ytDlpOptions.recodeVideo && ffmpegAvailable) {
      args.push('--recode-video', ytDlpOptions.recodeVideo);
    }
    if (ffmpegStaticPath) {
      args.push('--ffmpeg-location', ffmpegStaticPath);
    }
    console.log('Final yt-dlp args:', args.join(' '));
    console.log(`Executing: ${ytDlpBinary} ${args.join(' ')}`);
    
    // Execute yt-dlp
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ytDlpBinary, args, { 
        windowsHide: true,
        cwd: process.cwd()
      });
      let stdout = '';
      let stderr = '';
      
      proc.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log(`yt-dlp: ${output.trim()}`);
      });
      
      proc.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        console.error(`yt-dlp stderr: ${output.trim()}`);
      });
      
      proc.on('close', (code) => {
        if (code === 0) {
          console.log('yt-dlp completed successfully');
          resolve();
        } else {
          console.error(`yt-dlp failed with code ${code}`);
          console.error(`stdout: ${stdout}`);
          console.error(`stderr: ${stderr}`);
          reject(new Error(`yt-dlp exited with code ${code}: ${stderr || stdout || 'Unknown error'}`));
        }
      });
      
      proc.on('error', (err) => {
        console.error(`Failed to spawn yt-dlp:`, err);
        reject(new Error(`Failed to spawn yt-dlp: ${err.message}`));
      });
    });
    
    // Find the downloaded file - accept a variety of common media extensions
    const allowedExts = ['.mp4', '.mp3', '.m4a', '.webm', '.opus', '.aac', '.flv', '.mkv'];
    const files = fs.readdirSync(tempDir).filter(f => 
      f.startsWith(`${platform}_${timestamp}_`) && 
      allowedExts.some(ext => f.endsWith(ext))
    );
    
    if (files.length === 0) {
      // List all files in temp dir for debugging
      const allFiles = fs.readdirSync(tempDir);
      console.error('No matching .mp4/.mp3 files found. All files in temp dir:', allFiles);
      return { success: false, error: 'Download completed but MP4/MP3 file not found' };
    }

    const downloadedFile = path.join(tempDir, files[0]);
    const stats = fs.statSync(downloadedFile);
    const stream = fs.createReadStream(downloadedFile);
    
    // Extract clean filename and preserve actual extension
    let cleanFilename = files[0].replace(`${platform}_${timestamp}_`, '');
    // If we performed audio extraction and ffmpeg was available, ensure .mp3; otherwise keep real container
    if (ytDlpOptions.extractAudio && ffmpegAvailable) {
      cleanFilename = cleanFilename.replace(/\.[^.]+$/, '.mp3');
    }
    
    console.log(`Download successful: ${cleanFilename}`);
    
    // Clean up file after streaming
    stream.on('end', () => {
      try {
        fs.unlinkSync(downloadedFile);
        console.log(`Cleaned up temp file: ${downloadedFile}`);
      } catch (e) {
        console.error('Failed to cleanup temp file:', e);
      }
    });

    // Also cleanup on error
    stream.on('error', () => {
      try {
        fs.unlinkSync(downloadedFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    });

    return {
      success: true,
      stream,
      filename: cleanFilename,
      fileSize: stats.size,
    };
  } catch (error: any) {
    console.error(`${platform} yt-dlp download error:`, error);
    return { success: false, error: error.message || `Failed to download from ${platform}` };
  }
}

// Start a background download job and return a jobId immediately. Progress is emitted
// via the EventEmitter associated with the job.
export function startDownloadJob(url: string, platform: string, format: string, converterId?: string): string {
  const jobId = randomUUID();
  const emitter = new EventEmitter();
  const jobInfo: DownloadJobInfo = {
    id: jobId,
    status: 'queued',
    progress: 0,
    logs: [],
  };

  // CRITICAL: Register job IMMEDIATELY before async work starts
  jobs.set(jobId, { info: jobInfo, emitter });
  console.log(`Enqueued job ${jobId} - ${platform} ${url}`);

  // Start async work
  (async () => {
    try {
      jobInfo.status = 'downloading';
      emitter.emit('status', jobInfo);

      // Reuse the logic from downloadWithYtDlp but without blocking callers
      const tempDir = path.join(process.cwd(), 'temp_downloads');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const timestamp = Date.now();
      const outputTemplate = path.join(tempDir, `${platform}_${timestamp}_%(title)s.%(ext)s`);

      let ytDlpOptions: any = {
        output: outputTemplate,
        noPlaylist: true,
        noContinue: true,
        noWarnings: false,
      };

      // same platform-specific options as downloadWithYtDlp
      if (platform === 'youtube') {
        if (format === 'mp4-1080p') {
          ytDlpOptions.format = 'bestvideo[height<=1080]+bestaudio/best';
          ytDlpOptions.recodeVideo = 'mp4';
        } else if (format === 'mp4-720p') {
          ytDlpOptions.format = 'bestvideo[height<=720]+bestaudio/best';
          ytDlpOptions.recodeVideo = 'mp4';
        } else if (format === 'mp4-480p') {
          ytDlpOptions.format = 'bestvideo[height<=480]+bestaudio/best';
          ytDlpOptions.recodeVideo = 'mp4';
        } else if (format === 'mp4-360p') {
          ytDlpOptions.format = 'bestvideo[height<=360]+bestaudio/best';
          ytDlpOptions.recodeVideo = 'mp4';
        } else if (format.includes('mp3')) {
          ytDlpOptions.format = 'bestaudio/best';
          ytDlpOptions.extractAudio = true;
          ytDlpOptions.audioFormat = 'mp3';
          ytDlpOptions.audioQuality = 0; // Best quality
        } else {
          ytDlpOptions.format = 'bestvideo+bestaudio/best';
          ytDlpOptions.recodeVideo = 'mp4';
        }
      } else if (platform === 'instagram') {
        ytDlpOptions.format = 'best';
        ytDlpOptions.recodeVideo = 'mp4';
      } else if (platform === 'twitter' || platform === 'x') {
        ytDlpOptions.format = 'best';
        ytDlpOptions.recodeVideo = 'mp4';
      } else if (platform === 'tiktok') {
        ytDlpOptions.format = 'best';
        ytDlpOptions.recodeVideo = 'mp4';
        if (format === 'mp4-nowm') {
          ytDlpOptions.noWatermark = true;
        }
      } else if (platform === 'facebook') {
        ytDlpOptions.format = format === 'mp4-hd' ? 'best' : 'worst';
        ytDlpOptions.recodeVideo = 'mp4';
      } else if (platform === 'soundcloud') {
        ytDlpOptions.format = 'bestaudio/best';
        ytDlpOptions.extractAudio = true;
        ytDlpOptions.audioFormat = 'mp3';
      } else {
        ytDlpOptions.format = 'best';
        ytDlpOptions.recodeVideo = 'mp4';
      }

      const ytDlpBinary = path.join(process.cwd(), 'public', 'yt-dlp.exe');
      if (!fs.existsSync(ytDlpBinary)) {
        throw new Error(`yt-dlp binary not found at ${ytDlpBinary}`);
      }

      // Check if ffmpeg is available when we need post-processing; prefer the bundled static one
      const needsFfmpeg = !!(ytDlpOptions.extractAudio || ytDlpOptions.recodeVideo);
      let ffmpegAvailable = !!ffmpegStaticPath;
      if (needsFfmpeg && !ffmpegAvailable) {
        try {
          const ff = spawnSync('ffmpeg', ['-version'], { windowsHide: true });
          ffmpegAvailable = !(ff.error || ff.status !== 0);
        } catch (e) {
          ffmpegAvailable = false;
        }
      }
      if (needsFfmpeg && !ffmpegAvailable) {
        // Graceful fallback: if we cannot extract audio to mp3 because ffmpeg is missing, fall back to downloading the original best audio
        if (ytDlpOptions.extractAudio) {
          console.warn('ffmpeg not available; falling back to downloading original audio container instead of extracting to mp3.');
          ytDlpOptions.extractAudio = false;
          ytDlpOptions.format = 'bestaudio/best';
        }
        // For recodeVideo we won't force recoding if ffmpeg is not available
        if (ytDlpOptions.recodeVideo && !ffmpegAvailable) {
          console.warn('ffmpeg not available; skipping video recode, will use best available container.');
          delete ytDlpOptions.recodeVideo;
        }
      }

      const args: string[] = [
        url,
        '-o', outputTemplate,
        '--no-playlist',
        '--no-warnings'
      ];
      if (ytDlpOptions.format) args.push('-f', ytDlpOptions.format);
      if (ytDlpOptions.extractAudio) {
        args.push('-x');
        args.push('--audio-format', 'mp3');
      } else {
        args.push('--merge-output-format', 'mp4');
        args.push('--remux-video', 'mp4');
        args.push('--prefer-free-formats');
      }

      // Use recode-video if requested and ffmpeg is available
      const ffmpegIsAvailable = !!ffmpegStaticPath || (() => {
        try {
          const ff = spawnSync('ffmpeg', ['-version'], { windowsHide: true });
          return !(ff.error || ff.status !== 0);
        } catch (e) {
          return false;
        }
      })();
      if (ytDlpOptions.recodeVideo && ffmpegIsAvailable) {
        args.push('--recode-video', ytDlpOptions.recodeVideo);
      }
      if (ffmpegStaticPath) {
        args.push('--ffmpeg-location', ffmpegStaticPath);
      }

      const proc = spawn(ytDlpBinary, args, { windowsHide: true, cwd: process.cwd() });
      const job = jobs.get(jobId);
      if (job) job.proc = proc;
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        jobInfo.logs = jobInfo.logs || [];
        jobInfo.logs.push(`OUT: ${text}`);
        // parse progress e.g. "[download]  21.3% of ... at 1.5MiB/s ETA 00:05"
        const matches = Array.from(text.matchAll(/(\d{1,3}(?:\.\d+)?)%/g)) as RegExpMatchArray[];
        if (matches.length > 0) {
          const lastMatch = matches[matches.length - 1];
          if (lastMatch && lastMatch[1]) {
            const last = lastMatch[1];
            const perc = Math.min(100, Math.max(0, parseFloat(last)));
            jobInfo.progress = perc;
            
            // Extract speed: e.g., "at 1.5MiB/s"
            const speedMatch = text.match(/at\s+([\d.]+\s*[KMG]iB\/s)/i);
            if (speedMatch && speedMatch[1]) {
              jobInfo.speed = speedMatch[1];
            }
            
            // Extract ETA: e.g., "ETA 00:05" or "ETA 01:23"
            const etaMatch = text.match(/ETA\s+(\d{2}:\d{2})/i);
            if (etaMatch && etaMatch[1]) {
              jobInfo.eta = etaMatch[1];
            }
            
            emitter.emit('progress', { jobId, progress: perc, speed: jobInfo.speed, eta: jobInfo.eta });
            console.log(`Job ${jobId} progress: ${perc}% | Speed: ${jobInfo.speed || 'N/A'} | ETA: ${jobInfo.eta || 'N/A'}`);
          }
        }
      });

      proc.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        jobInfo.logs = jobInfo.logs || [];
        jobInfo.logs.push(`ERR: ${text}`);
        // Sometimes progress is printed on stderr
        const matches = Array.from(text.matchAll(/(\d{1,3}(?:\.\d+)?)%/g)) as RegExpMatchArray[];
        if (matches.length > 0) {
          const lastMatch = matches[matches.length - 1];
          if (lastMatch && lastMatch[1]) {
            const last = lastMatch[1];
            const perc = Math.min(100, Math.max(0, parseFloat(last)));
            jobInfo.progress = perc;
            emitter.emit('progress', { jobId, progress: perc });
            console.log(`Job ${jobId} progress (stderr): ${perc}%`);
          }
        }
      });

      proc.on('close', (code) => {
        try {
          // find resulting file. Accept a variety of common media extensions
          const allowedExts = ['.mp4', '.mp3', '.m4a', '.webm', '.opus', '.aac', '.flv', '.mkv'];
          const files = fs.readdirSync(tempDir).filter(f => 
            f.startsWith(`${platform}_${timestamp}_`) && allowedExts.some(ext => f.endsWith(ext))
          );
          if (files.length > 0) {
            let filepath = path.join(tempDir, files[0]);
            jobInfo.filePath = filepath;
            jobInfo.filename = files[0].replace(`${platform}_${timestamp}_`, '');
            jobInfo.fileSize = (fs.statSync(filepath) || { size: 0 }).size;

            // If the resulting file is not .mp4 but ffmpeg is available, attempt to remux/copy to mp4
            const ext = path.extname(filepath).toLowerCase();
            const ffAvailable = !!ffmpegStaticPath || (() => {
              try {
                const ff = spawnSync('ffmpeg', ['-version'], { windowsHide: true });
                return !(ff.error || ff.status !== 0);
              } catch (e) {
                return false;
              }
            })();
            if (ext !== '.mp4' && ffAvailable) {
              try {
                const remuxPath = filepath.replace(/\.[^.]+$/, '.mp4');
                const ffExec = ffmpegStaticPath || 'ffmpeg';
                console.log(`Attempting remux: ${filepath} -> ${remuxPath} using ${ffExec}`);

                // First try fast stream copy (no re-encoding)
                let res = spawnSync(ffExec, ['-y', '-i', filepath, '-c', 'copy', remuxPath], { windowsHide: true });
                const stdoutStr = res.stdout ? res.stdout.toString() : '';
                const stderrStr = res.stderr ? res.stderr.toString() : '';
                console.log('ffmpeg copy stdout:', stdoutStr);
                console.log('ffmpeg copy stderr:', stderrStr);
                if (res.status === 0) {
                  try { fs.unlinkSync(filepath); } catch (e) { /* ignore */ }
                  filepath = remuxPath;
                  jobInfo.filePath = filepath;
                  jobInfo.filename = path.basename(remuxPath).replace(`${platform}_${timestamp}_`, '');
                  jobInfo.fileSize = (fs.statSync(filepath) || { size: 0 }).size;
                  console.log(`Remux (copy) successful, new file: ${filepath}`);
                } else {
                  console.warn('Remux (copy) failed, trying re-encode', res.status, res.error);
                  // Try re-encoding to H.264/AAC as fallback
                  const remuxPath2 = filepath.replace(/\.[^.]+$/, '.re.mp4');
                  console.log(`Attempting re-encode: ${filepath} -> ${remuxPath2}`);
                  res = spawnSync(ffExec, [
                    '-y', '-i', filepath,
                    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23',
                    '-c:a', 'aac', '-b:a', '192k',
                    remuxPath2
                  ], { windowsHide: true });
                  const stdout2 = res.stdout ? res.stdout.toString() : '';
                  const stderr2 = res.stderr ? res.stderr.toString() : '';
                  console.log('ffmpeg re-encode stdout:', stdout2);
                  console.log('ffmpeg re-encode stderr:', stderr2);
                  if (res.status === 0) {
                    try { fs.unlinkSync(filepath); } catch (e) { /* ignore */ }
                    // rename remuxPath2 to standard remuxPath
                    try { fs.renameSync(remuxPath2, remuxPath); } catch (e) { console.warn('rename failed', e); }
                    filepath = remuxPath;
                    jobInfo.filePath = filepath;
                    jobInfo.filename = path.basename(remuxPath).replace(`${platform}_${timestamp}_`, '');
                    jobInfo.fileSize = (fs.statSync(filepath) || { size: 0 }).size;
                    console.log(`Re-encode successful, new file: ${filepath}`);
                  } else {
                    console.warn('Re-encode failed, keeping original file', res.status, res.error);
                    // cleanup partial file if exists
                    try { if (fs.existsSync(remuxPath2)) fs.unlinkSync(remuxPath2); } catch (e) {}
                  }
                }
              } catch (e: any) {
                console.error('Remux error:', e);
              }
            }
            jobInfo.status = 'completed';
            jobInfo.progress = 100;
            emitter.emit('progress', { jobId, progress: 100 });
            emitter.emit('completed', { jobId, filename: jobInfo.filename });
            console.log(`Job ${jobId} completed: ${jobInfo.filename}`);
            try {
              addDownload({
                platform,
                url,
                title: jobInfo.filename || 'Untitled',
                format,
                file_size: jobInfo.fileSize || 0,
                status: 'completed',
              });
              updateStats(platform, format);
            } catch (e) {
              console.error('Failed to record download in DB', e);
            }
          } else {
            jobInfo.status = 'failed';
            jobInfo.error = `No output file found for ${jobId}`;
            emitter.emit('error', { jobId, error: jobInfo.error });
          }
        } catch (e: any) {
          jobInfo.status = 'failed';
          jobInfo.error = e.message || String(e);
          emitter.emit('error', { jobId, error: jobInfo.error });
        }
        // Do not immediately remove job; keep it for retrieval
      });

      proc.on('error', (err) => {
        jobInfo.status = 'failed';
        jobInfo.error = err.message;
        emitter.emit('error', { jobId, error: jobInfo.error });
      });
    } catch (e: any) {
      const job = jobs.get(jobId);
      if (job) {
        job.info.status = 'failed';
        job.info.error = e.message || String(e);
        job.emitter.emit('error', { jobId, error: job.info.error });
      }
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

export function isFfmpegAvailable(): boolean {
  if (ffmpegStaticPath) return true;
  try {
    const r = spawnSync('ffmpeg', ['-version'], { windowsHide: true });
    return !(r.error || r.status !== 0);
  } catch (e) {
    return false;
  }
}

// Cancel a running job
export function cancelJob(jobId: string): boolean {
  const job = jobs.get(jobId);
  if (!job) return false;
  
  if (job.proc) {
    try {
      job.proc.kill('SIGTERM');
      job.info.status = 'cancelled';
      job.info.error = 'Download cancelled by user';
      job.emitter.emit('cancelled', { jobId });
      console.log(`Job ${jobId} cancelled`);
      return true;
    } catch (e: any) {
      console.error(`Failed to cancel job ${jobId}:`, e.message);
      return false;
    }
  }
  return false;
}

// Main download router
export async function downloadMedia(
  url: string,
  platform: string,
  format: string,
  converterId: string
): Promise<DownloadResult> {
  
  // For YouTube, use yt-dlp directly (more reliable than ytdl-core)
  if (converterId === 'youtube-video' || converterId === 'youtube-audio') {
    console.log(`Using yt-dlp for YouTube: ${converterId}`);
    return await downloadWithYtDlp(url, 'youtube', format);
  }
  
  // Other platforms via yt-dlp
  return await downloadWithYtDlp(url, platform, format);
}
