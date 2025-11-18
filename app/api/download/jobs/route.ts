import { NextRequest } from 'next/server';
import { getJobInfo } from '@/lib/downloaders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // Return a simple list of all job IDs and statuses; this is for debug/testing only
  // Since jobs map is inside lib/downloaders, we need to export a helper in lib/downloaders.
  // This route will call getJobInfo for a set of known job ids via an optional query.
  return new Response(JSON.stringify({ success: true, message: 'Use /api/download/progress/[jobId] to subscribe.' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
