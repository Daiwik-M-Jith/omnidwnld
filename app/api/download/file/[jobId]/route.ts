import { NextRequest } from 'next/server';
import { getJobInfo, getJobFilePath } from '@/lib/downloaders';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

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

  if (info.status !== 'completed') {
    return new Response(JSON.stringify({ success: false, error: 'Job not completed' }), { status: 202, headers: { 'Content-Type': 'application/json' } });
  }

  const filepath = getJobFilePath(jobId);
  if (!filepath || !fs.existsSync(filepath)) {
    return new Response(JSON.stringify({ success: false, error: 'File not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  let filename = info.filename || path.basename(filepath);
  const contentType = filename.endsWith('.mp4') ? 'video/mp4' : filename.endsWith('.mp3') ? 'audio/mpeg' : 'application/octet-stream';

  const readStream = fs.createReadStream(filepath);
  const nodeStream = Readable.toWeb(readStream) as ReadableStream;

  // Build Content-Disposition with RFC5987 filename* to support UTF-8 names
  // Fallback ascii filename: replace non-ascii with '_'
  const asciiFilename = filename.replace(/[^\x20-\x7E]/g, '_');
  const encoded = encodeURIComponent(filename).replace(/['()]/g, escape).replace(/\*/g, '%2A');
  const contentDisposition = `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encoded}`;

  return new Response(nodeStream, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': contentDisposition,
      'Cache-Control': 'no-cache',
    },
  });
}
