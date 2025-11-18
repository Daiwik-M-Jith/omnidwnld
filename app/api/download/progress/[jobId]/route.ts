import { NextRequest } from 'next/server';
import { getJobEmitter, getJobInfo } from '@/lib/downloaders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  const { jobId } = params;
  if (!jobId) {
    return new Response(JSON.stringify({ success: false, error: 'Missing jobId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Retry logic: wait up to 10 seconds for job to be registered (handles race condition + cold starts)
  let emitter = getJobEmitter(jobId);
  let info = getJobInfo(jobId);
  let retries = 0;
  while ((!emitter || !info) && retries < 100) {
    await new Promise(resolve => setTimeout(resolve, 100));
    emitter = getJobEmitter(jobId);
    info = getJobInfo(jobId);
    retries++;
  }
  
  if (!emitter || !info) {
    console.error(`Job ${jobId} not found after retries`);
    return new Response(JSON.stringify({ success: false, error: 'Job not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  
  console.log(`SSE connected for job ${jobId}`);

  let onProgress: any;
  let onStatus: any;
  let onCompleted: any;
  let onError: any;
  let onCancelled: any;

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (type: string, payload: any) => {
        try {
          controller.enqueue(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`);
        } catch (e) {
          console.error('Failed to enqueue SSE event', e);
        }
      };

      // send initial
      sendEvent('init', { status: info.status, progress: info.progress });

      onProgress = (data: any) => sendEvent('progress', data);
      onStatus = (data: any) => sendEvent('status', data);
      onCompleted = (data: any) => sendEvent('completed', data);
      onError = (data: any) => sendEvent('error', data);
      onCancelled = (data: any) => sendEvent('cancelled', data);

      emitter.on('progress', onProgress);
      emitter.on('status', onStatus);
      emitter.on('completed', onCompleted);
      emitter.on('error', onError);
      emitter.on('cancelled', onCancelled);

      controller.enqueue('retry: 5000\n\n');
    },
    cancel() {
      // Remove listeners when the stream is canceled
      emitter.off('progress', onProgress);
      emitter.off('status', onStatus);
      emitter.off('completed', onCompleted);
      emitter.off('error', onError);
      emitter.off('cancelled', onCancelled);
      console.log(`SSE disconnected for job ${jobId}`);
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
