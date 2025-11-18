import { NextRequest } from 'next/server';
import { startDownloadJob } from '@/lib/downloaders';
import { spawnSync } from 'child_process';
import { validateUrl } from '@/lib/validators';
// optional static ffmpeg path from ffmpeg-static will be used by backend (if installed)
let ffmpegStaticPath: string | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ffmpegStaticPath = require('ffmpeg-static');
} catch (e) {
  ffmpegStaticPath = null;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { url, platform, format, converterId } = await request.json();
    if (!url || !platform || !format) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const validation = validateUrl(url, platform);
    if (!validation.isValid) {
      return new Response(JSON.stringify({ success: false, error: validation.error || 'Invalid URL' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // If the requested format needs ffmpeg, attempt to detect ffmpeg (static or system) but do not block the request.
    const needsFfmpeg = format?.includes('mp4') || format?.includes('mp3');
    let ffmpegAvailable = !!ffmpegStaticPath;
    if (needsFfmpeg && !ffmpegAvailable) {
      try {
        const ff = spawnSync('ffmpeg', ['-version'], { windowsHide: true });
        ffmpegAvailable = !(ff.error || ff.status !== 0);
      } catch (e) {
        ffmpegAvailable = false;
      }
    }

    const jobId = startDownloadJob(url, platform, format, converterId);
    console.log(`Started job ${jobId} for ${platform} ${url}`);
    return new Response(JSON.stringify({ success: true, jobId, ffmpegAvailable }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Failed to start download job:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Failed to start job' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
