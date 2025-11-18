import { NextRequest } from 'next/server';
import { isFfmpegAvailable } from '@/lib/downloaders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const ok = isFfmpegAvailable();
    return new Response(JSON.stringify({ success: true, ffmpegAvailable: ok }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message || 'Failed to check ffmpeg' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
