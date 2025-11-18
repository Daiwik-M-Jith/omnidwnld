/*
  OmniDwnld Worker
  - Listens on a BullMQ queue named "downloads"
  - Runs yt-dlp to download media
  - Uses ffmpeg-static to remux/re-encode to .mp4/.mp3 if required
  - Uploads final file to S3 and publishes progress via Redis pub/sub

  Configuration (env vars):
    - REDIS_URL (e.g. redis://localhost:6379)
    - S3_BUCKET
    - AWS_REGION
    - AWS_ACCESS_KEY_ID
    - AWS_SECRET_ACCESS_KEY

  This file is intentionally simple and meant as a scaffold. Harden for production.
*/

const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const { Queue, Worker, QueueScheduler } = require('bullmq');
const IORedis = require('ioredis');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const ytDlp = require('yt-dlp-exec');
const ffmpegStatic = require('ffmpeg-static');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const QUEUE_NAME = process.env.QUEUE_NAME || 'downloads';

const redis = new IORedis(REDIS_URL);
const connection = new IORedis(REDIS_URL);

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  } : undefined,
});

new QueueScheduler(QUEUE_NAME, { connection });
const queue = new Queue(QUEUE_NAME, { connection });

function publishProgress(jobId, payload) {
  const channel = `progress:${jobId}`;
  try {
    redis.publish(channel, JSON.stringify(payload));
  } catch (e) {
    console.error('Failed to publish progress', e);
  }
}

async function uploadToS3(bucket, key, filePath, contentType) {
  const body = fs.createReadStream(filePath);
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType });
  await s3Client.send(cmd);
  // Construct a URL (public bucket required or presigned needed) — return S3 path for now
  return `s3://${bucket}/${key}`;
}

function safeFileName(name) {
  return name.replace(/[<>:"/\\|?*]/g, '_');
}

async function downloadWithYtDlp(url, outDir, format, onProgress) {
  // yt-dlp-exec supports a printing progress line; we'll use stdout parsing
  return new Promise((resolve, reject) => {
    const filenameTemplate = path.join(outDir, '%(title)s.%(ext)s');
    const args = [
      url,
      '--no-warnings',
      '--no-playlist',
      '--newline',
      '-o', filenameTemplate,
      '--format', format || 'bestvideo+bestaudio/best'
    ];

    console.log('Running yt-dlp with args:', args.join(' '));
    const ytdlp = ytDlp.raw(args);

    let finalFile = null;

    ytdlp.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      // Example yt-dlp progress line: [download]  12.3%  1.23MiB at 200.00KiB/s ETA 00:01
      onProgress && onProgress({ raw: text });
      const m = text.match(/\[download\]\s+(\d{1,3}(?:\.\d+)?)%/);
      if (m) {
        const percent = parseFloat(m[1]);
        publishProgress(onProgress.jobId || 'unknown', { type: 'progress', percent, raw: text });
      }
      // Capture output filename when yt-dlp prints '[ffmpeg] Merging formats into "..."' or final file lines
      const outMatch = text.match(/Merging formats into "([^"]+)"/i) || text.match(/Destination: (.+)$/m);
      if (outMatch) {
        finalFile = outMatch[1];
      }
    });

    ytdlp.stderr.on('data', (c) => {
      const t = c.toString();
      onProgress && onProgress({ raw: t });
    });

    ytdlp.on('error', (err) => reject(err));
    ytdlp.on('close', (code) => {
      if (code !== 0) return reject(new Error('yt-dlp exited with code ' + code));
      // Try to find the downloaded file in outDir if not captured
      if (!finalFile) {
        const files = fs.readdirSync(outDir);
        if (files.length === 1) finalFile = path.join(outDir, files[0]);
        else if (files.length > 1) {
          // pick largest file
          let largest = null; let size = 0;
          for (const f of files) {
            const stat = fs.statSync(path.join(outDir, f));
            if (stat.size > size) { size = stat.size; largest = f; }
          }
          finalFile = path.join(outDir, largest);
        }
      }
      resolve(finalFile);
    });
  });
}

function remuxOrEncode(inputPath, outPath) {
  return new Promise((resolve, reject) => {
    // Try fast remux first
    const ff = ffmpegStatic;
    if (!ff) return reject(new Error('ffmpeg not available'));
    const copyArgs = ['-y', '-i', inputPath, '-c', 'copy', outPath];
    console.log('Attempting remux (copy) with ffmpeg:', ff, copyArgs.join(' '));
    const p = spawn(ff, copyArgs);
    let stderr = '';
    p.stderr.on('data', (d) => { stderr += d.toString(); });
    p.on('close', (code) => {
      if (code === 0) return resolve();
      console.warn('Remux copy failed, falling back to re-encode. stderr:', stderr.slice(-2000));
      // Re-encode fallback
      const encodeArgs = ['-y', '-i', inputPath, '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', outPath];
      const p2 = spawn(ff, encodeArgs);
      let stderr2 = '';
      p2.stderr.on('data', (d) => { stderr2 += d.toString(); });
      p2.on('close', (c2) => {
        if (c2 === 0) return resolve();
        reject(new Error('ffmpeg encode failed: ' + stderr2));
      });
    });
  });
}

const worker = new Worker(QUEUE_NAME, async (job) => {
  const { url, format, jobId, s3Bucket, targetExt } = job.data;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omnidwnld-'));
  console.log(`Processing job ${job.id} -> ${jobId} url=${url}`);

  // publish start
  publishProgress(jobId, { type: 'status', status: 'started' });

  try {
    const downloaded = await downloadWithYtDlp(url, tmpDir, format, (d) => {
      // noop local; we publish inside the helper
    });

    if (!downloaded) throw new Error('Download did not produce a file');

    let finalPath = downloaded;
    const ext = path.extname(downloaded).toLowerCase();

    if (targetExt) {
      // ensure target extension is satisfied
      const wanted = '.' + targetExt.replace(/^\./, '');
      if (ext !== wanted) {
        const outFile = path.join(tmpDir, safeFileName(path.basename(downloaded, ext)) + wanted);
        await remuxOrEncode(downloaded, outFile);
        finalPath = outFile;
      }
    }

    // Upload to S3 if configured
    let s3Url = null;
    if (s3Bucket) {
      const key = `${jobId}/${path.basename(finalPath)}`;
      publishProgress(jobId, { type: 'status', status: 'uploading' });
      s3Url = await uploadToS3(s3Bucket, key, finalPath, targetExt === 'mp3' ? 'audio/mpeg' : 'video/mp4');
    }

    publishProgress(jobId, { type: 'completed', file: path.basename(finalPath), s3: s3Url });
    // cleanup
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { }
    return { success: true, file: path.basename(finalPath), s3: s3Url };
  } catch (err) {
    console.error('Job failed', err);
    publishProgress(jobId, { type: 'error', message: err.message });
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { }
    throw err;
  }
}, { connection });

worker.on('completed', (job) => console.log('Worker completed job', job.id));
worker.on('failed', (job, err) => console.error('Worker failed', job ? job.id : '(unknown)', err));

console.log('Worker started, listening for jobs on queue:', QUEUE_NAME);
