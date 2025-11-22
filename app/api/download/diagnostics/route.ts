import { NextResponse } from 'next/server';
import { getFfmpegPath, isFfmpegAvailable } from '@/lib/downloaders';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

function findYtDlp(): { path: string | null; note?: string } {
  const localBinaryWin = path.join(process.cwd(), 'public', 'yt-dlp.exe');
  const localBinary = path.join(process.cwd(), 'public', 'yt-dlp');
  if (fs.existsSync(localBinaryWin)) return { path: localBinaryWin };
  if (fs.existsSync(localBinary)) return { path: localBinary };

  try {
    const r = spawnSync('yt-dlp', ['--version'], { windowsHide: true });
    if (r.status === 0) return { path: 'yt-dlp (in PATH)' };
  } catch (e) {
    // ignore
  }

  return { path: null, note: 'yt-dlp not found in public/ or PATH' };
}

export async function GET() {
  const ff = getFfmpegPath();
  const ffAvail = isFfmpegAvailable();
  const ytdl = findYtDlp();

  return NextResponse.json({
    yt_dlp: ytdl,
    ffmpeg: { path: ff, available: ffAvail },
    cwd: process.cwd(),
    timestamp: new Date().toISOString(),
  });
}
