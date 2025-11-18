import { NextRequest } from 'next/server';
import { getJobInfo } from '@/lib/downloaders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  const { jobId } = params;
  if (!jobId) {
    return new Response(JSON.stringify({ success: false, error: 'Missing jobId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const info = getJobInfo(jobId);
  if (!info) {
    return new Response(JSON.stringify({ success: false, error: 'Job not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ success: true, jobId, logs: info.logs || [], status: info.status || 'unknown' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
